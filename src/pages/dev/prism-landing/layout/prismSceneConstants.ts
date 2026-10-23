import {
  LANDING_MIST_EXTENT,
  LANDING_SCENE_LAYOUT,
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
  LANDING_WATER_PLANE_SIZE,
} from "./landingSceneLayout";
import { MARBLE_MONOLITH_WORLD_XZ } from "../scene/marbleMonolithAssets";
import { SHATTERED_CUBE_WORLD_XZ } from "../scene/shatteredCubeAssets";

export {
  LANDING_MIST_EXTENT,
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
  LANDING_WATER_PLANE_SIZE,
};

/** Plan d'eau rendu (scène Dev Lab). */
export const SCENE_WATER_LEVEL = 0.03;

/** Niveau gameplay marche Dev Lab. */
export const WALK_WATER_LEVEL = -0.08;

/** Landing : eau plus basse → davantage de terre, moins de bassin. */
export const LANDING_WATER_LEVEL = -1.30;

/** Patch de sol déformable sous le personnage (explore) — désactivé sur landing (coût + mesh parasite). */
export const LANDING_ENABLE_CHARACTER_GROUND_DEFORM = false;
export const CHARACTER_GROUND_DEFORM_SIZE = 6;
export const CHARACTER_GROUND_DEFORM_SEGMENTS = 32;

/** Portail / fente (layout éditeur → landing). */
export const PORTAL_CENTER_X = LANDING_SCENE_LAYOUT.portal.x;
export const PORTAL_WORLD_Z = LANDING_SCENE_LAYOUT.portal.z;
export const PORTAL_GAP_WIDTH = LANDING_SCENE_LAYOUT.portal.gapWidth;
/** Décalage local de la fente sur le plan des piliers (UV jambs). */
export const PORTAL_SLIT_LOCAL_Z = 0.35;
export const PORTAL_SLIT_Z = PORTAL_WORLD_Z + PORTAL_SLIT_LOCAL_Z;

export const SCENE_ANCHORS = {
  scene1Cube: SHATTERED_CUBE_WORLD_XZ,
  scene2Marble: MARBLE_MONOLITH_WORLD_XZ,
  scene3Portal: { x: PORTAL_CENTER_X, z: PORTAL_WORLD_Z },
} as const;
