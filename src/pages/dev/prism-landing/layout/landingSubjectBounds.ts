/**
 * Volumes monde réels (landing) + cadrage caméra proportionnel à la taille du sujet.
 */

import { LANDING_SCENE_LAYOUT, LANDING_TERRAIN_CENTER_X, LANDING_TERRAIN_CENTER_Z } from "./landingSceneLayout";
import {
  LAYOUT_CUBE_HALF_SIZE,
  LAYOUT_CUBE_CENTER_Y,
  LAYOUT_MARBLE_HOVER,
  LAYOUT_PILLAR,
  LAYOUT_PORTAL_HEIGHT,
} from "./prismLayoutSceneScale";
import { pillarWorldPositionsFromPortal } from "./portalAssemblyLayout";
import { PORTAL_CENTER_X, PORTAL_SLIT_Z, PORTAL_WORLD_Z } from "./prismSceneConstants";
import { SHATTERED_CUBE_WORLD_XZ } from "../scene/shatteredCubeAssets";
import { MARBLE_MONOLITH_WORLD_XZ } from "../scene/marbleMonolithAssets";
import type { LandingShotBeat, LandingSubjectId, ShotAngle, ShotSizeAbbrev } from "../cinematic/landingCinematicContract";
import type { LayoutEditorVec3 } from "./sceneLayout";
import { sampleLandingTerrainHeight } from "./landingTerrainHeight";

export const LANDING_HUMAN_EYE_ABOVE_GROUND = 1.72;

export type SubjectWorldBounds = {
  id: LandingSubjectId;
  min: LayoutEditorVec3;
  max: LayoutEditorVec3;
  center: LayoutEditorVec3;
  /** max.y - min.y */
  height: number;
  footY: number;
};

const MARBLE_LANDING_SIZE = { width: 1.6, height: 6.4, depth: 0.6 };

function footAt(x: number, z: number) {
  return sampleLandingTerrainHeight(x, z);
}

function boundsForCube(): SubjectWorldBounds {
  const x = SHATTERED_CUBE_WORLD_XZ.x;
  const z = SHATTERED_CUBE_WORLD_XZ.z;
  const foot = footAt(x, z);
  const half = LAYOUT_CUBE_HALF_SIZE;
  const centerY = foot + LAYOUT_CUBE_CENTER_Y;
  return {
    id: "cube",
    footY: foot,
    min: { x: x - half, y: foot + 0.45, z: z - half },
    max: { x: x + half, y: foot + 0.45 + half * 2, z: z + half },
    center: { x, y: centerY, z },
    height: half * 2,
  };
}

function boundsForMarble(): SubjectWorldBounds {
  const x = MARBLE_MONOLITH_WORLD_XZ.x;
  const z = MARBLE_MONOLITH_WORLD_XZ.z;
  const foot = footAt(x, z);
  const hw = MARBLE_LANDING_SIZE.width / 2;
  const hd = MARBLE_LANDING_SIZE.depth / 2;
  const h = MARBLE_LANDING_SIZE.height;
  const centerY = foot + h / 2 + LAYOUT_MARBLE_HOVER;
  return {
    id: "marble",
    footY: foot,
    min: { x: x - hw, y: foot + LAYOUT_MARBLE_HOVER, z: z - hd },
    max: { x: x + hw, y: foot + LAYOUT_MARBLE_HOVER + h, z: z + hd },
    center: { x, y: centerY, z },
    height: h,
  };
}

function boundsForPortal(): SubjectWorldBounds {
  const px = PORTAL_CENTER_X;
  const pz = PORTAL_WORLD_Z;
  const foot = footAt(px, PORTAL_FORWARD_SAMPLE_Z());
  const pillars = pillarWorldPositionsFromPortal(LANDING_SCENE_LAYOUT.portal);
  const halfW = LAYOUT_PILLAR.width / 2;
  const halfD = LAYOUT_PILLAR.depth / 2;
  const minX = Math.min(pillars.leftPillar.x, pillars.rightPillar.x) - halfW;
  const maxX = Math.max(pillars.leftPillar.x, pillars.rightPillar.x) + halfW;
  return {
    id: "portal",
    footY: foot,
    min: { x: minX, y: foot, z: pz - halfD },
    max: { x: maxX, y: foot + LAYOUT_PORTAL_HEIGHT, z: pz + halfD },
    center: { x: px, y: foot + LAYOUT_PORTAL_HEIGHT * 0.45, z: pz },
    height: LAYOUT_PORTAL_HEIGHT,
  };
}

