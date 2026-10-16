import * as THREE from "three";
import type { IntroV2ChapterId } from "../introV2Copy";

export type DocumentaryPath = {
  /** Catmull-Rom control points (world space). */
  points: THREE.Vector3[];
  /** Base speed along the curve (curve parameter units per second). */
  speed: number;
  /** Default look-at anchor; rig may drift slightly around this. */
  lookAt: THREE.Vector3;
  /** Optional FOV breathe (degrees) for perspective cameras. */
  fov?: { min: number; max: number };
};

/** Slow, nature-doc style moves — glide + dolly, no snap cuts. */
export const INTRO_V2_CAMERA_PATHS: Record<IntroV2ChapterId, DocumentaryPath> = {
  neural: {
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.15, 0.08, 0),
      new THREE.Vector3(-0.1, 0.12, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    speed: 0.018,
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  sculpture: {
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.12, 0.06, 0),
      new THREE.Vector3(-0.08, 0.1, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    speed: 0.016,
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  flow: {
    points: [
      new THREE.Vector3(0, 0.35, 7.2),
      new THREE.Vector3(0.45, 0.15, 5.8),
      new THREE.Vector3(-0.35, -0.1, 4.9),
      new THREE.Vector3(0.2, 0.25, 5.4),
      new THREE.Vector3(0, 0.1, 6.5),
    ],
    speed: 0.028,
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: { min: 22, max: 28 },
  },
  asteroids: {
    points: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(12, 6, 8),
      new THREE.Vector3(-14, -4, 6),
      new THREE.Vector3(8, 10, -5),
      new THREE.Vector3(-6, 2, 12),
      new THREE.Vector3(0, -3, 4),
    ],
    speed: 0.02,
    lookAt: new THREE.Vector3(0, 0, -60),
    fov: { min: 52, max: 62 },
  },
};
