import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Zap, Brain, Target, TrendingUp, TrendingDown, Minus, Plus, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ScoreCard from "@/components/ScoreCard";
import AIInsights from "@/components/AIInsights";
import { checkAndAwardBadges } from "@/lib/badge-engine";
import ScoreboardWidget from "@/components/ScoreboardWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickLogModal from "@/components/QuickLogModal";
import HabitsMiniCard from "@/components/HabitsMiniCard";
import DashboardHero from "@/components/DashboardHero";
import { NeuralCard } from "@/components/ui/neural-card";
import { AssessmentCTA } from "@/features/archetype-assessment/components/AssessmentCTA";
import { AegisHealthCard } from "@/components/AegisHealthCard";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { MoodDecisionInsightCard } from "@/components/MoodDecisionInsightCard";
import { WelcomeExperience, SetupProgressBanner, WELCOME_DISMISSED_KEY } from "@/components/WelcomeExperience";
import { PostAssessmentBanner } from "@/components/PostAssessmentBanner";
import { getUserMaturityProfile, type UserMaturityProfile } from "@/lib/userMaturity";
import { generateAllNarratives, pickHighlightNarrative, type NarrativeContext, type KPINarrative } from "@/lib/narrativeEngine";
import { NarrativeKPICard } from "@/components/NarrativeKPICard";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";

interface WeeklyDigest {
  moodTrend: "up" | "down" | "stable";
  moodDelta: number;
  habitRate: number;
  decisionsResolved: number;
  journalCount: number;
  streakDays: number;
}

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
}

interface MobileHabit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
}

const priorityBadge = (p: number): { label: string; cls: string } => {
  if (p >= 5) return { label: "P" + p, cls: "bg-destructive/10 text-destructive" };
  if (p >= 3) return { label: "P" + p, cls: "bg-warning/10 text-warning" };
  return { label: "P" + p, cls: "bg-transparent text-muted-foreground" };
};

const PULL_REFRESH_HINT_KEY = "aegis_pull_refresh_hint_dismissed";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: "easeOut" as const },
  style: { willChange: "transform" as const },
});

