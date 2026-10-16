import type { FlowGpgpuTuning } from "./flowGpgpuTuning";
import { INTRO_V2_FLOW } from "./introV2FlowPreset";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";

/** Cible « net » réglable en dev (focus, aperture, vitesse, résolution particules). */
export type FlowGpgpuDevKnobs = {
  focus: number;
  aperture: number;
  simSize: number;
  speed: number;
  /** When false, sliders apply live — no hold morph. */
  holdAnimEnabled?: boolean;
};

export type FlowKeyframeId = 0 | 1 | 2 | 3;

export type FlowKeyframe = Pick<FlowGpgpuDevKnobs, "focus" | "aperture" | "simSize" | "speed">;

export type FlowGpgpuDevState = FlowGpgpuDevKnobs & {
  holdDurationSec: number;
};

export const FLOW_GPGPU_DEV_DEFAULT: FlowGpgpuDevState = {
  focus: INTRO_V2_FLOW.focus,
  aperture: INTRO_V2_FLOW.aperture,
  simSize: INTRO_V2_FLOW.simSize,
  speed: INTRO_V2_FLOW.speed,
  holdAnimEnabled: false,
  holdDurationSec: 3.2,
};

export function snapshotFlowKeyframe(state: FlowGpgpuDevKnobs): FlowKeyframe {
  return {
    focus: state.focus,
    aperture: state.aperture,
    simSize: state.simSize,
    speed: state.speed,
  };
}

/** Hold 0 → 1 walks these four looks (captured in the flow playground). */
export const FLOW_HOLD_KEYFRAMES: readonly [FlowKeyframe, FlowKeyframe, FlowKeyframe, FlowKeyframe] = [
  { focus: 4.1, aperture: 1.8, simSize: 512, speed: 100 },
  { focus: 7.0, aperture: 3.15, simSize: 512, speed: 67 },
  { focus: 6.8, aperture: 4.1, simSize: 512, speed: 55 },
  { focus: 5.0, aperture: 4.9, simSize: 384, speed: 50 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Even steps: 0 at rest, 1 at ⅓, 2 at ⅔, 3 at the end of the hold. */
export function sampleFlowHoldKeyframes(holdMix: number): FlowKeyframe {
  const t = Math.min(1, Math.max(0, holdMix));
  const scaled = t * 3;
  const index = Math.min(2, Math.floor(scaled));
  const u = scaled - index;
  const from = FLOW_HOLD_KEYFRAMES[index];
  const to = FLOW_HOLD_KEYFRAMES[index + 1];
  return {
    focus: lerp(from.focus, to.focus, u),
    aperture: lerp(from.aperture, to.aperture, u),
    speed: lerp(from.speed, to.speed, u),
    simSize: u < 0.92 ? from.simSize : to.simSize,
  };
}

/** Intro scene 3: idle is keyframe 0, hold plays 0 → 1 → 2 → 3. */
export const INTRO_FLOW_SCENE_KNOBS: FlowGpgpuDevKnobs = {
  focus: FLOW_HOLD_KEYFRAMES[0].focus,
  aperture: FLOW_HOLD_KEYFRAMES[0].aperture,
  simSize: FLOW_HOLD_KEYFRAMES[0].simSize,
  speed: FLOW_HOLD_KEYFRAMES[0].speed,
  holdAnimEnabled: true,
};

export function flowClearKnobsFromPreset(): FlowGpgpuDevKnobs {
  return { ...INTRO_FLOW_SCENE_KNOBS };
}

export function flowHoldVisualMix(
  hold: HoldState,
  phase: IntroPhase | undefined,
  holdAnimEnabled = true,
): number {
  if (!holdAnimEnabled) return 1;
  return holdChapterMix(hold, phase ?? "entry");
}

export function resolveFlowTuningFromHold(knobs: FlowGpgpuDevKnobs, holdMix: number): FlowGpgpuTuning {
  const shot = knobs.holdAnimEnabled === false ? knobs : sampleFlowHoldKeyframes(holdMix);
  return {
    ...INTRO_V2_FLOW,
    focus: shot.focus,
    aperture: shot.aperture,
    speed: shot.speed,
    simSize: shot.simSize,
    paramSmoothing: 0.14,
  };
}
