import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildDailyMoodSeries, computeMoodWeekTrend } from "@/lib/moodSeries";
import { resolveAssignedHabitDisplays } from "@/lib/assigned-habit-display";
import type { Locale } from "@/i18n/translations";

const todayStr = () => new Date().toISOString().split("T")[0];

function getSevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export async function fetchDashboardStats(userId: string) {
  const sevenDaysAgo = getSevenDaysAgo();
  const today = todayStr();
  const [moodRes, decRes, decOldestRes, habitRes, contactRes, lastTouchRes] = await Promise.all([
    supabase.from("mood_entries" as any).select("value").eq("user_id", userId).gte("logged_at", sevenDaysAgo.toISOString()),
    supabase.from("decisions" as any).select("id, name, priority, status").eq("user_id", userId).eq("status", "pending").order("priority", { ascending: false }).limit(3),
    supabase.from("decisions" as any).select("created_at").eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: true }).limit(1),
    supabase.from("habit_completions" as any).select("id").eq("user_id", userId).eq("completed_date", today),
    supabase.from("people_contacts" as any).select("id").eq("user_id", userId),
    supabase.from("relation_quality_history" as any).select("recorded_at").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(1),
  ]);
  const moods = (moodRes.data as any[] || []);
  const avg = moods.length > 0 ? (moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1) : "—";
  const oldest = (decOldestRes.data as any[] | null)?.[0]?.created_at;
  const lastTouch = (lastTouchRes.data as any[] | null)?.[0]?.recorded_at;
  return {
    moodAvg: avg,
    openDecisions: String((decRes.data || []).length),
    habitsDone: String((habitRes.data || []).length),
    contacts: String((contactRes.data || []).length),
    decisions: (decRes.data as any[]) || [],
    oldestDecisionDays: oldest ? Math.max(0, Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000)) : 0,
    lastContactDays: lastTouch ? Math.max(0, Math.floor((Date.now() - new Date(lastTouch).getTime()) / 86400000)) : 999,
  };
}

