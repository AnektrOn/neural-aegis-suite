/**
 * V2 scoring engine (parallel mode for admin comparison).
 *
 * Goals:
 * - Keep I/O contract compatible with V1 AnalysisResult.
 * - Fix known edge cases without touching current production pipeline.
 * - Offer clearer behavior for "no usable response" sessions.
 */
import { MAJOR_ARCHETYPE_KEYS, getArchetype } from "./archetypes";
import type {
  AnalysisResult,
  ArchetypeKey,
  DimensionKey,
  MajorArchetypeKey,
  ResponseValue,
  RuntimeQuestion,
  ShadowKey,
} from "./types";

const SHADOW_KEYS: ShadowKey[] = ["child", "victim", "prostitute", "saboteur"];

function emptyArchetypeMap(): Record<MajorArchetypeKey, number> {
  return MAJOR_ARCHETYPE_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<MajorArchetypeKey, number>);
}

function emptyShadowMap(): Record<ShadowKey, number> {
  return SHADOW_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {} as Record<ShadowKey, number>);
}

export function computeRawScoresV2(
  questions: RuntimeQuestion[],
  responses: ResponseValue[]
): {
  archetypeScores: Record<MajorArchetypeKey, number>;
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

    if (
      q.question_type === "single_choice" ||
      q.question_type === "multiple_choice"
    ) {
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
      if (!opt) continue;
      for (const [k, v] of Object.entries(opt.shadow_weights || {})) {
        shadowSignals[k as ShadowKey] += Number(v) || 0;
      }
    } else if (q.question_type === "ranking") {
      const ordered = r.selectedOptionIds ?? [];
      ordered.forEach((optId, idx) => {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt) return;
        const rankWeight = Math.max(0, ordered.length - idx);
        for (const [k, v] of Object.entries(opt.archetype_weights || {})) {
          archetypeScores[k as ArchetypeKey] += (Number(v) || 0) * rankWeight;
        }
      });
    }
  }

  return { archetypeScores, shadowSignals };
}

export function normalizeScoresV2(
  scores: Record<string, number>
): Record<string, number> {
  const total = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0);
  const out: Record<string, number> = {};
  for (const k of Object.keys(scores)) {
    out[k] = total > 0 ? (scores[k] / total) * 100 : 0;
  }
  return out;
}

export function rankArchetypesV2(
  normalized: Record<MajorArchetypeKey, number>
): Array<{ key: MajorArchetypeKey; score: number; rank: number }> {
  return MAJOR_ARCHETYPE_KEYS.map((key) => ({ key, score: normalized[key] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));
}

export function computeDimensionScoresV2(
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

export function detectShadowSignalsV2(
  raw: Record<ShadowKey, number>
): Record<ShadowKey, number> {
  const SAT = 6;
  const out = emptyShadowMap();
  for (const k of SHADOW_KEYS) {
    out[k] = Math.min(1, (raw[k] ?? 0) / SAT);
  }
  return out;
}

export function buildAnalysisResultV2(
  questions: RuntimeQuestion[],
  responses: ResponseValue[]
): AnalysisResult {
  const { archetypeScores: raw, shadowSignals: rawShadow } = computeRawScoresV2(
    questions,
    responses
  );
  const normalized = normalizeScoresV2(raw) as Record<ArchetypeKey, number>;
  const ranked = rankArchetypesV2(normalized);

  const totalRaw = Object.values(raw).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const top =
    totalRaw > 0
      ? ranked
          .filter((r) => r.score > 0)
          .slice(0, 3)
          .map((r) => r.key)
      : [];

  const dimensionScores = computeDimensionScoresV2(questions, responses);
  const shadowSignals = detectShadowSignalsV2(rawShadow);

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
      : `Vos archétypes dominants sont ${top
          .map((k) => getArchetype(k).name_fr)
          .join(", ")}. ` +
        "Ils éclairent votre manière naturelle d'agir, de décider et de vous régénérer.";
  const summary_en =
    top.length === 0
      ? "No usable response."
      : `Your dominant archetypes are ${top
          .map((k) => getArchetype(k).name_en)
          .join(", ")}. ` +
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
