import { R3F_SCENE_CONFIG_DEFAULTS } from "../../config/r3fSceneConfig";
import type { R3fSlitGeometryConfig } from "../../config/r3fSceneConfig";
import type { R3fShatteredCubeLattice } from "./r3fShatteredCubeLattice";
import { r3fShatteredCubePivotYOnGround } from "./r3fShatteredCubeLattice";

/** Timings démo monolithe (secondes) — pas de phase reform. */
export const R3F_SHATTERED_CUBE_TIMING = {
  hold: 4,
  burst: 34,
  cubeWindow: 0.08,
} as const;

export const R3F_SHATTERED_CUBE_GLOW_PRESETS = [
  { name: "Monolithe Glaciaire", glow: "#e2f1ff" },
  { name: "Basalte & Cyan", glow: "#7dd3fc" },
  { name: "Obsidienne & Blanc", glow: "#ffffff" },
  { name: "Noyau Ambre", glow: "#ff8a2b" },
] as const;

export const R3F_SHATTERED_CUBE_DEFAULT_SIZE = 2.25;

/**
 * Layer dédié : le cube n’est pas éclairé par les PointLight fente / spill (couche 0).
 * La caméra et les lumières ambiantes doivent aussi activer ce layer.
 */
export const R3F_SHATTERED_CUBE_LIGHT_LAYER = 1;

/** Sol hall ≈ y=0 (`LandingR3fWastelandGround` à -0.02). */
export const R3F_SHATTERED_CUBE_GROUND_Y = 0;

/** Correction visuelle pied / contact sol (bbox + marge). */
export const R3F_SHATTERED_CUBE_FOOT_LIFT = 0.55;

/** Émission noyau + PointLight au centre (godrays) ; intensité modulée par ray march (escape). */
export const R3F_CUBE_CORE_EMISSION = {
  emissiveHold: 2.8,
  emissiveBurstMul: 24,
  pointHold: 0.35,
  pointBurstPeak: 135,
  pointBurstPower: 1.35,
  pointDistance: 48,
  shadowCameraNear: 0.2,
  shadowCameraFar: 48,
  pointDecay: 1.4,
  haloOpacityMul: 1.35,
  haloScaleBase: 0.85,
  haloScaleReveal: 3.4,
  godrayIntensityDivisor: 46,
} as const;

/** Ray march depuis le noyau : gain d’échappement avant montée point / godrays. */
export const R3F_CUBE_CORE_ESCAPE = {
  minReveal: 0.02,
  minInstanceK: 0.06,
  shellRestMin: 0.55,
  marchMaxDistance: 2.2,
  marchStepSize: 0.05,
  marchMaxSteps: 46,
  minConsecutiveClearSteps: 3,
  escapeRampLow: 0.04,
  escapeRampHigh: 0.38,
  minGodrayEscape: 0.08,
} as const;

/** Godrays volumétriques depuis le PointLight du noyau (`GodraysPass` dédié). */
export const R3F_CUBE_CORE_GODRAYS = {
  color: "#c8ecff",
  density: 0.034,
  maxDensity: 0.92,
  distanceAttenuation: 1.65,
  raymarchSteps: 60,
  resolutionScale: 0.9,
  gammaCorrection: false,
  minRevealForPass: 0.02,
} as const;

/**
 * Hors faisceau doré fente / godrays : latéral au monolithe (+X), pas sur l’axe émetteur → +Z.
 * (Piliers ~±3,7 m ; spill orange surtout sur x ∈ [−gap/2, gap/2] en profondeur.)
 */
export const R3F_SHATTERED_CUBE_HALL_OFFSET = {
  /** Côté droit du portail, hors des piliers. */
  x: 40.5,
  /** Vers la caméra, sans recouvrir l’axe de la fente. */
  zFromMonolith: 28,
} as const;

export function r3fShatteredCubePortalFrontPosition(
  lattice: R3fShatteredCubeLattice,
  size: number,
  cfg: R3fSlitGeometryConfig = R3F_SCENE_CONFIG_DEFAULTS,
): [number, number, number] {
  const pivotY =
    r3fShatteredCubePivotYOnGround(lattice, size, R3F_SHATTERED_CUBE_GROUND_Y) +
    R3F_SHATTERED_CUBE_FOOT_LIFT;
  const worldX = cfg.monolithCenterX + R3F_SHATTERED_CUBE_HALL_OFFSET.x;
  const worldZ = cfg.monolithCenterZ + R3F_SHATTERED_CUBE_HALL_OFFSET.zFromMonolith;
  return [worldX, pivotY, worldZ];
}
