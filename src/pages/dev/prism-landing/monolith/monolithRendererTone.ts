import type { WebGLRenderer } from "three";
import * as THREE from "three";

/**
 * Monolith landing tone ownership:
 * - With `monolithColorPipeline`: renderer stays NoToneMapping; ACES runs in ToneMappingEffect only.
 * - Without composer (debug): renderer ACES is allowed as fallback.
 */
export function applyMonolithRendererTone(
  gl: WebGLRenderer,
  composerActive: boolean,
  exposure: number,
): void {
  if (composerActive) {
    gl.toneMapping = THREE.NoToneMapping;
    gl.toneMappingExposure = 1;
    return;
  }
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
}
