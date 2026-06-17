import { describe, it, expect } from "vitest";
import {
  buildV4PoleAnalysis,
  computePoleActivationPercentages,
  computeTotalPolePoints,
} from "../domain/v4PoleAnalysis";
import { poleKey } from "../domain/poleScores";
import type { PoleScores } from "../domain/types";

function scores(partial: Partial<PoleScores>): PoleScores {
  const out = {} as PoleScores;
  for (const k of Object.keys(partial) as (keyof PoleScores)[]) {
    out[k] = partial[k] ?? 0;
  }
  return out;
}

describe("v4PoleAnalysis", () => {
  it("computes activation % as share of total pole points", () => {
    const poleScores = scores({
      [poleKey("sage", "light")]: 6,
      [poleKey("sovereign", "light")]: 4,
      [poleKey("victim", "shadow")]: 10,
    });
    expect(computeTotalPolePoints(poleScores)).toBe(20);
    const activation = computePoleActivationPercentages(poleScores);
    expect(activation[poleKey("sage", "light")]).toBeCloseTo(30);
    expect(activation[poleKey("sovereign", "light")]).toBeCloseTo(20);
    expect(activation[poleKey("victim", "shadow")]).toBeCloseTo(50);
  });

  it("builds light alliance, shadow council, and survival guard slices", () => {
    const poleScores = scores({
      [poleKey("sage", "light")]: 9,
      [poleKey("warrior", "light")]: 3,
      [poleKey("lover", "light")]: 6,
      [poleKey("sage", "shadow")]: 2,
      [poleKey("rebel", "shadow")]: 8,
      [poleKey("magician", "shadow")]: 5,
      [poleKey("child", "light")]: 1,
      [poleKey("child", "shadow")]: 4,
      [poleKey("victim", "shadow")]: 7,
    });
    const analysis = buildV4PoleAnalysis(poleScores);
    expect(analysis.lightAlliance).toHaveLength(3);
    expect(analysis.lightAlliance[0].archetype).toBe("sage");
    expect(analysis.shadowCouncil[0].archetype).toBe("rebel");
    expect(analysis.survivalGuard).toHaveLength(4);
    const child = analysis.survivalGuard.find((g) => g.archetype === "child");
    expect(child?.dominantPole).toBe("shadow");
  });
});
