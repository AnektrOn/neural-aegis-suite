/**
 * Tracking Question Service
 *
 * CRUD operations for the question bank (tracking_questions table).
 * Used by: AdminTrackingHub (import), trackingDailyService (rotation).
 */

import { supabase } from "@/integrations/supabase/client";
import type { TrackingQuestion, TrackingPerspective, ParsedTrackingQuestion } from "../domain/types";
import { parseTrackingMarkdown } from "./trackingMarkdownParser";
import { parseTrackingQuestionOptions } from "./trackingQuestionOptions";

// ---------------------------------------------------------------------------
// Perspectives
// ---------------------------------------------------------------------------

export async function loadPerspectives(): Promise<TrackingPerspective[]> {
  const { data, error } = await supabase
    .from("tracking_perspectives" as any)
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as unknown as TrackingPerspective[];
}

export async function loadPerspectiveBySlug(slug: string): Promise<TrackingPerspective | null> {
  const { data, error } = await supabase
    .from("tracking_perspectives" as any)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as TrackingPerspective;
}

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

export async function loadQuestionBank(perspectiveId: string): Promise<TrackingQuestion[]> {
  const { data, error } = await supabase
    .from("tracking_questions" as any)
    .select("*")
    .eq("perspective_id", perspectiveId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeQuestion) as TrackingQuestion[];
}

export async function loadAllQuestionsAdmin(perspectiveId: string): Promise<TrackingQuestion[]> {
  const { data, error } = await supabase
    .from("tracking_questions" as any)
    .select("*")
    .eq("perspective_id", perspectiveId)
    .order("sort_order");

  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeQuestion) as TrackingQuestion[];
}

function normalizeQuestion(raw: Record<string, unknown>): TrackingQuestion {
  return {
    id:               raw.id as string,
    perspective_id:   raw.perspective_id as string,
    external_key:     raw.external_key as string,
    question_fr:      raw.question_fr as string,
    question_en:      raw.question_en as string,
    question_type:    raw.question_type as TrackingQuestion["question_type"],
    scale_min:        (raw.scale_min as number) ?? 1,
    scale_max:        (raw.scale_max as number) ?? 10,
    options:          parseTrackingQuestionOptions(raw.options),
    archetype_target: (raw.archetype_target as TrackingQuestion["archetype_target"]) ?? null,
    house_target:     (raw.house_target as number) ?? null,
    dimension_target: (raw.dimension_target as TrackingQuestion["dimension_target"]) ?? null,
    weight:           (raw.weight as number) ?? 1.0,
    is_active:        (raw.is_active as boolean) ?? true,
    sort_order:       (raw.sort_order as number) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Import from Markdown
// ---------------------------------------------------------------------------

export interface QuestionImportResult {
  parseErrors: string[];
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}

export async function importQuestionsFromMarkdown(
  perspectiveId: string,
  markdownText: string,
): Promise<QuestionImportResult> {
  const parsed = parseTrackingMarkdown(markdownText);

  if (parsed.questions.length === 0) {
    return {
      parseErrors: parsed.errors,
      inserted: 0,
      updated: 0,
      skipped: 0,
      total: 0,
    };
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Load existing keys to distinguish insert vs update
  const { data: existing } = await supabase
    .from("tracking_questions" as any)
    .select("external_key")
    .eq("perspective_id", perspectiveId);

  const existingKeys = new Set((existing ?? []).map((r: any) => r.external_key as string));

  // Upsert in batches of 20
  const BATCH = 20;
  for (let i = 0; i < parsed.questions.length; i += BATCH) {
    const slice = parsed.questions.slice(i, i + BATCH);
    const rows = slice.map((q, idx) => buildRow(q, perspectiveId, i + idx));

    const { data: upserted, error } = await supabase
      .from("tracking_questions" as any)
      .upsert(rows, { onConflict: "perspective_id,external_key" })
      .select("external_key");

    if (error) {
      parsed.errors.push(`Upsert batch error: ${error.message}`);
      skipped += slice.length;
      continue;
    }

    for (const row of (upserted ?? []) as any[]) {
      if (existingKeys.has(row.external_key)) {
        updated++;
      } else {
        inserted++;
      }
    }
  }

  return {
    parseErrors: parsed.errors,
    inserted,
    updated,
    skipped,
    total: parsed.questions.length,
  };
}

function buildRow(q: ParsedTrackingQuestion, perspectiveId: string, idx: number) {
  return {
    perspective_id:   perspectiveId,
    external_key:     q.external_key,
    question_fr:      q.question_fr,
    question_en:      q.question_en,
    question_type:    q.question_type,
    scale_min:        q.scale_min ?? 1,
    scale_max:        q.scale_max ?? 10,
    options:          q.options ?? [],
    archetype_target: q.archetype_target ?? null,
    house_target:     q.house_target ?? null,
    dimension_target: q.dimension_target ?? null,
    weight:           q.weight ?? 1.0,
    is_active:        true,
    sort_order:       idx,
  };
}

// ---------------------------------------------------------------------------
// Question stats for admin
// ---------------------------------------------------------------------------

export async function loadQuestionStats(perspectiveId: string): Promise<{
  total: number;
  active: number;
  byArchetype: Record<string, number>;
  byHouse: Record<number, number>;
}> {
  const questions = await loadAllQuestionsAdmin(perspectiveId);

  const byArchetype: Record<string, number> = {};
  const byHouse: Record<number, number> = {};

  for (const q of questions) {
    if (q.archetype_target) {
      byArchetype[q.archetype_target] = (byArchetype[q.archetype_target] ?? 0) + 1;
    }
    if (q.house_target) {
      byHouse[q.house_target] = (byHouse[q.house_target] ?? 0) + 1;
    }
  }

  return {
    total: questions.length,
    active: questions.filter((q) => q.is_active).length,
    byArchetype,
    byHouse,
  };
}
