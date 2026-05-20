import type { BreathworkConfig } from "@/components/widgets/BreathworkWidget";

export type BreathVisualVariant = "circle" | "box";

export interface ResolvedBreathwork {
  config: BreathworkConfig;
  visualVariant: BreathVisualVariant;
}

function readPositiveInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function hasBreathShape(cfg: Record<string, unknown>): boolean {
  return (
    cfg.cycles != null
    && cfg.breath_in_sec != null
    && cfg.pause1_sec != null
    && cfg.breath_out_sec != null
    && cfg.pause2_sec != null
  );
}

function readInstructionFragment(cfg: Record<string, unknown>): string {
  const s = typeof cfg.instructions === "string" ? cfg.instructions.trim() : "";
  return s;
}

/** Slugs that should use BreathworkWidget (animated) instead of ComposedRendererV1. */
const BREATH_ALIAS_DEFAULTS: Record<
  string,
  { visual: BreathVisualVariant; build: (cfg: Record<string, unknown>) => BreathworkConfig }
> = {
  breath_box: {
    visual: "box",
    build: (cfg) => {
      if (hasBreathShape(cfg)) {
        return {
          cycles: readPositiveInt(cfg.cycles, 15),
          breath_in_sec: readPositiveInt(cfg.breath_in_sec, 4),
          pause1_sec: readPositiveInt(cfg.pause1_sec, 4),
          breath_out_sec: readPositiveInt(cfg.breath_out_sec, 4),
          pause2_sec: readPositiveInt(cfg.pause2_sec, 4),
        };
      }
      const durationSec = readPositiveInt(cfg.duration_sec, 240);
      const unit = 4;
      const cycleLen = unit * 4;
      const cycles = Math.max(1, Math.floor(durationSec / cycleLen));
      return {
        cycles,
        breath_in_sec: unit,
        pause1_sec: unit,
        breath_out_sec: unit,
        pause2_sec: unit,
      };
    },
  },
  physiological_sigh: {
    visual: "circle",
    build: (cfg) => {
      if (hasBreathShape(cfg)) {
        return {
          cycles: readPositiveInt(cfg.cycles, 8),
          breath_in_sec: readPositiveInt(cfg.breath_in_sec, 2),
          pause1_sec: readPositiveInt(cfg.pause1_sec, 1),
          breath_out_sec: readPositiveInt(cfg.breath_out_sec, 8),
          pause2_sec: readPositiveInt(cfg.pause2_sec, 0),
        };
      }
      const cycles = Math.max(1, Math.floor(readPositiveInt(cfg.duration_sec, 120) / 11));
      return {
        cycles,
        breath_in_sec: 2,
        pause1_sec: 1,
        breath_out_sec: 8,
        pause2_sec: 0,
      };
    },
  },
  vagal_hum: {
    visual: "circle",
    build: (cfg) => {
      if (hasBreathShape(cfg)) {
        return {
          cycles: readPositiveInt(cfg.cycles, 15),
          breath_in_sec: readPositiveInt(cfg.breath_in_sec, 4),
          pause1_sec: readPositiveInt(cfg.pause1_sec, 0),
          breath_out_sec: readPositiveInt(cfg.breath_out_sec, 8),
          pause2_sec: readPositiveInt(cfg.pause2_sec, 0),
        };
      }
      const durationSec = readPositiveInt(cfg.duration_sec, 180);
      const cycleLen = 12;
      const cycles = Math.max(1, Math.floor(durationSec / cycleLen));
      return {
        cycles,
        breath_in_sec: 4,
        pause1_sec: 0,
        breath_out_sec: 8,
        pause2_sec: 0,
      };
    },
  },
  breath_coherence: {
    visual: "circle",
    build: (cfg) => {
      if (hasBreathShape(cfg)) {
        return {
          cycles: readPositiveInt(cfg.cycles, 30),
          breath_in_sec: readPositiveInt(cfg.breath_in_sec, 5),
          pause1_sec: readPositiveInt(cfg.pause1_sec, 0),
          breath_out_sec: readPositiveInt(cfg.breath_out_sec, 5),
          pause2_sec: readPositiveInt(cfg.pause2_sec, 0),
        };
      }
      const durationSec = readPositiveInt(cfg.duration_sec, 300);
      const inhale = 5;
      const exhale = 5;
      const cycleLen = inhale + exhale;
      const cycles = Math.max(1, Math.floor(durationSec / cycleLen));
      return {
        cycles,
        breath_in_sec: inhale,
        pause1_sec: 0,
        breath_out_sec: exhale,
        pause2_sec: 0,
      };
    },
  },
};

export function isBreathworkAliasSlug(slug: string): boolean {
  return slug in BREATH_ALIAS_DEFAULTS;
}

/**
 * If this slug is a breathing exercise alias, returns config for BreathworkWidget.
 * `breathwork` itself is handled directly in the renderer switch.
 */
export function resolveBreathworkAlias(
  slug: string,
  cfg: Record<string, unknown>,
): ResolvedBreathwork | null {
  const alias = BREATH_ALIAS_DEFAULTS[slug];
  if (!alias) return null;
  const visual =
    cfg.breath_visual === "box" || cfg.breath_visual === "circle"
      ? cfg.breath_visual
      : alias.visual;
  const hint = readInstructionFragment(cfg);
  const base = alias.build(cfg);
  return {
    config: hint ? { ...base, instructions: hint } : base,
    visualVariant: visual,
  };
}