export default function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ moodAvg: "—", openDecisions: "—", habitsDone: "—", contacts: "—" });
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [totalHabits, setTotalHabits] = useState(0);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [mobileHabits, setMobileHabits] = useState<MobileHabit[]>([]);
  const [lastJournalEntry, setLastJournalEntry] = useState<{ content: string; created_at: string } | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const { score: aegisScore, trend: aegisTrend, isLoading: aegisLoading } = useAegisHealthScore(user?.id);
  const aegisYesterday = aegisTrend.length >= 2 ? aegisTrend[aegisTrend.length - 2] : null;
  const [oldestDecisionDays, setOldestDecisionDays] = useState(0);
  const [lastContactDays, setLastContactDays] = useState(999);

  // ── First-time user "Aha Moment" experience ───────────────────────────────
  const [maturity, setMaturity] = useState<UserMaturityProfile | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(WELCOME_DISMISSED_KEY) === "1"; } catch { return false; }
  });
  const [showPostAssessment, setShowPostAssessment] = useState(false);
  const [mobileLoadError, setMobileLoadError] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    if (isMobile) {
      loadMobileData();
    } else {
      loadStats();
      loadDigest();
      loadPeople();
      loadTotalHabits();
    }
    const checked = sessionStorage.getItem("badges_checked");
    if (!checked) {
      checkAndAwardBadges(user.id);
      sessionStorage.setItem("badges_checked", "1");
    }
  }, [user, isMobile, locale]);

  // Listen for pull-to-refresh event
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => { if (user) loadMobileData(); };
    window.addEventListener("aegis:refresh", handler);
    return () => window.removeEventListener("aegis:refresh", handler);
  }, [isMobile, user]);

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
    const habitsDoneBefore = mobileHabits.filter((h) => h.completed).length;
    const rolled = mobileHabits.map((h) => (h.id === habitId ? { ...h, completed: nextCompleted } : h));
    setMobileHabits(rolled);
    setStats((s) => ({ ...s, habitsDone: String(rolled.filter((h) => h.completed).length) }));
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMobileHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, completed: habit.completed } : h)));
      setStats((s) => ({ ...s, habitsDone: String(habitsDoneBefore) }));
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
    }
  };

  const loadPeople = async () => {
    const { data } = await supabase.from("people_contacts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setPeople(data as any);
  };

  // ── MOBILE: single consolidated load ────────────────────────────────────────
  const loadMobileData = async () => {
    setLoading(true);
    setMobileLoadError(false);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekStart = sevenDaysAgo.toISOString();
      const weekStartDate = sevenDaysAgo.toISOString().split("T")[0];

      const [moodRes, decisionsRes, habitsAssignedRes, completionsRes, journalRes] = await Promise.all([
        supabase.from("mood_entries" as any).select("value, logged_at").eq("user_id", user!.id).gte("logged_at", weekStart),
        supabase.from("decisions" as any).select("id, name, priority, status, created_at").eq("user_id", user!.id).eq("status", "pending").order("priority", { ascending: false }).limit(3),
        supabase.from("assigned_habits" as any).select("id, habit_template_id").eq("user_id", user!.id).eq("is_active", true).limit(5),
        supabase.from("habit_completions" as any).select("assigned_habit_id, completed_date").eq("user_id", user!.id).gte("completed_date", weekStartDate),
        supabase.from("journal_entries").select("content, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const batchErrors = [moodRes.error, decisionsRes.error, habitsAssignedRes.error, completionsRes.error, journalRes.error].filter(Boolean);
      if (batchErrors.length > 0) {
        console.error("Mobile dashboard batch errors:", batchErrors);
        setMobileLoadError(true);
        toast({ title: t("toast.error"), description: t("dashboard.loadError"), variant: "destructive" });
      }

      // Mood avg
      const moods = (moodRes.data as any[] || []);
      const avg = moods.length > 0
        ? (moods.reduce((s: number, m: any) => s + m.value, 0) / moods.length).toFixed(1)
        : "—";

      // Habit completions today
      const completedToday = (completionsRes.data as any[] || []).filter(
        (c: any) => c.completed_date === today
      );

      // Streak from habit_completions
      const completionDates = new Set((completionsRes.data as any[] || []).map((c: any) => c.completed_date));
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        if (completionDates.has(ds)) streak++;
        else if (i > 0) break;
      }

      setStats({
        moodAvg: avg,
        openDecisions: String((decisionsRes.data || []).length),
        habitsDone: String(completedToday.length),
        contacts: "—",
      });

      setDecisions((decisionsRes.data as any[]) || []);

      // Minimal digest for mobile (streak + habit rate)
      const habitDays = new Set((completionsRes.data as any[] || []).map((c: any) => c.completed_date));
      setDigest({
        moodTrend: "stable",
        moodDelta: 0,
        habitRate: Math.round((habitDays.size / 7) * 100),
        decisionsResolved: 0,
        journalCount: 0,
        streakDays: streak,
      });

      // Journal preview
      if (journalRes.data) setLastJournalEntry(journalRes.data as any);

      // Habits with template names
      if (habitsAssignedRes.data && (habitsAssignedRes.data as any[]).length > 0) {
        const templateIds = (habitsAssignedRes.data as any[]).map((a: any) => a.habit_template_id);
        const completedTodaySet = new Set(completedToday.map((c: any) => c.assigned_habit_id));

        const { data: templates, error: tplErr } = await supabase
          .from("habit_templates" as any)
          .select("id, name, name_i18n, category")
          .in("id", templateIds);

        if (tplErr) {
          console.error("habit_templates load", tplErr);
          toast({ title: t("toast.error"), description: tplErr.message, variant: "destructive" });
        }

        const tMap = new Map((templates as any[] || []).map((tpl: any) => [tpl.id, tpl]));
        setMobileHabits(
          (habitsAssignedRes.data as any[]).map((a: any) => ({
            id: a.id,
            name: (() => {
              const tpl = tMap.get(a.habit_template_id);
              if (!tpl) return t("habits.unknown");
              return pickLocalizedText(locale as Locale, tpl.name_i18n, tpl.name);
            })(),
            category: tMap.get(a.habit_template_id)?.category ?? "",
            completed: completedTodaySet.has(a.id),
          }))
        );
        setTotalHabits((habitsAssignedRes.data as any[]).length);
      }
    } catch (e) {
      console.error("Mobile dashboard load error:", e);
      setMobileLoadError(true);
      toast({
        title: t("toast.error"),
        description: t("dashboard.loadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── DESKTOP: separate loads ──────────────────────────────────────────────────
  const loadStats = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    try {
      const [moodRes, decRes, decOldestRes, habitRes, contactRes, lastTouchRes] = await Promise.all([
        supabase.from("mood_entries" as any).select("value").eq("user_id", user!.id).gte("logged_at", sevenDaysAgo.toISOString()),
        supabase.from("decisions" as any).select("id, name, priority, status").eq("user_id", user!.id).eq("status", "pending").order("priority", { ascending: false }).limit(3),
        supabase.from("decisions" as any).select("created_at").eq("user_id", user!.id).eq("status", "pending").order("created_at", { ascending: true }).limit(1),
        supabase.from("habit_completions" as any).select("id").eq("user_id", user!.id).eq("completed_date", today),
        supabase.from("people_contacts" as any).select("id").eq("user_id", user!.id),
        supabase.from("relation_quality_history" as any).select("recorded_at").eq("user_id", user!.id).order("recorded_at", { ascending: false }).limit(1),
      ]);
      const moods = (moodRes.data as any[] || []);
      const avg = moods.length > 0
        ? (moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1) : "—";
      setStats({
        moodAvg: avg,
        openDecisions: String((decRes.data || []).length),
        habitsDone: String((habitRes.data || []).length),
        contacts: String((contactRes.data || []).length),
      });
      if (decRes.data) setDecisions(decRes.data as any[]);
      const oldest = (decOldestRes.data as any[] | null)?.[0]?.created_at;
      if (oldest) {
        setOldestDecisionDays(Math.max(0, Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000)));
      } else {
        setOldestDecisionDays(0);
      }
      const lastTouch = (lastTouchRes.data as any[] | null)?.[0]?.recorded_at;
      if (lastTouch) {
        setLastContactDays(Math.max(0, Math.floor((Date.now() - new Date(lastTouch).getTime()) / 86400000)));
      } else {
        setLastContactDays(999);
      }
    } catch (e) {
      console.error("Dashboard loadStats error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalHabits = async () => {
    const { data } = await supabase
      .from("assigned_habits" as any).select("id").eq("user_id", user!.id).eq("is_active", true);
    setTotalHabits((data || []).length);
  };

  const loadDigest = async () => {
    try {
      const now = new Date();
      const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
      const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const [thisWeekMood, lastWeekMood, habitsRes, decisionsRes, journalRes] = await Promise.all([
        supabase.from("mood_entries" as any).select("value").eq("user_id", user!.id).gte("logged_at", thisWeekStart.toISOString()),
        supabase.from("mood_entries" as any).select("value").eq("user_id", user!.id).gte("logged_at", lastWeekStart.toISOString()).lt("logged_at", thisWeekStart.toISOString()),
        supabase.from("habit_completions" as any).select("completed_date").eq("user_id", user!.id).gte("completed_date", thisWeekStart.toISOString().split("T")[0]),
        supabase.from("decisions" as any).select("status").eq("user_id", user!.id).eq("status", "decided").gte("decided_at", thisWeekStart.toISOString()),
        supabase.from("journal_entries").select("id").eq("user_id", user!.id).gte("created_at", thisWeekStart.toISOString()),
      ]);
      const thisAvg = (thisWeekMood.data as any[] || []).length > 0
        ? (thisWeekMood.data as any[]).reduce((s, m) => s + m.value, 0) / (thisWeekMood.data as any[]).length : 0;
      const lastAvg = (lastWeekMood.data as any[] || []).length > 0
        ? (lastWeekMood.data as any[]).reduce((s, m) => s + m.value, 0) / (lastWeekMood.data as any[]).length : 0;
      const delta = +(thisAvg - lastAvg).toFixed(1);
      const habitDays = new Set((habitsRes.data as any[] || []).map((h) => h.completed_date));
      let streak = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (habitDays.has(d.toISOString().split("T")[0])) streak++; else if (i > 0) break;
      }
      setDigest({
        moodTrend: delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable",
        moodDelta: Math.abs(delta),
        habitRate: Math.round((habitDays.size / 7) * 100),
        decisionsResolved: (decisionsRes.data || []).length,
        journalCount: (journalRes.data || []).length,
        streakDays: streak,
      });
    } catch (e) {
      console.error("Dashboard loadDigest error:", e);
    }
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp size={14} className="text-accent-positive" strokeWidth={1.5} />;
    if (trend === "down") return <TrendingDown size={14} className="text-accent-danger" strokeWidth={1.5} />;
    return <Minus size={14} className="text-text-tertiary" strokeWidth={1.5} />;
  };

  const kpiContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06 } },
  };
  const kpiItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const mobileKpiStagger = {
    initial: {},
    animate: { transition: { staggerChildren: 0.03 } },
  };
  const mobileKpiChild = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
  };

  // Build narratives once — shared by mobile + desktop layouts.
  const narrativeCtxShared: NarrativeContext = {
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
  };
  const narratives: KPINarrative[] = generateAllNarratives(narrativeCtxShared);
  const highlight = pickHighlightNarrative(narratives);

  // ─── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const completedHabits = mobileHabits.filter(h => h.completed).length;
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? t("dashboard.greetingMorning") : hour < 18 ? t("dashboard.greetingAfternoon") : t("dashboard.greetingEvening");
    const streakDays = digest?.streakDays ?? 0;
    const habitsTotal = mobileHabits.length || totalHabits;
    const sessionLabel =
      hour < 12 ? t("dashboard.sessionMorning") : hour < 18 ? t("dashboard.sessionAfternoon") : t("dashboard.sessionEvening");
    const heroProgress = digest != null ? Math.min(100, Math.max(0, digest.habitRate)) : 75;

    const digestAriaLabel =
      digest != null
        ? t("dashboard.digestAriaLabel", {
            mood:
              digest.moodTrend === "stable"
                ? t("dashboard.stable")
                : digest.moodTrend === "up"
                  ? `+${digest.moodDelta}`
                  : `−${digest.moodDelta}`,
            habit: String(digest.habitRate),
            streak: String(streakDays),
          })
        : undefined;

    return (
      <div className="mobile-section-gap max-w-full sm:max-w-lg sm:mx-auto md:max-w-2xl pt-4 sm:pt-5 md:pt-6">
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
        {pullHintVisible && (
          <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 sm:px-4">
            <p className="min-w-0 flex-1 font-barlow text-[11px] sm:text-xs leading-snug text-text-secondary">
              {t("dashboard.pullRefreshHint")}
            </p>
            <button
              type="button"
              className="shrink-0 rounded-lg px-2.5 py-1.5 font-barlow text-[10px] font-medium uppercase tracking-wide text-primary hover:bg-primary/10"
              onClick={() => {
                try {
                  localStorage.setItem(PULL_REFRESH_HINT_KEY, "1");
                } catch {
                  /* ignore */
                }
                setPullHintVisible(false);
              }}
            >
              {t("dashboard.pullRefreshDismiss")}
            </button>
          </div>
        )}
        {mobileLoadError && (
          <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
            <p className="flex-1 font-barlow text-sm text-destructive">{t("dashboard.loadError")}</p>
            <button
              type="button"
              className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
              onClick={() => void loadMobileData()}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        )}
        {/* Streak (date + AEGIS: header AppLayout) */}
        {streakDays > 0 && (
          <motion.div {...fadeUp(0)} className="flex justify-end items-center gap-1.5 min-h-[24px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="font-barlow text-[11px] font-medium text-primary">
              {t("dashboard.streakLine", { n: streakDays })}
            </span>
          </motion.div>
        )}

        {/* Hero — statique, pas d'animation mount */}
        <div>
          <DashboardHero
            greeting={greeting}
            sessionLabel={sessionLabel}
            progress={heroProgress}
            progressAriaLabel={t("dashboard.heroProgressAria", { n: String(Math.round(heroProgress)) })}
          />
        </div>

        {/* Quick Log CTA */}
        {loading ? (
          <div className="skeleton h-[72px] sm:h-[76px] rounded-2xl sm:rounded-[18px]" />
        ) : (
          <motion.div {...fadeUp(0.02)}>
            <button
              type="button"
              onClick={() => setShowQuickLog(true)}
              className="dashboard-cta select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsla(var(--aegis-warm)/0.14)] shadow-[inset_0_0_12px_hsla(var(--aegis-warm)/0.15)] sm:h-11 sm:w-11 sm:rounded-[13px]">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--aegis-warm))] shadow-[0_0_10px_hsla(var(--aegis-warm)/0.55)]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-barlow text-[14px] sm:text-[15px] font-medium text-text-primary leading-snug">
                    {t("dashboard.mobileLogNow")}
                  </p>
                  <p className="font-barlow text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] sm:tracking-[0.2em] text-text-tertiary/80 mt-1">
                    {t("dashboard.mobileLogSubtitle")}
                  </p>
                </div>
              </div>
              <span className="text-primary/45 text-2xl sm:text-[26px] font-light pl-2 shrink-0" aria-hidden>
                ›
              </span>
            </button>
          </motion.div>
        )}

        {/* Archetype Assessment CTA (mobile) */}
        <motion.div {...fadeUp(0.03)}>
          <AssessmentCTA />
        </motion.div>

        {/* 3 KPI pills */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[78px] sm:h-[84px] rounded-2xl sm:rounded-[18px]" />
            ))}
          </div>
        ) : (
          <motion.div {...fadeUp(0.03)}>
            <motion.div
            variants={mobileKpiStagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-2.5 sm:gap-3"
          >
            <motion.div variants={mobileKpiChild} className="dashboard-kpi-pill">
              <p className="font-cormorant text-[23px] sm:text-[26px] font-light leading-none text-primary tabular-nums">
                {stats.moodAvg}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/75 mt-2 sm:mt-2.5">
                {t("mood.label")}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] text-primary/60 mt-1 tabular-nums">
                {digest?.moodTrend === "up"
                  ? `+${digest.moodDelta}`
                  : digest?.moodTrend === "down"
                    ? `−${digest.moodDelta}`
                    : "—"}
              </p>
            </motion.div>
            <motion.div variants={mobileKpiChild} className="dashboard-kpi-pill">
              <p className="font-cormorant text-[23px] sm:text-[26px] font-light leading-none text-foreground tabular-nums">
                {habitsTotal > 0 ? `${completedHabits}/${habitsTotal}` : stats.habitsDone}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/75 mt-2 sm:mt-2.5">
                {t("nav.habits")}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] text-primary/60 mt-1 tabular-nums">
                {digest != null ? `${digest.habitRate}%` : "—"}
              </p>
            </motion.div>
            <motion.div variants={mobileKpiChild} className="dashboard-kpi-pill">
              <p
                className={`font-cormorant text-[23px] sm:text-[26px] font-light leading-none tabular-nums ${
                  streakDays > 0 ? "text-warning" : "text-muted-foreground"
                }`}
              >
                {streakDays > 0 ? `${streakDays}j` : stats.openDecisions}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/75 mt-2 sm:mt-2.5">
                {streakDays > 0 ? t("dashboard.kpiStreak") : t("dashboard.kpiDecisions")}
              </p>
              <p className="font-barlow text-[10px] sm:text-[11px] text-primary/60 mt-1 tabular-nums">
                {streakDays > 0 ? t("dashboard.kpiStreakUnit") : t("dashboard.kpiDecisionsOpen")}
              </p>
            </motion.div>
          </motion.div>
          </motion.div>
        )}

        {/* Decisions card */}
        {loading ? (
          <div className="skeleton h-[118px] sm:h-[128px] rounded-2xl sm:rounded-[18px]" />
        ) : (
          <motion.div {...fadeUp(0.04)}>
            <div className="dashboard-panel-interactive p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 min-h-[40px] sm:min-h-[44px]">
                <p className="dashboard-section-label">{t("dashboard.mobileDecisionsOpen")}</p>
                <NavLink
                  to="/decisions"
                  className="font-barlow text-[11px] sm:text-xs text-primary/55 hover:text-primary/85 transition-colors tracking-wide min-h-[44px] min-w-[44px] inline-flex items-center justify-end px-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("dashboard.mobileSeeAll")}
                </NavLink>
              </div>
              {decisions.length === 0 ? (
                <div className="flex flex-col items-center py-5 sm:py-6 gap-2.5">
                  <Target size={26} strokeWidth={1} className="text-muted-foreground/25 sm:w-7 sm:h-7" />
                  <p className="font-barlow text-sm sm:text-[15px] text-muted-foreground/50 text-center max-w-[280px] sm:max-w-sm leading-snug">
                    {t("dashboard.mobileNoDecisions")}
                  </p>
                  <NavLink
                    to="/decisions"
                    className="font-barlow text-[11px] sm:text-xs text-primary border border-primary/25 bg-primary/5 px-4 py-2.5 sm:py-3 rounded-xl tracking-wider uppercase hover:bg-primary/10 transition-colors mt-1 min-h-[44px] inline-flex items-center"
                  >
                    {t("dashboard.mobileNewDecision")}
                  </NavLink>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/40">
                    {decisions.map((d: any) => {
                      const badge = priorityBadge(d.priority);
                      return (
                        <div key={d.id} className="flex items-center justify-between gap-2 min-h-[44px] sm:min-h-[48px] py-2 sm:py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/85 flex-shrink-0" />
                            <span className="font-barlow text-[15px] sm:text-base text-foreground/90 truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {d.created_at && (
                              <span className="font-barlow text-[10px] sm:text-[11px] text-muted-foreground/50 tabular-nums">
                                {timeAgoLabel(d.created_at)}
                              </span>
                            )}
                            <span className={`font-barlow text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <NavLink
                    to="/decisions"
                    className="font-barlow flex items-center justify-center sm:justify-start gap-1.5 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/40 text-[11px] sm:text-xs text-primary/65 hover:text-primary tracking-wider uppercase transition-colors min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      +
                    </span>
                    <span>{t("decisions.newDecision")}</span>
                  </NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Habits card (inline from mobileHabits state) */}
        {loading ? (
          <div className="skeleton h-[140px] sm:h-[152px] rounded-2xl sm:rounded-[18px]" />
        ) : mobileHabits.length > 0 ? (
          <motion.div {...fadeUp(0.05)}>
            <div className="dashboard-panel-interactive p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 min-h-[40px] sm:min-h-[44px]">
                <p className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/85">
                  {t("dashboard.mobileHabitsToday")}
                </p>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="font-barlow text-[11px] sm:text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg tabular-nums">
                    {completedHabits}/{mobileHabits.length}
                  </span>
                  <NavLink
                    to="/habits"
                    className="p-1 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={t("dashboard.a11yOpenAllHabits")}
                  >
                    <ArrowUpRight size={13} aria-hidden />
                  </NavLink>
                </div>
              </div>
              <div className="space-y-1">
                {mobileHabits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    role="checkbox"
                    aria-checked={habit.completed}
                    aria-label={t("dashboard.a11yToggleHabit", { name: habit.name })}
                    onClick={() => void toggleMobileHabit(habit.id)}
                    className="flex w-full items-center gap-3 min-h-[44px] py-1 text-left rounded-lg active:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                        habit.completed
                          ? "border-primary/40 bg-primary/15 shadow-[inset_0_0_10px_hsl(var(--primary)/0.12)]"
                          : "border-[hsl(var(--aegis-border))]"
                      }`}
                    >
                      {habit.completed && (
                        <svg
                          className="w-2 h-2 text-primary"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M2 6l3 3 5-6" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`font-barlow text-[15px] sm:text-base transition-colors ${
                        habit.completed ? "line-through text-muted-foreground/45" : "text-foreground/90"
                      }`}
                    >
                      {habit.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className="h-1 sm:h-1.5 rounded-full mt-3 sm:mt-4 overflow-hidden bg-border/50">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary/35 to-primary"
                  style={{
                    width: mobileHabits.length > 0 ? `${(completedHabits / mobileHabits.length) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.05)}>
            <div className="rounded-2xl sm:rounded-[18px] border-[0.5px] border-[hsl(var(--aegis-border-ice))] overflow-hidden shadow-[0_6px_28px_hsl(0_0%_0%/0.08)]">
              <HabitsMiniCard userId={user!.id} />
            </div>
          </motion.div>
        )}

        {/* Weekly digest (compact) */}
        {!loading && digest && (
          <motion.div {...fadeUp(0.06)}>
            <div
              role="region"
              aria-label={digestAriaLabel}
              className="dashboard-panel p-4 sm:p-5"
            >
              <p className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/85 mb-3 sm:mb-4">
                {t("dashboard.mobileThisWeek")}
              </p>
              <div className="grid grid-cols-3 text-center gap-1 sm:gap-2">
                <div className="px-1 sm:px-2">
                  <div className="flex items-center justify-center gap-1 mb-1 min-h-[24px] sm:min-h-[28px]">
                    {digest.moodTrend === "stable" ? (
                      <span className="font-barlow text-xs sm:text-sm text-muted-foreground/55">{t("dashboard.stable")}</span>
                    ) : (
                      <>
                        <span
                          className={`font-barlow text-base sm:text-lg ${
                            digest.moodTrend === "up" ? "text-chart-4" : "text-destructive"
                          }`}
                          aria-hidden
                        >
                          {digest.moodTrend === "up" ? "↑" : "↓"}
                        </span>
                        <span className="font-barlow text-[11px] sm:text-xs text-muted-foreground/75 tabular-nums">
                          {digest.moodTrend === "up" ? `+${digest.moodDelta}` : `−${digest.moodDelta}`}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="font-barlow text-[10px] sm:text-[11px] text-muted-foreground/55 tracking-[0.14em] sm:tracking-[0.16em] uppercase">
                    {t("mood.label")}
                  </p>
                </div>
                <div className="border-l border-border/50 px-2 sm:px-3">
                  <p className="font-cormorant text-[20px] sm:text-[22px] font-light text-text-primary leading-tight mb-1 tabular-nums">
                    {digest.habitRate}%
                  </p>
                  <p className="font-barlow text-[10px] sm:text-[11px] text-muted-foreground/55 tracking-[0.14em] sm:tracking-[0.16em] uppercase">
                    {t("nav.habits")}
                  </p>
                </div>
                <div className="border-l border-border/50 pl-2 sm:pl-3">
                  <p className="font-cormorant text-[20px] sm:text-[22px] font-light text-text-primary leading-tight mb-1 tabular-nums">
                    {streakDays}j
                  </p>
                  <p className="font-barlow text-[10px] sm:text-[11px] text-muted-foreground/55 tracking-[0.14em] sm:tracking-[0.16em] uppercase">
                    {t("dashboard.kpiStreak")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && user && (
          <motion.div {...fadeUp(0.065)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScoreboardWidget compact />
            <ScoreCard compact />
          </motion.div>
        )}

        {/* Journal preview */}
        {!loading && lastJournalEntry && (
          <motion.div {...fadeUp(0.07)}>
            <NavLink to="/journal" className="block rounded-2xl sm:rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <div
                className="dashboard-panel-interactive p-4 sm:p-5"
                style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                  <p className="font-barlow text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] text-text-tertiary/85">
                    {t("dashboard.mobileLastEntry")}
                  </p>
                  <span className="font-barlow text-[10px] sm:text-[11px] text-muted-foreground/50 tabular-nums shrink-0">
                    {timeAgoLabel(lastJournalEntry.created_at)}
                  </span>
                </div>
                <p className="font-cormorant text-[15px] sm:text-base font-light italic leading-relaxed line-clamp-3 sm:line-clamp-3 text-muted-foreground">
                  &ldquo;{lastJournalEntry.content}&rdquo;
                </p>
              </div>
            </NavLink>
          </motion.div>
        )}

        {/* Quick log modal */}
        <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
      </div>
    );
  }

  // ─── Desktop layout ─────────────────────────────────────────────────────────
  const moodTrendLabel =
    digest?.moodTrend === "up"
      ? t("dashboard.moodTrendVsWeekUp", { n: String(digest.moodDelta) })
      : digest?.moodTrend === "down"
        ? t("dashboard.moodTrendVsWeekDown", { n: String(digest.moodDelta) })
        : t("dashboard.stable");




  return (
    <div className="min-h-full -mx-6 -mt-6 px-5 pt-6 pb-10 sm:px-8 sm:pb-12 md:-mx-10 md:-mt-10 md:px-10 md:pt-10 bg-aegis-gradient">
      <motion.div className="mx-auto max-w-6xl space-y-8 sm:space-y-9 md:space-y-10">
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
        <header className="flex flex-col gap-5 border-b border-border/30 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7">
          <div className="min-w-0 space-y-2">
            <p className="dashboard-section-label">
              {format(new Date(), "EEEE d MMMM", { locale: locale === "fr" ? fr : enUS })}
            </p>
            <h1 className="font-cormorant text-2xl font-light tracking-tight text-text-primary sm:text-3xl">
              {t("dashboard.pageTitle")}
            </h1>
            <p className="max-w-prose text-sm leading-relaxed text-text-secondary sm:text-base">
              {t("dashboard.welcome")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickLog(true)}
            className="dashboard-cta dashboard-cta--inline shrink-0 font-display text-xs uppercase tracking-wide text-text-primary"
          >
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            <span>{t("dashboard.quickLogCta")}</span>
          </button>
        </header>

        <AssessmentCTA />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5" aria-label={t("dashboard.pageTitle")}>
          <div className="lg:col-span-2">
            <AegisHealthCard score={aegisScore} previous={aegisYesterday} isLoading={aegisLoading} />
          </div>
          <div className="lg:col-span-3">
            <MoodDecisionInsightCard userId={user?.id} />
          </div>
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
              <motion.div key={n.key} variants={kpiItem}>
                <NarrativeKPICard narrative={n} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Hidden trend label (kept to avoid unused-var lint) */}
        <span className="sr-only">{moodTrendLabel}</span>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <NeuralCard variant="premium" className="lg:col-span-2 p-5 md:p-6" glow="blue">
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
          <NeuralCard variant="premium" glow="purple" className="p-5 md:p-6">
            <AIInsights />
          </NeuralCard>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <div>{user ? <HabitsMiniCard userId={user.id} /> : null}</div>
          <ScoreboardWidget />
          <ScoreCard />
        </section>
      </motion.div>

      <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
    </div>
  );
}
