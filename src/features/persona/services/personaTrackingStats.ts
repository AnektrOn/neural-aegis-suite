import { supabase } from "@/integrations/supabase/client";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { Locale } from "@/i18n/translations";

const PULSE_DECK_MAX = 15;

export interface PersonaTrackingStats {
  pendingDecisions: number;
  peopleCount: number;
  toolboxWaiting: number;
  pulseCards: number;
}

export async function fetchPersonaTrackingStats(
  userId: string,
  locale: Locale,
): Promise<PersonaTrackingStats> {
  const [decisionsRes, peopleRes, toolboxRes, pulseResult] = await Promise.all([
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
      .select("user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive"),
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

  let toolboxWaiting = 0;
  for (const row of (toolboxRes.data as { user_delivery_status: string | null }[]) ?? []) {
    if (row.user_delivery_status === "waiting") toolboxWaiting += 1;
  }

  return {
    pendingDecisions: decisionsRes.count ?? 0,
    peopleCount: peopleRes.count ?? 0,
    toolboxWaiting,
    pulseCards: pulseResult.ok ? pulseResult.cards.length : 0,
  };
}
