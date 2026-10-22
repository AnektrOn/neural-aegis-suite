import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeMarbleSideMaterial, ensureRectAreaLightSupport } from "../scene/marbleMonolithAssets";

/**
 * Monolithe en marbre noir veiné d'or, avec face inférieure lumineuse.
 * Textures procédurales (voir marbleMonolithAssets).
 */
type Props = {
  size?: [number, number, number];
  position?: [number, number, number];
  seed?: number;
  float?: boolean;
  glow?: string;
  glowIntensity?: number;
};

export function MarbleMonolith({
  size = [1.6, 6.4, 0.6],
  position = [0, 4, 0],
  seed = 11,
  float = true,
  glow = "#ffb04a",
  glowIntensity = 40,
}: Props) {
  const [w, h, d] = size;
  const group = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    ensureRectAreaLightSupport();
    const front = makeMarbleSideMaterial(seed, 512, 2048);
    const back = makeMarbleSideMaterial(seed + 1, 512, 2048);
    const left = makeMarbleSideMaterial(seed + 2, 256, 2048);
    const right = makeMarbleSideMaterial(seed + 3, 256, 2048);
    const top = new THREE.MeshPhysicalMaterial({
      color: "#0b0b0e",
      roughness: 0.35,
      metalness: 0.2,
      clearcoat: 0.6,
    });
    const bottom = new THREE.MeshStandardMaterial({
      color: "#1a1006",
      emissive: new THREE.Color(glow),
      emissiveIntensity: 3.5,
      roughness: 0.6,
    });
    return [right, left, top, bottom, front, back];
  }, [seed, glow]);

  useFrame(({ clock }) => {
    if (!float || !group.current) return;
    const t = clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 0.5) * 0.08;
    group.current.rotation.y = Math.sin(t * 0.15) * 0.04;
  });

  return (
    <group ref={group} position={position}>
      <mesh material={materials} castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <pointLight
        position={[0, -h / 2 - 0.25, 0]}
        color={glow}
        intensity={glowIntensity}
        distance={14}
        decay={2}
      />
      <rectAreaLight
        position={[0, -h / 2 - 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={w * 0.9}
        height={d * 0.9}
        color={glow}
        intensity={14}
      />
    </group>
  );
}

export default MarbleMonolith;
