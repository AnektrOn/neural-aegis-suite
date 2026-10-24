/** Positions landing + layout (sans dépendance circulaire). */

export const LANDING_PORTAL_SLIT_WIDTH = 0.7;

/** Layout verrouillé (export éditeur). */
export const LANDING_SCENE_LAYOUT = {
  cube: { x: 28.1, z: 34.8 },
  marble: { x: -3.8, z: 20.7 },
  portal: { x: 11.9, z: -4.3, gapWidth: LANDING_PORTAL_SLIT_WIDTH },
} as const;

/** Terrain landing : doit couvrir le path caméra (keyframes jusqu’à ~z57, x49) — 56×56 laissait le sol hors mesh → nappe grise (fog seul). */
export const LANDING_TERRAIN_WIDTH = 128;
export const LANDING_TERRAIN_DEPTH = 128;
export const LANDING_TERRAIN_CENTER_X = 12;
export const LANDING_TERRAIN_CENTER_Z = 12;
export const LANDING_WATER_PLANE_SIZE = 148;
/** Couvre le terrain élargi avec marge pour fondus doux. */
export const LANDING_MIST_EXTENT = { width: 148, depth: 148 };
