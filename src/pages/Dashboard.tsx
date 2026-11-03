import { useState, useEffect, useMemo, useCallback, Component, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from "@/lib/badge-engine";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useQueryClient } from "@tanstack/react-query";
import { WELCOME_DISMISSED_KEY } from "@/components/WelcomeExperience";
import { getUserMaturityProfile, type UserMaturityProfile } from "@/lib/userMaturity";
import { DashboardMobile } from "@/pages/dashboard/DashboardMobile";
import { usePersonaTrackingStats } from "@/features/persona/hooks/usePersonaTrackingStats";
import { PULL_REFRESH_HINT_KEY, type MobileHabit } from "@/pages/dashboard/dashboard-shared";

class DashboardRenderBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] p-6 text-foreground">
          <p className="mb-2 font-semibold">Impossible d’afficher le tableau de bord.</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Rechargez la page (Cmd+Shift+R). Détail technique ci-dessous.
          </p>
          <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const { user, session } = useAuth();
  const resolvedUserId = user?.id ?? session?.user?.id;
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const { score: aegisScore, trend: aegisTrend } = useAegisHealthScore(resolvedUserId);
  const aegisYesterday = aegisTrend.length >= 2 ? aegisTrend[aegisTrend.length - 2] : null;
  const queryClient = useQueryClient();
  /** Bio-Executive uses the mobile dashboard bundle on all breakpoints. */
  const dashData = useDashboardData(resolvedUserId, true, locale);

  const [showQuickLog, setShowQuickLog] = useState(false);
  const [mobileHabits, setMobileHabits] = useState<MobileHabit[]>([]);
  const personaStatsQuery = usePersonaTrackingStats(resolvedUserId, locale);
  const toolboxTodo = personaStatsQuery.data?.toolboxTodo ?? 0;
  const toolboxFocusId = personaStatsQuery.data?.toolboxFocusId ?? null;

  const loading = dashData.isLoading;
  const stats = useMemo(
    () => ({
      moodAvg: dashData.mobile?.moodAvg ?? "—",
      openDecisions: dashData.mobile?.openDecisions ?? "—",
      habitsDone: dashData.mobile?.habitsDone ?? "—",
      contacts: dashData.mobile?.contacts ?? "—",
    }),
    [dashData.mobile],
  );
  const digest = useMemo(() => dashData.mobile?.digest ?? null, [dashData.mobile]);
  const totalHabits = dashData.mobile?.totalHabits ?? 0;
  const decisions = useMemo(() => dashData.mobile?.decisions ?? [], [dashData.mobile]);
  const lastJournalEntry = dashData.mobile?.lastJournalEntry ?? null;
  const oldestDecisionDays = dashData.mobile?.oldestDecisionDays ?? 0;

  // ── First-time user "Aha Moment" experience ───────────────────────────────
  const [maturity, setMaturity] = useState<UserMaturityProfile | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(WELCOME_DISMISSED_KEY) === "1"; } catch { return false; }
  });
  const [showPostAssessment, setShowPostAssessment] = useState(false);
  const [pullHintVisible, setPullHintVisible] = useState(() => {
    try {
      return localStorage.getItem(PULL_REFRESH_HINT_KEY) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getUserMaturityProfile(user.id)
      .then((m) => { if (alive) setMaturity(m); })
      .catch((e) => console.error("maturity load error", e));
    return () => { alive = false; };
  }, [user]);

  // Detect ?welcome=post_assessment URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("welcome") === "post_assessment") {
      setShowPostAssessment(true);
      params.delete("welcome");
      const next = params.toString();
      navigate({ pathname: location.pathname, search: next ? `?${next}` : "" }, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const showWelcome = !!maturity && maturity.level === "new" && !welcomeDismissed;
  const showSetupBanner = !!maturity && maturity.level === "emerging";

  // Sync mobileHabits from React Query (for optimistic toggle UI)
  useEffect(() => {
    if (dashData.mobile) {
      setMobileHabits(dashData.mobile.mobileHabits);
    }
  }, [dashData.mobile]);

  useEffect(() => {
    if (!user) return;
    const loadToolboxStats = () => {
      void personaStatsQuery.refetch();
    };
    window.addEventListener("aegis:refresh", loadToolboxStats);
    return () => window.removeEventListener("aegis:refresh", loadToolboxStats);
  }, [user, personaStatsQuery.refetch]);

  useEffect(() => {
    if (!user) return;
    const checked = sessionStorage.getItem("badges_checked");
    if (!checked) {
      checkAndAwardBadges(user.id);
      sessionStorage.setItem("badges_checked", "1");
    }
  }, [user]);

  const refetchDashboard = useCallback(() => {
    void dashData.refetch();
    if (user?.id) {
      void queryClient.invalidateQueries({ queryKey: ["bio-executive-hero", user.id] });
    }
  }, [dashData, queryClient, user?.id]);

  // Listen for pull-to-refresh event
  useEffect(() => {
    const handler = () => refetchDashboard();
    window.addEventListener("aegis:refresh", handler);
    return () => window.removeEventListener("aegis:refresh", handler);
  }, [refetchDashboard]);

  // Listen for open quick-log from MoodTracker (mobile) or same page
  useEffect(() => {
    const handler = () => setShowQuickLog(true);
    window.addEventListener("aegis:open-quicklog", handler);
    return () => window.removeEventListener("aegis:open-quicklog", handler);
  }, []);

  // Open quick-log when navigating from MoodTracker with state
  useEffect(() => {
    const state = location.state as { openQuickLog?: boolean } | null;
    if (state?.openQuickLog) {
      setShowQuickLog(true);
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const timeAgoLabel = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return t("dashboard.timeAgoDays", { n: d });
    if (h > 0) return t("dashboard.timeAgoHours", { n: h });
    return t("dashboard.timeAgoNow");
  };

  const toggleMobileHabit = async (habitId: string) => {
    if (!user) return;
    const habit = mobileHabits.find((h) => h.id === habitId);
    if (!habit) return;
    const nextCompleted = !habit.completed;
    const rolled = mobileHabits.map((h) => (h.id === habitId ? { ...h, completed: nextCompleted } : h));
    setMobileHabits(rolled);
    try {
      if (nextCompleted) {
        const { error } = await supabase
          .from("habit_completions" as any)
          .insert({ user_id: user.id, assigned_habit_id: habitId, completed_date: today } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_completions" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("assigned_habit_id", habitId)
          .eq("completed_date", today);
        if (error) throw error;
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard-mobile", user.id, locale] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMobileHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, completed: habit.completed } : h)));
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
    }
  };


  if (!resolvedUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
          role="status"
          aria-label={t("general.loading")}
        />
      </div>
    );
  }

  return (
    <DashboardRenderBoundary>
      <DashboardMobile
        userId={resolvedUserId}
        loading={loading}
        isError={dashData.isError}
        onRetry={refetchDashboard}
        stats={stats}
        digest={digest}
        decisions={decisions}
        mobileHabits={mobileHabits}
        totalHabits={totalHabits}
        lastJournalEntry={lastJournalEntry}
        showQuickLog={showQuickLog}
        onQuickLogOpen={() => setShowQuickLog(true)}
        onQuickLogClose={() => setShowQuickLog(false)}
        toggleMobileHabit={toggleMobileHabit}
        timeAgoLabel={timeAgoLabel}
        maturity={maturity}
        showWelcome={showWelcome}
        showSetupBanner={showSetupBanner}
        showPostAssessment={showPostAssessment}
        onWelcomeDismiss={() => setWelcomeDismissed(true)}
        onPostAssessmentClose={() => setShowPostAssessment(false)}
        pullHintVisible={isMobile && pullHintVisible}
        onPullHintDismiss={() => setPullHintVisible(false)}
        desktopLayout={!isMobile}
        toolboxTodo={toolboxTodo}
        toolboxFocusId={toolboxFocusId}
        aegisScore={aegisScore}
        aegisScoreDelta={
          aegisScore && aegisYesterday ? aegisScore.overall_score - aegisYesterday.overall_score : 0
        }
        moodVitals={dashData.mobile?.moodVitals ?? null}
        oldestDecisionDays={dashData.mobile?.oldestDecisionDays ?? oldestDecisionDays}
        maxDecisionPriority={dashData.mobile?.maxDecisionPriority ?? 0}
        scoreTrendSparkline={aegisTrend.slice(-7).map((row) => row.overall_score)}
      />
    </DashboardRenderBoundary>
  );
}
