import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, User, Shield, FileDown, ChevronLeft,
  Search, Loader2, Sparkles, Cloud, Scale, ImageDown, TreePine,
} from "lucide-react";
import { TaoPortraitPanel } from "@/features/tao-portrait/components/TaoPortraitPanel";
import { useTaoPortrait } from "@/features/tao-portrait/hooks/useTaoPortrait";
import { exportDeepDiveV2ToDrive } from "../services/exportDeepDiveToDrive";
import { buildUserReport, buildAdminReport } from "../domain/sampleProfile";
import { exportDeepDiveVisualPdf, exportDeepDivePng } from "../services/exportDeepDiveScreenshot";
import { listAllSessionsForAdmin } from "@/features/archetype-assessment/services/assessmentService";
import { useDeepDiveProfile } from "../hooks/useDeepDiveProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DeepDiveUserCards } from "../components/DeepDiveUserCards";
import { DeepDiveAdminCards } from "../components/DeepDiveAdminCards";
import { useLanguage } from "@/i18n/LanguageContext";

interface DeepDiveReportPageProps {
  /**
   * "user"  → client view: only their own profile, only "Vue Utilisateur" tab.
   * "admin" → admin view: lists real users with submitted assessments,
   *           plus "Vue Admin" tab.
   */
  mode: "user" | "admin";
}

interface AdminSessionRow {
  id: string;
  user_id: string;
  submitted_at: string | null;
  profile: { id: string; display_name: string | null } | null;
  company: { id: string; name: string | null } | null;
  top_archetype: string | null;
  shadow_count: number;
}

