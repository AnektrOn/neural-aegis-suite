export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolSeoMeta {
  title: string;
  description: string;
}

/** Contenu pédagogique explicite (hub + intro wizard). */
export interface ToolGuide {
  /** 2–4 phrases, langage parlé */
  plainExplain: string;
  /** Profil typique */
  bestFor: string;
  /** Durée affichée (ex. "3 min") */
  durationLabel: string;
  questionCount: number;
  /** Ce qu'il faut avoir en tête avant de cliquer */
  prepareWhat: string;
  /** Livrables à l'écran résultats */
  outcomes: string[];
  /** Exemple concret pour débloquer */
  example?: string;
}

export type ConversionProblemKind =
  | "cost"
  | "security"
  | "dispersion"
  | "waste"
  | "network"
  | "fatigue"
  | "bias"
  | "delay"
  | "prioritization"
  | "contextSwitch";