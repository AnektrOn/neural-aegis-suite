import type { BreathVisualVariant } from "@/lib/toolbox-breath-alias";
import { resolveBreathworkAlias, isBreathworkAliasSlug } from "@/lib/toolbox-breath-alias";
import { applySlugTheme, getSlugAccent } from "@/lib/toolbox-slug-themes";
import type { MicroPracticeConfig } from "@/components/widgets/MicroPracticeWidget";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import {
  BUILTIN_TOOLBOX_SLUG_ALIASES,
  getBuiltinToolboxContentTypeDefinition,
} from "@/lib/toolbox-content-type-definitions";

export type ResolvedWidgetKind =
  | "breathwork"
  | "gratitude"
  | "affirmations"
  | "intention"
  | "stop_protocol"
  | "visualization"
  | "body_scan"
  | "micro_practice"
  | "journal_prompt"
  | "journal_timed"
  | "dialogue_parts"
  | "decision_matrix"
  | "empathy_perspective"
  | "shadow_checkin"
  | "composed";

export interface ResolvedToolboxWidget {
  kind: ResolvedWidgetKind;
  config: Record<string, unknown>;
  breathVisual?: BreathVisualVariant;
  accent?: string;
}

function readStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function readPosInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "text" in item) {
        return readStr((item as { text?: unknown }).text);
      }
      return "";
    })
    .filter(Boolean);
}

function mergeInstructions(cfg: Record<string, unknown>): Record<string, unknown> {
  const hint = readStr(cfg.instructions);
  return hint ? { ...cfg, instructions: hint } : cfg;
}

/** Slugs routed to native widgets via adapter (not direct switch cases). */
const NATIVE_ADAPTER_SLUGS = new Set([
  "physiological_sigh",
  "vagal_hum",
  "gratitude_triple",
  "affirmations_cycle",
  "intention_morning",
  "stop_rumination",
  "safe_place",
  "open_monitoring",
  "progressive_relax",
]);

const MICRO_SLUGS = new Set([
  "micro_movement",
  "shake_release",
  "posture_reset",
  "energy_activation",
  "cold_exposure_prep",
  "walking_meditation",
  "ritual_sequence",
  "habit_checkbox",
  "worry_dump",
  "evening_review",
  "belief_reframe",
  "if_then_plan",
  "archetype_mirror",
  "light_quality_practice",
  "symbol_encounter",
  "boundary_practice",
  "sacred_no",
  "energy_ledger",
  "synchronicity_log",
  "relation_repair",
  "social_micro_action",
  "intention_week",
]);

const JOURNAL_TIMED_SLUGS = new Set(["journal_stream", "morning_pages", "letter_unsent"]);

const BESPOKE_SLUGS = new Set([
  "dialogue_parts",
  "decision_matrix",
  "empathy_perspective",
  "shadow_checkin",
]);

const AEGIS_META_KEYS = [
  "tier",
  "pillar",
  "exocortex_organ",
  "mechanism_tag",
  "parent_template_key",
  "why_this_for_you",
  "why_this_for_you_i18n",
  "resistance_fallback_sec",
  "archetype_targets",
  "shadow_targets",
  "distribution_mode",
  "instructions_i18n",
] as const;

function withAegisMeta(
  src: Record<string, unknown>,
  target: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...target };
  for (const key of AEGIS_META_KEYS) {
    if (src[key] !== undefined && out[key] === undefined) {
      out[key] = src[key];
    }
  }
  return out;
}

function adaptGratitudeTriple(cfg: Record<string, unknown>): ResolvedToolboxWidget {
  return {
    kind: "gratitude",
    config: withAegisMeta(cfg, {
      entries_count: readPosInt(cfg.entries_count, 3),
      ...(Array.isArray(cfg.prompts) ? { prompts: cfg.prompts } : {}),
      ...(cfg.prompts_i18n ? { prompts_i18n: cfg.prompts_i18n } : {}),
    }),
  };
}

function adaptAffirmationsCycle(cfg: Record<string, unknown>): ResolvedToolboxWidget {
  const lines = toStringList(cfg.affirmations);
  return {
    kind: "affirmations",
    config: withAegisMeta(cfg, {
      duration_min: readPosInt(cfg.duration_min, 5),
      affirmations: lines.length ? lines : ["Je reste stable", "Je passe à l'action"],
      ...(cfg.affirmations_i18n ? { affirmations_i18n: cfg.affirmations_i18n } : {}),
      instructions: readStr(cfg.instructions),
    }),
  };
}

