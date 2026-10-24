import type * as THREE from "three";
import type { BloomEffect } from "postprocessing";
import type { LandingAtmoPostTargets } from "./landingAtmospherePost";
import type { LandingGradeEffect } from "./landingPmndrsEffects";

/** Mapping UnrealBloomPass.strength → BloomEffect.intensity (écart documenté en commentaire source). */
export const LANDING_PMNDRS_BLOOM_STRENGTH_SCALE = 2.85;

export type LandingPmndrsPostFxHandles = {
  bloom: BloomEffect;
  grade: LandingGradeEffect;
};

/** Cibles compatibles avec `syncLandingPostFromAtmosphere`. */
export function createLandingPmndrsPostTargets(
  handles: LandingPmndrsPostFxHandles,
): Pick<
  LandingAtmoPostTargets,
  "bloomPass" | "gradePass" | "fogScatteringPass"
> {
  const bloomProxy = {
    get strength() {
      return handles.bloom.intensity / LANDING_PMNDRS_BLOOM_STRENGTH_SCALE;
    },
    set strength(v: number) {
      handles.bloom.intensity = v * LANDING_PMNDRS_BLOOM_STRENGTH_SCALE;
    },
  };

  return {
    bloomPass: bloomProxy,
    gradePass: { uniforms: handles.grade.uniformsRecord },
    fogScatteringPass: null,
  };
}

export function setLandingPmndrsBloomFromBootstrap(
  bloom: BloomEffect,
  strength: number,
  radius: number,
  threshold: number,
) {
  bloom.intensity = strength * LANDING_PMNDRS_BLOOM_STRENGTH_SCALE;
  bloom.mipmapBlurPass.radius = radius;
  bloom.luminanceMaterial.threshold = threshold;
  bloom.luminanceMaterial.smoothing = 0.03;
}

export function setLandingPmndrsGradeResolution(
  grade: LandingGradeEffect,
  drawW: number,
  drawH: number,
) {
  (grade.uniformsRecord.uResolution.value as THREE.Vector2).set(drawW, drawH);
}

export function bindLandingPmndrsLut(
  grade: LandingGradeEffect,
  lut: THREE.Data3DTexture | null | undefined,
  lutSize: number,
) {
  grade.setLutTexture(lut ?? null, lutSize);
}
