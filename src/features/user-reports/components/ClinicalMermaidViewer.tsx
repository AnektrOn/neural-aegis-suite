import React, { useState, useEffect, useRef, useMemo } from "react";
import { MermaidViewer } from "react-super-mermaid";
import type { MermaidTheme, RsmPattern, MermaidViewerHandle } from "react-super-mermaid";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Palette,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  FileCode,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { filterMermaidByLocale } from "../utils/parseLevelPack";

export interface ClinicalMermaidViewerProps {
  code: string;
  title?: string;
  theme?: MermaidTheme;
  pattern?: RsmPattern;
  height?: number | string;
  className?: string;
  showToolbar?: boolean;
  interactive?: boolean;
  dark?: boolean;
  locale?: "fr" | "en";
}

const THEME_OPTIONS: Array<{ value: MermaidTheme; labelFr: string; labelEn: string; iconColor: string }> = [
  { value: "colorful", labelFr: "Coloré (Défaut)", labelEn: "Colorful (Default)", iconColor: "text-cyan-400" },
  { value: "sketch", labelFr: "Croquis (Excalidraw)", labelEn: "Sketch (Excalidraw)", iconColor: "text-amber-400" },
  { value: "dark", labelFr: "Sombre Clinique", labelEn: "Clinical Dark", iconColor: "text-purple-400" },
  { value: "neutral", labelFr: "Neutre / Minimal", labelEn: "Neutral / Minimal", iconColor: "text-emerald-400" },
  { value: "forest", labelFr: "Forêt Naturelle", labelEn: "Natural Forest", iconColor: "text-lime-400" },
];

const PATTERN_OPTIONS: Array<{ value: RsmPattern; labelFr: string; labelEn: string }> = [
  { value: "dots", labelFr: "Trame de Points", labelEn: "Dot Matrix" },
  { value: "grid", labelFr: "Grille d'Alignement", labelEn: "Alignment Grid" },
  { value: "none", labelFr: "Fond Uni Transparent", labelEn: "Plain Background" },
];

/**
 * Supercharged Mermaid Diagram Viewer for AEGIS Clinical Reports.
 * Powered by `react-super-mermaid` (https://github.com/markku636/react-super-mermaid)
 * with a 100% custom French/English AEGIS Clinical Toolbar (zero Chinese labels):
 * - Mouse-wheel smooth zoom & pan drag
 * - Bilingual node label translation (FR / EN)
 * - In-diagram node text search with match highlights & step navigation
 * - Theme selector (Colorful, Sketch / Excalidraw, Dark, Neutral, Forest)
 * - High-resolution SVG and PNG exports (1x, 2x, 4x HD)
 * - Native fullscreen mode with responsive toolbar preservation
 */
