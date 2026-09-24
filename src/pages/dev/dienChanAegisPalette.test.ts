import { describe, expect, it } from "vitest";
import { hslToRgb01, readAegisWirePalette } from "./dienChanAegisPalette";

describe("dienChanAegisPalette", () => {
  it("converts Aegis primary HSL to RGB", () => {
    const [r, g, b] = hslToRgb01(24, 48, 65);
    expect(r).toBeGreaterThan(0.7);
    expect(g).toBeGreaterThan(0.55);
    expect(b).toBeGreaterThan(0.45);
  });

  it("returns wire palette with warm markers", () => {
    const p = readAegisWirePalette(false);
    expect(p.markerSpotHex).toBeGreaterThan(0);
    expect(p.wireBaseRgb.every((c) => c >= 0 && c <= 1)).toBe(true);
    expect(p.zoneRgb.every((c) => c >= 0 && c <= 1)).toBe(true);
  });
});
