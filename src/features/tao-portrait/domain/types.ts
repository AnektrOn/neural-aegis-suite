/**
 * Tao Wu Xing Portrait — domain types.
 * Content is Markdown only; no generated narrative in app code.
 */

export type WuXingPole = "wood" | "water" | "fire" | "earth" | "metal" | "transversal";

export type PolePartId =
  | "P01_DIA"
  | "P02_SIG"
  | "P03_TIM"
  | "P04_PRX"
  | "P05_SCL"
  | "T2_SYNTHESIS";

export interface TaoPortraitPartRow {
  id: string;
  user_id: string;
  pole: WuXingPole;
  part_id: PolePartId;
  content_md: string;
  updated_at: string;
  created_at: string;
}

export const POLE_PART_ORDER: PolePartId[] = [
  "P01_DIA",
  "P02_SIG",
  "P03_TIM",
  "P04_PRX",
  "P05_SCL",
];

export const POLE_PART_META: Record<
  PolePartId,
  { code: string; label_fr: string; label_en: string; short_fr: string; short_en: string }
> = {
  P01_DIA: {
    code: "P01·DIA",
    label_fr: "Diagnostic sémantique",
    label_en: "Semantic diagnostic",
    short_fr: "Diagnostic",
    short_en: "Diagnostic",
  },
  P02_SIG: {
    code: "P02·SIG",
    label_fr: "Design Fu Sigil",
    label_en: "Fu sigil design",
    short_fr: "Sigil",
    short_en: "Sigil",
  },
  P03_TIM: {
    code: "P03·TIM",
    label_fr: "Ancrage temporel Ba Zi",
    label_en: "Temporal Ba Zi anchoring",
    short_fr: "Ba Zi",
    short_en: "Ba Zi",
  },
  P04_PRX: {
    code: "P04·PRX",
    label_fr: "Praxis rituelle",
    label_en: "Ritual praxis",
    short_fr: "Praxis",
    short_en: "Praxis",
  },
  P05_SCL: {
    code: "P05·SCL",
    label_fr: "Scellement et déploiement",
    label_en: "Sealing and deployment",
    short_fr: "Scellement",
    short_en: "Sealing",
  },
  T2_SYNTHESIS: {
    code: "T2",
    label_fr: "Synthèse transversale Wu Xing",
    label_en: "Wu Xing transversal synthesis",
    short_fr: "T2",
    short_en: "T2",
  },
};

export const WU_XING_POLES: WuXingPole[] = ["wood", "water", "fire", "earth", "metal"];

export const WU_XING_META: Record<
  Exclude<WuXingPole, "transversal">,
  { emoji: string; label_fr: string; label_en: string; color: string; organ_fr: string; organ_en: string }
> = {
  wood: {
    emoji: "🌲",
    label_fr: "Bois",
    label_en: "Wood",
    color: "#3d7a4a",
    organ_fr: "Mu — Foie (Gan)",
    organ_en: "Mu — Liver (Gan)",
  },
  water: {
    emoji: "💧",
    label_fr: "Eau",
    label_en: "Water",
    color: "#2a5f8f",
    organ_fr: "Shui — Reins",
    organ_en: "Shui — Kidneys",
  },
  fire: {
    emoji: "🔥",
    label_fr: "Feu",
    label_en: "Fire",
    color: "#c45c3e",
    organ_fr: "Huo — Cœur (Shen)",
    organ_en: "Huo — Heart (Shen)",
  },
  earth: {
    emoji: "🌍",
    label_fr: "Terre",
    label_en: "Earth",
    color: "#9a7b4f",
    organ_fr: "Tu — Rate",
    organ_en: "Tu — Spleen",
  },
  metal: {
    emoji: "⚔️",
    label_fr: "Métal",
    label_en: "Metal",
    color: "#7a8a96",
    organ_fr: "Jin — Poumons",
    organ_en: "Jin — Lungs",
  },
};

/** Poles exposed in UI (all five once bulk import is available). */
export const TAO_POLES_ENABLED: WuXingPole[] = ["wood", "water", "fire", "earth", "metal"];

export function isPolePartId(value: string): value is PolePartId {
  return value in POLE_PART_META;
}

export function polePartKey(pole: WuXingPole, partId: PolePartId): string {
  return `${pole}:${partId}`;
}
