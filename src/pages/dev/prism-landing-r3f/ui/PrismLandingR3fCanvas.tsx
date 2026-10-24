import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { R3F_GODRAYS_HALL_CAMERA } from "../scene/godraysHall/r3fGodraysHallConstants";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "../scene/shatteredCube/r3fShatteredCubeConstants";
import { LandingR3fSceneContent } from "../scene/LandingR3fSceneContent";

export default function PrismLandingR3fCanvas() {
  return (
    <Canvas
      shadows
      frameloop="always"
      dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
      }}
      onCreated={({ gl, camera }) => {
        camera.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
        gl.setClearColor(0x07090d, 1);
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.shadowMap.autoUpdate = true;
        gl.toneMapping = THREE.NoToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      camera={{
        fov: R3F_GODRAYS_HALL_CAMERA.fov,
        near: R3F_GODRAYS_HALL_CAMERA.near,
        far: R3F_GODRAYS_HALL_CAMERA.far,
        position: R3F_GODRAYS_HALL_CAMERA.position,
      }}
    >
      <Suspense fallback={null}>
        <LandingR3fSceneContent />
      </Suspense>
    </Canvas>
  );
}
