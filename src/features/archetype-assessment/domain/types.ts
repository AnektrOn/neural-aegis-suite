/**
 * Archetype Assessment — domain types
 * Pure types, no runtime deps. Used by engines, services, UI.
 *
 * Aligned with Caroline Myss' 12 universal archetypes and 4 universal shadows
 * (the "Survival archetypes"). Keys MUST match what is stored in the SQL
 * options/scores tables (archetype_weights, shadow_weights, archetype_key).
 */

export type ArchetypeKey =
  | "sage"
  | "warrior"
  | "lover"
  | "sovereign"
  | "magician"
  | "healer"
  | "creator"
  | "rebel"
  | "caregiver"
  | "explorer"
  | "mystic"
  | "jester";

/**
 * UI-only grouping. Not persisted in DB. Free to evolve without migrations.
 */
export type ArchetypeFamily =
  | "wisdom"
  | "action"
  | "relation"
  | "leadership"
  | "transformation"
  | "expression";

/**
 * Free-form string: dimensions used in seed data are documented in
 * `questions.ts` but not constrained at the type level so the BDD can grow
 * (leadership_style, decision_making, power_sources, conflict_style,
 * leadership_confidence, shadow_strategy, power_leaks, boundaries,
 * relational_focus, purpose, legacy_focus, intuition_channel,
 * mystic_orientation, change_reaction, risk_trust, self_sabotage,
 * inner_practices, sacred_view, …).
 */
export type DimensionKey = string;

/**
 * Caroline Myss' 4 universal "Survival" shadow archetypes that everyone
 * carries. Anything else (perfectionism, withdrawal, …) is expressed as a
 * variant or intensity inside one of these 4 buckets.
 */
/**
 * Aegis V1 — 4 universal Survival shadow archetypes everyone carries.
 * Aligned with Caroline Myss' "Survival Family".
 */
export type ShadowKey =
  | "child"
  | "victim"
  | "saboteur"
  | "prostitute";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "likert_scale"
  | "ranking"
  | "short_text";

export type ToolType =
  | "meditation"
  | "breathwork"
  | "journal_prompt"
  | "micro_practice";

export interface ArchetypeDef {
  key: ArchetypeKey;
  family: ArchetypeFamily;
  name_fr: string;
  name_en: string;
  shortDescription_fr: string;
  shortDescription_en: string;
  lightAspect_fr: string;
  lightAspect_en: string;
  shadowAspect_fr: string;
  shadowAspect_en: string;
  coreNeed_fr: string;
  coreNeed_en: string;
  fearPattern_fr: string;
  fearPattern_en: string;
  color: string; // HSL string e.g. "hsl(48 96% 60%)"
}

export interface OptionSeed {
  position: number;
  label_fr: string;
  label_en: string;
  archetypeWeights?: Partial<Record<ArchetypeKey, number>>;
  shadowWeights?: Partial<Record<ShadowKey, number>>;
  value?: number;
}

export interface QuestionSeed {
  position: number;
  type: QuestionType;
  prompt_fr: string;
  prompt_en: string;
  helper_fr?: string;
  helper_en?: string;
  dimension?: DimensionKey;
  isRequired?: boolean;
  /** When true, question belongs to the optional appendix module. */
  isAppendix?: boolean;
  meta?: Record<string, unknown>;
  options?: OptionSeed[];
}

export interface ToolSeed {
  key: string;
  type: ToolType;
  title_fr: string;
  title_en: string;
  duration_fr: string;
  duration_en: string;
  /** Maps to an existing Toolbox widget when present. */
  widgetKey?: string;
  /** Archetypes this tool primarily serves. */
  archetypes: ArchetypeKey[];
  /** Dimensions whose high score makes this tool relevant. */
  dimensions?: DimensionKey[];
  /** Shadow signals this tool helps regulate. */
  shadows?: ShadowKey[];
  /** Default rationale fragment, refined by recommendationEngine.buildRationale. */
  rationaleHint_fr: string;
  rationaleHint_en: string;
}

export interface RecommendationRule {
  key: string;
  description: string;
  /** Pure predicate, no side effects. */
  match: (ctx: {
    topArchetypes: ArchetypeKey[];
    dimensionScores: Record<DimensionKey, number>;
    shadowSignals: Record<ShadowKey, number>;
  }) => boolean;
  toolKeys: string[];
  /** Bonus weight added to ranking when this rule fires. */
  weight: number;
}

/* -------------------------------------------------------------------------- */
/* Runtime / response shapes                                                  */
/* -------------------------------------------------------------------------- */

export interface ResponseValue {
  questionId: string;
  selectedOptionIds?: string[];
  numericValue?: number;
  textValue?: string;
}

export interface RuntimeOption {
  id: string;
  position: number;
  label_fr: string;
  label_en: string;
  archetype_weights: Partial<Record<ArchetypeKey, number>>;
  shadow_weights: Partial<Record<ShadowKey, number>>;
  value: number | null;
}

export interface RuntimeQuestion {
  id: string;
  position: number;
  question_type: QuestionType;
  prompt_fr: string;
  prompt_en: string;
  helper_fr: string | null;
  helper_en: string | null;
  dimension: DimensionKey | null;
  is_required: boolean;
  meta: Record<string, unknown>;
  options: RuntimeOption[];
}

export interface AnalysisResult {
  topArchetypes: ArchetypeKey[];
  rawScores: Record<ArchetypeKey, number>;
  normalizedScores: Record<ArchetypeKey, number>;
  rankedScores: Array<{ key: ArchetypeKey; score: number; rank: number }>;
  dimensionScores: Record<DimensionKey, number>;
  shadowSignals: Record<ShadowKey, number>;
  strengths_fr: string[];
  strengths_en: string[];
  watchouts_fr: string[];
  watchouts_en: string[];
  summary_fr: string;
  summary_en: string;
}

export interface RecommendedTool {
  toolKey: string;
  type: ToolType;
  title_fr: string;
  title_en: string;
  duration_fr: string;
  duration_en: string;
  widgetKey?: string;
  rationale_fr: string;
  rationale_en: string;
  ruleKey?: string;
  rank: number;
  score: number;
}
