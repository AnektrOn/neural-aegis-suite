import type { FlowGpgpuTuning } from "./flowGpgpuTuning";

export type { FlowGpgpuTuning } from "./flowGpgpuTuning";

export const INTRO_V2_FLOW_HOLD_SEC = 3.2;

/** Rest look = hold keyframe 0. The hold walks 0 → 3 in flowGpgpuHoldMorph. */
export const INTRO_V2_FLOW: FlowGpgpuTuning = {
  focus: 4.1,
  speed: 100,
  aperture: 1.8,
  fov: 20,
  curl: 0.25,
  simSize: 512,
  shakeIntensity: 0.12,
  simTimeScale: 0.015,
  octaveStrength: 1,
  curlMix: 1,
  apertureBias: 5.6,
  blurMultiplier: 9,
  paramSmoothing: 0.1,
  goldMix: 0.42,
  alphaFalloff: 1.5,
  particleOpacity: 1,
  pointSizeBoost: 1,
  dominant: 0x18bec7,
  accent: 0xe8b923,
  cameraPathSpeed: 0.028,
  cameraHandheld: 1,
  cameraFovMin: 22,
  cameraFovMax: 28,
  shakeMaxYaw: 0.02,
  shakeMaxPitch: 0.015,
  shakeMaxRoll: 0.02,
  dprMax: 1.5,
};
