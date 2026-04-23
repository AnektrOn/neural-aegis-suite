import { supabase } from "@/integrations/supabase/client";
import type {
  AppendixCategoryWithQuestions,
  AppendixResponse,
} from "./types";

export async function loadAppendix(): Promise<AppendixCategoryWithQuestions[]> {
  const { data: categories, error: catErr } = await supabase
    .from("appendix_categories" as any)
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (catErr) throw catErr;

  const { data: questions, error: qErr } = await supabase
    .from("appendix_questions" as any)
    .select("*")
    .order("position");
  if (qErr) throw qErr;

  const { data: options, error: oErr } = await supabase
    .from("appendix_options" as any)
    .select("id, question_id, position, label_fr, label_en, value")
    .order("position");
  if (oErr) throw oErr;

  const optionsByQ = new Map<string, any[]>();
  (options as any[]).forEach((o) => {
    const arr = optionsByQ.get(o.question_id) || [];
    arr.push(o);
    optionsByQ.set(o.question_id, arr);
  });

  const questionsByCat = new Map<string, any[]>();
  (questions as any[]).forEach((q) => {
    const arr = questionsByCat.get(q.category_id) || [];
    arr.push({ ...q, options: optionsByQ.get(q.id) || [] });
    questionsByCat.set(q.category_id, arr);
  });

  return (categories as any[]).map((c) => ({
    ...c,
    questions: questionsByCat.get(c.id) || [],
  }));
}

export async function loadUserResponses(userId: string): Promise<Map<string, AppendixResponse>> {
  const { data, error } = await supabase
    .from("appendix_responses" as any)
    .select("question_id, selected_option_ids, numeric_value, text_value")
    .eq("user_id", userId);
  if (error) throw error;
  const map = new Map<string, AppendixResponse>();
  (data as any[]).forEach((r) => map.set(r.question_id, r as AppendixResponse));
  return map;
}

export async function upsertResponse(userId: string, response: AppendixResponse): Promise<void> {
  const { error } = await supabase
    .from("appendix_responses" as any)
    .upsert(
      {
        user_id: userId,
        question_id: response.question_id,
        selected_option_ids: response.selected_option_ids,
        numeric_value: response.numeric_value,
        text_value: response.text_value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" }
    );
  if (error) throw error;
}
