import { pointsCoordinates } from "./dienChanBqcCoordinates";
import { getBqcPointCatalogEntry } from "./dienChanBqcCatalog";
import { POINT_TO_ZONES, type DienChanZoneId } from "./dienChanFaceZones";

export type MappingFilterMode = "all" | "zone" | "organ" | "effect" | "liaison";

export type MappingFilterState = {
  mode: MappingFilterMode;
  zoneId: DienChanZoneId | null;
  organ: string | null;
  effectQuery: string;
  liaisonAnchorId: number | null;
};

export const DEFAULT_MAPPING_FILTER: MappingFilterState = {
  mode: "all",
  zoneId: null,
  organ: null,
  effectQuery: "",
  liaisonAnchorId: null,
};

export function getAllMappedPointIds(): number[] {
  return Object.keys(pointsCoordinates)
    .map((k) => Number(k))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

export function listOrgansForPoints(pointIds: number[]): string[] {
  const set = new Set<string>();
  for (const id of pointIds) {
    const organ = getBqcPointCatalogEntry(id)?.systemOrgan;
    if (organ) set.add(organ);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

export function filterMappedPoints(
  basePointIds: number[],
  filter: MappingFilterState,
): number[] {
  const { mode, zoneId, organ, effectQuery, liaisonAnchorId } = filter;

  if (mode === "all") return basePointIds;

  if (mode === "zone") {
    if (!zoneId) return basePointIds;
    return basePointIds.filter((id) => (POINT_TO_ZONES[id] ?? []).includes(zoneId));
  }

  if (mode === "organ") {
    if (!organ) return basePointIds;
    return basePointIds.filter((id) => getBqcPointCatalogEntry(id)?.systemOrgan === organ);
  }

  if (mode === "effect") {
    const q = effectQuery.trim().toLowerCase();
    if (!q) return basePointIds;
    return basePointIds.filter((id) =>
      (getBqcPointCatalogEntry(id)?.primaryEffects ?? "").toLowerCase().includes(q),
    );
  }

  if (mode === "liaison") {
    if (liaisonAnchorId == null) return basePointIds;
    const anchorZones = POINT_TO_ZONES[liaisonAnchorId] ?? [];
    const anchorOrgan = getBqcPointCatalogEntry(liaisonAnchorId)?.systemOrgan;
    return basePointIds.filter((id) => {
      if (id === liaisonAnchorId) return true;
      const zones = POINT_TO_ZONES[id] ?? [];
      const sharedZone = zones.some((z) => anchorZones.includes(z));
      const sameOrgan =
        anchorOrgan != null && getBqcPointCatalogEntry(id)?.systemOrgan === anchorOrgan;
      return sharedZone || sameOrgan;
    });
  }

  return basePointIds;
}
