import { PRACTICES_HUB_TILES, type PracticesHubTileDef } from "@/features/practices-hub/practicesHubTiles";

/** Lab rail — bibliothèque not shipped yet. */
export const PRACTICES_HUB_LAB_TILES: PracticesHubTileDef[] = PRACTICES_HUB_TILES.filter(
  (t) => t.id !== "bibliotheque",
);
