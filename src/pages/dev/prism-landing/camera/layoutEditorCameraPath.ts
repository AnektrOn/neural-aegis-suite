import * as THREE from "three";
import type { LayoutEditorCameraKeyframe } from "../layout/sceneLayout";
import {
  samplePathAtKeyframeU,
  type PathSampleKeyframe,
} from "./pathSamplerByKeyframeU";

export type LayoutEditorPathSampler = {
  sample: (u: number) => { position: THREE.Vector3; lookAt: THREE.Vector3 };
  keyframes: LayoutEditorCameraKeyframe[];
};

export function createLayoutEditorPathSampler(
  keyframes: LayoutEditorCameraKeyframe[],
): LayoutEditorPathSampler | null {
  if (keyframes.length < 2) return null;

  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  const samples: PathSampleKeyframe[] = sorted.map((k) => ({
    u: k.u,
    position: new THREE.Vector3(k.position.x, k.position.y, k.position.z),
    lookAt: new THREE.Vector3(k.lookAt.x, k.lookAt.y, k.lookAt.z),
  }));

  return {
    keyframes: sorted,
    sample(u: number) {
      return samplePathAtKeyframeU(samples, u);
    },
  };
}
