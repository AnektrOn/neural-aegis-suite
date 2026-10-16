import * as THREE from "three";
import { useRef, useMemo, type RefObject } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Center, Text3D, type FontData } from "@react-three/drei";
import { Bloom, EffectComposer, LUT, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, LUTCubeLoader } from "postprocessing";
import type { Texture } from "three";
import { Prism } from "./components/Prism";
import { Box } from "./components/Box";

import lutTex from "./assets/lut/F-6800-STD.cube?url";
import inter from "./assets/fonts/Inter_Bold.json";
import { PRISM_GLB_URL } from "./prismAsset";
import { PRISM_AEGIS_BASE_HEIGHT } from "./prismLandingPresets";
import type { PrismLandingExperienceMode } from "./prismLandingMode";
import { PRISM_LANDING_MODE_LANDING, PRISM_LANDING_MODE_SCROLL } from "./prismLandingMode";
import { ExocortexCamera, ExocortexScene } from "./components/ExocortexScene";
import { useSceneEnvMap } from "./useSceneEnvMap";
import { PrismStageLighting } from "./components/PrismStageLighting";
import { cssHsl } from "./prismLandingTheme";
import { useThemeClassRevision } from "@/lib/theme";
import type { PrismMaterialConfig } from "./prismMaterialConfig";
import type { LandingStageLayout } from "./landingStageLayout";
import {
  createInitialScrollSample,
  createLandingScrollSample,
  lerpScrollSample,
  samplePrismScroll,
} from "./prismScrollKeyframes";

useGLTF.preload(PRISM_GLB_URL);

const SCROLL_LERP = 0.05;

export type PrismLandingCanvasProps = {
  mode: PrismLandingExperienceMode;
  scroll: RefObject<number>;
  materialConfig: PrismMaterialConfig;
  eventSource: RefObject<HTMLElement | null>;
  stageLayout: LandingStageLayout;
};

