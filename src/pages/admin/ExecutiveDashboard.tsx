import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Users, Brain, Target, ListChecks, Clock, Award } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import ExportPDFButton from "@/components/ExportPDFButton";

const COLORS = ["hsl(180, 70%, 50%)", "hsl(270, 50%, 55%)", "hsl(35, 80%, 55%)"];
const tooltipStyle = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  borderRadius: "12px", color: "hsl(var(--foreground))",
};

interface KPI {
  label: string;
  value: string | number;
  delta: number;
  icon: React.ElementType;
}

export default function ExecutiveDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExecutiveData(); }, []);

  const loadExecutiveData = async () => {
    setLoading(true);
    const now = new Date();
    const thisWeek = new Date(now); thisWeek.setDate(now.getDate() - 7);
    const lastWeek = new Date(thisWeek); lastWeek.setDate(thisWeek.getDate() - 7);

    const [profiles, moodThis, moodLast, decThis, decLast, habThis, habLast, sessThis, sessLast, badges] = await Promise.all([
      supabase.from("profiles").select("id, display_name, company_id"),
      supabase.from("mood_entries" as any).select("value, user_id, logged_at").gte("logged_at", thisWeek.toISOString()),
      supabase.from("mood_entries" as any).select("value, user_id").gte("logged_at", lastWeek.toISOString()).lt("logged_at", thisWeek.toISOString()),
      supabase.from("decisions" as any).select("id, user_id, status").gte("created_at", thisWeek.toISOString()),
      supabase.from("decisions" as any).select("id").gte("created_at", lastWeek.toISOString()).lt("created_at", thisWeek.toISOString()),
      supabase.from("habit_completions" as any).select("id, user_id").gte("completed_date", thisWeek.toISOString().split("T")[0]),
      supabase.from("habit_completions" as any).select("id").gte("completed_date", lastWeek.toISOString().split("T")[0]).lt("completed_date", thisWeek.toISOString().split("T")[0]),
      supabase.from("user_sessions" as any).select("user_id, started_at, duration_seconds").gte("started_at", thisWeek.toISOString()),
      supabase.from("user_sessions" as any).select("id").gte("started_at", lastWeek.toISOString()).lt("started_at", thisWeek.toISOString()),
      supabase.from("user_badges" as any).select("id").gte("earned_at", thisWeek.toISOString()),
    ]);

    const allProfiles = (profiles.data || []) as any[];
    const mT = (moodThis.data || []) as any[];
    const mL = (moodLast.data || []) as any[];
    const dT = (decThis.data || []) as any[];
    const dL = (decLast.data || []) as any[];
    const hT = (habThis.data || []) as any[];
    const hL = (habLast.data || []) as any[];
    const sT = (sessThis.data || []) as any[];
    const sL = (sessLast.data || []) as any[];
    const bT = (badges.data || []) as any[];

    const avgMood = mT.length ? +(mT.reduce((s, m) => s + m.value, 0) / mT.length).toFixed(1) : 0;
    const avgMoodLast = mL.length ? +(mL.reduce((s, m) => s + m.value, 0) / mL.length).toFixed(1) : 0;
    const delta = (n: number, o: number) => o === 0 ? 0 : Math.round(((n - o) / o) * 100);

    // Active users this week
    const activeUsers = new Set([...mT.map(m => m.user_id), ...dT.map(d => d.user_id), ...hT.map(h => h.user_id), ...sT.map(s => s.user_id)]);

    setKpis([
      { label: "Humeur moyenne", value: avgMood, delta: +(avgMood - avgMoodLast).toFixed(1), icon: Brain },
      { label: "Utilisateurs actifs", value: activeUsers.size, delta: delta(activeUsers.size, allProfiles.length), icon: Users },
      { label: "Décisions cette semaine", value: dT.length, delta: delta(dT.length, dL.length), icon: Target },
      { label: "Habitudes complétées", value: hT.length, delta: delta(hT.length, hL.length), icon: ListChecks },
      { label: "Sessions", value: sT.length, delta: delta(sT.length, sL.length), icon: Clock },
      { label: "Badges débloqués", value: bT.length, delta: 0, icon: Award },
    ]);

    // Build daily mood trend for the week
    const dayMap = new Map<string, number[]>();
    mT.forEach((m: any) => {
      const day = new Date(m.logged_at).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(m.value);
    });
    setWeeklyTrend(Array.from(dayMap.entries()).map(([day, vals]) => ({
      day, humeur: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
    })));

    // Top 5 most active users
    const userActivity = new Map<string, number>();
    [...mT, ...dT, ...hT].forEach((item: any) => {
      userActivity.set(item.user_id, (userActivity.get(item.user_id) || 0) + 1);
    });
    const sorted = Array.from(userActivity.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    setTopUsers(sorted.map(([uid, count]) => {
      const profile = allProfiles.find((p: any) => p.id === uid);
      return { name: profile?.display_name || "—", actions: count };
    }));

    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Tableau Exécutif</h1>
        </div>
        <ExportPDFButton targetRef={reportRef as React.RefObject<HTMLDivElement>} filename="rapport-executif" />
      </div>

      <div ref={reportRef} className="space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="ethereal-glass p-5">
              <kpi.icon size={14} strokeWidth={1.5} className="text-primary mb-3" />
              <p className="text-xl font-cinzel text-foreground">{kpi.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {kpi.delta > 0 ? <TrendingUp size={10} className="text-primary" /> :
                 kpi.delta < 0 ? <TrendingDown size={10} className="text-destructive" /> :
                 <Minus size={10} className="text-muted-foreground" />}
                <span className={`text-[10px] ${kpi.delta > 0 ? "text-primary" : kpi.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {kpi.delta > 0 ? `+${kpi.delta}` : kpi.delta}
                </span>
              </div>
              <p className="text-neural-label mt-2">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 ethereal-glass p-6">
            <p className="text-neural-label mb-4">Tendance humeur cette semaine</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="humeur" stroke={COLORS[0]} strokeWidth={2} fill="url(#moodGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Users */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
            <p className="text-neural-label mb-4">Top 5 utilisateurs actifs</p>
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-cinzel">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{u.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-cinzel">{u.actions}</span>
                </div>
              ))}
              {topUsers.length === 0 && <p className="text-sm text-muted-foreground">Aucune activité cette semaine</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
