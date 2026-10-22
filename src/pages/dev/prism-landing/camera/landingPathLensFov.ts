import {
  CUBE_MARK_SHOT_LENS_FOV,
  CUBE_MARK_SHOT_U,
} from "./landingCubeMarkShot";

/** FOV vertical pendant le travelling — pic téléobjectif au plan marquant cube. */
export function samplePathLensFov(u: number, defaultFov: number): number {
  const t = Math.exp(-Math.pow((u - CUBE_MARK_SHOT_U) / 0.045, 2) * 7);
  if (t < 0.02) return defaultFov;
  return defaultFov + (CUBE_MARK_SHOT_LENS_FOV - defaultFov) * t;
}
