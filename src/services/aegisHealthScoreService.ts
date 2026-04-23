import { supabase } from "@/integrations/supabase/client";
import type { AegisHealthScore, UserHealthSummary } from "@/types/aegisHealth";

const TABLE = "aegis_health_scores";
const FLOOR = 5;

const todayISO = (): string => new Date().toISOString().split("T")[0];

const daysAgoISO = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const clamp = (v: number, min = FLOOR, max = 100): number =>
  Math.max(min, Math.min(max, v));

const round2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Compute and persist today's AEGIS Health Score for a user.
 * Deterministic formula — no AI/ML.
 */
export async function computeDailyHealthScore(
  userId: string,
): Promise<AegisHealthScore> {
  const today = todayISO();
  const sevenDaysAgoTs = new Date();
  sevenDaysAgoTs.setDate(sevenDaysAgoTs.getDate() - 7);
  const weekStartIso = sevenDaysAgoTs.toISOString();
  const weekStartDate = daysAgoISO(7);

  const [
    moodRes,
    decisionsRes,
    assignedHabitsRes,
    completionsTodayRes,
    journalRes,
    contactsRes,
    relationHistoryRes,
    yesterdayScoreRes,
  ] = await Promise.all([
    supabase
      .from("mood_entries" as any)
      .select("value, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", weekStartIso),
    supabase
      .from("decisions" as any)
      .select("status, created_at, decided_at")
      .eq("user_id", userId)
      .gte("created_at", weekStartIso),
    supabase
      .from("assigned_habits" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("habit_completions" as any)
      .select("assigned_habit_id, completed_date")
      .eq("user_id", userId)
      .eq("completed_date", today),
    supabase
      .from("journal_entries")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekStartIso),
    supabase
      .from("people_contacts" as any)
      .select("id, updated_at")
      .eq("user_id", userId)
      .gte("updated_at", weekStartIso),
    supabase
      .from("relation_quality_history" as any)
      .select("id, recorded_at")
      .eq("user_id", userId)
      .gte("recorded_at", weekStartIso),
    supabase
      .from(TABLE as any)
      .select("*")
      .eq("user_id", userId)
      .lt("score_date", today)
      .order("score_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const moods = (moodRes.data as Array<{ value: number; logged_at: string }> | null) ?? [];
  const decisions = (decisionsRes.data as Array<{ status: string }> | null) ?? [];
  const assignedHabits = (assignedHabitsRes.data as Array<{ id: string }> | null) ?? [];
  const completionsToday = (completionsTodayRes.data as Array<{ assigned_habit_id: string }> | null) ?? [];
  const journals = (journalRes.data as Array<{ created_at: string }> | null) ?? [];
  const contactLogs = (contactsRes.data as Array<{ updated_at: string }> | null) ?? [];
  const relationLogs = (relationHistoryRes.data as Array<{ recorded_at: string }> | null) ?? [];
  const yesterday = (yesterdayScoreRes.data as AegisHealthScore | null) ?? null;

  // ── Mood: average mood_value scaled 0-100 (mood is 1-10) ──
  const moodScore = moods.length > 0
    ? clamp((moods.reduce((s, m) => s + Number(m.value), 0) / moods.length) * 10)
    : (yesterday ? clamp(yesterday.mood_score * 0.9) : 50);

  // ── Decisions: % resolved over last 7 days ──
  const totalDecisions = decisions.length;
  const resolvedDecisions = decisions.filter((d) => d.status === "decided").length;
  const decisionScore = totalDecisions > 0
    ? clamp((resolvedDecisions / totalDecisions) * 100)
    : (yesterday ? clamp(yesterday.decision_score * 0.9) : 50);

  // ── Habits: completion rate today ──
  const habitScore = assignedHabits.length > 0
    ? clamp((completionsToday.length / assignedHabits.length) * 100)
    : (yesterday ? clamp(yesterday.habit_score * 0.9) : 50);

  // ── Journal: frequency last 7 days ──
  const journalScore = clamp(Math.min(journals.length / 7, 1) * 100);

  // ── Relations: people_contacts updates + quality history logs ──
  const relationLogCount = contactLogs.length + relationLogs.length;
  const relationScore = clamp(Math.min(relationLogCount / 3, 1) * 100);

  // ── Log regularity: distinct days with any log activity (last 7) ──
  const activeDays = new Set<string>();
  moods.forEach((m) => activeDays.add(m.logged_at.split("T")[0]));
  journals.forEach((j) => activeDays.add(j.created_at.split("T")[0]));
  contactLogs.forEach((c) => activeDays.add(c.updated_at.split("T")[0]));
  relationLogs.forEach((r) => activeDays.add(r.recorded_at.split("T")[0]));
  // Include today's habit completions as activity
  if (completionsToday.length > 0) activeDays.add(today);
  // Filter to last 7 days window
  const validDays = Array.from(activeDays).filter((d) => d >= weekStartDate);
  const logRegularity = clamp((validDays.length / 7) * 100);

  // ── Archetype coherence (placeholder, default 50 or carry-over) ──
  const archetypeCoherence = yesterday?.archetype_coherence ?? 50;

  // ── Overall: weighted ──
  let overall =
    moodScore * 0.30 +
    decisionScore * 0.20 +
    habitScore * 0.20 +
    journalScore * 0.15 +
    relationScore * 0.10 +
    logRegularity * 0.05;

  // If user has 0 logs today, decay yesterday by 10% as soft floor
  const hasAnyTodayActivity =
    moods.some((m) => m.logged_at.startsWith(today)) ||
    journals.some((j) => j.created_at.startsWith(today)) ||
    completionsToday.length > 0 ||
    contactLogs.some((c) => c.updated_at.startsWith(today)) ||
    relationLogs.some((r) => r.recorded_at.startsWith(today));

  if (!hasAnyTodayActivity && yesterday) {
    overall = Math.max(overall, yesterday.overall_score * 0.9);
  }

  const overallScore = clamp(overall);

  const payload = {
    user_id: userId,
    score_date: today,
    overall_score: round2(overallScore),
    mood_score: round2(moodScore),
    decision_score: round2(decisionScore),
    habit_score: round2(habitScore),
    journal_score: round2(journalScore),
    relation_score: round2(relationScore),
    archetype_coherence: round2(archetypeCoherence),
    log_regularity: round2(logRegularity),
    computed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE as any)
    .upsert(payload as any, { onConflict: "user_id,score_date" })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as AegisHealthScore;
}

/**
 * Fetch last N days of AEGIS scores for a user, oldest → newest.
 */
export async function getHealthScoreTrend(
  userId: string,
  days: number,
): Promise<AegisHealthScore[]> {
  const since = daysAgoISO(days);
  const { data, error } = await supabase
    .from(TABLE as any)
    .select("*")
    .eq("user_id", userId)
    .gte("score_date", since)
    .order("score_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as AegisHealthScore[];
}

/**
 * Admin-only: fetch every user's latest score with a simple trend direction.
 */
export async function getAdminHealthScores(
  filters?: { companyId?: string; minScore?: number; maxScore?: number },
): Promise<UserHealthSummary[]> {
  // Pull recent scores and reduce to latest per user client-side
  const since = daysAgoISO(14);
  const { data: scores, error: scoreErr } = await supabase
    .from(TABLE as any)
    .select("user_id, score_date, overall_score")
    .gte("score_date", since)
    .order("score_date", { ascending: false });
  if (scoreErr) throw scoreErr;

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name, company_id");
  if (profileErr) throw profileErr;

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as { id: string; display_name: string | null; company_id: string | null }]),
  );

  // Group scores per user
  const byUser = new Map<string, Array<{ score_date: string; overall_score: number }>>();
  (scores ?? []).forEach((s: any) => {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push({ score_date: s.score_date, overall_score: Number(s.overall_score) });
    byUser.set(s.user_id, arr);
  });

  const summaries: UserHealthSummary[] = [];
  byUser.forEach((rows, userId) => {
    const sorted = rows.sort((a, b) => b.score_date.localeCompare(a.score_date));
    const latest = sorted[0];
    const previous = sorted[1];
    const delta = previous ? round2(latest.overall_score - previous.overall_score) : 0;
    const trend: "up" | "down" | "stable" =
      delta > 1 ? "up" : delta < -1 ? "down" : "stable";
    const profile = profileMap.get(userId);

    if (filters?.companyId && profile?.company_id !== filters.companyId) return;
    if (filters?.minScore !== undefined && latest.overall_score < filters.minScore) return;
    if (filters?.maxScore !== undefined && latest.overall_score > filters.maxScore) return;

    summaries.push({
      user_id: userId,
      display_name: profile?.display_name ?? null,
      company_id: profile?.company_id ?? null,
      latest_score: latest.overall_score,
      latest_date: latest.score_date,
      trend,
      delta,
    });
  });

  return summaries.sort((a, b) => b.latest_score - a.latest_score);
}
