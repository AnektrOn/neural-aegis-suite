import { pillarWorldPositionsFromPortal } from "./portalAssemblyLayout";
import type { LandingCameraKeyframeCinematic } from "../cinematic/landingCinematicContract";
import { shotBeatForU } from "../cinematic/landingDefaultShotList";
import { LANDING_SCENE_LAYOUT } from "./landingSceneLayout";

export type PathHeightMode = "drone" | "human";

export {
  LANDING_PORTAL_SLIT_WIDTH,
  LANDING_SCENE_LAYOUT,
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
} from "./landingSceneLayout";

/** @deprecated alias */
export { LANDING_TERRAIN_WIDTH as LAYOUT_EDITOR_GROUND_SIZE } from "./landingSceneLayout";

export type LayoutXZ = { x: number; z: number };

export type SceneLayoutPortal = LayoutXZ & { gapWidth: number };

export type SceneLayoutData = {
  cube: LayoutXZ;
  marble: LayoutXZ;
  portal: SceneLayoutPortal;
  leftPillar: LayoutXZ;
  rightPillar: LayoutXZ;
};

/** Piliers dérivés du portail — assemblage rigide (ne pas déplacer séparément). */
export function syncPillarsFromPortal(layout: SceneLayoutData): SceneLayoutData {
  const pillars = pillarWorldPositionsFromPortal(layout.portal);
  return {
    ...layout,
    leftPillar: pillars.leftPillar,
    rightPillar: pillars.rightPillar,
  };
}

export const DEFAULT_COMPACT_SCENE_LAYOUT: SceneLayoutData = syncPillarsFromPortal({
  portal: { ...LANDING_SCENE_LAYOUT.portal },
  cube: { ...LANDING_SCENE_LAYOUT.cube },
  marble: { ...LANDING_SCENE_LAYOUT.marble },
  leftPillar: { x: 0, z: 0 },
  rightPillar: { x: 0, z: 0 },
});

export function movePortal(layout: SceneLayoutData, x: number, z: number): SceneLayoutData {
  return syncPillarsFromPortal({
    ...layout,
    portal: { ...layout.portal, x, z },
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** JSON copiable pour brancher cube / marbre / portail dans la scène landing. */
export function sceneLayoutToExportJson(layout: SceneLayoutData): string {
  const synced = syncPillarsFromPortal(layout);
  return JSON.stringify(
    {
      cube: { x: round1(synced.cube.x), z: round1(synced.cube.z) },
      marble: { x: round1(synced.marble.x), z: round1(synced.marble.z) },
      portal: {
        x: round1(synced.portal.x),
        z: round1(synced.portal.z),
        gapWidth: round1(synced.portal.gapWidth),
      },
    },
    null,
    2,
  );
}

export type LayoutEditorVec3 = { x: number; y: number; z: number };

export type LayoutEditorCameraKeyframe = {
  u: number;
  position: LayoutEditorVec3;
  lookAt: LayoutEditorVec3;
  heightMode: PathHeightMode;
  /** Shot list (sujet, taille de plan, intention) — optionnel sur étapes intermédiaires. */
  cinematic?: LandingCameraKeyframeCinematic;
};

/** Applique les beats d’ancre par défaut quand `cinematic` est absent. */
export function withDefaultKeyframeCinematics(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorCameraKeyframe[] {
  return keyframes.map((k) => ({
    ...k,
    cinematic: k.cinematic ?? shotBeatForU(k.u),
  }));
}

function lerpVec3(a: LayoutEditorVec3, b: LayoutEditorVec3, t: number): LayoutEditorVec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/** +1 étape au milieu de chaque segment (ancres → ~2× étapes, mêmes u=0/1). */
export function densifyCameraKeyframes(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorCameraKeyframe[] {
  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  const out: LayoutEditorCameraKeyframe[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i >= sorted.length - 1) continue;
    const a = sorted[i];
    const b = sorted[i + 1];
    out.push({
      u: (a.u + b.u) / 2,
      position: lerpVec3(a.position, b.position, 0.5),
      lookAt: lerpVec3(a.lookAt, b.lookAt, 0.5),
      heightMode: a.heightMode,
    });
  }
  return out;
}

/** Path landing live — généré dans `landingCameraKeyframes.ts` (régénérable via presets). */
export { LANDING_CAMERA_KEYFRAMES } from "../camera/landingCameraKeyframes";
export { LANDING_CAMERA_KEYFRAMES_USER_LEGACY } from "../camera/landingCameraKeyframesUserLegacy";

export const DEFAULT_LAYOUT_EDITOR_KEYFRAMES: LayoutEditorCameraKeyframe[] = [
  {
    u: 0,
    position: { x: 4, y: 20, z: 20 },
    lookAt: { x: 0, y: 6, z: 0 },
    heightMode: "drone",
  },
  {
    u: 0.35,
    position: { x: -14, y: 14, z: 12 },
    lookAt: { x: -10, y: 5, z: 8 },
    heightMode: "drone",
  },
  {
    u: 0.65,
    position: { x: 14, y: 12, z: -2 },
    lookAt: { x: 10, y: 5, z: -6 },
    heightMode: "drone",
  },
  {
    u: 1,
    position: { x: 0, y: 1.72, z: 5 },
    lookAt: { x: 0, y: 9, z: 0 },
    heightMode: "human",
  },
];

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function layoutKeyframesToExportJson(
  keyframes: LayoutEditorCameraKeyframe[],
): string {
  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  return JSON.stringify(
    sorted.map((k) => ({
      u: round3(k.u),
      position: {
        x: round3(k.position.x),
        y: round3(k.position.y),
        z: round3(k.position.z),
      },
      lookAt: {
        x: round3(k.lookAt.x),
        y: round3(k.lookAt.y),
        z: round3(k.lookAt.z),
      },
      heightMode: k.heightMode,
      ...(k.cinematic
        ? {
            cinematic: {
              ...k.cinematic,
              ...(k.cinematic.post ? { post: { ...k.cinematic.post } } : {}),
            },
          }
        : {}),
    })),
    null,
    2,
  );
}
