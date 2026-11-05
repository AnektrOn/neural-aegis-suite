import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  BrightnessContrastEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SSAOEffect,
  VignetteEffect,
} from "postprocessing";
import { GodraysPass } from "three-good-godrays";
import * as THREE from "three";
import {
  useCubeCoreGodrayLights,
  useGetCubeCoreLightingRuntime,
} from "../config/R3fCubeCoreLightContext";
import { useGutterPointLight } from "../config/R3fGutterLightContext";
import { useMarbleGodrayLight } from "../config/R3fMarbleGodrayLightContext";
import { useR3fSceneConfig } from "../config/r3fSceneConfigContext";
import { applyR3fBloomParams } from "./post/r3fPmndrsBloom";
import { R3F_PMNDRS_POST_DEFAULTS } from "./post/r3fPmndrsPostDefaults";
import { r3fComposerRenderTargetType } from "./post/r3fWebGLCaps";
import {
  R3F_MARBLE_GLOW_DEFAULTS,
  R3F_MARBLE_GODRAYS,
} from "./marbleMonolith/r3fMarbleMonolithConstants";
import { R3F_CUBE_CORE_GODRAYS } from "./shatteredCube/r3fShatteredCubeConstants";
import type { R3fHallSceneMode } from "./LandingR3fSceneContent";

const godrayColorScratch = new THREE.Color();
const cubeGodrayColorScratch = new THREE.Color();
const marbleGodrayColorScratch = new THREE.Color();
const emitColorScratch = new THREE.Color();
const drawSizeScratch = new THREE.Vector2();

function getComposerDrawSize(gl: THREE.WebGLRenderer) {
  gl.getDrawingBufferSize(drawSizeScratch);
  return {
    w: Math.max(1, Math.floor(drawSizeScratch.x)),
    h: Math.max(1, Math.floor(drawSizeScratch.y)),
  };
}

type PipelineBundle = {
  composer: EffectComposer;
  renderPass: RenderPass;
  godraysPass: GodraysPass;
  cubeGodraysPasses: GodraysPass[];
  marbleGodraysPass: GodraysPass | null;
  bloomPass: EffectPass;
  gradePass: EffectPass;
  ssaoEffect: SSAOEffect;
  bloomEffect: BloomEffect;
  vignetteEffect: VignetteEffect;
  contrastEffect: BrightnessContrastEffect;
  noiseEffect: NoiseEffect;
};

function syncPassCamera(pass: { mainCamera: THREE.Camera }, camera: THREE.Camera) {
  pass.mainCamera = camera;
}

