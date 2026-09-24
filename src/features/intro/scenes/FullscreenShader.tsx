import { useMemo, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FULLSCREEN_VERTEX } from "../shaders/noise.glsl";
import type { HoldState } from "../useHoldProgress";

export type SceneProps = {
  hold: MutableRefObject<HoldState>;
};

type Props = SceneProps & {
  fragmentShader: string;
  /** How fast the eased progress catches up with the raw progress. */
  smoothing?: number;
  /** Scene-specific uniforms, must be a stable object. */
  extraUniforms?: Record<string, THREE.IUniform>;
};

/**
 * Full-screen quad driven by shared uniforms: time, eased hold progress,
 * smoothed pointer, resolution and a mount fade (shader cross-fade in).
 */
export function FullscreenShader({ hold, fragmentShader, smoothing = 3, extraUniforms }: Props) {
  const size = useThree((s) => s.size);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FULLSCREEN_VERTEX,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uHolding: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uFade: { value: 0 },
          ...extraUniforms,
        },
      }),
    [fragmentShader, extraUniforms],
  );

  useFrame((_, delta) => {
    const u = material.uniforms;
    const s = hold.current;
    const k = 1 - Math.exp(-delta * smoothing);
    u.uTime.value += delta;
    u.uProgress.value += (s.progress - u.uProgress.value) * k;
    u.uHolding.value += ((s.holding ? 1 : 0) - u.uHolding.value) * k * 2;
    u.uPointer.value.x += (s.pointer.x - u.uPointer.value.x) * k;
    u.uPointer.value.y += (s.pointer.y - u.uPointer.value.y) * k;
    u.uResolution.value.set(size.width, size.height);
    u.uFade.value = Math.min(1, u.uFade.value + delta / 1.4);
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
