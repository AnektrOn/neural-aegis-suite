import { supabase } from "@/integrations/supabase/client";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { Locale } from "@/i18n/translations";

const PULSE_DECK_MAX = 15;

export interface PersonaTrackingStats {
  pendingDecisions: number;
  peopleCount: number;
  toolboxWaiting: number;
  /** Waiting delivery + assignments without terminal completion */
  toolboxTodo: number;
  pulseCards: number;
}

export async function fetchPersonaTrackingStats(
  userId: string,
  locale: Locale,
): Promise<PersonaTrackingStats> {
  const [decisionsRes, peopleRes, toolboxRes, toolboxCompletionsRes, pulseResult] = await Promise.all([
    supabase
      .from("decisions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("people_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("toolbox_assignments")
      .select("id, user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive"),
    supabase
      .from("toolbox_completions" as never)
      .select("assignment_id, status")
      .eq("user_id", userId),
    fetchPulseDeck(locale, PULSE_DECK_MAX),
  ]);

  if (decisionsRes.error) {
    console.warn("[Persona] pending decisions count failed", decisionsRes.error.message);
  }
  if (peopleRes.error) {
    console.warn("[Persona] people count failed", peopleRes.error.message);
  }
  if (toolboxRes.error) {
    console.warn("[Persona] toolbox count failed", toolboxRes.error.message);
  }

  const terminalStatuses = new Set(["completed", "abandoned", "ignored"]);
  const completionByAssignment = new Map<string, string>();
  for (const row of (toolboxCompletionsRes.data as { assignment_id: string; status: string }[]) ?? []) {
    completionByAssignment.set(row.assignment_id, row.status);
  }

  let toolboxWaiting = 0;
  let toolboxPending = 0;
  for (const row of (toolboxRes.data as { id: string; user_delivery_status: string | null }[]) ?? []) {
    if (row.user_delivery_status === "waiting") {
      toolboxWaiting += 1;
      continue;
    }
    const status = completionByAssignment.get(row.id);
    if (!status || !terminalStatuses.has(status)) toolboxPending += 1;
  }

  return {
    pendingDecisions: decisionsRes.count ?? 0,
    peopleCount: peopleRes.count ?? 0,
    toolboxWaiting,
    toolboxTodo: toolboxWaiting + toolboxPending,
    pulseCards: pulseResult.ok ? pulseResult.cards.length : 0,
  };
}
