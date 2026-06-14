/**
 * AdminTrackingHub
 *
 * Admin hub for the Tracking Progress system.
 * Tabs:
 *  - questions: import tracking questions from Markdown
 *  - users:     list users with adherence stats + trigger evolution report
 *  - snapshots: browse generated evolution snapshots
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload, Users, BarChart3, Loader2, CheckCircle2, AlertTriangle,
  Sparkles, RefreshCw, FileText, ChevronRight, Clock, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { importQuestionsFromMarkdown, loadQuestionStats, loadPerspectiveBySlug } from "@/features/tracking-progress/services/trackingQuestionService";
import { generateEvolutionSnapshot, loadAllSnapshotsAdmin, type GenerateSnapshotResult } from "@/features/tracking-progress/services/trackingAnalysisService";
import { loadAdherenceStats } from "@/features/tracking-progress/services/trackingDailyService";
import type { TrackingProgressSnapshot } from "@/features/tracking-progress/domain/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string;
  display_name: string | null;
}

interface UserRow extends UserProfile {
  adherence: { answeredDays: number; totalDays: number; streak: number } | null;
  latestSnapshotDate: string | null;
  isGenerating: boolean;
  lastResult: GenerateSnapshotResult | null;
}

// ---------------------------------------------------------------------------
// Tab: Questions import
// ---------------------------------------------------------------------------

function QuestionsImportTab() {
  const [markdown, setMarkdown] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPerspectiveBySlug("myss-archetype").then(async (p) => {
      if (p) {
        const s = await loadQuestionStats(p.id);
        setStats({ total: s.total, active: s.active });
      }
    }).catch(() => {});
  }, [result]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
  };

  const handleImport = async () => {
    if (!markdown.trim()) {
      toast({ title: "Erreur", description: "Collez ou chargez un fichier Markdown d'abord.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const perspective = await loadPerspectiveBySlug("myss-archetype");
      if (!perspective) throw new Error("Perspective Myss introuvable");

      const res = await importQuestionsFromMarkdown(perspective.id, markdown);
      setResult({ inserted: res.inserted, updated: res.updated, errors: res.parseErrors });

      toast({
        title: "Import terminé",
        description: `${res.inserted} insérées, ${res.updated} mises à jour.`,
      });
    } catch (err) {
      toast({
        title: "Erreur import",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <Card className="neural-card p-4 bg-white/[0.03] border border-white/10 text-center">
            <p className="text-2xl font-bold font-display text-foreground">{stats.total}</p>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">questions</p>
          </Card>
          <Card className="neural-card p-4 bg-white/[0.03] border border-white/10 text-center">
            <p className="text-2xl font-bold font-display text-foreground">{stats.active}</p>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">actives</p>
          </Card>
        </div>
      )}

      {/* File upload */}
      <div>
        <p className="text-xs text-text-tertiary mb-2">Importer depuis un fichier .md</p>
        <label className="flex items-center gap-2 w-fit cursor-pointer px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm text-text-secondary">
          <Upload size={14} strokeWidth={1.5} />
          Choisir un fichier .md
          <input type="file" accept=".md" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {/* Textarea */}
      <div>
        <p className="text-xs text-text-tertiary mb-2">ou collez le Markdown directement</p>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="w-full h-64 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm font-mono text-text-secondary resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
          placeholder={`## TQ-M-001\ntype: scale\narchetype_target: sovereign\nhouse_target: 10\n\nquestion_fr: Dans quelle mesure...`}
        />
        <p className="text-[10px] text-text-tertiary mt-1">{markdown.length} caractères</p>
      </div>

      {/* Import button */}
      <Button
        onClick={handleImport}
        disabled={isImporting || !markdown.trim()}
        className="gap-2"
      >
        {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} strokeWidth={1.5} />}
        {isImporting ? "Import en cours..." : "Importer les questions"}
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="text-sm">
              <p className="font-medium text-foreground">Import réussi</p>
              <p className="text-text-secondary">
                {result.inserted} insérée{result.inserted !== 1 ? "s" : ""} ·{" "}
                {result.updated} mise{result.updated !== 1 ? "s" : ""} à jour
              </p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">
                  {result.errors.length} avertissement{result.errors.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ul className="text-xs text-text-secondary space-y-1 font-mono">
                {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 10 && <li>...et {result.errors.length - 10} autres</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Users + generate snapshots
// ---------------------------------------------------------------------------

function UsersTab() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [perspective, setPerspective] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [profilesRes, persp] = await Promise.all([
          supabase.from("profiles").select("id, display_name").order("display_name"),
          loadPerspectiveBySlug("myss-archetype"),
        ]);

        if (cancelled) return;

        setPerspective(persp);

        const profiles = (profilesRes.data ?? []) as UserProfile[];

        const rows: UserRow[] = profiles.map((p) => ({
          ...p,
          adherence: null,
          latestSnapshotDate: null,
          isGenerating: false,
          lastResult: null,
        }));

        setUsers(rows);
        setIsLoading(false);

        // Load adherence for each user in the background (batched)
        if (persp) {
          for (let i = 0; i < profiles.length; i += 5) {
            if (cancelled) break;
            const batch = profiles.slice(i, i + 5);
            await Promise.all(
              batch.map(async (p) => {
                try {
                  const stats = await loadAdherenceStats(p.id, persp.id, 14);
                  if (!cancelled) {
                    setUsers((prev) =>
                      prev.map((r) => r.id === p.id ? { ...r, adherence: stats } : r)
                    );
                  }
                } catch {}
              })
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("AdminTrackingHub users load error", err);
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const handleGenerate = useCallback(async (userId: string) => {
    setUsers((prev) => prev.map((r) => r.id === userId ? { ...r, isGenerating: true, lastResult: null } : r));

    try {
      const result = await generateEvolutionSnapshot({
        userId,
        perspectiveSlug: "myss-archetype",
        generatedBy: adminUser?.id,
      });

      setUsers((prev) =>
        prev.map((r) => r.id === userId
          ? {
              ...r,
              isGenerating: false,
              lastResult: result,
              latestSnapshotDate: result.success ? new Date().toISOString() : r.latestSnapshotDate,
            }
          : r
        )
      );

      toast({
        title: result.success ? "Rapport généré" : "Génération impossible",
        description: result.success
          ? `${result.responseCount} réponses analysées.`
          : result.error,
        variant: result.success ? "default" : "destructive",
      });
    } catch (err) {
      setUsers((prev) => prev.map((r) => r.id === userId ? { ...r, isGenerating: false } : r));
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  }, [adminUser, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary text-sm py-12 justify-center">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Chargement des utilisateurs...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-tertiary mb-4">
        {users.length} utilisateur{users.length !== 1 ? "s" : ""} ·{" "}
        Cliquez sur "Générer" pour créer le rapport d'évolution Myss des 14 derniers jours.
      </p>

      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          {/* Avatar placeholder */}
          <div className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-display text-text-tertiary">
              {(user.display_name ?? "?")[0]?.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.display_name ?? "Sans nom"}
            </p>
            {user.adherence && (
              <p className="text-[10px] text-text-tertiary">
                {user.adherence.answeredDays}/{user.adherence.totalDays} jours répondus
                {user.adherence.streak > 0 && ` · ${user.adherence.streak}j streak`}
              </p>
            )}
            {!user.adherence && (
              <p className="text-[10px] text-text-tertiary italic">Chargement...</p>
            )}
          </div>

          {/* Last result feedback */}
          {user.lastResult && (
            <div className="shrink-0">
              {user.lastResult.success
                ? <CheckCircle2 size={14} className="text-emerald-400" strokeWidth={1.5} />
                : <AlertTriangle size={14} className="text-amber-400" strokeWidth={1.5} />
              }
            </div>
          )}

          {/* Generate button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(user.id)}
            disabled={user.isGenerating}
            className="shrink-0 gap-1.5 text-xs border-white/10 hover:bg-white/5"
          >
            {user.isGenerating
              ? <Loader2 size={12} className="animate-spin" strokeWidth={1.5} />
              : <Sparkles size={12} strokeWidth={1.5} />
            }
            {user.isGenerating ? "..." : "Générer"}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Snapshots history
// ---------------------------------------------------------------------------

function SnapshotsTab() {
  const [snapshots, setSnapshots] = useState<Array<TrackingProgressSnapshot & { display_name?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadAllSnapshotsAdmin("myss-archetype")
      .then(setSnapshots)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary text-sm py-12 justify-center">
        <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
        Chargement...
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="py-16 text-center text-text-tertiary text-sm">
        Aucun snapshot généré. Allez dans l'onglet Utilisateurs pour générer des rapports.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-tertiary mb-4">
        {snapshots.length} rapport{snapshots.length !== 1 ? "s" : ""} généré{snapshots.length !== 1 ? "s" : ""}
      </p>

      {snapshots.map((s) => (
        <div key={s.id} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="text-purple-400" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {(s as any).display_name ?? "Utilisateur"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={10} strokeWidth={1.5} className="text-text-tertiary" />
                <p className="text-[10px] text-text-tertiary">
                  {format(new Date(s.period_start), "d MMM", { locale: fr })}
                  {" → "}
                  {format(new Date(s.period_end), "d MMM yyyy", { locale: fr })}
                  {" · "}
                  {s.response_count} réponses
                </p>
              </div>
            </div>

            {s.strongest_shift && (
              <Badge variant="outline" className="shrink-0 text-[10px] border-white/10 text-text-tertiary">
                {s.strongest_shift}
              </Badge>
            )}

            <ChevronRight
              size={14}
              strokeWidth={1.5}
              className={`shrink-0 text-text-tertiary transition-transform ${expanded === s.id ? "rotate-90" : ""}`}
            />
          </button>

          {expanded === s.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-4">
              {s.narrative_fr && (
                <p className="text-sm text-text-secondary italic leading-relaxed">
                  {s.narrative_fr}
                </p>
              )}
              <div className="text-[10px] text-text-tertiary font-mono break-all">
                ID: {s.id}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main hub
// ---------------------------------------------------------------------------

type TabId = "questions" | "users" | "snapshots";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "questions", label: "Questions",   icon: FileText },
  { id: "users",     label: "Utilisateurs", icon: Users },
  { id: "snapshots", label: "Rapports",    icon: BarChart3 },
];

export default function AdminTrackingHub() {
  const [activeTab, setActiveTab] = useState<TabId>("questions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-amber-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-display mb-0.5">
            Admin · Deep Dive
          </p>
          <h2 className="text-xl font-semibold font-cormorant text-foreground">
            Tracking Progress — Perspective Myss
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Import du questionnaire · suivi quotidien · rapports d'évolution
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all",
              activeTab === id
                ? "bg-white/10 text-foreground"
                : "text-text-tertiary hover:text-foreground hover:bg-white/[0.04]",
            ].join(" ")}
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="min-h-[400px]">
        {activeTab === "questions" && <QuestionsImportTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "snapshots" && <SnapshotsTab />}
      </div>
    </div>
  );
}
