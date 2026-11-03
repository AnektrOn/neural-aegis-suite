import { supabase } from "@/integrations/supabase/client";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import { countAssignedLibraryResources } from "@/lib/library-assignment-count";
import { getDefaultDienChanProtocolName } from "@/pages/dev/dienChan/dienChanProtocols";
import type { Locale } from "@/i18n/translations";
import { computePracticesDailyScore, type PracticesDailyScore } from "./computePracticesDailyScore";
import {
  fetchPracticesHubHabitsToday,
  type PracticesHubHabitsToday,
} from "./fetchPracticesHubHabitsToday";
import {
  fetchPracticesHubToolboxFeatured,
  type PracticesHubToolboxFeatured,
} from "./fetchPracticesHubToolboxFeatured";

export const PRACTICES_PULSE_DECK_LIMIT = 15;

export type PracticesHubStats = {
  habitsDone: number;
  habitsTotal: number;
  habitsToday: PracticesHubHabitsToday;
  toolboxTodoCount: number;
  toolboxFeatured: PracticesHubToolboxFeatured;
  pulseTopCard: PulseCard | null;
  deckCardCount: number;
  pulseSwipedToday: boolean;
  libraryResourceCount: number;
  dienChanProtocolName: string | null;
  dailyScore: PracticesDailyScore;
};

function utcDayBounds(date = new Date()): { start: string; end: string; dateKey: string } {
  const dateKey = date.toISOString().split("T")[0];
  const start = `${dateKey}T00:00:00.000Z`;
  const endDate = new Date(`${dateKey}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = endDate.toISOString();
  return { start, end, dateKey };
}

export function formatPulseTileLine(card: PulseCard | null, maxLen = 48): string | null {
  if (!card) return null;
  const raw = card.title?.trim() || card.problem?.trim() || "";
  if (!raw) return null;
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1).trimEnd()}…`;
}

export async function fetchPracticesHubStats(userId: string, locale: Locale): Promise<PracticesHubStats> {
  const { start, end, dateKey } = utcDayBounds();

  const [
    habitsToday,
    toolboxFeatured,
    toolboxRes,
    toolboxCompletionsRes,
    pulseResult,
    pulseSwipesRes,
    libraryCount,
  ] = await Promise.all([
    fetchPracticesHubHabitsToday(userId, locale, dateKey),
    fetchPracticesHubToolboxFeatured(userId, locale),
    supabase
      .from("toolbox_assignments")
      .select("id, user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive"),
    supabase.from("toolbox_completions").select("assignment_id, status").eq("user_id", userId),
    fetchPulseDeck(locale, PRACTICES_PULSE_DECK_LIMIT),
    supabase
      .from("aegis_user_card_interactions")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", start)
      .lt("created_at", end)
      .limit(1),
    countAssignedLibraryResources(userId, locale),
  ]);

  const habitsTotal = habitsToday.total;
  const habitsDone = habitsToday.done;

  const terminalStatuses = new Set(["completed", "abandoned", "ignored"]);
  const completionByAssignment = new Map<string, string>();
  for (const row of toolboxCompletionsRes.data ?? []) {
    completionByAssignment.set(row.assignment_id, row.status);
  }

  let toolboxTodoCount = 0;
  for (const row of toolboxRes.data ?? []) {
    if (row.user_delivery_status === "waiting") {
      toolboxTodoCount += 1;
      continue;
    }
    const status = completionByAssignment.get(row.id);
    if (!status || !terminalStatuses.has(status)) {
      toolboxTodoCount += 1;
    }
  }

  const deckCardCount = pulseResult.ok ? pulseResult.cards.length : 0;
  const pulseTopCard = pulseResult.ok && pulseResult.cards.length > 0 ? pulseResult.cards[0] : null;
  const pulseSwipedToday = (pulseSwipesRes.data?.length ?? 0) > 0 && !pulseSwipesRes.error;

  const dailyScore = computePracticesDailyScore({
    habitsDone,
    habitsTotal,
    deckCardCount,
    pulseSwipedToday,
  });

  return {
    habitsDone,
    habitsTotal,
    habitsToday,
    toolboxTodoCount,
    toolboxFeatured,
    pulseTopCard,
    deckCardCount,
    pulseSwipedToday,
    libraryResourceCount: libraryCount,
    dienChanProtocolName: getDefaultDienChanProtocolName(),
    dailyScore,
  };
}
