import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/translations";

export interface AnalyticsData {
  moodData: Array<{ day: string; humeur: number | null }>;
  sleepStressData: Array<{ day: string; sommeil: number | null; stress: number | null; repas: number | null }>;
  habitData: Array<{ jour: string; complétées: number; total: number; taux: number }>;
  decisionData: { pending: number; decided: number; deferred: number; avgPriority: number };
}

async function fetchAnalyticsData(userId: string, locale: Locale): Promise<AnalyticsData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [moodRes, decRes, habitRes, completionRes] = await Promise.all([
    supabase
      .from("mood_entries" as any)
      .select("value, sleep, stress, meals_count, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", thirtyDaysAgo.toISOString())
      .order("logged_at", { ascending: true }),
    supabase.from("decisions" as any).select("status, priority").eq("user_id", userId),
    supabase
      .from("assigned_habits" as any)
      .select("id, habit_template_id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("habit_completions" as any)
      .select("completed_date, assigned_habit_id")
      .eq("user_id", userId)
      .gte("completed_date", thirtyDaysAgo.toISOString().split("T")[0]),
  ]);

  if (moodRes.error) throw moodRes.error;
  if (decRes.error) throw decRes.error;
  if (habitRes.error) throw habitRes.error;
  if (completionRes.error) throw completionRes.error;

  const dayMap = new Map<string, { mood: number[]; sleep: number[]; stress: number[]; meals: number[] }>();
  ((moodRes.data as any[]) || []).forEach((e) => {
    const day = new Date(e.logged_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit" });
    if (!dayMap.has(day)) dayMap.set(day, { mood: [], sleep: [], stress: [], meals: [] });
    const d = dayMap.get(day)!;
    d.mood.push(e.value);
    if (e.sleep != null) d.sleep.push(Number(e.sleep));
    if (e.stress != null) d.stress.push(Number(e.stress));
    if (e.meals_count != null) d.meals.push(e.meals_count);
  });

  const avg = (arr: number[]) => (arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null);
  const moodData: AnalyticsData["moodData"] = [];
  const sleepStressData: AnalyticsData["sleepStressData"] = [];
  dayMap.forEach((v, day) => {
    moodData.push({ day, humeur: avg(v.mood) });
    sleepStressData.push({ day, sommeil: avg(v.sleep), stress: avg(v.stress), repas: avg(v.meals) });
  });

  const decisions = (decRes.data as any[]) || [];
  const decisionData = {
    pending: decisions.filter((d) => d.status === "pending").length,
    decided: decisions.filter((d) => d.status === "decided").length,
    deferred: decisions.filter((d) => d.status === "deferred").length,
    avgPriority: decisions.length
      ? +(decisions.reduce((s, d) => s + d.priority, 0) / decisions.length).toFixed(1)
      : 0,
  };

  const habitCompletions = (completionRes.data as any[]) || [];
  const totalHabits = ((habitRes.data as any[]) || []).length || 1;
  const last7 = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.set(d.toISOString().split("T")[0], 0);
  }
  habitCompletions.forEach((c) => {
    if (last7.has(c.completed_date)) last7.set(c.completed_date, (last7.get(c.completed_date) || 0) + 1);
  });
  const habitData = Array.from(last7.entries()).map(([date, count]) => ({
    jour: new Date(date).toLocaleDateString(dateLocale, { weekday: "short" }),
    complétées: count,
    total: totalHabits,
    taux: Math.round((count / totalHabits) * 100),
  }));

  return { moodData, sleepStressData, habitData, decisionData };
}

export function useAnalyticsData(userId: string | undefined, locale: Locale) {
  return useQuery({
    queryKey: ["analytics", userId, locale],
    queryFn: () => fetchAnalyticsData(userId!, locale),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