export async function fetchDashboardDigest(userId: string) {
  const now = new Date();
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const [thisWeekMood, lastWeekMood, habitsRes, decisionsRes, journalRes] = await Promise.all([
    supabase.from("mood_entries" as any).select("value, logged_at").eq("user_id", userId).gte("logged_at", thisWeekStart.toISOString()),
    supabase.from("mood_entries" as any).select("value").eq("user_id", userId).gte("logged_at", lastWeekStart.toISOString()).lt("logged_at", thisWeekStart.toISOString()),
    supabase.from("habit_completions" as any).select("completed_date").eq("user_id", userId).gte("completed_date", thisWeekStart.toISOString().split("T")[0]),
    supabase.from("decisions" as any).select("status").eq("user_id", userId).eq("status", "decided").gte("decided_at", thisWeekStart.toISOString()),
    supabase.from("journal_entries").select("id").eq("user_id", userId).gte("created_at", thisWeekStart.toISOString()),
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
  const moodSeries = buildDailyMoodSeries((thisWeekMood.data as any[]) ?? [], 7);
  return {
    moodTrend: delta > 0.3 ? "up" as const : delta < -0.3 ? "down" as const : "stable" as const,
    moodDelta: Math.abs(delta),
    habitRate: Math.round((habitDays.size / 7) * 100),
    decisionsResolved: (decisionsRes.data || []).length,
    journalCount: (journalRes.data || []).length,
    streakDays: streak,
    moodSeries,
  };
}

export async function fetchDashboardPeople(userId: string) {
  const { data } = await supabase.from("people_contacts" as any).select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data as any[]) || [];
}

export async function fetchMobileDashboard(userId: string, locale: string) {
  const sevenDaysAgo = getSevenDaysAgo();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const weekStartDate = sevenDaysAgo.toISOString().split("T")[0];
  const today = todayStr();
  const [moodRes, decisionsRes, habitsAssignedRes, completionsRes, journalRes, weekDecisionsRes, weekJournalRes] =
    await Promise.all([
    supabase
      .from("mood_entries" as any)
      .select("value, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", fourteenDaysAgo.toISOString()),
    supabase.from("decisions" as any).select("id, name, priority, status, created_at").eq("user_id", userId).eq("status", "pending").order("priority", { ascending: false }).limit(3),
    supabase.from("assigned_habits" as any).select("id, habit_template_id, toolbox_assignment_id").eq("user_id", userId).eq("is_active", true).limit(5),
    supabase.from("habit_completions" as any).select("assigned_habit_id, completed_date").eq("user_id", userId).gte("completed_date", weekStartDate),
    supabase.from("journal_entries").select("content, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("decisions" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("status", "decided")
      .gte("decided_at", sevenDaysAgo.toISOString()),
    supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString()),
  ]);
  const moods = (moodRes.data as any[] || []);
  const moodsThisWeek = moods.filter((m: any) => new Date(m.logged_at) >= sevenDaysAgo);
  const avg =
    moodsThisWeek.length > 0
      ? (moodsThisWeek.reduce((s: number, m: any) => s + m.value, 0) / moodsThisWeek.length).toFixed(1)
      : "—";
  const { moodTrend, moodDelta } = computeMoodWeekTrend(moods);
  const moodSeries = buildDailyMoodSeries(moodsThisWeek, 7);
  const completedToday = (completionsRes.data as any[] || []).filter((c: any) => c.completed_date === today);
  const completionDates = new Set((completionsRes.data as any[] || []).map((c: any) => c.completed_date));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (completionDates.has(ds)) streak++; else if (i > 0) break;
  }
  const habitDays = new Set((completionsRes.data as any[] || []).map((c: any) => c.completed_date));
  let mobileHabits: Array<{ id: string; name: string; category: string; completed: boolean }> = [];
  if (habitsAssignedRes.data && (habitsAssignedRes.data as any[]).length > 0) {
    const completedTodaySet = new Set(completedToday.map((c: any) => c.assigned_habit_id));
    const resolved = await resolveAssignedHabitDisplays(
      (habitsAssignedRes.data as any[]).map((a: any) => ({
        id: a.id,
        habit_template_id: a.habit_template_id ?? null,
        toolbox_assignment_id: a.toolbox_assignment_id ?? null,
      })),
      userId,
      locale as Locale,
      locale === "fr" ? "Outil toolbox" : "Toolbox exercise",
    );
    mobileHabits = resolved.map((habit) => ({
      ...habit,
      completed: completedTodaySet.has(habit.id),
    }));
  }
  return {
    moodAvg: avg,
    openDecisions: String((decisionsRes.data || []).length),
    habitsDone: String(completedToday.length),
    contacts: "—",
    decisions: (decisionsRes.data as any[]) || [],
    digest: {
      moodTrend,
      moodDelta,
      habitRate: Math.round((habitDays.size / 7) * 100),
      decisionsResolved: (weekDecisionsRes.data || []).length,
      journalCount: (weekJournalRes.data || []).length,
      streakDays: streak,
      moodSeries,
    },
    lastJournalEntry: journalRes.data ? (journalRes.data as { content: string; created_at: string }) : null,
    mobileHabits,
    totalHabits: (habitsAssignedRes.data as any[] || []).length,
  };
}

export function useDashboardData(userId: string | undefined, isMobile: boolean, locale: string) {
  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard-mobile", userId, locale],
        queryFn: () => fetchMobileDashboard(userId!, locale),
        enabled: !!userId && isMobile,
        staleTime: 60_000,
      },
      {
        queryKey: ["dashboard-stats", userId],
        queryFn: () => fetchDashboardStats(userId!),
        enabled: !!userId && !isMobile,
        staleTime: 60_000,
      },
      {
        queryKey: ["dashboard-digest", userId],
        queryFn: () => fetchDashboardDigest(userId!),
        enabled: !!userId && !isMobile,
        staleTime: 60_000,
      },
      {
        queryKey: ["dashboard-people", userId],
        queryFn: () => fetchDashboardPeople(userId!),
        enabled: !!userId && !isMobile,
        staleTime: 60_000,
      },
    ],
  });
  const [mobileQuery, statsQuery, digestQuery, peopleQuery] = results;
  if (isMobile) {
    return {
      isLoading: mobileQuery.isLoading,
      isError: mobileQuery.isError,
      mobile: mobileQuery.data ?? null,
      stats: null as null,
      digest: null as null,
      people: [] as any[],
      refetch: () => mobileQuery.refetch(),
    };
  }
  return {
    isLoading: statsQuery.isLoading || digestQuery.isLoading,
    isError: statsQuery.isError || digestQuery.isError,
    mobile: null as null,
    stats: statsQuery.data ?? null,
    digest: digestQuery.data ?? null,
    people: peopleQuery.data ?? [],
    refetch: () => Promise.all([statsQuery.refetch(), digestQuery.refetch(), peopleQuery.refetch()]),
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
