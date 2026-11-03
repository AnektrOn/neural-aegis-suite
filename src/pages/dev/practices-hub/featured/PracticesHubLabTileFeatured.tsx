import type { PracticesHubStats } from "@/features/practices-hub/services/fetchPracticesHubStats";
import type { PracticesHubTileId } from "@/features/practices-hub/practicesHubTiles";
import { PracticesHubLabFeaturedHabits } from "./PracticesHubLabFeaturedHabits";
import { PracticesHubLabFeaturedPulse } from "./PracticesHubLabFeaturedPulse";
import { PracticesHubLabFeaturedToolbox } from "./PracticesHubLabFeaturedToolbox";

type Props = {
  tileId: PracticesHubTileId;
  stats: PracticesHubStats | null;
  loading: boolean;
};

export function PracticesHubLabTileFeatured({ tileId, stats, loading }: Props) {
  switch (tileId) {
    case "habits":
      return <PracticesHubLabFeaturedHabits habits={stats?.habitsToday ?? null} loading={loading} />;
    case "toolbox":
      return (
        <PracticesHubLabFeaturedToolbox featured={stats?.toolboxFeatured ?? null} loading={loading} />
      );
    case "pulse":
      return (
        <PracticesHubLabFeaturedPulse
          card={stats?.pulseTopCard ?? null}
          deckCardCount={stats?.deckCardCount ?? 0}
          loading={loading}
        />
      );
    case "dien_chan":
      return null;
    case "bibliotheque":
      return null;
    default:
      return null;
  }
}
