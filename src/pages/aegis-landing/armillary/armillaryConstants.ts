/** Shared armillary knobs: rings, cameras, textures, default spin. See `docs/ARMILLARY.md`. */

export const DEG = Math.PI / 180;

export type RingId = "outer" | "middle" | "inner";

export type EulerDeg = { x: number; y: number; z: number };

export const RING_SPECS = [
  { id: "outer" as const, label: "Anneau extérieur", R: 2, w: 0.22, depth: 0.14, ticks: 48 },
  { id: "middle" as const, label: "Anneau médian", R: 1.62, w: 0.2, depth: 0.12, ticks: 36 },
  { id: "inner" as const, label: "Anneau intérieur", R: 1.28, w: 0.18, depth: 0.1, ticks: 24 },
];

export const DEFAULT_RING_EULERS: Record<RingId, EulerDeg> = {
  outer: { x: -22, y: 28, z: 0 },
  middle: { x: 62, y: 0, z: 18 },
  inner: { x: -38, y: 30, z: 12 },
};

export const DEFAULT_SPHERE_OFFSET: EulerDeg = { x: 0, y: 0, z: 0 };

export const SPHERE_Y_BASE = 0.18;
export const HOVER_AMPLITUDE = 0.12;
export const HOVER_SPEED = 0.7;
export const AUTO_CAM_SPEED = 0;
export const CAM_DIST_MIN = 8;
export const CAM_DIST_MAX = 40;

export const ARMILLARY_TEXTURES = {
  albedo: "/aegis-landing/textures/Gun_Metal_baseColor.webp",
  roughness: "/aegis-landing/textures/Gun_Metal_roughness.webp",
  normal: "/aegis-landing/textures/Gun_Metal_normal.webp",
} as const;

/** Hero still used below `LANDING_CANVAS_MIN_WIDTH` and as WebGL fallback. */
export const LANDING_HERO_STILL = {
  src: "/aegis-landing/hero-scene-800.jpg",
  srcSet:
    "/aegis-landing/hero-scene-800.jpg 800w, /aegis-landing/hero-scene.jpg 1024w, /aegis-landing/hero-scene-1440.jpg 1440w",
} as const;

/** WebGL hero mounts from this viewport width up (sphere is cropped below). */
export const LANDING_CANVAS_MIN_WIDTH = 1024;

/** Locked hero framing at ~1440×760. Narrower aspects lerp toward a closer, less offset pose. */
export const LANDING_CAM = {
  az: 0.52,
  pol: 1.14,
  dist: 30,
  target: [-7.55, -5.22, 0] as [number, number, number],
};

export function landingCamForAspect(aspect: number): { dist: number; targetX: number; targetY: number } {
  const t = Math.min(1, Math.max(0, (aspect - 1.15) / 0.75));
  return {
    dist: 24 + 6 * t,
    targetX: -3.4 + (LANDING_CAM.target[0] + 3.4) * t,
    targetY: -3.4 + (LANDING_CAM.target[1] + 3.4) * t,
  };
}

/** Centered framing for the boot / loading sphere. */
export const LOADER_CAM = {
  az: 0.38,
  pol: 1.08,
  dist: 8.4,
  target: [0, 0.2, 0] as [number, number, number],
};
export const LOADER_CAM_SPEED = 0.16;

export const DEFAULT_SPIN: Record<RingId, number> = {
  outer: 10,
  middle: -16,
  inner: 8,
};

/** Landing default — warm bronze aligned with AEGIS tokens */
export const LANDING_CORE_COLOR = "#e8b17a";
export const LANDING_CORE_GLOW = 1.65;

/** Practices hub — still, slightly left, fills the hero like the loader sphere */
export const PRATIQUES_CAM = {
  az: 0.38,
  pol: 1.08,
  dist: 7.4,
  target: [0.45, 0.2, 0] as [number, number, number],
};
export const PRATIQUES_CAM_SPEED = 0.08;

export const PRATIQUES_RING_EULERS: Record<RingId, EulerDeg> = {
  outer: { x: -12, y: 42, z: 8 },
  middle: { x: 48, y: -18, z: 22 },
  inner: { x: -28, y: 12, z: -6 },
};

export const PRATIQUES_SPHERE_OFFSET: EulerDeg = { x: 0, y: 0, z: 0 };

export const PRATIQUES_SPIN: Record<RingId, number> = {
  outer: 0,
  middle: 0,
  inner: 0,
};

export const PRATIQUES_CORE_COLOR = "#f2d7a4";
export const PRATIQUES_CORE_GLOW = 1.85;
