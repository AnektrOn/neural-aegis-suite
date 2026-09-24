import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_GROUND, STORY_PRIMARY, STORY_WARM } from "../storyTheme";

type Props = {
  onComplete: () => void;
};

type Stroke = {
  id: number;
  points: THREE.Vector3[];
  color: string;
};

/** Draw luminous strokes on a ground plane in perspective. */
export function TraceScene({ onComplete }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef(false);
  const currentId = useRef(0);
  const strokeCount = useRef(0);
  const doneRef = useRef(false);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 4.2, 8.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    currentId.current += 1;
    const color = strokeCount.current % 2 === 0 ? STORY_WARM : STORY_PRIMARY;
    const p = e.point.clone();
    p.y = 0.04;
    setStrokes((prev) => [...prev, { id: currentId.current, points: [p], color }]);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drawing.current) return;
    e.stopPropagation();
    const p = e.point.clone();
    p.y = 0.04;
    setStrokes((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.id !== currentId.current) return prev;
      const prevPt = last.points[last.points.length - 1];
      if (prevPt.distanceTo(p) < 0.06) return prev;
      next[next.length - 1] = { ...last, points: [...last.points, p] };
      return next;
    });
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    strokeCount.current += 1;
    if (!doneRef.current && strokeCount.current >= 2) {
      doneRef.current = true;
      onComplete();
    }
  };

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 2]} intensity={0.65} color={STORY_WARM} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <planeGeometry args={[28, 18]} />
        <meshStandardMaterial color={STORY_GROUND} roughness={0.92} metalness={0.05} />
      </mesh>

      {/* horizon ridge */}
      <mesh position={[0, 0.02, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 0.06]} />
        <meshBasicMaterial color="#2a323c" transparent opacity={0.7} />
      </mesh>

      {strokes.map((s) => (
        <StrokeLine key={s.id} points={s.points} color={s.color} />
      ))}
    </>
  );
}

function StrokeLine({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const line = useMemo(() => {
    const pts =
      points.length >= 2
        ? points
        : [...points, points[0]?.clone().add(new THREE.Vector3(0.01, 0, 0)) ?? new THREE.Vector3()];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 });
    return new THREE.Line(geo, mat);
  }, [points, color]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  return <primitive object={line} />;
}

/** Keep camera gently alive */
export function TraceCameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(t * 0.12) * 0.35;
    state.camera.lookAt(0, 0.2, 0);
  });
  return null;
}
