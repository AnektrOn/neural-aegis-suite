import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p * vec2(1.0, 1.1));
    float core = exp(-d * d * 5.5);
    float wide = exp(-d * d * 1.7) * 0.32;
    float breathe = 0.93 + 0.07 * sin(uTime * 0.6);
    float shaft = exp(-pow(p.x * 4.4, 2.0)) * smoothstep(1.0, 0.0, abs(p.y)) * 0.2;
    float fade = smoothstep(1.0, 0.55, d);
    vec3 color = uColor * ((core + wide) * breathe + shaft) * fade * uIntensity;
    color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

export type AtmosphereGlowProps = Omit<ThreeElements["mesh"], "ref"> & {
  intensity?: number;
  color?: string;
};

export function AtmosphereGlow({
  intensity = 0.4,
  color = "#8fc4e0",
  ...props
}: AtmosphereGlowProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: new THREE.Color(color) },
    }),
    [intensity, color],
  );

  useFrame((state) => {
    const mat = material.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh {...props}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
