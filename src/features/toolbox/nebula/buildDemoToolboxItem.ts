import { DEFAULT_VISUALIZATION_SCENES } from "@/components/widgets/VisualizationWidget";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";

const JOURNAL_TIMED_SLUGS = new Set(["journal_stream", "morning_pages", "letter_unsent"]);

const BESPOKE_FIELD_DEFAULTS: Record<string, string[]> = {
  dialogue_parts: ["Voix protectrice", "Voix critique"],
  decision_matrix: ["Option A", "Option B", "Impact long terme"],
  empathy_perspective: ["Moi", "Autre", "Pont"],
  shadow_checkin: ["Ombre", "Intensité", "Déclencheur"],
};

function patchWidgetConfig(
  slug: string,
  sample: Record<string, unknown>,
): Record<string, unknown> {
  const cfg = { ...sample };

  if (
    slug === "visualization"
    || slug === "safe_place"
    || slug === "open_monitoring"
  ) {
    const scenes = cfg.scenes;
    const hasRichScenes =
      Array.isArray(scenes)
      && scenes.length > 0
      && typeof (scenes[0] as { instruction?: unknown })?.instruction === "string";
    if (!hasRichScenes) {
      return { mode: "timed", scenes: DEFAULT_VISUALIZATION_SCENES };
    }
  }

  if (slug === "affirmations" || slug === "affirmations_cycle") {
    if (cfg.duration_min == null && !(typeof cfg.duration_sec === "number" && cfg.duration_sec > 0)) {
      cfg.duration_min = 3;
    }
    if (!Array.isArray(cfg.affirmations) || cfg.affirmations.length === 0) {
      cfg.affirmations = ["Je reste centré(e)", "Je passe à l'action"];
    }
  }

  if (JOURNAL_TIMED_SLUGS.has(slug)) {
    if (!cfg.prompt && !cfg.instructions) {
      cfg.instructions = "Écris sans filtre pendant toute la durée.";
    }
    if (!cfg.duration_sec) cfg.duration_sec = 120;
  }

  if (BESPOKE_FIELD_DEFAULTS[slug] && !Array.isArray(cfg.fields)) {
    cfg.fields = BESPOKE_FIELD_DEFAULTS[slug];
  }

  if (!cfg.instructions && typeof cfg.instructions !== "string") {
    const steps = cfg.steps;
    if (Array.isArray(steps) && steps.length > 0) {
      cfg.instructions = "Suis les étapes ci-dessous.";
    }
  }

  return cfg;
}

export function buildDemoToolboxItem(def: ToolboxContentTypeDefinition): ToolboxRenderableItem {
  return {
    id: `demo-${def.slug}`,
    content_type: def.slug,
    content_type_slug: def.slug,
    title: def.default_title_fr,
    widget_config: patchWidgetConfig(def.slug, def.sample_config),
    duration: null,
    external_url: null,
  };
}

export const EXTRA_TOOLBOX_DEMO_TYPES: Array<{
  slug: string;
  label_fr: string;
  label_en: string;
  category: string;
  description_fr: string;
  item: ToolboxRenderableItem;
}> = [
  {
    slug: "meditation",
    label_fr: "Méditation (audio)",
    label_en: "Meditation (audio)",
    category: "attention",
    description_fr: "Session audio avec MeditationNebula (hors widget natif).",
    item: {
      id: "demo-meditation",
      content_type: "meditation",
      title: "Méditation guidée — démo",
      widget_config: {},
      duration: "10 min",
      external_url: null,
    },
  },
  {
    slug: "course",
    label_fr: "Cours",
    label_en: "Course",
    category: "custom",
    description_fr: "Contenu cours — nébule décorative derrière le player.",
    item: {
      id: "demo-course",
      content_type: "course",
      title: "Module — Introduction",
      widget_config: {},
      duration: null,
      external_url: null,
    },
  },
  {
    slug: "external_link",
    label_fr: "Lien externe",
    label_en: "External link",
    category: "custom",
    description_fr: "Ouverture ressource externe avec ambiance particules.",
    item: {
      id: "demo-external",
      content_type: "external_link",
      title: "Ressource externe",
      widget_config: {},
      duration: null,
      external_url: "https://example.com",
    },
  },
];
