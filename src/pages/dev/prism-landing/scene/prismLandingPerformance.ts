import type { WebGLRenderer } from "three";

export type PrismPerformanceProfile = "default" | "optimized";

/** Même plafond que `createCosmicMonolithScene` (profil default). */
export const LEGACY_MAX_PIXEL_RATIO = 2;

export type PrismPerformanceConfig = {
  profile: PrismPerformanceProfile;
  maxPixelRatio: number;
  /** null = pas de limite de rendu en idle */
  idleTargetFps: number | null;
  pauseWhenHidden: boolean;
};

function devicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}

function isLowEndDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const touchNarrow = navigator.maxTouchPoints > 0 && window.innerWidth < 768;
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return touchNarrow || lowCores;
}

export function resolvePerformanceConfig(
  profile: PrismPerformanceProfile = "default",
): PrismPerformanceConfig {
  const dpr = devicePixelRatio();
  if (profile === "default") {
    return {
      profile,
      maxPixelRatio: Math.min(dpr, LEGACY_MAX_PIXEL_RATIO),
      idleTargetFps: null,
      pauseWhenHidden: true,
    };
  }
  const adaptiveCap = isLowEndDevice() ? 1.25 : LEGACY_MAX_PIXEL_RATIO;
  return {
    profile: "optimized",
    maxPixelRatio: Math.min(dpr, adaptiveCap),
    idleTargetFps: 30,
    pauseWhenHidden: true,
  };
}

/** Limite le rendu GPU (la simulation peut déjà avoir tourné dans la frame). */
export function consumeIdleRenderSlot(
  accumulator: number,
  dt: number,
  targetFps: number,
): { skipRender: boolean; nextAccumulator: number } {
  const interval = 1 / targetFps;
  const next = accumulator + dt;
  if (next < interval) {
    return { skipRender: true, nextAccumulator: next };
  }
  return { skipRender: false, nextAccumulator: next - interval };
}

export type VisibilityPauseController = {
  dispose: () => void;
  isPaused: () => boolean;
};

/**
 * Met en pause la boucle WebGL quand l’onglet est caché (économie batterie / GPU).
 */
export function attachVisibilityPause(
  renderer: WebGLRenderer,
  getLoop: () => (() => void) | null,
  setRunning: (on: boolean) => void,
): VisibilityPauseController {
  let pausedByVisibility = false;

  const onVisibility = () => {
    if (document.hidden) {
      pausedByVisibility = true;
      setRunning(false);
      renderer.setAnimationLoop(null);
    } else {
      pausedByVisibility = false;
      setRunning(true);
      const loop = getLoop();
      if (loop) renderer.setAnimationLoop(loop);
    }
  };

  document.addEventListener("visibilitychange", onVisibility);

  return {
    isPaused: () => pausedByVisibility,
    dispose: () => {
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

export function resolveRendererPixelRatio(
  profile: PrismPerformanceProfile,
): number {
  if (profile === "default") {
    return Math.min(devicePixelRatio(), LEGACY_MAX_PIXEL_RATIO);
  }
  return resolvePerformanceConfig("optimized").maxPixelRatio;
}

/**
 * Pause une boucle `requestAnimationFrame` quand l’onglet est caché.
 * `startLoop` doit enregistrer la première frame (ex. `raf = requestAnimationFrame(tick)`).
 */
export function attachVisibilityPauseRaf(
  cancelLoop: () => void,
  startLoop: () => void,
): VisibilityPauseController {
  let pausedByVisibility = false;

  const onVisibility = () => {
    if (document.hidden) {
      pausedByVisibility = true;
      cancelLoop();
    } else {
      pausedByVisibility = false;
      startLoop();
    }
  };

  document.addEventListener("visibilitychange", onVisibility);

  return {
    isPaused: () => pausedByVisibility,
    dispose: () => {
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
