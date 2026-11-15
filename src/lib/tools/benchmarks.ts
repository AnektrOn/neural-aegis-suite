import type { CeoArchetype, CeoProfile, CeoStage } from "./ceoProfile";

type StageMap = Record<CeoStage, number>;

export const FATIGUE_BENCHMARKS: Record<CeoArchetype, StageMap> = {
  "first-time-founder": {
    ideation: 42,
    "pmf-search": 58,
    "early-traction": 64,
    scaling: 71,
    hypergrowth: 78,
  },
  "serial-entrepreneur": {
    ideation: 35,
    "pmf-search": 51,
    "early-traction": 58,
    scaling: 68,
    hypergrowth: 72,
  },
  "corporate-escapee": {
    ideation: 48,
    "pmf-search": 62,
    "early-traction": 66,
    scaling: 70,
    hypergrowth: 74,
  },
  "technical-founder": {
    ideation: 45,
    "pmf-search": 60,
    "early-traction": 67,
    scaling: 73,
    hypergrowth: 76,
  },
  "hypergrowth-leader": {
    ideation: 38,
    "pmf-search": 55,
    "early-traction": 62,
    scaling: 72,
    hypergrowth: 80,
  },
};

export const CONTEXT_SWITCH_BENCHMARKS_HOURS: Record<CeoArchetype, StageMap> = {
  "first-time-founder": {
    ideation: 3.5,
    "pmf-search": 5,
    "early-traction": 6.5,
    scaling: 8,
    hypergrowth: 10,
  },
  "serial-entrepreneur": {
    ideation: 3,
    "pmf-search": 4.5,
    "early-traction": 5.5,
    scaling: 7,
    hypergrowth: 9,
  },
  "corporate-escapee": {
    ideation: 4,
    "pmf-search": 5.5,
    "early-traction": 7,
    scaling: 8.5,
    hypergrowth: 10.5,
  },
  "technical-founder": {
    ideation: 4.5,
    "pmf-search": 6,
    "early-traction": 7.5,
    scaling: 9,
    hypergrowth: 11,
  },
  "hypergrowth-leader": {
    ideation: 3.5,
    "pmf-search": 5,
    "early-traction": 6,
    scaling: 8.5,
    hypergrowth: 12,
  },
};

export function getFatigueBenchmark(profile: CeoProfile | null): number | null {
  if (!profile) return null;
  return FATIGUE_BENCHMARKS[profile.archetype][profile.stage];
}

export function getContextSwitchBenchmark(profile: CeoProfile | null): number | null {
  if (!profile) return null;
  return CONTEXT_SWITCH_BENCHMARKS_HOURS[profile.archetype][profile.stage];
}

/** Approximate percentile vs. peers (same archetype + stage). */
export function getRelativePercentile(score: number, benchmark: number): number {
  if (benchmark <= 0) return 50;
  const delta = (score - benchmark) / benchmark;
  const raw = 50 + delta * 35;
  return Math.min(99, Math.max(1, Math.round(raw)));
}