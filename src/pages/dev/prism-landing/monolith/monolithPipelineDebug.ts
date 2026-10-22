export type MonolithDebugView =
  | "final"
  | "hdr"
  | "nobloom"
  | "nogodrays"
  | "nopost";

export type MonolithPipelineTuning = {
  debugView: MonolithDebugView;
  exposure: number;
  exposureCompensationEv: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  adaptationEnabled: boolean;
  /** Portal core, additive sprites and spill. 1 matches the reference intensity. */
  glowIntensity: number;
};

export const MONOLITH_PIPELINE_DEFAULTS: MonolithPipelineTuning = {
  debugView: "final",
  exposure: 0.95,
  exposureCompensationEv: 0,
  bloomIntensity: 0.28,
  bloomThreshold: 0.85,
  bloomSmoothing: 0.08,
  /** Pre-tone HDR meter is approximate; enable only when validating adaptation. */
  adaptationEnabled: false,
  glowIntensity: 1.15,
};

const DEFAULTS = MONOLITH_PIPELINE_DEFAULTS;

function parseNumber(raw: string | null, fallback: number) {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function readMonolithPipelineTuning(
  search = typeof window !== "undefined"
    ? window.location.search
    : "",
): MonolithPipelineTuning {
  const params = new URLSearchParams(search);
  const debug = params.get("monolithDebug") as MonolithDebugView | null;
  const validDebug: MonolithDebugView[] = [
    "final",
    "hdr",
    "nobloom",
    "nogodrays",
    "nopost",
  ];
  return {
    debugView:
      debug && validDebug.includes(debug) ? debug : DEFAULTS.debugView,
    exposure: parseNumber(params.get("exposure"), DEFAULTS.exposure),
    exposureCompensationEv: parseNumber(
      params.get("exposureEv"),
      DEFAULTS.exposureCompensationEv,
    ),
    bloomIntensity: parseNumber(
      params.get("bloom"),
      DEFAULTS.bloomIntensity,
    ),
    bloomThreshold: parseNumber(
      params.get("bloomThreshold"),
      DEFAULTS.bloomThreshold,
    ),
    bloomSmoothing: parseNumber(
      params.get("bloomSmooth"),
      DEFAULTS.bloomSmoothing,
    ),
    adaptationEnabled: params.get("adapt") === "1",
    glowIntensity: parseNumber(params.get("glow"), DEFAULTS.glowIntensity),
  };
}

export function applyMonolithDebugView(
  view: MonolithDebugView,
  controls: {
    godraysPass: { enabled: boolean };
    bloom: { intensity: number };
  },
) {
  switch (view) {
    case "nopost":
      controls.godraysPass.enabled = false;
      controls.bloom.intensity = 0;
      break;
    case "hdr":
      controls.godraysPass.enabled = false;
      controls.bloom.intensity = 0;
      break;
    case "nobloom":
      controls.godraysPass.enabled = true;
      controls.bloom.intensity = 0;
      break;
    case "nogodrays":
      controls.godraysPass.enabled = false;
      break;
    case "final":
    default:
      controls.godraysPass.enabled = true;
      break;
  }
}
