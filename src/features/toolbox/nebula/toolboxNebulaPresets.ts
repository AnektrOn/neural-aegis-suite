import type {
  QuantumNebulaAudioTuning,
  QuantumNebulaFigure,
  QuantumNebulaState,
  QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";
import type { ResolvedWidgetKind } from "@/lib/toolbox-widget-resolver";

export interface ToolboxNebulaPreset {
  state: QuantumNebulaState;
  figure?: QuantumNebulaFigure;
  cloudHeightRatio?: number;
  audioTuning?: Partial<QuantumNebulaAudioTuning>;
  visualTuning?: Partial<QuantumNebulaVisualTuning>;
  /** Short note for the dev demo — how this type would use particles. */
  implementationNote: { fr: string; en: string };
}

const CALM_REPOS: ToolboxNebulaPreset = {
  state: "repos",
  cloudHeightRatio: 0.38,
  implementationNote: {
    fr: "Fond passif — particules en curl noise, sans sync.",
    en: "Passive backdrop — curl noise particles, no sync.",
  },
};

const BREATH_MOUVEMENT: ToolboxNebulaPreset = {
  state: "mouvement",
  cloudHeightRatio: 0.42,
  audioTuning: {
    ambientBoomStrength: 0.5,
    boomStrength: 1.25,
    midWaveForce: 0.001,
    reflexionAudioScale: 0.2,
  },
  implementationNote: {
    fr: "Pulse sur inspire/expire — lier les phases du timer breathwork au boom.",
    en: "Pulse on inhale/exhale — tie breathwork timer phases to boom strength.",
  },
};

const REFLEXION_FOCUS: ToolboxNebulaPreset = {
  state: "reflexion",
  cloudHeightRatio: 0.4,
  implementationNote: {
    fr: "Neurone central — idéal focus, introspection, ancrage.",
    en: "Central neuron — ideal for focus, introspection, grounding.",
  },
};

const CATEGORY_PRESETS: Record<string, ToolboxNebulaPreset> = {
  regulation: BREATH_MOUVEMENT,
  attention: {
    state: "repos",
    cloudHeightRatio: 0.4,
    implementationNote: {
      fr: "Nuage stable ; changer d'état par scène ou étape.",
      en: "Stable cloud; switch state per scene or step.",
    },
  },
  body: {
    state: "repos",
    cloudHeightRatio: 0.32,
    visualTuning: { particleCount: 14000 },
    implementationNote: {
      fr: "Densité par zone corporelle — intensifier boom par étape du scan.",
      en: "Density per body zone — boost boom per scan step.",
    },
  },
  journal: CALM_REPOS,
  cognitive: REFLEXION_FOCUS,
  intentionality: {
    ...REFLEXION_FOCUS,
    figure: "metatron",
    implementationNote: {
      fr: "Réflexion + révélation Metatron à la validation.",
      en: "Reflection + Metatron reveal on submit.",
    },
  },
  relations: CALM_REPOS,
  custom: CALM_REPOS,
};

const SLUG_PRESETS: Record<string, ToolboxNebulaPreset> = {
  breathwork: BREATH_MOUVEMENT,
  breath_box: { ...BREATH_MOUVEMENT, figure: "metatron" },
  breath_coherence: BREATH_MOUVEMENT,
  physiological_sigh: {
    ...BREATH_MOUVEMENT,
    audioTuning: { ...BREATH_MOUVEMENT.audioTuning, boomDecay: 0.8 },
  },
  vagal_hum: {
    state: "mouvement",
    cloudHeightRatio: 0.45,
    implementationNote: {
      fr: "Réactivité audio si hum enregistré ; sinon mouvement ambiant.",
      en: "Audio reactivity if hum is recorded; else ambient motion.",
    },
  },
  focus_introspectif: REFLEXION_FOCUS,
  body_scan: CATEGORY_PRESETS.body,
  progressive_relax: CATEGORY_PRESETS.body,
  visualization: {
    state: "repos",
    cloudHeightRatio: 0.4,
    implementationNote: {
      fr: "État par scène : ancrage=solid, projection=mouvement, succès=reflexion+Metatron.",
      en: "Per-scene state: anchor=repos, projection=mouvement, success=reflexion+Metatron.",
    },
  },
  safe_place: {
    state: "mouvement",
    cloudHeightRatio: 0.45,
    implementationNote: {
      fr: "Ondulation douce pendant la visualisation du lieu sûr.",
      en: "Gentle ripple while visualizing the safe place.",
    },
  },
  open_monitoring: {
    state: "reflexion",
    implementationNote: {
      fr: "Neurone minimal — attention ouverte sans surcharge visuelle.",
      en: "Minimal neuron — open monitoring without visual overload.",
    },
  },
  affirmations: {
    state: "reflexion",
    figure: "sriYantra",
    implementationNote: {
      fr: "Micro-boom à chaque affirmation affichée.",
      en: "Micro-boom on each displayed affirmation.",
    },
  },
  affirmations_cycle: {
    state: "reflexion",
    figure: "sriYantra",
    implementationNote: {
      fr: "Cycle affirmations — pulsation synchronisée au timer.",
      en: "Affirmation cycle — pulse synced to timer.",
    },
  },
  gratitude: {
    state: "repos",
    visualTuning: { particleCount: 12000 },
    implementationNote: {
      fr: "Ambiance chaude discrète ; accent or déjà dans la palette.",
      en: "Warm discreet ambiance; gold accent already in palette.",
    },
  },
  gratitude_triple: CATEGORY_PRESETS.journal,
  journal_prompt: CALM_REPOS,
  journal_stream: CALM_REPOS,
  morning_pages: CALM_REPOS,
  letter_unsent: CALM_REPOS,
  stop_protocol: {
    state: "repos",
    implementationNote: {
      fr: "S : agité (mouvement) → T/O/P : retour progressif vers repos.",
      en: "S: agitated (mouvement) → T/O/P: gradual return to repos.",
    },
  },
  stop_rumination: {
    state: "mouvement",
    implementationNote: {
      fr: "Commencer en mouvement, calmer à chaque lettre STOP.",
      en: "Start in mouvement, calm down with each STOP letter.",
    },
  },
  intention: CATEGORY_PRESETS.intentionality,
  intention_morning: CATEGORY_PRESETS.intentionality,
  intention_week: CATEGORY_PRESETS.intentionality,
  micro_practice: CALM_REPOS,
  dialogue_parts: {
    state: "reflexion",
    implementationNote: {
      fr: "Teinte dominante par voix (moi / autre / pont).",
      en: "Dominant tint per voice (me / other / bridge).",
    },
  },
  decision_matrix: {
    state: "reflexion",
    figure: "metatron",
    implementationNote: {
      fr: "Deux clusters visuels selon l'option sélectionnée.",
      en: "Two visual clusters depending on selected option.",
    },
  },
  empathy_perspective: {
    state: "repos",
    implementationNote: {
      fr: "Accent or renforcé en mode « pont ».",
      en: "Stronger gold accent in bridge mode.",
    },
  },
  shadow_checkin: {
    state: "reflexion",
    visualTuning: { particleCount: 13000 },
    implementationNote: {
      fr: "Assombrir / densifier selon le slider d'intensité.",
      en: "Darken / densify based on intensity slider.",
    },
  },
  meditation: {
    state: "repos",
    cloudHeightRatio: 0.4,
    audioTuning: {
      ambientBoomStrength: 0.45,
      boomStrength: 1.15,
      reflexionAudioScale: 0.22,
    },
    implementationNote: {
      fr: "Identique MeditationNebula — réactivité au flux audio.",
      en: "Same as MeditationNebula — reactive to audio stream.",
    },
  },
  course: {
    state: "repos",
    cloudHeightRatio: 0.3,
    implementationNote: {
      fr: "Bandeau décoratif derrière le contenu cours (vidéo/texte).",
      en: "Decorative band behind course content (video/text).",
    },
  },
  external_link: CALM_REPOS,
};

const KIND_PRESETS: Partial<Record<ResolvedWidgetKind, ToolboxNebulaPreset>> = {
  breathwork: BREATH_MOUVEMENT,
  visualization: SLUG_PRESETS.visualization,
  body_scan: CATEGORY_PRESETS.body,
  affirmations: SLUG_PRESETS.affirmations,
  gratitude: SLUG_PRESETS.gratitude,
  journal_prompt: CALM_REPOS,
  journal_timed: CALM_REPOS,
  stop_protocol: SLUG_PRESETS.stop_protocol,
  intention: CATEGORY_PRESETS.intentionality,
  micro_practice: CALM_REPOS,
  dialogue_parts: SLUG_PRESETS.dialogue_parts,
  decision_matrix: SLUG_PRESETS.decision_matrix,
  empathy_perspective: SLUG_PRESETS.empathy_perspective,
  shadow_checkin: SLUG_PRESETS.shadow_checkin,
  composed: REFLEXION_FOCUS,
};

export function getToolboxNebulaPreset(
  slug: string,
  category = "custom",
  resolvedKind?: ResolvedWidgetKind | null,
): ToolboxNebulaPreset {
  if (SLUG_PRESETS[slug]) return SLUG_PRESETS[slug];
  if (resolvedKind && KIND_PRESETS[resolvedKind]) return KIND_PRESETS[resolvedKind]!;
  return CATEGORY_PRESETS[category] ?? CALM_REPOS;
}
