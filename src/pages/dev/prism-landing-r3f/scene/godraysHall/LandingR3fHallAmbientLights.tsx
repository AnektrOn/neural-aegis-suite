import { useLayoutEffect, useRef } from "react";
import type * as THREE from "three";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "../shatteredCube/r3fShatteredCubeConstants";

function enableHallLightLayers(light: THREE.Light | null) {
  if (!light) return;
  light.layers.enable(0);
  light.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
}

/** Ambiant + hémisphère sur les piliers (layer 0) et le cube fragmenté (layer 1). */
export function LandingR3fHallAmbientLights() {
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);

  useLayoutEffect(() => {
    enableHallLightLayers(hemiRef.current);
    enableHallLightLayers(ambRef.current);
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#c5ccd8", "#1a1410", 0.4]} />
      <ambientLight ref={ambRef} intensity={0.06} />
    </>
  );
}
