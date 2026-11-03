import { R3F_SCENE_CONFIG_DEFAULTS } from "../../config/r3fSceneConfig";
import type { R3fSceneConfig } from "../../config/r3fSceneConfig";

export const R3F_MARBLE_MONOLITH_DEFAULT_SIZE: [number, number, number] = [1.6, 6.4, 0.6];

export const R3F_MARBLE_MONOLITH_DEFAULT_SEED = 11;

export const R3F_MARBLE_GROUND_Y = 0;

/** Animation float (legacy MarbleMonolith). */
export const R3F_MARBLE_FLOAT = {
  yAmplitude: 0.08,
  yFrequency: 0.5,
  rotYAmplitude: 0.04,
  rotYFrequency: 0.15,
} as const;

export const R3F_MARBLE_GLOW_DEFAULTS = {
  color: "#ffb04a",
  bottomEmissiveIntensity: 3.5,
  pointIntensity: 40,
  rectIntensity: 14,
  pointDistance: 22,
  pointDecay: 2,
} as const;

/** Godrays volumétriques depuis la PointLight derrière la dalle (`GodraysPass` dédié). */
export const R3F_MARBLE_GODRAYS = {
  density: 0.016,
  maxDensity: 0.62,
  distanceAttenuation: 2.15,
  raymarchSteps: 60,
  resolutionScale: 0.9,
  gammaCorrection: false,
  shadowCameraNear: 0.2,
  /** Cube de volume < distance caméra beat 2 (~9 m) sinon le ciel se remplit. */
  shadowCameraFar: 3.8,
} as const;

/**
 * Troisième sujet du hall : côté gauche (+Z devant portail), symétrique approx. du cube (+40.5).
 * Relatif à monolithCenterX/Z (fente).
 */
export const R3F_MARBLE_MONOLITH_HALL_OFFSET = {
  x: -38,
  zFromMonolith: 26,
} as const;

export function r3fMarbleMonolithWorldCenter(
  cfg: Pick<
    R3fSceneConfig,
    "monolithCenterX" | "monolithCenterZ" | "marbleHallOffsetX" | "marbleHallOffsetZ"
  > = R3F_SCENE_CONFIG_DEFAULTS,
  size: [number, number, number] = R3F_MARBLE_MONOLITH_DEFAULT_SIZE,
): [number, number, number] {
  const [, h] = size;
  const worldX = cfg.monolithCenterX + cfg.marbleHallOffsetX;
  const worldZ = cfg.monolithCenterZ + cfg.marbleHallOffsetZ;
  const worldY = R3F_MARBLE_GROUND_Y + h / 2;
  return [worldX, worldY, worldZ];
}