function isWorldVisible(object: THREE.Object3D): boolean {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

/**
 * Passes : RenderPass → GodraysPass (fente) → cube → marbre → SSAO+Bloom → grade → écran.
 */
type LandingR3fPostPipelineProps = {
  sceneMode?: R3fHallSceneMode;
};

export function LandingR3fPostPipeline({ sceneMode = "lab" }: LandingR3fPostPipelineProps) {
  const { gl, scene, camera, size } = useThree();
  const isLanding = sceneMode === "landing";
  const { configRef } = useR3fSceneConfig();
  const gutterLight = useGutterPointLight();
  const cubeGodrayLights = useCubeCoreGodrayLights();
  const marbleGodrayLight = useMarbleGodrayLight();
  const getCubeLightingRuntime = useGetCubeCoreLightingRuntime();
  const pipelineRef = useRef<PipelineBundle | null>(null);

  useEffect(() => {
    if (!gutterLight || size.width < 2 || size.height < 2) return;

    const perspective = camera as THREE.PerspectiveCamera;
    const frameBufferType = r3fComposerRenderTargetType(gl);

    const composer = new EffectComposer(gl, {
      depthBuffer: true,
      multisampling: 0,
      frameBufferType,
    });
    composer.setSize(size.width, size.height);

    const renderPass = new RenderPass(scene, perspective);
    renderPass.renderToScreen = false;
    composer.addPass(renderPass);

    const cfg = configRef.current;
    godrayColorScratch.set(cfg.godraysColor);
    const godraysPass = new GodraysPass(gutterLight, perspective, {
      density: cfg.godraysDensity,
      maxDensity: cfg.godraysMaxDensity,
      distanceAttenuation: cfg.godraysDistanceAttenuation,
      color: godrayColorScratch,
      raymarchSteps: cfg.godraysRaymarchSteps,
      blur: true,
      gammaCorrection: cfg.godraysGammaCorrection,
      resolutionScale: cfg.godraysResolutionScale,
    });
    godraysPass.renderToScreen = false;
    composer.addPass(godraysPass);

    const cubeGodraysPasses: GodraysPass[] = [];
    for (const coreLight of cubeGodrayLights) {
      cubeGodrayColorScratch.set(R3F_CUBE_CORE_GODRAYS.color);
      const cubeGodraysPass = new GodraysPass(coreLight, perspective, {
        density: R3F_CUBE_CORE_GODRAYS.density,
        maxDensity: R3F_CUBE_CORE_GODRAYS.maxDensity,
        distanceAttenuation: R3F_CUBE_CORE_GODRAYS.distanceAttenuation,
        color: cubeGodrayColorScratch,
        raymarchSteps: R3F_CUBE_CORE_GODRAYS.raymarchSteps,
        blur: true,
        gammaCorrection: R3F_CUBE_CORE_GODRAYS.gammaCorrection,
        resolutionScale: R3F_CUBE_CORE_GODRAYS.resolutionScale,
      });
      cubeGodraysPass.renderToScreen = false;
      composer.addPass(cubeGodraysPass);
      cubeGodraysPasses.push(cubeGodraysPass);
    }

    let marbleGodraysPass: GodraysPass | null = null;
    if (marbleGodrayLight) {
      marbleGodrayColorScratch.set(R3F_MARBLE_GLOW_DEFAULTS.color);
      marbleGodraysPass = new GodraysPass(marbleGodrayLight, perspective, {
        density: R3F_MARBLE_GODRAYS.density,
        maxDensity: R3F_MARBLE_GODRAYS.maxDensity,
        distanceAttenuation: R3F_MARBLE_GODRAYS.distanceAttenuation,
        color: marbleGodrayColorScratch,
        raymarchSteps: R3F_MARBLE_GODRAYS.raymarchSteps,
        blur: true,
        gammaCorrection: R3F_MARBLE_GODRAYS.gammaCorrection,
        resolutionScale: R3F_MARBLE_GODRAYS.resolutionScale,
      });
      marbleGodraysPass.renderToScreen = false;
      composer.addPass(marbleGodraysPass);
    }

    const ssaoEffect = new SSAOEffect(perspective, undefined, {
      intensity: R3F_PMNDRS_POST_DEFAULTS.n8aoIntensity,
      radius: 0.14,
      bias: 0.025,
    });
    ssaoEffect.blendMode.opacity.value = cfg.n8aoEnabled
      ? Math.min(cfg.n8aoIntensity / 4, 1)
      : 0;

    const bloomEffect = new BloomEffect({ mipmapBlur: true });
    applyR3fBloomParams(
      bloomEffect,
      R3F_PMNDRS_POST_DEFAULTS.bloomStrength,
      R3F_PMNDRS_POST_DEFAULTS.bloomRadius,
      R3F_PMNDRS_POST_DEFAULTS.bloomThreshold,
    );

    const bloomPass = new EffectPass(perspective, ssaoEffect, bloomEffect);
    bloomPass.encodeOutput = false;
    bloomPass.renderToScreen = false;
    composer.addPass(bloomPass);

    const vignetteEffect = new VignetteEffect({
      darkness: isLanding ? 0.36 : 0.42,
      offset: 0.38,
    });
    const contrastEffect = new BrightnessContrastEffect({
      brightness: isLanding ? 0.01 : 0,
      contrast: isLanding ? 0.05 : 0.06,
    });
    const noiseEffect = new NoiseEffect({ premultiply: true });
    noiseEffect.blendMode.opacity.value = 0;
    const gradePass = new EffectPass(perspective, vignetteEffect, contrastEffect, noiseEffect);
    gradePass.encodeOutput = true;
    gradePass.renderToScreen = true;
    composer.addPass(gradePass);

    pipelineRef.current = {
      composer,
      renderPass,
      godraysPass,
      cubeGodraysPasses,
      marbleGodraysPass,
      bloomPass,
      gradePass,
      ssaoEffect,
      bloomEffect,
      vignetteEffect,
      contrastEffect,
      noiseEffect,
    };

    return () => {
      godraysPass.dispose();
      for (const pass of cubeGodraysPasses) pass.dispose();
      marbleGodraysPass?.dispose();
      composer.dispose();
      pipelineRef.current = null;
    };
  }, [
    gl,
    scene,
    camera,
    configRef,
    gutterLight,
    cubeGodrayLights,
    marbleGodrayLight,
    size.width,
    size.height,
  ]);

  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;
    pipeline.composer.setSize(size.width, size.height);
  }, [size.width, size.height]);

  useFrame((_state, delta) => {
    const perspective = _state.camera as THREE.PerspectiveCamera;
    perspective.updateMatrixWorld();

    const pipeline = pipelineRef.current;
    const light = gutterLight;
    if (!pipeline || !light) return;

    if (isLanding) {
      syncPassCamera(pipeline.renderPass, perspective);
      syncPassCamera(pipeline.bloomPass, perspective);
      syncPassCamera(pipeline.gradePass, perspective);
      syncPassCamera(pipeline.godraysPass, perspective);
      for (const cubePass of pipeline.cubeGodraysPasses) {
        syncPassCamera(cubePass, perspective);
      }
      if (pipeline.marbleGodraysPass) {
        syncPassCamera(pipeline.marbleGodraysPass, perspective);
      }
    }

    const cfg = configRef.current;
    light.visible = true;
    light.updateMatrixWorld();
    emitColorScratch.set(cfg.slitEmitterColor);
    light.intensity = cfg.emitLightIntensity;
    light.distance = cfg.emitLightDistance;
    light.color.copy(emitColorScratch);
    light.shadow.camera.far = Math.min(cfg.emitLightDistance * 1.35, 120);
    light.shadow.camera.updateProjectionMatrix();

    pipeline.ssaoEffect.blendMode.opacity.value = cfg.n8aoEnabled
      ? Math.min(cfg.n8aoIntensity / 4, 1)
      : 0;
    pipeline.ssaoEffect.radius = Math.max(0.04, cfg.n8aoRadius * 0.028);

    const cubeRt = getCubeLightingRuntime();

    pipeline.godraysPass.enabled = cfg.godraysEnabled && cfg.emitLightIntensity > 8;
    godrayColorScratch.set(cfg.godraysColor);
    const gutterAtten = Math.max(0, Math.min(1, cfg.cubeGutterGodraysAttenuation));
    const gutterScale =
      gutterAtten > 0 ? 1 - gutterAtten * cubeRt.godrayReveal : 1;
    pipeline.godraysPass.setParams({
      density: cfg.godraysDensity * gutterScale,
      maxDensity: cfg.godraysMaxDensity * gutterScale,
      distanceAttenuation: cfg.godraysDistanceAttenuation,
      raymarchSteps: cfg.godraysRaymarchSteps,
      resolutionScale: cfg.godraysResolutionScale,
      color: godrayColorScratch,
      blur: true,
      gammaCorrection: cfg.godraysGammaCorrection,
    });

    let lastEnabledCubePass: GodraysPass | null = null;
    pipeline.cubeGodraysPasses.forEach((cubePass, index) => {
      const coreLight = cubeGodrayLights[index];
      if (!coreLight) {
        cubePass.enabled = false;
        return;
      }
      coreLight.updateMatrixWorld();
      const coreReveal = cubeRt.godrayReveal;
      cubePass.enabled =
        cfg.godraysEnabled &&
        cubeRt.phase !== "hold" &&
        coreReveal > R3F_CUBE_CORE_GODRAYS.minRevealForPass;
      if (cubePass.enabled) {
        lastEnabledCubePass = cubePass;
      }
      cubeGodrayColorScratch.set(R3F_CUBE_CORE_GODRAYS.color).lerp(coreLight.color, 0.45);
      cubePass.setParams({
        density: R3F_CUBE_CORE_GODRAYS.density * (0.35 + coreReveal * 0.95),
        maxDensity: R3F_CUBE_CORE_GODRAYS.maxDensity * (0.2 + coreReveal * 0.9),
        distanceAttenuation: R3F_CUBE_CORE_GODRAYS.distanceAttenuation,
        raymarchSteps: R3F_CUBE_CORE_GODRAYS.raymarchSteps,
        resolutionScale: R3F_CUBE_CORE_GODRAYS.resolutionScale,
        color: cubeGodrayColorScratch,
        blur: true,
        gammaCorrection: R3F_CUBE_CORE_GODRAYS.gammaCorrection,
      });
    });

    const marblePass = pipeline.marbleGodraysPass;
    if (marblePass && marbleGodrayLight) {
      marbleGodrayLight.updateMatrixWorld();
      marbleGodrayLight.distance = R3F_MARBLE_GODRAYS.shadowCameraFar;
      marbleGodrayLight.shadow.camera.near = R3F_MARBLE_GODRAYS.shadowCameraNear;
      marbleGodrayLight.shadow.camera.far = R3F_MARBLE_GODRAYS.shadowCameraFar;
      marbleGodrayLight.shadow.camera.updateProjectionMatrix();
      const marbleOn =
        cfg.godraysEnabled &&
        marbleGodrayLight.intensity > 1 &&
        isWorldVisible(marbleGodrayLight);
      marblePass.enabled = marbleOn;
      if (marbleOn) {
        marbleGodrayColorScratch.set(cfg.marbleGlow);
        marblePass.setParams({
          density: R3F_MARBLE_GODRAYS.density,
          maxDensity: R3F_MARBLE_GODRAYS.maxDensity,
          distanceAttenuation: R3F_MARBLE_GODRAYS.distanceAttenuation,
          raymarchSteps: R3F_MARBLE_GODRAYS.raymarchSteps,
          resolutionScale: R3F_MARBLE_GODRAYS.resolutionScale,
          color: marbleGodrayColorScratch,
          blur: true,
          gammaCorrection: R3F_MARBLE_GODRAYS.gammaCorrection,
        });
      }
    } else if (marblePass) {
      marblePass.enabled = false;
    }

    pipeline.bloomEffect.blendMode.opacity.value = cfg.bloomEnabled ? 1 : 0;
    applyR3fBloomParams(
      pipeline.bloomEffect,
      cfg.bloomStrength,
      cfg.bloomRadius,
      cfg.bloomThreshold,
    );

    pipeline.gradePass.enabled = cfg.gradeEnabled || cfg.filmGrainIntensity > 0;
    pipeline.vignetteEffect.blendMode.opacity.value = cfg.gradeEnabled ? 1 : 0;
    pipeline.contrastEffect.blendMode.opacity.value = cfg.gradeEnabled ? 1 : 0;
    pipeline.noiseEffect.blendMode.opacity.value = Math.min(
      0.12,
      Math.max(0, cfg.filmGrainIntensity),
    );

    const gradeToScreen = cfg.gradeEnabled || cfg.filmGrainIntensity > 0;

    const bloomToScreen = !gradeToScreen && cfg.bloomEnabled;
    const godraysFallbackToScreen = !gradeToScreen && !bloomToScreen;
    pipeline.gradePass.renderToScreen = gradeToScreen;
    pipeline.bloomPass.renderToScreen = bloomToScreen;
    for (const cubePass of pipeline.cubeGodraysPasses) {
      cubePass.renderToScreen = godraysFallbackToScreen && cubePass === lastEnabledCubePass;
    }
    const marbleToScreen =
      godraysFallbackToScreen &&
      lastEnabledCubePass === null &&
      pipeline.marbleGodraysPass?.enabled === true;
    if (pipeline.marbleGodraysPass) {
      pipeline.marbleGodraysPass.renderToScreen = marbleToScreen;
    }
    pipeline.godraysPass.renderToScreen =
      godraysFallbackToScreen && lastEnabledCubePass === null && !marbleToScreen;

    pipeline.composer.render(delta);
  }, 1);

  return null;
}