function PORTAL_FORWARD_SAMPLE_Z() {
  return PORTAL_WORLD_Z + 1.65;
}

function boundsForPortalSlit(): SubjectWorldBounds {
  const portal = boundsForPortal();
  const gap = LANDING_SCENE_LAYOUT.portal.gapWidth;
  const halfGap = gap / 2;
  const slitZ = PORTAL_SLIT_Z;
  return {
    id: "portal_slit",
    footY: portal.footY,
    min: {
      x: PORTAL_CENTER_X - halfGap,
      y: portal.footY + LAYOUT_PORTAL_HEIGHT * 0.35,
      z: slitZ - 0.2,
    },
    max: {
      x: PORTAL_CENTER_X + halfGap,
      y: portal.footY + LAYOUT_PORTAL_HEIGHT * 0.65,
      z: slitZ + 0.2,
    },
    center: { x: PORTAL_CENTER_X, y: portal.footY + LAYOUT_PORTAL_HEIGHT * 0.5, z: slitZ },
    height: LAYOUT_PORTAL_HEIGHT * 0.3,
  };
}

function boundsForSceneEnvelope(): SubjectWorldBounds {
  const cx = (LANDING_SCENE_LAYOUT.cube.x + LANDING_SCENE_LAYOUT.marble.x + LANDING_SCENE_LAYOUT.portal.x) / 3;
  const cz = (LANDING_SCENE_LAYOUT.cube.z + LANDING_SCENE_LAYOUT.marble.z + LANDING_SCENE_LAYOUT.portal.z) / 3;
  const foot = footAt(cx, cz);
  const span = 38;
  return {
    id: "scene_envelope",
    footY: foot,
    min: { x: cx - span, y: foot, z: cz - span },
    max: { x: cx + span, y: foot + 28, z: cz + span },
    center: { x: cx, y: foot + 8, z: cz },
    height: 28,
  };
}

function boundsForTerrainZone(): SubjectWorldBounds {
  const foot = footAt(LANDING_TERRAIN_CENTER_X, LANDING_TERRAIN_CENTER_Z);
  const hw = 28;
  const hd = 28;
  return {
    id: "terrain_zone",
    footY: foot,
    min: { x: LANDING_TERRAIN_CENTER_X - hw, y: foot - 0.5, z: LANDING_TERRAIN_CENTER_Z - hd },
    max: { x: LANDING_TERRAIN_CENTER_X + hw, y: foot + 2, z: LANDING_TERRAIN_CENTER_Z + hd },
    center: { x: LANDING_TERRAIN_CENTER_X, y: foot, z: LANDING_TERRAIN_CENTER_Z },
    height: 2.5,
  };
}

export function landingSubjectBounds(id: LandingSubjectId): SubjectWorldBounds {
  switch (id) {
    case "cube":
      return boundsForCube();
    case "marble":
      return boundsForMarble();
    case "portal":
      return boundsForPortal();
    case "portal_slit":
      return boundsForPortalSlit();
    case "scene_envelope":
      return boundsForSceneEnvelope();
    case "terrain_zone":
      return boundsForTerrainZone();
    default:
      return boundsForSceneEnvelope();
  }
}

/** Multiplicateur distance caméra ↔ sujet selon taille de plan (× hauteur du sujet). */
const SHOT_SIZE_DISTANCE_FACTOR: Record<ShotSizeAbbrev, number> = {
  EST: 14,
  EWS: 12,
  ELS: 12,
  WS: 9,
  LS: 8,
  FS: 6.5,
  MWS: 5.5,
  MLS: 5,
  CS: 4.5,
  MS: 4,
  MCU: 3,
  CU: 2.2,
  ECU: 1.5,
};

const MIN_CAMERA_DIST = 2.5;
const MAX_CAMERA_DIST = 55;

