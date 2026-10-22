/**
 * Presets de travelling + génération path « shot list cinéma ».
 * — `user_edited` : positions exportées (`LANDING_CAMERA_KEYFRAMES`)
 * — `cinematic_shot_path` : poses dérivées ancres + tailles de plan / angles
 */

import {
  LANDING_ANCHOR_SHOT_LIST,
  shotBeatForU,
} from "../cinematic/landingDefaultShotList";
import type { LandingShotBeat } from "../cinematic/landingCinematicContract";
import {
  bearingFromEyeToSubject,
  cameraPoseForShotBeat,
  frameCameraForBeat,
} from "../layout/landingSubjectBounds";

export { bearingFromEyeToSubject, cameraPoseForShotBeat, frameCameraForBeat };
import { applyCubeActSegment } from "./landingCubeMarkShot";
import { buildVilleneuvePillarFinaleKeyframes } from "./landingVilleneuvePillarFinale";
import { LANDING_CAMERA_KEYFRAMES } from "./landingCameraKeyframes";
import { LANDING_CAMERA_KEYFRAMES_USER_LEGACY } from "./landingCameraKeyframesUserLegacy";
import type { LayoutEditorCameraKeyframe, LayoutEditorVec3 } from "../layout/sceneLayout";

const DEG2RAD = Math.PI / 180;

export type LandingCameraPathPresetId =
  | "prism_landing"
  | "user_legacy"
  | "cinematic_shot_path";

export type LandingCameraPathPreset = {
  id: LandingCameraPathPresetId;
  label: string;
  description: string;
  getKeyframes: () => LayoutEditorCameraKeyframe[];
};

function lerpVec3(a: LayoutEditorVec3, b: LayoutEditorVec3, t: number): LayoutEditorVec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Azimut (deg) autour du sujet — arc narratif cube → marbre → portail. */
const ANCHOR_BEARING_DEG: Record<number, number> = {
  0: 148,
  0.081: 108,
  0.181: 82,
  0.258: 62,
  0.389: 28,
  0.504: 352,
  0.609: 332,
  0.682: 305,
  0.774: 278,
  0.901: 268,
  1: 195,
};

function bearingForU(u: number): number {
  const anchors = LANDING_ANCHOR_SHOT_LIST.map((a) => a.u);
  let left = anchors[0];
  let right = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (u >= anchors[i] && u <= anchors[i + 1]) {
      left = anchors[i];
      right = anchors[i + 1];
      break;
    }
  }
  const b0 = ANCHOR_BEARING_DEG[left] ?? 90;
  const b1 = ANCHOR_BEARING_DEG[right] ?? b0;
  const t = right === left ? 0 : (u - left) / (right - left);
  return b0 + (b1 - b0) * t;
}

function beatForAnchorU(u: number): LandingShotBeat {
  const exact = LANDING_ANCHOR_SHOT_LIST.find((e) => Math.abs(e.u - u) < 0.004);
  if (exact) {
    const { u: _u, ...beat } = exact;
    return { ...beat };
  }
  return shotBeatForU(u);
}

/** Keyframes aux u des ancres shot list, puis densification (~2×). */
export function buildCinematicShotPathKeyframes(): LayoutEditorCameraKeyframe[] {
  const anchors = LANDING_ANCHOR_SHOT_LIST.map((a) => a.u);
  const sparse: LayoutEditorCameraKeyframe[] = anchors.map((u) => {
    const beat = beatForAnchorU(u);
    const { position, lookAt } = cameraPoseForShotBeat(beat, ANCHOR_BEARING_DEG[u] ?? 90, {
      heightMode: "drone",
    });
    return {
      u,
      position: {
        x: round3(position.x),
        y: round3(position.y),
        z: round3(position.z),
      },
      lookAt: {
        x: round3(lookAt.x),
        y: round3(lookAt.y),
        z: round3(lookAt.z),
      },
      heightMode: "drone",
      cinematic: { ...beat },
    };
  });

  const dense: LayoutEditorCameraKeyframe[] = [];
  for (let i = 0; i < sparse.length; i++) {
    dense.push(sparse[i]);
    if (i >= sparse.length - 1) continue;
    const a = sparse[i];
    const b = sparse[i + 1];
    const midU = (a.u + b.u) / 2;
    dense.push({
      u: round3(midU),
      position: lerpVec3(a.position, b.position, 0.5),
      lookAt: lerpVec3(a.lookAt, b.lookAt, 0.5),
      heightMode: "drone",
      cinematic: {
        ...shotBeatForU(midU),
        label: undefined,
      },
    });
  }
  return applyCubeActSegment(dense.sort((a, b) => a.u - b.u));
}

