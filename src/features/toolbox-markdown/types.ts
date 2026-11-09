import type {
  AegisToolboxExtendedConfig,
  ToolboxExocortexOrgan,
  ToolboxPillar,
  ToolboxTier,
} from "@/lib/toolbox-content-type-definitions";

export type ToolboxItemLocale = "fr" | "en";

export interface ToolboxItemI18nText {
  fr: string;
  en: string;
}

export type ToolboxDistributionMode = "catalog" | "individual" | "group" | "global";

export interface ToolboxItemDistribution {
  mode: ToolboxDistributionMode;
  assignment_status: string;
  user_id?: string;
  user_ids?: string[];
  company_id?: string;
  locale?: "fr" | "en" | "all";
}

export interface ToolboxItemConfig extends AegisToolboxExtendedConfig {
  duration_sec: number;
  duration_min?: number;
  mode?: string;
  step_duration_sec?: number;
  [key: string]: unknown;
}

/** Frontmatter YAML + contenu body extrait (template IA strict). */
export interface ToolboxItem {
  external_key: string;
  content_type: string;
  is_active: boolean;
  duration: string;
  category: string;
  priority?: string;
  tier?: ToolboxTier;
  pillar?: ToolboxPillar;
  exocortex_organ?: ToolboxExocortexOrgan;
  mechanism_tag?: string;
  parent_template_key?: string;
  resistance_fallback_sec?: number;
  why_this_for_you?: ToolboxItemI18nText;
  archetype_targets: string[];
  shadow_targets: string[];
  title: ToolboxItemI18nText;
  description: ToolboxItemI18nText;
  distribution: ToolboxItemDistribution;
  config: ToolboxItemConfig;

  instructionsFr: string;
  instructionsEn: string;
  stepsFr: string[];
  stepsEn: string[];

  /** Chemin ou identifiant du fichier source (optionnel). */
  source?: string;
}

export interface ParseToolboxItemOptions {
  source?: string;
  /** Nombre d'étapes attendu (défaut 4 pour stop_protocol). */
  expectedStepCount?: number;
}
