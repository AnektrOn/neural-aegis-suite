/** Tunables for intro scene 3 (GPGPU curl + DOF particles). */
export type FlowGpgpuTuning = {
  focus: number;
  speed: number;
  aperture: number;
  fov: number;
  curl: number;
  simSize: number;
  shakeIntensity: number;
  /** Multiplier on simulation clock inside the curl shader (default 0.015). */
  simTimeScale: number;
  /** Scales secondary curl octave layers (1 = example default). */
  octaveStrength: number;
  /** Bias on noise-driven mix between raw curl and stacked curl. */
  curlMix: number;
  /** `(apertureBias - aperture) * blurMultiplier` → DOF blur uniform. */
  apertureBias: number;
  blurMultiplier: number;
  /** Lerp speed when focus / fov / blur / curl catch up (0–1 per frame). */
  paramSmoothing: number;
  goldMix: number;
  alphaFalloff: number;
  particleOpacity: number;
  pointSizeBoost: number;
  dominant: number;
  accent: number;
  cameraPathSpeed: number;
  cameraHandheld: number;
  cameraFovMin: number;
  cameraFovMax: number;
  shakeMaxYaw: number;
  shakeMaxPitch: number;
  shakeMaxRoll: number;
  dprMax: number;
};
