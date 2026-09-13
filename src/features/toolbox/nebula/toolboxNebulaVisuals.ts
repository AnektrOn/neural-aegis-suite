import { ENGINE_SCENARIOS, type EngineScenario } from "./toolboxEngineScenarios";

export type ToolboxVisualLanguage = "particles" | "matter" | "audio" | "none";

export interface ToolboxVisualSpec {
  id: ToolboxVisualLanguage;
  label_fr: string;
  dna: string;
}

export const TOOLBOX_VISUAL_LANGUAGES: ToolboxVisualSpec[] = [
  {
    id: "particles",
    label_fr: "Nuage de points",
    dna: "Points additifs, homes, curl, freeze. Bon pour chaos, scan, scènes.",
  },
  {
    id: "matter",
    label_fr: "Matière anomale",
    dna: "Icosa + simplex + lumière souris. Bon pour poumon, membrane, intensité, stillness.",
  },
  {
    id: "audio",
    label_fr: "Spectre audio",
    dna: "MeditationNebula — listen seulement.",
  },
];

const SLUG_ENGINE: Record<string, string> = {
  breathwork: "breath",
  breath_box: "breath",
  breath_coherence: "breath",
  physiological_sigh: "breath",
  vagal_hum: "breath",
  stop_protocol: "interrupt",
  stop_rumination: "interrupt",
  visualization: "visualize",
  safe_place: "visualize",
  open_monitoring: "attend",
  focus_introspectif: "attend",
  body_scan: "scan",
  progressive_relax: "scan",
  micro_movement: "move",
  shake_release: "move",
  walking_meditation: "move",
  energy_activation: "move",
  posture_reset: "move",
  cold_exposure_prep: "move",
  micro_practice: "move",
  journal_prompt: "stream",
  journal_stream: "stream",
  morning_pages: "stream",
  letter_unsent: "stream",
  worry_dump: "stream",
  evening_review: "stream",
  gratitude: "savor",
  gratitude_triple: "savor",
  affirmations: "affirm",
  affirmations_cycle: "affirm",
  intention: "intend",
  intention_morning: "intend",
  intention_week: "intend",
  ritual_sequence: "sequence",
  habit_checkbox: "sequence",
  belief_reframe: "reframe",
  if_then_plan: "sequence",
  decision_matrix: "weigh",
  dialogue_parts: "voices",
  empathy_perspective: "bridge",
  boundary_practice: "edge",
  sacred_no: "edge",
  shadow_checkin: "gauge",
  energy_ledger: "ledger",
  meditation: "listen",
  course: "link",
  external_link: "link",
  archetype_mirror: "voices",
  light_quality_practice: "intend",
  symbol_encounter: "stream",
  synchronicity_log: "stream",
  relation_repair: "bridge",
  social_micro_action: "sequence",
};

export function engineIdForSlug(slug: string): string | undefined {
  return SLUG_ENGINE[slug];
}

export function scenarioForSlug(slug: string): EngineScenario | undefined {
  const id = SLUG_ENGINE[slug];
  return id ? ENGINE_SCENARIOS.find((s) => s.engine === id) : undefined;
}

export function visualLanguageForSlug(slug: string): ToolboxVisualLanguage {
  return scenarioForSlug(slug)?.visual ?? "particles";
}

export function isParticleVisualSlug(slug: string): boolean {
  return visualLanguageForSlug(slug) === "particles";
}

export function isMatterVisualSlug(slug: string): boolean {
  return visualLanguageForSlug(slug) === "matter";
}

export function isAudioVisualSlug(slug: string): boolean {
  return visualLanguageForSlug(slug) === "audio";
}
