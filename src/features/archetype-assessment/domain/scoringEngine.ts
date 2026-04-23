/**
 * Pure scoring engine. No side effects, no I/O.
 * Inputs: questions + responses (plain JS objects).
 * Outputs: AnalysisResult.
 */

import { ARCHETYPES, ARCHETYPE_KEYS, getArchetype } from "./archetypes";
import type {
  AnalysisResult,
  ArchetypeKey,
  DimensionKey,
  ResponseValue,
  RuntimeQuestion,
  ShadowKey,
} from "./types";

/**
 * Dimensions are free-form strings (DB-driven). We accumulate dynamically per
 * question. This list is empty by design; `computeDimensionScores` discovers
 * dimensions from `RuntimeQuestion.dimension` and produces a sparse map.
 */
const SHADOW_KEYS: ShadowKey[] = [
  "control",
  "victim",
  "prostitute",
  "saboteur",
];

function emptyArchetypeMap(): Record<ArchetypeKey, number> {
  return ARCHETYPE_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<ArchetypeKey, number>);
}

function emptyShadowMap(): Record<ShadowKey, number> {
  return SHADOW_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<ShadowKey, number>);
}

/* -------------------------------------------------------------------------- */
/* computeRawScores                                                           */
/* -------------------------------------------------------------------------- */
export function computeRawScores(
  questions: RuntimeQuestion[],
  responses: ResponseValue[]
): {
  archetypeScores: Record<ArchetypeKey, number>;
  shadowSignals: Record<ShadowKey, number>;
} {
  const archetypeScores = emptyArchetypeMap();
  const shadowSignals = emptyShadowMap();

  const responsesByQ = new Map<string, ResponseValue>(
    responses.map((r) => [r.questionId, r])
  );

  for (const q of questions) {
    const r = responsesByQ.get(q.id);
    if (!r) continue;

    if (q.question_type === "single_choice" || q.question_type === "multiple_choice") {
      const selected = q.options.filter((o) => r.selectedOptionIds?.includes(o.id));
      for (const opt of selected) {
        for (const [k, v] of Object.entries(opt.archetype_weights || {})) {
          archetypeScores[k as ArchetypeKey] += Number(v) || 0;
        }
        for (const [k, v] of Object.entries(opt.shadow_weights || {})) {
          shadowSignals[k as ShadowKey] += Number(v) || 0;
        }
      }
    } else if (q.question_type === "likert_scale") {
      const opt = q.options.find((o) => r.selectedOptionIds?.includes(o.id));
      if (opt) {
        for (const [k, v] of Object.entries(opt.shadow_weights || {})) {
          shadowSignals[k as ShadowKey] += Number(v) || 0;
        }
      }
    } else if (q.question_type === "ranking") {
      // selectedOptionIds is the ranked order, index 0 = rank 1 (strongest)
      const ordered = r.selectedOptionIds ?? [];
      ordered.forEach((optId, idx) => {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt) return;
        const rankWeight = Math.max(0, ordered.length - idx); // top gets full weight
        for (const [k, v] of Object.entries(opt.archetype_weights || {})) {
          archetypeScores[k as ArchetypeKey] += (Number(v) || 0) * rankWeight;
        }
      });
    }
    // short_text: no scoring contribution
  }

  return { archetypeScores, shadowSignals };
}

