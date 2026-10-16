export const INTRO_V2_NEURAL_HOLD_SEC = 3.2;

export type IntroV2NeuralPreset = {
  baseAccent: number;
  /** Four overlay tints (accent mix weights), revealed on hold. */
  overlayAccents: [number, number, number, number];
  /** 0–1 how much overlay layers appear at full hold. */
  overlayMix: number;
  /** Slight extra density on the base layer (optional). */
  densityBoost: number;
  speed: number;
  opacity: number;
};

export const INTRO_V2_NEURAL: IntroV2NeuralPreset = {
  baseAccent: 0.08,
  overlayAccents: [0.48, 0.34, 0.56, 0.28],
  overlayMix: 0.68,
  densityBoost: 0.08,
  speed: 0.0008,
  opacity: 0.78,
};

/** Softer motion + denser field — tuned for phone GPUs (paired with lite shader). */
export const INTRO_V2_NEURAL_MOBILE: IntroV2NeuralPreset = {
  baseAccent: 0.22,
  overlayAccents: [0.55, 0.4, 0.52, 0.34],
  overlayMix: 0.78,
  densityBoost: 0.22,
  speed: 0.00065,
  opacity: 1,
};
