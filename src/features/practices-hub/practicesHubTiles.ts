import type { AppIcon } from "@/lib/icons/appIcon";
import {
  Headphones,
  Library,
  ListChecks,
  ScanFace,
  Sparkles,
} from "@/lib/icons/memberNav";
import type { TranslationKey } from "@/i18n/translations";
import { isMemberFeatureVisible } from "@/lib/memberFeatureFlags";

export type PracticesHubTileId = "habits" | "toolbox" | "pulse" | "bibliotheque" | "dien_chan";

export type PracticesHubTileDef = {
  id: PracticesHubTileId;
  to: string;
  icon: AppIcon;
  nameKey: TranslationKey;
};

const ALL_PRACTICES_HUB_TILES: PracticesHubTileDef[] = [
  { id: "habits", to: "/habits", icon: ListChecks, nameKey: "nav.habits" },
  { id: "toolbox", to: "/toolbox", icon: Headphones, nameKey: "nav.toolbox" },
  { id: "pulse", to: "/pulse", icon: Sparkles, nameKey: "nav.pulse" },
  { id: "bibliotheque", to: "/bibliotheque", icon: Library, nameKey: "nav.bibliotheque" },
  { id: "dien_chan", to: "/pratiques/dien-chan", icon: ScanFace, nameKey: "hub.feature.dienchan" },
];

export const PRACTICES_HUB_TILES: PracticesHubTileDef[] = ALL_PRACTICES_HUB_TILES.filter((tile) => {
  if (tile.id === "bibliotheque") return isMemberFeatureVisible("bibliotheque");
  if (tile.id === "dien_chan") return isMemberFeatureVisible("dien_chan");
  return true;
});