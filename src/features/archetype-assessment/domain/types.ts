/**
 * Archetype Assessment — domain types
 * Pure types, no runtime deps. Used by engines, services, UI.
 */

export type ArchetypeKey =
  | "advocate"
  | "artist"
  | "athlete"
  | "caregiver"
  | "intellectual"
  | "queen"
  | "rebel"
  | "spiritual_seeker"
  | "visionary"
  | "student"
  | "healer"
  | "networker";

export type ArchetypeFamily =
  | "guardian"
  | "creator"
  | "warrior"
  | "nurturer"
  | "thinker"
  | "leader"
  | "disruptor"
  | "seeker"
  | "innovator"
  | "learner"
  | "restorer"
  | "connector";

export type DimensionKey =
  | "learning_style"
  | "relational_style"
  | "activation_style"
  | "regulation_need"
  | "self_trust"
  | "expression_need"
  | "structure_need";

export type ShadowKey =
  | "control"
  | "withdrawal"
  | "people_pleasing"
  | "self_doubt"
  | "perfectionism"
  | "avoidance";

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
  /** When true, question belongs to the optional appendix module (positions 34-100). */
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
  /** Maps to an existing Toolbox widget when present (BreathworkWidget, BodyScanWidget, ...). */
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
