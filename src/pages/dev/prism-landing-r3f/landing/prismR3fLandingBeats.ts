import type { R3fSceneConfig } from "../config/r3fSceneConfig";
import { R3F_SCENE_CONFIG_DEFAULTS } from "../config/r3fSceneConfig";
import { R3F_MARBLE_MONOLITH_HALL_OFFSET } from "../scene/marbleMonolith/r3fMarbleMonolithConstants";
import { R3F_SHATTERED_CUBE_HALL_OFFSET } from "../scene/shatteredCube/r3fShatteredCubeConstants";

export type PrismLandingBeatKind = "hero" | "transition" | "cta";

export type PrismLandingBeatHudMode = "full" | "cinematic";

export type PrismLandingBeatDefinition = {
  index: number;
  id: string;
  kind: PrismLandingBeatKind;
  hud: PrismLandingBeatHudMode;
  /** Temps Theatre (secondes) sur la séquence caméra. */
  theatreTime: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  hubtownRef?: string;
  scenePatch?: Partial<R3fSceneConfig>;
};

const slitX = R3F_SCENE_CONFIG_DEFAULTS.monolithCenterX;
const slitZ = R3F_SCENE_CONFIG_DEFAULTS.monolithCenterZ;
const cubeX = slitX + R3F_SHATTERED_CUBE_HALL_OFFSET.x;
const cubeZ = slitZ + R3F_SHATTERED_CUBE_HALL_OFFSET.zFromMonolith;
const marbleX = slitX + R3F_MARBLE_MONOLITH_HALL_OFFSET.x;
const marbleZ = slitZ + R3F_MARBLE_MONOLITH_HALL_OFFSET.zFromMonolith;

export const PRISM_LANDING_BEAT_DURATION_S = 4;

/** Parité lab : pas de coupure godrays/bloom sur la landing. */
const LAB_PARITY: Partial<R3fSceneConfig> = {
  godraysEnabled: R3F_SCENE_CONFIG_DEFAULTS.godraysEnabled,
  bloomEnabled: R3F_SCENE_CONFIG_DEFAULTS.bloomEnabled,
  emitLightIntensity: R3F_SCENE_CONFIG_DEFAULTS.emitLightIntensity,
  emitLightDistance: R3F_SCENE_CONFIG_DEFAULTS.emitLightDistance,
  cubeGutterGodraysAttenuation: 0,
};

export const PRISM_LANDING_BEATS: PrismLandingBeatDefinition[] = [
  {
    index: 0,
    id: "hero-cube",
    kind: "hero",
    hud: "full",
    theatreTime: 0,
    cameraPosition: [cubeX - 5.8, 3.05, cubeZ + 11.2],
    cameraTarget: [cubeX - 1.5, 2.15, cubeZ + 0.2],
    hubtownRef: "03-first-chapter-hero.png",
    scenePatch: { ...LAB_PARITY },
  },
  {
    index: 1,
    id: "hold-ignition",
    kind: "hero",
    hud: "cinematic",
    theatreTime: 4,
    cameraPosition: [cubeX - 1.2, 5.8, cubeZ + 13.5],
    cameraTarget: [cubeX + 0.5, 2.25, cubeZ - 1.2],
    hubtownRef: "05-chapter-innovation.png",
    scenePatch: { ...LAB_PARITY },
  },
  {
    index: 2,
    id: "hero-marble",
    kind: "hero",
    hud: "full",
    theatreTime: 8,
    cameraPosition: [marbleX - 6.4, 2.85, marbleZ + 8.1],
    cameraTarget: [marbleX - 2.1, 3.2, marbleZ - 0.15],
    hubtownRef: "07-chapter-excellence.png",
    scenePatch: {
      ...LAB_PARITY,
      emitLightIntensity: 0,
      marbleGlowIntensity: 52,
    },
  },
  {
    index: 3,
    id: "hold-converge",
    kind: "hero",
    hud: "cinematic",
    theatreTime: 12,
    cameraPosition: [-8.5, 4.5, 24.5],
    cameraTarget: [slitX + 0.2, 12.5, slitZ - 2.5],
    hubtownRef: "06-chapter-collaboration.png",
    scenePatch: {
      ...LAB_PARITY,
      emitLightIntensity: 185,
      godraysDensity: R3F_SCENE_CONFIG_DEFAULTS.godraysDensity * 1.35,
    },
  },
  {
    index: 4,
    id: "hero-slit",
    kind: "hero",
    hud: "full",
    theatreTime: 16,
    cameraPosition: [slitX + 3.8, 3.35, slitZ + 19.5],
    cameraTarget: [slitX + 0.1, 9.5, slitZ - 4.2],
    hubtownRef: "08-chapter-purpose.png",
    scenePatch: {
      ...LAB_PARITY,
      emitLightIntensity: 175,
      godraysDensity: R3F_SCENE_CONFIG_DEFAULTS.godraysDensity * 1.25,
    },
  },
  {
    index: 5,
    id: "cta-hold",
    kind: "cta",
    hud: "full",
    theatreTime: 20,
    cameraPosition: [slitX + 1.5, 22, 55],
    cameraTarget: [slitX, 5.5, slitZ + 1],
    hubtownRef: "09-chapter-legacy.png",
    scenePatch: {
      ...LAB_PARITY,
      emitLightIntensity: 150,
      godraysDensity: R3F_SCENE_CONFIG_DEFAULTS.godraysDensity * 1.15,
    },
  },
];

