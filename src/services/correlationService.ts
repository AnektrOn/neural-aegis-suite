import { supabase } from "@/integrations/supabase/client";

/**
 * Mood × Decision Intelligence Layer
 * Pure deterministic analytics — no AI.
 * Surfaces correlations between user mood state and decision quality / speed.
 */

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface MoodDecisionCorrelation {
  /** Average mood value on days where the user made (resolved) decisions */
  avg_mood_on_decision_days: number;
  /** Average resolution time across resolved decisions (in days) */
  avg_resolution_time_days: number;
  /** Average mood for fast decisions (resolved < 2 days) */
  fast_decisions_mood_avg: number;
  /** Average mood for slow decisions (resolved > 7 days) */
  slow_decisions_mood_avg: number;
  /** Day of week with the highest resolution rate */
  best_decision_day: WeekDay | null;
  /** Day of week with the lowest resolution rate */
  worst_decision_day: WeekDay | null;
  /** Share of decisions still pending while creator's mood was low (< 5) */
  low_mood_pending_rate: number;
  /** Total resolved decisions analyzed */
  total_resolved: number;
  /** Total decisions analyzed */
  total_decisions: number;
  /** Sample size flag — true when too little data for confidence */
  insufficient_data: boolean;
}

interface DecisionRow {
  id: string;
  status: string;
  created_at: string;
  decided_at: string | null;
}

interface MoodRow {
  value: number;
  logged_at: string;
}

const DAY_KEYS: WeekDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const toDayKey = (iso: string): string => iso.slice(0, 10);

const avg = (values: number[]): number =>
  values.length === 0
    ? 0
    : Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;

/**
 * Compute mood × decision correlation for a given user over a window (default 90 days).
 * Deterministic, no AI.
 */
export async function computeMoodDecisionCorrelation(
  userId: string,
  windowDays = 90,
): Promise<MoodDecisionCorrelation> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);
  const sinceIso = since.toISOString();

  const [decRes, moodRes] = await Promise.all([
    supabase
      .from("decisions")
      .select("id, status, created_at, decided_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso),
    supabase
      .from("mood_entries")
      .select("value, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", sinceIso),
  ]);

  const decisions = (decRes.data ?? []) as DecisionRow[];
  const moods = (moodRes.data ?? []) as MoodRow[];

  // Daily mood index → average mood per day
  const moodByDay = new Map<string, number[]>();
  for (const m of moods) {
    const key = toDayKey(m.logged_at);
    const bucket = moodByDay.get(key) ?? [];
    bucket.push(m.value);
    moodByDay.set(key, bucket);
  }
  const dailyMood = new Map<string, number>();
  moodByDay.forEach((vals, k) => dailyMood.set(k, avg(vals)));

  const resolved = decisions.filter((d) => d.status === "decided" && d.decided_at);
  const pending = decisions.filter((d) => d.status === "pending");

  // Resolution times in days
  const resolutionDays: number[] = resolved.map((d) => {
    const ms = new Date(d.decided_at!).getTime() - new Date(d.created_at).getTime();
    return ms / (1000 * 60 * 60 * 24);
  });

  // Mood on decision (resolved) days
  const moodOnDecisionDays: number[] = [];
  const fastMoods: number[] = [];
  const slowMoods: number[] = [];
  const dayOfWeekStats = new Map<WeekDay, { resolved: number; total: number }>();

  for (const d of resolved) {
    const decidedKey = toDayKey(d.decided_at!);
    const m = dailyMood.get(decidedKey);
    if (typeof m === "number") moodOnDecisionDays.push(m);

    const ms = new Date(d.decided_at!).getTime() - new Date(d.created_at).getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    if (days < 2 && typeof m === "number") fastMoods.push(m);
    if (days > 7 && typeof m === "number") slowMoods.push(m);

    const dow = DAY_KEYS[new Date(d.decided_at!).getDay()];
    const slot = dayOfWeekStats.get(dow) ?? { resolved: 0, total: 0 };
    slot.resolved += 1;
    slot.total += 1;
    dayOfWeekStats.set(dow, slot);
  }
  for (const d of pending) {
    const dow = DAY_KEYS[new Date(d.created_at).getDay()];
    const slot = dayOfWeekStats.get(dow) ?? { resolved: 0, total: 0 };
    slot.total += 1;
    dayOfWeekStats.set(dow, slot);
  }

  // Best / worst decision day = highest / lowest resolution rate (min sample 2)
  let best: WeekDay | null = null;
  let worst: WeekDay | null = null;
  let bestRate = -1;
  let worstRate = 2;
  dayOfWeekStats.forEach((s, day) => {
    if (s.total < 2) return;
    const rate = s.resolved / s.total;
    if (rate > bestRate) {
      bestRate = rate;
      best = day;
    }
    if (rate < worstRate) {
      worstRate = rate;
      worst = day;
    }
  });

  // Low-mood pending rate: % of pending decisions created on a low-mood day
  let lowMoodPending = 0;
  for (const d of pending) {
    const m = dailyMood.get(toDayKey(d.created_at));
    if (typeof m === "number" && m < 5) lowMoodPending += 1;
  }
  const lowMoodPendingRate =
    pending.length === 0 ? 0 : Math.round((lowMoodPending / pending.length) * 100);

  return {
    avg_mood_on_decision_days: avg(moodOnDecisionDays),
    avg_resolution_time_days: avg(resolutionDays),
    fast_decisions_mood_avg: avg(fastMoods),
    slow_decisions_mood_avg: avg(slowMoods),
    best_decision_day: best,
    worst_decision_day: worst,
    low_mood_pending_rate: lowMoodPendingRate,
    total_resolved: resolved.length,
    total_decisions: decisions.length,
    insufficient_data: resolved.length < 3 || moods.length < 5,
  };
}
