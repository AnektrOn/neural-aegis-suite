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

/** Eckhart Tolle presence runes (collection TOLLE). */
export const TOLLE_PRINCIPLES = [
  "PRESENCE",
  "PAIN_BODY",
  "WATCHER",
  "ACCEPTANCE",
  "STILLNESS",
] as const;

/** Jung / Âme partielle runes (collection JUNG_AME). */
export const JUNG_PRINCIPLES = [
  "DYNAMIQUE_COMPLEXES",
  "MORPHOLOGIE_REVES",
  "STRUCTURE_INCONSCIENT",
] as const;

export const VALID_PRINCIPLES = [
  ...KYBALION_PRINCIPLES,
  ...MYSS_PRINCIPLES,
  ...ECHOLS_PRINCIPLES,
  ...TOLLE_PRINCIPLES,
  ...JUNG_PRINCIPLES,
] as const;

export type PulsePrincipleCode = (typeof VALID_PRINCIPLES)[number];

export function isValidPrinciple(code: string): code is PulsePrincipleCode {
  return (VALID_PRINCIPLES as readonly string[]).includes(code);
}

/** Accept known catalogue codes or new UPPER_SNAKE codes (seeded later in DB). */
export function looksLikePrincipleCode(code: string): boolean {
  return /^[A-Z][A-Z0-9_]{1,63}$/.test(code);
}

/**
 * Jung format uses `principle` as thematic axis (e.g. AUTONOMIE) and `rune` as the
 * DB principle code (e.g. DYNAMIQUE_COMPLEXES). Prefer a known/valid `rune`.
 */
export function resolvePrincipleCode(meta: {
  principle?: unknown;
  rune?: unknown;
}): string {
  const rune = typeof meta.rune === "string" ? meta.rune.trim() : "";
  const principle = typeof meta.principle === "string" ? meta.principle.trim() : "";

  if (rune && isValidPrinciple(rune)) return rune;
  if (principle && isValidPrinciple(principle)) return principle;
  if (rune && looksLikePrincipleCode(rune)) return rune;
  if (principle && looksLikePrincipleCode(principle)) return principle;
  return rune || principle;
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