export default function PrismLandingCanvas({
  mode,
  scroll,
  materialConfig,
  eventSource,
  stageLayout,
}: PrismLandingCanvasProps) {
  const texture = useLoader(LUTCubeLoader, lutTex) as Texture;
  const isLanding = mode === PRISM_LANDING_MODE_LANDING;
  const themeRevision = useThemeClassRevision();
  const stage = useMemo(
    () => cssHsl("--aegis-hero-bg", "222 26% 5%"),
    [themeRevision],
  );

  return (
    <Canvas
      key={mode}
      orthographic
      dpr={isLanding ? [1, 3] : [1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      camera={{ position: [0, 0, 100], zoom: 70 }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
    >
      <color attach="background" args={[isLanding ? stage : "#000000"]} />
      {isLanding ? (
        <>
          <ExocortexCamera />
          <ExocortexScene
            materialConfig={materialConfig}
            stageLayout={stageLayout}
          />
        </>
      ) : (
        <Scene mode={mode} scroll={scroll} materialConfig={materialConfig} />
      )}
      {isLanding ? (
        <EffectComposer multisampling={4}>
          <Bloom
            mipmapBlur
            levels={8}
            intensity={0.28}
            luminanceThreshold={0.92}
            luminanceSmoothing={0.65}
          />
          <Vignette eskil={false} offset={0.45} darkness={0.18} />
          <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.06} />
        </EffectComposer>
      ) : (
        <EffectComposer>
          <Bloom
            mipmapBlur
            levels={9}
            intensity={1.5}
            luminanceThreshold={1}
            luminanceSmoothing={1}
          />
          <LUT lut={texture} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function Scene({
  mode,
  scroll,
  materialConfig,
}: {
  mode: PrismLandingExperienceMode;
  scroll: RefObject<number>;
  materialConfig: PrismMaterialConfig;
}) {
  const envMap = useSceneEnvMap();
  const prismRig = useRef<THREE.Group>(null!);
  const prismFloat = useRef<THREE.Group>(null!);
  const scrollState = useRef(createInitialScrollSample());
  const camPos = useRef(new THREE.Vector3(0, 0, 100));
  const landingSample = useRef(createLandingScrollSample());

  useFrame((state) => {
    const target =
      mode === PRISM_LANDING_MODE_SCROLL
        ? samplePrismScroll(scroll.current)
        : landingSample.current;

    scrollState.current = lerpScrollSample(
      scrollState.current,
      target,
      SCROLL_LERP,
    );
    const sample = scrollState.current;

    const cam = state.camera as THREE.OrthographicCamera;
    cam.zoom = THREE.MathUtils.lerp(cam.zoom, sample.zoom, SCROLL_LERP);
    camPos.current.set(
      THREE.MathUtils.lerp(cam.position.x, sample.cameraPosition[0], SCROLL_LERP),
      THREE.MathUtils.lerp(cam.position.y, sample.cameraPosition[1], SCROLL_LERP),
      THREE.MathUtils.lerp(cam.position.z, sample.cameraPosition[2], SCROLL_LERP),
    );
    cam.position.copy(camPos.current);
    cam.updateProjectionMatrix();

    const rig = prismRig.current;
    if (rig) {
      rig.position.set(
        THREE.MathUtils.lerp(rig.position.x, sample.position[0], SCROLL_LERP),
        THREE.MathUtils.lerp(rig.position.y, sample.position[1], SCROLL_LERP),
        THREE.MathUtils.lerp(rig.position.z, sample.position[2], SCROLL_LERP),
      );
      rig.rotation.set(
        THREE.MathUtils.lerp(rig.rotation.x, sample.rotation[0], SCROLL_LERP),
        THREE.MathUtils.lerp(rig.rotation.y, sample.rotation[1], SCROLL_LERP),
        THREE.MathUtils.lerp(rig.rotation.z, sample.rotation[2], SCROLL_LERP),
      );
      const s = THREE.MathUtils.lerp(rig.scale.x, sample.scale, SCROLL_LERP);
      rig.scale.setScalar(s);
    }

    const bob = prismFloat.current;
    if (bob && mode === PRISM_LANDING_MODE_SCROLL) {
      const et = state.clock.elapsedTime;
      bob.position.y = Math.sin(et / 2) * 0.35;
      bob.rotation.x = Math.sin(et / 3) / 10;
      bob.rotation.y = Math.cos(et / 2) / 8;
      bob.rotation.z = Math.sin(et / 3) / 10;
    } else if (bob) {
      bob.position.y = THREE.MathUtils.lerp(bob.position.y, 0, 0.1);
      bob.rotation.x = THREE.MathUtils.lerp(bob.rotation.x, 0, 0.1);
      bob.rotation.y = THREE.MathUtils.lerp(bob.rotation.y, 0, 0.1);
      bob.rotation.z = THREE.MathUtils.lerp(bob.rotation.z, 0, 0.1);
    }
  });

  return (
    <>
      <PrismStageLighting variant="scroll" />
      <Center top bottom position={[0, 2, 0]}>
        <Text3D
          size={0.7}
          letterSpacing={-0.05}
          height={0.05}
          font={inter as unknown as FontData}
        >
          Dynamic without Limits
          <meshStandardMaterial color="white" />
        </Text3D>
      </Center>
      <group ref={prismRig}>
        <group ref={prismFloat}>
          <Prism
            targetHeight={PRISM_AEGIS_BASE_HEIGHT}
            materialConfig={materialConfig}
            envMap={envMap}
          />
        </group>
      </group>
      <Box position={[3.6, -3.2, 0]} rotation={[0, 0, Math.PI / 3.5]} />
      <Box position={[-3.9, -2.2, 0]} rotation={[0, 0, Math.PI / 4]} />
      <Box position={[-4.4, 1.35, 0]} rotation={[0, 0, Math.PI / 4]} />
    </>
  );
}
