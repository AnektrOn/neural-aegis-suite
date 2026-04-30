/**
 * Deep Dive (70 questions) — service.
 *
 * Source of truth: src/features/archetype-deepdive-v2/domain/questions70.ts
 * Persistence: public.deepdive_responses (keyed by stable codes A1, A1A…).
 *
 * Exposed under the legacy "appendix" namespace because the existing
 * AppendixModal already wires the UI, progress and resume logic.
 */
import { supabase } from "@/integrations/supabase/client";
import { QUESTIONS_70 } from "@/features/archetype-deepdive-v2/domain/questions70";
import { HOUSES as HOUSE_LIST } from "@/features/archetype-deepdive-v2/domain/types";
import type {
  AppendixCategoryWithQuestions,
  AppendixQuestion,
  AppendixResponse,
} from "./types";

export async function loadAppendix(): Promise<AppendixCategoryWithQuestions[]> {
  // Group the 70 questions by Caroline Myss house number.
  const byHouse = new Map<number, AppendixQuestion[]>();
  for (const q of QUESTIONS_70) {
    const list = byHouse.get(q.house) ?? [];
    list.push({
      id: q.id,
      category_id: `house-${q.house}`,
      position: q.position,
      question_type: "single_choice",
      prompt_fr: q.prompt_fr,
      prompt_en: q.prompt_en,
      helper_fr: null,
      helper_en: null,
      is_required: true,
      options: q.options.map((opt, idx) => ({
        id: opt.id,
        question_id: q.id,
        position: idx,
        label_fr: opt.label_fr,
        label_en: opt.label_en,
        value: null,
      })),
    });
    byHouse.set(q.house, list);
  }

  return HOUSE_LIST.filter((h) => byHouse.has(h.number))
    .map((h) => ({
      id: `house-${h.number}`,
      slug: `house-${h.number}`,
      label_fr: `Maison ${h.number} — ${h.label_fr}`,
      label_en: `House ${h.number} — ${h.label_en}`,
      description_fr: h.theme_fr,
      description_en: h.theme_en,
      sort_order: h.number,
      questions: (byHouse.get(h.number) ?? []).sort(
        (a, b) => a.position - b.position
      ),
    }));
}

export async function loadUserResponses(
  userId: string
): Promise<Map<string, AppendixResponse>> {
  const { data, error } = await supabase
    .from("deepdive_responses" as any)
    .select("question_code, option_codes, numeric_value, text_value")
    .eq("user_id", userId);

  if (error) throw error;

  const map = new Map<string, AppendixResponse>();
  for (const row of (data ?? []) as any[]) {
    map.set(row.question_code, {
      question_id: row.question_code,
      selected_option_ids: row.option_codes ?? [],
      numeric_value: row.numeric_value ?? null,
      text_value: row.text_value ?? null,
    });
  }
  return map;
}

export async function upsertResponse(
  userId: string,
  response: AppendixResponse
): Promise<void> {
  const { error } = await supabase
    .from("deepdive_responses" as any)
    .upsert(
      {
        user_id: userId,
        question_code: response.question_id,
        option_codes: response.selected_option_ids ?? [],
        numeric_value: response.numeric_value,
        text_value: response.text_value,
      },
      { onConflict: "user_id,question_code" }
    );

  if (error) throw error;
}