export const PRISM_LANDING_BEAT_COUNT = PRISM_LANDING_BEATS.length;

export function getPrismLandingBeat(index: number): PrismLandingBeatDefinition {
  return PRISM_LANDING_BEATS[index] ?? PRISM_LANDING_BEATS[0];
}

export function isPrismLandingCinematicHud(index: number): boolean {
  return getPrismLandingBeat(index).hud === "cinematic";
}

/** @deprecated Tous les chapitres sont des holds ; utiliser isPrismLandingCinematicHud. */
export function isPrismLandingTransitionBeat(_index: number): boolean {
  return false;
}

export function resolveNextBeatIndex(current: number): number | null {
  if (current >= PRISM_LANDING_BEAT_COUNT - 1) return null;
  return current + 1;
}

/** PREV Hubtown : hold précédent, snap sans reverse Theatre. */
export function resolvePrevBeatIndex(current: number): number | null {
  if (current <= 0) return null;
  return current - 1;
}

export function beatTheatreTime(index: number): number {
  return getPrismLandingBeat(index).theatreTime;
}

export type PrismLandingCameraKey = {
  theatreTime: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
};

/** Spline caméra (holds + apex travel) — playback `/prism` hors Studio. */
export const PRISM_LANDING_CAMERA_KEYS: PrismLandingCameraKey[] = [
  {
    theatreTime: 0,
    cameraPosition: PRISM_LANDING_BEATS[0].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[0].cameraTarget,
  },
  {
    theatreTime: 2,
    cameraPosition: [cubeX - 2.4, 4.6, cubeZ + 10.8],
    cameraTarget: [cubeX, 2.2, cubeZ - 0.4],
  },
  {
    theatreTime: 4,
    cameraPosition: PRISM_LANDING_BEATS[1].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[1].cameraTarget,
  },
  {
    theatreTime: 8,
    cameraPosition: PRISM_LANDING_BEATS[2].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[2].cameraTarget,
  },
  {
    theatreTime: 10,
    cameraPosition: [marbleX + 6.5, 5.2, marbleZ + 18],
    cameraTarget: [slitX + 0.15, 11.8, slitZ - 1.8],
  },
  {
    theatreTime: 12,
    cameraPosition: PRISM_LANDING_BEATS[3].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[3].cameraTarget,
  },
  {
    theatreTime: 16,
    cameraPosition: PRISM_LANDING_BEATS[4].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[4].cameraTarget,
  },
  {
    theatreTime: 20,
    cameraPosition: PRISM_LANDING_BEATS[5].cameraPosition,
    cameraTarget: PRISM_LANDING_BEATS[5].cameraTarget,
  },
];
