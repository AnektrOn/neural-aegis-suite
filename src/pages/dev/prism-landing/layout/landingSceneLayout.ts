/** Positions landing + layout (sans dépendance circulaire). */

export const LANDING_PORTAL_SLIT_WIDTH = 0.7;

/** Layout verrouillé (export éditeur). */
export const LANDING_SCENE_LAYOUT = {
  cube: { x: 28.1, z: 34.8 },
  marble: { x: -3.8, z: 20.7 },
  portal: { x: 11.9, z: -4.3, gapWidth: LANDING_PORTAL_SLIT_WIDTH },
} as const;

/** Terrain compact landing — zone de jeu / layout (cube, marbre, éditeur). */
export const LANDING_TERRAIN_WIDTH = 56;
export const LANDING_TERRAIN_DEPTH = 56;
/** Mesh sol rendu : marge playa pour fondre les bords (gameplay inchangé). */
export const LANDING_TERRAIN_MESH_WIDTH = 112;
export const LANDING_TERRAIN_MESH_DEPTH = 112;
export const LANDING_TERRAIN_CENTER_X = 12;
export const LANDING_TERRAIN_CENTER_Z = 12;
export const LANDING_WATER_PLANE_SIZE = 84;
/** Couvre tout le terrain landing (cube inclus) avec marge pour fondus doux. */
export const LANDING_MIST_EXTENT = { width: 112, depth: 112 };
