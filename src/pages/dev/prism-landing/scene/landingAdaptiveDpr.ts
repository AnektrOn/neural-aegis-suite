import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import type { WebGLRenderer } from "three";

/** Paliers DPR décroissants (le plafond réel vient du profil perf). */
const DPR_TIERS = [2, 1.5, 1.25, 1] as const;

export type LandingAdaptiveDprOptions = {
  renderer: WebGLRenderer;
  composer: EffectComposer | null;
  getMaxRatio: () => number;
  /** Rappelé après changement de DPR (resize post-FX, etc.). */
  onApplied: (pixelRatio: number) => void;
};

export type LandingAdaptiveDprController = {
  setAutoEnabled: (on: boolean) => void;
  setManualRatio: (ratio: number | null) => void;
  getEffectiveRatio: () => number;
  tick: (dt: number) => void;
  dispose: () => void;
};

/**
 * Ajuste le pixel ratio selon le temps de frame moyen (~60 frames).
 * Hystérésis : descente si FPS < ~50, remontée si FPS > ~58 pendant ~3 s.
 */
export function createLandingAdaptiveDpr(
  options: LandingAdaptiveDprOptions,
): LandingAdaptiveDprController {
  const { renderer, composer, getMaxRatio, onApplied } = options;
  let autoEnabled = true;
  let manualRatio: number | null = null;
  let tierIndex = 0;
  let frameDtAccum: number[] = [];
  let highFpsSeconds = 0;

  const tiersForMax = (max: number) =>
    DPR_TIERS.filter((t) => t <= max + 1e-6).length > 0
      ? DPR_TIERS.filter((t) => t <= max + 1e-6)
      : [Math.min(1, max)];

  const applyRatio = (ratio: number) => {
    const clamped = Math.max(0.75, Math.min(getMaxRatio(), ratio));
    renderer.setPixelRatio(clamped);
    composer?.setPixelRatio(clamped);
    onApplied(clamped);
  };

  const effectiveRatio = () => {
    if (manualRatio != null) return Math.min(manualRatio, getMaxRatio());
    const tiers = tiersForMax(getMaxRatio());
    const idx = Math.min(tierIndex, tiers.length - 1);
    return tiers[idx];
  };

  applyRatio(effectiveRatio());

  return {
    setAutoEnabled(on: boolean) {
      autoEnabled = on;
      if (!on && manualRatio == null) {
        manualRatio = renderer.getPixelRatio();
      }
      applyRatio(effectiveRatio());
    },
    setManualRatio(ratio: number | null) {
      manualRatio = ratio;
      if (ratio != null) tierIndex = 0;
      applyRatio(effectiveRatio());
    },
    getEffectiveRatio: () => renderer.getPixelRatio(),
    tick(dt: number) {
      if (!autoEnabled || manualRatio != null) return;
      frameDtAccum.push(dt);
      if (frameDtAccum.length < 60) return;
      const avgDt =
        frameDtAccum.reduce((a, b) => a + b, 0) / frameDtAccum.length;
      frameDtAccum = [];
      const fps = 1 / Math.max(avgDt, 1e-4);
      const tiers = tiersForMax(getMaxRatio());
      const maxTier = tiers.length - 1;

      if (fps < 50 && tierIndex < maxTier) {
        tierIndex += 1;
        highFpsSeconds = 0;
        applyRatio(tiers[tierIndex]);
      } else if (fps > 58 && tierIndex > 0) {
        highFpsSeconds += avgDt * 60;
        if (highFpsSeconds >= 3) {
          tierIndex -= 1;
          highFpsSeconds = 0;
          applyRatio(tiers[tierIndex]);
        }
      } else {
        highFpsSeconds = 0;
      }
    },
    dispose() {
      frameDtAccum = [];
    },
  };
}