function fmtDate(iso: string | null, locale: "fr" | "en" = "fr"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DeepDiveReportPage({ mode }: DeepDiveReportPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const [searchParams] = useSearchParams();

  // Admin: list of real submitted sessions + selection
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(mode === "admin");
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<AdminSessionRow | null>(null);

  // Lens: Myss archetypes vs Wu Xing Tao portrait (markdown sections)
  const [lens, setLens] = useState<"myss" | "tao">(() =>
    searchParams.get("lens") === "tao" ? "tao" : "myss",
  );
  // Tabs (admin can flip between user / admin views — Myss lens only)
  const [tab, setTab] = useState<"user" | "admin">(mode === "admin" ? "admin" : "user");
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const userProfileLoad = useDeepDiveProfile({
    userId: mode === "user" ? user?.id : selectedSession?.user_id,
    sessionId: mode === "admin" ? selectedSession?.id : undefined,
    displayName: selectedSession?.profile?.display_name ?? null,
    locale,
  });

  const profile = mode === "admin" && !selectedSession ? null : userProfileLoad.profile;
  const loadingProfile = userProfileLoad.loading;
  const profileError = userProfileLoad.error;

  const activeUserId = mode === "admin" ? selectedSession?.user_id : user?.id;
  const { parts: taoParts, loading: taoLoading } = useTaoPortrait(activeUserId);

  useEffect(() => {
    if (searchParams.get("lens") === "tao") setLens("tao");
  }, [searchParams]);

  useEffect(() => {
    if (mode !== "admin") return;
    listAllSessionsForAdmin()
      .then((rows: any[]) => {
        const submitted = rows.filter((r) => r.submitted_at);
        setSessions(submitted as AdminSessionRow[]);
      })
      .catch((e) => {
        console.error("[DeepDive admin] list failed", e);
        toast({ title: isFR ? "Erreur" : "Error", description: isFR ? "Impossible de charger les utilisateurs." : "Unable to load users.", variant: "destructive" });
      })
      .finally(() => setLoadingSessions(false));
  }, [mode, toast]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sessions;
    const q = filter.toLowerCase();
    return sessions.filter((s) =>
      (s.profile?.display_name ?? "").toLowerCase().includes(q) ||
      (s.company?.name ?? "").toLowerCase().includes(q) ||
      (s.top_archetype ?? "").toLowerCase().includes(q),
    );
  }, [sessions, filter]);

  const userReport = useMemo(() => (profile ? buildUserReport(profile, locale) : ""), [profile, locale]);
  const adminReport = useMemo(() => (profile ? buildAdminReport(profile, locale) : ""), [profile, locale]);

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeMarkdown = tab === "user" ? userReport : adminReport;
  const reportSubject = selectedSession?.profile?.display_name || profile?.label || "Deep Dive";
  const filenameStem = `deep-dive-${(reportSubject || "rapport").replace(/\s+/g, "-").toLowerCase()}-${tab}`;

  const handleExportPdf = async () => {
    const el = exportRef.current;
    if (!el || !profile || exportingPdf || exportingPng) return;
    setExportingPdf(true);
    try {
      await exportDeepDiveVisualPdf(el, reportSubject, { kind: tab, isFR });
      toast({
        title: isFR ? "PDF téléchargé" : "PDF downloaded",
        description: isFR
          ? "Rapport visuel en thème sombre, cartes recto/verso incluses."
          : "Visual report in dark theme, front/back cards included.",
      });
    } catch (e: unknown) {
      console.error("[DeepDive] export pdf failed", e);
      toast({
        title: isFR ? "Erreur" : "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPng = async () => {
    const el = exportRef.current;
    if (!el || !profile || exportingPdf || exportingPng) return;
    setExportingPng(true);
    try {
      await exportDeepDivePng(el, reportSubject, { kind: tab, isFR });
      toast({
        title: isFR ? "PNG téléchargé" : "PNG downloaded",
        description: isFR
          ? "Capture haute résolution du rapport complet."
          : "High-resolution capture of the full report.",
      });
    } catch (e: unknown) {
      console.error("[DeepDive] export png failed", e);
      toast({
        title: isFR ? "Erreur" : "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setExportingPng(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Admin LIST view (no user selected yet)                              */
  /* ------------------------------------------------------------------ */
  if (mode === "admin" && !selectedSession) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-5xl space-y-6 py-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
              <FileText size={14} strokeWidth={1.5} />
              {isFR ? "Deep Dive — Lecture admin" : "Deep Dive — Admin reading"}
            </div>
            <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
              {isFR ? "Rapports clients" : "Client reports"}
            </h1>
            <p className="text-sm text-text-secondary">
              {isFR
                ? "Liste des utilisateurs ayant complété une évaluation. Sélectionne un profil pour consulter son rapport personnel et la lecture admin."
                : "List of users who have completed an assessment. Select a profile to view their personal report and the admin reading."}
            </p>
          </header>

          <Card className="p-4 backdrop-blur-3xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <Search size={16} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={isFR ? "Rechercher par nom, société, archétype dominant…" : "Search by name, company, dominant archetype…"}
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </Card>

          {loadingSessions ? (
            <div className="flex items-center justify-center py-16 text-text-tertiary">
              <Loader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
              {isFR ? "Chargement des utilisateurs…" : "Loading users…"}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary text-sm">
                {sessions.length === 0
                  ? (isFR ? "Aucun utilisateur n'a encore complété d'évaluation." : "No user has completed an assessment yet.")
                  : (isFR ? "Aucun résultat pour ce filtre." : "No results for this filter.")}
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSession(s); setTab("admin"); }}
                  className="text-left transition-all hover:scale-[1.005]"
                >
                  <Card className="p-4 backdrop-blur-3xl bg-white/[0.03] border border-white/10 hover:border-accent-warning/30 transition-colors">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-display tracking-wide text-text-primary truncate">
                          {s.profile?.display_name || (isFR ? "Utilisateur" : "User")}
                        </div>
                        <div className="text-xs text-text-tertiary mt-1 flex items-center gap-3 flex-wrap">
                          {s.company?.name && <span>{s.company.name}</span>}
                          <span>{isFR ? "Soumis le" : "Submitted on"} {fmtDate(s.submitted_at, locale)}</span>
                        </div>
                      </div>
                      {s.top_archetype && (
                        <Badge variant="outline" className="capitalize border-white/10 text-text-secondary">
                          {s.top_archetype}
                        </Badge>
                      )}
                      {s.shadow_count > 0 && (
                        <Badge variant="outline" className="border-accent-warning/30 text-accent-warning">
                          {s.shadow_count} {isFR ? `ombre${s.shadow_count > 1 ? "s" : ""}` : `shadow${s.shadow_count > 1 ? "s" : ""}`}
                        </Badge>
                      )}
                      <span className="text-xs text-text-tertiary uppercase tracking-[0.2em]">{isFR ? "Consulter →" : "View →"}</span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Report view (admin with user selected, or user mode)                */
  /* ------------------------------------------------------------------ */
  return (
    <PageWrapper>
      <div className={`mx-auto space-y-6 py-8 ${lens === "tao" ? "max-w-5xl" : "max-w-4xl"}`}>
        {mode === "admin" && selectedSession && (
          <button
            onClick={() => setSelectedSession(null)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-display text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            {isFR ? "Retour à la liste" : "Back to list"}
          </button>
        )}

        {loadingProfile && (
          <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary text-sm">{isFR ? "Construction de ton profil archétypal…" : "Building your archetypal profile…"}</p>
          </Card>
        )}

        {!loadingProfile && profileError && lens === "myss" && !profile && (
          <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
            <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary text-sm">{profileError}</p>
          </Card>
        )}

        {!loadingProfile && activeUserId && (
          <Tabs value={lens} onValueChange={(v) => setLens(v as "myss" | "tao")}>
            <TabsList className="mb-4" data-export-hide>
              <TabsTrigger value="myss" className="gap-2">
                <Sparkles size={14} strokeWidth={1.5} />
                {t("deepdive.lens.myss")}
              </TabsTrigger>
              <TabsTrigger value="tao" className="gap-2">
                <TreePine size={14} strokeWidth={1.5} />
                {t("deepdive.lens.tao")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tao" className="mt-0">
              <TaoPortraitPanel parts={taoParts} loading={taoLoading} variant="embedded" />
            </TabsContent>

            <TabsContent value="myss" className="mt-0">
              {!profile ? (
                <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
                  <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
                  <p className="text-text-secondary text-sm">
                    {profileError ??
                      (isFR
                        ? "Profil Myss indisponible. Complète l'évaluation pour accéder à cette lecture."
                        : "Myss profile unavailable. Complete the assessment to access this reading.")}
                  </p>
                </Card>
              ) : (
                <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
                  <div className="flex items-center justify-between gap-3 flex-wrap" data-export-hide>
                    <TabsList>
                      <TabsTrigger value="user" className="gap-2">
                        <User size={14} strokeWidth={1.5} /> {isFR ? "Vue Utilisateur" : "User view"}
                      </TabsTrigger>
                      {mode === "admin" && (
                        <TabsTrigger value="admin" className="gap-2">
                          <Shield size={14} strokeWidth={1.5} /> {isFR ? "Vue Admin" : "Admin view"}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadMarkdown(activeMarkdown, `${filenameStem}.md`)}
                  className="gap-2"
                >
                  <Download size={14} strokeWidth={1.5} />
                  .md
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleExportPdf()}
                  disabled={exportingPdf || exportingPng}
                  className="gap-2"
                >
                  {exportingPdf ? (
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <FileDown size={14} strokeWidth={1.5} />
                  )}
                  {isFR ? "Exporter PDF" : "Export PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleExportPng()}
                  disabled={exportingPdf || exportingPng}
                  className="gap-2"
                >
                  {exportingPng ? (
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <ImageDown size={14} strokeWidth={1.5} />
                  )}
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    const targetUserId =
                      mode === "admin" ? selectedSession?.user_id : user?.id;
                    if (!targetUserId) return;
                    try {
                      toast({
                        title: isFR ? "Export Drive…" : "Drive export…",
                        description: isFR ? "Envoi en cours" : "Uploading",
                      });
                      const res = await exportDeepDiveV2ToDrive({
                        userId: targetUserId,
                        assessmentId: selectedSession?.id ?? null,
                        exportType: tab,
                        format: "markdown",
                        content: activeMarkdown,
                        filenameStem: filenameStem,
                      });
                      toast({
                        title: isFR ? "Exporté sur Drive" : "Exported to Drive",
                        description: isFR
                          ? `${res.files?.length ?? 1} fichier(s) · ${res.path ?? res.fileName}`
                          : `${res.files?.length ?? 1} file(s) · ${res.path ?? res.fileName}`,
                      });
                    } catch (e: any) {
                      toast({
                        title: isFR ? "Échec de l'export Drive" : "Drive export failed",
                        description: e?.message ?? String(e),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Cloud size={14} strokeWidth={1.5} />
                  Drive
                </Button>
              </div>
            </div>

            <div ref={exportRef} id="deep-dive-report-export" className="space-y-6 mt-4">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
                  <FileText size={14} strokeWidth={1.5} />
                  {mode === "admin"
                    ? (isFR ? "Deep Dive — Lecture admin" : "Deep Dive — Admin reading")
                    : (isFR ? "Ton rapport Deep Dive" : "Your Deep Dive report")}
                </div>
                <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
                  {reportSubject}
                </h1>
                <p className="text-sm text-text-secondary">
                  {mode === "admin"
                    ? (isFR
                        ? `Évaluation soumise le ${fmtDate(selectedSession?.submitted_at ?? null, locale)}.${profile ? ` Triade : ${profile.label}.` : ""}`
                        : `Assessment submitted on ${fmtDate(selectedSession?.submitted_at ?? null, locale)}.${profile ? ` Triad: ${profile.label}.` : ""}`)
                    : (isFR
                        ? "Lecture personnalisée de tes archétypes dominants, ombres et pratiques recommandées."
                        : "Personalized reading of your dominant archetypes, shadows and recommended practices.")}
                </p>
                {mode === "user" && (
                  <Link
                    to="/cartographie/balance/analyse"
                    data-export-hide
                    className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[hsl(var(--aegis-warm)/0.35)] bg-[hsl(var(--aegis-warm-muted)/0.35)] px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-[hsl(var(--aegis-warm))] transition-colors hover:bg-[hsl(var(--aegis-warm-muted)/0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Scale size={15} strokeWidth={1.5} aria-hidden />
                    {t("balanceReport.openFromDeepDive")}
                  </Link>
                )}
              </header>

              <TabsContent value="user" className="mt-0">
                <DeepDiveUserCards profile={profile} />
              </TabsContent>

              {mode === "admin" && (
                <TabsContent value="admin" className="mt-0">
                  <DeepDiveAdminCards profile={profile} />
                </TabsContent>
              )}
            </div>
                </Tabs>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageWrapper>
  );
}
