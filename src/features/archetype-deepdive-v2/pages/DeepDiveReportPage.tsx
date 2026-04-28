import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
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
  SAMPLE_PROFILES,
  SAMPLE_PROFILE_MYSTIC,
  SAMPLE_PROFILE_LEADER,
  buildUserReport,
  buildAdminReport,
  type SampleProfile,
} from "../domain/sampleProfile";
import { exportDeepDivePdf } from "../services/exportDeepDivePdf";
import { listAllSessionsForAdmin } from "@/features/archetype-assessment/services/assessmentService";
import { useToast } from "@/hooks/use-toast";

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

/**
 * Map a real user's dominant archetype to the closest curated SampleProfile.
 * Until per-user narratives are persisted, this gives admins a meaningful
 * Myss-style read of any submitted assessment.
 */
function pickProfileForUser(topArchetype: string | null): SampleProfile {
  if (!topArchetype) return SAMPLE_PROFILE_MYSTIC;
  const verticals = ["mystic", "sage", "magician", "creator"];
  return verticals.includes(topArchetype)
    ? SAMPLE_PROFILE_MYSTIC
    : SAMPLE_PROFILE_LEADER;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DeepDiveReportPage({ mode }: DeepDiveReportPageProps) {
  const { toast } = useToast();

  // Admin: list of real submitted sessions + selection
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(mode === "admin");
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<AdminSessionRow | null>(null);

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
        toast({ title: "Erreur", description: "Impossible de charger les utilisateurs.", variant: "destructive" });
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

  // The currently displayed profile (curated narrative).
  const profile: SampleProfile = useMemo(() => {
    if (mode === "user") return SAMPLE_PROFILE_MYSTIC;
    return selectedSession ? pickProfileForUser(selectedSession.top_archetype) : SAMPLE_PROFILE_MYSTIC;
  }, [mode, selectedSession]);

  const userReport = useMemo(() => buildUserReport(profile), [profile]);
  const adminReport = useMemo(() => buildAdminReport(profile), [profile]);

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
  const reportSubject = selectedSession?.profile?.display_name || profile.label;
  const filenameStem = `deep-dive-${(reportSubject || "rapport").replace(/\s+/g, "-").toLowerCase()}-${tab}`;

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
              Deep Dive — Lecture admin
            </div>
            <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
              Rapports clients
            </h1>
            <p className="text-sm text-text-secondary">
              Liste des utilisateurs ayant complété une évaluation. Sélectionne un profil pour
              consulter son rapport personnel et la lecture admin.
            </p>
          </header>

          <Card className="p-4 backdrop-blur-3xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
            <Search size={16} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher par nom, société, archétype dominant…"
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </Card>

          {loadingSessions ? (
            <div className="flex items-center justify-center py-16 text-text-tertiary">
              <Loader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
              Chargement des utilisateurs…
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary text-sm">
                {sessions.length === 0
                  ? "Aucun utilisateur n'a encore complété d'évaluation."
                  : "Aucun résultat pour ce filtre."}
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
                          {s.profile?.display_name || "Utilisateur"}
                        </div>
                        <div className="text-xs text-text-tertiary mt-1 flex items-center gap-3 flex-wrap">
                          {s.company?.name && <span>{s.company.name}</span>}
                          <span>Soumis le {fmtDate(s.submitted_at)}</span>
                        </div>
                      </div>
                      {s.top_archetype && (
                        <Badge variant="outline" className="capitalize border-white/10 text-text-secondary">
                          {s.top_archetype}
                        </Badge>
                      )}
                      {s.shadow_count > 0 && (
                        <Badge variant="outline" className="border-accent-warning/30 text-accent-warning">
                          {s.shadow_count} ombre{s.shadow_count > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <span className="text-xs text-text-tertiary uppercase tracking-[0.2em]">Consulter →</span>
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
            Retour à la liste
          </button>
        )}

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <FileText size={14} strokeWidth={1.5} />
            {mode === "admin" ? "Deep Dive — Lecture admin" : "Ton rapport Deep Dive"}
          </div>
          <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
            {reportSubject}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "admin"
              ? `Évaluation soumise le ${fmtDate(selectedSession?.submitted_at ?? null)}. Profil archétypal mappé sur la lecture « ${profile.label} ».`
              : "Lecture personnalisée de tes archétypes dominants, ombres et pratiques recommandées."}
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="user" className="gap-2">
                <User size={14} strokeWidth={1.5} /> Vue Utilisateur
              </TabsTrigger>
              {mode === "admin" && (
                <TabsTrigger value="admin" className="gap-2">
                  <Shield size={14} strokeWidth={1.5} /> Vue Admin
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
                Exporter PDF
              </Button>
            </div>
          </div>

          <TabsContent value="user" className="mt-4">
            <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary prose-em:text-text-tertiary">
                <ReactMarkdown>{userReport}</ReactMarkdown>
              </article>
            </Card>
          </TabsContent>

          {mode === "admin" && (
            <TabsContent value="admin" className="mt-4">
              <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
                <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary prose-em:text-text-tertiary">
                  <ReactMarkdown>{adminReport}</ReactMarkdown>
                </article>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageWrapper>
  );
}
