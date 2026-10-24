import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useRegisterCubeCoreGodrayLights } from "../../config/R3fCubeCoreLightContext";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  R3F_CUBE_CORE_EMISSION,
  R3F_CUBE_INTERSTICE_BEAMS,
  R3F_SHATTERED_CUBE_DEFAULT_SIZE,
  R3F_SHATTERED_CUBE_LIGHT_LAYER,
  R3F_SHATTERED_CUBE_TIMING,
  r3fShatteredCubePortalFrontPosition,
} from "./r3fShatteredCubeConstants";
import { createR3fShatteredCubeBasaltMaterial } from "./r3fShatteredCubeBasaltMaterial";
import {
  advanceShatteredCubePhase,
  applyIntersticeBeamsToLights,
  computeCubeCoreLightingFrame,
  computeInstancePoses,
  type ShatteredCubeInstancePose,
  type ShatteredCubePhaseState,
} from "./r3fCubeCoreLighting";
import { buildR3fShatteredCubeLattice } from "./r3fShatteredCubeLattice";

export type LandingR3fShatteredCubeProps = {
  size?: number;
  grid?: number;
  seed?: number;
  position?: [number, number, number];
  autoPlay?: boolean;
  glow?: string;
  defragDepth?: number;
  envMapIntensity?: number;
  dimCore?: boolean;
  onPhaseChange?: (phase: "hold" | "burst" | "reform") => void;
};

const matrixScratch = new THREE.Matrix4();
const posScratch = new THREE.Vector3();
const scaleScratch = new THREE.Vector3();
const identQuat = new THREE.Quaternion();
const glowColorScratch = new THREE.Color();

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SLIT_LIGHT_COUNT = R3F_CUBE_INTERSTICE_BEAMS.maxBeams;

