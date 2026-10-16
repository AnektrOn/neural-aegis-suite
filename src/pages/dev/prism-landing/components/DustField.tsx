import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { exocortexZoom } from "../exocortexCamera";

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uViewport;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aSize;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    p.y = fract(p.y + 0.5 + uTime * (0.010 + aSeed * 0.018)) - 0.5;
    p.x += sin(uTime * 0.15 + aSeed * 20.0) * 0.012;
    vec4 mv = modelViewMatrix * vec4(p.x * uViewport.x, p.y * uViewport.y, position.z * 3.0, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio;
    vTwinkle = 0.45 + 0.55 * sin(uTime * (0.4 + aSeed) + aSeed * 40.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor * a * vTwinkle * uOpacity, 1.0);
  }
`;

export type DustFieldProps = Omit<ThreeElements["points"], "ref"> & {
  count?: number;
  opacity?: number;
  color?: string;
};

export function DustField({
  count = 110,
  opacity = 0.5,
  color = "#cfe9f5",
  ...props
}: DustFieldProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const attributes = useMemo(() => {
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      position.set([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], i * 3);
      seed[i] = Math.random();
      size[i] = 1.4 + Math.random() * Math.random() * 4.2;
    }
    return { position, seed, size };
  }, [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uViewport: { value: new THREE.Vector2(10, 10) },
      uPixelRatio: { value: 1 },
      uOpacity: { value: opacity },
      uColor: { value: new THREE.Color(color) },
    }),
    [opacity, color],
  );

  useFrame((state) => {
    const mat = material.current;
    if (!mat) return;
    const zoom = exocortexZoom(state.size.width, state.size.height);
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uViewport.value.set(
      state.size.width / zoom,
      state.size.height / zoom,
    );
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points frustumCulled={false} {...props}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.position, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seed, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.size, 1]} />
      </bufferGeometry>
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
    </points>
  );
}
