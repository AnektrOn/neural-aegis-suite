import { describe, expect, it } from "vitest";
import {
  LOGOS_PATH_CATEGORY_SCULPTURE,
  logosPathSculptureIndexFor,
  logosPathSculptureIndicesForPaths,
} from "../logosPathSculptureAssets";

describe("logosPathSculptureAssets", () => {
  it("maps the five real cron categories to five distinct covers", () => {
    const indices = [
      "cap_decision",
      "miroir_relationnel",
      "miroir_ombre",
      "interface_perception",
      "signal_ancrage",
    ].map((category) => logosPathSculptureIndexFor({ category }));

    expect(new Set(indices).size).toBe(5);
    expect(indices).toEqual([
      LOGOS_PATH_CATEGORY_SCULPTURE.cap_decision,
      LOGOS_PATH_CATEGORY_SCULPTURE.miroir_relationnel,
      LOGOS_PATH_CATEGORY_SCULPTURE.miroir_ombre,
      LOGOS_PATH_CATEGORY_SCULPTURE.interface_perception,
      LOGOS_PATH_CATEGORY_SCULPTURE.signal_ancrage,
    ]);
  });

  it("deconflicts covers when three cards are shown together", () => {
    const indices = logosPathSculptureIndicesForPaths([
      { id: "a", category: "cap_decision" },
      { id: "b", category: "miroir_relationnel" },
      { id: "c", category: "interface_perception" },
    ]);
    expect(new Set(indices).size).toBe(3);
  });
});
