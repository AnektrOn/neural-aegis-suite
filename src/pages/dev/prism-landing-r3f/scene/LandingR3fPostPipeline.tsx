import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  BrightnessContrastEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SSAOEffect,
  VignetteEffect,
} from "postprocessing";
import { GodraysPass } from "three-good-godrays";
import * as THREE from "three";
import { useCubeCoreGodrayLights } from "../config/R3fCubeCoreLightContext";
import { useGutterPointLight } from "../config/R3fGutterLightContext";
import { useR3fSceneConfig } from "../config/r3fSceneConfigContext";
import { R3F_GODRAYS_HALL_GODRAYS } from "./godraysHall/r3fGodraysHallConstants";
import { applyR3fBloomParams } from "./post/r3fPmndrsBloom";
import { R3F_PMNDRS_POST_DEFAULTS } from "./post/r3fPmndrsPostDefaults";
import { r3fComposerRenderTargetType } from "./post/r3fWebGLCaps";
import {
  R3F_CUBE_CORE_EMISSION,
  R3F_CUBE_CORE_GODRAYS,
} from "./shatteredCube/r3fShatteredCubeConstants";

const godrayColorScratch = new THREE.Color();
const cubeGodrayColorScratch = new THREE.Color();
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
  godraysPass: GodraysPass;
  cubeGodraysPasses: GodraysPass[];
  bloomPass: EffectPass;
  gradePass: EffectPass;
  ssaoEffect: SSAOEffect;
  bloomEffect: BloomEffect;
  vignetteEffect: VignetteEffect;
  contrastEffect: BrightnessContrastEffect;
};

/**
 * Passes : RenderPass → GodraysPass (fente) → GodraysPass (noyau cube) → SSAO+Bloom → grade → écran.
 */
export function LandingR3fPostPipeline() {
  const { gl, scene, camera, size } = useThree();
  const { configRef } = useR3fSceneConfig();
  const gutterLight = useGutterPointLight();
  const cubeGodrayLights = useCubeCoreGodrayLights();
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
      edgeStrength: R3F_GODRAYS_HALL_GODRAYS.edgeStrength,
      edgeRadius: R3F_GODRAYS_HALL_GODRAYS.edgeRadius,
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
    for (const slitLight of cubeGodrayLights) {
      cubeGodrayColorScratch.set(R3F_CUBE_CORE_GODRAYS.color);
      const cubeGodraysPass = new GodraysPass(slitLight, perspective, {
        density: R3F_CUBE_CORE_GODRAYS.density,
        maxDensity: R3F_CUBE_CORE_GODRAYS.maxDensity,
        edgeStrength: R3F_GODRAYS_HALL_GODRAYS.edgeStrength,
        edgeRadius: R3F_GODRAYS_HALL_GODRAYS.edgeRadius,
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
      darkness: 0.42,
      offset: 0.35,
    });
    const contrastEffect = new BrightnessContrastEffect({
      brightness: 0,
      contrast: 0.06,
    });
    const gradePass = new EffectPass(perspective, vignetteEffect, contrastEffect);
    gradePass.encodeOutput = true;
    gradePass.renderToScreen = true;
    composer.addPass(gradePass);

    pipelineRef.current = {
      composer,
      godraysPass,
      cubeGodraysPasses,
      bloomPass,
      gradePass,
      ssaoEffect,
      bloomEffect,
      vignetteEffect,
      contrastEffect,
    };

    return () => {
      godraysPass.dispose();
      for (const pass of cubeGodraysPasses) pass.dispose();
      composer.dispose();
      pipelineRef.current = null;
    };
  }, [gl, scene, camera, configRef, gutterLight, cubeGodrayLights, size.width, size.height]);

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

    const cfg = configRef.current;
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

    pipeline.godraysPass.enabled = cfg.godraysEnabled;
    godrayColorScratch.set(cfg.godraysColor);
    pipeline.godraysPass.setParams({
      density: cfg.godraysDensity,
      maxDensity: cfg.godraysMaxDensity,
      edgeStrength: R3F_GODRAYS_HALL_GODRAYS.edgeStrength,
      edgeRadius: R3F_GODRAYS_HALL_GODRAYS.edgeRadius,
      distanceAttenuation: cfg.godraysDistanceAttenuation,
      raymarchSteps: cfg.godraysRaymarchSteps,
      resolutionScale: cfg.godraysResolutionScale,
      color: godrayColorScratch,
      blur: true,
      gammaCorrection: cfg.godraysGammaCorrection,
    });

    pipeline.cubeGodraysPasses.forEach((cubePass, index) => {
      const coreLight = cubeGodrayLights[index];
      if (!coreLight) {
        cubePass.enabled = false;
        return;
      }
      const coreReveal = Math.min(
        coreLight.intensity / R3F_CUBE_CORE_EMISSION.godrayIntensityDivisor,
        1,
      );
      cubePass.enabled =
        cfg.godraysEnabled && coreReveal > R3F_CUBE_CORE_GODRAYS.minRevealForPass;
      cubeGodrayColorScratch.set(R3F_CUBE_CORE_GODRAYS.color);
      cubePass.setParams({
        density: R3F_CUBE_CORE_GODRAYS.density * (0.45 + coreReveal * 0.95),
        maxDensity: R3F_CUBE_CORE_GODRAYS.maxDensity * (0.25 + coreReveal * 0.85),
        edgeStrength: R3F_GODRAYS_HALL_GODRAYS.edgeStrength,
        edgeRadius: R3F_GODRAYS_HALL_GODRAYS.edgeRadius,
        distanceAttenuation: R3F_CUBE_CORE_GODRAYS.distanceAttenuation,
        raymarchSteps: R3F_CUBE_CORE_GODRAYS.raymarchSteps,
        resolutionScale: R3F_CUBE_CORE_GODRAYS.resolutionScale,
        color: cubeGodrayColorScratch,
        blur: true,
        gammaCorrection: R3F_CUBE_CORE_GODRAYS.gammaCorrection,
      });
    });

    pipeline.bloomEffect.enabled = cfg.bloomEnabled;
    applyR3fBloomParams(
      pipeline.bloomEffect,
      cfg.bloomStrength,
      cfg.bloomRadius,
      cfg.bloomThreshold,
    );

    pipeline.gradePass.enabled = cfg.gradeEnabled;
    pipeline.vignetteEffect.blendMode.opacity.value = cfg.gradeEnabled ? 1 : 0;
    pipeline.contrastEffect.blendMode.opacity.value = cfg.gradeEnabled ? 1 : 0;

    const gradeToScreen = cfg.gradeEnabled;
    pipeline.gradePass.renderToScreen = gradeToScreen;
    pipeline.bloomPass.renderToScreen = !gradeToScreen && cfg.bloomEnabled;
    pipeline.godraysPass.renderToScreen = !gradeToScreen && !cfg.bloomEnabled;
    for (const cubePass of pipeline.cubeGodraysPasses) {
      cubePass.renderToScreen = false;
    }

    pipeline.composer.render(delta);
  }, 1);

  return null;
}
