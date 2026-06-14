import { supabase } from "@/integrations/supabase/client";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { Locale } from "@/i18n/translations";

const PULSE_DECK_LIMIT = 15;

export interface WelcomeHubStats {
  pulseCardCount: number;
  pulseDeckMax: number;
  toolboxWaitingCount: number;
  /** Waiting + pending assignments without terminal completion */
  toolboxTodoCount: number;
  /** First waiting or pending assignment for deep-link */
  toolboxFocusId: string | null;
  /** Active + waiting assignments (denominator for waiting progress). */
  toolboxActiveTotal: number;
}

export async function fetchWelcomeHubStats(
  userId: string,
  locale: Locale,
): Promise<WelcomeHubStats> {
  const [pulseResult, toolboxRes, toolboxCompletionsRes] = await Promise.all([
    fetchPulseDeck(locale, PULSE_DECK_LIMIT),
    supabase
      .from("toolbox_assignments")
      .select("id, user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive"),
    supabase
      .from("toolbox_completions" as never)
      .select("assignment_id, status")
      .eq("user_id", userId),
  ]);

  const pulseCardCount = pulseResult.ok ? pulseResult.cards.length : 0;

  let toolboxWaitingCount = 0;
  let toolboxTodoCount = 0;
  let toolboxFocusId: string | null = null;
  let toolboxActiveTotal = 0;

  const terminalStatuses = new Set(["completed", "abandoned", "ignored"]);
  const completionByAssignment = new Map<string, string>();
  for (const row of (toolboxCompletionsRes.data as { assignment_id: string; status: string }[]) ?? []) {
    completionByAssignment.set(row.assignment_id, row.status);
  }

  if (toolboxRes.error) {
    console.warn("[Welcome] toolbox stats failed", toolboxRes.error.message);
  } else {
    for (const row of (toolboxRes.data as { id: string; user_delivery_status: string | null }[]) ?? []) {
      toolboxActiveTotal += 1;
      if (row.user_delivery_status === "waiting") {
        toolboxWaitingCount += 1;
        toolboxTodoCount += 1;
        if (!toolboxFocusId) toolboxFocusId = row.id;
        continue;
      }
      const status = completionByAssignment.get(row.id);
      if (!status || !terminalStatuses.has(status)) {
        toolboxTodoCount += 1;
        if (!toolboxFocusId) toolboxFocusId = row.id;
      }
    }
  }

  return {
    pulseCardCount,
    pulseDeckMax: PULSE_DECK_LIMIT,
    toolboxWaitingCount,
    toolboxTodoCount,
    toolboxFocusId,
    toolboxActiveTotal,
  };
}

export { PULSE_DECK_LIMIT };
