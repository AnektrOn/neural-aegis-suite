/**
 * Archetype Assessment — domain types
 * Pure types, no runtime deps. Used by engines, services, UI.
 *
 * Aligned with Caroline Myss' 12 universal archetypes and 4 universal shadows
 * (the "Survival archetypes"). Keys MUST match what is stored in the SQL
 * options/scores tables (archetype_weights, shadow_weights, archetype_key).
 */

/** 12 universal + 4 survival archetypes (Caroline Myss). */
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
  | "jester"
  | "child"
  | "victim"
  | "saboteur"
  | "prostitute";

/** Caroline Myss survival family — subset of ArchetypeKey. */
export type ShadowKey = Extract<
  ArchetypeKey,
  "child" | "victim" | "saboteur" | "prostitute"
>;

/** 12 non-survival archetypes (ranking / radar legacy). */
export type MajorArchetypeKey = Exclude<ArchetypeKey, ShadowKey>;

/**
 * UI-only grouping. Not persisted in DB. Free to evolve without migrations.
 */
export type ArchetypeFamily =
  | "wisdom"
  | "action"
  | "relation"
  | "leadership"
  | "transformation"
  | "expression"
  | "survival";

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

/** All 16 archetype keys (alias for polarity scoring vectors). */
export type AnyArchetypeKey = ArchetypeKey;

export type Polarity = "light" | "shadow";

/** V4 dimension keys (5 life dimensions × 6 questions). */
export type V4DimensionKey =
  | "identity"
  | "power"
  | "relationship"
  | "creation"
  | "spirituality";

/** One scored pole in the 32-pole morphic field (`sage_light`, `child_shadow`, …). */
export type PoleKey = `${ArchetypeKey}_${Polarity}`;

export type PoleScores = Record<PoleKey, number>;

export interface PoleActivationEntry {
  poleKey: PoleKey;
  archetype: ArchetypeKey;
  polarity: Polarity;
  rawPoints: number;
  activationPercent: number;
}

export interface SurvivalGuardEntry {
  archetype: ShadowKey;
  name_fr: string;
  name_en: string;
  lightRaw: number;
  shadowRaw: number;
  lightPercent: number;
  shadowPercent: number;
  dominantPole: Polarity;
}

export interface V4PoleAnalysis {
  totalPolePoints: number;
  poleActivation: PoleScores;
  lightAlliance: PoleActivationEntry[];
  shadowCouncil: PoleActivationEntry[];
  survivalGuard: SurvivalGuardEntry[];
}

/** V4 vector mapping per option (base weights before intensity multiplier). */
export interface V4VectorSlot {
  archetype: ArchetypeKey;
  /** Actual pole — may differ from column label on fear/compensation rows. */
  polarity: Polarity;
  points: number;
}

export interface V4VectorMapping {
  primaryLight: V4VectorSlot;
  secondaryLight: V4VectorSlot;
  primaryShadow: V4VectorSlot;
  secondaryShadow: V4VectorSlot;
}

export interface V4OptionSeed {
  position: number;
  label_fr: string;
  label_en: string;
  vector: V4VectorMapping;
}

export interface V4QuestionSeed {
  position: number;
  dimension: V4DimensionKey;
  prompt_fr: string;
  prompt_en: string;
  helper_fr?: string;
  helper_en?: string;
  options: V4OptionSeed[];
}

export interface PolarityWeight {
  archetype: AnyArchetypeKey;
  polarity: Polarity;
  weight: number;
}

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
  /** T1 Caroline Myss vectors: e.g. sovereign/light +1, creator/shadow +0.75 */
  polarityWeights?: PolarityWeight[];
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

export interface QuestionSelection {
  /** 0-based index into `RuntimeQuestion.options`. */
  optionIndex: number;
  /** Per-option intensity multiplier (1–3). */
  intensity: number;
}

export interface ResponseValue {
  questionId: string;
  /** V4 multi-select: one entry per checked option with its own intensity. */
  selections?: QuestionSelection[];
  selectedOptionIds?: string[];
  /** Per-option intensity multiplier (1–3) — legacy mirror of `selections`. */
  optionIntensities?: Record<string, number>;
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
  polarity_weights: PolarityWeight[];
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
  /** Full 32-pole morphic field (16 light + 16 shadow). */
  poleScores: PoleScores;
  /** V4 activation % and ranked zones (light alliance, shadow council, survival guard). */
  v4PoleAnalysis: V4PoleAnalysis;
  topArchetypes: MajorArchetypeKey[];
  rawScores: Record<MajorArchetypeKey, number>;
  normalizedScores: Record<MajorArchetypeKey, number>;
  rankedScores: Array<{ key: MajorArchetypeKey; score: number; rank: number }>;
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
