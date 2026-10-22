/**
 * Plan marquant cube Villeneuve — aligné `LANDING_CAMERA_KEYFRAMES` (u = 0.279).
 */

import { LANDING_SCENE_LAYOUT } from "../layout/landingSceneLayout";
import { LAYOUT_CUBE_CENTER_Y } from "../layout/prismLayoutSceneScale";
import type { LayoutEditorCameraKeyframe } from "../layout/sceneLayout";

export const CUBE_MARK_SHOT_ID = "cube_city_hero_villeneuve";
export const CUBE_MARK_SHOT_U = 0.279;
export const CUBE_MARK_SHOT_LENS_FOV = 26;

const CX = LANDING_SCENE_LAYOUT.cube.x;
const CZ = LANDING_SCENE_LAYOUT.cube.z;
const MX = LANDING_SCENE_LAYOUT.marble.x;
const MZ = LANDING_SCENE_LAYOUT.marble.z;

/** Centre visuel du cube fracturé (monde). */
export function cubeLookAt(elevationY = LAYOUT_CUBE_CENTER_Y): {
  x: number;
  y: number;
  z: number;
} {
  return { x: CX, y: elevationY, z: CZ };
}

export const CUBE_MARK_HUMAN_SILHOUETTE_XZ = { x: CX, z: CZ - 5.8 };

export function createCubeMarkShotKeyframe(): LayoutEditorCameraKeyframe {
  return {
    u: CUBE_MARK_SHOT_U,
    position: { x: CX, y: 1.72, z: CZ - 10.5 },
    lookAt: cubeLookAt(5.8),
    heightMode: "human",
    cinematic: {
      label: "CUBE — hero Villeneuve (réf. CITY)",
      subjectId: "cube",
      shotSize: "WS",
      framing: "single",
      angle: "low",
      movement: "static",
      focus: "deep",
      intent:
        "Silhouette au premier plan, cube centré en contre-plongée légère, téléobjectif.",
      lensFov: CUBE_MARK_SHOT_LENS_FOV,
      markShotId: CUBE_MARK_SHOT_ID,
      post: {
        profile: "cinematic_log_grade",
        stabilization: "software_smooth",
        color: "creative_grade",
        frame: "letterbox_239",
        soundLayers: ["ambient_diegetic", "music_sync"],
        notes: "FOV 26° · lookAt sur le volume cube (y≈5.8), pas le ciel vide.",
      },
    },
  };
}

/** Étapes 5–9 : orbite drone → plan marquant → sortie vers marbre (lookAt toujours intentionnel). */
export function buildCubeActKeyframes(): LayoutEditorCameraKeyframe[] {
  const lookCube = (y: number) => cubeLookAt(y);
  return [
    {
      u: 0.181,
      position: { x: 40.5, y: 2.2, z: 36.8 },
      lookAt: lookCube(3.2),
      heightMode: "drone",
      cinematic: {
        label: "Cube — plan pied (drone)",
        subjectId: "cube",
        shotSize: "FS",
        angle: "eye_level",
        movement: "tracking",
        intent: "Lecture du fragment depuis le sud-est.",
        droneMove: "orbit",
      },
    },
    {
      u: 0.22,
      position: { x: 34.5, y: 1.95, z: 32.5 },
      lookAt: lookCube(3.8),
      heightMode: "drone",
      cinematic: {
        subjectId: "cube",
        shotSize: "MS",
        angle: "low",
        movement: "dolly",
        intent: "Rapprochement avant le plan marquant.",
        droneMove: "orbit",
      },
    },
    createCubeMarkShotKeyframe(),
    {
      u: 0.324,
      position: { x: 22.5, y: 2.4, z: 31.2 },
      lookAt: lookCube(4.2),
      heightMode: "drone",
      cinematic: {
        label: "Cube — dernier cadre avant marbre",
        subjectId: "cube",
        shotSize: "WS",
        angle: "eye_level",
        movement: "tracking",
        intent: "On quitte le cube en gardant le sujet au centre du regard.",
        droneMove: "cable_cam",
      },
    },
    {
      u: 0.389,
      position: { x: 8.5, y: 3.2, z: 28.5 },
      lookAt: { x: MX, y: 3.9, z: MZ },
      heightMode: "drone",
      cinematic: {
        label: "Traversée vers marbre",
        subjectId: "marble",
        shotSize: "MS",
        framing: "single",
        movement: "tracking",
        intent: "Relier cube → marbre, géographie lisible.",
        droneMove: "cable_cam",
      },
    },
  ];
}

const CUBE_ACT_U_MIN = 0.181;
const CUBE_ACT_U_MAX = 0.389;

/** Remplace les poses auto (souvent incohérentes après injection du plan marquant). */
export function applyCubeActSegment(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorCameraKeyframe[] {
  const preserved = keyframes.filter(
    (k) => k.u < CUBE_ACT_U_MIN || k.u > CUBE_ACT_U_MAX,
  );
  return [...preserved, ...buildCubeActKeyframes()].sort((a, b) => a.u - b.u);
}

export const CUBE_MARK_LOOK_AT = cubeLookAt(5.8);
