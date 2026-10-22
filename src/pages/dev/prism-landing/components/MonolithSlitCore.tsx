import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
varying vec2 vUv;
void main() {
  float y = vUv.y;
  vec3 hot = vec3(1.35, 1.05, 0.72);
  vec3 mid = vec3(0.82, 0.52, 0.32);
  vec3 cool = vec3(0.08, 0.14, 0.18);
  vec3 col = mix(hot, mid, smoothstep(0.0, 0.28, y));
  col = mix(col, cool, smoothstep(0.28, 1.0, y));
  float x = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  float glow = x * (1.35 - y * 0.55);
  gl_FragColor = vec4(col * glow, 1.0);
}
`;

type Props = {
  width: number;
  height: number;
};

export function MonolithSlitCore({ width, height }: Props) {
  return (
    <mesh position={[0, height * 0.5, 0.02]}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
