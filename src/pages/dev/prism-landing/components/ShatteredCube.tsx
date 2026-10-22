import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createShatteredCubeGroup } from "../scene/shatteredCubeAssets";

type CubeProps = {
  size?: number;
  grid?: number;
  seed?: number;
  position?: [number, number, number];
  autoPlay?: boolean;
  glow?: string;
  defragDepth?: number;
  /** Si omis, les matériaux utilisent scene.environment. */
  envMap?: THREE.Texture | null;
  studioLights?: boolean;
};

/** Wrapper R3F autour de `createShatteredCubeGroup` (landing / tests légers). */
export function ShatteredCube({
  size = 2.25,
  grid = 10,
  seed = 5,
  position = [0, 0.15, 0],
  autoPlay = true,
  glow = "#e2f1ff",
  defragDepth = 0.6,
  envMap = null,
  studioLights = false,
}: CubeProps) {
  const parent = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const pick = useMemo(
    () => ({
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
    }),
    [],
  );

  const instance = useMemo(
    () =>
      createShatteredCubeGroup({
        size,
        grid,
        seed,
        position: new THREE.Vector3(...position),
        autoPlay,
        glow,
        defragDepth,
        envMap,
        studioLights,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, grid, seed, glow, envMap, studioLights, position[0], position[1], position[2]],
  );

  useEffect(() => {
    instance.setAutoPlay(autoPlay);
  }, [autoPlay, instance]);

  useEffect(() => {
    instance.setDefragDepth(defragDepth);
  }, [defragDepth, instance]);

  useEffect(() => {
    const root = parent.current;
    if (!root) return;
    root.add(instance.group);
    return () => {
      root.remove(instance.group);
      instance.dispose();
    };
  }, [instance]);

  useFrame(({ clock }) => {
    instance.update(clock.elapsedTime);
  });

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pick.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pick.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pick.raycaster.setFromCamera(pick.pointer, camera);
      const hits = pick.raycaster.intersectObjects(instance.meshes, false);
      if (hits.length > 0) instance.triggerBurst();
    };
    gl.domElement.addEventListener("pointerdown", onPointerDown);
    return () => gl.domElement.removeEventListener("pointerdown", onPointerDown);
  }, [camera, gl, instance, pick]);

  return <group ref={parent} />;
}

export default ShatteredCube;
