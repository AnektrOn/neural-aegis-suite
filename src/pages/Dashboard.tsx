import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Target, TrendingUp, Activity, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ScoreCard from "@/components/ScoreCard";

const dailyActionsList = [
  "Revoir les 3 priorités du jour",
  "Bloc de 15 min de réflexion stratégique",
  "Prendre une décision à fort enjeu avant midi",
  "Faire un point avec un collaborateur direct",
  "Réflexion et journaling du soir",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ moodAvg: "—", openDecisions: "—", habitsDone: "—", contacts: "—" });
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) {
      loadStats();
      loadActions();
    }
  }, [user]);

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
    const avg = moods.length > 0 ? (moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1) : "—";

    setStats({
      moodAvg: avg,
      openDecisions: String((decRes.data || []).length),
      habitsDone: String((habitRes.data || []).length),
      contacts: String((contactRes.data || []).length),
    });
  };

  const loadActions = async () => {
    const { data } = await supabase
      .from("daily_actions" as any)
      .select("action_index")
      .eq("user_id", user!.id)
      .eq("completed_date", today);
    setCompletedActions(new Set((data as any[] || []).map((d) => d.action_index)));
  };

  const toggleAction = async (index: number) => {
    if (!user) return;
    const isCompleted = completedActions.has(index);

    if (isCompleted) {
      await supabase.from("daily_actions" as any).delete().eq("user_id", user.id).eq("action_index", index).eq("completed_date", today);
      setCompletedActions((prev) => { const s = new Set(prev); s.delete(index); return s; });
    } else {
      await supabase.from("daily_actions" as any).insert({ user_id: user.id, action_index: index, completed_date: today } as any);
      setCompletedActions((prev) => new Set(prev).add(index));
    }
  };

  const statCards = [
    { label: "Humeur (moy. 7j)", value: stats.moodAvg, icon: Brain, change: "" },
    { label: "Décisions ouvertes", value: stats.openDecisions, icon: Target, change: "" },
    { label: "Habitudes aujourd'hui", value: stats.habitsDone, icon: TrendingUp, change: "" },
    { label: "Taille du réseau", value: stats.contacts, icon: Zap, change: "" },
  ];

  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3">Bon retour</p>
        <h1 className="text-neural-title text-3xl md:text-4xl text-foreground">Votre État Neural</h1>
      </div>

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="lg:col-span-3 ethereal-glass p-8">
          <p className="text-neural-label mb-4">Progression Neurale</p>
          <div className="relative h-48 flex items-center justify-center">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <line x1="200" y1="100" x2="80" y2="40" stroke="hsl(180 70% 50% / 0.3)" strokeWidth="1" />
              <line x1="200" y1="100" x2="320" y2="50" stroke="hsl(180 70% 50% / 0.2)" strokeWidth="1" />
              <line x1="200" y1="100" x2="100" y2="160" stroke="hsl(270 50% 55% / 0.2)" strokeWidth="1" />
              <line x1="200" y1="100" x2="340" y2="150" stroke="hsl(180 70% 50% / 0.15)" strokeWidth="1" />
              <line x1="200" y1="100" x2="160" y2="30" stroke="hsl(270 50% 55% / 0.15)" strokeWidth="1" />
              <circle cx="200" cy="100" r="12" fill="hsl(180 70% 50% / 0.2)" stroke="hsl(180 70% 50% / 0.5)" strokeWidth="1">
                <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="100" r="4" fill="hsl(180 70% 50%)" />
              {[
                { cx: 80, cy: 40, label: "Focus" },
                { cx: 320, cy: 50, label: "Clarté" },
                { cx: 100, cy: 160, label: "Empathie" },
                { cx: 340, cy: 150, label: "Motivation" },
                { cx: 160, cy: 30, label: "Vision" },
              ].map((node, idx) => (
                <g key={idx}>
                  <circle cx={node.cx} cy={node.cy} r="6" fill="hsl(180 70% 50% / 0.15)" stroke="hsl(180 70% 50% / 0.3)" strokeWidth="0.5">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur={`${3 + idx}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={node.cx} cy={node.cy} r="2" fill="hsl(180 70% 50% / 0.6)" />
                  <text x={node.cx} y={node.cy + 18} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="8" fontFamily="Space Grotesk" letterSpacing="0.15em">{node.label.toUpperCase()}</text>
                </g>
              ))}
            </svg>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="lg:col-span-2 ethereal-glass p-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={14} strokeWidth={1.5} className="text-primary" />
            <p className="text-neural-label">Actions du jour</p>
          </div>
          <div className="space-y-3">
            {dailyActionsList.map((action, i) => {
              const completed = completedActions.has(i);
              return (
                <button key={i} onClick={() => toggleAction(i)} className="flex items-start gap-3 w-full text-left group">
                  <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    completed ? "bg-primary/20 border-primary/40" : "border-primary/20 group-hover:border-primary/40"
                  }`}>
                    {completed ? <Check size={10} className="text-primary" /> : <div className="w-2 h-2 rounded-sm bg-primary/0 group-hover:bg-primary/20 transition-colors" />}
                  </div>
                  <span className={`text-sm leading-relaxed transition-colors ${completed ? "line-through text-muted-foreground/50" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {action}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <ScoreCard />
    </div>
  );
}