function adaptIntentionMorning(cfg: Record<string, unknown>): ResolvedToolboxWidget {
  const fields = toStringList(cfg.fields);
  const question =
    readStr(cfg.question) || fields[0] || readStr(cfg.instructions) || "Quelle est ton intention du jour ?";
  return {
    kind: "intention",
    config: withAegisMeta(cfg, {
      question,
      ...(cfg.question_i18n ? { question_i18n: cfg.question_i18n } : {}),
      ...(cfg.note_prompt ? { note_prompt: cfg.note_prompt } : {}),
      ...(cfg.note_prompt_i18n ? { note_prompt_i18n: cfg.note_prompt_i18n } : {}),
      duration_sec: readPosInt(cfg.duration_sec, 360),
      allow_note: cfg.allow_note !== false,
    }),
  };
}

function adaptStopRumination(cfg: Record<string, unknown>): ResolvedToolboxWidget {
  const rawSteps = Array.isArray(cfg.steps) ? cfg.steps : [];
  const hasStructuredSteps = rawSteps.some(
    (s) => s && typeof s === "object" && ("title" in s || "hint" in s || "title_i18n" in s || "hint_i18n" in s),
  );
  const steps = hasStructuredSteps
    ? rawSteps
    : toStringList(cfg.steps).map((text, i) => ({
        title: ["Nommer", "Respirer", "Observer", "Rediriger"][i] ?? `Étape ${i + 1}`,
        hint: text,
      }));
  return {
    kind: "stop_protocol",
    config: withAegisMeta(cfg, {
      mode: cfg.mode === "manual" ? "manual" : "timed",
      step_duration_sec: readPosInt(
        cfg.step_duration_sec,
        Math.max(30, Math.floor(readPosInt(cfg.duration_sec, 180) / 4)),
      ),
      steps: steps.length ? steps : undefined,
    }),
  };
}

function adaptVisualization(cfg: Record<string, unknown>, slug: string): ResolvedToolboxWidget {
  if (Array.isArray(cfg.scenes) && cfg.scenes.length > 0) {
    return {
      kind: "visualization",
      config: withAegisMeta(cfg, {
        mode: cfg.mode === "manual" ? "manual" : "timed",
        scenes: cfg.scenes,
      }),
    };
  }
  const total = readPosInt(cfg.duration_sec, slug === "safe_place" ? 420 : 480);
  const intro = readStr(cfg.instructions);
  const sceneCount = slug === "safe_place" ? 3 : 2;
  const perScene = Math.max(60, Math.floor(total / sceneCount));
  const labels =
    slug === "safe_place"
      ? ["Ancrage", "Lieu refuge", "Ancrage sensoriel"]
      : ["Présence", "Observation ouverte"];
  const scenes = labels.map((label, i) => ({
    id: `${slug}-${i}`,
    label,
    instruction: i === 0 && intro ? intro : intro || label,
    duration_sec: perScene,
    color: ["hsl(176 70% 48%)", "hsl(220 70% 60%)", "hsl(270 50% 60%)"][i],
  }));
  return {
    kind: "visualization",
    config: withAegisMeta(cfg, { mode: "timed", scenes }),
  };
}

function adaptProgressiveRelax(cfg: Record<string, unknown>): ResolvedToolboxWidget {
  if (Array.isArray(cfg.zones) && cfg.zones.length > 0) {
    return {
      kind: "body_scan",
      config: withAegisMeta(cfg, {
        mode: cfg.mode === "manual" ? "manual" : "timed",
        zones: cfg.zones,
      }),
    };
  }
  const steps = toStringList(cfg.steps);
  const zones = (steps.length ? steps : ["Mains", "Épaules", "Jambes"]).map((label, i) => ({
    id: `zone-${i}`,
    label,
    instruction: `Contracte puis relâche : ${label}.`,
    duration_sec: 45,
  }));
  return {
    kind: "body_scan",
    config: withAegisMeta(cfg, { zones }),
  };
}

function adaptMicro(slug: string, cfg: Record<string, unknown>): ResolvedToolboxWidget {
  const merged = applySlugTheme(slug, cfg);
  if (slug === "habit_checkbox" && !merged.steps?.length) {
    merged.steps = [{ text: readStr(cfg.habit_name) || "Marquer comme fait" }];
  }
  if (slug === "intention_week" && !merged.steps?.length) {
    const fields = Array.isArray(cfg.fields)
      ? (cfg.fields as unknown[]).map((f) => String(f))
      : ["Intention", "Action 1", "Action 2", "Action 3"];
    merged.steps = fields.map((f) => ({ text: f }));
    merged.instructions = readStr(cfg.instructions) || merged.instructions;
  }
  return { kind: "micro_practice", config: withAegisMeta(cfg, merged as Record<string, unknown>) };
}

function adaptJournalTimed(slug: string, cfg: Record<string, unknown>): ResolvedToolboxWidget {
  return {
    kind: "journal_timed",
    config: withAegisMeta(cfg, {
      prompt: readStr(cfg.instructions) || readStr(cfg.prompt),
      ...(cfg.prompt_i18n ? { prompt_i18n: cfg.prompt_i18n } : {}),
      duration_sec: readPosInt(cfg.duration_sec, slug === "morning_pages" ? 900 : 600),
      accent_color: getSlugAccent(slug, cfg),
    }),
    accent: getSlugAccent(slug, cfg),
  };
}

