import * as THREE from "three";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { BLOOM_HDR_DEFAULTS } from "./monolithEmissiveLevels";
import type { MonolithExposureMeter } from "./monolithExposureMeter";
import {
  applyMonolithDebugView,
  type MonolithDebugView,
  type MonolithPipelineTuning,
} from "./monolithPipelineDebug";

export type MonolithPipelineDiagnostics = {
  debugView: MonolithDebugView;
  exposure: number;
  measuredAverage: number;
  targetExposure: number;
  readbackPending: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  toneMappingOwner: "ToneMappingEffect";
  rendererToneMapping: "NoToneMapping";
};

export type MonolithColorPipeline = {
  composer: EffectComposer;
  renderPass: RenderPass;
  godraysPass: { enabled: boolean };
  bloom: BloomEffect;
  tonePass: EffectPass;
  toneMapping: ToneMappingEffect;
  applyTuning: (tuning: MonolithPipelineTuning) => void;
  getDiagnostics: (
    renderer: THREE.WebGLRenderer,
    meter: MonolithExposureMeter,
    tuning: MonolithPipelineTuning,
  ) => MonolithPipelineDiagnostics;
  tick: (
    dt: number,
    renderer: THREE.WebGLRenderer,
    tuning: MonolithPipelineTuning,
    meter: MonolithExposureMeter,
  ) => number;
};

function syncBloomAndDebug(
  view: MonolithDebugView,
  tuning: MonolithPipelineTuning,
  godraysPass: { enabled: boolean },
  bloom: BloomEffect,
) {
  applyMonolithDebugView(view, { godraysPass, bloom });
  bloom.luminanceMaterial.threshold = tuning.bloomThreshold;
  bloom.luminanceMaterial.smoothing = tuning.bloomSmoothing;
  if (view === "final" || view === "nogodrays") {
    bloom.intensity = tuning.bloomIntensity;
  }
}

function toneEnabledForView(view: MonolithDebugView) {
  return view !== "hdr" && view !== "nopost";
}

/**
 * HDR order: scene (portal + additive halo) → bloom → ACES → SMAA once.
 * The halo is in the scene, not a shadow-map mix. SMAA is the only encode.
 */
export function createMonolithColorPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  tuning: MonolithPipelineTuning,
): MonolithColorPipeline {
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = tuning.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });

  const renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = false;
  composer.addPass(renderPass);

  const godraysPass = { enabled: true };

  const bloom = new BloomEffect({
    luminanceThreshold: tuning.bloomThreshold,
    luminanceSmoothing: tuning.bloomSmoothing,
    intensity: tuning.bloomIntensity,
    mipmapBlur: BLOOM_HDR_DEFAULTS.mipmapBlur,
    radius: BLOOM_HDR_DEFAULTS.radius,
  });
  const bloomPass = new EffectPass(camera, bloom);
  bloomPass.encodeOutput = false;
  bloomPass.renderToScreen = false;
  composer.addPass(bloomPass);

  const toneMapping = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC,
    whitePoint: 4,
    middleGrey: 0.18,
  });
  const tonePass = new EffectPass(camera, toneMapping);
  tonePass.encodeOutput = false;
  tonePass.renderToScreen = false;
  tonePass.enabled = toneEnabledForView(tuning.debugView);
  composer.addPass(tonePass);

  const smaaPass = new EffectPass(
    camera,
    new SMAAEffect({ preset: SMAAPreset.HIGH }),
  );
  smaaPass.encodeOutput = true;
  smaaPass.renderToScreen = true;
  composer.addPass(smaaPass);

  const applyTuning = (next: MonolithPipelineTuning) => {
    syncBloomAndDebug(next.debugView, next, godraysPass, bloom);
    tonePass.enabled = toneEnabledForView(next.debugView);
  };

  const getDiagnostics = (
    gl: THREE.WebGLRenderer,
    meter: MonolithExposureMeter,
    live: MonolithPipelineTuning,
  ): MonolithPipelineDiagnostics => ({
    debugView: live.debugView,
    exposure: gl.toneMappingExposure,
    measuredAverage: meter.diagnostics.measuredAverage,
    targetExposure: meter.diagnostics.targetExposure,
    readbackPending: meter.diagnostics.readbackPending,
    bloomIntensity: bloom.intensity,
    bloomThreshold: bloom.luminanceMaterial.threshold,
    toneMappingOwner: "ToneMappingEffect",
    rendererToneMapping: "NoToneMapping",
  });

  const tick = (
    dt: number,
    gl: THREE.WebGLRenderer,
    live: MonolithPipelineTuning,
    meter: MonolithExposureMeter,
  ) => {
    syncBloomAndDebug(live.debugView, live, godraysPass, bloom);
    tonePass.enabled = toneEnabledForView(live.debugView);
    const exposure = meter.adapt(
      dt,
      live.exposureCompensationEv,
      live.exposure,
      live.adaptationEnabled,
    );
    gl.toneMappingExposure = exposure;
    return exposure;
  };

  applyTuning(tuning);

  return {
    composer,
    renderPass,
    godraysPass,
    bloom,
    tonePass,
    toneMapping,
    applyTuning,
    getDiagnostics,
    tick,
  };
}
