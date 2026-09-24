import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import type { SceneProps } from "./FullscreenShader";

const VERTEX = /* glsl */ `
attribute vec3 aTarget;
attribute float aSeed;
uniform float uTime;
uniform float uProgress;
uniform vec2 uPointer;
uniform float uPixelRatio;
uniform float uBurst;
uniform float uHolding;
varying float vGlow;

// Cheap divergence-free-looking swirl (sum of rotated sine fields).
vec3 swirl(vec3 p, float t) {
  return vec3(
    sin(p.y * 0.9 + t) + sin(p.z * 1.3 - t * 0.7),
    sin(p.z * 0.8 + t * 1.1) + sin(p.x * 1.2 + t * 0.5),
    sin(p.x * 1.1 - t * 0.9) + sin(p.y * 0.7 + t * 0.6)
  );
}

void main() {
  float e = uProgress * uProgress * (3.0 - 2.0 * uProgress);
  float delay = aSeed * 0.35;
  float k = clamp((e - delay) / (1.0 - delay + 1e-4), 0.0, 1.0);
  vec3 drift = swirl(position * 0.6 + aSeed * 6.0, uTime * 0.35) * (0.35 + uHolding * 0.25) * (1.0 - k);
  // Spiral inward while gathering.
  float spin = (1.0 - k) * uHolding * 1.2;
  vec3 scattered = position + drift;
  scattered.xz = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * scattered.xz * (1.0 - uHolding * 0.15 * (1.0 - k));
  vec3 target = aTarget * (1.0 + uBurst * (0.35 + aSeed * 0.6)) + swirl(aTarget * 3.0, uTime) * 0.015;
  vec3 pos = mix(scattered, target, k);
  float angle = uTime * 0.12 + (uPointer.x - 0.5) * 0.8;
  float c = cos(angle), s = sin(angle);
  pos.xz = mat2(c, -s, s, c) * pos.xz;
  pos.y += (uPointer.y - 0.5) * 0.4 * (1.0 - k);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 90.0);
  gl_PointSize = (1.4 + k * 1.6) * twinkle * uPixelRatio * (8.0 / -mv.z);
  vGlow = 0.35 + k * 0.65 + uBurst * 0.8;
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform float uFade;
varying float vGlow;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(vec3(0.85, 0.52, 0.22), vec3(1.0, 0.82, 0.55), vGlow);
  gl_FragColor = vec4(col * a * min(vGlow, 1.2) * 0.5 * uFade, a);
}
`;

function buildGeometry(count: number) {
  const scatter = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    scatter.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.6, r * Math.sin(phi) * Math.sin(theta)], i * 3);

    // 70% form a sun (fibonacci sphere), 30% a thin halo ring.
    if (i % 10 < 7) {
      const y = 1 - (i / (count - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const a = golden * i;
      const R = 1.1 + (Math.random() - 0.5) * 0.06;
      target.set([Math.cos(a) * rad * R, y * R, Math.sin(a) * rad * R], i * 3);
    } else {
      const a = Math.random() * Math.PI * 2;
      const R = 1.9 + (Math.random() - 0.5) * 0.12;
      target.set([Math.cos(a) * R, (Math.random() - 0.5) * 0.04, Math.sin(a) * R], i * 3);
    }
    seeds[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(scatter, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

export function LightScene({ hold, particleCount }: SceneProps & { particleCount: number }) {
  const geometry = useMemo(() => buildGeometry(particleCount), [particleCount]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
          uFade: { value: 0 },
          uBurst: { value: 0 },
          uHolding: { value: 0 },
        },
      }),
    [],
  );
  const burstAt = useRef<number | null>(null);

  useFrame((_, delta) => {
    const u = material.uniforms;
    const s = hold.current;
    const k = 1 - Math.exp(-delta * 2.2);
    u.uTime.value += delta;
    u.uHolding.value += ((s.holding ? 1 : 0) - u.uHolding.value) * k;
    if (s.progress >= 1 && burstAt.current === null) burstAt.current = u.uTime.value;
    if (s.progress < 0.5) burstAt.current = null;
    const since = burstAt.current === null ? Infinity : u.uTime.value - burstAt.current;
    u.uBurst.value = Number.isFinite(since) ? Math.sin(Math.min(1, since / 1.6) * Math.PI) * Math.exp(-since * 0.8) : 0;
    u.uProgress.value += (s.progress - u.uProgress.value) * k;
    u.uPointer.value.x += (s.pointer.x - u.uPointer.value.x) * k;
    u.uPointer.value.y += (s.pointer.y - u.uPointer.value.y) * k;
    u.uFade.value = Math.min(1, u.uFade.value + delta / 1.4);
  });

  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <Stars radius={40} depth={30} count={1500} factor={2.2} saturation={0} fade speed={0.4} />
      <points geometry={geometry} material={material} frustumCulled={false} />
    </>
  );
}
