import { supabase } from "@/integrations/supabase/client";

export interface ToolboxCompletionPayload {
  elapsedSec: number;
  durationBudgetSec?: number;
}

export type ToolboxOnComplete = (payload?: ToolboxCompletionPayload) => void;
export type ToolboxOnAbandon = (payload?: ToolboxCompletionPayload) => void;

export async function upsertToolboxCompletion(params: {
  assignmentId: string;
  userId: string;
  status: "completed" | "abandoned" | "ignored";
  payload?: ToolboxCompletionPayload;
}): Promise<{ error: string | null }> {
  try {
    const budgetMin =
      params.payload?.durationBudgetSec != null && params.payload.durationBudgetSec > 0
        ? Math.max(1, Math.round(params.payload.durationBudgetSec / 60))
        : null;

    const baseRow = {
      assignment_id: params.assignmentId,
      user_id: params.userId,
      status: params.status,
      completed_at: new Date().toISOString(),
    };

    let { data: existing } = await supabase
      .from("toolbox_completions" as never)
      .select("status, completion_count")
      .eq("assignment_id", params.assignmentId)
      .maybeSingle();

    const existingRow = existing as { status?: string; completion_count?: number } | null;
    const nextCount =
      params.status === "completed" && existingRow?.status === "completed"
        ? (existingRow.completion_count ?? 1) + 1
        : existingRow?.completion_count ?? 1;

    const fullRow = {
      ...baseRow,
      completion_count: params.status === "completed" ? nextCount : existingRow?.completion_count ?? 1,
      elapsed_sec:
        params.payload?.elapsedSec != null && params.payload.elapsedSec >= 0
          ? Math.floor(params.payload.elapsedSec)
          : null,
      duration_budget_min: budgetMin,
    };

    let upsertResult = await supabase.from("toolbox_completions" as never).upsert(
      fullRow as never,
      { onConflict: "assignment_id" },
    );

    let error = upsertResult.error;

    if (error && /elapsed_sec|duration_budget_min|completion_count/i.test(error.message)) {
      console.warn("[toolbox-completion] extended columns unavailable, fallback upsert");
      ({ error } = await supabase.from("toolbox_completions" as never).upsert(
        baseRow as never,
        { onConflict: "assignment_id" },
      ));
    }

    if (error) {
      console.error("[toolbox-completion] upsert failed:", error.message);
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error("[toolbox-completion] critical error:", err);
    return { error: "unexpected_error" };
  }
}

export function formatElapsedMinutes(elapsedSec: number | null | undefined, locale: "fr" | "en" = "fr"): string {
  if (elapsedSec == null || elapsedSec <= 0) return locale === "fr" ? "—" : "—";
  const min = Math.max(1, Math.round(elapsedSec / 60));
  return locale === "fr" ? `${min} min` : `${min} min`;
}
