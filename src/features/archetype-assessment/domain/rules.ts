import type { RecommendationRule } from "./types";

/**
 * Recommendation rules. Pure predicates over the analysis context.
 * Rule keys are persisted (recommendation_tools.rule_key) so admin/user can
 * see *why* a tool was recommended.
 *
 * Aligned with the 12 Myss archetypes and the 4 universal shadows
 * (control / victim / prostitute / saboteur).
 */
export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    key: "rule_sovereign_control",
    description:
      "Sovereign with high control shadow → coherent breathing + STOP + shadow journal.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("sovereign") && (shadowSignals.child ?? 0) >= 0.5,
    toolKeys: ["coherent_breathing_5min", "stop_protocol", "shadow_journal_control"],
    weight: 3,
  },
  {
    key: "rule_sage_overthink",
    description:
      "Sage with shadow control (over-mentalisation) → body scan + grounding to re-embody.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("sage") && (shadowSignals.child ?? 0) >= 0.4,
    toolKeys: ["body_scan_10min", "grounding_3min", "single_task_block"],
    weight: 3,
  },
  {
    key: "rule_caregiver_pleasing",
    description:
      "Caregiver/Healer with prostitute shadow (people-pleasing) → loving-kindness + boundary phrase + shadow journal.",
    match: ({ topArchetypes, shadowSignals }) =>
      (topArchetypes.includes("caregiver") || topArchetypes.includes("healer")) &&
      (shadowSignals.prostitute ?? 0) >= 0.4,
    toolKeys: ["loving_kindness", "boundary_phrase", "shadow_journal_pleasing"],
    weight: 3,
  },
  {
    key: "rule_warrior_burnout",
    description:
      "Warrior with high control + saboteur shadow → physiological sigh + body scan.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("warrior") &&
      (shadowSignals.child ?? 0) >= 0.5 &&
      (shadowSignals.saboteur ?? 0) >= 0.3,
    toolKeys: ["physiological_sigh", "body_scan_10min"],
    weight: 3,
  },
  {
    key: "rule_magician_grounding",
    description:
      "Magician needs grounding to translate vision into execution.",
    match: ({ topArchetypes }) => topArchetypes.includes("magician"),
    toolKeys: ["visualization_future_self", "intention_setting", "single_task_block"],
    weight: 2,
  },
  {
    key: "rule_creator_block",
    description:
      "Creator with control shadow (perfectionism) → morning pages + creative constraint.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("creator") && (shadowSignals.child ?? 0) >= 0.4,
    toolKeys: ["creative_morning_pages", "creative_constraint"],
    weight: 3,
  },
  {
    key: "rule_rebel_channel",
    description:
      "Rebel needs to channel energy into conscious choice rather than reaction.",
    match: ({ topArchetypes }) => topArchetypes.includes("rebel"),
    toolKeys: ["rebel_inquiry", "stop_protocol", "movement_break"],
    weight: 2,
  },
  {
    key: "rule_lover_quality",
    description:
      "Lover → quality connection over volume + grounding.",
    match: ({ topArchetypes }) => topArchetypes.includes("lover"),
    toolKeys: ["connection_call", "grounding_3min"],
    weight: 2,
  },
  {
    key: "rule_mystic_open",
    description: "Mystic → open awareness + gratitude.",
    match: ({ topArchetypes }) => topArchetypes.includes("mystic"),
    toolKeys: ["open_awareness", "gratitude_3"],
    weight: 2,
  },
  {
    key: "rule_explorer_loop",
    description: "Explorer → learning loop + introspective focus.",
    match: ({ topArchetypes }) => topArchetypes.includes("explorer"),
    toolKeys: ["learning_loop", "focus_introspectif"],
    weight: 2,
  },
  {
    key: "rule_jester_anchor",
    description: "Jester → grounding + intention to anchor lightness in commitment.",
    match: ({ topArchetypes }) => topArchetypes.includes("jester"),
    toolKeys: ["grounding_3min", "intention_setting"],
    weight: 2,
  },
  {
    key: "rule_victim_shadow",
    description:
      "Victim shadow → affirmations + decision log to rebuild agency.",
    match: ({ shadowSignals }) => (shadowSignals.victim ?? 0) >= 0.4,
    toolKeys: ["affirmations_morning", "decision_log_prompt"],
    weight: 3,
  },
  {
    key: "rule_saboteur_shadow",
    description:
      "Saboteur shadow → grounding + single-task block + STOP.",
    match: ({ shadowSignals }) => (shadowSignals.saboteur ?? 0) >= 0.4,
    toolKeys: ["grounding_3min", "single_task_block", "stop_protocol"],
    weight: 3,
  },
  {
    key: "rule_prostitute_shadow",
    description:
      "Prostitute shadow (selling integrity for security) → values clarification + boundary phrase.",
    match: ({ shadowSignals }) => (shadowSignals.prostitute ?? 0) >= 0.4,
    toolKeys: ["values_clarification", "boundary_phrase"],
    weight: 3,
  },
  {
    key: "rule_default_baseline",
    description:
      "Baseline practices for everyone (low weight, only if nothing else fires strongly).",
    match: () => true,
    toolKeys: ["coherent_breathing_5min", "intention_setting", "gratitude_3"],
    weight: 1,
  },
];