let cachedCinematicPath: LayoutEditorCameraKeyframe[] | null = null;

/** Path landing : étapes 1–12 shot list cinéma + finale piliers (Villeneuve, hauteur homme). */
export function buildPrismLandingKeyframes(): LayoutEditorCameraKeyframe[] {
  cachedCinematicPath = null;
  const head = getCinematicShotPathKeyframes().slice(0, 12);
  const tail = buildVilleneuvePillarFinaleKeyframes();
  return [...head, ...tail].map((k) => ({
    ...k,
    position: { ...k.position },
    lookAt: { ...k.lookAt },
    cinematic: k.cinematic ? { ...k.cinematic, post: k.cinematic.post ? { ...k.cinematic.post } : undefined } : undefined,
  }));
}

let cachedPrismLandingPath: LayoutEditorCameraKeyframe[] | null = null;

export function getPrismLandingKeyframes(): LayoutEditorCameraKeyframe[] {
  if (!cachedPrismLandingPath) {
    cachedPrismLandingPath = cloneKeyframes(LANDING_CAMERA_KEYFRAMES);
  }
  return cachedPrismLandingPath.map((k) => ({
    ...k,
    position: { ...k.position },
    lookAt: { ...k.lookAt },
    cinematic: k.cinematic ? { ...k.cinematic } : undefined,
  }));
}

export function getCinematicShotPathKeyframes(): LayoutEditorCameraKeyframe[] {
  if (!cachedCinematicPath) {
    cachedCinematicPath = buildCinematicShotPathKeyframes();
  }
  return cachedCinematicPath.map((k) => ({
    ...k,
    position: { ...k.position },
    lookAt: { ...k.lookAt },
    cinematic: k.cinematic ? { ...k.cinematic } : undefined,
  }));
}

/** Métadonnées shot list sur chaque étape (positions inchangées). */
export function applyShotListMetadataToKeyframes(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorCameraKeyframe[] {
  return keyframes.map((k) => ({
    ...k,
    cinematic: { ...shotBeatForU(k.u) },
  }));
}

export function cloneKeyframes(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorCameraKeyframe[] {
  return keyframes.map((k) => ({
    ...k,
    position: { ...k.position },
    lookAt: { ...k.lookAt },
    cinematic: k.cinematic
      ? {
          ...k.cinematic,
          post: k.cinematic.post ? { ...k.cinematic.post } : undefined,
        }
      : undefined,
  }));
}

export const LANDING_CAMERA_PATH_PRESETS: LandingCameraPathPreset[] = [
  {
    id: "prism_landing",
    label: "Landing — path Villeneuve (45 s, 15 étapes)",
    description:
      "Path live `landingCameraKeyframes.ts` : cube · marbre · portail, finale hauteur homme.",
    getKeyframes: () => getPrismLandingKeyframes(),
  },
  {
    id: "cinematic_shot_path",
    label: "Shot list cinéma (21 étapes drone)",
    description: "Path généré entièrement en drone — référence avant fusion finale.",
    getKeyframes: () => getCinematicShotPathKeyframes(),
  },
  {
    id: "user_legacy",
    label: "Mon ancien path (export manuel)",
    description: "21 étapes exportées avant fusion Villeneuve — archive.",
    getKeyframes: () => cloneKeyframes(LANDING_CAMERA_KEYFRAMES_USER_LEGACY),
  },
];

export function keyframesForPathPreset(
  id: LandingCameraPathPresetId,
): LayoutEditorCameraKeyframe[] {
  const preset = LANDING_CAMERA_PATH_PRESETS.find((p) => p.id === id);
  if (!preset) return getPrismLandingKeyframes();
  return preset.getKeyframes();
}