function adaptBespoke(slug: string, cfg: Record<string, unknown>): ResolvedToolboxWidget {
  const accent = getSlugAccent(slug, cfg);
  const fields = Array.isArray(cfg.fields)
    ? (cfg.fields as unknown[]).map((f) => String(f))
    : [];
  return {
    kind: slug as ResolvedWidgetKind,
    config: withAegisMeta(cfg, { ...cfg, fields, instructions: readStr(cfg.instructions), accent_color: accent }),
    accent,
  };
}

export function isResolverMappedSlug(rawSlug: string): boolean {
  const slug = BUILTIN_TOOLBOX_SLUG_ALIASES[rawSlug] ?? rawSlug;
  if (
    isBreathworkAliasSlug(slug)
    || NATIVE_ADAPTER_SLUGS.has(slug)
    || MICRO_SLUGS.has(slug)
    || JOURNAL_TIMED_SLUGS.has(slug)
    || BESPOKE_SLUGS.has(slug)
  ) {
    return true;
  }
  const def = getBuiltinToolboxContentTypeDefinition(slug);
  return def?.renderer_kind === "native";
}

export function resolveToolboxWidget(
  rawSlug: string,
  rawCfg: Record<string, unknown> | null,
  definitionsBySlug: Record<string, ToolboxContentTypeDefinition> = {},
): ResolvedToolboxWidget | null {
  const slug = BUILTIN_TOOLBOX_SLUG_ALIASES[rawSlug] ?? rawSlug;
  const cfg = mergeInstructions(rawCfg ?? {});
  const def = definitionsBySlug[rawSlug] || definitionsBySlug[slug] || getBuiltinToolboxContentTypeDefinition(slug);

  const breath = resolveBreathworkAlias(slug, cfg);
  if (breath) {
    return { kind: "breathwork", config: breath.config as unknown as Record<string, unknown>, breathVisual: breath.visualVariant };
  }

  switch (slug) {
    case "gratitude_triple":
      return adaptGratitudeTriple(cfg);
    case "affirmations_cycle":
      return adaptAffirmationsCycle(cfg);
    case "intention_morning":
      return adaptIntentionMorning(cfg);
    case "stop_rumination":
      return adaptStopRumination(cfg);
    case "safe_place":
    case "open_monitoring":
      return adaptVisualization(cfg, slug);
    case "progressive_relax":
      return adaptProgressiveRelax(cfg);
    default:
      break;
  }

  if (MICRO_SLUGS.has(slug)) return adaptMicro(slug, cfg);
  if (JOURNAL_TIMED_SLUGS.has(slug)) return adaptJournalTimed(slug, cfg);
  if (BESPOKE_SLUGS.has(slug)) return adaptBespoke(slug, cfg);

  const presentation = (def?.ui_blueprint as { presentation?: string } | undefined)?.presentation;
  if (def?.renderer_kind === "native" && presentation) {
    switch (presentation) {
      case "micro":
        return adaptMicro(slug, cfg);
      case "journal_timed":
        return adaptJournalTimed(slug, cfg);
      case "dialogue_parts":
        return adaptBespoke("dialogue_parts", cfg);
      case "decision_matrix":
        return adaptBespoke("decision_matrix", cfg);
      case "empathy_perspective":
        return adaptBespoke("empathy_perspective", cfg);
      case "shadow_checkin":
        return adaptBespoke("shadow_checkin", cfg);
      case "gratitude":
        return adaptGratitudeTriple(cfg);
      case "affirmations":
        return adaptAffirmationsCycle(cfg);
      case "intention":
        return adaptIntentionMorning(cfg);
      case "stop_protocol":
        return adaptStopRumination(cfg);
      case "visualization":
        return adaptVisualization(cfg, slug);
      case "body_scan":
        return adaptProgressiveRelax(cfg);
      case "breathwork": {
        const breath = resolveBreathworkAlias(slug, cfg);
        if (breath) return { kind: "breathwork", config: breath.config as unknown as Record<string, unknown>, breathVisual: breath.visualVariant };
        break;
      }
      default:
        break;
    }
  }

  if (def?.renderer_kind === "composed_v1") {
    return { kind: "composed", config: cfg };
  }

  return null;
}

export function canResolveToolboxWidget(
  slug: string,
  rawCfg: Record<string, unknown> | null,
  definitionsBySlug: Record<string, ToolboxContentTypeDefinition> = {},
): boolean {
  if (slug === "external_link") return false;
  const resolved = resolveToolboxWidget(slug, rawCfg, definitionsBySlug);
  if (!resolved) return false;
  if (resolved.kind === "composed") return true;
  if (resolved.kind === "affirmations") {
    return resolved.config.duration_min != null;
  }
  if (resolved.kind === "journal_timed") {
    return !!readStr(resolved.config.prompt);
  }
  return true;
}
