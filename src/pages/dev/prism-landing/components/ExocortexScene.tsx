import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box } from "./Box";
import { Prism } from "./Prism";
import { AtmosphereGlow } from "./AtmosphereGlow";
import { DustField } from "./DustField";
import { ShieldOrb } from "../orb/ShieldOrb";
import { AegisWord, type AegisReveal } from "./AegisWord";
import { LandingStageRig } from "./LandingStageRig";
import type { LandingStageLayout } from "../landingStageLayout";
import { exocortexCameraY, exocortexZoom } from "../exocortexCamera";
import { useSceneEnvMap } from "../useSceneEnvMap";
import { readPrismStagePalette } from "../prismLandingTheme";
import { PrismStageLighting } from "./PrismStageLighting";
import type { PrismMaterialConfig } from "../prismMaterialConfig";

const IDLE_AFTER = 3;
const HIT_RADIUS = 0.42;

export function ExocortexCamera() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useFrame(() => {
    const cam = camera as THREE.OrthographicCamera;
    const zoom = exocortexZoom(size.width, size.height);
    const y = exocortexCameraY(size.width);
    if (cam.zoom === zoom && cam.position.y === y) return;
    cam.zoom = zoom;
    cam.position.set(0, y, 100);
    cam.updateProjectionMatrix();
  });

  return null;
}

export function ExocortexScene({
  materialConfig,
  stageLayout,
}: {
  materialConfig: PrismMaterialConfig;
  stageLayout: LandingStageLayout;
}) {
  const envMap = useSceneEnvMap();
  const palette = useMemo(() => readPrismStagePalette(), []);
  const size = useThree((state) => state.size);
  const reveal = useMemo<AegisReveal>(
    () => ({
      uLit: { value: 0 },
      uHit: new THREE.Vector3(0, 2, 0),
    }),
    [],
  );
  const smoothed = useRef(new THREE.Vector2(0.5, 0.3));
  const aim = useRef(new THREE.Vector2());
  const lastPointer = useRef(new THREE.Vector2());
  const lastMoveAt = useRef(-10);
  const hitPoint = useRef(new THREE.Vector3(0, 2, 0));

  const zoom = exocortexZoom(size.width, size.height);
  const worldW = size.width / zoom;
  const worldH = size.height / zoom;
  const camY = exocortexCameraY(size.width);

  useFrame((state, delta) => {
    const pointer = state.pointer;
    if (
      pointer.x !== lastPointer.current.x ||
      pointer.y !== lastPointer.current.y
    ) {
      lastPointer.current.set(pointer.x, pointer.y);
      lastMoveAt.current = state.clock.elapsedTime;
    }

    const idle = state.clock.elapsedTime - lastMoveAt.current > IDLE_AFTER;
    if (idle) {
      const angle = state.clock.elapsedTime * 0.22 + 0.6;
      const radius = 0.52 + 0.1 * Math.sin(state.clock.elapsedTime * 0.5);
      aim.current.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75);
    } else {
      aim.current.set(pointer.x, pointer.y);
    }

    const follow = 1 - Math.exp(-delta * (idle ? 1.2 : 10));
    smoothed.current.lerp(aim.current, follow);

    const frameZoom = exocortexZoom(state.size.width, state.size.height);
    const wx =
      (smoothed.current.x * state.size.width) / frameZoom / 2 +
      state.camera.position.x;
    const wy =
      (smoothed.current.y * state.size.height) / frameZoom / 2 +
      state.camera.position.y;
    hitPoint.current.set(wx, wy, 0);

    const nearShield = smoothed.current.length() < HIT_RADIUS;
    const lit = 1 - Math.exp(-delta * 1.1);
    reveal.uLit.value += (Number(nearShield) - reveal.uLit.value) * lit;
    reveal.uHit.lerp(hitPoint.current, 1 - Math.exp(-delta * 5));
  });

  return (
    <>
      <PrismStageLighting variant="hero" />
      <AtmosphereGlow
        position={[0, 0, -3]}
        scale={[22, 22, 1]}
        intensity={0.1}
        color={palette.glow}
      />
      <DustField position={[0, camY, 0.2]} color={palette.glow} opacity={0.22} />
      <LandingStageRig
        layout={stageLayout}
        slots={{
          ring: <ShieldOrb />,
          shield: (
            <Prism
              uniformScale={1}
              envMap={envMap}
              materialConfig={materialConfig}
            />
          ),
          aegis: <AegisWord reveal={reveal} />,
        }}
      />
      <Box position={[-0.34 * worldW, camY + 0.2 * worldH, 0]} rotation={[0, 0, Math.PI / 4]} />
      <Box position={[0.34 * worldW, camY + 0.02 * worldH, 0]} rotation={[0, 0, Math.PI / 3.5]} />
      <Box position={[-0.3 * worldW, camY - 0.12 * worldH, 0]} rotation={[0, 0, Math.PI / 4]} />
    </>
  );
}
