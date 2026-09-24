import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAPPING_FILTER,
  filterMappedPoints,
  getAllMappedPointIds,
} from "./dienChanPointMapping";

describe("dienChanPointMapping", () => {
  it("lists all coordinate-backed point ids", () => {
    const ids = getAllMappedPointIds();
    expect(ids.length).toBeGreaterThan(10);
    expect(ids).toContain(26);
  });

  it("filters by zone when set", () => {
    const base = getAllMappedPointIds();
    const filtered = filterMappedPoints(base, {
      ...DEFAULT_MAPPING_FILTER,
      mode: "zone",
      zoneId: "forehead_center",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(base.length);
  });

  it("liaison includes anchor", () => {
    const base = getAllMappedPointIds();
    const filtered = filterMappedPoints(base, {
      ...DEFAULT_MAPPING_FILTER,
      mode: "liaison",
      liaisonAnchorId: 26,
    });
    expect(filtered).toContain(26);
  });
});
