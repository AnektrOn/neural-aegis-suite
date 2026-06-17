/**
 * Build Deep Dive display scores from V4 32-pole morphic field (session truth).
 *
 * When `houseBreakdown` (from 72Q scoring) is provided, each house stub is
 * populated with real per-house archetype data instead of empty defaults.
 */
import { ARCHETYPE_KEYS } from "@/features/archetype-assessment/domain/archetypes";
import { poleKey } from "@/features/archetype-assessment/domain/poleScores";
import type { PoleScores } from "@/features/archetype-assessment/domain/types";
import type { Houses72HouseBreakdown } from "@/features/archetype-assessment/domain/houses72Scoring";
import type { ArchetypeScore, DeepDiveResult } from "./computeDeepDiveScores";
import { HOUSES, type AnyArchetypeKey } from "./types";

const V4_CORE_QUESTION_COUNT = 30;

export function deepDiveResultFromPoleScores(
  poleScores: PoleScores,
  opts?: {
    answeredCount?: number;
    totalQuestions?: number;
    /** Optional 72Q per-house breakdown to populate house stubs. */
    houseBreakdown?: Houses72HouseBreakdown;
  },
): DeepDiveResult {
  const answeredCount = opts?.answeredCount ?? V4_CORE_QUESTION_COUNT;
  const totalQuestions = opts?.totalQuestions ?? V4_CORE_QUESTION_COUNT;
  const houseBreakdown = opts?.houseBreakdown;

  let archetypes = ARCHETYPE_KEYS.map((archetype) => {
    const light = Math.max(0, poleScores[poleKey(archetype, "light")] ?? 0);
    const shadow = Math.max(0, poleScores[poleKey(archetype, "shadow")] ?? 0);
    return {
      archetype,
      light,
      shadow,
      total: light + shadow,
      lightPct: 0,
      shadowPct: 0,
      intensity: 0,
      net: light - shadow,
    } satisfies ArchetypeScore;
  });

  const totalLight = archetypes.reduce((s, a) => s + a.light, 0);
  const totalShadow = archetypes.reduce((s, a) => s + a.shadow, 0);
  archetypes = archetypes
    .map((a) => ({
      ...a,
      lightPct: totalLight > 0 ? (a.light / totalLight) * 100 : 0,
      shadowPct: totalShadow > 0 ? (a.shadow / totalShadow) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = archetypes.reduce((m, a) => Math.max(m, a.total), 0);
  archetypes = archetypes.map((a) => ({
    ...a,
    intensity: maxTotal > 0 ? a.total / maxTotal : 0,
  }));

  const topThree = archetypes
    .filter((a) => a.total > 0)
    .slice(0, 3)
    .map((a) => a.archetype);

  const shadowAlerts = archetypes
    .filter((a) => a.shadow > a.light && a.shadow > 0)
    .map((a) => a.archetype);

  // Build house stubs, populating from 72Q breakdown when available
  const houses = HOUSES.map((meta) => {
    const h72 = houseBreakdown?.[meta.number];
    if (h72) {
      return {
        house: meta.number,
        label_fr: meta.label_fr,
        label_en: meta.label_en,
        answered: h72.answeredCount,
        total: h72.answeredCount,
        topArchetype: h72.topArchetype as AnyArchetypeKey | null,
        topArchetypeWeight:
          h72.topArchetype
            ? (h72.archetypeBreakdown[h72.topArchetype]?.light ?? 0) +
              (h72.archetypeBreakdown[h72.topArchetype]?.shadow ?? 0)
            : 0,
        archetypeBreakdown: h72.archetypeBreakdown as Record<
          string,
          { light: number; shadow: number }
        >,
      };
    }
    return {
      house: meta.number,
      label_fr: meta.label_fr,
      label_en: meta.label_en,
      answered: 0,
      total: 0,
      topArchetype: null as AnyArchetypeKey | null,
      topArchetypeWeight: 0,
      archetypeBreakdown: {} as Record<string, { light: number; shadow: number }>,
    };
  });

  return {
    totalQuestions,
    answeredCount,
    completionPct: totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0,
    archetypes,
    topThree,
    shadowAlerts,
    houses,
    computedAt: new Date().toISOString(),
  };
}
