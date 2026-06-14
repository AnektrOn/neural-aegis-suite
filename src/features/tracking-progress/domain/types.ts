/**
 * Tracking Progress System — Domain Types
 *
 * Perspective Myss: daily 3-question check-ins → biweekly evolution reports.
 */

import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";

// ---------------------------------------------------------------------------
// Perspectives
// ---------------------------------------------------------------------------

export interface TrackingPerspective {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  description_fr: string | null;
  description_en: string | null;
  baseline_source: "deepdive_70q" | "assessment_30q";
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type TrackingQuestionType = "scale" | "choice" | "text";

export interface TrackingQuestionOption {
  value: string;
  label_fr: string;
  label_en: string;
  weights: Array<{
    archetype: AnyArchetypeKey;
    polarity: "light" | "shadow";
    weight: number;
  }>;
}

export interface TrackingQuestion {
  id: string;
  perspective_id: string;
  external_key: string;
  question_fr: string;
  question_en: string;
  question_type: TrackingQuestionType;
  scale_min: number;
  scale_max: number;
  options: TrackingQuestionOption[];
  archetype_target: AnyArchetypeKey | null;
  house_target: number | null;
  dimension_target: "light" | "shadow" | "general" | null;
  weight: number;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Daily batches
// ---------------------------------------------------------------------------

export type TrackingBatchStatus = "pending" | "answered" | "missed";

export interface TrackingDailyBatch {
  id: string;
  user_id: string;
  perspective_id: string;
  scheduled_date: string; // ISO date "YYYY-MM-DD"
  question_ids: string[];
  status: TrackingBatchStatus;
  answered_at: string | null;
  questions?: TrackingQuestion[]; // hydrated by hook
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface TrackingDailyResponse {
  id: string;
  user_id: string;
  batch_id: string;
  question_id: string;
  response_date: string;
  numeric_value: number | null;
  choice_value: string | null;
  text_value: string | null;
  weights_applied: Array<{
    archetype: AnyArchetypeKey;
    polarity: "light" | "shadow";
    weight: number;
  }>;
  responded_at: string;
}

/** Value to submit for a single question */
export type TrackingResponseValue =
  | { type: "scale"; numeric_value: number }
  | { type: "choice"; choice_value: string; weights_applied: TrackingDailyResponse["weights_applied"] }
  | { type: "text"; text_value: string };

// ---------------------------------------------------------------------------
// Evolution / progress snapshots
// ---------------------------------------------------------------------------

export interface ArchetypeScoreSnapshot {
  light: number;
  shadow: number;
  total: number;
  net: number;
  intensity: number;
}

export type ArchetypeScoresMap = Partial<Record<AnyArchetypeKey, ArchetypeScoreSnapshot>>;

export type DeltaDirection = "up" | "down" | "stable";

export interface ArchetypeDelta {
  archetype: AnyArchetypeKey;
  light_delta: number;
  shadow_delta: number;
  net_delta: number;
  direction: DeltaDirection;
  magnitude: number; // absolute value of net_delta
}

export interface TrackingEvolutionResult {
  archetypeDelta: ArchetypeDelta[];
  strongestShift: AnyArchetypeKey | null;
  baselineScores: ArchetypeScoresMap;
  trackingScores: ArchetypeScoresMap;
  responseCount: number;
  narrative_cues: {
    top_gains: AnyArchetypeKey[];    // archetypes that grew most in light
    top_declines: AnyArchetypeKey[]; // archetypes that grew most in shadow
    shadow_warnings: AnyArchetypeKey[];
  };
}

export interface TrackingProgressSnapshot {
  id: string;
  user_id: string;
  perspective_id: string;
  period_start: string;
  period_end: string;
  baseline_scores: ArchetypeScoresMap;
  tracking_scores: ArchetypeScoresMap;
  delta: Record<AnyArchetypeKey, Omit<ArchetypeDelta, "archetype">>;
  strongest_shift: AnyArchetypeKey | null;
  response_count: number;
  narrative_fr: string | null;
  narrative_en: string | null;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Import / parsing
// ---------------------------------------------------------------------------

export interface ParsedTrackingQuestion {
  external_key: string;
  question_fr: string;
  question_en: string;
  question_type: TrackingQuestionType;
  scale_min?: number;
  scale_max?: number;
  options: TrackingQuestionOption[];
  archetype_target?: AnyArchetypeKey;
  house_target?: number;
  dimension_target?: "light" | "shadow" | "general";
  weight?: number;
}

export interface TrackingMarkdownParseResult {
  total: number;
  valid: number;
  errors: string[];
  questions: ParsedTrackingQuestion[];
}
