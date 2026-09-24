import { useMemo, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LightningStrike } from "three-stdlib";
import type { HoldState } from "../useHoldProgress";

type Props = {
  hold: MutableRefObject<HoldState>;
  /** Written every frame (0..1) so the sky shader can light up the clouds. */
  flash: THREE.IUniform<number>;
  count?: number;
};

type Bolt = {
  strike: LightningStrike;
  mesh: THREE.Mesh;
  nextAt: number;
  endsAt: number;
};

const STRIKE_MS = 0.32;

/** Procedural 3D bolts (three.js `webgl_lightningstrike`) that fade as the storm opens. */
export function Lightning({ hold, flash, count = 2 }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const bolts = useMemo<Bolt[]>(() => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.78, 0.84, 1),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return Array.from({ length: count }, (_, i) => {
      const strike = new LightningStrike({
        sourceOffset: new THREE.Vector3(0, 3, -2),
        destOffset: new THREE.Vector3(0, -2, -2),
        radius0: 0.035,
        radius1: 0.012,
        minRadius: 0.004,
        maxIterations: 7,
        isEternal: true,
        timeScale: 0.9,
        propagationTimeFactor: 0.05,
        vanishingTimeFactor: 0.95,
        subrayPeriod: 2.5,
        subrayDutyCycle: 0.6,
        maxSubrayRecursion: 3,
        ramification: 7,
        recursionProbability: 0.6,
        roughness: 0.85,
        straightness: 0.65,
      });
      const mesh = new THREE.Mesh(strike, material);
      mesh.visible = false;
      mesh.frustumCulled = false;
      return { strike, mesh, nextAt: 1.2 + i * 1.7, endsAt: 0 };
    });
  }, [count]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const s = hold.current;
    const calm = s.progress;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z + 2);
    const halfW = halfH * camera.aspect;
    let intensity = 0;

    for (const bolt of bolts) {
      if (t >= bolt.nextAt && calm < 0.92) {
        const x = s.holding
          ? (s.pointer.x - 0.5) * 2 * halfW + (Math.random() - 0.5) * halfW * 0.6
          : (Math.random() - 0.5) * 1.6 * halfW;
        (bolt.strike as unknown as { rayParameters: { sourceOffset: { set: (...a: number[]) => void }; destOffset: { set: (...a: number[]) => void } } }).rayParameters.sourceOffset.set(x + (Math.random() - 0.5) * 1.5, halfH * 1.2, -2);
        (bolt.strike as unknown as { rayParameters: { sourceOffset: { set: (...a: number[]) => void }; destOffset: { set: (...a: number[]) => void } } }).rayParameters.destOffset.set(x, -halfH * (0.2 + Math.random() * 0.8), -2);
        bolt.endsAt = t + STRIKE_MS;
        bolt.nextAt = t + (1.4 + Math.random() * 3.2) * (1 + calm * 3);
      }
      const active = t < bolt.endsAt;
      bolt.mesh.visible = active;
      if (active) {
        bolt.strike.update(t);
        const life = (bolt.endsAt - t) / STRIKE_MS;
        const flicker = 0.55 + 0.45 * Math.sin(t * 90);
        intensity = Math.max(intensity, life * flicker * (1 - calm));
      }
    }
    (bolts[0].mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + intensity * 0.65;
    flash.value += (intensity - flash.value) * Math.min(1, delta * 30);
  });

  return (
    <group>
      {bolts.map((b, i) => (
        <primitive key={i} object={b.mesh} />
      ))}
    </group>
  );
}
