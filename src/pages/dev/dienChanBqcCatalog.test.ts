import { describe, expect, it } from "vitest";
import {
  buildBqcPointInsight,
  getBqcPointCatalogEntry,
  summarizePointForStage,
} from "./dienChanBqcCatalog";

describe("dienChanBqcCatalog", () => {
  it("exposes catalog entries for protocol points", () => {
    expect(getBqcPointCatalogEntry(124)?.bookGrid).toBe("H II");
    expect(getBqcPointCatalogEntry(19)?.contraindicatedPregnancy).toBe(true);
  });

  it("merges protocol technique", () => {
    const insight = buildBqcPointInsight(0, "relax");
    expect(insight?.technique).toMatch(/descendant/i);
  });

  it("summarizes for stage overlay", () => {
    const line = summarizePointForStage(26, "relax");
    expect(line).toBeTruthy();
    expect(line).toMatch(/parasympathique|rotation/i);
  });
});