export function ClinicalMermaidViewer({
  code,
  title,
  theme = "colorful",
  pattern = "dots",
  height = 480,
  className,
  showToolbar = true,
  interactive = true,
  dark = true,
  locale = "fr",
}: ClinicalMermaidViewerProps) {
  const isEn = locale === "en";
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<MermaidTheme>(theme);
  const [currentPattern, setCurrentPattern] = useState<RsmPattern>(pattern);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCount, setSearchCount] = useState<{ total: number; current: number }>({ total: 0, current: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<MermaidViewerHandle | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronise le thème et le pattern si les props changent
  useEffect(() => {
    if (theme) setCurrentTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (pattern) setCurrentPattern(pattern);
  }, [pattern]);

  // Surveillance du plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && document.fullscreenElement === containerRef.current));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Découpage et traduction du code Mermaid selon la langue choisie
  const cleanCode = useMemo(() => {
    if (!code) return "";
    const raw = code
      .replace(/^```\s*mermaid\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    return filterMermaidByLocale(raw, locale);
  }, [code, locale]);

  // Contrôles de Recherche
  const handleOpenSearch = () => {
    setSearchOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => searchInputRef.current?.focus(), 80);
      } else {
        handleClearSearch();
      }
      return nextState;
    });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      viewerRef.current?.clearSearch();
      setSearchCount({ total: 0, current: 0 });
      return;
    }
    const res = viewerRef.current?.search(val);
    setSearchCount({
      total: res?.total ?? 0,
      current: res && res.total > 0 ? res.current + 1 : 0,
    });
  };

  const handleSearchNext = () => {
    if (!searchQuery.trim()) return;
    const res = viewerRef.current?.next();
    if (res) {
      setSearchCount({
        total: res.total,
        current: res.total > 0 ? res.current + 1 : 0,
      });
    }
  };

  const handleSearchPrev = () => {
    if (!searchQuery.trim()) return;
    const res = viewerRef.current?.prev();
    if (res) {
      setSearchCount({
        total: res.total,
        current: res.total > 0 ? res.current + 1 : 0,
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchCount({ total: 0, current: 0 });
    viewerRef.current?.clearSearch();
  };

  // Contrôles de Zoom
  const handleZoomIn = () => viewerRef.current?.zoomIn();
  const handleZoomOut = () => viewerRef.current?.zoomOut();
  const handleFit = () => viewerRef.current?.fit();
  const handleReset = () => viewerRef.current?.reset();

  // Basculement Plein Écran
  const handleToggleFullscreen = async () => {
    try {
      if (!containerRef.current) return;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fallback sur le handler interne
      viewerRef.current?.toggleFullscreen();
    }
  };

  // Copie de la source Mermaid traduite
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Téléchargements HD
  const safeFilename = useMemo(() => {
    const base = title ? title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]+/g, "_").toLowerCase() : "aegis_diagram";
    return `${base}_${locale}`;
  }, [title, locale]);

  const handleDownloadSvg = () => {
    try {
      viewerRef.current?.downloadSvg(`${safeFilename}.svg`);
    } catch {
      // ignore
    }
  };

  const handleDownloadPng = async (scale: 1 | 2 | 4 = 2) => {
    try {
      setExporting(true);
      await viewerRef.current?.downloadPng(`${safeFilename}_${scale}x.png`, { scale });
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  if (!cleanCode) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-6 text-xs text-muted-foreground">
        {isEn ? "No Mermaid diagram source specified." : "Aucune source Mermaid spécifiée."}
      </div>
    );
  }

  // SSR safety
  if (!mounted) {
    return (
      <div
        style={{ height }}
        className={cn(
          "flex w-full items-center justify-center rounded-2xl border border-cyan-500/20 bg-black/40 p-6",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-display uppercase tracking-widest animate-pulse">
          <span>{isEn ? "Initializing dynamic topology..." : "Initialisation de la topologie dynamique..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height: isFullscreen ? "100vh" : height }}
      className={cn(
        "relative flex flex-col w-full rounded-2xl border border-cyan-500/25 bg-black/60 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] transition-all",
        isFullscreen && "fixed inset-0 z-[100] rounded-none border-none",
        className,
      )}
    >
      {/* BARRE D'OUTILS CLINIQUE AEGIS (100% bilingue FR/EN, zéro chinois) */}
      {showToolbar && (
        <div className="relative shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-black/60 backdrop-blur-md z-10 select-none">
          {/* Gauche : Recherche intégrée & Titre optionnel */}
          <div className="flex items-center gap-2 min-w-0">
            {searchOpen ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-black/80 px-2.5 py-1 text-xs shadow-inner animate-in fade-in zoom-in-95 duration-150">
                <Search size={13} className="text-cyan-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.shiftKey) handleSearchPrev();
                      else handleSearchNext();
                    } else if (e.key === "Escape") {
                      handleOpenSearch();
                    }
                  }}
                  placeholder={isEn ? "Search node..." : "Rechercher un nœud..."}
                  className="bg-transparent border-none text-foreground placeholder:text-muted-foreground/60 focus:outline-none w-32 sm:w-48 text-xs font-mono"
                />
                {searchCount.total > 0 && (
                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-500/20 px-1.5 py-0.5 rounded">
                    {searchCount.current}/{searchCount.total}
                  </span>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-muted-foreground hover:text-foreground p-0.5"
                    title={isEn ? "Clear search" : "Effacer la recherche"}
                  >
                    <X size={12} />
                  </button>
                )}
                <div className="flex items-center gap-0.5 border-l border-white/10 pl-1">
                  <button
                    type="button"
                    onClick={handleSearchPrev}
                    disabled={searchCount.total === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title={isEn ? "Previous (Shift+Enter)" : "Précédent (Shift+Entrée)"}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchNext}
                    disabled={searchCount.total === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title={isEn ? "Next (Enter)" : "Suivant (Entrée)"}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenSearch}
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30"
                title={isEn ? "Search in diagram" : "Rechercher dans le diagramme"}
              >
                <Search size={13} />
                <span className="hidden sm:inline text-[11px] font-display uppercase tracking-wider">
                  {isEn ? "Search" : "Rechercher"}
                </span>
              </Button>
            )}

            {title && !searchOpen && (
              <span className="text-xs text-foreground/80 font-medium truncate max-w-[160px] sm:max-w-[260px] hidden md:inline">
                {title}
              </span>
            )}
          </div>

          {/* Droite : Outils (Thème, Zoom, Export HD, Plein écran, Copie) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* SÉLECTEUR DE THÈME */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  title={isEn ? "Change visual theme" : "Changer le style graphique"}
                >
                  <Palette size={13} className="text-cyan-400" />
                  <span className="text-[10px] font-display uppercase tracking-wider hidden sm:inline">
                    {THEME_OPTIONS.find((t) => t.value === currentTheme)?.[isEn ? "labelEn" : "labelFr"].split(" ")[0]}
                  </span>
                  <ChevronDown size={11} className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-background/95 border-cyan-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-[10px] font-display uppercase tracking-widest text-cyan-400">
                  {isEn ? "Visual Style" : "Style Graphique"}
                </DropdownMenuLabel>
                {THEME_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setCurrentTheme(opt.value)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className={cn("flex items-center gap-2", opt.iconColor)}>
                      <Sparkles size={12} />
                      {isEn ? opt.labelEn : opt.labelFr}
                    </span>
                    {currentTheme === opt.value && <Check size={13} className="text-cyan-400" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                  {isEn ? "Background Pattern" : "Trame de Fond"}
                </DropdownMenuLabel>
                {PATTERN_OPTIONS.map((p) => (
                  <DropdownMenuItem
                    key={p.value}
                    onClick={() => setCurrentPattern(p.value)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{isEn ? p.labelEn : p.labelFr}</span>
                    {currentPattern === p.value && <Check size={13} className="text-cyan-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CONTRÔLES DE ZOOM & RE-CADRAGE */}
            {interactive && (
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-black/40">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title={isEn ? "Zoom Out" : "Dézoomer"}
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-l border-white/10"
                  title={isEn ? "Zoom In" : "Zoomer"}
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleFit}
                  className="h-7 px-2 flex items-center justify-center text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-l border-white/10 hidden sm:flex"
                  title={isEn ? "Fit to View" : "Ajuster à l'écran"}
                >
                  {isEn ? "Fit" : "Ajuster"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-l border-white/10"
                  title={isEn ? "Reset View" : "Réinitialiser"}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            )}

            {/* EXPORT HAUTE RÉSOLUTION */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={exporting}
                  className="h-7 px-2 text-xs gap-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  title={isEn ? "Export High-Resolution Image" : "Exporter en haute résolution"}
                >
                  <Download size={13} />
                  <span className="text-[10px] font-display uppercase tracking-wider hidden sm:inline">
                    {isEn ? "Export" : "Export"}
                  </span>
                  <ChevronDown size={11} className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 border-cyan-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-[10px] font-display uppercase tracking-widest text-cyan-400">
                  {isEn ? "Download Format" : "Format d'Export"}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDownloadSvg} className="text-xs cursor-pointer gap-2">
                  <FileCode size={13} className="text-cyan-400" />
                  <span>{isEn ? "Vector SVG (Native)" : "SVG Vectoriel (Natif)"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadPng(2)} className="text-xs cursor-pointer gap-2">
                  <Download size={13} className="text-emerald-400" />
                  <span>{isEn ? "PNG (2x Resolution)" : "PNG HD (Résolution 2x)"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadPng(4)} className="text-xs cursor-pointer gap-2">
                  <Download size={13} className="text-amber-400" />
                  <span>{isEn ? "PNG (4x Ultra HD Print)" : "PNG Ultra-HD (4x Poster)"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PLEIN ÉCRAN */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFullscreen}
              className="h-7 w-7 p-0 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
              title={isFullscreen ? (isEn ? "Exit Fullscreen" : "Quitter le plein écran") : (isEn ? "Fullscreen" : "Plein écran")}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </Button>

            {/* COPIER LA SOURCE TRADUITE */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 px-2 text-xs gap-1 border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
              title={isEn ? "Copy localized Mermaid code" : "Copier le code Mermaid traduit"}
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span className="text-[10px] font-display uppercase tracking-wider hidden md:inline">
                {copied ? (isEn ? "Copied!" : "Copié !") : "Code"}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* CANEVAS MERMAID INTERACTIF : toolbar={false} DÉSACTIVE LE TOOLBAR CHINOIS INTERNE */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black/20">
        <MermaidViewer
          ref={viewerRef}
          code={cleanCode}
          theme={currentTheme}
          dark={dark}
          toolbar={false}
          panZoom={interactive}
          touchGestures={interactive}
          search={true}
          exportable={true}
          background={true}
          pattern={currentPattern}
          solidColor="transparent"
          fullscreen={false}
          keyboard={true}
        />
      </div>
    </div>
  );
}