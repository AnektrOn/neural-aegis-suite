import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";

function circlePositions(radius: number, count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, 0], i * 3);
  }
  return positions;
}

function tickPositions(radius: number, count: number, every: number): Float32Array {
  const positions = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const length = i % every === 0 ? 0.22 : 0.09;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    positions.set(
      [c * radius, s * radius, 0, c * (radius + length), s * (radius + length), 0],
      i * 6,
    );
  }
  return positions;
}

export type OrbitDialProps = Omit<ThreeElements["group"], "ref"> & {
  radius?: number;
  color?: string;
};

export function OrbitDial({
  radius = 2.45,
  color = "#c9a66b",
  ...props
}: OrbitDialProps) {
  const ticks = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.Mesh>(null);
  const lines = useMemo(
    () => ({
      inner: circlePositions(radius - 0.34, 256),
      outer: circlePositions(radius, 256),
      scale: tickPositions(radius, 120, 10),
    }),
    [radius],
  );

  useFrame((_, delta) => {
    const group = ticks.current;
    if (group) group.rotation.z -= delta * 0.018;
    const arc = sweep.current;
    if (arc) arc.rotation.z -= delta * 0.42;
  });

  const line = {
    color,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  } as const;

  return (
    <group {...props}>
      <mesh>
        <ringGeometry args={[radius - 0.045, radius, 160]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[radius - 0.38, radius - 0.335, 160]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines.inner, 3]} />
        </bufferGeometry>
        <lineBasicMaterial {...line} opacity={0.7} />
      </lineLoop>
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines.outer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial {...line} opacity={0.95} />
      </lineLoop>
      <group ref={ticks}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[lines.scale, 3]} />
          </bufferGeometry>
          <lineBasicMaterial {...line} opacity={0.8} />
        </lineSegments>
      </group>
      <mesh ref={sweep}>
        <ringGeometry args={[radius - 0.38, radius, 72, 1, 0, Math.PI * 0.42]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
