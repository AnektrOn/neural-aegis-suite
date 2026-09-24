import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { STORY_ICE, STORY_WARM } from "../storyTheme";

export const DRINKING_GOURD_URL = "/models/gltf/drinking-gourd.glb";

type Props = {
  scale?: number;
  position?: [number, number, number];
  rotationSpeed?: number;
  emissiveIntensity?: number;
  /** Soft float / breathe */
  breathe?: boolean;
};

/** Big Dipper / Drinking Gourd constellation GLB. */
export function DrinkingGourdModel({
  scale = 1.8,
  position = [0, 0.2, 0],
  rotationSpeed = 0.08,
  emissiveIntensity = 0.55,
  breathe = true,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(DRINKING_GOURD_URL);

  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) {
          const next = new THREE.MeshStandardMaterial({
            color: STORY_WARM,
            emissive: new THREE.Color(STORY_WARM),
            emissiveIntensity,
            roughness: 0.35,
            metalness: 0.25,
          });
          if (Array.isArray(obj.material)) {
            /* leave */
          } else {
            obj.material = next;
          }
          return;
        }
        const m = mat as THREE.MeshStandardMaterial;
        m.color = new THREE.Color(STORY_WARM);
        m.emissive = new THREE.Color(STORY_ICE);
        m.emissiveIntensity = emissiveIntensity;
        m.roughness = 0.4;
        m.metalness = 0.2;
        m.needsUpdate = true;
      });
    });
    return root;
  }, [scene, emissiveIntensity]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * rotationSpeed;
    if (breathe) {
      const s = scale * (1 + Math.sin(t * 0.9) * 0.035);
      g.scale.setScalar(s);
      g.position.y = position[1] + Math.sin(t * 0.7) * 0.06;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </group>
  );
}

useGLTF.preload(DRINKING_GOURD_URL);
