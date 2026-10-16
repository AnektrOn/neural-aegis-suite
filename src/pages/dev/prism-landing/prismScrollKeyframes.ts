import * as THREE from "three";
import {
  getPrismLandingPreset,
  type PrismLandingSectionId,
} from "./prismLandingPresets";

export type PrismScrollSample = {
  section: PrismLandingSectionId;
  /** Shield rig in scene space (travels across viewport as you scroll). */
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  zoom: number;
  cameraPosition: [number, number, number];
};

/**
 * Scroll 0→1 walks the shield through the scene (camera-scroll maps scroll → motion;
 * AEGIS has no GLB camera track, so we keyframe rig + ortho pan instead).
 */
export const PRISM_SCROLL_SAMPLES: PrismScrollSample[] = [
  {
    section: "hero",
    position: [-3.2, -1.4, 0],
    rotation: [0.12, -0.55, 0.08],
    scale: 1.08,
    zoom: 68,
    cameraPosition: [1.2, 0.4, 100],
  },
  {
    section: "features",
    position: [3.4, 0.35, -0.4],
    rotation: [-0.08, 0.72, -0.12],
    scale: 0.82,
    zoom: 58,
    cameraPosition: [-0.8, -0.2, 100],
  },
  {
    section: "proof",
    position: [0.6, 2.6, 0.25],
    rotation: [-0.22, 0.15, 0.18],
    scale: 0.72,
    zoom: 52,
    cameraPosition: [-0.3, -1.1, 100],
  },
  {
    section: "cta",
    position: [-2.8, -2.3, 0.15],
    rotation: [0.05, -0.95, -0.06],
    scale: 0.95,
    zoom: 62,
    cameraPosition: [1.5, 0.85, 100],
  },
];

function lerpTriple(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  ];
}

export function samplePrismScroll(scroll01: number): PrismScrollSample {
  const t = THREE.MathUtils.clamp(scroll01, 0, 1);
  const keys = PRISM_SCROLL_SAMPLES;
  if (t <= 0) {
    return keys[0];
  }
  if (t >= 1) {
    return keys[keys.length - 1];
  }

  const segments = keys.length - 1;
  const scaled = t * segments;
  const i = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - i;
  const a = keys[i];
  const b = keys[i + 1];

  return {
    section: localT < 0.5 ? a.section : b.section,
    position: lerpTriple(a.position, b.position, localT),
    rotation: lerpTriple(a.rotation, b.rotation, localT),
    scale: THREE.MathUtils.lerp(a.scale, b.scale, localT),
    zoom: THREE.MathUtils.lerp(a.zoom, b.zoom, localT),
    cameraPosition: lerpTriple(a.cameraPosition, b.cameraPosition, localT),
  };
}

export function lerpScrollSample(
  current: PrismScrollSample,
  target: PrismScrollSample,
  alpha: number,
): PrismScrollSample {
  return {
    section: target.section,
    position: lerpTriple(current.position, target.position, alpha),
    rotation: lerpTriple(current.rotation, target.rotation, alpha),
    scale: THREE.MathUtils.lerp(current.scale, target.scale, alpha),
    zoom: THREE.MathUtils.lerp(current.zoom, target.zoom, alpha),
    cameraPosition: lerpTriple(current.cameraPosition, target.cameraPosition, alpha),
  };
}

export function createInitialScrollSample(): PrismScrollSample {
  return { ...PRISM_SCROLL_SAMPLES[0] };
}

/** État 0 — hero landing fixe (pas de déplacement scroll). */
export function createLandingScrollSample(): PrismScrollSample {
  const hero = getPrismLandingPreset("hero");
  return {
    section: "hero",
    position: [...hero.position],
    rotation: [0, 0, 0],
    scale: 1,
    zoom: 70,
    cameraPosition: [0, 0, 100],
  };
}