/* -------------------------------------------------------------------------- */
/* normalizeScores — proportional, sums to 100 across all archetypes          */
/* -------------------------------------------------------------------------- */
export function normalizeScores(
  scores: Record<string, number>
): Record<string, number> {
  const total = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0);
  const out: Record<string, number> = {};
  for (const k of Object.keys(scores)) {
    out[k] = total > 0 ? (scores[k] / total) * 100 : 0;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* computeCompletionConfidence — % of available questions answered            */
/* -------------------------------------------------------------------------- */
export function computeCompletionConfidence(
  totalAvailableQuestions: number,
  responses: ResponseValue[]
): number {
  if (totalAvailableQuestions <= 0) return 0;
  const answered = responses.filter((r) => {
    if (r.textValue && r.textValue.trim().length > 0) return true;
    if (typeof r.numericValue === "number") return true;
    return (r.selectedOptionIds?.length ?? 0) > 0;
  }).length;
  return Math.min(100, (answered / totalAvailableQuestions) * 100);
}

/* -------------------------------------------------------------------------- */
/* detectConsistencyWarning — contradictory archetype/shadow patterns         */
/* -------------------------------------------------------------------------- */
export interface ConsistencyWarning {
  consistency_warning: true;
  conflicting_pair: [string, string];
}

export function detectConsistencyWarning(
  normalizedArchetypes: Record<string, number>,
  shadowSignals: Record<string, number>
): ConsistencyWarning | null {
  // Threshold expressed in normalized 0..100 space (>=2.0 on a 0..100 scale = 2%).
  // Per spec the threshold is 2.0 raw points → with sum-to-100 normalization we
  // keep the literal 2.0 cutoff: a non-trivial co-presence of both signals.
  const T = 2.0;
  if ((normalizedArchetypes.sovereign ?? 0) >= T && (normalizedArchetypes.victim ?? 0) >= T) {
    return { consistency_warning: true, conflicting_pair: ["sovereign", "victim"] };
  }
  if ((normalizedArchetypes.warrior ?? 0) >= T && (shadowSignals.saboteur ?? 0) >= T) {
    return { consistency_warning: true, conflicting_pair: ["warrior", "saboteur"] };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* rankArchetypes                                                             */
/* -------------------------------------------------------------------------- */
export function rankArchetypes(
  normalized: Record<ArchetypeKey, number>
): Array<{ key: ArchetypeKey; score: number; rank: number }> {
  return ARCHETYPE_KEYS
    .map((key) => ({ key, score: normalized[key] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));
}

/* -------------------------------------------------------------------------- */
/* computeDimensionScores — average likert value per dimension, normalized    */
/* -------------------------------------------------------------------------- */
export function computeDimensionScores(
  questions: RuntimeQuestion[],
  responses: ResponseValue[]
): Record<DimensionKey, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  const responsesByQ = new Map<string, ResponseValue>(
    responses.map((r) => [r.questionId, r])
  );

  for (const q of questions) {
    if (!q.dimension) continue;
    const r = responsesByQ.get(q.id);
    if (!r) continue;

    if (
      q.question_type === "likert_scale" ||
      q.question_type === "single_choice"
    ) {
      const opt = q.options.find((o) => r.selectedOptionIds?.includes(o.id));
      if (opt && typeof opt.value === "number") {
        sums[q.dimension] = (sums[q.dimension] ?? 0) + opt.value;
        counts[q.dimension] = (counts[q.dimension] ?? 0) + 1;
      }
    }
  }

  const out: Record<string, number> = {};
  for (const k of Object.keys(sums)) {
    out[k] = counts[k] > 0 ? sums[k] / counts[k] : 0;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* detectShadowSignals — already raw, just normalize                          */
/* -------------------------------------------------------------------------- */
export function detectShadowSignals(
  raw: Record<ShadowKey, number>
): Record<ShadowKey, number> {
  // Soft-cap: assume saturation around 6 cumulated points per shadow.
  const SAT = 6;
  const out = emptyShadowMap();
  for (const k of SHADOW_KEYS) {
    out[k] = Math.min(1, (raw[k] ?? 0) / SAT);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* buildAnalysisResult                                                         */
/* -------------------------------------------------------------------------- */
export function buildAnalysisResult(
  questions: RuntimeQuestion[],
  responses: ResponseValue[]
): AnalysisResult {
  const { archetypeScores: raw, shadowSignals: rawShadow } = computeRawScores(
    questions,
    responses
  );
  const normalized = normalizeScores(raw) as Record<ArchetypeKey, number>;
  const ranked = rankArchetypes(normalized);
  const top = ranked.slice(0, 3).map((r) => r.key);

  const dimensionScores = computeDimensionScores(questions, responses);
  const shadowSignals = detectShadowSignals(rawShadow);

  const strengths_fr: string[] = [];
  const strengths_en: string[] = [];
  const watchouts_fr: string[] = [];
  const watchouts_en: string[] = [];

  for (const k of top) {
    const a = getArchetype(k);
    strengths_fr.push(`${a.name_fr} : ${a.lightAspect_fr}`);
    strengths_en.push(`${a.name_en}: ${a.lightAspect_en}`);
    watchouts_fr.push(`${a.name_fr} : ${a.shadowAspect_fr}`);
    watchouts_en.push(`${a.name_en}: ${a.shadowAspect_en}`);
  }

  const summary_fr =
    top.length === 0
      ? "Aucune réponse exploitable."
      : `Vos archétypes dominants sont ${top.map((k) => getArchetype(k).name_fr).join(", ")}. ` +
        "Ils éclairent votre manière naturelle d'agir, de décider et de vous régénérer.";
  const summary_en =
    top.length === 0
      ? "No usable response."
      : `Your dominant archetypes are ${top.map((k) => getArchetype(k).name_en).join(", ")}. ` +
        "They illuminate your natural way of acting, deciding and regenerating.";

  return {
    topArchetypes: top,
    rawScores: raw,
    normalizedScores: normalized,
    rankedScores: ranked,
    dimensionScores,
    shadowSignals,
    strengths_fr,
    strengths_en,
    watchouts_fr,
    watchouts_en,
    summary_fr,
    summary_en,
  };
}

export const __internals = { SHADOW_KEYS };
