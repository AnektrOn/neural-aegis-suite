/**
 * Scene-relative HDR hierarchy (threejs-bloom): slit > shaft light > lit surfaces.
 * Tune bloom threshold in HDR space against these, not after tone map.
 */
export const SLIT_HDR = {
  /** Linear RGB heat (toneMapped: false). Green/blue stay low so ACES keeps orange, not white. */
  peakBase: 2.45,
  peakMid: 1.15,
  greenRatio: 0.23,
  blueRatio: 0.04,
} as const;

export const BLOOM_HDR_DEFAULTS = {
  luminanceThreshold: 0.72,
  luminanceSmoothing: 0.08,
  intensity: 0.32,
  mipmapBlur: true,
  radius: 0.35,
} as const;

export const TONE_HDR_DEFAULTS = {
  /** Single owner: post ToneMappingEffect (renderer stays NoToneMapping). */
  mode: "ACES_FILMIC" as const,
  middleGrey: 0.18,
  minLuminance: 0.002,
  minExposure: 0.45,
  maxExposure: 1.85,
  adaptationSpeedUp: 3.2,
  adaptationSpeedDown: 1.1,
  meterIntervalFrames: 12,
} as const;
