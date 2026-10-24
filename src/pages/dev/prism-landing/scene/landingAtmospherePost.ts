import * as THREE from "three";
import type { AtmospherePostFX } from "./atmosphere";
import { atmosphereColorsToGradeTints, LANDING_WASTELAND_POST } from "./landingCinematicLook";
import { syncLandingFogScatteringPass } from "./landingFogScatteringPass";
import type { LandingRenderTuning, LandingRenderTuningTargets } from "./landingRenderTuning";

export type LandingAtmoPostTargets = LandingRenderTuningTargets & {
  fogScatteringPass?: { uniforms: Record<string, { value: unknown }> } | null;
  fogScatteringAmount?: number;
  fogScatteringResolution?: { width: number; height: number };
};

const gradeShadowTint = new THREE.Vector3();
const gradeHighTint = new THREE.Vector3();

export type LandingAtmoLayerFlags = {
  godrays: boolean;
  bloom: boolean;
  grade: boolean;
  fogScatter: boolean;
  mist: boolean;
  portalSprites: boolean;
  haze: boolean;
  motes: boolean;
};

const DEFAULT_LAYERS: LandingAtmoLayerFlags = {
  godrays: true,
  bloom: true,
  grade: true,
  fogScatter: false,
  mist: true,
  portalSprites: true,
  haze: true,
  motes: true,
};

/** `?atmoMist=0`, `?atmoGodrays=0`, ou `?monolithDebug=nobloom|nogodrays|nopost|hdr`. */
export function readLandingAtmoLayerFlags(
  search = typeof window !== "undefined" ? window.location.search : "",
): LandingAtmoLayerFlags {
  const params = new URLSearchParams(search);
  const on = (key: string) => params.get(key) !== "0";
  const flags = { ...DEFAULT_LAYERS };
  if (!on("atmoMist")) flags.mist = false;
  if (!on("atmoHaze")) flags.haze = false;
  if (!on("atmoMotes")) flags.motes = false;
  if (!on("atmoPortalSprites")) flags.portalSprites = false;
  if (!on("atmoGodrays")) flags.godrays = false;
  if (params.get("atmoGodrays") === "1") flags.godrays = true;
  if (!on("atmoBloom")) flags.bloom = false;
  if (!on("atmoGrade")) flags.grade = false;
  if (!on("atmoFogScatter")) flags.fogScatter = false;
  const debug = params.get("monolithDebug");
  if (debug === "nopost" || debug === "hdr") {
    flags.godrays = false;
    flags.bloom = false;
    flags.grade = false;
  } else if (debug === "nobloom") {
    flags.bloom = false;
  } else if (debug === "nogodrays") {
    flags.godrays = false;
  }
  return flags;
}

/** Après `atmosphere.update` — panneau landing en multiplicateurs sur `postFx`. */
export function syncLandingPostFromAtmosphere(
  tuning: LandingRenderTuning,
  atmosphere: AtmospherePostFX,
  targets: LandingAtmoPostTargets,
  layers: LandingAtmoLayerFlags,
) {
  const {
    camera,
    fog,
    bloomPass,
    gradePass,
    fogScatteringPass,
    fogScatteringAmount,
    fogScatteringResolution,
  } = targets;

  if (camera.fov !== tuning.fov) {
    camera.fov = tuning.fov;
    camera.updateProjectionMatrix();
  }

  if (fog) {
    const refFog = 0.011;
    fog.density = Math.min(
      0.0028,
      LANDING_WASTELAND_POST.fogDensity *
        (atmosphere.fogDensity / refFog) *
        Math.min(1, tuning.fogDensity),
    );
  }

  if (bloomPass) {
    const raw = layers.bloom ? atmosphere.bloomStrength * tuning.bloomStrength : 0;
    bloomPass.strength = Math.min(0.055, raw);
  }

  if (fogScatteringPass) {
    const scatter = layers.fogScatter
      ? Math.min(
          0.42,
          (fogScatteringAmount ?? LANDING_WASTELAND_POST.fogScattering) * tuning.fogDensity,
        )
      : 0;
    const res = fogScatteringResolution ?? { width: 1, height: 1 };
    const veil = fogScatteringPass.uniforms.uHorizonVeil as { value: number } | undefined;
    if (veil) veil.value = layers.fogScatter ? 0.1 : 0;
    syncLandingFogScatteringPass(
      fogScatteringPass.uniforms,
      fog ?? null,
      scatter,
      layers.fogScatter ? 0.11 : 0,
      res.width,
      res.height,
    );
  }

  const gu = gradePass?.uniforms;
  if (!gu) return;

  const set = (key: string, value: number) => {
    if (gu[key]) gu[key].value = value;
  };

  if (!layers.grade) {
    set("uExposure", atmosphere.exposure);
    set("uVignette", 0);
    set("uGrain", 0);
    set("uCA", 0);
    set("uContrast", 1);
    return;
  }

  set("uExposure", atmosphere.exposure * tuning.exposure);
  set("uVignette", Math.min(1, atmosphere.vignette * tuning.vignette));
  set("uGrain", atmosphere.grain * tuning.grain);
  set("uGrainSize", tuning.grainSize);
  set("uTemp", tuning.temperature);
  set("uTint", tuning.tint);
  set("uContrast", Math.max(0.5, atmosphere.contrast * tuning.contrast));
  set("uHighlights", tuning.highlights);
  set("uShadows", tuning.shadows);
  set("uWhites", tuning.whites);
  set("uBlacks", tuning.blacks);
  set("uSaturation", tuning.saturation);
  set("uVibrance", tuning.vibrance);
  set("uFade", tuning.fade);
  set("uCA", atmosphere.chromaticAberration * tuning.chromaticAberration);

  if (gu.uShadowTintMul && gu.uHighTintMul) {
    atmosphereColorsToGradeTints(
      atmosphere.shadowTint,
      atmosphere.highTint,
      gradeShadowTint,
      gradeHighTint,
    );
    (gu.uShadowTintMul as { value: THREE.Vector3 }).value.copy(gradeShadowTint);
    (gu.uHighTintMul as { value: THREE.Vector3 }).value.copy(gradeHighTint);
  }
}
