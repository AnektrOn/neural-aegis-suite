/**
 * Chute d'astéroïdes — instanced streak shader (ported from standalone HTML demo).
 */
import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { AsteroidChaseCameraRig } from "../camera/AsteroidChaseCameraRig";
import {
  INTRO_V2_ASTEROIDS,
  type IntroV2AsteroidsPreset,
} from "../introV2AsteroidsPreset";
import { sampleAsteroidNarrative } from "./asteroid-fall/asteroidNarrative";
import { buildAsteroidNoiseTexture } from "./asteroid-fall/buildNoiseTexture";
import { createAsteroidStreakGeometry, createAsteroidStreakUniforms } from "./asteroid-fall/createStreakGeometry";
import { ASTEROID_STREAK_FRAGMENT, ASTEROID_STREAK_VERTEX } from "./asteroid-fall/streakShaders";

type Props = {
  lowPower?: boolean;
  className?: string;
  hold: MutableRefObject<HoldState>;
  phase: IntroPhase;
  tuning?: IntroV2AsteroidsPreset;
};

function AsteroidStreaks({
  hold,
  phase,
  tuning,
}: {
  hold: MutableRefObject<HoldState>;
  phase: IntroPhase;
  tuning: IntroV2AsteroidsPreset;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sceneTime = useRef(0);

  const { geometry, material, uniforms } = useMemo(() => {
    const noiseTexture = buildAsteroidNoiseTexture(0.05);
    const geometry = createAsteroidStreakGeometry();
    geometry.instanceCount = tuning.countIdle;
    const uniforms = createAsteroidStreakUniforms(noiseTexture);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ASTEROID_STREAK_VERTEX,
      fragmentShader: ASTEROID_STREAK_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material, uniforms };
  }, [tuning.countIdle]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const mix = holdChapterMix(hold.current, phase);
    const narrative = sampleAsteroidNarrative(mix);
    const uCount = narrative.meteorCount;
    sceneTime.current += dt * narrative.timeRate;
    uniforms.uTime.value = sceneTime.current;
    uniforms.uCount.value = uCount;
    uniforms.uFog.value = tuning.fog;
    uniforms.uSway.value = narrative.sway;
    geometry.instanceCount = Math.ceil(uCount);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}

function AsteroidFallContent({
  hold,
  phase,
  tuning,
}: {
  hold: MutableRefObject<HoldState>;
  phase: IntroPhase;
  tuning: IntroV2AsteroidsPreset;
}) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <AsteroidStreaks hold={hold} phase={phase} tuning={tuning} />
    </>
  );
}

export function AsteroidFallScene({
  lowPower = false,
  className,
  hold,
  phase,
  tuning = INTRO_V2_ASTEROIDS,
}: Props) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={lowPower ? 1 : [1, 1.5]}
        camera={{ fov: 50, position: [17.2, -8.5, -36.1], near: 0.1, far: 800 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 1);
        }}
      >
        <AsteroidChaseCameraRig hold={hold} phase={phase} />
        <AsteroidFallContent hold={hold} phase={phase} tuning={tuning} />
      </Canvas>
    </div>
  );
}
