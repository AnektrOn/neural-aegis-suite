import { useLayoutEffect, useRef } from "react";
import type * as THREE from "three";
import { useR3fSceneConfig } from "../../config/r3fSceneConfigContext";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "../shatteredCube/r3fShatteredCubeConstants";
import { R3F_HALL_SUN_DEFAULTS } from "./r3fHallSunConstants";

function enableSunLayers(light: THREE.DirectionalLight | null) {
  if (!light) return;
  light.layers.enable(0);
  light.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
}

export function LandingR3fHallSunLight() {
  const { config } = useR3fSceneConfig();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useLayoutEffect(() => {
    enableSunLayers(lightRef.current);
  });

  if (config.hallSunIntensity <= 0) return null;

  const [x, y, z] = R3F_HALL_SUN_DEFAULTS.position;

  return (
    <directionalLight
      ref={lightRef}
      name="r3f-hall-sun"
      position={[x, y, z]}
      color={R3F_HALL_SUN_DEFAULTS.color}
      intensity={config.hallSunIntensity}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.00015}
      shadow-camera-far={140}
      shadow-camera-left={-55}
      shadow-camera-right={55}
      shadow-camera-top={55}
      shadow-camera-bottom={-55}
    />
  );
}
