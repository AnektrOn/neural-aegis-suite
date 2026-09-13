import type { BreathworkConfig } from "@/components/widgets/BreathworkWidget";

export type BreathingOrbPatternId = "box" | "478" | "coherence" | "calm";

export type OrbBreathPhase = "breath_in" | "pause1" | "breath_out" | "pause2";

export const BREATHING_ORB_PATTERNS: Record<
  BreathingOrbPatternId,
  { label: string; config: BreathworkConfig }
> = {
  box: {
    label: "Box (4-4-4-4)",
    config: {
      cycles: 8,
      breath_in_sec: 4,
      pause1_sec: 4,
      breath_out_sec: 4,
      pause2_sec: 4,
    },
  },
  "478": {
    label: "4-7-8",
    config: {
      cycles: 4,
      breath_in_sec: 4,
      pause1_sec: 7,
      breath_out_sec: 8,
      pause2_sec: 0,
    },
  },
  coherence: {
    label: "Cohérence (5-5)",
    config: {
      cycles: 6,
      breath_in_sec: 5,
      pause1_sec: 0,
      breath_out_sec: 5,
      pause2_sec: 0,
    },
  },
  calm: {
    label: "Calme (4-6)",
    config: {
      cycles: 6,
      breath_in_sec: 4,
      pause1_sec: 0,
      breath_out_sec: 6,
      pause2_sec: 0,
    },
  },
};

/** 0 = contracted, 1 = expanded — cosine easing per phase. */
export function breathOrbExpansion(phase: OrbBreathPhase, phaseProgress: number): number {
  const t = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(phaseProgress, 1));
  switch (phase) {
    case "breath_in":
      return t;
    case "breath_out":
      return 1 - t;
    case "pause1":
      return 1;
    case "pause2":
      return 0;
    default:
      return 0.5;
  }
}

function configMatches(a: BreathworkConfig, b: BreathworkConfig): boolean {
  return (
    a.breath_in_sec === b.breath_in_sec &&
    a.pause1_sec === b.pause1_sec &&
    a.breath_out_sec === b.breath_out_sec &&
    a.pause2_sec === b.pause2_sec
  );
}

export function detectBreathingOrbPattern(
  config: BreathworkConfig,
): BreathingOrbPatternId | null {
  for (const [id, preset] of Object.entries(BREATHING_ORB_PATTERNS) as [
    BreathingOrbPatternId,
    { label: string; config: BreathworkConfig },
  ][]) {
    if (configMatches(config, preset.config)) return id;
  }
  return null;
}
