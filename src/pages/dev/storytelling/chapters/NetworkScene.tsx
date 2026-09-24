import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_ICE, STORY_PRIMARY, STORY_WARM } from "../storyTheme";

type Props = {
  mapMode?: boolean;
  onComplete: () => void;
};

type Node = {
  id: number;
  position: THREE.Vector3;
  self: boolean;
};

function buildNodes(mapMode: boolean): Node[] {
  const count = mapMode ? 14 : 11;
  const nodes: Node[] = [{ id: 0, position: new THREE.Vector3(0, 0.2, 0), self: true }];
  for (let i = 1; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (i % 3) * 0.18;
    const r = mapMode ? 2.4 + (i % 4) * 0.5 : 1.7 + (i % 3) * 0.4;
    nodes.push({
      id: i,
      position: new THREE.Vector3(Math.cos(a) * r, (i % 4) * 0.15, Math.sin(a) * r * 0.85),
      self: false,
    });
  }
  return nodes;
}

function buildPairs(count: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 1; i < count; i++) pairs.push([0, i]);
  for (let i = 1; i < count - 1; i++) {
    if (i % 2 === 0) pairs.push([i, i + 1]);
  }
  return pairs;
}

export function NetworkScene({ mapMode = false, onComplete }: Props) {
  const nodes = useMemo(() => buildNodes(mapMode), [mapMode]);
  const pairs = useMemo(() => buildPairs(nodes.length), [nodes.length]);
  const revealed = useRef(new Set<number>(mapMode ? nodes.map((n) => n.id) : [0]));
  const revealedCount = useRef(mapMode ? nodes.length : 1);
  const doneRef = useRef(false);
  const group = useRef<THREE.Group>(null);
  const pan = useRef(new THREE.Vector2(0, 0));
  const dragging = useRef(false);
  const lastPointer = useRef(new THREE.Vector2());
  const { camera, gl } = useThree();
  const nodeMats = useRef<THREE.MeshBasicMaterial[]>([]);

  useEffect(() => {
    if (mapMode) {
      camera.position.set(0, 9.5, 10);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 2.2, 8.5);
      camera.lookAt(0, 0.2, 0);
    }
  }, [camera, mapMode]);

  const edgePositions = useMemo(() => {
    const arr = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], i) => {
      const A = nodes[a].position;
      const B = nodes[b].position;
      const o = i * 6;
      arr[o] = A.x;
      arr[o + 1] = A.y;
      arr[o + 2] = A.z;
      arr[o + 3] = B.x;
      arr[o + 4] = B.y;
      arr[o + 5] = B.z;
    });
    return arr;
  }, [nodes, pairs]);

  const edgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(edgePositions, 3));
    return g;
  }, [edgePositions]);

  const edges = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: STORY_PRIMARY,
      transparent: true,
      opacity: mapMode ? 0.4 : 0.18,
    });
    return new THREE.LineSegments(edgeGeo, mat);
  }, [edgeGeo, mapMode]);

  useEffect(
    () => () => {
      edgeGeo.dispose();
      (edges.material as THREE.Material).dispose();
    },
    [edgeGeo, edges],
  );

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (!mapMode) return;
      dragging.current = true;
      lastPointer.current.set(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (!mapMode || !dragging.current) return;
      const dx = (e.clientX - lastPointer.current.x) * 0.01;
      const dy = (e.clientY - lastPointer.current.y) * 0.01;
      lastPointer.current.set(e.clientX, e.clientY);
      pan.current.x = THREE.MathUtils.clamp(pan.current.x + dx, -2.8, 2.8);
      pan.current.y = THREE.MathUtils.clamp(pan.current.y - dy, -2, 2);
    };
    const onUp = () => {
      dragging.current = false;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
    };
  }, [gl, mapMode]);

  useFrame((state) => {
    if (group.current) {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pan.current.x, 0.12);
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, pan.current.y, 0.12);
    }

    if (!mapMode) {
      // Reveal nodes near pointer (projected)
      const tmp = new THREE.Vector3();
      for (const node of nodes) {
        if (revealed.current.has(node.id)) continue;
        tmp.copy(node.position).project(state.camera);
        const d = Math.hypot(tmp.x - state.pointer.x, tmp.y - state.pointer.y);
        if (d < 0.16) {
          revealed.current.add(node.id);
          revealedCount.current += 1;
          const mat = nodeMats.current[node.id];
          if (mat) mat.opacity = 0.95;
        }
      }
      if (!doneRef.current && revealedCount.current >= 4) {
        doneRef.current = true;
        onComplete();
      }
    } else if (!doneRef.current && (Math.hypot(pan.current.x, pan.current.y) > 0.4 || state.clock.elapsedTime > 10)) {
      doneRef.current = true;
      onComplete();
    }

    // breathe
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const s = (i === 0 ? 1.4 : 1) * (1 + Math.sin(t * 1.5 + i) * 0.04);
        child.scale.setScalar(s);
      }
    });
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 4, 2]} intensity={1.1} color={STORY_WARM} distance={18} />

      {nodes.map((node) => {
        const visible = mapMode || revealed.current.has(node.id) || node.self;
        return (
          <mesh key={node.id} position={node.position}>
            <sphereGeometry args={[node.self ? 0.16 : 0.1, 16, 12]} />
            <meshBasicMaterial
              ref={(m) => {
                if (m) nodeMats.current[node.id] = m;
              }}
              color={node.self ? STORY_WARM : STORY_ICE}
              transparent
              opacity={visible ? 0.95 : 0.18}
            />
          </mesh>
        );
      })}

      <primitive object={edges} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[6.5, 48]} />
        <meshBasicMaterial color="#0c1016" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
