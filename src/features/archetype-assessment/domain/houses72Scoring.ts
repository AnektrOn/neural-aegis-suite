/**
 * Le Casting des 12 Maisons — scoring engine.
 *
 * Takes raw answers (house + position + option + intensity) and produces:
 *  1. `polesDelta`    — 32-pole PoleScores increment to be added to V4 T1 scores.
 *  2. `houseBreakdown` — per-house top archetype + pole accumulation for Deep Dive.
 *
 * Formula: each option contributes its 4-slot vector × intensity multiplier (1–3).
 */

import { ARCHETYPE_KEYS } from "./archetypes";
import {
  accumulateMorphicField,
  type MorphicField,
} from "./morphicField";
import { emptyPoleScores, morphicFieldToPoleScores, poleKey } from "./poleScores";
import {
  QUESTIONS_HOUSES_72,
  getHouse72Question,
  HOUSES_72_META,
} from "./questionsHouses72";
import { v4VectorToPolarityWeights } from "./v4Scoring";
import type { AnyArchetypeKey, ArchetypeKey, PoleScores } from "./types";

// ── Answer shape ─────────────────────────────────────────────────────────────

export interface Houses72Answer {
  /** Myss house (1–12). */
  house: number;
  /** 1-based question position within house (1–6). */
  questionPosition: number;
  /** 1-based option position (A=1 … F=6). */
  optionPosition: number;
  /** Intensity multiplier 1–3 (same scale as V4). */
  intensity: 1 | 2 | 3;
}

// ── Output shapes ─────────────────────────────────────────────────────────────

export interface Houses72HouseResult {
  house: number;
  title_fr: string;
  title_en: string;
  theme_fr: string;
  /** Number of questions answered in this house. */
  answeredCount: number;
  /** Archetype with the highest combined (light+shadow) score in this house. */
  topArchetype: AnyArchetypeKey | null;
  topLight: number;
  topShadow: number;
  /** Full per-house pole accumulation (subset of 32 poles). */
  poleAccumulation: PoleScores;
  /** Per-archetype breakdown for the house. */
  archetypeBreakdown: Record<string, { light: number; shadow: number }>;
}

/** Per-house breakdown: house number → result. */
export type Houses72HouseBreakdown = Record<number, Houses72HouseResult>;

export interface Houses72ScoredResult {
  /** Additive delta for the 32-pole morphic field (before combining with V4 T1 scores). */
  polesDelta: PoleScores;
  /** Per-house breakdown used to populate Deep Dive house stubs. */
  houseBreakdown: Houses72HouseBreakdown;
  /** Total answers processed. */
  answeredCount: number;
}

// ── Scoring engine ────────────────────────────────────────────────────────────

/**
 * Score a set of 72Q answers and return the pole delta + per-house breakdown.
 *
 * Unknown house/position/option combinations are silently skipped.
 */
