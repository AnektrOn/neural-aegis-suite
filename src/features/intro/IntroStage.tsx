import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type BloomEffect, type ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";
import type { IntroChapterId } from "./intro.copy";
import type { HoldState } from "./useHoldProgress";
import { StormScene } from "./scenes/StormScene";
import { CurrentScene } from "./scenes/CurrentScene";
import { LightScene } from "./scenes/LightScene";
import { RootsScene } from "./scenes/RootsScene";

type Props = {
  chapter: IntroChapterId | null;
  hold: MutableRefObject<HoldState>;
  lowPower: boolean;
  className?: string;
};

const BASE_CAMERA = new THREE.Vector3(0, 0.4, 5.2);

/** Pointer parallax, a slow breathing dolly while holding, and a storm tremor. */
function CameraRig({ hold, shake }: { hold: MutableRefObject<HoldState>; shake: boolean }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }, delta) => {
    const s = hold.current;
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-delta * 2);
    const tremor = shake && s.holding ? 0.025 * (1 - s.progress) : 0;
    target.set(
      BASE_CAMERA.x + (s.pointer.x - 0.5) * 0.6 + Math.sin(t * 37) * tremor,
      BASE_CAMERA.y + (s.pointer.y - 0.5) * 0.35 + Math.cos(t * 41) * tremor,
      BASE_CAMERA.z - (s.holding ? 0.45 : 0) - s.progress * 0.3,
    );
    camera.position.lerp(target, k);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Bloom and chromatic aberration swell with the hold, like a crescendo. */
function ReactivePostFX({ hold }: { hold: MutableRefObject<HoldState> }) {
  const bloom = useRef<BloomEffect>(null);
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), []);
  const level = useRef(0);

  useFrame((_, delta) => {
    const s = hold.current;
    level.current += ((s.holding ? 1 : 0) * (0.4 + s.progress * 0.6) - level.current) * Math.min(1, delta * 3);
    if (bloom.current) bloom.current.intensity = 0.35 + level.current * 0.45;
    if (aberration.current) {
      const o = 0.0004 + level.current * 0.0018;
      aberration.current.offset.set(o, o * 0.6);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloom} intensity={0.35} luminanceThreshold={0.72} luminanceSmoothing={0.2} mipmapBlur />
      <ChromaticAberration ref={aberration} offset={offset} radialModulation modulationOffset={0.35} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      <Vignette offset={0.3} darkness={0.65} />
    </EffectComposer>
  );
}

export default function IntroStage({ chapter, hold, lowPower, className }: Props) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, lowPower ? 1.25 : 1.75]}
        camera={{ position: BASE_CAMERA.toArray(), fov: 45 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#05060a"]} />
        {chapter === "current" ? null : <CameraRig hold={hold} shake={chapter === "storm"} />}
        {chapter === "storm" ? <StormScene key="storm" hold={hold} lowPower={lowPower} /> : null}
        {chapter === "current" ? (
          <Suspense key="current" fallback={null}>
            <CurrentScene hold={hold} />
          </Suspense>
        ) : null}
        {chapter === "light" ? (
          <LightScene key="light" hold={hold} particleCount={lowPower ? 6000 : 18000} />
        ) : null}
        {chapter === "roots" ? (
          <group key="roots">
            <RootsScene hold={hold} />
            <Sparkles count={lowPower ? 50 : 120} scale={[9, 5, 4]} size={3} speed={0.25} opacity={0.6} color="#f2c27a" noise={0.8} />
          </group>
        ) : null}
        {/* The ocean relies on the renderer's own ACES tone mapping and exposure, like the three.js example. */}
        {lowPower || chapter === "current" ? null : <ReactivePostFX hold={hold} />}
      </Canvas>
    </div>
  );
}
