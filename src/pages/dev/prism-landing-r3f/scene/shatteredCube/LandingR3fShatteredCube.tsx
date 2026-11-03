import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  useRegisterCubeCoreGodrayLights,
  useSetCubeCoreLightingRuntime,
} from "../../config/R3fCubeCoreLightContext";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  R3F_CUBE_CORE_EMISSION,
  R3F_SHATTERED_CUBE_DEFAULT_SIZE,
  R3F_SHATTERED_CUBE_LIGHT_LAYER,
  R3F_SHATTERED_CUBE_TIMING,
  r3fShatteredCubePortalFrontPosition,
} from "./r3fShatteredCubeConstants";
import { createR3fShatteredCubeBasaltMaterial } from "./r3fShatteredCubeBasaltMaterial";
import {
  advanceShatteredCubePhase,
  computeCubeCoreLightingFrame,
  computeInstancePoses,
  type ShatteredCubeInstancePose,
  type ShatteredCubePhase,
  type ShatteredCubePhaseState,
} from "./r3fCubeCoreLighting";
import {
  useLandingSubjectVisible,
  useOptionalPrismR3fLandingDirector,
} from "../../config/PrismR3fLandingDirectorContext";
import { buildR3fShatteredCubeLattice } from "./r3fShatteredCubeLattice";