function lookPointOnBounds(bounds: SubjectWorldBounds, angle?: ShotAngle): LayoutEditorVec3 {
  const { min, max, center } = bounds;
  const tY =
    angle === "low" || angle === "ground"
      ? 0.72
      : angle === "high" || angle === "aerial" || angle === "birds_eye"
        ? 0.92
        : 0.55;
  return {
    x: center.x,
    y: min.y + (max.y - min.y) * tY,
    z: center.z,
  };
}

function cameraHeightAboveFoot(
  footY: number,
  bounds: SubjectWorldBounds,
  angle?: ShotAngle,
  heightMode?: "drone" | "human",
): number {
  if (heightMode === "human") {
    return footY + LANDING_HUMAN_EYE_ABOVE_GROUND;
  }
  switch (angle) {
    case "ground":
      return footY + 0.35;
    case "knee":
      return footY + 0.9;
    case "low":
      return footY + LANDING_HUMAN_EYE_ABOVE_GROUND;
    case "high":
      return footY + bounds.height * 1.2 + 2;
    case "aerial":
      return footY + bounds.height * 2 + 6;
    case "birds_eye":
      return footY + bounds.height * 3 + 10;
    case "hip":
    case "shoulder":
      return footY + 1.4;
    default:
      return footY + Math.max(2, bounds.height * 0.35);
  }
}

export function cameraDistanceForShot(bounds: SubjectWorldBounds, shotSize: ShotSizeAbbrev): number {
  const factor = SHOT_SIZE_DISTANCE_FACTOR[shotSize];
  const raw = factor * Math.max(bounds.height, 1.5);
  return Math.min(MAX_CAMERA_DIST, Math.max(MIN_CAMERA_DIST, raw));
}

export function lookAtForShotBeat(beat: LandingShotBeat): LayoutEditorVec3 {
  const primary = lookPointOnBounds(landingSubjectBounds(beat.subjectId), beat.angle);
  if (!beat.secondarySubjectId) return primary;
  const secondary = lookPointOnBounds(
    landingSubjectBounds(beat.secondarySubjectId),
    beat.angle,
  );
  return {
    x: (primary.x + secondary.x) / 2,
    y: (primary.y + secondary.y) / 2,
    z: (primary.z + secondary.z) / 2,
  };
}

export function cameraPoseForShotBeat(
  beat: LandingShotBeat,
  bearingDeg: number,
  opts?: { heightMode?: "drone" | "human"; currentEye?: LayoutEditorVec3 },
): { position: LayoutEditorVec3; lookAt: LayoutEditorVec3 } {
  const bounds = landingSubjectBounds(beat.subjectId);
  const lookAt = lookAtForShotBeat(beat);
  const dist = cameraDistanceForShot(bounds, beat.shotSize);
  const bearing = bearingDeg * (Math.PI / 180);
  const footAtCam = sampleLandingTerrainHeight(
    bounds.center.x + Math.sin(bearing) * dist,
    bounds.center.z + Math.cos(bearing) * dist,
  );
  const y = cameraHeightAboveFoot(footAtCam, bounds, beat.angle, opts?.heightMode);
  const position = {
    x: bounds.center.x + Math.sin(bearing) * dist,
    y,
    z: bounds.center.z + Math.cos(bearing) * dist,
  };
  return { position, lookAt };
}

export function bearingFromEyeToSubject(
  eye: LayoutEditorVec3,
  subjectId: LandingSubjectId,
): number {
  const b = landingSubjectBounds(subjectId);
  return (Math.atan2(eye.x - b.center.x, eye.z - b.center.z) * 180) / Math.PI;
}

export function frameCameraForBeat(
  beat: LandingShotBeat,
  currentEye?: LayoutEditorVec3,
  heightMode?: "drone" | "human",
): { position: LayoutEditorVec3; lookAt: LayoutEditorVec3 } {
  const bearing =
    currentEye !== undefined
      ? bearingFromEyeToSubject(currentEye, beat.subjectId)
      : 135;
  return cameraPoseForShotBeat(beat, bearing, { heightMode, currentEye });
}
