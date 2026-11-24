/** Deterministic lab mirror of `logos-workflow.json` (no ElevenLabs LLM). */

export type LogosWorkflowNodeId =
  | "start_node"
  | "triage"
  | "guide_somatique"
  | "checkin"
  | "analyse"
  | "jung"
  | "lighthouse_myss"
  | "perspective_myss_archetypes"
  | "prism_myss_balance"
  | "prism_myss_light"
  | "prism_myss_shadow"
  | "blavatsky"
  | "end_node";

export type LogosLabSessionMode = "guided" | "open";

export type LogosWorkflowEdge = {
  id: string;
  source: LogosWorkflowNodeId;
  target: LogosWorkflowNodeId;
  label: string;
  /** Human condition from ElevenLabs edge (for display). */
  condition: string;
};

export type LogosLabIntent = {
  id: string;
  labelFr: string;
  labelEn: string;
  /** Edge taken from triage (or special start). */
  edgeId: string | null;
  target: LogosWorkflowNodeId;
};

export type LogosLabToolId =
  | "list_actionable_content"
  | "propose_actionable_choices"
  | "open_toolbox_item"
  | "propose_pulse_card"
  | "open_quick_log"
  | "open_people_checkin"
  | "open_decision_capture"
  | "write_mood_entry"
  | "write_journal_entry"
  | "write_decision"
  | "write_relation_note";

export type LogosTriggerLogEntry = {
  id: string;
  at: number;
  kind: "session" | "intent" | "edge" | "tool" | "assert";
  message: string;
  detail?: string;
  ok?: boolean;
};

export const LOGOS_NODE_LABELS: Record<LogosWorkflowNodeId, { fr: string; en: string }> = {
  start_node: { fr: "Start", en: "Start" },
  triage: { fr: "Triage", en: "Triage" },
  guide_somatique: { fr: "Protocoles / Toolbox", en: "Protocols / Toolbox" },
  checkin: { fr: "Relevé du jour", en: "Daily check-in" },
  analyse: { fr: "Analyse", en: "Analyse" },
  jung: { fr: "Jung", en: "Jung" },
  lighthouse_myss: { fr: "Phare Myss", en: "Myss lighthouse" },
  perspective_myss_archetypes: { fr: "Myss · Archétypes", en: "Myss · Archetypes" },
  prism_myss_balance: { fr: "Myss · Équilibre", en: "Myss · Balance" },
  prism_myss_light: { fr: "Myss · Lumière", en: "Myss · Light" },
  prism_myss_shadow: { fr: "Myss · Ombre", en: "Myss · Shadow" },
  blavatsky: { fr: "Blavatsky", en: "Blavatsky" },
  end_node: { fr: "Fin", en: "End" },
};

/** Tools the live node is expected to use (from logos-client-tools-spec). */
export const LOGOS_NODE_TOOLS: Record<LogosWorkflowNodeId, LogosLabToolId[]> = {
  start_node: [],
  triage: [
    "list_actionable_content",
    "propose_actionable_choices",
    "open_toolbox_item",
    "propose_pulse_card",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
  ],
  guide_somatique: [
    "list_actionable_content",
    "propose_actionable_choices",
    "open_toolbox_item",
    "propose_pulse_card",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
  ],
  checkin: [
    "write_mood_entry",
    "open_quick_log",
    "open_toolbox_item",
    "list_actionable_content",
    "propose_actionable_choices",
    "propose_pulse_card",
    "open_people_checkin",
    "open_decision_capture",
  ],
  analyse: [
    "write_journal_entry",
    "write_decision",
    "open_people_checkin",
    "write_relation_note",
    "open_toolbox_item",
    "open_decision_capture",
    "propose_actionable_choices",
    "propose_pulse_card",
    "open_quick_log",
  ],
  jung: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  lighthouse_myss: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  perspective_myss_archetypes: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  prism_myss_balance: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  prism_myss_light: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  prism_myss_shadow: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  blavatsky: [
    "propose_actionable_choices",
    "open_quick_log",
    "open_people_checkin",
    "open_decision_capture",
    "propose_pulse_card",
    "open_toolbox_item",
  ],
  end_node: [],
};

