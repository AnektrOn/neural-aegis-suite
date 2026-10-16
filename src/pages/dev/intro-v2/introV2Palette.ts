/**
 * Intro v2 colors — aligned with {@link DEFAULT_PARTICLE_PALETTES} in quantum-nebula.tsx
 * Dark: ~95% cyan dominant (0x18bec7) + ~5% gold accent (0xe8b923).
 */
import * as THREE from "three";

export const INTRO_V2_PALETTE = {
  dominant: 0x18bec7,
  accent: 0xe8b923,
  /** Matches `--aegis-hero-bg` / intro shell (~hsl(222 26% 5%)). */
  heroBg: 0x0a0d12,
  heroBgCss: "#0a0d12",
} as const;

const _dom = new THREE.Color(INTRO_V2_PALETTE.dominant);
const _acc = new THREE.Color(INTRO_V2_PALETTE.accent);

/** RGB 0–1 for NeuralNoise `color` prop. */
export function nebulaRgbMix(accentWeight: number): [number, number, number] {
  const c = _dom.clone().lerp(_acc, Math.min(1, Math.max(0, accentWeight)));
  return [c.r, c.g, c.b];
}

export function nebulaDominantRgb(): [number, number, number] {
  return [_dom.r, _dom.g, _dom.b];
}

export function nebulaThreeColors() {
  return {
    dominant: _dom.clone(),
    accent: _acc.clone(),
  };
}
