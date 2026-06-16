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
