import { supabase } from "@/integrations/supabase/client";
import { QUESTIONS_70 } from "@/features/archetype-deepdive-v2/domain/questions70";
import { PORTRAIT_LENS_REGISTRY, type PortraitLensRegistryId } from "./portraitLensRegistry";

export interface LensCompletion {
  answered: number;
  total: number;
}

export type LensCompletionMap = Partial<Record<PortraitLensRegistryId, LensCompletion>>;

const MYSS_CODES = new Set(QUESTIONS_70.map((q) => q.id));

function countByPrefix(codes: Set<string>, prefix: string): number {
  let n = 0;
  for (const code of codes) {
    if (code.startsWith(prefix)) n += 1;
  }
  return n;
}

/** Response counts per analytical lens (completion-based unlock). */
export async function loadLensCompletion(userId: string): Promise<LensCompletionMap> {
  const { data, error } = await supabase
    .from("deepdive_responses")
    .select("question_code")
    .eq("user_id", userId);

  if (error) {
    console.error("[loadLensCompletion]", error.message);
    return {};
  }

  const codes = new Set((data ?? []).map((r) => r.question_code));
  const out: LensCompletionMap = {};

  let myssAnswered = 0;
  for (const code of codes) {
    if (MYSS_CODES.has(code)) myssAnswered += 1;
  }
  out.myss = { answered: myssAnswered, total: QUESTIONS_70.length };

  for (const entry of PORTRAIT_LENS_REGISTRY) {
    if (entry.id === "myss" || entry.id === "tao") continue;
    const answered = entry.questionCodePrefix ? countByPrefix(codes, entry.questionCodePrefix) : 0;
    out[entry.id] = { answered, total: entry.totalQuestions };
  }

  return out;
}

export function lensStatusFromCompletion(
  completion: LensCompletion | undefined,
  opts: { hasPublishedContent?: boolean; contentPartial?: boolean; comingSoon?: boolean },
): "ready" | "partial" | "empty" {
  if (opts.hasPublishedContent) return "ready";
  if (opts.contentPartial) return "partial";
  if (!completion || completion.total <= 0) {
    if (completion && completion.answered > 0) return "partial";
    return "empty";
  }
  if (completion.answered >= completion.total) return "ready";
  if (completion.answered > 0) return "partial";
  return "empty";
}
