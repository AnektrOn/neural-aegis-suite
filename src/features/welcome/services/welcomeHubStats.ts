import { supabase } from "@/integrations/supabase/client";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { Locale } from "@/i18n/translations";

const PULSE_DECK_LIMIT = 15;

export interface WelcomeHubStats {
  pulseCardCount: number;
  pulseDeckMax: number;
  toolboxWaitingCount: number;
  /** Active + waiting assignments (denominator for waiting progress). */
  toolboxActiveTotal: number;
}

export async function fetchWelcomeHubStats(
  userId: string,
  locale: Locale,
): Promise<WelcomeHubStats> {
  const [pulseResult, toolboxRes] = await Promise.all([
    fetchPulseDeck(locale, PULSE_DECK_LIMIT),
    supabase
      .from("toolbox_assignments")
      .select("user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive"),
  ]);

  const pulseCardCount = pulseResult.ok ? pulseResult.cards.length : 0;

  let toolboxWaitingCount = 0;
  let toolboxActiveTotal = 0;

  if (toolboxRes.error) {
    console.warn("[Welcome] toolbox stats failed", toolboxRes.error.message);
  } else {
    for (const row of (toolboxRes.data as { user_delivery_status: string | null }[]) ?? []) {
      toolboxActiveTotal += 1;
      if (row.user_delivery_status === "waiting") {
        toolboxWaitingCount += 1;
      }
    }
  }

  return {
    pulseCardCount,
    pulseDeckMax: PULSE_DECK_LIMIT,
    toolboxWaitingCount,
    toolboxActiveTotal,
  };
}

export { PULSE_DECK_LIMIT };
