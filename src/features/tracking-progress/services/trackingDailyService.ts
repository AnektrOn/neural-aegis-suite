/**
 * Tracking Daily Service
 *
 * Manages daily check-in batches (3 questions/day) for each user × perspective.
 *
 * Rotation algorithm:
 *  - Tracks which questions have been asked recently (last 30 days)
 *  - Prioritises questions covering archetypes not recently visited
 *  - Ensures each batch spans 3 different archetypes when possible
 *  - Falls back to least-recently-asked question if pool is exhausted
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  TrackingDailyBatch,
  TrackingDailyResponse,
  TrackingQuestion,
  TrackingResponseValue,
} from "../domain/types";
import { loadQuestionBank } from "./trackingQuestionService";
import { parseTrackingQuestionOptions } from "./trackingQuestionOptions";

const BATCH_SIZE = 3;
const ROTATION_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Batch management
// ---------------------------------------------------------------------------

/**
 * Returns today's batch for the user × perspective.
 * Creates one if it does not exist yet.
 */
export async function ensureDailyBatch(
  userId: string,
  perspectiveId: string,
  dateStr?: string,
): Promise<TrackingDailyBatch & { questions: TrackingQuestion[] }> {
  const today = dateStr ?? new Date().toISOString().split("T")[0];

  // Try to load existing batch
  const { data: existing, error: existingError } = await supabase
    .from("tracking_daily_batches" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("perspective_id", perspectiveId)
    .eq("scheduled_date", today)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const batch = existing as unknown as TrackingDailyBatch;
    let questionIds = batch.question_ids ?? [];

    // Recover batches created before questions were imported
    if (questionIds.length === 0 && batch.status === "pending") {
      questionIds = await selectQuestionsForBatch(userId, perspectiveId, today);
      if (questionIds.length > 0) {
        const { error: updateError } = await supabase
          .from("tracking_daily_batches" as any)
          .update({ question_ids: questionIds })
          .eq("id", batch.id);
        if (updateError) throw updateError;
      }
    }

    const questions = await loadQuestionsForBatch(questionIds);
    return { ...batch, question_ids: questionIds, questions };
  }

  // Create a new batch
  const questionIds = await selectQuestionsForBatch(userId, perspectiveId, today);
  if (questionIds.length === 0) {
    throw new Error("NO_TRACKING_QUESTIONS");
  }

  const { data: created, error } = await supabase
    .from("tracking_daily_batches" as any)
    .insert({
      user_id: userId,
      perspective_id: perspectiveId,
      scheduled_date: today,
      question_ids: questionIds,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  const batch = created as unknown as TrackingDailyBatch;
  const questions = await loadQuestionsForBatch(questionIds);
  return { ...batch, questions };
}

/**
 * Load the batch for today (returns null if none exists).
 * Does NOT create a new batch — use ensureDailyBatch for that.
 */
export async function getTodaysBatch(
  userId: string,
  perspectiveId: string,
): Promise<(TrackingDailyBatch & { questions: TrackingQuestion[] }) | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("tracking_daily_batches" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("perspective_id", perspectiveId)
    .eq("scheduled_date", today)
    .single();

  if (!data) return null;

  const batch = data as unknown as TrackingDailyBatch;
  const questions = await loadQuestionsForBatch(batch.question_ids);
  return { ...batch, questions };
}

/** Load already-submitted responses for a batch. */
export async function getBatchResponses(
  batchId: string,
): Promise<TrackingDailyResponse[]> {
  const { data, error } = await supabase
    .from("tracking_daily_responses" as any)
    .select("*")
    .eq("batch_id", batchId)
    .order("responded_at");

  if (error) throw error;
  return (data ?? []) as unknown as TrackingDailyResponse[];
}

// ---------------------------------------------------------------------------
// Submitting responses
// ---------------------------------------------------------------------------

export async function recordResponse(
  userId: string,
  batchId: string,
  questionId: string,
  value: TrackingResponseValue,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const row: Record<string, unknown> = {
    user_id: userId,
    batch_id: batchId,
    question_id: questionId,
    response_date: today,
  };

  if (value.type === "scale") {
    row.numeric_value = value.numeric_value;
    // Compute weights for scale: map 1..10 → weight contribution
    row.weights_applied = [];
  } else if (value.type === "choice") {
    row.choice_value = value.choice_value;
    row.weights_applied = value.weights_applied ?? [];
  } else {
    row.text_value = value.text_value;
    row.weights_applied = [];
  }

  const { error } = await supabase
    .from("tracking_daily_responses" as any)
    .upsert(row, { onConflict: "batch_id,question_id" });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// History for the analysis engine
// ---------------------------------------------------------------------------

/** Load all tracking responses for a user × perspective in a date range. */
export async function loadResponsesInRange(
  userId: string,
  perspectiveId: string,
  startDate: string,
  endDate: string,
): Promise<Array<TrackingDailyResponse & { question: TrackingQuestion | null }>> {
  // Load batches in range
  const { data: batches, error: batchErr } = await supabase
    .from("tracking_daily_batches" as any)
    .select("id, scheduled_date")
    .eq("user_id", userId)
    .eq("perspective_id", perspectiveId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .eq("status", "answered");

  if (batchErr) throw batchErr;
  if (!batches || batches.length === 0) return [];

  const batchIds = (batches as any[]).map((b) => b.id as string);

  const { data: responses, error: respErr } = await supabase
    .from("tracking_daily_responses" as any)
    .select("*")
    .in("batch_id", batchIds);

  if (respErr) throw respErr;

  const rawResponses = (responses ?? []) as unknown as TrackingDailyResponse[];

  // Hydrate with questions
  const questionIds = [...new Set(rawResponses.map((r) => r.question_id))];
  const questions = await loadQuestionsForBatch(questionIds);
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return rawResponses.map((r) => ({
    ...r,
    question: questionMap.get(r.question_id) ?? null,
  }));
}

/** Streaks / adherence: how many days answered in last N days */
export async function loadAdherenceStats(
  userId: string,
  perspectiveId: string,
  windowDays = 14,
): Promise<{ answeredDays: number; totalDays: number; streak: number }> {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - windowDays * 86400000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabase
    .from("tracking_daily_batches" as any)
    .select("scheduled_date, status")
    .eq("user_id", userId)
    .eq("perspective_id", perspectiveId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: false });

  const batches = (data ?? []) as unknown as Array<{ scheduled_date: string; status: string }>;
  const answeredDays = batches.filter((b) => b.status === "answered").length;

  // Current streak
  let streak = 0;
  for (const b of batches) {
    if (b.status === "answered") streak++;
    else break;
  }

  return { answeredDays, totalDays: windowDays, streak };
}

// ---------------------------------------------------------------------------
// Internal: rotation algorithm
// ---------------------------------------------------------------------------

async function selectQuestionsForBatch(
  userId: string,
  perspectiveId: string,
  today: string,
): Promise<string[]> {
  const windowStart = new Date(Date.now() - ROTATION_WINDOW_DAYS * 86400000)
    .toISOString()
    .split("T")[0];

  const [bank, recentRes] = await Promise.all([
    loadQuestionBank(perspectiveId),
    supabase
      .from("tracking_daily_batches" as any)
      .select("question_ids, scheduled_date")
      .eq("user_id", userId)
      .eq("perspective_id", perspectiveId)
      .gte("scheduled_date", windowStart)
      .lt("scheduled_date", today),
  ]);
  if (bank.length === 0) return [];

  const { data: recentBatches } = recentRes;

  // Build a frequency map: questionId → times used recently
  const usageCount = new Map<string, number>();
  for (const b of (recentBatches ?? []) as any[]) {
    for (const qid of (b.question_ids ?? []) as string[]) {
      usageCount.set(qid, (usageCount.get(qid) ?? 0) + 1);
    }
  }

  // Score each question: lower usage = higher priority
  // Also prioritise diversity across archetypes
  const scored = bank.map((q) => ({
    id: q.id,
    archetype: q.archetype_target ?? "general",
    usage: usageCount.get(q.id) ?? 0,
    weight: q.weight,
  }));

  // Sort by usage (asc) then weight (desc) for tie-breaking
  scored.sort((a, b) => a.usage - b.usage || b.weight - a.weight);

  // Pick BATCH_SIZE questions covering different archetypes when possible
  const selected: string[] = [];
  const usedArchetypes = new Set<string>();

  for (const q of scored) {
    if (selected.length >= BATCH_SIZE) break;
    if (!usedArchetypes.has(q.archetype) || selected.length >= scored.filter((s) => !usedArchetypes.has(s.archetype)).length) {
      selected.push(q.id);
      usedArchetypes.add(q.archetype);
    }
  }

  // Fill remaining slots if diversity constraint prevented filling
  if (selected.length < BATCH_SIZE) {
    for (const q of scored) {
      if (selected.length >= BATCH_SIZE) break;
      if (!selected.includes(q.id)) {
        selected.push(q.id);
      }
    }
  }

  return selected.slice(0, BATCH_SIZE);
}

async function loadQuestionsForBatch(ids: string[]): Promise<TrackingQuestion[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("tracking_questions" as any)
    .select("*")
    .in("id", ids);

  if (error) throw error;

  const raw = (data ?? []) as any[];
  // Preserve original ordering from ids[]
  const byId = new Map(raw.map((q) => [q.id, q]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((q) => ({
      id:               q.id,
      perspective_id:   q.perspective_id,
      external_key:     q.external_key,
      question_fr:      q.question_fr,
      question_en:      q.question_en,
      question_type:    q.question_type,
      scale_min:        q.scale_min ?? 1,
      scale_max:        q.scale_max ?? 10,
      options:          parseTrackingQuestionOptions(q.options),
      archetype_target: q.archetype_target ?? null,
      house_target:     q.house_target ?? null,
      dimension_target: q.dimension_target ?? null,
      weight:           q.weight ?? 1.0,
      is_active:        q.is_active ?? true,
      sort_order:       q.sort_order ?? 0,
    })) as TrackingQuestion[];
}
