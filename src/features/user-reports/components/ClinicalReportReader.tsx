import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Zap,
  Target,
  BarChart3,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Globe,
  FileDown,
  X,
  Clock,
  Columns,
  ChevronUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { UserReport } from "../types";
import {
  parseBilingualMirrorSections,
  checkHasSafeguard,
  parseMermaidDiagrams,
  filterMermaidByLocale,
  cleanBilingualTitle,
  type ParsedDiagramEntry,
} from "../utils/parseLevelPack";
import { extractBilingualContent } from "../parseReportMd";
import { MermaidDiagram } from "@/components/archetype-balance/MermaidDiagram";
import { ClinicalMermaidViewer } from "./ClinicalMermaidViewer";
import { MarkdownBody } from "./MarkdownBody";
import { openMdPdfPrintWindow } from "@/features/md-pdf/exportMarkdownPdf";

interface ClinicalReportReaderProps {
  report: UserReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabKey = "report" | "summary" | "actions" | "visuals" | "ai_console";
type LangMode = "fr" | "en" | "split";
type PromptLangMode = "fr" | "en" | "all";

export function ClinicalReportReader({
  report,
  open,
  onOpenChange,
}: ClinicalReportReaderProps) {
  const { locale, t } = useLanguage();
  const { toast } = useToast();
  const isGlobalFR = locale === "fr";

  const [activeTab, setActiveTab] = useState<TabKey>("report");
  const [langMode, setLangMode] = useState<LangMode>(isGlobalFR ? "fr" : "en");
  const [aiPromptLang, setAiPromptLang] = useState<PromptLangMode>(isGlobalFR ? "fr" : "en");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState(0);
  const [diagramScale, setDiagramScale] = useState(1);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>("all");
  const [expandedDiagram, setExpandedDiagram] = useState<ParsedDiagramEntry | null>(null);
  const [copiedDiagramId, setCopiedDiagramId] = useState<string | null>(null);

  const articleScrollRef = useRef<HTMLDivElement | null>(null);

  // Synchronise le prompt IA avec la langue générale
  useEffect(() => {
    if (langMode === "en") {
      setAiPromptLang("en");
    } else if (langMode === "fr") {
      setAiPromptLang("fr");
    }
  }, [langMode]);

  // Détection du mode V3.2 vs Legacy
  const isV3 = Boolean(report?.pack_files && report.pack_files.rapport_md);
  const rawRapportMd = isV3 ? report!.pack_files!.rapport_md : report?.content_md || "";
  const resumeMd = report?.pack_files?.resume_md || "";
  const bulletPointsMd = report?.pack_files?.bullet_points_md || "";
  const graphiqueMd = report?.pack_files?.graphique_md || "";
  const promptAiMd = report?.pack_files?.prompt_ai_md || "";

  // Détection des diagrammes (fichier dédié ou extrait du rapport)
  const effectiveDiagramMd = useMemo(() => {
    if (graphiqueMd) return graphiqueMd;
    if (rawRapportMd.includes("```mermaid")) return rawRapportMd;
    return "";
  }, [graphiqueMd, rawRapportMd]);

  // Découpage et extraction bilingue de chaque pilier
  const summaryContent = useMemo(() => extractBilingualContent(resumeMd), [resumeMd]);
  const actionsContent = useMemo(() => extractBilingualContent(bulletPointsMd), [bulletPointsMd]);
  const aiPromptContent = useMemo(() => extractBilingualContent(promptAiMd), [promptAiMd]);
  const allParsedDiagrams = useMemo(() => parseMermaidDiagrams(effectiveDiagramMd), [effectiveDiagramMd]);

  // Filtrage intelligent des diagrammes selon la langue active
  const parsedDiagrams = useMemo(() => {
    if (allParsedDiagrams.length === 0) return [];
    if (langMode === "fr") {
      const frDiagrams = allParsedDiagrams.filter((d) => d.lang === "fr" || d.lang === "neutral");
      return frDiagrams.length > 0 ? frDiagrams : allParsedDiagrams;
    }
    if (langMode === "en") {
      const enDiagrams = allParsedDiagrams.filter((d) => d.lang === "en" || d.lang === "neutral");
      return enDiagrams.length > 0 ? enDiagrams : allParsedDiagrams;
    }
    // Mode split : conserve tous les diagrammes pour comparaison miroir
    return allParsedDiagrams;
  }, [allParsedDiagrams, langMode]);

  // Analyse et découpage miroir des sections pour 00_RAPPORT.md
  const { sectionPairs, safeguardSection, cleanFr, cleanEn } = useMemo(() => {
    if (!rawRapportMd) {
      return { sectionPairs: [], safeguardSection: null, cleanFr: "", cleanEn: "" };
    }
    return parseBilingualMirrorSections(rawRapportMd);
  }, [rawRapportMd]);

  const hasSafeguard = Boolean(report?.has_safeguard || safeguardSection || checkHasSafeguard(rawRapportMd));

  // Texte actif du Prompt IA selon la langue choisie
  const activePromptText = useMemo(() => {
    if (aiPromptLang === "fr") return aiPromptContent.fr || promptAiMd;
    if (aiPromptLang === "en") return aiPromptContent.hasEn ? aiPromptContent.en : promptAiMd;
    return promptAiMd;
  }, [aiPromptLang, aiPromptContent, promptAiMd]);

  const activePromptTokens = useMemo(() => {
    return Math.round((activePromptText.length || 0) / 3.8);
  }, [activePromptText]);

  // Métadonnées et compteurs
  const levelLabel = report?.level_code || (report?.tier ? `LEVEL_${report.tier}` : "LEVEL_1");
  const scopeLabel = report?.scope === "trans" ? "TRANS-PRISME" : "INTRA-PRISME";
  const prismLabel = report?.prism_code || report?.orientation || "MYSS";

  const wordCount = useMemo(() => {
    return (rawRapportMd || "").trim().split(/\s+/).filter(Boolean).length;
  }, [rawRapportMd]);

  const estimatedReadingTime = Math.max(3, Math.ceil(wordCount / 220));

  // Suivi de la progression de lecture au défilement
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const progress = Math.min(100, Math.max(0, Math.round((el.scrollTop / totalHeight) * 100)));
      setReadingProgress(progress);
    }

