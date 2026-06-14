/**
 * Tracking Evolution Engine — pure function, no I/O.
 *
 * Takes:
 *  - baselineResult: the initial Deep Dive unified scores
 *  - trackingResponses: all answered daily check-in responses in a period
 *
 * Returns: TrackingEvolutionResult with per-archetype delta, narrative cues.
 */

import type { DeepDiveResult, ArchetypeScore } from "@/features/archetype-deepdive-v2/domain/computeDeepDiveScores";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import type {
  TrackingDailyResponse,
  TrackingQuestion,
  ArchetypeScoresMap,
  ArchetypeScoreSnapshot,
  ArchetypeDelta,
  TrackingEvolutionResult,
} from "./types";

// ---------------------------------------------------------------------------
// Baseline extraction
// ---------------------------------------------------------------------------

/** Convert a DeepDiveResult into the normalised ArchetypeScoresMap. */
export function extractBaselineScores(result: DeepDiveResult): ArchetypeScoresMap {
  const map: ArchetypeScoresMap = {};
  const maxTotal = result.archetypes.reduce((m, a) => Math.max(m, a.total), 0);

  for (const a of result.archetypes) {
    map[a.archetype as AnyArchetypeKey] = {
      light:     a.light,
      shadow:    a.shadow,
      total:     a.total,
      net:       a.net,
      intensity: maxTotal > 0 ? a.total / maxTotal : 0,
    };
  }
  return map;
}

// ---------------------------------------------------------------------------
// Tracking scores from daily responses
// ---------------------------------------------------------------------------

interface ResponseWithQuestion extends TrackingDailyResponse {
  question: TrackingQuestion | null;
}

/**
 * Aggregate daily tracking responses into per-archetype scores.
 *
 * Scale questions:
 *   - Normalise the numeric_value to 0..1 range.
 *   - Apply to the archetype_target with dimension_target polarity.
 *   - Weight by question.weight.
 *
 * Choice questions:
 *   - Use the stored weights_applied directly.
 *
 * Text questions:
 *   - Ignored (no scoring signal).
 */
export function computeTrackingScores(
  responses: ResponseWithQuestion[],
): ArchetypeScoresMap {
  const lightByArch = new Map<AnyArchetypeKey, number>();
  const shadowByArch = new Map<AnyArchetypeKey, number>();

  for (const r of responses) {
    if (!r.question) continue;

    const q = r.question;

    if (q.question_type === "scale" && r.numeric_value !== null) {
      if (!q.archetype_target) continue;

      const range = q.scale_max - q.scale_min;
      const normalised = range > 0 ? (r.numeric_value - q.scale_min) / range : 0.5;
      const contribution = normalised * q.weight;

      const arch = q.archetype_target;

      if (q.dimension_target === "light" || q.dimension_target === "general" || !q.dimension_target) {
        lightByArch.set(arch, (lightByArch.get(arch) ?? 0) + contribution);
      }
      if (q.dimension_target === "shadow") {
        shadowByArch.set(arch, (shadowByArch.get(arch) ?? 0) + contribution);
      }
      if (q.dimension_target === "general") {
        shadowByArch.set(arch, (shadowByArch.get(arch) ?? 0) + contribution * 0.4);
      }
    }

    if (q.question_type === "choice" && r.weights_applied?.length) {
      for (const w of r.weights_applied) {
        const arch = w.archetype as AnyArchetypeKey;
        if (w.polarity === "light") {
          lightByArch.set(arch, (lightByArch.get(arch) ?? 0) + w.weight);
        } else {
          shadowByArch.set(arch, (shadowByArch.get(arch) ?? 0) + w.weight);
        }
      }
    }
  }

  const allKeys = new Set<AnyArchetypeKey>([
    ...lightByArch.keys(),
    ...shadowByArch.keys(),
  ]);

  const map: ArchetypeScoresMap = {};
  const maxTotal = [...allKeys].reduce((m, k) => {
    return Math.max(m, (lightByArch.get(k) ?? 0) + (shadowByArch.get(k) ?? 0));
  }, 0);

  for (const arch of allKeys) {
    const light  = lightByArch.get(arch) ?? 0;
    const shadow = shadowByArch.get(arch) ?? 0;
    const total  = light + shadow;
    map[arch] = {
      light,
      shadow,
      total,
      net: light - shadow,
      intensity: maxTotal > 0 ? total / maxTotal : 0,
    };
  }

  return map;
}

// ---------------------------------------------------------------------------
// Delta computation
// ---------------------------------------------------------------------------

function scoreOrZero(map: ArchetypeScoresMap, arch: AnyArchetypeKey): ArchetypeScoreSnapshot {
  return map[arch] ?? { light: 0, shadow: 0, total: 0, net: 0, intensity: 0 };
}

export function computeDelta(
  baseline: ArchetypeScoresMap,
  current: ArchetypeScoresMap,
): ArchetypeDelta[] {
  const allArchetypes = new Set<AnyArchetypeKey>([
    ...Object.keys(baseline) as AnyArchetypeKey[],
    ...Object.keys(current) as AnyArchetypeKey[],
  ]);

  const deltas: ArchetypeDelta[] = [];

  for (const arch of allArchetypes) {
    const base = scoreOrZero(baseline, arch);
    const curr = scoreOrZero(current, arch);

    const lightDelta  = curr.light  - base.light;
    const shadowDelta = curr.shadow - base.shadow;
    const netDelta    = curr.net    - base.net;
    const magnitude   = Math.abs(netDelta);

    const direction: ArchetypeDelta["direction"] =
      Math.abs(netDelta) < 0.05
        ? "stable"
        : netDelta > 0
          ? "up"
          : "down";

    deltas.push({
      archetype:    arch,
      light_delta:  lightDelta,
      shadow_delta: shadowDelta,
      net_delta:    netDelta,
      direction,
      magnitude,
    });
  }

  return deltas.sort((a, b) => b.magnitude - a.magnitude);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function computeTrackingEvolution(
  baselineResult: DeepDiveResult,
  responses: ResponseWithQuestion[],
): TrackingEvolutionResult {
  const baselineScores  = extractBaselineScores(baselineResult);
  const trackingScores  = computeTrackingScores(responses);
  const archetypeDelta  = computeDelta(baselineScores, trackingScores);

  const strongestShift = archetypeDelta[0]?.archetype ?? null;

  const topGains    = archetypeDelta
    .filter((d) => d.light_delta > 0 && d.direction === "up")
    .slice(0, 3)
    .map((d) => d.archetype);

  const topDeclines = archetypeDelta
    .filter((d) => d.shadow_delta > 0 || d.direction === "down")
    .slice(0, 3)
    .map((d) => d.archetype);

  const shadowWarnings = archetypeDelta
    .filter((d) => {
      const curr = trackingScores[d.archetype];
      return curr && curr.shadow > curr.light;
    })
    .map((d) => d.archetype);

  return {
    archetypeDelta,
    strongestShift,
    baselineScores,
    trackingScores,
    responseCount: responses.length,
    narrative_cues: {
      top_gains:       topGains,
      top_declines:    topDeclines,
      shadow_warnings: shadowWarnings,
    },
  };
}
