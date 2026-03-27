import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Zap, Brain, Target, TrendingUp, TrendingDown, Minus, Plus, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ScoreCard from "@/components/ScoreCard";
import AIInsights from "@/components/AIInsights";
import { checkAndAwardBadges } from "@/lib/badge-engine";
import NeuralMap from "@/components/NeuralMap";
import ScoreboardWidget from "@/components/ScoreboardWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickLogModal from "@/components/QuickLogModal";
import HabitsMiniCard from "@/components/HabitsMiniCard";
import DashboardHero from "@/components/DashboardHero";
import { NeuralCard } from "@/components/ui/neural-card";

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

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  return "à l'instant";
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay, ease: "easeOut" as const },
  style: { willChange: "transform" as const },
});

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
  }, [user, isMobile]);

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

  const loadPeople = async () => {
    const { data } = await supabase.from("people_contacts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setPeople(data as any);
  };

  // ── MOBILE: single consolidated load ────────────────────────────────────────
  const loadMobileData = async () => {
    setLoading(true);
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

        const { data: templates } = await supabase
          .from("habit_templates" as any)
          .select("id, name, category")
          .in("id", templateIds);

        const tMap = new Map((templates as any[] || []).map((t: any) => [t.id, t]));
        setMobileHabits(
          (habitsAssignedRes.data as any[]).map((a: any) => ({
            id: a.id,
            name: tMap.get(a.habit_template_id)?.name ?? "Habitude",
            category: tMap.get(a.habit_template_id)?.category ?? "",
            completed: completedTodaySet.has(a.id),
          }))
        );
        setTotalHabits((habitsAssignedRes.data as any[]).length);
      }
    } catch (e) {
      console.error("Mobile dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── DESKTOP: separate loads ──────────────────────────────────────────────────
  const loadStats = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    try {
      const [moodRes, decRes, habitRes, contactRes] = await Promise.all([
        supabase.from("mood_entries" as any).select("value").eq("user_id", user!.id).gte("logged_at", sevenDaysAgo.toISOString()),
        supabase.from("decisions" as any).select("id, name, priority, status").eq("user_id", user!.id).eq("status", "pending").order("priority", { ascending: false }).limit(3),
        supabase.from("habit_completions" as any).select("id").eq("user_id", user!.id).eq("completed_date", today),
        supabase.from("people_contacts" as any).select("id").eq("user_id", user!.id),
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

  // ─── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const completedHabits = mobileHabits.filter(h => h.completed).length;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
    const streakDays = digest?.streakDays ?? 0;
    const habitsTotal = mobileHabits.length || totalHabits;
    const sessionLabel =
      hour < 12 ? "MATIN" : hour < 18 ? "APRÈS-MIDI" : "SOIRÉE";
    const heroProgress = digest != null ? Math.min(100, Math.max(0, digest.habitRate)) : 75;

    return (
      <div className="mobile-section-gap max-w-full pt-1">
        {/* Streak (date + AEGIS: header AppLayout) */}
        {streakDays > 0 && (
          <motion.div {...fadeUp(0)} className="flex justify-end items-center gap-1.5 min-h-[24px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="font-barlow text-[11px] font-medium text-primary">{streakDays} jours</span>
          </motion.div>
        )}

        {/* Hero — statique, pas d'animation mount */}
        <div>
          <DashboardHero
            greeting={greeting}
            sessionLabel={sessionLabel}
            progress={heroProgress}
          />
        </div>

        {/* Quick Log CTA */}
        {loading ? (
          <div className="skeleton h-[68px] rounded-2xl" />
        ) : (
          <motion.div {...fadeUp(0.02)}>
            <button
              type="button"
              onClick={() => setShowQuickLog(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] border border-primary/25 bg-[hsl(var(--aegis-s1))] active:scale-[0.98] active:opacity-90 transition-all duration-200 select-none"
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-[11px] flex items-center justify-center bg-primary/12 shadow-[inset_0_0_12px_hsl(var(--primary)/0.12)]">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-barlow text-[13px] font-medium text-text-primary leading-tight">
                    Logger maintenant
                  </p>
                  <p className="font-barlow text-[9px] font-medium uppercase tracking-[0.22em] text-text-tertiary/75 mt-1">
                    Humeur · stress · sommeil
                  </p>
                </div>
              </div>
              <span className="text-primary/40 text-xl font-light pl-2">›</span>
            </button>
          </motion.div>
        )}

        {/* 3 KPI pills */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[72px] rounded-[14px]" />
            ))}
          </div>
        ) : (
          <motion.div {...fadeUp(0.03)}>
            <motion.div
            variants={mobileKpiStagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-2"
          >
            <motion.div
              variants={mobileKpiChild}
              className="p-3 text-center rounded-[14px] border-[0.5px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]"
            >
              <p className="font-cormorant text-[22px] font-light leading-none text-primary">{stats.moodAvg}</p>
              <p className="font-barlow text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary/70 mt-2">
                Humeur
              </p>
              <p className="font-barlow text-[9px] text-primary/55 mt-0.5 tabular-nums">
                {digest?.moodTrend === "up"
                  ? `+${digest.moodDelta}`
                  : digest?.moodTrend === "down"
                    ? `−${digest.moodDelta}`
                    : "—"}
              </p>
            </motion.div>
            <motion.div
              variants={mobileKpiChild}
              className="p-3 text-center rounded-[14px] border-[0.5px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]"
            >
              <p className="font-cormorant text-[22px] font-light leading-none text-foreground">
                {habitsTotal > 0 ? `${completedHabits}/${habitsTotal}` : stats.habitsDone}
              </p>
              <p className="font-barlow text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary/70 mt-2">
                Habitudes
              </p>
              <p className="font-barlow text-[9px] text-primary/55 mt-0.5 tabular-nums">
                {digest != null ? `${digest.habitRate}%` : "—"}
              </p>
            </motion.div>
            <motion.div
              variants={mobileKpiChild}
              className="p-3 text-center rounded-[14px] border-[0.5px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]"
            >
              <p
                className={`font-cormorant text-[22px] font-light leading-none ${
                  streakDays > 0 ? "text-warning" : "text-muted-foreground"
                }`}
              >
                {streakDays > 0 ? `${streakDays}j` : stats.openDecisions}
              </p>
              <p className="font-barlow text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary/70 mt-2">
                {streakDays > 0 ? "Série" : "Décisions"}
              </p>
              <p className="font-barlow text-[9px] text-primary/55 mt-0.5 tabular-nums">
                {streakDays > 0 ? "jours" : "ouvertes"}
              </p>
            </motion.div>
          </motion.div>
          </motion.div>
        )}

        {/* Decisions card */}
        {loading ? (
          <div className="skeleton h-[110px] rounded-2xl" />
        ) : (
          <motion.div {...fadeUp(0.04)}>
            <div className="card-interactive ethereal-glass p-4 rounded-[14px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary/80">
                  Décisions en cours
                </p>
                <NavLink
                  to="/decisions"
                  className="font-barlow text-[10px] text-primary/50 hover:text-primary/80 transition-colors tracking-wide"
                >
                  Tout voir →
                </NavLink>
              </div>
              {decisions.length === 0 ? (
                <div className="flex flex-col items-center py-4 gap-2">
                  <Target size={24} strokeWidth={1} className="text-muted-foreground/20" />
                  <p className="font-barlow text-xs text-muted-foreground/40 text-center">Aucune décision en attente</p>
                  <NavLink
                    to="/decisions"
                    className="font-barlow text-[10px] text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-lg tracking-wider uppercase hover:bg-primary/10 transition-colors mt-1"
                  >
                    + Nouvelle décision
                  </NavLink>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/40">
                    {decisions.map((d: any) => {
                      const badge = priorityBadge(d.priority);
                      return (
                        <div key={d.id} className="flex items-center justify-between gap-2 min-h-[40px] py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-[5px] h-[5px] rounded-full bg-primary/85 flex-shrink-0" />
                            <span className="font-barlow text-sm text-foreground/85 truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {d.created_at && (
                              <span className="font-barlow text-[9px] text-muted-foreground/45">{timeAgo(d.created_at)}</span>
                            )}
                            <span className={`font-barlow text-[10px] px-1.5 py-0.5 rounded-md ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <NavLink
                    to="/decisions"
                    className="font-barlow flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 text-[10px] text-primary/60 hover:text-primary tracking-wider uppercase transition-colors"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Nouvelle décision</span>
                  </NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Habits card (inline from mobileHabits state) */}
        {loading ? (
          <div className="skeleton h-[130px] rounded-2xl" />
        ) : mobileHabits.length > 0 ? (
          <motion.div {...fadeUp(0.05)}>
            <div className="card-interactive ethereal-glass p-4 rounded-[14px] border-[0.5px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border-ice))]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary/80">
                  Habitudes du jour
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-barlow text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {completedHabits}/{mobileHabits.length}
                  </span>
                  <NavLink to="/habits" className="p-1 text-muted-foreground/40 hover:text-primary transition-colors">
                    <ArrowUpRight size={13} />
                  </NavLink>
                </div>
              </div>
              <div className="space-y-1">
                {mobileHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3 min-h-[44px] py-1">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
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
                      className={`font-barlow text-sm transition-colors ${
                        habit.completed ? "line-through text-muted-foreground/45" : "text-foreground/85"
                      }`}
                    >
                      {habit.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-[2px] rounded-full mt-3 overflow-hidden bg-border/50">
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
            <div className="rounded-[14px] border-[0.5px] border-[hsl(var(--aegis-border-ice))] overflow-hidden">
              <HabitsMiniCard userId={user!.id} />
            </div>
          </motion.div>
        )}

        {/* Weekly digest (compact) */}
        {!loading && digest && (
          <motion.div {...fadeUp(0.06)}>
            <div className="card-static ethereal-glass p-4 rounded-[14px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]">
              <p className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary/80 mb-3">
                Cette semaine
              </p>
              <div className="grid grid-cols-3 text-center">
                <div className="px-1">
                  <div className="flex items-center justify-center gap-1 mb-1 min-h-[22px]">
                    {digest.moodTrend === "stable" ? (
                      <span className="font-barlow text-[11px] text-muted-foreground/45">stable</span>
                    ) : (
                      <>
                        <span
                          className={`font-barlow text-sm ${
                            digest.moodTrend === "up" ? "text-chart-4" : "text-destructive"
                          }`}
                          aria-hidden
                        >
                          {digest.moodTrend === "up" ? "↑" : "↓"}
                        </span>
                        <span className="font-barlow text-[10px] text-muted-foreground/70 tabular-nums">
                          {digest.moodTrend === "up" ? `+${digest.moodDelta}` : `−${digest.moodDelta}`}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="font-barlow text-[9px] text-muted-foreground/50 tracking-[0.18em] uppercase">Humeur</p>
                </div>
                <div className="border-l border-border/50 px-2">
                  <p className="font-cormorant text-[18px] font-light text-text-primary leading-tight mb-1">
                    {digest.habitRate}%
                  </p>
                  <p className="font-barlow text-[9px] text-muted-foreground/50 tracking-[0.18em] uppercase">Habitudes</p>
                </div>
                <div className="border-l border-border/50 pl-2">
                  <p className="font-cormorant text-[18px] font-light text-text-primary leading-tight mb-1">
                    {streakDays}j
                  </p>
                  <p className="font-barlow text-[9px] text-muted-foreground/50 tracking-[0.18em] uppercase">Série</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Journal preview */}
        {!loading && lastJournalEntry && (
          <motion.div {...fadeUp(0.07)}>
            <NavLink to="/journal" className="block">
              <div
                className="card-interactive ethereal-glass p-4 rounded-[14px] active:scale-[0.98] transition-all duration-150 bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))]"
                style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary/80">
                    Dernière entrée
                  </p>
                  <span className="font-barlow text-[9px] text-muted-foreground/45">
                    {timeAgo(lastJournalEntry.created_at)}
                  </span>
                </div>
                <p className="font-cormorant text-[14px] font-light italic leading-snug line-clamp-2 text-muted-foreground">
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
      ? `+${digest.moodDelta} vs semaine`
      : digest?.moodTrend === "down"
        ? `-${digest.moodDelta} vs semaine`
        : t("dashboard.stable");

  return (
    <div className="min-h-full -mx-6 -mt-6 px-6 pt-6 pb-10 md:-mx-10 md:-mt-10 md:px-10 md:pt-10 bg-aegis-gradient">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-text-tertiary font-display">
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </p>
            <h1 className="text-xl font-display text-text-primary mt-0.5 tracking-tight">Neural Dashboard</h1>
            <p className="text-neural-label mt-2">{t("dashboard.welcome")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickLog(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/15 transition-all duration-200 text-xs tracking-wide uppercase font-medium font-display shrink-0"
          >
            <Plus size={14} strokeWidth={1.5} /> Log rapide
          </button>
        </div>

        <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-3" variants={kpiContainer} initial="initial" animate="animate">
          <motion.div variants={kpiItem}>
            <NeuralCard glow="none" className="flex flex-col gap-1 min-h-[100px]">
              <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                {t("dashboard.statMood")}
              </span>
              <span className="text-2xl font-display text-accent-primary">{loading ? "—" : stats.moodAvg}</span>
              {digest && (
                <span
                  className={`text-[10px] flex items-center gap-1 font-medium ${
                    digest.moodTrend === "up"
                      ? "text-accent-positive"
                      : digest.moodTrend === "down"
                        ? "text-accent-danger"
                        : "text-text-tertiary"
                  }`}
                >
                  <TrendIcon trend={digest.moodTrend} />
                  {moodTrendLabel}
                </span>
              )}
            </NeuralCard>
          </motion.div>
          <motion.div variants={kpiItem}>
            <NeuralCard glow="none" className="flex flex-col gap-1 min-h-[100px]">
              <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                {t("dashboard.statOpenDecisions")}
              </span>
              <span className="text-2xl font-display text-accent-primary">{loading ? "—" : stats.openDecisions}</span>
              <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                <Target size={10} strokeWidth={1.5} /> {t("nav.decisions")}
              </span>
            </NeuralCard>
          </motion.div>
          <motion.div variants={kpiItem}>
            <NeuralCard glow="none" className="flex flex-col gap-1 min-h-[100px]">
              <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                {t("dashboard.statHabitsToday")}
              </span>
              <span className="text-2xl font-display text-accent-secondary">
                {loading ? "—" : `${stats.habitsDone}${totalHabits > 0 ? `/${totalHabits}` : ""}`}
              </span>
              {digest != null && (
                <span className="text-[10px] text-accent-positive flex items-center gap-1">
                  <TrendingUp size={10} strokeWidth={1.5} /> {digest.habitRate}% · {t("dashboard.habitRate")}
                </span>
              )}
            </NeuralCard>
          </motion.div>
          <motion.div variants={kpiItem}>
            <NeuralCard glow="none" className="flex flex-col gap-1 min-h-[100px]">
              <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                {t("dashboard.statNetwork")}
              </span>
              <span className="text-2xl font-display text-text-primary">{loading ? "—" : stats.contacts}</span>
              <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                <Zap size={10} strokeWidth={1.5} />
                {t("nav.people")}
              </span>
            </NeuralCard>
          </motion.div>
          <motion.div variants={kpiItem} className="col-span-2 md:col-span-1">
            <NeuralCard glow="none" className="flex flex-col gap-1 min-h-[100px]">
              <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
                {t("dashboard.streakDays")}
              </span>
              <span className="text-2xl font-display text-accent-warning">
                {digest != null ? `${digest.streakDays}j` : "—"}
              </span>
              <span className="text-[10px] text-accent-positive flex items-center gap-1">
                <Brain size={10} strokeWidth={1.5} /> {digest?.journalCount ?? 0} · {t("dashboard.journalEntries")}
              </span>
            </NeuralCard>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <NeuralCard className="lg:col-span-2 p-4 md:p-5" glow="blue">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 rounded-full bg-accent-primary shrink-0" />
              <h2 className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary">{t("dashboard.neuralMap")}</h2>
            </div>
            <NeuralMap people={people} compact showFilters={false} />
          </NeuralCard>
          <NeuralCard glow="purple" className="p-4 md:p-5">
            <AIInsights />
          </NeuralCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div>{user ? <HabitsMiniCard userId={user.id} /> : null}</div>
          <ScoreboardWidget />
          <ScoreCard />
        </div>
      </div>

      <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
    </div>
  );
}
