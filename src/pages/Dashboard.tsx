import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Brain, Target, TrendingUp, TrendingDown, Minus,
  Calendar, ChevronRight,
} from "lucide-react";
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
import DecisionsMiniCard from "@/components/DecisionsMiniCard";
import HabitsMiniCard from "@/components/HabitsMiniCard";

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

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ moodAvg: "—", openDecisions: "—", habitsDone: "—", contacts: "—" });
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [totalHabits, setTotalHabits] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadStats();
    loadDigest();
    loadPeople();
    loadTotalHabits();
    // Award badges once per session
    const checked = sessionStorage.getItem("badges_checked");
    if (!checked) {
      checkAndAwardBadges(user.id);
      sessionStorage.setItem("badges_checked", "1");
    }
  }, [user]);

  const loadPeople = async () => {
    const { data } = await supabase.from("people_contacts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setPeople(data as any);
  };

  const loadStats = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [moodRes, decRes, habitRes, contactRes] = await Promise.all([
      supabase.from("mood_entries" as any).select("value").eq("user_id", user!.id).gte("logged_at", sevenDaysAgo.toISOString()),
      supabase.from("decisions" as any).select("id").eq("user_id", user!.id).eq("status", "pending"),
      supabase.from("habit_completions" as any).select("id").eq("user_id", user!.id).eq("completed_date", today),
      supabase.from("people_contacts" as any).select("id").eq("user_id", user!.id),
    ]);

    const moods = (moodRes.data as any[] || []);
    const avg = moods.length > 0
      ? (moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1)
      : "—";

    setStats({
      moodAvg: avg,
      openDecisions: String((decRes.data || []).length),
      habitsDone: String((habitRes.data || []).length),
      contacts: String((contactRes.data || []).length),
    });
  };

  const loadTotalHabits = async () => {
    const { data } = await supabase
      .from("assigned_habits" as any)
      .select("id")
      .eq("user_id", user!.id)
      .eq("is_active", true);
    setTotalHabits((data || []).length);
  };

  const loadDigest = async () => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

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
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (habitDays.has(d.toISOString().split("T")[0])) { streak++; } else if (i > 0) break;
    }

    setDigest({
      moodTrend: delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable",
      moodDelta: Math.abs(delta),
      habitRate: Math.round((habitDays.size / 7) * 100),
      decisionsResolved: (decisionsRes.data || []).length,
      journalCount: (journalRes.data || []).length,
      streakDays: streak,
    });
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === "down") return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  const statCards = [
    { label: t("dashboard.statMood"), value: stats.moodAvg, icon: Brain },
    { label: t("dashboard.statOpenDecisions"), value: stats.openDecisions, icon: Target },
    { label: t("dashboard.statHabitsToday"), value: stats.habitsDone, icon: TrendingUp },
    { label: t("dashboard.statNetwork"), value: stats.contacts, icon: Zap },
  ];

  // ─── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const habitsDone = parseInt(stats.habitsDone) || 0;
    const habitsLabel = totalHabits > 0 ? `${habitsDone}/${totalHabits}` : habitsDone.toString();

    return (
      <div className="space-y-3 max-w-full pb-6 pt-2">
        {/* Date + streak */}
        <div className="flex items-center justify-between">
          <p className="text-[8px] text-muted-foreground/40 tracking-[0.2em] uppercase">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {digest && digest.streakDays > 0 && (
            <span className="text-[9px] text-amber-400/70">{digest.streakDays}j 🔥</span>
          )}
        </div>

        {/* Quick Log CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowQuickLog(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl
                     bg-gradient-to-r from-primary/[0.06] to-accent/[0.06]
                     border border-primary/[0.12] active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Logger maintenant</p>
              <p className="text-[9px] text-muted-foreground/50 tracking-widest">HUMEUR · STRESS · SOMMEIL</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-primary/40 shrink-0" />
        </motion.button>

        {/* 3 stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { value: stats.moodAvg, label: "Humeur moy.", cls: "text-primary" },
            { value: habitsLabel, label: "Habitudes", cls: "text-accent" },
            { value: stats.openDecisions, label: "Décisions", cls: "text-amber-400" },
          ].map((pill) => (
            <div key={pill.label} className="ethereal-glass p-3 text-center">
              <p className={`text-base font-cinzel ${pill.cls}`}>{pill.value}</p>
              <p className="text-[8px] text-muted-foreground/50 uppercase tracking-widest mt-1">{pill.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Decisions — highlighted */}
        <DecisionsMiniCard userId={user!.id} onAddNew={() => navigate("/decisions")} />

        {/* Habits */}
        <HabitsMiniCard userId={user!.id} />

        {/* Quick log modal */}
        <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
      </div>
    );
  }

  // ─── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3">{t("dashboard.welcome")}</p>
        <h1 className="text-neural-title text-2xl sm:text-3xl md:text-4xl text-foreground">{t("dashboard.neuralState")}</h1>
      </div>

      {digest && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={14} strokeWidth={1.5} className="text-primary" />
            <p className="text-neural-label">{t("dashboard.weeklyDigest")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-secondary/20 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <TrendIcon trend={digest.moodTrend} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {digest.moodTrend === "up" ? `+${digest.moodDelta}` : digest.moodTrend === "down" ? `-${digest.moodDelta}` : t("dashboard.stable")}
                </span>
              </div>
              <p className="text-neural-label mt-1">{t("dashboard.moodTrend")}</p>
            </div>
            <div className="bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-xl font-cinzel text-foreground">{digest.habitRate}%</p>
              <p className="text-neural-label mt-1">{t("dashboard.habitRate")}</p>
            </div>
            <div className="bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-xl font-cinzel text-foreground">{digest.decisionsResolved}</p>
              <p className="text-neural-label mt-1">{t("dashboard.decisionsResolved")}</p>
            </div>
            <div className="bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-xl font-cinzel text-foreground">{digest.journalCount}</p>
              <p className="text-neural-label mt-1">{t("dashboard.journalEntries")}</p>
            </div>
            <div className="bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-xl font-cinzel text-foreground">{digest.streakDays}j</p>
              <p className="text-neural-label mt-1">{t("dashboard.streakDays")}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} className="ethereal-glass p-6 group cursor-default">
            <div className="flex items-start justify-between mb-4">
              <stat.icon size={20} strokeWidth={1.5} className="text-primary animate-glow-pulse" />
            </div>
            <p className="text-2xl font-light text-foreground font-cinzel">{stat.value}</p>
            <p className="text-neural-label mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="lg:col-span-3">
          <p className="text-neural-label mb-4">{t("dashboard.neuralMap")}</p>
          <NeuralMap people={people} compact showFilters={false} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="lg:col-span-2 ethereal-glass p-8">
          <div className="flex items-center gap-2 mb-6">
            <Target size={14} strokeWidth={1.5} className="text-primary" />
            <p className="text-neural-label">{t("dashboard.statOpenDecisions")}</p>
          </div>
          <p className="text-4xl font-cinzel text-foreground">{stats.openDecisions}</p>
          <p className="text-neural-label mt-3">{t("dashboard.statNetwork")} — {stats.contacts}</p>
        </motion.div>
      </div>

      <ScoreboardWidget />
      <AIInsights />
      <ScoreCard />
    </div>
  );
}
