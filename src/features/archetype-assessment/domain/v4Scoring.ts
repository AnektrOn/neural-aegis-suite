/**
 * V4 vector scoring — converts option mappings to polarity weights and applies intensity.
 */
import { accumulateMorphicField } from "./morphicField";
import { morphicFieldToPoleScores } from "./poleScores";
import { iterResponseSelections } from "./responseSelection";
import type { MorphicField } from "./morphicField";
import type {
  ArchetypeKey,
  Polarity,
  PolarityWeight,
  PoleScores,
  ResponseValue,
  RuntimeQuestion,
  V4VectorMapping,
  V4VectorSlot,
} from "./types";

export const SCORING_MODEL_MYSS_V4 = "myss-v4";

export function v4VectorToPolarityWeights(vector: V4VectorMapping): PolarityWeight[] {
  const slots = [
    vector.primaryLight,
    vector.secondaryLight,
    vector.primaryShadow,
    vector.secondaryShadow,
  ];
  return slots
    .filter((s) => s.points > 0)
    .map((s) => ({
      archetype: s.archetype,
      polarity: s.polarity,
      weight: s.points,
    }));
}

export function v4Slot(
  archetype: ArchetypeKey,
  polarity: Polarity,
  points: number,
): V4VectorSlot {
  return { archetype, polarity, points };
}

/** Compact builder when slots follow +2L / +1L / +2S / +1S pattern. */
export function v4Vector(
  primaryLight: [ArchetypeKey, number],
  secondaryLight: [ArchetypeKey, number],
  primaryShadow: [ArchetypeKey, number],
  secondaryShadow: [ArchetypeKey, number],
): V4VectorMapping {
  return {
    primaryLight: v4Slot(primaryLight[0], "light", primaryLight[1]),
    secondaryLight: v4Slot(secondaryLight[0], "light", secondaryLight[1]),
    primaryShadow: v4Slot(primaryShadow[0], "shadow", primaryShadow[1]),
    secondaryShadow: v4Slot(secondaryShadow[0], "shadow", secondaryShadow[1]),
  };
}

/** Fear-only options (Q3-style): shadow poles only, default +2 / +1. */
export function v4FearVector(
  primaryShadow: ArchetypeKey,
  secondaryShadow: ArchetypeKey,
): V4VectorMapping {
  return {
    primaryLight: v4Slot(primaryShadow, "shadow", 0),
    secondaryLight: v4Slot(secondaryShadow, "shadow", 0),
    primaryShadow: v4Slot(primaryShadow, "shadow", 2),
    secondaryShadow: v4Slot(secondaryShadow, "shadow", 1),
  };
}

export function applyV4VectorToField(
  vector: V4VectorMapping,
  intensity: number,
  field: Parameters<typeof accumulateMorphicField>[2],
): void {
  const mult = Math.min(3, Math.max(1, Math.round(intensity)));
  accumulateMorphicField(v4VectorToPolarityWeights(vector), mult, field);
}

/**
 * Score all multi-select V4 answers for one question.
 * Each selection multiplies its option vector (+2/+1 poles) by intensity (1–3).
 */
export function scoreV4ResponseSelections(
  question: RuntimeQuestion,
  response: ResponseValue,
  field: MorphicField,
): void {
  for (const { option, intensity } of iterResponseSelections(question, response)) {
    if (option.polarity_weights?.length > 0) {
      accumulateMorphicField(option.polarity_weights, intensity, field);
    }
  }
}

export function computePoleScoresFromWeights(
  entries: Array<{ weights: PolarityWeight[]; intensity: number }>,
): PoleScores {
  const field: Parameters<typeof accumulateMorphicField>[2] = {};
  for (const { weights, intensity } of entries) {
    accumulateMorphicField(weights, intensity, field);
  }
  return morphicFieldToPoleScores(field);
}
