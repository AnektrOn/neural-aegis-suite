import * as THREE from "three";

/** Marge monde (m) au-delà de la half-extent terrain avant fusion totale dans l'horizon. */
export const LANDING_PLAYA_FADE_INNER = 0.58;
export const LANDING_PLAYA_FADE_OUTER = 0.98;

export type LandingPlayaEnvelope = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  horizonColor: THREE.Color;
};

export function createLandingPlayaEnvelope(
  centerX: number,
  centerZ: number,
  terrainWidth: number,
  terrainDepth: number,
  horizonHex = 0x17140f,
): LandingPlayaEnvelope {
  return {
    centerX,
    centerZ,
    halfWidth: terrainWidth * 0.5,
    halfDepth: terrainDepth * 0.5,
    horizonColor: new THREE.Color(horizonHex),
  };
}

/** GLSL injecté dans le sol landing (fade radial boîte → couleur horizon / fog). */
export const LANDING_PLAYA_SHADER_COMMON = `
uniform vec2 uPlayaCenter;
uniform vec2 uPlayaHalf;
uniform vec3 uPlayaHorizon;

float landingPlayaFade(vec3 worldPos) {
  vec2 e = abs(worldPos.xz - uPlayaCenter) / max(uPlayaHalf, vec2(0.001));
  float m = max(e.x, e.y);
  return 1.0 - smoothstep(${LANDING_PLAYA_FADE_INNER.toFixed(2)}, ${LANDING_PLAYA_FADE_OUTER.toFixed(2)}, m);
}
`;
