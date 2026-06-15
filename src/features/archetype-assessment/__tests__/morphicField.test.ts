import { describe, expect, it } from "vitest";
import {
  accumulateMorphicField,
  archetypePolarityKey,
  deriveLegacyScoresNormalized,
  deriveLegacyScoresRaw,
  scoringVectorToWeights,
} from "../domain/morphicField";
import { ARCHETYPE_KEYS } from "../domain/archetypes";
import { normalizeScores, detectShadowSignals } from "../domain/scoringEngine";

function normalizedNetMajors(legacy: ReturnType<typeof deriveLegacyScoresNormalized>) {
  const netScores: Record<string, number> = {};
  for (const k of ARCHETYPE_KEYS) {
    netScores[k] = Math.max(
      0,
      (legacy.archetypeScoresRaw[k] ?? 0) - (legacy.archetypeShadowRaw[k] ?? 0),
    );
  }
  return normalizeScores(netScores);
}

describe("morphicField (Myss V3)", () => {
  it("accumulates S(A/P) = W × I per cell", () => {
    const field = {};
    accumulateMorphicField(
      [
        { archetype: "sage", polarity: "light", weight: 1 },
        { archetype: "victim", polarity: "shadow", weight: 0.5 },
      ],
      3,
      field,
    );
    expect(field[archetypePolarityKey("sage", "light")]).toBe(3);
    expect(field[archetypePolarityKey("victim", "shadow")]).toBe(1.5);
  });

  it("records paradoxical coexistence without cancelling poles", () => {
    const field = {};
    accumulateMorphicField(
      [{ archetype: "sovereign", polarity: "light", weight: 1 }],
      2,
      field,
    );
    accumulateMorphicField(
      [{ archetype: "victim", polarity: "shadow", weight: 1 }],
      3,
      field,
    );
    expect(field[archetypePolarityKey("sovereign", "light")]).toBe(2);
    expect(field[archetypePolarityKey("victim", "shadow")]).toBe(3);

    const legacy = deriveLegacyScoresNormalized(field);
    const normalized = normalizedNetMajors(legacy);
    const survival = detectShadowSignals(legacy.survivalShadowRaw, legacy.survivalLightRaw);
    expect(normalized.sovereign).toBe(100);
    expect(survival.victim).toBeCloseTo((3 / 1.5) / 6);
    expect(legacy.archetypeScoresRaw.sovereign).toBe(2);
  });

  it("reduces net survival shadow when light pole is active (integration)", () => {
    const field = {};
    accumulateMorphicField(
      [{ archetype: "victim", polarity: "shadow", weight: 1 }],
      3,
      field,
    );
    accumulateMorphicField(
      [{ archetype: "victim", polarity: "light", weight: 1 }],
      2,
      field,
    );
    const legacy = deriveLegacyScoresNormalized(field);
    const survival = detectShadowSignals(legacy.survivalShadowRaw, legacy.survivalLightRaw);
    expect(survival.victim).toBeCloseTo(Math.max(0, 3 - 2) / 1.5 / 6);
  });

  it("normalizes major archetype scores to sum ≈ 100%", () => {
    const field = {};
    accumulateMorphicField(
      [{ archetype: "sage", polarity: "light", weight: 1 }],
      3,
      field,
    );
    accumulateMorphicField(
      [{ archetype: "sovereign", polarity: "light", weight: 1 }],
      2,
      field,
    );
    const legacy = deriveLegacyScoresNormalized(field);
    const normalized = normalizedNetMajors(legacy);
    const sum = ARCHETYPE_KEYS.reduce((s, k) => s + (normalized[k] ?? 0), 0);
    expect(sum).toBeCloseTo(100);
    expect(normalized.sage).toBeCloseTo(60);
    expect(normalized.sovereign).toBeCloseTo(40);
  });

  it("transfers negative polarity weight to the opposite pole", () => {
    const field = {};
    accumulateMorphicField(
      [{ archetype: "creator", polarity: "light", weight: -1 }],
      2,
      field,
    );
    expect(field[archetypePolarityKey("creator", "light")] ?? 0).toBe(0);
    expect(field[archetypePolarityKey("creator", "shadow")]).toBe(2);
  });

  it("parses scoring vectors from archetype/polarity keys", () => {
    const weights = scoringVectorToWeights({
      "creator/light": 1,
      "saboteur/shadow": -0.25,
    });
    expect(weights).toEqual([
      { archetype: "creator", polarity: "light", weight: 1 },
      { archetype: "saboteur", polarity: "shadow", weight: -0.25 },
    ]);
  });

  it("deriveLegacyScoresRaw keeps pre-V3 shadow-only survival projection", () => {
    const field = {};
    accumulateMorphicField(
      [{ archetype: "victim", polarity: "shadow", weight: 1 }],
      3,
      field,
    );
    const raw = deriveLegacyScoresRaw(field);
    expect(raw.shadowSignals.victim).toBe(3);
  });
});