export function LandingR3fShatteredCube({
  size = R3F_SHATTERED_CUBE_DEFAULT_SIZE,
  grid = 10,
  seed = 5,
  position,
  autoPlay = true,
  glow = "#e2f1ff",
  defragDepth = 0.6,
  envMapIntensity = 1.35,
  dimCore = false,
  onPhaseChange,
}: LandingR3fShatteredCubeProps) {
  const lattice = useMemo(
    () => buildR3fShatteredCubeLattice({ grid, seed }),
    [grid, seed],
  );

  const worldPosition = useMemo(
    () => position ?? r3fShatteredCubePortalFrontPosition(lattice, size),
    [position, lattice, size],
  );

  const poseBuffer = useMemo(() => {
    const poses: ShatteredCubeInstancePose[] = [];
    for (let i = 0; i < lattice.count; i++) {
      poses.push({ center: new THREE.Vector3(), k: 0 });
    }
    return poses;
  }, [lattice.count]);

  const { scene } = useThree();
  const rootRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const instancesRef = useRef<THREE.InstancedMesh>(null);
  const emitterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMatRef = useRef<THREE.SpriteMaterial>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const slitLightRefs = useRef<(THREE.PointLight | null)[]>(
    Array.from({ length: SLIT_LIGHT_COUNT }, () => null),
  );
  const registerCubeCoreGodrayLights = useRegisterCubeCoreGodrayLights();
  const godrayLightsRegisteredRef = useRef(false);

  const autoPlayRef = useRef(autoPlay);
  const defragDepthRef = useRef(defragDepth);
  const glowRef = useRef(glow);

  const phaseRef = useRef<ShatteredCubePhaseState>({
    phase: "hold",
    t0: -1,
    lastNotified: "hold",
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCell: { value: lattice.cell },
    }),
    [lattice.cell],
  );

  const basaltMaterial = useMemo(
    () => createR3fShatteredCubeBasaltMaterial(uniforms, scene.environment, envMapIntensity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uniforms, envMapIntensity],
  );

  const haloTexture = useMemo(() => createHaloTexture(), []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.traverse((obj) => {
      if (obj instanceof THREE.Light) {
        obj.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
        return;
      }
      obj.layers.set(R3F_SHATTERED_CUBE_LIGHT_LAYER);
    });
  });

  useEffect(() => {
    return () => {
      godrayLightsRegisteredRef.current = false;
      registerCubeCoreGodrayLights([]);
    };
  }, [registerCubeCoreGodrayLights]);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    defragDepthRef.current = defragDepth;
  }, [defragDepth]);

  useEffect(() => {
    glowRef.current = glow;
    glowColorScratch.set(glow);
    emitterMatRef.current?.emissive.copy(glowColorScratch);
    haloMatRef.current?.color.copy(glowColorScratch);
    coreLightRef.current?.color.copy(glowColorScratch);
    for (const light of slitLightRefs.current) {
      light?.color.copy(glowColorScratch);
    }
  }, [glow]);

  useEffect(() => {
    return () => {
      lattice.geometry.dispose();
      basaltMaterial.dispose();
      haloTexture.dispose();
    };
  }, [lattice.geometry, basaltMaterial, haloTexture]);

  const triggerBurst = () => {
    const state = phaseRef.current;
    if (state.phase === "hold") {
      state.phase = "burst";
      state.t0 = -1;
    } else if (state.phase === "burst") {
      state.phase = "reform";
      state.t0 = -1;
    } else {
      state.phase = "burst";
      state.t0 = -1;
    }
  };

  const { cubeWindow: CUBE_WINDOW } = R3F_SHATTERED_CUBE_TIMING;
  const coreLightScale = dimCore ? 0.38 : 1;
  const emitterSize = lattice.cell * 0.94;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const mesh = instancesRef.current;
    const spin = spinRef.current;
    if (!mesh || !spin) return;

    const coreLight = coreLightRef.current;
    if (coreLight && !godrayLightsRegisteredRef.current) {
      coreLight.position.set(0, 0, 0);
      registerCubeCoreGodrayLights([coreLight]);
      godrayLightsRegisteredRef.current = true;
    }

    if (scene.environment && basaltMaterial.envMap !== scene.environment) {
      basaltMaterial.envMap = scene.environment;
      basaltMaterial.needsUpdate = true;
    }

    const state = phaseRef.current;
    const timeline = advanceShatteredCubePhase(state, time, autoPlayRef.current);

    const { reveal } = computeInstancePoses(
      lattice,
      timeline,
      defragDepthRef.current,
      time,
      CUBE_WINDOW,
      poseBuffer,
    );

    for (let i = 0; i < lattice.count; i++) {
      posScratch.copy(poseBuffer[i].center);
      scaleScratch.setScalar(lattice.baseCubeSize);
      matrixScratch.compose(posScratch, identQuat, scaleScratch);
      mesh.setMatrixAt(i, matrixScratch);
    }
    mesh.instanceMatrix.needsUpdate = true;

    if (state.lastNotified !== state.phase) {
      state.lastNotified = state.phase;
      onPhaseChange?.(state.phase);
    }

    uniforms.uTime.value = time;

    const lighting = computeCubeCoreLightingFrame(
      lattice,
      poseBuffer,
      timeline,
      reveal,
      time,
      coreLightScale,
    );
    const emitterMat = emitterMatRef.current;
    const haloMat = haloMatRef.current;
    if (emitterMat) {
      emitterMat.emissiveIntensity = lighting.levels.emissiveIntensity;
    }
    if (coreLight) {
      coreLight.position.set(0, 0, 0);
      coreLight.intensity = lighting.levels.corePointIntensity;
    }
    const halo = haloRef.current;
    if (haloMat) {
      haloMat.opacity = lighting.levels.haloOpacity;
    }
    if (halo) {
      halo.scale.setScalar(lighting.levels.haloScale);
    }

    glowColorScratch.set(glowRef.current);
    const slitLights = slitLightRefs.current.filter((l): l is THREE.PointLight => l != null);
    applyIntersticeBeamsToLights(lighting.beams, slitLights, glowColorScratch);

    spin.rotation.y = time * 0.08;
    spin.rotation.x = Math.sin(time * 0.16) * 0.045;
  });

  return (
    <group ref={rootRef} position={worldPosition} name="r3f-shattered-cube">
      <group ref={spinRef}>
        <group quaternion={lattice.orientQuat} scale={size}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[emitterSize, emitterSize, emitterSize]} />
            <meshStandardMaterial
              ref={emitterMatRef}
              color="#ffffff"
              emissive={glow}
              emissiveIntensity={R3F_CUBE_CORE_EMISSION.emissiveHold}
              roughness={0.08}
              metalness={0}
              toneMapped={false}
              fog
            />
          </mesh>
          <instancedMesh
            ref={instancesRef}
            args={[lattice.geometry, basaltMaterial, lattice.count]}
            frustumCulled={false}
            castShadow
            receiveShadow
            onClick={(event) => {
              event.stopPropagation();
              triggerBurst();
            }}
          />
          <pointLight
            ref={coreLightRef}
            position={[0, 0, 0]}
            color={glow}
            intensity={R3F_CUBE_CORE_EMISSION.pointHold * coreLightScale}
            distance={R3F_CUBE_CORE_EMISSION.pointDistance}
            decay={R3F_CUBE_CORE_EMISSION.pointDecay}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.00025}
            shadow-normalBias={0.02}
            shadow-camera-near={0.25}
            shadow-camera-far={48}
            name="r3f-cube-core-point-light"
          />
          {Array.from({ length: SLIT_LIGHT_COUNT }, (_, index) => (
            <pointLight
              key={index}
              ref={(node) => {
                slitLightRefs.current[index] = node;
              }}
              color={glow}
              intensity={0}
              distance={R3F_CUBE_INTERSTICE_BEAMS.lightDistance}
              decay={R3F_CUBE_INTERSTICE_BEAMS.lightDecay}
              castShadow={false}
              name={`r3f-cube-slit-light-${index}`}
            />
          ))}
        </group>
      </group>

      <sprite ref={haloRef} scale={[0.6, 0.6, 1]} position={[0, size * 0.35, 0]}>
        <spriteMaterial
          ref={haloMatRef}
          map={haloTexture}
          color={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0}
          fog
        />
      </sprite>
    </group>
  );
}
