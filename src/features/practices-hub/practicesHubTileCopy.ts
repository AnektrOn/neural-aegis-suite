import type { TranslationKey } from "@/i18n/translations";
import type { PracticesHubStats } from "./services/fetchPracticesHubStats";
import { formatPulseTileLine } from "./services/fetchPracticesHubStats";
import type { PracticesHubTileId } from "./practicesHubTiles";

export function practicesHubTileDataLine(
  id: PracticesHubTileId,
  stats: PracticesHubStats | null,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  if (!stats) return "…";
  switch (id) {
    case "habits":
      return t("hub.practices.habitsToday", { done: stats.habitsDone, total: stats.habitsTotal });
    case "toolbox":
      return stats.toolboxTodoCount > 0
        ? t("hub.practices.toolboxInProgress", { count: stats.toolboxTodoCount })
        : t("hub.practices.toolboxNone");
    case "pulse": {
      const line = formatPulseTileLine(stats.pulseTopCard, 120);
      return line ?? t("hub.practices.pulseDeckEmpty");
    }
    case "bibliotheque":
      return t("hub.practices.libraryCount", { count: stats.libraryResourceCount });
    case "dien_chan":
      return stats.dienChanProtocolName ?? t("hub.feature.dienchan");
    default:
      return "";
  }
}

/** Short metric for card header (mock-style « 2 / 5 »). */
export function practicesHubTileMetric(
  id: PracticesHubTileId,
  stats: PracticesHubStats | null,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  if (!stats) return "…";
  switch (id) {
    case "habits":
      return stats.habitsTotal > 0
        ? `${stats.habitsDone} / ${stats.habitsTotal}`
        : stats.habitsDone > 0
          ? String(stats.habitsDone)
          : "0";
    case "toolbox":
      return String(stats.toolboxTodoCount);
    case "pulse": {
      const line = formatPulseTileLine(stats.pulseTopCard, 42);
      return line ?? t("hub.practices.pulseDeckEmpty");
    }
    case "bibliotheque":
      return String(stats.libraryResourceCount);
    case "dien_chan":
      return stats.dienChanProtocolName?.split(/\s+/)[0] ?? "—";
    default:
      return "";
  }
}
