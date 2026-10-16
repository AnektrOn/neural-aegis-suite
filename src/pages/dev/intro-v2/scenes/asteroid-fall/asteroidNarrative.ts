/**
 * Scene 1 hold — text / meteors / camera beats (10 lines after prologue).
 * Tune LINE_WEIGHTS, the ramp anchors and INTRO_V2_ASTEROIDS_HOLD_SEC together.
 */
export const ASTEROID_HOLD_LINE_COUNT = 10;
export const ASTEROID_METEOR_MAX = 222;

/** Relative time on screen per line (Sans repère → noyés). */
const LINE_WEIGHTS = [0.25, 0.32, 0.32, 0.55, 0.55, 0.8, 0.5, 0.45, 0.42, 0.48];
const WEIGHT_SUM = LINE_WEIGHTS.reduce((a, b) => a + b, 0);
const LINE_STARTS = LINE_WEIGHTS.map((_, i) => LINE_WEIGHTS.slice(0, i).reduce((a, b) => a + b, 0));

/** Global position (weight units) at line `index`, fraction `t` of that line. */
function at(index: number, t: number) {
  return LINE_STARTS[index] + LINE_WEIGHTS[index] * t;
}

/** 10 → 222 ramp: starts early in « Centaines », ends early in « Trop d’informations ». */
const RAMP_START = at(4, 0.15);
const RAMP_END = at(6, 0.35);
/** >1 = slow start (one by one, then two by two…), faster at the end. */
const RAMP_CURVE = 2.2;

/** Camera K2 → K4 overlaps the end of the ramp, settles before the closing lines. */
const CAM_START = at(5, 0.35);
const CAM_END = at(6, 0.7);

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function span(g: number, start: number, end: number) {
  return clamp01((g - start) / (end - start));
}

export type AsteroidNarrativeSample = {
  holdLineIndex: number;
  meteorCount: number;
  filmT: number;
  sway: number;
  timeRate: number;
  /** 0..1 scrim behind copy when the field is dense. */
  textBackdrop: number;
};

const IDLE: AsteroidNarrativeSample = {
  holdLineIndex: -1,
  meteorCount: 0,
  filmT: 0,
  sway: 0.05,
  timeRate: 1,
  textBackdrop: 0,
};

function lineAt(g: number) {
  for (let i = LINE_WEIGHTS.length - 1; i >= 0; i--) {
    if (g >= LINE_STARTS[i]) return i;
  }
  return 0;
}

export function asteroidHoldLineIndex(mix: number): number {
  if (mix <= 0) return -1;
  return lineAt(clamp01(mix) * WEIGHT_SUM - 1e-9);
}

export function sampleAsteroidNarrative(mix: number): AsteroidNarrativeSample {
  if (mix <= 0) return IDLE;

  const g = clamp01(mix) * WEIGHT_SUM;
  const holdLineIndex = lineAt(g - 1e-9);

  // 0 until « Une information », 1 until « Puis dix », then 1 → 10 across that line.
  let meteorCount = 0;
  if (g >= LINE_STARTS[1]) meteorCount = 1;
  if (g >= LINE_STARTS[3]) meteorCount = 1 + 9 * span(g, at(3, 0.05), at(3, 0.9));

  const ramp = span(g, RAMP_START, RAMP_END);
  if (ramp > 0) meteorCount = 10 + (ASTEROID_METEOR_MAX - 10) * Math.pow(ramp, RAMP_CURVE);

  // Gentle early drift toward K2-side, then the K2 → K4 orbit.
  const early = smoothstep(span(g, LINE_STARTS[1], CAM_START)) * 0.42;
  const filmT = early + smoothstep(span(g, CAM_START, CAM_END)) * 0.58;

  const density = meteorCount / ASTEROID_METEOR_MAX;

  return {
    holdLineIndex,
    meteorCount,
    filmT,
    sway: 0.06 + density * 0.13,
    timeRate: 1 + density * 0.1,
    textBackdrop: smoothstep(density) * 0.6,
  };
}
