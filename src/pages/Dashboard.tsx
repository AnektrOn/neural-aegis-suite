import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Plus, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ScoreCard from "@/components/ScoreCard";
import { checkAndAwardBadges } from "@/lib/badge-engine";
import ScoreboardWidget from "@/components/ScoreboardWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickLogModal from "@/components/QuickLogModal";
import HabitsMiniCard from "@/components/HabitsMiniCard";
import { NeuralCard } from "@/components/ui/neural-card";
import { AssessmentCTA } from "@/features/archetype-assessment/components/AssessmentCTA";
import { AegisHealthCard } from "@/components/AegisHealthCard";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useQueryClient } from "@tanstack/react-query";
import { MoodDecisionInsightCard } from "@/components/MoodDecisionInsightCard";
import { WelcomeExperience, SetupProgressBanner, WELCOME_DISMISSED_KEY } from "@/components/WelcomeExperience";
import { PostAssessmentBanner } from "@/components/PostAssessmentBanner";
import { getUserMaturityProfile, type UserMaturityProfile } from "@/lib/userMaturity";
import { generateAllNarratives, pickHighlightNarrative, type NarrativeContext, type KPINarrative } from "@/lib/narrativeEngine";
import { NarrativeKPICard } from "@/components/NarrativeKPICard";
import { DashboardMobile } from "@/pages/dashboard/DashboardMobile";
import { usePersonaTrackingStats } from "@/features/persona/hooks/usePersonaTrackingStats";
import { PULL_REFRESH_HINT_KEY, type MobileHabit } from "@/pages/dashboard/dashboard-shared";

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, delay, ease: "easeOut" as const } },
});

