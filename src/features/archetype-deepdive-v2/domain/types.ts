/**
 * Aegis Deep Dive (V2 — 70 questions) — domain types.
 *
 * Self-contained, lives alongside the V1 quick-scan module.
 * Two key differences vs V1:
 *  - Each option carries explicit (archetype, polarity, weight) tuples.
 *  - Each question is mapped to one of Caroline Myss' 12 astrological houses.
 */

export type ArchetypeKey =
  | "sovereign" | "warrior" | "lover" | "caregiver"
  | "creator"   | "explorer"| "rebel" | "sage"
  | "mystic"    | "healer"  | "magician" | "jester";

export type SurvivalKey = "child" | "victim" | "saboteur" | "prostitute";

export type AnyArchetypeKey = ArchetypeKey | SurvivalKey;

export type Polarity = "light" | "shadow";

export interface OptionWeight {
  archetype: AnyArchetypeKey;
  polarity: Polarity;
  weight: number;
}

export interface Question70Option {
  /** Stable code, e.g. "A49A". */
  id: string;
  label_fr: string;
  label_en: string;
  weights: OptionWeight[];
}

export interface Question70 {
  /** Stable code, e.g. "A49". */
  id: string;
  /** 1..70 sequential position. */
  position: number;
  /** Caroline Myss house, 1..12. */
  house: number;
  prompt_fr: string;
  prompt_en: string;
  options: Question70Option[];
}

/* -------------------------------------------------------------------------- */
/* House metadata                                                              */
/* -------------------------------------------------------------------------- */

export interface HouseMeta {
  number: number;
  label_fr: string;
  label_en: string;
  theme_fr: string;
  theme_en: string;
}

export const HOUSES: HouseMeta[] = [
  { number: 1,  label_fr: "Ego & personnalité",        label_en: "Ego & personality",         theme_fr: "Image de soi, masque, première impression", theme_en: "Self-image, mask, first impression" },
  { number: 2,  label_fr: "Valeurs & sécurité",        label_en: "Values & security",         theme_fr: "Argent, possessions, ce qui a de la valeur", theme_en: "Money, possessions, what has value" },
  { number: 3,  label_fr: "Expression & décisions",    label_en: "Self-expression & choices", theme_fr: "Communication, choix, parole, cause/effet",  theme_en: "Communication, choices, voice, cause/effect" },
  { number: 4,  label_fr: "Foyer & racines",           label_en: "Home & roots",              theme_fr: "Famille, sécurité émotionnelle, héritage",   theme_en: "Family, emotional safety, legacy" },
  { number: 5,  label_fr: "Créativité & plaisir",      label_en: "Creativity & joy",          theme_fr: "Créativité, sensualité, jeu, bonne fortune", theme_en: "Creativity, sensuality, play, good fortune" },
  { number: 6,  label_fr: "Travail & santé",           label_en: "Work & health",             theme_fr: "Occupation, éthique, équilibre travail/corps", theme_en: "Occupation, ethics, work/body balance" },
  { number: 7,  label_fr: "Relations & partenariats",  label_en: "Relationships & partnerships", theme_fr: "Couple, alliances, contrats relationnels", theme_en: "Couple, alliances, relational contracts" },
  { number: 8,  label_fr: "Ressources partagées",      label_en: "Shared resources",          theme_fr: "Argent des autres, intimité profonde, fusion", theme_en: "Other people's money, deep intimacy, merging" },
  { number: 9,  label_fr: "Spiritualité & quête",      label_en: "Spirituality & quest",      theme_fr: "Croyances, sens, voyages intérieurs",        theme_en: "Beliefs, meaning, inner journeys" },
  { number: 10, label_fr: "Vocation & potentiel",      label_en: "Vocation & potential",      theme_fr: "Rôle social, autorité, sommet de potentiel",  theme_en: "Social role, authority, peak potential" },
  { number: 11, label_fr: "Monde & contribution",      label_en: "World & contribution",      theme_fr: "Causes, communauté, vision collective",       theme_en: "Causes, community, collective vision" },
  { number: 12, label_fr: "Inconscient & patterns",    label_en: "Unconscious & patterns",    theme_fr: "Patterns profonds, surrender, karma",         theme_en: "Deep patterns, surrender, karma" },
];

/* -------------------------------------------------------------------------- */
/* Runtime / response shapes                                                  */
/* -------------------------------------------------------------------------- */

export interface ResponseValue70 {
  /** Question DB id (uuid). */
  questionId: string;
  /** Selected option DB id (uuid) — single_choice only. */
  selectedOptionId: string;
}

export interface RuntimeOption70 {
  id: string;        // DB uuid
  code: string;      // "A49A"
  position: number;
  label_fr: string;
  label_en: string;
  weights: OptionWeight[];
}

export interface RuntimeQuestion70 {
  id: string;        // DB uuid
  code: string;      // "A49"
  position: number;
  house: number;
  prompt_fr: string;
  prompt_en: string;
  options: RuntimeOption70[];
}

/* -------------------------------------------------------------------------- */
/* Scoring output                                                              */
/* -------------------------------------------------------------------------- */

export interface HouseStats {
  total: number;
  light: number;
  shadow: number;
}

export interface ArchetypeStats {
  total: number;
  light: number;
  shadow: number;
  /** Map of house number → stats inside that house. */
  byHouse: Record<number, HouseStats>;
}

export interface DeepDiveAnalysis {
  /** Per-archetype dual-track stats. */
  stats: Record<AnyArchetypeKey, ArchetypeStats>;
  /** Top 3 archetypes by total weight. */
  topArchetypes: AnyArchetypeKey[];
  /** Light ratio per archetype: light / total. */
  lightRatio: Record<AnyArchetypeKey, number>;
  /** Shadow ratio per archetype: shadow / total. */
  shadowRatio: Record<AnyArchetypeKey, number>;
}
