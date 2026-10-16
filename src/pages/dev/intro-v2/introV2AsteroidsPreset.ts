/** Scene 1 — comet fall (minimal cluster + hold reveal). */
export const INTRO_V2_ASTEROIDS_HOLD_SEC = 30;

export type IntroV2AsteroidsPreset = {
  /** Visible comets before / without hold. */
  countIdle: number;
  /** Max comets at full hold (still restrained). */
  countHoldMax: number;
  timeBoostMax: number;
  swayIdle: number;
  swayMax: number;
  fog: number;
};

/** Chase progress per second along K1→K2 (lower = longer traveling). */
export const INTRO_V2_ASTEROIDS_CHASE_SPEED = 0.026;

export const INTRO_V2_ASTEROIDS: IntroV2AsteroidsPreset = {
  countIdle: 0,
  countHoldMax: 222,
  timeBoostMax: 1.15,
  swayIdle: 0.07,
  swayMax: 0.2,
  fog: 0.0026,
};
