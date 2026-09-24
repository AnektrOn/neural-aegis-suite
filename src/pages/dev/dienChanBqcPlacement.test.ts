import { describe, expect, it } from "vitest";
import { svgPointToUV } from "./dienChanFaceZones";
import { diagramSvgToNdc } from "./dienChanBqcPlacement";

describe("dienChanBqcPlacement", () => {
  const bounds = { left: -0.3, right: 0.3, bottom: -0.4, top: 0.42 };

  it("maps point 124 (hairline) to upper NDC band", () => {
    const left = diagramSvgToNdc(160, 110, bounds);
    const right = diagramSvgToNdc(240, 110, bounds);
    const { v } = svgPointToUV(160, 110);
    expect(v).toBeGreaterThan(0.84);
    expect(left.y).toBeGreaterThan(0.2);
    expect(right.y).toBeCloseTo(left.y, 2);
    expect(left.x).toBeLessThan(right.x);
  });

  it("maps point 0 (ear) to lateral NDC", () => {
    const earL = diagramSvgToNdc(105, 230, bounds);
    const earR = diagramSvgToNdc(295, 230, bounds);
    expect(earL.x).toBeLessThan(0);
    expect(earR.x).toBeGreaterThan(0);
  });
});
