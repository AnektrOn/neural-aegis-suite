/**
 * Myss V3 — morphic field vector scoring.
 *
 * Each archetype × polarity cell accumulates resonance density:
 *   S(A/P) = Σ_o ( W(A/P, o) × I_o )
 *
 * @see Cadre d'Évaluation Archétypale Vectoriel (Myss V3)
 */
import { ARCHETYPE_KEYS } from "./archetypes";
import type {
  AnyArchetypeKey,
  ArchetypeKey,
  Polarity,
  PolarityWeight,
  ShadowKey,
} from "./types";

export type MyssV3Dimension =
  | "IDENTITY"
  | "POWER"
  | "RELATIONSHIP"
  | "WORK"
  | "SPIRITUALITY";

export type ArchetypePolarityKey = `${AnyArchetypeKey}/${Polarity}`;

/** Partial vector of impacts keyed as `archetype/polarity`. */
export type ScoringVector = Partial<Record<ArchetypePolarityKey, number>>;

/** 16 morphic fields × 2 polarities — sparse resonance map. */
export type MorphicField = Partial<Record<ArchetypePolarityKey, number>>;

const SURVIVAL_KEYS: ShadowKey[] = ["child", "victim", "saboteur", "prostitute"];

export { SURVIVAL_KEYS };

export function archetypePolarityKey(
  archetype: AnyArchetypeKey,
  polarity: Polarity,
): ArchetypePolarityKey {
  return `${archetype}/${polarity}`;
}

export function scoringVectorToWeights(vector: ScoringVector): PolarityWeight[] {
  const out: PolarityWeight[] = [];
  for (const [key, raw] of Object.entries(vector)) {
    const weight = Number(raw);
    if (!weight) continue;
    const slash = key.lastIndexOf("/");
    if (slash <= 0) continue;
    const archetype = key.slice(0, slash) as AnyArchetypeKey;
    const polarity = key.slice(slash + 1) as Polarity;
    out.push({ archetype, polarity, weight });
  }
  return out;
}

export function weightsToScoringVector(weights: PolarityWeight[]): ScoringVector {
  const out: ScoringVector = {};
  for (const w of weights) {
    const key = archetypePolarityKey(w.archetype, w.polarity);
    out[key] = (out[key] ?? 0) + w.weight;
  }
  return out;
}

/** S(A/P) += W × I for each weight tuple. */
export function accumulateMorphicField(
  weights: PolarityWeight[],
  intensity: number,
  field: MorphicField,
): void {
  const multiplier = Number.isFinite(intensity) ? intensity : 1;
  for (const w of weights) {
    const key = archetypePolarityKey(w.archetype, w.polarity);
    field[key] = (field[key] ?? 0) + w.weight * multiplier;
  }
}

export function polarityWeightsFromLegacy(
  archetypeWeights: Partial<Record<ArchetypeKey, number>> | null | undefined,
  shadowWeights: Partial<Record<ShadowKey, number>> | null | undefined,
): PolarityWeight[] {
  const out: PolarityWeight[] = [];
  for (const [archetype, weight] of Object.entries(archetypeWeights ?? {})) {
    const n = Number(weight);
    if (!n) continue;
    out.push({ archetype: archetype as AnyArchetypeKey, polarity: "light", weight: n });
  }
  for (const [archetype, weight] of Object.entries(shadowWeights ?? {})) {
    const n = Number(weight);
    if (!n) continue;
    out.push({ archetype: archetype as AnyArchetypeKey, polarity: "shadow", weight: n });
  }
  return out;
}

/**
 * @deprecated Pre-V3 projection — ignores survival light poles and skips relative normalization.
 */
export function deriveLegacyScoresRaw(field: MorphicField): {
  archetypeScores: Record<ArchetypeKey, number>;
  shadowSignals: Record<ShadowKey, number>;
} {
  const archetypeScores = ARCHETYPE_KEYS.reduce((acc, k) => {
    const light = field[archetypePolarityKey(k, "light")] ?? 0;
    const shadow = field[archetypePolarityKey(k, "shadow")] ?? 0;
    acc[k] = Math.max(0, light) + Math.max(0, shadow);
    return acc;
  }, {} as Record<ArchetypeKey, number>);

  const shadowSignals = SURVIVAL_KEYS.reduce((acc, k) => {
    acc[k] = field[archetypePolarityKey(k, "shadow")] ?? 0;
    return acc;
  }, {} as Record<ShadowKey, number>);

  return { archetypeScores, shadowSignals };
}

/**
 * Myss V3 — project morphic field onto legacy buckets with relative normalization.
 * Majors: positive resonance density as % of total (sum ≈ 100).
 * Survival: net shadow = max(0, shadow − light) / 1.5 (light integration reduces shadow).
 */
export function deriveLegacyScoresNormalized(field: MorphicField): {
  archetypeScores: Record<ArchetypeKey, number>;
  shadowSignals: Record<ShadowKey, number>;
  /** Pre-normalization major scores (for persistence / debugging). */
  archetypeScoresRaw: Record<ArchetypeKey, number>;
} {
  const rawMajors: Record<string, number> = {};
  const rawSurvivalNet: Record<string, number> = {};
  let totalPoints = 0;

  for (const k of ARCHETYPE_KEYS) {
    const light = field[archetypePolarityKey(k, "light")] ?? 0;
    const shadow = field[archetypePolarityKey(k, "shadow")] ?? 0;
    const val = Math.max(0, light) + Math.max(0, shadow);
    rawMajors[k] = val;
    totalPoints += val;
  }

  for (const k of SURVIVAL_KEYS) {
    const light = field[archetypePolarityKey(k, "light")] ?? 0;
    const shadow = field[archetypePolarityKey(k, "shadow")] ?? 0;
    rawSurvivalNet[k] = Math.max(0, shadow - light) / 1.5;
  }

  const divider = totalPoints > 0 ? totalPoints : 1;
  const archetypeScores = {} as Record<ArchetypeKey, number>;
  const archetypeScoresRaw = {} as Record<ArchetypeKey, number>;
  const shadowSignals = {} as Record<ShadowKey, number>;

  for (const k of ARCHETYPE_KEYS) {
    archetypeScoresRaw[k as ArchetypeKey] = rawMajors[k];
    archetypeScores[k as ArchetypeKey] = (rawMajors[k] / divider) * 100;
  }
  for (const k of SURVIVAL_KEYS) {
    shadowSignals[k as ShadowKey] = rawSurvivalNet[k];
  }

  return { archetypeScores, shadowSignals, archetypeScoresRaw };
}

export function computeMorphicField(
  getWeights: () => Iterable<{ weights: PolarityWeight[]; intensity: number }>,
): MorphicField {
  const field: MorphicField = {};
  for (const { weights, intensity } of getWeights()) {
    accumulateMorphicField(weights, intensity, field);
  }
  return field;
}
