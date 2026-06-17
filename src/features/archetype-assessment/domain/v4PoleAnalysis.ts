/**
 * V4 — activation % across 32 poles and ranked report slices.
 */
import {
  ARCHETYPE_KEYS,
  SURVIVAL_ARCHETYPE_KEYS,
  getArchetype,
} from "./archetypes";
import { poleKey } from "./poleScores";
import type {
  ArchetypeKey,
  PoleActivationEntry,
  PoleKey,
  PoleScores,
  Polarity,
  ShadowKey,
  SurvivalGuardEntry,
  V4PoleAnalysis,
} from "./types";

export function computeTotalPolePoints(poleScores: PoleScores): number {
  let total = 0;
  for (const archetype of ARCHETYPE_KEYS) {
    total += Math.max(0, poleScores[poleKey(archetype, "light")] ?? 0);
    total += Math.max(0, poleScores[poleKey(archetype, "shadow")] ?? 0);
  }
  return total;
}

/** Each pole as % of total quiz points (32 values sum to 100 when total > 0). */
export function computePoleActivationPercentages(poleScores: PoleScores): PoleScores {
  const total = computeTotalPolePoints(poleScores);
  const out = {} as PoleScores;
  for (const archetype of ARCHETYPE_KEYS) {
    for (const polarity of ["light", "shadow"] as const) {
      const key = poleKey(archetype, polarity);
      const raw = Math.max(0, poleScores[key] ?? 0);
      out[key] = total > 0 ? (raw / total) * 100 : 0;
    }
  }
  return out;
}

function entryFromPole(
  key: PoleKey,
  rawPoints: number,
  activationPercent: number,
): PoleActivationEntry {
  const slash = key.lastIndexOf("_");
  const archetype = key.slice(0, slash) as ArchetypeKey;
  const polarity = key.slice(slash + 1) as Polarity;
  return { poleKey: key, archetype, polarity, rawPoints, activationPercent };
}

export function rankPolesByActivation(
  poleScores: PoleScores,
  poleActivation: PoleScores,
  polarity: Polarity,
  limit = 3,
): PoleActivationEntry[] {
  return ARCHETYPE_KEYS.map((archetype) => {
    const key = poleKey(archetype, polarity);
    return entryFromPole(
      key,
      Math.max(0, poleScores[key] ?? 0),
      poleActivation[key] ?? 0,
    );
  })
    .filter((e) => e.rawPoints > 0)
    .sort((a, b) => b.activationPercent - a.activationPercent)
    .slice(0, limit);
}

export function buildSurvivalGuard(
  poleScores: PoleScores,
  poleActivation: PoleScores,
): SurvivalGuardEntry[] {
  return SURVIVAL_ARCHETYPE_KEYS.map((archetype) => {
    const lightRaw = Math.max(0, poleScores[poleKey(archetype, "light")] ?? 0);
    const shadowRaw = Math.max(0, poleScores[poleKey(archetype, "shadow")] ?? 0);
    const lightPercent = poleActivation[poleKey(archetype, "light")] ?? 0;
    const shadowPercent = poleActivation[poleKey(archetype, "shadow")] ?? 0;
    const dominantPole: Polarity =
      shadowPercent > lightPercent ? "shadow" : lightPercent > shadowPercent ? "light" : "light";
    return {
      archetype,
      name_fr: getArchetype(archetype).name_fr,
      name_en: getArchetype(archetype).name_en,
      lightRaw,
      shadowRaw,
      lightPercent,
      shadowPercent,
      dominantPole,
    };
  });
}

export function buildV4PoleAnalysis(poleScores: PoleScores): V4PoleAnalysis {
  const totalPolePoints = computeTotalPolePoints(poleScores);
  const poleActivation = computePoleActivationPercentages(poleScores);
  return {
    totalPolePoints,
    poleActivation,
    lightAlliance: rankPolesByActivation(poleScores, poleActivation, "light", 3),
    shadowCouncil: rankPolesByActivation(poleScores, poleActivation, "shadow", 3),
    survivalGuard: buildSurvivalGuard(poleScores, poleActivation),
  };
}

export function parsePoleScoresRecord(raw: unknown): PoleScores | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {} as PoleScores;
  let found = false;
  for (const archetype of ARCHETYPE_KEYS) {
    for (const polarity of ["light", "shadow"] as const) {
      const key = poleKey(archetype, polarity);
      const v = Number((raw as Record<string, unknown>)[key]);
      if (Number.isFinite(v) && v > 0) {
        out[key] = v;
        found = true;
      } else {
        out[key] = 0;
      }
    }
  }
  return found ? out : null;
}
