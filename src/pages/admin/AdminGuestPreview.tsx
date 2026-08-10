import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Zap,
  FileText,
  Mail,
  LayoutDashboard,
  UserPlus,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertTriangle,
  History,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  loadGuestQuizTemplate,
  createSession,
  submitSession,
  getLatestSubmittedSessionForUser,
  deleteAdminGuestPreviewSessions,
  tryRecoverUserAssessment,
  restoreFromSnapshotId,
  getRecoveryDiagnostics,
  isPollutedAssessmentTriad,
  sessionMatchesPreferredTriad,
  type RecoveryDiagnostics,
  SESSION_SOURCE_ADMIN_GUEST_PREVIEW,
  archetypeMeta,
} from "@/features/archetype-assessment/services/assessmentService";
import { getSnapshotHistory } from "@/features/archetype-assessment/services/snapshotService";
import type { ArchetypeProfileSnapshot } from "@/features/archetype-assessment/services/snapshotService";
import type { ResponseValue, RuntimeQuestion } from "@/features/archetype-assessment/domain/types";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { supabase } from "@/integrations/supabase/client";

function generateAutoResponses(questions: RuntimeQuestion[]): ResponseValue[] {
  return questions.map((q) => {
    if (q.question_type === "short_text") {
      return { questionId: q.id, textValue: "Admin auto-fill" };
    }
    if (q.question_type === "likert_scale" && q.options.length > 0) {
      const mid = Math.floor(q.options.length / 2);
      return {
        questionId: q.id,
        selectedOptionIds: [q.options[mid].id],
        numericValue: q.options[mid].value ?? mid + 1,
      };
    }
    if (q.options.length === 0) {
      return { questionId: q.id, selectedOptionIds: [] };
    }
    const pick = q.options[Math.floor(Math.random() * q.options.length)];
    return { questionId: q.id, selectedOptionIds: [pick.id] };
  });
}

interface ShortcutCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function ShortcutCard({ icon, title, description, href }: ShortcutCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group card-interactive border p-4 sm:p-5 flex items-start gap-4 min-h-[72px] active:scale-[0.98]"
    >
      <div className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-accent-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-barlow text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-border-subtle group-hover:text-muted-foreground transition-colors mt-1" />
    </a>
  );
}