export default function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const { score: aegisScore, trend: aegisTrend, isLoading: aegisLoading } = useAegisHealthScore(user?.id);
  const aegisYesterday = aegisTrend.length >= 2 ? aegisTrend[aegisTrend.length - 2] : null;
  const queryClient = useQueryClient();
  const dashData = useDashboardData(user?.id, isMobile, locale);

  const [showQuickLog, setShowQuickLog] = useState(false);
  const [mobileHabits, setMobileHabits] = useState<MobileHabit[]>([]);
  const personaStatsQuery = usePersonaTrackingStats(isMobile ? user?.id : undefined, locale);
  const toolboxTodo = personaStatsQuery.data?.toolboxTodo ?? 0;
  const toolboxFocusId = personaStatsQuery.data?.toolboxFocusId ?? null;

  const loading = dashData.isLoading;
  const stats = useMemo(() => ({
    moodAvg: dashData.mobile?.moodAvg ?? dashData.stats?.moodAvg ?? "—",
    openDecisions: dashData.mobile?.openDecisions ?? dashData.stats?.openDecisions ?? "—",
    habitsDone: dashData.mobile?.habitsDone ?? dashData.stats?.habitsDone ?? "—",
    contacts: dashData.mobile?.contacts ?? dashData.stats?.contacts ?? "—",
  }), [dashData.mobile, dashData.stats]);
  const digest = useMemo(() => dashData.mobile?.digest ?? dashData.digest ?? null, [dashData.mobile, dashData.digest]);
  const people = useMemo(() => dashData.people as Person[], [dashData.people]);
  const totalHabits = dashData.mobile?.totalHabits ?? 0;
  const decisions = useMemo(() => dashData.stats?.decisions ?? dashData.mobile?.decisions ?? [], [dashData.stats, dashData.mobile]);
  const lastJournalEntry = dashData.mobile?.lastJournalEntry ?? null;
  const oldestDecisionDays = dashData.stats?.oldestDecisionDays ?? 0;
  const lastContactDays = dashData.stats?.lastContactDays ?? 999;

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
    if (!user || !isMobile) return;
    const loadToolboxStats = () => {
      void personaStatsQuery.refetch();
    };
    window.addEventListener("aegis:refresh", loadToolboxStats);
    return () => window.removeEventListener("aegis:refresh", loadToolboxStats);
  }, [user, isMobile, personaStatsQuery.refetch]);

  useEffect(() => {
    if (!user) return;
    const checked = sessionStorage.getItem("badges_checked");
    if (!checked) {
      checkAndAwardBadges(user.id);
      sessionStorage.setItem("badges_checked", "1");
    }
  }, [user]);

  // Listen for pull-to-refresh event
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => { void dashData.refetch(); };
    window.addEventListener("aegis:refresh", handler);
    return () => window.removeEventListener("aegis:refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

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


  const kpiContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06 } },
  };
  const kpiItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Build narratives once — shared by mobile + desktop layouts.
  const narrativeCtxShared: NarrativeContext = useMemo(() => ({
    moodAvg: stats.moodAvg === "—" ? 0 : Number(stats.moodAvg) || 0,
    moodDelta: digest ? (digest.moodTrend === "down" ? -digest.moodDelta : digest.moodDelta) : 0,
    moodTrend: digest?.moodTrend ?? "stable",
    openDecisions: Number(stats.openDecisions) || 0,
    oldestDecisionDays,
    habitRate: digest?.habitRate ?? 0,
    streakDays: digest?.streakDays ?? 0,
    journalCount: digest?.journalCount ?? 0,
    contactsCount: Number(stats.contacts) || 0,
    lastContactDays,
    aegisScore: aegisScore?.overall_score ?? 0,
    aegisScoreDelta:
      aegisScore && aegisYesterday ? aegisScore.overall_score - aegisYesterday.overall_score : 0,
  }), [stats, digest, oldestDecisionDays, lastContactDays, aegisScore, aegisYesterday]);
  const narratives: KPINarrative[] = useMemo(
    () => generateAllNarratives(narrativeCtxShared),
    [narrativeCtxShared],
  );
  const highlight = useMemo(() => pickHighlightNarrative(narratives), [narratives]);

  if (isMobile && user) {
    return (
      <>
      <DailyCheckinModal checkin={trackingCheckin} />
      <DashboardMobile
        userId={user.id}
        loading={loading}
        isError={dashData.isError}
        onRetry={() => void dashData.refetch()}
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
        pullHintVisible={pullHintVisible}
        onPullHintDismiss={() => setPullHintVisible(false)}
        toolboxTodo={toolboxTodo}
        toolboxFocusId={toolboxFocusId}
        trackingCheckin={trackingCheckin}
      />
      </>
    );
  }

  if (isMobile) {
    return null;
  }

  // ─── Desktop layout ─────────────────────────────────────────────────────────
  const moodTrendLabel =
    digest?.moodTrend === "up"
      ? t("dashboard.moodTrendVsWeekUp", { n: String(digest.moodDelta) })
      : digest?.moodTrend === "down"
        ? t("dashboard.moodTrendVsWeekDown", { n: String(digest.moodDelta) })
        : t("dashboard.stable");




  return (
    <div className="min-h-full -mx-6 px-5 pb-10 sm:px-8 sm:pb-12 md:-mx-10 md:px-10 bg-aegis-gradient">
      <DailyCheckinModal checkin={trackingCheckin} />
      <motion.div className="mx-auto max-w-6xl space-y-8 sm:space-y-9 md:space-y-10">
        <DailyCheckinReopenBanner checkin={trackingCheckin} />
        {showPostAssessment && (
          <PostAssessmentBanner onClose={() => setShowPostAssessment(false)} />
        )}
        {showWelcome && maturity && (
          <WelcomeExperience
            maturityProfile={maturity}
            onDismiss={() => setWelcomeDismissed(true)}
          />
        )}
        {showSetupBanner && maturity && !showWelcome && (
          <SetupProgressBanner maturityProfile={maturity} />
        )}
        {dashData.isError && (
          <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center">
            <p className="flex-1 font-barlow text-sm text-destructive">{t("dashboard.loadError")}</p>
            <button
              type="button"
              className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
              onClick={() => void dashData.refetch()}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        )}
        <header className="flex flex-col gap-5 border-b border-border/20 pb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
          <div className="min-w-0 space-y-1.5">
            <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70">
              {format(new Date(), "EEEE d MMMM", { locale: locale === "fr" ? fr : enUS })}
            </p>
            <h1 className="font-cormorant text-3xl font-light tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              {t("dashboard.pageTitle")}
            </h1>
            <p className="max-w-prose text-sm leading-relaxed text-text-secondary/80 sm:text-[15px]">
              {t("dashboard.welcome")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickLog(true)}
            aria-label={t("dashboard.quickLogCta")}
            className="dashboard-cta dashboard-cta--inline shrink-0 font-display text-xs uppercase tracking-wide text-text-primary"
          >
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            <span>{t("dashboard.quickLogCta")}</span>
          </button>
        </header>

        <AssessmentCTA />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5" aria-label={t("dashboard.pageTitle")}>
          <NavLink
            to="/analytics"
            aria-label={t("dashboard.a11yOpenAnalytics")}
            className="lg:col-span-2 block rounded-[18px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AegisHealthCard score={aegisScore} previous={aegisYesterday} isLoading={aegisLoading} />
          </NavLink>
          <NavLink
            to="/analytics"
            aria-label={t("dashboard.a11yOpenAnalytics")}
            className="lg:col-span-3 block rounded-[18px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoodDecisionInsightCard userId={user?.id} />
          </NavLink>
        </section>

        {highlight && !loading && (
          <motion.section {...fadeUp(0)} className="dashboard-panel px-5 py-5 sm:px-7 sm:py-6">
            <p className="dashboard-section-label mb-2">{t("dashboard.weekInOneSentence")}</p>
            <p className="font-cormorant text-lg font-light leading-relaxed text-text-primary sm:text-xl">
              {locale === "fr" ? highlight.story_fr : highlight.story_en}
            </p>
          </motion.section>
        )}

        <section className="space-y-4">
          <p className="dashboard-section-label">{t("dashboard.mobileThisWeek")}</p>
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4"
            variants={kpiContainer}
            initial="initial"
            animate="animate"
          >
            {narratives.map((n) => (
              <motion.div key={n.key} variants={kpiItem} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <NarrativeKPICard narrative={n} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Hidden trend label (kept to avoid unused-var lint) */}
        <span className="sr-only">{moodTrendLabel}</span>

        <section>
          <NeuralCard variant="premium" className="p-5 md:p-6" glow="blue">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-4 w-1.5 shrink-0 rounded-full bg-accent-primary" />
                  <h2 className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary">
                    {t("dashboard.neuralMap")}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-text-tertiary">{t("dashboard.neuralMapTeaser")}</p>
              </div>
              <NavLink
                to="/people"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-accent-primary/25 bg-accent-primary/10 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-accent-primary transition-colors hover:bg-accent-primary/15"
              >
                {t("dashboard.openRelationsGraph")}
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </NavLink>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-elevated/50 px-4 py-3 text-center text-sm text-text-tertiary">
              {loading ? "—" : t("dashboard.neuralMapStat", { n: String(people.length) })}
            </div>
          </NeuralCard>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {user ? (
            <NavLink
              to="/habits"
              aria-label={t("dashboard.a11yOpenAllHabits")}
              className="block rounded-[18px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HabitsMiniCard userId={user.id} />
            </NavLink>
          ) : null}
          <ScoreboardWidget />
          <NavLink
            to="/analytics"
            aria-label={t("dashboard.a11yOpenAnalytics")}
            className="block rounded-[18px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ScoreCard />
          </NavLink>
        </section>
      </motion.div>

      <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
      <DailyCheckinModal userId={user?.id} />
    </div>
  );
}