export const LOGOS_WORKFLOW_EDGES: LogosWorkflowEdge[] = [
  {
    id: "start_node__greeting",
    source: "start_node",
    target: "triage",
    label: "Démarrage",
    condition: "unconditional",
  },
  {
    id: "triage__guide_somatique",
    source: "triage",
    target: "guide_somatique",
    label: "Protocole",
    condition:
      "L'utilisateur demande un exercice, un protocole, une pratique somatique, une respiration, un rituel, une pulse, ou veut être guidé en direct.",
  },
  {
    id: "triage__checkin",
    source: "triage",
    target: "checkin",
    label: "Relevé du jour",
    condition:
      "L'utilisateur veut faire un relevé de sa journée, son humeur, son sommeil, son stress ou son niveau d'énergie.",
  },
  {
    id: "triage__analyse",
    source: "triage",
    target: "analyse",
    label: "Analyser",
    condition:
      "L'utilisateur veut analyser une situation, une relation, un schéma récurrent, un rêve, ou prendre une décision.",
  },
  {
    id: "triage__end_node",
    source: "triage",
    target: "end_node",
    label: "Fin",
    condition: "L'utilisateur dit explicitement qu'il veut terminer la conversation ou dit au revoir.",
  },
  {
    id: "analyse__jung",
    source: "analyse",
    target: "jung",
    label: "Grille Jung",
    condition: "Demande explicite Jung.",
  },
  {
    id: "analyse__lighthouse_myss",
    source: "analyse",
    target: "lighthouse_myss",
    label: "Phare Myss",
    condition: "Demande explicite Myss / archétypes.",
  },
  {
    id: "lighthouse_myss__perspective_myss_archetypes",
    source: "lighthouse_myss",
    target: "perspective_myss_archetypes",
    label: "Perspective archétypes",
    condition: "Sacred Archetypes.",
  },
  {
    id: "perspective_myss_archetypes__prism_myss_shadow",
    source: "perspective_myss_archetypes",
    target: "prism_myss_shadow",
    label: "Prisme Ombre",
    condition: "Ombre / Survival Family.",
  },
  {
    id: "analyse__blavatsky",
    source: "analyse",
    target: "blavatsky",
    label: "Grille Blavatsky",
    condition: "Demande explicite Blavatsky.",
  },
  {
    id: "guide_somatique__triage",
    source: "guide_somatique",
    target: "triage",
    label: "Retour triage",
    condition: "Protocole terminé / autre besoin.",
  },
  {
    id: "checkin__triage",
    source: "checkin",
    target: "triage",
    label: "Retour triage",
    condition: "Relevé terminé / autre besoin.",
  },
  {
    id: "analyse__triage",
    source: "analyse",
    target: "triage",
    label: "Retour triage",
    condition: "Analyse terminée / autre besoin.",
  },
  {
    id: "jung__triage",
    source: "jung",
    target: "triage",
    label: "Retour triage",
    condition: "Lecture terminée.",
  },
  {
    id: "lighthouse_myss__triage",
    source: "lighthouse_myss",
    target: "triage",
    label: "Quitter Myss",
    condition: "Autre besoin.",
  },
  {
    id: "blavatsky__triage",
    source: "blavatsky",
    target: "triage",
    label: "Retour triage",
    condition: "Lecture terminée.",
  },
];

export const LOGOS_LAB_INTENTS: LogosLabIntent[] = [
  {
    id: "toolbox",
    labelFr: "Toolbox / pratique",
    labelEn: "Toolbox / practice",
    edgeId: "triage__guide_somatique",
    target: "guide_somatique",
  },
  {
    id: "checkin",
    labelFr: "Relevé du jour",
    labelEn: "Daily check-in",
    edgeId: "triage__checkin",
    target: "checkin",
  },
  {
    id: "analyse",
    labelFr: "Analyse / décision",
    labelEn: "Analyse / decision",
    edgeId: "triage__analyse",
    target: "analyse",
  },
  {
    id: "end",
    labelFr: "Fin",
    labelEn: "End",
    edgeId: "triage__end_node",
    target: "end_node",
  },
  {
    id: "back_triage",
    labelFr: "Retour triage",
    labelEn: "Back to triage",
    edgeId: null,
    target: "triage",
  },
];

/** Fixture from Note transcript conv_4001m7xx… — guided somatic path. */
export const LOGOS_LAB_SOMATIC_PATH = {
  id: "82b06a09-372b-4213-9402-1553fe3bb161",
  category: "signal_ancrage",
  openingPrompt:
    "Invite à remarquer les sensations corporelles sans les interpréter médicalement. Propose un appui simple et facultatif, sans imposer une respiration ou un exercice.",
  firstMessage: "Si tu prends un instant, où sens-tu le plus de tension ?",
} as const;

/**
 * Expected client-tool sequence after entering guide_somatique for a vague practice ask.
 * Matches repo template (propose_actionable_choices), not the broken live “announce only” behavior.
 */
export const LOGOS_LAB_EXPECTED_GUIDE_SEQUENCE: LogosLabToolId[] = [
  "propose_actionable_choices",
];

export function edgeById(id: string): LogosWorkflowEdge | undefined {
  return LOGOS_WORKFLOW_EDGES.find((e) => e.id === id);
}

export function canTakeEdge(from: LogosWorkflowNodeId, edgeId: string): boolean {
  const edge = edgeById(edgeId);
  return Boolean(edge && edge.source === from);
}

export function resolveBackToTriageEdge(from: LogosWorkflowNodeId): string | null {
  if (from === "triage" || from === "start_node" || from === "end_node") return null;
  const direct = `${from}__triage`;
  if (edgeById(direct)) return direct;
  if (from.startsWith("prism_myss_")) return `perspective_myss_archetypes__${from}`;
  if (from === "perspective_myss_archetypes") return "lighthouse_myss__perspective_myss_archetypes";
  if (from === "lighthouse_myss") return "lighthouse_myss__triage";
  return null;
}

export function makeTriggerId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