export default function AdminGuestPreview() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const isFR = locale === "fr";

  const [quizDone, setQuizDone] = useState<boolean | null>(null);
  const [topArchetype, setTopArchetype] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [fastQuizLoading, setFastQuizLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<ArchetypeProfileSnapshot[]>([]);
  const [realProfileMissing, setRealProfileMissing] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<RecoveryDiagnostics | null>(null);
  const TARGET_TRIAD = ["mystic", "sage", "healer"] as const;

  const checkQuizStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [realSession, history] = await Promise.all([
        getLatestSubmittedSessionForUser(user.id),
        getSnapshotHistory(user.id),
      ]);
      setSnapshots(history);
      setRealProfileMissing(!realSession);
      setDiagnostics(await getRecoveryDiagnostics(user.id));

      const session = await getLatestSubmittedSessionForUser(user.id, {
        includePreviewSessions: true,
      });
      if (!session) {
        setQuizDone(false);
        setTopArchetype(null);
        setSubmittedAt(null);
        return;
      }
      setQuizDone(true);
      setSubmittedAt(session.submitted_at);
      const { data: scoreRow } = await supabase
        .from("archetype_scores")
        .select("archetype_key")
        .eq("user_id", user.id)
        .eq("session_id", session.id)
        .order("rank", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (scoreRow?.archetype_key) {
        const meta = archetypeMeta(scoreRow.archetype_key as ArchetypeKey);
        setTopArchetype(isFR ? meta?.name_fr ?? null : meta?.name_en ?? null);
      }
    } catch {
      setQuizDone(false);
    }
  }, [user?.id, isFR]);

  useEffect(() => {
    void checkQuizStatus();
  }, [checkQuizStatus]);

  const handleFastQuiz = useCallback(async () => {
    if (!user?.id) return;
    setFastQuizLoading(true);
    try {
      const loaded = await loadGuestQuizTemplate();
      const responses = generateAutoResponses(loaded.questions);
      const sessionId = await createSession(user.id, loaded.template.id, {
        source: SESSION_SOURCE_ADMIN_GUEST_PREVIEW,
      });
      await submitSession({
        userId: user.id,
        sessionId,
        questions: loaded.questions,
        responses,
        startedAt: Date.now(),
        autoExportToDrive: false,
      });
      toast({
        title: t("admin.guest.fastQuiz.success"),
        description: t("admin.guest.fastQuiz.successDesc"),
      });
      await checkQuizStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: t("toast.error"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setFastQuizLoading(false);
    }
  }, [user?.id, checkQuizStatus, toast, t]);

  const handleResetQuiz = useCallback(async () => {
    if (!user?.id) return;
    setResetLoading(true);
    try {
      const deleted = await deleteAdminGuestPreviewSessions(user.id);
      if (deleted === 0) {
        toast({
          title: t("admin.guest.reset.none"),
          description: t("admin.guest.reset.noneDesc"),
        });
        await checkQuizStatus();
        return;
      }

      toast({
        title: t("admin.guest.reset.success"),
        description: t("admin.guest.reset.successDesc"),
      });
      await checkQuizStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: t("toast.error"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  }, [user?.id, checkQuizStatus, toast, t]);

  const handleRestoreProfile = useCallback(async () => {
    if (!user?.id) return;
    setRestoreLoading(true);
    try {
      const sessionId = await tryRecoverUserAssessment(user.id, {
        preferredTriad: ["mystic", "sage", "healer"],
      });
      if (!sessionId) {
        const diag = await getRecoveryDiagnostics(user.id);
        setDiagnostics(diag);
        const detail = diag.snapshots.length
          ? `${t("admin.guest.restore.noneDesc")} (${diag.snapshots.length} snapshots, ${diag.deepdiveResponseCount} deepdive)`
          : t("admin.guest.restore.noneDesc");
        toast({
          title: t("admin.guest.restore.none"),
          description: detail,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("admin.guest.restore.success"),
        description: t("admin.guest.restore.successDesc"),
      });
      await checkQuizStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: t("toast.error"),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setRestoreLoading(false);
    }
  }, [user?.id, checkQuizStatus, toast, t]);

  const handleRestoreSnapshot = useCallback(
    async (snapshotId: string) => {
      if (!user?.id) return;
      setRestoreLoading(true);
      try {
        await restoreFromSnapshotId(user.id, snapshotId);
        toast({
          title: t("admin.guest.restore.success"),
          description: t("admin.guest.restore.successDesc"),
        });
        await checkQuizStatus();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: t("toast.error"), description: msg, variant: "destructive" });
      } finally {
        setRestoreLoading(false);
      }
    },
    [user?.id, checkQuizStatus, toast, t],
  );

  const needsRecovery =
    diagnostics &&
    (!sessionMatchesPreferredTriad(diagnostics.currentTopTriad, [...TARGET_TRIAD]) ||
      isPollutedAssessmentTriad(diagnostics.currentTopTriad) ||
      realProfileMissing);

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="space-y-1">
        <p className="text-neural-label text-neural-accent/60">{t("admin.hub.kicker")}</p>
        <h1 className="text-neural-title text-2xl md:text-3xl text-foreground">
          {t("admin.guest.title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {t("admin.guest.description")}
        </p>
      </header>

      {needsRecovery && (
        <div className="dashboard-panel p-4 sm:p-5 space-y-3 border border-amber-400/30 bg-amber-400/5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t("admin.guest.restore.banner")}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("admin.guest.restore.bannerDesc")}
              </p>
              {diagnostics && (
                <p className="text-xs font-mono text-amber-200/90 mt-2">
                  {t("admin.guest.restore.current")}:{" "}
                  {diagnostics.currentTopTriad.join(" / ") || "—"} · snapshots:{" "}
                  {diagnostics.snapshotCount} · deepdive: {diagnostics.deepdiveResponseCount}
                </p>
              )}
            </div>
          </div>
          {snapshots.length > 0 ? (
            <ul className="text-xs text-muted-foreground space-y-2 pl-1">
              {snapshots.map((s) => {
                const top = s.top_archetypes.map((a) => a.key).join(" / ");
                const isTarget = top.includes("mystic") && top.includes("sage") && top.includes("healer");
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-2">
                    <span>
                      v{s.snapshot_version} —{" "}
                      {new Date(s.computed_at).toLocaleString(isFR ? "fr-FR" : "en-US")} — {top}
                      {isTarget ? " ✓" : ""}
                    </span>
                    <button
                      type="button"
                      disabled={restoreLoading}
                      onClick={() => void handleRestoreSnapshot(s.id)}
                      className="text-[10px] uppercase tracking-wider text-accent-primary hover:underline disabled:opacity-50"
                    >
                      {t("admin.guest.restore.pick")}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-destructive">{t("admin.guest.restore.noSnapshots")}</p>
          )}
          <button
            type="button"
            onClick={() => void handleRestoreProfile()}
            disabled={restoreLoading}
            className="dashboard-cta px-4 py-2.5 font-barlow text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-50"
          >
            {restoreLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <History size={13} />
            )}
            {t("admin.guest.restore.cta")}
          </button>
        </div>
      )}

      {/* Quiz status */}
      <div className="dashboard-panel p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-barlow text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">
            {t("admin.guest.quizStatus")}
          </h2>
          {quizDone === null ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : quizDone ? (
            <span className="flex items-center gap-1.5 text-xs text-accent-primary">
              <CheckCircle2 size={13} />
              {topArchetype ?? t("admin.guest.quizDone")}
              {submittedAt && (
                <span className="text-muted-foreground ml-1">
                  — {new Date(submittedAt).toLocaleDateString(isFR ? "fr-FR" : "en-US")}
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("admin.guest.quizNotDone")}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFastQuiz}
            disabled={fastQuizLoading}
            className="dashboard-cta px-4 py-2.5 font-barlow text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-50"
          >
            {fastQuizLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Zap size={13} />
            )}
            {t("admin.guest.fastQuiz.cta")}
          </button>

          {quizDone && (
            <button
              type="button"
              onClick={handleResetQuiz}
              disabled={resetLoading}
              className="px-4 py-2.5 font-barlow text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/20 transition-colors disabled:opacity-50"
            >
              {resetLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              {t("admin.guest.reset.cta")}
            </button>
          )}
        </div>

        {quizDone && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("admin.guest.fastQuiz.hint")}
            </p>
          </div>
        )}
      </div>

      {/* Shortcut links */}
      <div>
        <h2 className="dashboard-section-label mb-3 flex items-center gap-2">
          <div className="w-1 h-1 bg-accent-primary rounded-full" />
          <span>{t("admin.guest.shortcuts")}</span>
        </h2>
        <div className="space-y-2">
          <ShortcutCard
            icon={<Zap size={18} />}
            title={t("admin.guest.link.quiz")}
            description={t("admin.guest.link.quizDesc")}
            href="/quiz"
          />
          <ShortcutCard
            icon={<FileText size={18} />}
            title={t("admin.guest.link.report")}
            description={t("admin.guest.link.reportDesc")}
            href="/visitor/report"
          />
          <ShortcutCard
            icon={<LayoutDashboard size={18} />}
            title={t("admin.guest.link.dashboard")}
            description={t("admin.guest.link.dashboardDesc")}
            href="/visitor"
          />
          <ShortcutCard
            icon={<Mail size={18} />}
            title={t("admin.guest.link.newsletter")}
            description={t("admin.guest.link.newsletterDesc")}
            href="/newsletter"
          />
          <ShortcutCard
            icon={<UserPlus size={18} />}
            title={t("admin.guest.link.guestAuth")}
            description={t("admin.guest.link.guestAuthDesc")}
            href="/auth?guest=1"
          />
        </div>
      </div>
    </div>
  );
}
