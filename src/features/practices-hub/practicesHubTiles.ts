import {
  Headphones,
  Library,
  ListChecks,
  ScanFace,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export type PracticesHubTileId = "habits" | "toolbox" | "pulse" | "bibliotheque" | "dien_chan";

export type PracticesHubTileDef = {
  id: PracticesHubTileId;
  to: string;
  icon: LucideIcon;
  nameKey: TranslationKey;
};

export const PRACTICES_HUB_TILES: PracticesHubTileDef[] = [
  { id: "habits", to: "/habits", icon: ListChecks, nameKey: "nav.habits" },
  { id: "toolbox", to: "/toolbox", icon: Headphones, nameKey: "nav.toolbox" },
  { id: "pulse", to: "/pulse", icon: Sparkles, nameKey: "nav.pulse" },
  { id: "bibliotheque", to: "/bibliotheque", icon: Library, nameKey: "nav.bibliotheque" },
  { id: "dien_chan", to: "/pratiques/dien-chan", icon: ScanFace, nameKey: "hub.feature.dienchan" },
];
