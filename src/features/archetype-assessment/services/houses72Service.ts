/**
 * Service layer for the 72Q "Casting des 12 Maisons" appendix.
 *
 * All Supabase calls live here — no UI imports.
 * Scores are never stored; they are computed at read time.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  scoreHouses72Answers,
  type Houses72Answer,
  type Houses72ScoredResult,
} from "../domain/houses72Scoring";

// ── Raw DB row shape (mirrors the migration) ─────────────────────────────────

interface Houses72ResponseRow {
  id: string;
  user_id: string;
  house: number;
  question_position: number;
  selected_option_position: number;
  intensity: number;
  answered_at: string;
}

// ── Untyped Supabase client helper ────────────────────────────────────────────

type AnySupabase = typeof supabase;

function table(client: AnySupabase = supabase) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).from("houses72_responses");
}

// ── Submit ────────────────────────────────────────────────────────────────────

/**
 * Persist a batch of answers for a user, grouped by house.
 *
 * Multi-select strategy: for each house present in `answers`, we delete all
 * existing rows for that (user_id, house) and then re-insert the current set.
 * This cleanly handles deselections (removed options) without needing a
 * separate "delete option" call from the UI.
 */
export async function submitHouses72Responses(
  userId: string,
  answers: Houses72Answer[],
): Promise<void> {
  if (answers.length === 0) return;

  // Group answers by house
  const byHouse = new Map<number, Houses72Answer[]>();
  for (const a of answers) {
    if (!byHouse.has(a.house)) byHouse.set(a.house, []);
    byHouse.get(a.house)!.push(a);
  }

  for (const [house, houseAnswers] of byHouse.entries()) {
    // 1. Delete all existing rows for this (user_id, house)
    const { error: delError } = await table()
      .delete()
      .eq("user_id", userId)
      .eq("house", house);
    if (delError)
      throw new Error(`houses72Service.submit delete: ${delError.message}`);

    // 2. Re-insert the current set (one row per selected option)
    const now = new Date().toISOString();
    const rows = houseAnswers.map((a) => ({
      user_id: userId,
      house: a.house,
      question_position: a.questionPosition,
      selected_option_position: a.optionPosition,
      intensity: a.intensity,
      answered_at: now,
    }));

    const { error: insError } = await table().insert(rows);
    if (insError)
      throw new Error(`houses72Service.submit insert: ${insError.message}`);
  }
}

// ── Load raw ──────────────────────────────────────────────────────────────────

/**
 * Load all raw answers for a user from the DB.
 * Returns an empty array if the user has no responses yet.
 */
export async function loadHouses72Responses(
  userId: string,
): Promise<Houses72Answer[]> {
  const { data, error } = await table()
    .select(
      "house, question_position, selected_option_position, intensity",
    )
    .eq("user_id", userId)
    .order("house", { ascending: true })
    .order("question_position", { ascending: true });

  if (error) throw new Error(`houses72Service.load: ${error.message}`);
  if (!data) return [];

  return (data as Houses72ResponseRow[]).map((row) => ({
    house: row.house,
    questionPosition: row.question_position,
    optionPosition: row.selected_option_position,
    intensity: Math.min(3, Math.max(1, row.intensity)) as 1 | 2 | 3,
  }));
}

// ── Scored delta ──────────────────────────────────────────────────────────────

/**
 * Load a user's 72Q responses and return the scored pole delta + house breakdown.
 * Returns `null` if the user has no responses yet (no 72Q taken).
 */
export async function getHouses72ScoredDelta(
  userId: string,
): Promise<Houses72ScoredResult | null> {
  const answers = await loadHouses72Responses(userId);
  if (answers.length === 0) return null;
  return scoreHouses72Answers(answers);
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete all 72Q responses for a user (reset / re-take).
 */
export async function deleteHouses72Responses(userId: string): Promise<void> {
  const { error } = await table().delete().eq("user_id", userId);
  if (error) throw new Error(`houses72Service.delete: ${error.message}`);
}

/**
 * Delete responses for a specific house (re-take a single house).
 */
export async function deleteHouseResponses(
  userId: string,
  house: number,
): Promise<void> {
  const { error } = await table()
    .delete()
    .eq("user_id", userId)
    .eq("house", house);
  if (error)
    throw new Error(`houses72Service.deleteHouse: ${error.message}`);
}

// ── Completion check ──────────────────────────────────────────────────────────

/**
 * Return the count of DISTINCT answered questions per house for a user.
 *
 * With multi-select, a single question can produce multiple rows. We count
 * distinct question_position values per house so the UI shows "3/6 questions"
 * rather than "3/6 option selections".
 */
export async function getHouses72CompletionMap(
  userId: string,
): Promise<Record<number, number>> {
  const { data, error } = await table()
    .select("house, question_position")
    .eq("user_id", userId);

  if (error)
    throw new Error(`houses72Service.completionMap: ${error.message}`);
  if (!data) return {};

  // Count distinct (house, question_position) pairs
  const seen = new Set<string>();
  const map: Record<number, number> = {};
  for (const row of data as { house: number; question_position: number }[]) {
    const key = `${row.house}:${row.question_position}`;
    if (!seen.has(key)) {
      seen.add(key);
      map[row.house] = (map[row.house] ?? 0) + 1;
    }
  }
  return map;
}

/**
 * Persist answers for a single house only.
 */
export async function submitHouse72Answers(
  userId: string,
  house: number,
  answers: Houses72Answer[],
): Promise<void> {
  const houseAnswers = answers.filter((a) => a.house === house);
  if (houseAnswers.length === 0) return;
  await submitHouses72Responses(userId, houseAnswers);
}
