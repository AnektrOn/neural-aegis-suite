import * as THREE from "three";
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const envByRenderer = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/** PMREM of three's RoomEnvironment — the marble shield reads light from this. */
export function useRoomEnvMap(): THREE.Texture {
  const gl = useThree((state) => state.gl);

  return useMemo(() => {
    const cached = envByRenderer.get(gl);
    if (cached) return cached;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileCubemapShader();
    const room = new RoomEnvironment();
    // Lower sigma → sharper specular highlights on marble / clearcoat.
    const texture = pmrem.fromScene(room, 0).texture;
    room.dispose();
    pmrem.dispose();
    envByRenderer.set(gl, texture);
    return texture;
  }, [gl]);
}