    // Détection de la section active
    const sectionElements = sectionPairs.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const containerTop = el.getBoundingClientRect().top;
    for (const sec of sectionElements) {
      const rect = sec.getBoundingClientRect();
      if (rect.top - containerTop <= 150 && rect.bottom - containerTop > 50) {
        setActiveSectionId(sec.id);
        break;
      }
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopyPrompt = async () => {
    if (!activePromptText) return;
    try {
      await navigator.clipboard.writeText(activePromptText);
      setCopiedPrompt(true);
      const langName = aiPromptLang === "fr" ? "Français" : aiPromptLang === "en" ? "English" : "Complet";
      toast({
        title: isGlobalFR ? `Méta-Prompt (${langName}) copié !` : `Meta-Prompt (${langName}) copied!`,
        description: isGlobalFR
          ? "Colle ce prompt dans ton assistant Claude ou ChatGPT pour dialoguer avec ton diagnostic."
          : "Paste this prompt into Claude or ChatGPT to interrogate your diagnostic.",
      });
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      toast({
        title: isGlobalFR ? "Erreur de copie" : "Copy error",
        description: isGlobalFR ? "Impossible d'accéder au presse-papier." : "Clipboard access failed.",
        variant: "destructive",
      });
    }
  };

  const handleCopyDiagramSource = async (diag: ParsedDiagramEntry) => {
    try {
      const activeLocale = langMode === "en" ? "en" : "fr";
      const localizedCode = filterMermaidByLocale(diag.mermaidSource, activeLocale);
      await navigator.clipboard.writeText(localizedCode);
      setCopiedDiagramId(diag.id);
      toast({
        title: isGlobalFR ? "Code Mermaid copié !" : "Mermaid code copied!",
        description: isGlobalFR
          ? `Code source du diagramme #${diag.index} (${activeLocale.toUpperCase()}) copié dans le presse-papier.`
          : `Source code for diagram #${diag.index} (${activeLocale.toUpperCase()}) copied to clipboard.`,
      });
      setTimeout(() => setCopiedDiagramId(null), 3000);
    } catch {
      toast({
        title: isGlobalFR ? "Erreur de copie" : "Copy error",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    const content = langMode === "fr" ? cleanFr : langMode === "en" ? cleanEn : rawRapportMd;
    openMdPdfPrintWindow({
      sources: [
        {
          filename: report.title || "rapport",
          markdown: content,
          titleOverride: report.title,
          subtitleOverride: `${levelLabel} · ${prismLabel} · AEGIS V3.2`,
        },
      ],
      theme: "ivoire",
      showCover: true,
      locale: langMode === "en" ? "en" : "fr",
      contentLang: langMode === "en" ? "en" : "fr",
    });
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 border-white/10 bg-transparent shadow-2xl transition-all duration-300",
          isFullscreen
            ? "w-screen h-screen max-w-none max-h-none rounded-none m-0"
            : "max-w-6xl w-[95vw] h-[92vh] max-h-[94vh] rounded-2xl overflow-hidden flex flex-col",
        )}
      >
        <DialogTitle className="sr-only">{report.title || "Rapport Clinique"}</DialogTitle>
        <DialogDescription className="sr-only">
          {levelLabel} · {prismLabel} · AEGIS V3.2
        </DialogDescription>

        {/* Glow atmosphérique arrière-plan */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-75"
          style={{
            background:
              "radial-gradient(130% 70% at 50% -15%, hsl(var(--primary) / 0.16), transparent 60%), radial-gradient(100% 60% at 50% 115%, hsl(var(--aegis-warm) / 0.12), transparent 65%)",
          }}
        />

        <div className="relative flex flex-col h-full rounded-2xl border border-white/10 bg-[hsl(var(--background))]/92 backdrop-blur-3xl overflow-hidden">
          {/* HEADER STATUTAIRE CLINIQUE */}
          <header className="relative border-b border-white/10 px-6 py-4 bg-black/25 shrink-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Côté Gauche : Badges & Titre */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary font-display text-[10px] tracking-widest uppercase px-2 py-0.5"
                  >
                    {levelLabel} · {scopeLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/15 bg-white/5 text-foreground/80 font-display text-[10px] tracking-widest uppercase px-2 py-0.5"
                  >
                    PRISME {prismLabel}
                  </Badge>
                  {hasSafeguard ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-display text-[10px] tracking-widest uppercase flex items-center gap-1 px-2.5 py-0.5 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
                    >
                      <ShieldCheck size={12} className="text-amber-400" />
                      {isGlobalFR ? "Safeguard Validé" : "Safeguard Certified"}
                    </Badge>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-2">
                    <Clock size={12} />
                    ~{estimatedReadingTime} min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {report.glyph ? (
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                    >
                      {report.glyph}
                    </span>
                  ) : null}
                  <h1 className="font-cormorant-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground truncate">
                    {report.title}
                  </h1>
                </div>
              </div>

              {/* Côté Droit : Sélecteur de Langue & Contrôles */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Switch Bilingue Instantané */}
                <div className="flex items-center rounded-xl border border-white/15 bg-black/40 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLangMode("fr")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider transition-all",
                      langMode === "fr"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    🇫🇷 FR
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangMode("en")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider transition-all",
                      langMode === "en"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    🇬🇧 EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangMode("split")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all",
                      langMode === "split"
                        ? "bg-[hsl(var(--aegis-warm))] text-black font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title={isGlobalFR ? "Affichage Miroir Côte à Côte" : "Side-by-Side Split View"}
                  >
                    <Columns size={12} />
                    Split
                  </button>
                </div>

                {/* Export PDF */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-xs gap-1.5 h-8 px-2.5"
                  title={isGlobalFR ? "Exporter en PDF" : "Export to PDF"}
                >
                  <FileDown size={14} />
                  <span className="hidden sm:inline">PDF</span>
                </Button>

                {/* Bouton Plein Écran */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  aria-label={isFullscreen ? "Réduire" : "Plein écran"}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </Button>

                {/* Fermeture */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* BARRE D'ONGLETS 5 PILIERS */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabKey)}
                className="w-full"
              >
                <TabsList className="bg-black/30 border border-white/10 p-1 h-auto flex flex-wrap gap-1">
                  <TabsTrigger
                    value="report"
                    className="data-[state=active]:bg-white/10 text-xs font-display tracking-wider uppercase gap-1.5 py-1.5 px-3"
                  >
                    <BookOpen size={14} className="text-primary" />
                    <span>00. {isGlobalFR ? "Rapport Intégral" : "Full Report"}</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="summary"
                    disabled={!resumeMd && !isV3}
                    className="data-[state=active]:bg-white/10 text-xs font-display tracking-wider uppercase gap-1.5 py-1.5 px-3 disabled:opacity-40"
                  >
                    <Zap size={14} className="text-amber-400" />
                    <span>01. {isGlobalFR ? "Synthèse Exécutive" : "Summary"}</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="actions"
                    disabled={!bulletPointsMd && !isV3}
                    className="data-[state=active]:bg-white/10 text-xs font-display tracking-wider uppercase gap-1.5 py-1.5 px-3 disabled:opacity-40"
                  >
                    <Target size={14} className="text-emerald-400" />
                    <span>02. {isGlobalFR ? "Axiomes & Leviers" : "Actionable Insights"}</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="visuals"
                    disabled={!effectiveDiagramMd}
                    className="data-[state=active]:bg-white/10 text-xs font-display tracking-wider uppercase gap-1.5 py-1.5 px-3 disabled:opacity-40"
                  >
                    <BarChart3 size={14} className="text-cyan-400" />
                    <span>03. {isGlobalFR ? "Modélisation Visuelle" : "Visual Diagrams"}</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="ai_console"
                    disabled={!promptAiMd && !isV3}
                    className="data-[state=active]:bg-white/10 text-xs font-display tracking-wider uppercase gap-1.5 py-1.5 px-3 disabled:opacity-40"
                  >
                    <Bot size={14} className="text-purple-400" />
                    <span>04. {isGlobalFR ? "Console Prompt IA" : "AI Companion"}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>

          {/* CONTENU PRINCIPAL DES 5 PILIERS */}
          <div
            ref={articleScrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 relative"
          >
            {/* 00. RAPPORT INTÉGRAL */}
            {activeTab === "report" && (
              <div className="mx-auto max-w-7xl">
                <div
                  className={cn(
                    "grid gap-8 items-start",
                    sectionPairs.length > 1 && langMode !== "split"
                      ? "lg:grid-cols-[16rem_1fr]"
                      : "grid-cols-1",
                  )}
                >
                  {/* Table des Matières Latérale Sticky (TOC) */}
                  {sectionPairs.length > 1 && langMode !== "split" && (
                    <aside className="hidden lg:block sticky top-2 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
                      <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {isGlobalFR ? "Sommaire Clinique" : "Clinical Index"}
                        </span>
                        <span className="font-display text-[10px] text-primary/80">
                          {readingProgress}%
                        </span>
                      </div>

                      {/* Indicateur linéaire de progression */}
                      <div className="h-0.5 w-full bg-white/5 mb-4 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-150"
                          style={{ width: `${readingProgress}%` }}
                        />
                      </div>

                      <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                        {sectionPairs.map((pair, idx) => {
                          const title = langMode === "en" ? pair.title_en : pair.title_fr;
                          const isActive = activeSectionId === pair.id;
                          return (
                            <button
                              key={pair.id}
                              type="button"
                              onClick={() => scrollToSection(pair.id)}
                              className={cn(
                                "w-full text-left flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors leading-relaxed",
                                isActive
                                  ? "bg-white/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-display text-[9px]",
                                  pair.is_safeguard
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "border border-white/10 text-muted-foreground",
                                )}
                              >
                                {pair.is_safeguard ? "🛡️" : idx + 1}
                              </span>
                              <span className="truncate">{title}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </aside>
                  )}

                  {/* Zone de Lecture Centrale */}
                  <main className="min-w-0">
                    {/* Cartouche Déontologique Fixe : 0. Safeguard Épistémique */}
                    {safeguardSection ? (
                      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-amber-950/15 to-transparent p-5 sm:p-6 mb-8 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]">
                        <div className="flex items-start gap-3.5">
                          <span
                            aria-hidden
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-xl text-amber-300"
                          >
                            🛡️
                          </span>
                          <div className="space-y-1 flex-1">
                            <span className="font-display text-[10px] tracking-[0.25em] uppercase text-amber-400/90 font-medium">
                              {isGlobalFR
                                ? "Cadre Déontologique & Safeguard Épistémique"
                                : "Ethical Framework & Epistemic Safeguard"}
                            </span>
                            <h2 className="font-cormorant-display text-xl sm:text-2xl text-amber-100 font-normal">
                              {langMode === "en" ? safeguardSection.title_en : safeguardSection.title_fr}
                            </h2>
                            <MarkdownBody size="sm" className="mt-3 text-amber-200/90">
                              {langMode === "en" ? safeguardSection.content_en : safeguardSection.content_fr}
                            </MarkdownBody>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Rendu Bilingue : SPLIT VIEW (Côte à côte) */}
                    {langMode === "split" ? (
                      <div className="space-y-10">
                        {sectionPairs
                          .filter((p) => !p.is_safeguard)
                          .map((pair, idx) => (
                            <section
                              key={pair.id}
                              id={pair.id}
                              className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-7 space-y-4"
                            >
                              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                                <span className="font-display text-[11px] uppercase tracking-widest text-primary">
                                  Section {idx + 1}
                                </span>
                                <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                                  Miroir FR / EN
                                </span>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6 pt-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                {/* Colonne FR */}
                                <div className="space-y-3 pr-0 md:pr-4">
                                  <h3 className="font-cormorant-display text-2xl text-foreground flex items-center gap-2">
                                    <span className="text-base">🇫🇷</span>
                                    {pair.title_fr}
                                  </h3>
                                  <MarkdownBody size="sm">
                                    {pair.content_fr}
                                  </MarkdownBody>
                                </div>

                                {/* Colonne EN */}
                                <div className="space-y-3 pt-4 md:pt-0 pl-0 md:pl-6">
                                  <h3 className="font-cormorant-display text-2xl text-foreground flex items-center gap-2">
                                    <span className="text-base">🇬🇧</span>
                                    {pair.title_en}
                                  </h3>
                                  <MarkdownBody size="sm">
                                    {pair.content_en}
                                  </MarkdownBody>
                                </div>
                              </div>
                            </section>
                          ))}
                      </div>
                    ) : (
                      /* Rendu Monocanal (FR Pur ou EN Pur) */
                      <article className="mx-auto max-w-3xl space-y-10">
                        {sectionPairs
                          .filter((p) => !p.is_safeguard)
                          .map((pair, idx) => {
                            const title = langMode === "en" ? pair.title_en : pair.title_fr;
                            const content = langMode === "en" ? pair.content_en : pair.content_fr;

                            return (
                              <section key={pair.id} id={pair.id} className="scroll-mt-6">
                                <header className="border-b border-white/10 pb-3 mb-5">
                                  <span className="font-display text-[11px] uppercase tracking-[0.25em] text-primary/80">
                                    Partie {idx + 1}
                                  </span>
                                  <h2 className="mt-1 font-cormorant-display text-3xl sm:text-4xl leading-tight font-normal text-foreground">
                                    {title}
                                  </h2>
                                </header>

                                <MarkdownBody size="base">
                                  {content}
                                </MarkdownBody>
                              </section>
                            );
                          })}
                      </article>
                    )}
                  </main>
                </div>
              </div>
            )}

            {/* 01. SYNTHÈSE EXÉCUTIVE */}
            {activeTab === "summary" && (
              <div className="mx-auto max-w-4xl space-y-6">
                <header className="border-b border-white/10 pb-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-display text-xs uppercase tracking-widest mb-1">
                      <Zap size={14} />
                      {isGlobalFR ? "Synthèse Haute Résolution" : "Executive High-Res Summary"}
                    </div>
                    <h2 className="font-cormorant-display text-3xl text-foreground font-normal">
                      {report.title} — {isGlobalFR ? "Vue Stratégique" : "Strategic Overview"}
                    </h2>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 font-display text-[10px] tracking-widest uppercase">
                    {langMode === "fr" ? "🇫🇷 VERSION FR" : langMode === "en" ? "🇬🇧 VERSION EN" : "⧉ SPLIT FR / EN"}
                  </Badge>
                </header>

                {langMode === "split" && summaryContent.hasBilingual ? (
                  <div className="grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-7 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-display uppercase tracking-wider text-primary">
                        <span>🇫🇷</span>
                        <span>Synthèse Exécutive</span>
                      </div>
                      <MarkdownBody size="sm">{summaryContent.fr}</MarkdownBody>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-7 space-y-4 pt-4 md:pt-6 pl-0 md:pl-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-display uppercase tracking-wider text-primary">
                        <span>🇬🇧</span>
                        <span>Executive Summary</span>
                      </div>
                      <MarkdownBody size="sm">{summaryContent.en}</MarkdownBody>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-8 space-y-4">
                    {langMode === "en" && !summaryContent.hasEn && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-center gap-2 mb-4">
                        <span>🇬🇧</span>
                        <span>{isGlobalFR ? "Version anglaise non incluse dans cette synthèse (version française affichée)." : "English version not included in this summary (displaying original French version)."}</span>
                      </div>
                    )}
                    <MarkdownBody size="base">
                      {langMode === "en"
                        ? (summaryContent.hasEn ? summaryContent.en : summaryContent.fr || resumeMd)
                        : (summaryContent.fr || resumeMd || (isGlobalFR ? "Synthèse en cours de génération..." : "Summary being processed..."))}
                    </MarkdownBody>
                  </div>
                )}
              </div>
            )}

            {/* 02. AXIOMES & LEVIERS */}
            {activeTab === "actions" && (
              <div className="mx-auto max-w-4xl space-y-6">
                <header className="border-b border-white/10 pb-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-display text-xs uppercase tracking-widest mb-1">
                      <Target size={14} />
                      {isGlobalFR ? "Axiomes Cliniques & Leviers d'Action" : "Diagnostic Axioms & Action Levers"}
                    </div>
                    <h2 className="font-cormorant-display text-3xl text-foreground font-normal">
                      {isGlobalFR ? "Applications & Recommandations Immédiates" : "Immediate Applications & Practices"}
                    </h2>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-display text-[10px] tracking-widest uppercase">
                    {langMode === "fr" ? "🇫🇷 VERSION FR" : langMode === "en" ? "🇬🇧 VERSION EN" : "⧉ SPLIT FR / EN"}
                  </Badge>
                </header>

                {langMode === "split" && actionsContent.hasBilingual ? (
                  <div className="grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-7 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-display uppercase tracking-wider text-emerald-400">
                        <span>🇫🇷</span>
                        <span>Axiomes & Leviers</span>
                      </div>
                      <MarkdownBody size="sm">{actionsContent.fr}</MarkdownBody>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-7 space-y-4 pt-4 md:pt-6 pl-0 md:pl-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-display uppercase tracking-wider text-emerald-400">
                        <span>🇬🇧</span>
                        <span>Axioms & Action Points</span>
                      </div>
                      <MarkdownBody size="sm">{actionsContent.en}</MarkdownBody>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 sm:p-8 space-y-4">
                    {langMode === "en" && !actionsContent.hasEn && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-center gap-2 mb-4">
                        <span>🇬🇧</span>
                        <span>{isGlobalFR ? "Version anglaise non disponible pour ces axiomes (version française affichée)." : "English version not available for these axioms (displaying original French below)."}</span>
                      </div>
                    )}
                    <MarkdownBody size="base">
                      {langMode === "en"
                        ? (actionsContent.hasEn ? actionsContent.en : actionsContent.fr || bulletPointsMd)
                        : (actionsContent.fr || bulletPointsMd || (isGlobalFR ? "Aucun axiome renseigné." : "No action points specified."))}
                    </MarkdownBody>
                  </div>
                )}
              </div>
            )}

            {/* 03. MODÉLISATION VISUELLE (MERMAID) */}
            {activeTab === "visuals" && (
              <div className="mx-auto max-w-5xl space-y-6">
                <header className="border-b border-white/10 pb-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 font-display text-xs uppercase tracking-widest mb-1">
                      <BarChart3 size={14} />
                      {isGlobalFR ? "Cartographie Dynamique" : "Visual Dynamic Modelling"}
                    </div>
                    <h2 className="font-cormorant-display text-3xl text-foreground font-normal">
                      {isGlobalFR ? "Diagrammes & Topologie des Champs" : "Diagrams & Field Topology"}
                    </h2>
                  </div>

                  {/* Contrôles de Zoom */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/40 p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDiagramScale((s) => Math.min(2, s + 0.15))}
                      className="h-7 w-7 p-0"
                      title="Zoom Avant"
                    >
                      <ZoomIn size={14} />
                    </Button>
                    <span className="text-[10px] font-display w-10 text-center text-muted-foreground">
                      {Math.round(diagramScale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDiagramScale((s) => Math.max(0.6, s - 0.15))}
                      className="h-7 w-7 p-0"
                      title="Zoom Arrière"
                    >
                      <ZoomOut size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDiagramScale(1)}
                      className="h-7 w-7 p-0"
                      title="Réinitialiser"
                    >
                      <RotateCcw size={14} />
                    </Button>
                  </div>
                </header>

                {/* Quick-Nav Pills si plusieurs diagrammes */}
                {parsedDiagrams.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedDiagramId("all")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-display text-xs uppercase tracking-wider transition-all whitespace-nowrap",
                        selectedDiagramId === "all"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                          : "bg-black/30 border border-white/10 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isGlobalFR ? "Tous les diagrammes" : "All diagrams"} ({parsedDiagrams.length})
                    </button>
                    {parsedDiagrams.map((d) => {
                      const pillTitle = cleanBilingualTitle(d.title, isGlobalFR ? "fr" : "en");
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDiagramId(d.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-display text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                            selectedDiagramId === d.id
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                              : "bg-black/30 border border-white/10 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="text-[10px] opacity-70">#{d.index}</span>
                          <span className="truncate max-w-[180px]">{pillTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Liste des Cartes de Diagrammes */}
                {parsedDiagrams.length > 0 ? (
                  <div className="space-y-8">
                    {parsedDiagrams
                      .filter((d) => selectedDiagramId === "all" || selectedDiagramId === d.id)
                      .map((d) => {
                        const activeTitle = cleanBilingualTitle(d.title, langMode === "en" ? "en" : "fr");
                        const companion = langMode === "en" ? (d.companionTextEn || d.companionTextFr) : (d.companionTextFr || d.companionTextEn);

                        if (langMode === "split") {
                          const companionFr = d.companionTextFr || d.companionTextEn;
                          const companionEn = d.companionTextEn || d.companionTextFr;
                          const titleFr = cleanBilingualTitle(d.title, "fr");
                          const titleEn = cleanBilingualTitle(d.title, "en");

                          return (
                            <div
                              key={d.id}
                              className="rounded-2xl border border-cyan-500/25 bg-black/40 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] transition-all"
                            >
                              {/* En-tête statutaire */}
                              <div className="border-b border-white/10 px-5 py-3.5 bg-black/40 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 font-display text-[10px] font-bold text-cyan-300">
                                    #{d.index}
                                  </span>
                                  <h3 className="font-cormorant-display text-xl text-foreground font-normal">
                                    {titleFr} <span className="text-muted-foreground text-sm font-sans mx-2">/</span> {titleEn}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-display text-[9px] tracking-widest uppercase hidden sm:inline-flex"
                                  >
                                    {d.typeLabel}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDiagramSource(d)}
                                    className="h-7 px-2 text-xs gap-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                    title="Copier le code Mermaid"
                                  >
                                    {copiedDiagramId === d.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    <span className="text-[10px] font-display uppercase tracking-wider hidden sm:inline">
                                      {copiedDiagramId === d.id ? (isGlobalFR ? "Copié !" : "Copied!") : "Mermaid"}
                                    </span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedDiagram(d)}
                                    className="h-7 w-7 p-0 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                    title="Agrandir / Plein écran"
                                  >
                                    <Maximize2 size={13} />
                                  </Button>
                                </div>
                              </div>

                              {/* Grille Miroir Split Côte-à-Côte */}
                              <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/10">
                                {/* Colonne FR */}
                                <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-black/20">
                                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-display uppercase tracking-wider">
                                    <span>🇫🇷</span>
                                    <span>Version Française</span>
                                  </div>
                                  <ClinicalMermaidViewer
                                    code={d.mermaidSource}
                                    title={`${titleFr} (FR)`}
                                    height={460}
                                    locale="fr"
                                    className="border border-white/5 shadow-inner"
                                  />
                                  {companionFr ? (
                                    <div className="border-t border-white/10 pt-3">
                                      <div className="text-[10px] font-display uppercase tracking-widest text-cyan-400/80 mb-1">
                                        Lecture Clinique (FR)
                                      </div>
                                      <MarkdownBody size="sm">{companionFr}</MarkdownBody>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Colonne EN */}
                                <div className="p-4 sm:p-5 flex flex-col space-y-3 bg-black/20">
                                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-display uppercase tracking-wider">
                                    <span>🇬🇧</span>
                                    <span>English Version</span>
                                  </div>
                                  <ClinicalMermaidViewer
                                    code={d.mermaidSource}
                                    title={`${titleEn} (EN)`}
                                    height={460}
                                    locale="en"
                                    className="border border-white/5 shadow-inner"
                                  />
                                  {companionEn ? (
                                    <div className="border-t border-white/10 pt-3">
                                      <div className="text-[10px] font-display uppercase tracking-widest text-cyan-400/80 mb-1">
                                        Clinical Reading (EN)
                                      </div>
                                      <MarkdownBody size="sm">{companionEn}</MarkdownBody>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Mode Unilingue (FR ou EN)
                        return (
                          <div
                            key={d.id}
                            className="rounded-2xl border border-cyan-500/25 bg-black/40 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] transition-all"
                          >
                            {/* En-tête de carte du diagramme */}
                            <div className="border-b border-white/10 px-5 py-3.5 bg-black/40 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 font-display text-[10px] font-bold text-cyan-300">
                                  #{d.index}
                                </span>
                                <h3 className="font-cormorant-display text-xl text-foreground font-normal">
                                  {activeTitle}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-display text-[9px] tracking-widest uppercase hidden sm:inline-flex"
                                >
                                  {d.typeLabel}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyDiagramSource(d)}
                                  className="h-7 px-2 text-xs gap-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                  title="Copier le code Mermaid"
                                >
                                  {copiedDiagramId === d.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                  <span className="text-[10px] font-display uppercase tracking-wider hidden sm:inline">
                                    {copiedDiagramId === d.id ? (isGlobalFR ? "Copié !" : "Copied!") : "Mermaid"}
                                  </span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedDiagram(d)}
                                  className="h-7 w-7 p-0 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                  title="Agrandir / Plein écran"
                                >
                                  <Maximize2 size={13} />
                                </Button>
                              </div>
                            </div>

                            {/* Corps du diagramme interactif (react-super-mermaid + toolbar AEGIS) */}
                            <div className="p-3 sm:p-5 bg-black/20">
                              <ClinicalMermaidViewer
                                code={d.mermaidSource}
                                title={activeTitle}
                                height={480}
                                locale={langMode === "en" ? "en" : "fr"}
                                className="border border-white/5 shadow-inner"
                              />
                            </div>

                            {/* Légende et Notes Cliniques */}
                            {companion ? (
                              <div className="border-t border-white/10 px-5 py-4 bg-white/[0.02]">
                                <div className="text-[10px] font-display uppercase tracking-widest text-cyan-400/80 mb-1.5">
                                  {isGlobalFR ? "Lecture Clinique & Topologie" : "Clinical Reading & Topology"}
                                </div>
                                <MarkdownBody size="sm">{companion}</MarkdownBody>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-muted-foreground text-sm">
                    {isGlobalFR ? "Aucun diagramme spécifique dans ce niveau." : "No visual diagram available for this level."}
                  </div>
                )}

                {/* MODAL D'AGRANDISSEMENT DU DIAGRAMME */}
                <Dialog open={expandedDiagram !== null} onOpenChange={(o) => { if (!o) setExpandedDiagram(null); }}>
                  <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-background/95 border-cyan-500/30 p-6 flex flex-col">
                    <DialogTitle className="font-cormorant-display text-2xl flex items-center justify-between">
                      <span>{cleanBilingualTitle(expandedDiagram?.title || "", langMode === "en" ? "en" : "fr")}</span>
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 font-display text-[10px] tracking-widest uppercase">
                        {expandedDiagram?.typeLabel}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Vue agrandie haute résolution du diagramme #{expandedDiagram?.index}
                    </DialogDescription>
                    <div className="flex-1 overflow-hidden p-2 bg-black/40 rounded-xl border border-white/10 my-4">
                      {expandedDiagram ? (
                        <ClinicalMermaidViewer
                          code={expandedDiagram.mermaidSource}
                          title={cleanBilingualTitle(expandedDiagram.title, langMode === "en" ? "en" : "fr")}
                          height="100%"
                          locale={langMode === "en" ? "en" : "fr"}
                          className="h-full border-none shadow-none"
                        />
                      ) : null}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* 04. CONSOLE PROMPT IA COMPAGNON */}
            {activeTab === "ai_console" && (
              <div className="mx-auto max-w-4xl space-y-6">
                <header className="border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-purple-400 font-display text-xs uppercase tracking-widest mb-1">
                    <Bot size={14} />
                    {isGlobalFR ? "Console Méta-Prompt Auto-Portant" : "Self-Contained Meta-Prompt Console"}
                  </div>
                  <h2 className="font-cormorant-display text-3xl text-foreground font-normal">
                    {isGlobalFR ? "Dialogue avec ton Diagnostic dans ton IA" : "Interrogate your Report in your Personal AI"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isGlobalFR
                      ? `Ce prompt encapsule ton diagnostic complet, ton niveau ${levelLabel} et tes garde-fous épistémiques (~${activePromptTokens.toLocaleString("fr-FR")} tokens).`
                      : `This prompt embeds your full diagnostic, your ${levelLabel} level and safeguards (~${activePromptTokens.toLocaleString("en-US")} tokens).`}
                  </p>
                </header>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Sélecteur de Langue du Prompt */}
                  <div className="flex items-center rounded-xl border border-white/15 bg-black/40 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setAiPromptLang("fr")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider transition-all",
                        aiPromptLang === "fr"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      🇫🇷 Prompt FR
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPromptLang("en")}
                      disabled={!aiPromptContent.hasEn}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider transition-all disabled:opacity-40",
                        aiPromptLang === "en"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title={!aiPromptContent.hasEn ? "Version anglaise non disponible pour ce prompt" : "Prompt en anglais"}
                    >
                      🇬🇧 Prompt EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPromptLang("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-display text-[11px] uppercase tracking-wider transition-all",
                        aiPromptLang === "all"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      📄 Intégral
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleCopyPrompt}
                      className="bg-purple-600 hover:bg-purple-500 text-white gap-2 font-display uppercase tracking-wider text-xs px-4 py-2 h-9 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]"
                    >
                      {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                      {copiedPrompt
                        ? isGlobalFR ? "Copié !" : "Copied!"
                        : isGlobalFR
                          ? `Copier le Méta-Prompt (${aiPromptLang.toUpperCase()})`
                          : `Copy Meta-Prompt (${aiPromptLang.toUpperCase()})`}
                    </Button>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://claude.ai/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-foreground font-medium transition-colors"
                    >
                      <ExternalLink size={12} />
                      Ouvrir Claude.ai
                    </a>
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-foreground font-medium transition-colors"
                    >
                      <ExternalLink size={12} />
                      Ouvrir ChatGPT
                    </a>
                  </div>
                </div>
              </div>

                {/* Console Code Box */}
                <div className="rounded-2xl border border-purple-500/30 bg-black/60 p-5 font-mono text-xs text-purple-200/90 max-h-[50vh] overflow-y-auto space-y-2 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {activePromptText || (isGlobalFR ? "Prompt IA non généré pour ce rapport." : "AI Prompt not generated for this report.")}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
