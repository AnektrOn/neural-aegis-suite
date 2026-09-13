import { describe, expect, it } from "vitest";
import { breathOrbExpansion } from "./breathingOrbPatterns";

describe("breathing orb expansion", () => {
  it("expands on inhale and contracts on exhale", () => {
    expect(breathOrbExpansion("breath_in", 0)).toBe(0);
    expect(breathOrbExpansion("breath_in", 1)).toBe(1);
    expect(breathOrbExpansion("breath_out", 0)).toBe(1);
    expect(breathOrbExpansion("breath_out", 1)).toBe(0);
  });

  it("holds full on pause after inhale and empty after exhale", () => {
    expect(breathOrbExpansion("pause1", 0.5)).toBe(1);
    expect(breathOrbExpansion("pause2", 0.5)).toBe(0);
  });
});
