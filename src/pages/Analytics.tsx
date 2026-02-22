import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = [
  "hsl(180, 70%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(35, 80%, 55%)",
  "hsl(120, 40%, 50%)",
  "hsl(0, 70%, 50%)",
  "hsl(220, 70%, 60%)",
];

export default function Analytics() {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<any[]>([]);
  const [sleepStressData, setSleepStressData] = useState<any[]>([]);
  const [habitData, setHabitData] = useState<any[]>([]);
  const [decisionData, setDecisionData] = useState<any>({ pending: 0, decided: 0, deferred: 0, avgPriority: 0 });

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [moodRes, decRes, habitRes, completionRes] = await Promise.all([
      supabase
        .from("mood_entries" as any)
        .select("value, sleep, stress, meals_count, logged_at")
        .eq("user_id", user!.id)
        .gte("logged_at", thirtyDaysAgo.toISOString())
        .order("logged_at", { ascending: true }),
      supabase
        .from("decisions" as any)
        .select("status, priority")
        .eq("user_id", user!.id),
      supabase
        .from("assigned_habits" as any)
        .select("id, habit_template_id, is_active")
        .eq("user_id", user!.id)
        .eq("is_active", true),
      supabase
        .from("habit_completions" as any)
        .select("completed_date, assigned_habit_id")
        .eq("user_id", user!.id)
        .gte("completed_date", thirtyDaysAgo.toISOString().split("T")[0]),
    ]);

    // Mood + Sleep + Stress over time (group by day)
    const dayMap = new Map<string, { mood: number[]; sleep: number[]; stress: number[]; meals: number[] }>();
    ((moodRes.data as any[]) || []).forEach((e) => {
      const day = new Date(e.logged_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      if (!dayMap.has(day)) dayMap.set(day, { mood: [], sleep: [], stress: [], meals: [] });
      const d = dayMap.get(day)!;
      d.mood.push(e.value);
      if (e.sleep != null) d.sleep.push(Number(e.sleep));
      if (e.stress != null) d.stress.push(Number(e.stress));
      if (e.meals_count != null) d.meals.push(e.meals_count);
    });

    const moodChartData: any[] = [];
    const sleepStressChartData: any[] = [];
    dayMap.forEach((v, day) => {
      const avg = (arr: number[]) => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
      moodChartData.push({ day, mood: avg(v.mood) });
      sleepStressChartData.push({
        day,
        sleep: avg(v.sleep),
        stress: avg(v.stress),
        meals: avg(v.meals),
      });
    });
    setMoodData(moodChartData);
    setSleepStressData(sleepStressChartData);

    // Decision stats
    const decisions = (decRes.data as any[]) || [];
    const pending = decisions.filter((d) => d.status === "pending").length;
    const decided = decisions.filter((d) => d.status === "decided").length;
    const deferred = decisions.filter((d) => d.status === "deferred").length;
    const avgPriority = decisions.length ? +(decisions.reduce((s, d) => s + d.priority, 0) / decisions.length).toFixed(1) : 0;
    setDecisionData({ pending, decided, deferred, avgPriority });

    // Habit completions over last 7 days
    const habitCompletions = (completionRes.data as any[]) || [];
    const totalHabits = ((habitRes.data as any[]) || []).length || 1;
    const last7 = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.set(d.toISOString().split("T")[0], 0);
    }
    habitCompletions.forEach((c) => {
      if (last7.has(c.completed_date)) {
        last7.set(c.completed_date, (last7.get(c.completed_date) || 0) + 1);
      }
    });
    const habitChartData = Array.from(last7.entries()).map(([date, count]) => ({
      day: new Date(date).toLocaleDateString("fr-FR", { weekday: "short" }),
      completed: count,
      total: totalHabits,
      rate: Math.round((count / totalHabits) * 100),
    }));
    setHabitData(habitChartData);
  };

  const decisionPieData = [
    { name: "Pending", value: decisionData.pending },
    { name: "Decided", value: decisionData.decided },
    { name: "Deferred", value: decisionData.deferred },
  ].filter((d) => d.value > 0);

  const habitRadialData = habitData.length > 0
    ? [{ name: "Avg", rate: Math.round(habitData.reduce((s, d) => s + d.rate, 0) / habitData.length), fill: COLORS[0] }]
    : [];

  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3">Intelligence Hub</p>
        <h1 className="text-neural-title text-3xl text-foreground">Analytics</h1>
      </div>

      {/* Mood over time */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-8">
        <p className="text-neural-label mb-6">Mood Over Time (30d)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
              <Line type="monotone" dataKey="mood" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0], r: 3 }} name="Mood" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sleep & Stress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-8">
          <p className="text-neural-label mb-6">Sleep & Stress Trends</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="sleep" stroke={COLORS[5]} strokeWidth={2} dot={{ r: 2 }} name="Sleep" />
                <Line type="monotone" dataKey="stress" stroke={COLORS[4]} strokeWidth={2} dot={{ r: 2 }} name="Stress" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Meals bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="ethereal-glass p-8">
          <p className="text-neural-label mb-6">Meals Per Day</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="meals" fill={COLORS[2]} radius={[6, 6, 0, 0]} name="Meals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Habits & Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit completion bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1 ethereal-glass p-8">
          <p className="text-neural-label mb-6">Habit Completion (7d)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="completed" fill={COLORS[3]} radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Habit radial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="ethereal-glass p-8 flex flex-col items-center justify-center">
          <p className="text-neural-label mb-6">Avg Completion Rate</p>
          <div className="h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={habitRadialData} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="rate" cornerRadius={10} fill={COLORS[0]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-2xl font-cinzel text-foreground mt-2">
            {habitRadialData.length > 0 ? `${habitRadialData[0].rate}%` : "—"}
          </p>
        </motion.div>

        {/* Decision pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="ethereal-glass p-8">
          <p className="text-neural-label mb-6">Decisions Overview</p>
          {decisionPieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={decisionPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                    {decisionPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No decisions yet</p>
            </div>
          )}
          <div className="text-center mt-2">
            <p className="text-neural-label">Avg Priority</p>
            <p className="text-lg font-cinzel text-foreground">{decisionData.avgPriority}/5</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
