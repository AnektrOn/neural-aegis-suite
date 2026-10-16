import * as THREE from "three";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { SpotLight } from "@react-three/drei";

/**
 * pmndrs `volumetric-spotlight` MovingSpot — cone follows the pointer.
 * https://github.com/pmndrs/examples/tree/main/examples/volumetric-spotlight
 */
export type VolumetricSpotProps = {
  color: string;
  position: [number, number, number];
  depthBuffer?: THREE.DepthTexture;
};

export function VolumetricSpot({
  depthBuffer,
  ...props
}: VolumetricSpotProps) {
  const light = useRef<THREE.SpotLight>(null!);
  const vec = useRef(new THREE.Vector3());
  const viewport = useThree((state) => state.viewport);

  useFrame((state) => {
    const spot = light.current;
    if (!spot) return;
    spot.target.position.lerp(
      vec.current.set(
        (state.pointer.x * viewport.width) / 2,
        (state.pointer.y * viewport.height) / 2,
        0,
      ),
      0.1,
    );
    spot.target.updateMatrixWorld();
  });

  return (
    <SpotLight
      ref={light}
      castShadow
      penumbra={1}
      distance={12}
      angle={0.35}
      attenuation={5}
      anglePower={4}
      intensity={2 * Math.PI}
      decay={0}
      depthBuffer={depthBuffer}
      {...props}
    />
  );
}
