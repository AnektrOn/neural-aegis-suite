import type { RecommendationRule } from "./types";

/**
 * 15 explicit, data-driven recommendation rules.
 * Each rule is a pure predicate over the analysis context. When it fires, the listed
 * tools receive a `weight` bonus during ranking. The rule key is also stored so the
 * admin and the user can see *why* a tool was recommended.
 */
export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    key: "rule_queen_control",
    description: "Queen/Executive with high control shadow → coherent breathing + STOP + shadow journal.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("queen") && (shadowSignals.control ?? 0) >= 0.5,
    toolKeys: ["coherent_breathing_5min", "stop_protocol", "shadow_journal_control"],
    weight: 3,
  },
  {
    key: "rule_intellectual_overthink",
    description: "Intellectual with low regulation → body scan + grounding to re-embody.",
    match: ({ topArchetypes, dimensionScores }) =>
      topArchetypes.includes("intellectual") && (dimensionScores.regulation_need ?? 0) >= 0.5,
    toolKeys: ["body_scan_10min", "grounding_3min", "single_task_block"],
    weight: 3,
  },
  {
    key: "rule_caregiver_pleasing",
    description: "Caregiver/Healer with people-pleasing shadow → loving-kindness + boundary phrase + shadow journal.",
    match: ({ topArchetypes, shadowSignals }) =>
      (topArchetypes.includes("caregiver") || topArchetypes.includes("healer")) &&
      (shadowSignals.people_pleasing ?? 0) >= 0.4,
    toolKeys: ["loving_kindness", "boundary_phrase", "shadow_journal_pleasing"],
    weight: 3,
  },
  {
    key: "rule_athlete_burnout",
    description: "Athlete with high activation + low regulation → physiological sigh + body scan.",
    match: ({ topArchetypes, dimensionScores }) =>
      topArchetypes.includes("athlete") &&
      (dimensionScores.activation_style ?? 0) >= 0.6 &&
      (dimensionScores.regulation_need ?? 0) >= 0.5,
    toolKeys: ["physiological_sigh", "body_scan_10min"],
    weight: 3,
  },
  {
    key: "rule_visionary_grounding",
    description: "Visionary needs grounding to translate vision into execution.",
    match: ({ topArchetypes }) => topArchetypes.includes("visionary"),
    toolKeys: ["visualization_future_self", "intention_setting", "single_task_block"],
    weight: 2,
  },
  {
    key: "rule_artist_block",
    description: "Artist with perfectionism → morning pages + creative constraint.",
    match: ({ topArchetypes, shadowSignals }) =>
      topArchetypes.includes("artist") && (shadowSignals.perfectionism ?? 0) >= 0.4,
    toolKeys: ["creative_morning_pages", "creative_constraint"],
    weight: 3,
  },
  {
    key: "rule_rebel_channel",
    description: "Rebel needs to channel energy into conscious choice rather than reaction.",
    match: ({ topArchetypes }) => topArchetypes.includes("rebel"),
    toolKeys: ["rebel_inquiry", "stop_protocol", "movement_break"],
    weight: 2,
  },
  {
    key: "rule_advocate_values",
    description: "Advocate aligns better when values are explicit.",
    match: ({ topArchetypes }) => topArchetypes.includes("advocate"),
    toolKeys: ["values_clarification", "decision_log_prompt"],
    weight: 2,
  },
  {
    key: "rule_seeker_open",
    description: "Spiritual Seeker → open awareness + gratitude.",
    match: ({ topArchetypes }) => topArchetypes.includes("spiritual_seeker"),
    toolKeys: ["open_awareness", "gratitude_3"],
    weight: 2,
  },
  {
    key: "rule_student_loop",
    description: "Student → learning loop + focus introspectif.",
    match: ({ topArchetypes }) => topArchetypes.includes("student"),
    toolKeys: ["learning_loop", "focus_introspectif"],
    weight: 2,
  },
  {
    key: "rule_networker_quality",
    description: "Networker → quality connection over volume.",
    match: ({ topArchetypes }) => topArchetypes.includes("networker"),
    toolKeys: ["connection_call", "grounding_3min"],
    weight: 2,
  },
  {
    key: "rule_low_self_trust",
    description: "Low self-trust dimension → affirmations + decision log.",
    match: ({ dimensionScores }) => (dimensionScores.self_trust ?? 0) <= 0.35,
    toolKeys: ["affirmations_morning", "decision_log_prompt"],
    weight: 3,
  },
  {
    key: "rule_high_structure_need",
    description: "High structure need → intention setting + single-task block.",
    match: ({ dimensionScores }) => (dimensionScores.structure_need ?? 0) >= 0.6,
    toolKeys: ["intention_setting", "single_task_block"],
    weight: 2,
  },
  {
    key: "rule_avoidance_shadow",
    description: "Avoidance shadow → grounding + single-task block + STOP.",
    match: ({ shadowSignals }) => (shadowSignals.avoidance ?? 0) >= 0.4,
    toolKeys: ["grounding_3min", "single_task_block", "stop_protocol"],
    weight: 2,
  },
  {
    key: "rule_default_baseline",
    description: "Baseline practices for everyone (low weight, only if nothing else fires strongly).",
    match: () => true,
    toolKeys: ["coherent_breathing_5min", "intention_setting", "gratitude_3"],
    weight: 1,
  },
];
