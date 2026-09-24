import { describe, expect, it } from "vitest";
import { densityRadiusScale } from "./dienChanBqcMarkers3d";

describe("densityRadiusScale", () => {
  it("keeps full size when neighbors are far", () => {
    expect(densityRadiusScale(20)).toBe(1);
    expect(densityRadiusScale(14)).toBe(1);
  });

  it("shrinks markers in tight brow-like clusters", () => {
    expect(densityRadiusScale(3.6)).toBeLessThan(0.5);
    expect(densityRadiusScale(5.8)).toBeLessThan(0.6);
    expect(densityRadiusScale(8)).toBeLessThan(0.75);
  });

  it("is monotonic with distance", () => {
    expect(densityRadiusScale(4)).toBeLessThan(densityRadiusScale(10));
    expect(densityRadiusScale(10)).toBeLessThan(densityRadiusScale(14));
  });
});
