/**
 * Hauteur du sol landing — même formule que `createCosmicMonolithScene.getTerrainHeight`
 * (éditeur layout + cadrage sans WebGL).
 */

import * as THREE from "three";
import { PORTAL_CENTER_X, PORTAL_WORLD_Z } from "./prismSceneConstants";

function fbm(x: number, z: number, octaves: number) {
  let v = 0;
  let a = 0.5;
  let fx = x;
  let fz = z;
  for (let i = 0; i < octaves; i++) {
    v += a * (Math.sin(fx * 1.7 + fz * 2.1) * 0.5 + 0.5);
    fx *= 2.02;
    fz *= 2.02;
    a *= 0.5;
  }
  return v;
}

export function sampleLandingTerrainHeight(x: number, z: number): number {
  const distToPortal = Math.hypot(x - PORTAL_CENTER_X, z - PORTAL_WORLD_Z);
  const flatten = THREE.MathUtils.smoothstep(distToPortal, 1.8, 9.5);
  let h = 0;
  h += Math.sin(x * 0.18 + z * 0.12) * 0.42;
  h += Math.cos(x * 0.35 - z * 0.28) * 0.25;
  h += (fbm(x * 0.15 + 10, z * 0.15 + 10, 4) - 0.5) * 1.6;
  h += (fbm(x * 0.6 + 5, z * 0.8 + 5, 3) - 0.5) * 0.35;
  const sideMound =
    Math.exp(-Math.pow((z - PORTAL_WORLD_Z) * 0.22, 2)) * (Math.sin(x * 0.25) * 0.35);
  const dryBerm =
    Math.exp(-Math.pow(distToPortal / 5.2, 2)) * 0.55 *
    (1 - THREE.MathUtils.smoothstep(z, PORTAL_WORLD_Z + 2, PORTAL_WORLD_Z + 14));
  const foregroundSlope =
    z > PORTAL_WORLD_Z + 18 ? -(z - PORTAL_WORLD_Z - 18) * 0.035 : 0;
  return h * flatten + sideMound * flatten + dryBerm + foregroundSlope;
}
