import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import { GodraysPass } from "three-good-godrays";
import * as THREE from "three";
import {
  PORTAL_CENTER_X,
  PORTAL_GAP_WIDTH,
  PORTAL_WORLD_Z,
} from "@/pages/dev/prism-landing/layout/prismSceneConstants";
import { LANDING_WASTELAND_POST } from "@/pages/dev/prism-landing/scene/landingCinematicLook";
import { createLandingGodraysLight } from "@/pages/dev/prism-landing/scene/landingGodraysLight";

const PORTAL_HEIGHT = 23.5;
const PORTAL_FOOT_Y = -1.3;

type PipelineBundle = {
  composer: EffectComposer;
  godraysLight: ReturnType<typeof createLandingGodraysLight>;
  godraysPass: GodraysPass;
};

/** Composer pmndrs + GodraysPass (three-good-godrays) branché sur la lumière ombre. */
export function LandingR3fPostPipeline() {
  const { gl, scene, camera, size } = useThree();
  const pipelineRef = useRef<PipelineBundle | null>(null);

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const slitCenter = new THREE.Vector3(
      PORTAL_CENTER_X,
      PORTAL_FOOT_Y + PORTAL_HEIGHT * 0.42,
      PORTAL_WORLD_Z,
    );
    const godraysLight = createLandingGodraysLight(
      scene,
      slitCenter,
      PORTAL_GAP_WIDTH,
      PORTAL_HEIGHT,
    );
    godraysLight.updateAim(perspective);

    const composer = new EffectComposer(gl, {
      depthBuffer: true,
      multisampling: 0,
    });
    composer.setSize(size.width, size.height);

    const renderPass = new RenderPass(scene, perspective);
    renderPass.renderToScreen = false;
    composer.addPass(renderPass);

    const godraysPass = new GodraysPass(godraysLight.light, perspective, {
      density: 1 / 260,
      maxDensity: 0.12,
      distanceAttenuation: 2.6,
      color: new THREE.Color("#d19d7b"),
      raymarchSteps: 44,
      blur: true,
      gammaCorrection: false,
      resolutionScale: 0.45,
    });
    godraysPass.enabled = true;
    composer.addPass(godraysPass);

    const bloomEffect = new BloomEffect({
      mipmapBlur: true,
      luminanceThreshold: LANDING_WASTELAND_POST.bloomThreshold,
      intensity: LANDING_WASTELAND_POST.bloomStrength * 2.4,
      radius: LANDING_WASTELAND_POST.bloomRadius,
    });
    const bloomPass = new EffectPass(perspective, bloomEffect);
    bloomPass.renderToScreen = true;
    composer.addPass(bloomPass);

    pipelineRef.current = { composer, godraysLight, godraysPass };

    return () => {
      godraysLight.dispose();
      godraysPass.dispose();
      composer.dispose();
      pipelineRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    pipelineRef.current?.composer.setSize(size.width, size.height);
  }, [size.width, size.height]);

  useFrame((state, delta) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;
    const perspective = state.camera as THREE.PerspectiveCamera;
    pipeline.godraysLight.updateAim(perspective);
    pipeline.composer.render(delta);
  }, 1);

  return null;
}
