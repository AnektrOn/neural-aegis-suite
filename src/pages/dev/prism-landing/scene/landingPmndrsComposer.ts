import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import { GodraysPass } from "three-good-godrays";
import * as THREE from "three";
import type { WebGLRenderer } from "three";
import type { LandingComposerResizeTarget } from "./landingComposerResize";
import { LANDING_WASTELAND_POST } from "./landingCinematicLook";
import { createLandingGodraysLight, type LandingGodraysLightRig } from "./landingGodraysLight";
import { LandingGradeEffect } from "./landingPmndrsEffects";
import {
  bindLandingPmndrsLut,
  createLandingPmndrsPostTargets,
  setLandingPmndrsBloomFromBootstrap,
  setLandingPmndrsGradeResolution,
  type LandingPmndrsPostFxHandles,
} from "./landingPmndrsPostBridge";
import { attachLandingPmndrsRealism, type LandingPmndrsRealismBundle } from "./landingPmndrsRealism";
import { landingComposerRenderTargetType, landingSupportsLut3d } from "./landingWebGLCaps";
import type { PrismPerformanceProfile } from "./prismLandingPerformance";
import {
  PORTAL_CENTER_X,
  PORTAL_GAP_WIDTH,
  PORTAL_WORLD_Z,
} from "../layout/prismSceneConstants";

const PORTAL_HEIGHT = 23.5;

export type LandingPmndrsPipeline = LandingComposerResizeTarget & {
  composer: EffectComposer;
  render: (deltaTime: number) => void;
  dispose: () => void;
  postFx: LandingPmndrsPostFxHandles;
  getPostTargets: () => ReturnType<typeof createLandingPmndrsPostTargets>;
  godraysPass: GodraysPass;
  godraysLight: LandingGodraysLightRig;
  realism: LandingPmndrsRealismBundle | null;
  syncBufferSizes: (viewW: number, viewH: number, pixelRatio: number) => void;
  updateGodraysFrame: (params: {
    camera: THREE.PerspectiveCamera;
    enabled: boolean;
    strength: number;
    glow: number;
    portalStrengthFactor: number;
    pathU: number;
    pathPlaying: boolean;
  }) => void;
  setGodraysPerfProfile: (profile: PrismPerformanceProfile, pixelRatio: number) => void;
};

export type CreateLandingPmndrsPipelineOptions = {
  renderer: WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  width: number;
  height: number;
  pixelRatio: number;
  portalFootY: number;
  landingLut?: THREE.Data3DTexture;
  performanceProfile: PrismPerformanceProfile;
};

