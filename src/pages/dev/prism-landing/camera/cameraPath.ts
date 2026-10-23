import * as THREE from "three";
import { LANDING_CAMERA_KEYFRAMES, type PathHeightMode } from "../layout/sceneLayout";
import {
  samplePathAtKeyframeU,
  sortPathKeyframesByU,
  type PathSampleKeyframe,
} from "./pathSamplerByKeyframeU";

export type { PathHeightMode };
export type PathExhibit = "intro" | "cube" | "marble" | "pillars";

export type CameraPathKeyframe = {
  u: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  heightMode: PathHeightMode;
  exhibit: PathExhibit;
};

const EYE_HEIGHT = 1.72;

type RawKeyframe = {
  u: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  heightMode: PathHeightMode;
  exhibit: PathExhibit;
};

function exhibitForU(u: number): PathExhibit {
  if (u < 0.402) return "cube";
  if (u < 0.643) return "marble";
  return "pillars";
}

function rawKeyframesFromLanding(): RawKeyframe[] {
  return LANDING_CAMERA_KEYFRAMES.map((k) => ({
    u: k.u,
    position: [k.position.x, k.position.y, k.position.z],
    lookAt: [k.lookAt.x, k.lookAt.y, k.lookAt.z],
    heightMode: k.heightMode,
    exhibit: exhibitForU(k.u),
  }));
}

function resolveY(
  x: number,
  y: number,
  z: number,
  mode: PathHeightMode,
  getTerrainHeight: (x: number, z: number) => number,
) {
  const ground = getTerrainHeight(x, z);
  if (mode === "human") {
    return ground + EYE_HEIGHT;
  }
  return Math.max(y, ground + 0.2);
}

export type CameraPathSampler = {
  sample: (u: number) => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  getExhibit: (u: number) => PathExhibit;
  keyframes: CameraPathKeyframe[];
};

export function createCameraPathSampler(
  getTerrainHeight: (x: number, z: number) => number,
): CameraPathSampler {
  const keyframes: CameraPathKeyframe[] = rawKeyframesFromLanding().map((raw) => {
    const [px, py, pz] = raw.position;
    const [lx, ly, lz] = raw.lookAt;
    return {
      u: raw.u,
      heightMode: raw.heightMode,
      exhibit: raw.exhibit,
      position: new THREE.Vector3(
        px,
        resolveY(px, py, pz, raw.heightMode, getTerrainHeight),
        pz,
      ),
      lookAt: new THREE.Vector3(lx, ly, lz),
    };
  });

  const pathSamples: PathSampleKeyframe[] = sortPathKeyframesByU(
    keyframes.map((k) => ({
      u: k.u,
      position: k.position,
      lookAt: k.lookAt,
    })),
  );

  const pathSamplePos = new THREE.Vector3();
  const pathSampleLook = new THREE.Vector3();

  const exhibitSpans = keyframes.map((k, i) => ({
    u0: k.u,
    u1: i < keyframes.length - 1 ? keyframes[i + 1].u : 1,
    exhibit: k.exhibit,
  }));

  return {
    keyframes,
    sample(u: number) {
      return samplePathAtKeyframeU(pathSamples, u, {
        position: pathSamplePos,
        lookAt: pathSampleLook,
      });
    },
    getExhibit(u: number) {
      const t = THREE.MathUtils.clamp(u, 0, 1);
      for (let i = exhibitSpans.length - 1; i >= 0; i--) {
        if (t >= exhibitSpans[i].u0 - 1e-6) {
          return exhibitSpans[i].exhibit;
        }
      }
      return keyframes[0]?.exhibit ?? "intro";
    },
  };
}

/** Durée par défaut du travelling automatique (secondes). */
/** Durée du travelling (secondes) — +50 % vs. 52 s pour rythme plus lent. */
export const CAMERA_PATH_PLAY_DURATION = 78;
