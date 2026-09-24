import { describe, expect, it } from "vitest";
import { DIEN_CHAN_PROTOCOL_POINT_IDS, missingProtocolCoordinates } from "./dienChanBqcCoordinates";
import { svgPointToUV } from "./dienChanFaceZones";

describe("dienChanBqcCoordinates", () => {
  it("resolves every protocol point id", () => {
    expect(missingProtocolCoordinates()).toEqual([]);
    expect(DIEN_CHAN_PROTOCOL_POINT_IDS.length).toBeGreaterThan(0);
  });

  it("maps glabella 26 to expected UV (livrable A)", () => {
    const { u, v } = svgPointToUV(200, 165);
    expect(u).toBeCloseTo(0.5, 2);
    expect(v).toBeCloseTo(0.7, 2);
  });

  it("maps inner eyebrow 34 bilateral UV", () => {
    const left = svgPointToUV(175, 165);
    const right = svgPointToUV(225, 165);
    expect(left.u).toBeCloseTo(0.38, 2);
    expect(right.u).toBeCloseTo(0.62, 2);
    expect(left.v).toBeCloseTo(0.7, 2);
  });

  it("maps sore throat points 12/14/20 (Notebook LM)", () => {
    const p12 = svgPointToUV(110, 220);
    expect(p12.u).toBeCloseTo(0.07, 2);
    expect(p12.v).toBeCloseTo(0.55, 2);
    const p43 = svgPointToUV(200, 250);
    expect(p43.u).toBeCloseTo(0.5, 2);
    expect(p43.v).toBeCloseTo(0.47, 2);
  });
});