export function createLandingPmndrsPipeline(
  options: CreateLandingPmndrsPipelineOptions,
): LandingPmndrsPipeline {
  const {
    renderer,
    scene,
    camera,
    width,
    height,
    pixelRatio,
    portalFootY,
    landingLut,
    performanceProfile,
  } = options;

  const frameBufferType = landingComposerRenderTargetType(renderer);
  const composer = new EffectComposer(renderer, {
    depthBuffer: true,
    multisampling: 0,
    frameBufferType,
  });
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = false;
  composer.addPass(renderPass);

  const slitCenter = new THREE.Vector3(
    PORTAL_CENTER_X,
    portalFootY + PORTAL_HEIGHT * 0.42,
    PORTAL_WORLD_Z,
  );
  const godraysLight = createLandingGodraysLight(
    scene,
    slitCenter,
    PORTAL_GAP_WIDTH,
    PORTAL_HEIGHT,
    performanceProfile === "optimized" ? 1024 : 2048,
  );
  godraysLight.updateAim(camera);

  const godrayColor = new THREE.Color("#d19d7b");
  const godraysPass = new GodraysPass(godraysLight.light, camera, {
    density: 1 / 260,
    maxDensity: 0.14,
    distanceAttenuation: 2.4,
    color: godrayColor,
    raymarchSteps: performanceProfile === "optimized" ? 32 : 48,
    blur: true,
    gammaCorrection: false,
    resolutionScale: performanceProfile === "optimized" ? 0.35 : 0.5,
  });
  godraysPass.enabled = false;
  composer.addPass(godraysPass);

  const realism = attachLandingPmndrsRealism(
    composer,
    camera,
    composer.passes.length,
  );

  const bloomEffect = new BloomEffect({
    mipmapBlur: true,
    luminanceThreshold: LANDING_WASTELAND_POST.bloomThreshold,
    intensity: LANDING_WASTELAND_POST.bloomStrength * 2.85,
    radius: LANDING_WASTELAND_POST.bloomRadius,
  });
  const gradeLut3d = landingSupportsLut3d(renderer) && Boolean(landingLut);
  const gradeEffect = new LandingGradeEffect(gradeLut3d);
  if (gradeLut3d && landingLut) {
    bindLandingPmndrsLut(gradeEffect, landingLut, landingLut.image.width);
  }

  const postPass = new EffectPass(camera, bloomEffect);
  postPass.encodeOutput = false;
  composer.addPass(postPass);

  const gradePass = new EffectPass(camera, gradeEffect);
  gradePass.encodeOutput = true;
  composer.addPass(gradePass);

  setLandingPmndrsBloomFromBootstrap(
    bloomEffect,
    LANDING_WASTELAND_POST.bloomStrength,
    LANDING_WASTELAND_POST.bloomRadius,
    LANDING_WASTELAND_POST.bloomThreshold,
  );

  const postFx: LandingPmndrsPostFxHandles = {
    bloom: bloomEffect,
    grade: gradeEffect,
  };

  let viewW = width;
  let viewH = height;
  let pr = pixelRatio;

  const syncBufferSizes = (w: number, h: number, ratio: number) => {
    viewW = w;
    viewH = h;
    pr = ratio;
    const drawW = w * ratio;
    const drawH = h * ratio;
    setLandingPmndrsGradeResolution(gradeEffect, drawW, drawH);
  };
  syncBufferSizes(width, height, pixelRatio);

  const baseDensity = 1 / 260;
  const baseMaxDensity = 0.14;

  return {
    composer,
    postFx,
    godraysPass,
    godraysLight,
    realism,
    getPostTargets: () => createLandingPmndrsPostTargets(postFx),
    render(deltaTime: number) {
      composer.render(deltaTime);
    },
    setSize(w: number, h: number) {
      composer.setSize(w, h);
      syncBufferSizes(w, h, pr);
    },
    setPixelRatio(ratio: number) {
      pr = ratio;
      syncBufferSizes(viewW, viewH, ratio);
    },
    syncBufferSizes,
    updateGodraysFrame({
      camera: cam,
      enabled,
      strength,
      portalStrengthFactor,
      pathU,
      pathPlaying,
    }) {
      godraysLight.updateAim(cam);
      const gate = THREE.MathUtils.clamp(portalStrengthFactor, 0, 1);
      const mul = Math.max(0, strength) * gate;
      const pathReady = pathPlaying ? pathU >= 0.2 : pathU >= 0.34;
      const active = enabled && pathReady && gate > 0.58 && mul > 0.0001;
      godraysPass.enabled = active;
      if (!active) return;
      const subtle = THREE.MathUtils.clamp(mul / 0.2, 0, 1);
      godraysPass.setParams({
        density: baseDensity * (0.28 + subtle * 0.62),
        maxDensity: Math.min(0.075, baseMaxDensity * (0.15 + subtle * 0.45) * gate),
        color: godrayColor,
        distanceAttenuation: 3.4,
        gammaCorrection: false,
      });
    },
    setGodraysPerfProfile(profile, pixelRatio) {
      const low = profile === "optimized" || pixelRatio < 1.0;
      godraysPass.setParams({
        raymarchSteps: low ? 28 : 48,
        resolutionScale: low ? 0.3 : 0.5,
      });
    },
    dispose() {
      realism?.dispose();
      godraysLight.dispose();
      godraysPass.dispose();
      composer.dispose();
    },
  };
}