export function scoreHouses72Answers(answers: Houses72Answer[]): Houses72ScoredResult {
  const globalField: MorphicField = {};

  // Per-house morphic fields
  const houseFields: Record<number, MorphicField> = {};
  const houseAnswerCount: Record<number, number> = {};

  for (const answer of answers) {
    const question = getHouse72Question(answer.house, answer.questionPosition);
    if (!question) continue;

    const option = question.options.find((o) => o.position === answer.optionPosition);
    if (!option) continue;

    const weights = v4VectorToPolarityWeights(option.vector);
    const intensity = Math.min(3, Math.max(1, Math.round(answer.intensity)));

    // Accumulate into global field
    accumulateMorphicField(weights, intensity, globalField);

    // Accumulate into per-house field
    if (!houseFields[answer.house]) houseFields[answer.house] = {};
    accumulateMorphicField(weights, intensity, houseFields[answer.house]);

    houseAnswerCount[answer.house] = (houseAnswerCount[answer.house] ?? 0) + 1;
  }

  const polesDelta = morphicFieldToPoleScores(globalField);
  const houseBreakdown: Record<number, Houses72HouseResult> = {};

  for (const [houseStr, field] of Object.entries(houseFields)) {
    const house = Number(houseStr);
    const housePoles = morphicFieldToPoleScores(field);
    const meta = HOUSES_72_META[house];

    // Build archetype breakdown and find top archetype
    const archetypeBreakdown: Record<string, { light: number; shadow: number }> = {};
    let topArchetype: AnyArchetypeKey | null = null;
    let topTotal = 0;

    for (const archetype of ARCHETYPE_KEYS) {
      const light = housePoles[poleKey(archetype, "light")] ?? 0;
      const shadow = housePoles[poleKey(archetype, "shadow")] ?? 0;
      if (light > 0 || shadow > 0) {
        archetypeBreakdown[archetype] = { light, shadow };
        if (light + shadow > topTotal) {
          topTotal = light + shadow;
          topArchetype = archetype;
        }
      }
    }

    houseBreakdown[house] = {
      house,
      title_fr: meta?.title_fr ?? `Maison ${house}`,
      title_en: meta?.title_en ?? `House ${house}`,
      theme_fr: meta?.theme_fr ?? "",
      answeredCount: houseAnswerCount[house] ?? 0,
      topArchetype,
      topLight: topArchetype ? (archetypeBreakdown[topArchetype]?.light ?? 0) : 0,
      topShadow: topArchetype ? (archetypeBreakdown[topArchetype]?.shadow ?? 0) : 0,
      poleAccumulation: housePoles,
      archetypeBreakdown,
    };
  }

  return {
    polesDelta,
    houseBreakdown,
    answeredCount: answers.length,
  };
}

/**
 * Add two PoleScores together (non-mutating).
 * Used to combine V4 T1 scores with the 72Q delta.
 */
export function addPoleScores(a: PoleScores, b: PoleScores): PoleScores {
  const out = emptyPoleScores();
  for (const archetype of ARCHETYPE_KEYS) {
    const lKey = poleKey(archetype, "light");
    const sKey = poleKey(archetype, "shadow");
    out[lKey] = (a[lKey] ?? 0) + (b[lKey] ?? 0);
    out[sKey] = (a[sKey] ?? 0) + (b[sKey] ?? 0);
  }
  return out;
}

/**
 * Build a completion map: house → number of DISTINCT questions answered (0–6).
 *
 * With multi-select, a single question can produce multiple rows (one per
 * selected option). We count distinct questionPosition values per house so
 * that choosing 3 options for Q1 still counts as 1/6, not 3/6.
 */
export function computeHouseCompletion(
  answers: Houses72Answer[],
): Record<number, number> {
  // houseQuestionSets[house] = Set of distinct questionPositions answered
  const houseQuestionSets: Record<number, Set<number>> = {};
  for (const a of answers) {
    if (!houseQuestionSets[a.house]) houseQuestionSets[a.house] = new Set();
    houseQuestionSets[a.house].add(a.questionPosition);
  }
  const counts: Record<number, number> = {};
  for (const [house, qSet] of Object.entries(houseQuestionSets)) {
    counts[Number(house)] = qSet.size;
  }
  return counts;
}

/**
 * Check whether a house is fully answered (all questions have ≥1 option selected).
 */
export function isHouseComplete(
  house: number,
  answers: Houses72Answer[],
): boolean {
  const houseQuestions = QUESTIONS_HOUSES_72.filter((q) => q.house === house);
  if (houseQuestions.length === 0) return false;
  const answeredPositions = new Set(
    answers.filter((a) => a.house === house).map((a) => a.questionPosition),
  );
  return answeredPositions.size >= houseQuestions.length;
}

/**
 * Return valid (populated) houses sorted by number.
 * Used for UI navigation — only shows houses that have questions.
 */
export function getPopulatedHouses(): number[] {
  const houseSet = new Set(QUESTIONS_HOUSES_72.map((q) => q.house));
  return [...houseSet].sort((a, b) => a - b);
}
