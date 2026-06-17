/**
 * V4 — 32-pole morphic field utilities (16 archetypes × light/shadow).
 */
import { ARCHETYPE_KEYS } from "./archetypes";
import {
  archetypePolarityKey,
  type MorphicField,
} from "./morphicField";
import type { ArchetypeKey, PoleKey, PoleScores, Polarity } from "./types";

export const POLE_COUNT = ARCHETYPE_KEYS.length * 2;

export function poleKey(archetype: ArchetypeKey, polarity: Polarity): PoleKey {
  return `${archetype}_${polarity}`;
}

export function emptyPoleScores(): PoleScores {
  const out = {} as PoleScores;
  for (const archetype of ARCHETYPE_KEYS) {
    out[poleKey(archetype, "light")] = 0;
    out[poleKey(archetype, "shadow")] = 0;
  }
  return out;
}

export function morphicFieldToPoleScores(field: MorphicField): PoleScores {
  const out = emptyPoleScores();
  for (const archetype of ARCHETYPE_KEYS) {
    out[poleKey(archetype, "light")] =
      field[archetypePolarityKey(archetype, "light")] ?? 0;
    out[poleKey(archetype, "shadow")] =
      field[archetypePolarityKey(archetype, "shadow")] ?? 0;
  }
  return out;
}

export function poleScoresToMorphicField(scores: PoleScores): MorphicField {
  const field: MorphicField = {};
  for (const archetype of ARCHETYPE_KEYS) {
    const light = scores[poleKey(archetype, "light")] ?? 0;
    const shadow = scores[poleKey(archetype, "shadow")] ?? 0;
    if (light) field[archetypePolarityKey(archetype, "light")] = light;
    if (shadow) field[archetypePolarityKey(archetype, "shadow")] = shadow;
  }
  return field;
}
