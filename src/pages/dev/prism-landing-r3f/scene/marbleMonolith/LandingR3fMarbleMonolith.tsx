import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLandingSubjectVisible } from "../../config/PrismR3fLandingDirectorContext";
import { useRegisterMarbleGodrayLight } from "../../config/R3fMarbleGodrayLightContext";
import { useR3fSceneConfig } from "../../config/r3fSceneConfigContext";
import { enableR3fCubeGodrayOcclusion } from "../shatteredCube/r3fCubeGodrayOcclusion";
import {
  R3F_MARBLE_FLOAT,
  R3F_MARBLE_GLOW_DEFAULTS,
  R3F_MARBLE_GODRAYS,
  R3F_MARBLE_MONOLITH_DEFAULT_SEED,
  R3F_MARBLE_MONOLITH_DEFAULT_SIZE,
  r3fMarbleMonolithWorldCenter,
} from "./r3fMarbleMonolithConstants";
import {
  createR3fMarbleMonolithMaterials,
  initR3fRectAreaLightUniforms,
} from "./r3fMarbleMonolithMaterial";

export type LandingR3fMarbleMonolithProps = {
  size?: [number, number, number];
  position?: [number, number, number];
  seed?: number;
  float?: boolean;
  glow?: string;
  glowIntensity?: number;
};

export function LandingR3fMarbleMonolith({
  size = R3F_MARBLE_MONOLITH_DEFAULT_SIZE,
  position,
  seed = R3F_MARBLE_MONOLITH_DEFAULT_SEED,
  float: floatProp,
  glow: glowProp,
  glowIntensity: glowIntensityProp,
}: LandingR3fMarbleMonolithProps) {
  const { config } = useR3fSceneConfig();
  const marbleVisible = useLandingSubjectVisible("marble");
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const registerMarbleGodrayLight = useRegisterMarbleGodrayLight();
  const baseYRef = useRef(0);

  const [w, h, d] = size;
  const glow = glowProp ?? config.marbleGlow;
  const glowIntensity = glowIntensityProp ?? config.marbleGlowIntensity;
  const floatEnabled = floatProp ?? config.marbleFloat;

  const worldCenter = useMemo(
    () => position ?? r3fMarbleMonolithWorldCenter(config, size),
    [
      position,
      config.monolithCenterX,
      config.monolithCenterZ,
      config.marbleHallOffsetX,
      config.marbleHallOffsetZ,
      size,
    ],
  );

  useEffect(() => {
    initR3fRectAreaLightUniforms();
  }, []);

  const { materials, dispose } = useMemo(
    () => createR3fMarbleMonolithMaterials({ seed, glow, size }),
    [seed, glow, size],
  );

  useEffect(() => () => dispose(), [dispose]);

  useLayoutEffect(() => {
    baseYRef.current = worldCenter[1];
    const g = groupRef.current;
    if (!g) return;
    g.position.set(worldCenter[0], worldCenter[1], worldCenter[2]);
  }, [worldCenter]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    enableR3fCubeGodrayOcclusion(g);
  });

  useLayoutEffect(() => {
    registerMarbleGodrayLight(lightRef.current);
    return () => registerMarbleGodrayLight(null);
  }, [registerMarbleGodrayLight]);

  // Backlight monde : derrière la face −Z pour que la dalle occlude (shafts silhouette).
  // Parent identité — GodraysPass lit `light.position` en local.
  const godrayLightPosition = useMemo(
    (): [number, number, number] => [
      worldCenter[0],
      worldCenter[1],
      worldCenter[2] - d * 0.5 - 0.55,
    ],
    [worldCenter, d],
  );

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    if (!floatEnabled) {
      g.position.y = baseYRef.current;
      g.rotation.y = 0;
      return;
    }
    const t = clock.elapsedTime;
    g.position.y = baseYRef.current + Math.sin(t * R3F_MARBLE_FLOAT.yFrequency) * R3F_MARBLE_FLOAT.yAmplitude;
    g.rotation.y = Math.sin(t * R3F_MARBLE_FLOAT.rotYFrequency) * R3F_MARBLE_FLOAT.rotYAmplitude;
  });

  const rectIntensity = R3F_MARBLE_GLOW_DEFAULTS.rectIntensity;

  return (
    <group name="r3f-marble-monolith">
      {/* Sibling monde : ne pas cacher la lumière avec le mesh (sinon GodraysPass s’éteint). */}
      <pointLight
        ref={lightRef}
        visible={marbleVisible}
        position={godrayLightPosition}
        color={glow}
        intensity={glowIntensity}
        distance={R3F_MARBLE_GODRAYS.shadowCameraFar}
        decay={R3F_MARBLE_GLOW_DEFAULTS.pointDecay}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
        shadow-camera-near={R3F_MARBLE_GODRAYS.shadowCameraNear}
        shadow-camera-far={R3F_MARBLE_GODRAYS.shadowCameraFar}
        name="r3f-marble-godray-point-light"
      />
      <group ref={groupRef} visible={marbleVisible}>
        <mesh material={materials} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
        <rectAreaLight
          position={[0, -h / 2 - 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          width={w * 0.9}
          height={d * 0.9}
          color={glow}
          intensity={rectIntensity}
        />
      </group>
    </group>
  );
}
