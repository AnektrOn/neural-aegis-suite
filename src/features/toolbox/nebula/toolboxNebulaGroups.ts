/**
 * Dev-only grouping for `/dev/toolbox-nebula`.
 * Clusters by UX / mechanism similarity — not the legacy `category` field.
 */

export interface ToolboxNebulaGroup {
  id: string;
  label_fr: string;
  /** Why these sit together */
  rationale_fr: string;
  /** Canonical / preferred slug when duplicates exist */
  primary?: string;
  /** Near-duplicates or thin variants worth merging later */
  merge_candidates?: string[][];
  slugs: string[];
}

/**
 * Ordered families for the nebula catalog.
 * Every builtin + demo extra slug must appear exactly once.
 */
export const TOOLBOX_NEBULA_GROUPS: ToolboxNebulaGroup[] = [
  {
    id: "breath",
    label_fr: "Respiration",
    rationale_fr:
      "Même moteur breathwork (cycles in/hold/out). Les slugs ne sont que des presets de timing / visuel.",
    primary: "breathwork",
    merge_candidates: [["breathwork", "breath_box", "breath_coherence"]],
    slugs: [
      "breathwork",
      "breath_box",
      "breath_coherence",
      "physiological_sigh",
      "vagal_hum",
    ],
  },
  {
    id: "interrupt",
    label_fr: "Interruption / STOP",
    rationale_fr:
      "Séquences courtes pour couper une boucle (STOP et stop rumination = même pattern pas-à-pas).",
    primary: "stop_protocol",
    merge_candidates: [["stop_protocol", "stop_rumination"]],
    slugs: ["stop_protocol", "stop_rumination"],
  },
  {
    id: "attention",
    label_fr: "Attention & visualisation",
    rationale_fr:
      "Focus guidé, scènes imagées, observation ouverte, méditation audio — même famille « attention dirigée ».",
    primary: "visualization",
    merge_candidates: [["visualization", "safe_place"]],
    slugs: [
      "visualization",
      "safe_place",
      "open_monitoring",
      "focus_introspectif",
      "meditation",
    ],
  },
  {
    id: "body",
    label_fr: "Corps & somatique",
    rationale_fr:
      "Conscience corporelle, décharge, posture, activation. body_scan ≈ progressive_relax (parcours zones).",
    primary: "body_scan",
    merge_candidates: [
      ["body_scan", "progressive_relax"],
      ["micro_movement", "energy_activation"],
    ],
    slugs: [
      "body_scan",
      "progressive_relax",
      "micro_movement",
      "shake_release",
      "walking_meditation",
      "cold_exposure_prep",
      "posture_reset",
      "energy_activation",
    ],
  },
  {
    id: "journal",
    label_fr: "Écriture & journal",
    rationale_fr:
      "Prompts et écriture chronométrée. stream / morning_pages / letter = même shell timed ; evening / worry = steps.",
    primary: "journal_prompt",
    merge_candidates: [["journal_stream", "morning_pages"]],
    slugs: [
      "journal_prompt",
      "journal_stream",
      "morning_pages",
      "letter_unsent",
      "evening_review",
      "worry_dump",
    ],
  },
  {
    id: "gratitude",
    label_fr: "Gratitude",
    rationale_fr: "Doublon quasi exact : gratitude natif vs gratitude_triple (même entries_count).",
    primary: "gratitude",
    merge_candidates: [["gratitude", "gratitude_triple"]],
    slugs: ["gratitude", "gratitude_triple"],
  },
  {
    id: "affirmations",
    label_fr: "Affirmations",
    rationale_fr: "Boucle d’affirmations chronométrées — cycle = même widget, config différente.",
    primary: "affirmations",
    merge_candidates: [["affirmations", "affirmations_cycle"]],
    slugs: ["affirmations", "affirmations_cycle"],
  },
  {
    id: "intention",
    label_fr: "Intention & rituels",
    rationale_fr:
      "Poser une intention / cocher un rituel. intention ≈ intention_morning ; week / ritual / habit = checklist.",
    primary: "intention",
    merge_candidates: [
      ["intention", "intention_morning"],
      ["ritual_sequence", "habit_checkbox"],
    ],
    slugs: [
      "intention",
      "intention_morning",
      "intention_week",
      "ritual_sequence",
      "habit_checkbox",
    ],
  },
  {
    id: "cognitive",
    label_fr: "Cognitif & décisions",
    rationale_fr: "Reframe, plans if/then, matrice — outils de réflexion structurée.",
    slugs: ["belief_reframe", "if_then_plan", "decision_matrix"],
  },
  {
    id: "inner_parts",
    label_fr: "Parts & ombre",
    rationale_fr: "Dialogue intérieur, archétype, intensité d’ombre — introspec profonde / IFS-like.",
    slugs: ["dialogue_parts", "archetype_mirror", "shadow_checkin"],
  },
  {
    id: "myss_symbol",
    label_fr: "Symbolique & énergie",
    rationale_fr: "Qualité lumière, symbole, ledger, synchronicité — couche Myss / sens.",
    slugs: [
      "light_quality_practice",
      "symbol_encounter",
      "energy_ledger",
      "synchronicity_log",
    ],
  },
  {
    id: "boundaries",
    label_fr: "Limites",
    rationale_fr: "Dire non / poser une limite — quasi doublon sacred_no ↔ boundary_practice.",
    primary: "boundary_practice",
    merge_candidates: [["boundary_practice", "sacred_no"]],
    slugs: ["boundary_practice", "sacred_no"],
  },
  {
    id: "relations",
    label_fr: "Relations",
    rationale_fr: "Réparation, empathie perspective, micro-action sociale.",
    slugs: ["relation_repair", "empathy_perspective", "social_micro_action"],
  },
  {
    id: "shells",
    label_fr: "Coquilles génériques",
    rationale_fr:
      "Conteneurs flexibles / hors widget natif (micro custom, cours, lien). Pas des exercices métier.",
    primary: "micro_practice",
    slugs: ["micro_practice", "course", "external_link"],
  },
];

export const TOOLBOX_NEBULA_GROUP_MAP = new Map(
  TOOLBOX_NEBULA_GROUPS.map((g) => [g.id, g]),
);

export function getNebulaGroupForSlug(slug: string): ToolboxNebulaGroup | undefined {
  return TOOLBOX_NEBULA_GROUPS.find((g) => g.slugs.includes(slug));
}

/** Assert every known slug is grouped (dev hygiene). */
export function listUngroupedNebulaSlugs(allSlugs: string[]): string[] {
  const grouped = new Set(TOOLBOX_NEBULA_GROUPS.flatMap((g) => g.slugs));
  return allSlugs.filter((s) => !grouped.has(s));
}
