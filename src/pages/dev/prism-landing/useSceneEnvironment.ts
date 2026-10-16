import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/** Binds PMREM to the scene so physical materials pick up consistent reflections. */
export function useSceneEnvironment(envMap: THREE.Texture | undefined) {
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    if (!envMap) return;
    scene.environment = envMap;
    return () => {
      if (scene.environment === envMap) {
        scene.environment = null;
      }
    };
  }, [scene, envMap]);
}
