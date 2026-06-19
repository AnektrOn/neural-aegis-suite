/** Kybalion runes (collection KYBALION). */
export const KYBALION_PRINCIPLES = [
  "MENTALISM",
  "CORRESPONDENCE",
  "VIBRATION",
  "POLARITY",
  "RHYTHM",
  "CAUSE_EFFECT",
  "GENDER",
] as const;

/** Caroline Myss archetypes (collection MYSS_ARCHETYPE). */
export const MYSS_PRINCIPLES = [
  "CHILD",
  "VICTIM",
  "PROSTITUTE",
  "SABOTEUR",
  "MYSTIC",
  "SAGE",
  "HEALER",
  "WARRIOR",
  "SOVEREIGN",
  "CREATOR",
  "EXPLORER",
  "REBEL",
  "LOVER",
  "CAREGIVER",
  "MAGICIAN",
  "JESTER",
] as const;

/** Echols clinical runes (collection ECHOLS). */
export const ECHOLS_PRINCIPLES = [
  "ENERGY",
  "GROUNDING",
  "SHIELDING",
  "DIRECTING",
  "CENTERING",
] as const;

export const VALID_PRINCIPLES = [
  ...KYBALION_PRINCIPLES,
  ...MYSS_PRINCIPLES,
  ...ECHOLS_PRINCIPLES,
] as const;

export type PulsePrincipleCode = (typeof VALID_PRINCIPLES)[number];

export function isValidPrinciple(code: string): code is PulsePrincipleCode {
  return (VALID_PRINCIPLES as readonly string[]).includes(code);
}

/** Pulse deck targeting slugs (lowercase). */
export const VALID_ARCHETYPES = [
  "sage", "warrior", "lover", "sovereign", "magician", "healer",
  "creator", "rebel", "caregiver", "explorer", "mystic", "jester",
] as const;

export type PulseArchetypeSlug = (typeof VALID_ARCHETYPES)[number];

const ARCHETYPE_ALIASES: Record<string, PulseArchetypeSlug> = {
  protector: "caregiver",
  ruler: "sovereign",
};

/** Normalise YAML archetype_targets (ex. `Sovereign` → `sovereign`). */
export function normalizeArchetypeTarget(raw: string): string {
  const slug = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return ARCHETYPE_ALIASES[slug] ?? slug;
}

export function isValidArchetype(slug: string): slug is PulseArchetypeSlug {
  return (VALID_ARCHETYPES as readonly string[]).includes(slug);
}

export function parseArchetypeTargets(raw: unknown): { slugs: string[]; invalid: string[] } {
  if (!Array.isArray(raw)) return { slugs: [], invalid: [] };
  const slugs: string[] = [];
  const invalid: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string" || !entry.trim()) continue;
    const normalized = normalizeArchetypeTarget(entry);
    if (isValidArchetype(normalized)) {
      if (!slugs.includes(normalized)) slugs.push(normalized);
    } else {
      invalid.push(entry.trim());
    }
  }
  return { slugs, invalid };
}
