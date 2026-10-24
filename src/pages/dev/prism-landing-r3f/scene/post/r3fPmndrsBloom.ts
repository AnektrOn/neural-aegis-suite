import type { BloomEffect } from "postprocessing";
import { R3F_BLOOM_STRENGTH_SCALE } from "./r3fPmndrsPostDefaults";

export function applyR3fBloomParams(
  bloom: BloomEffect,
  strength: number,
  radius: number,
  threshold: number,
) {
  bloom.intensity = strength * R3F_BLOOM_STRENGTH_SCALE;
  bloom.mipmapBlurPass.radius = radius;
  bloom.luminanceMaterial.threshold = threshold;
  bloom.luminanceMaterial.smoothing = 0.03;
}