export type LandingR3fShatteredCubeProps = {
  size?: number;
  grid?: number;
  seed?: number;
  position?: [number, number, number];
  autoPlay?: boolean;
  enableClickBurst?: boolean;
  glow?: string;
  defragDepth?: number;
  /** @deprecated ignoré : le cube suit scene.environmentIntensity. */
  envMapIntensity?: number;
  dimCore?: boolean;
  onPhaseChange?: (phase: ShatteredCubePhase) => void;
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

export function LandingR3fShatteredCube({
  size = R3F_SHATTERED_CUBE_DEFAULT_SIZE,
  grid = 10,
  seed = 5,
  position,
  autoPlay = true,
  enableClickBurst = true,
  glow = "#e2f1ff",
  defragDepth = 0.6,
  dimCore = false,
  onPhaseChange,
}: LandingR3fShatteredCubeProps) {
  const landingDirector = useOptionalPrismR3fLandingDirector();
  const cubeVisible = useLandingSubjectVisible("cube");
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

  const rootRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const instancesRef = useRef<THREE.InstancedMesh>(null);
  const emitterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMatRef = useRef<THREE.SpriteMaterial>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const registerCubeCoreGodrayLights = useRegisterCubeCoreGodrayLights();
  const setCubeCoreLightingRuntime = useSetCubeCoreLightingRuntime();
  const godrayLightsRegisteredRef = useRef(false);
  /** Landing hero : avance le burst pour que cyan / fissures soient lisibles dès la fin du loader. */
  const landingBurstLeadRef = useRef(0);

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
    () => createR3fShatteredCubeBasaltMaterial(uniforms),
    [uniforms],
  );

  const haloTexture = useMemo(() => createHaloTexture(), []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Light) {
          obj.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
          return;
        }
        obj.layers.set(R3F_SHATTERED_CUBE_LIGHT_LAYER);
      });
    }
    const coreLight = coreLightRef.current;
    if (coreLight) {
      coreLight.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
      coreLight.shadow.camera.near = R3F_CUBE_CORE_EMISSION.shadowCameraNear;
      coreLight.shadow.camera.far = R3F_CUBE_CORE_EMISSION.shadowCameraFar;
      coreLight.shadow.camera.updateProjectionMatrix();
    }
  });

  useEffect(() => {
    return () => {
      godrayLightsRegisteredRef.current = false;
      registerCubeCoreGodrayLights([]);
      setCubeCoreLightingRuntime({ phase: "hold", escapeGain: 0, godrayReveal: 0 });
    };
  }, [registerCubeCoreGodrayLights, setCubeCoreLightingRuntime]);

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
  }, [glow]);

  useEffect(() => {
    return () => {
      lattice.geometry.dispose();
      basaltMaterial.dispose();
      haloTexture.dispose();
    };
  }, [lattice.geometry, basaltMaterial, haloTexture]);

  const requestBurst = useCallback(() => {
    const state = phaseRef.current;
    if (state.phase === "hold") {
      state.phase = "burst";
      state.t0 = -1;
      if (landingDirector) landingBurstLeadRef.current = 7;
    }
  }, [landingDirector]);

  const resetToHold = useCallback(() => {
    const state = phaseRef.current;
    state.phase = "hold";
    state.t0 = -1;
  }, []);

  const triggerBurstToggle = useCallback(() => {
    const state = phaseRef.current;
    if (state.phase === "hold") {
      requestBurst();
    } else {
      resetToHold();
    }
  }, [requestBurst, resetToHold]);

  useEffect(() => {
    if (!landingDirector) return;
    landingDirector.registerCubeDirector({
      requestBurst,
      resetToHold,
    });
    return () => landingDirector.registerCubeDirector(null);
  }, [landingDirector, requestBurst, resetToHold]);

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
      coreLight.position.set(worldPosition[0], worldPosition[1], worldPosition[2]);
      registerCubeCoreGodrayLights([coreLight]);
      godrayLightsRegisteredRef.current = true;
    }

    const state = phaseRef.current;
    const burstLead = landingBurstLeadRef.current;
    if (burstLead > 0 && state.phase === "burst" && state.t0 < 0) {
      state.t0 = time - burstLead;
      landingBurstLeadRef.current = 0;
    }
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
      state.phase,
      timeline,
      reveal,
      time,
      coreLightScale,
    );

    setCubeCoreLightingRuntime({
      phase: lighting.phase,
      escapeGain: lighting.levels.escapeGain,
      godrayReveal: lighting.levels.godrayReveal,
    });

    const emitterMat = emitterMatRef.current;
    const haloMat = haloMatRef.current;
    if (emitterMat) {
      emitterMat.emissiveIntensity = lighting.levels.emissiveIntensity;
    }
    if (coreLight) {
      coreLight.position.set(worldPosition[0], worldPosition[1], worldPosition[2]);
      coreLight.intensity = lighting.levels.corePointIntensity;
    }
    const halo = haloRef.current;
    if (haloMat) {
      haloMat.opacity = lighting.levels.haloOpacity;
    }
    if (halo) {
      halo.scale.setScalar(lighting.levels.haloScale);
    }

    spin.rotation.y = time * 0.08;
    spin.rotation.x = Math.sin(time * 0.16) * 0.045;
  });

  return (
    <group visible={cubeVisible} name="r3f-shattered-cube-visibility">
      {/* PointLight noyau en espace monde : three-good-godrays lit light.position pour les 6 plans de volume */}
      <pointLight
        ref={coreLightRef}
        position={worldPosition}
        color={glow}
        intensity={R3F_CUBE_CORE_EMISSION.pointHold * coreLightScale}
        distance={R3F_CUBE_CORE_EMISSION.pointDistance}
        decay={R3F_CUBE_CORE_EMISSION.pointDecay}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
        shadow-camera-near={R3F_CUBE_CORE_EMISSION.shadowCameraNear}
        shadow-camera-far={R3F_CUBE_CORE_EMISSION.shadowCameraFar}
        name="r3f-cube-core-point-light"
      />
      <group ref={rootRef} position={worldPosition} name="r3f-shattered-cube">
        <group ref={spinRef}>
          <group quaternion={lattice.orientQuat} scale={size}>
            {/* Le noyau enveloppe la PointLight : pas d'ombre (occulte la source godrays). */}
            <mesh>
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
                if (!enableClickBurst) return;
                event.stopPropagation();
                triggerBurstToggle();
              }}
            />
            <sprite ref={haloRef} scale={[0.6, 0.6, 1]} position={[0, 0, 0]}>
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
        </group>
      </group>
    </group>
  );
}
