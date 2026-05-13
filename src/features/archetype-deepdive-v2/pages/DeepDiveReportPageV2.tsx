import { useEffect, useMemo, useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, User, Shield, FileDown, ChevronLeft,
  Search, Loader2, Sparkles,
} from "lucide-react";
import {
  buildUserReport,
  buildAdminReport,
  type SampleProfile,
} from "../domain/sampleProfile";
import { buildDynamicProfile } from "../domain/dynamicProfileBuilder";
import { loadUnifiedDeepDiveResult } from "../domain/loadUnifiedScores";
import { supabase } from "@/integrations/supabase/client";
import { exportDeepDivePdf } from "../services/exportDeepDivePdf";
import {
  listAllSessionsForAdmin,
  getLatestSubmittedSessionForUser,
  getSessionFullDetails,
} from "@/features/archetype-assessment/services/assessmentService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DeepDiveUserCards } from "../components/DeepDiveUserCards";
import { DeepDiveAdminCardsV2 } from "../components/DeepDiveAdminCardsV2";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";

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

interface AssessmentInterpretation {
  summary: string;
  strengths: string[];
  watchouts: string[];
  recommendations: string[];
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

export default function DeepDiveReportPageV2({ mode }: DeepDiveReportPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  // Admin: list of real submitted sessions + selection
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(mode === "admin");
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<AdminSessionRow | null>(null);

  // Dynamic profile loading from real DB data
  const [profile, setProfile] = useState<SampleProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [assessmentTopThree, setAssessmentTopThree] = useState<ArchetypeKey[]>([]);
  const [deepDiveTopThree, setDeepDiveTopThree] = useState<string[]>([]);
  const [assessmentInterpretation, setAssessmentInterpretation] = useState<AssessmentInterpretation | null>(null);

  // Tabs (admin can flip between user / admin views)
  const [tab, setTab] = useState<"user" | "admin">(mode === "admin" ? "admin" : "user");

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

  // Load the REAL deep dive profile for the active subject (current user OR selected admin target)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProfile(null);
      setProfileError(null);
      setAssessmentTopThree([]);
      setDeepDiveTopThree([]);
      setAssessmentInterpretation(null);

      let sessionId: string | null = null;
      let displayName: string | null = null;

      if (mode === "user") {
        if (!user?.id) return;
        const session = await getLatestSubmittedSessionForUser(user.id);
        if (!session) {
          if (!cancelled) setProfileError(
            isFR
              ? "Tu n'as pas encore complété d'évaluation. Lance l'assessment pour générer ton Deep Dive personnel."
              : "You haven't completed an assessment yet. Run the assessment to generate your personal Deep Dive."
          );
          return;
        }
        sessionId = session.id;
      } else {
        if (!selectedSession) return;
        sessionId = selectedSession.id;
        displayName = selectedSession.profile?.display_name ?? null;
      }

      if (!sessionId) return;
      setLoadingProfile(true);
      try {
        const details = await getSessionFullDetails(sessionId);
        if (cancelled) return;

        const userIdForDeep =
          mode === "user" ? user!.id : selectedSession!.user_id;

        let unified: Awaited<ReturnType<typeof loadUnifiedDeepDiveResult>> | null = null;
        try {
          const { count, error: countErr } = await supabase
            .from("deepdive_responses" as any)
            .select("*", { count: "exact", head: true })
            .eq("user_id", userIdForDeep);
          if (!countErr && (count ?? 0) > 0) {
            unified = await loadUnifiedDeepDiveResult(userIdForDeep);
          }
        } catch (e) {
          console.warn("[DeepDive] unified score load failed", e);
        }

        const scoreTop3 = ((details.scores ?? []) as any[])
          .slice()
          .sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999))
          .filter((s) => Number(s.rank) <= 3)
          .map((s) => s.archetype_key as ArchetypeKey)
          .slice(0, 3);
        setAssessmentTopThree(scoreTop3);
        setDeepDiveTopThree((unified?.topThree ?? []).slice(0, 3));
        const analysis = (details.analysis ?? {}) as any;
        const recos = ((details.recommendations ?? []) as any[])
          .slice()
          .sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999))
          .slice(0, 3);
        setAssessmentInterpretation({
          summary: isFR
            ? (analysis.summary_fr ?? "")
            : (analysis.summary_en ?? analysis.summary_fr ?? ""),
          strengths: isFR
            ? ((analysis.strengths_fr ?? []) as string[])
            : (((analysis.strengths_en ?? analysis.strengths_fr ?? []) as string[])),
          watchouts: isFR
            ? ((analysis.watchouts_fr ?? []) as string[])
            : (((analysis.watchouts_en ?? analysis.watchouts_fr ?? []) as string[])),
          recommendations: recos.map((r) =>
            isFR ? (r.rationale_fr ?? r.title_fr ?? "") : (r.rationale_en ?? r.rationale_fr ?? r.title_en ?? r.title_fr ?? "")
          ).filter(Boolean),
        });

        const dynProfile = buildDynamicProfile({
          sessionId,
          displayName: displayName ?? details.profile?.display_name ?? null,
          scores: (details.scores ?? []) as any,
          analysis: (details.analysis ?? null) as any,
          locale,
          unified,
        });
        setProfile(dynProfile);
      } catch (e: any) {
        console.error("[DeepDive] load profile failed", e);
        if (!cancelled) setProfileError(e?.message ?? (isFR ? "Erreur lors du chargement du profil." : "Error loading profile."));
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mode, user?.id, selectedSession, locale, isFR]);

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
  const overlapCount = assessmentTopThree.filter((a) => deepDiveTopThree.includes(a)).length;
  const comparisonV2 = useMemo(() => {
    if (mode !== "admin" || !selectedSession || !profile) return null;
    return {
      assessmentTop3: assessmentTopThree,
      deepDiveTop3: deepDiveTopThree,
      overlapCount,
      assessmentSummary: assessmentInterpretation?.summary ?? "",
      assessmentStrengths: assessmentInterpretation?.strengths ?? [],
      assessmentWatchouts: assessmentInterpretation?.watchouts ?? [],
      deepDiveHypothesis: profile.narrative.adminDiagnostic.hypothesis,
      deepDivePrimaryShadow: profile.narrative.primaryShadowTheme,
      adminContractDelta: profile.narrative.adminContract,
    };
  }, [
    mode,
    selectedSession,
    profile,
    assessmentTopThree,
    deepDiveTopThree,
    overlapCount,
    assessmentInterpretation,
  ]);

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
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        {mode === "admin" && selectedSession && (
          <button
            onClick={() => setSelectedSession(null)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-display text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            {isFR ? "Retour à la liste" : "Back to list"}
          </button>
        )}

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
          {mode === "admin" && selectedSession && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="border-white/10 text-text-secondary">
                {`Assessment top3: ${assessmentTopThree.length > 0 ? assessmentTopThree.join(", ") : "—"}`}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-text-secondary">
                {`DeepDive top3: ${deepDiveTopThree.length > 0 ? deepDiveTopThree.join(", ") : "—"}`}
              </Badge>
              <Badge
                variant="outline"
                className={
                  overlapCount >= 2
                    ? "border-primary/30 text-primary"
                    : overlapCount === 1
                      ? "border-accent-warning/30 text-accent-warning"
                      : "border-white/10 text-text-tertiary"
                }
              >
                {isFR ? `Recouvrement: ${overlapCount}/3` : `Overlap: ${overlapCount}/3`}
              </Badge>
            </div>
          )}
        </header>

        {loadingProfile && (
          <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary text-sm">{isFR ? "Construction de ton profil archétypal…" : "Building your archetypal profile…"}</p>
          </Card>
        )}

        {!loadingProfile && profileError && (
          <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
            <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary text-sm">{profileError}</p>
          </Card>
        )}

        {!loadingProfile && !profileError && profile && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
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
                  onClick={() =>
                    exportDeepDivePdf({
                      kind: tab,
                      markdown: activeMarkdown,
                      profileLabel: reportSubject,
                    })
                  }
                  className="gap-2"
                >
                  <FileDown size={14} strokeWidth={1.5} />
                  {isFR ? "Exporter PDF" : "Export PDF"}
                </Button>
              </div>
            </div>

            <TabsContent value="user" className="mt-4">
              <DeepDiveUserCards profile={profile} />
            </TabsContent>

            {mode === "admin" && (
              <TabsContent value="admin" className="mt-4">
                <DeepDiveAdminCardsV2 profile={profile} comparisonV2={comparisonV2} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </PageWrapper>
  );
}
