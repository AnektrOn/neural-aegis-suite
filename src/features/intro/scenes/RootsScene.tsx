import { NOISE_GLSL } from "../shaders/noise.glsl";
import { FullscreenShader, type SceneProps } from "./FullscreenShader";

const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
uniform float uHolding;
uniform vec2 uPointer;
uniform vec2 uResolution;
uniform float uFade;
${NOISE_GLSL}

float veins(vec2 p, float scale) {
  float n = fbm(p * scale);
  return pow(1.0 - smoothstep(0.0, 0.035, abs(n - 0.5)), 2.0);
}

void main() {
  vec2 p = aspectUv(vUv, uResolution);
  vec2 ptr = aspectUv(uPointer, uResolution);

  // Soil strata.
  float strata = fbm(vec2(p.x * 1.2, p.y * 7.0 + fbm(p * 2.0) * 1.5));
  vec3 clay = vec3(0.16, 0.09, 0.06);
  vec3 gravel = vec3(0.1, 0.08, 0.07);
  vec3 sand = vec3(0.24, 0.17, 0.11);
  vec3 col = mix(clay, gravel, smoothstep(0.3, 0.55, strata));
  col = mix(col, sand, smoothstep(0.6, 0.8, strata));
  col *= 0.35 + vUv.y * 0.5;
  float grain = hash21(vUv * uResolution + floor(uTime * 12.0)) * 0.04;
  col += grain;

  // Roots grow downward from the surface and toward the pointer.
  float depth = 1.0 - vUv.y;
  float reach = uProgress * 1.15 + uHolding * 0.03;
  float grown = smoothstep(reach, reach - 0.12, depth + fbm(p * 3.0) * 0.15);
  vec2 rp = vec2(p.x * 1.3, p.y * 0.55) + vec2(0.0, uTime * 0.004);
  float r = max(veins(rp, 3.0), veins(rp + 11.0, 5.5) * 0.7);
  float nearPtr = exp(-dot(p - ptr, p - ptr) * 4.0);
  vec3 rootCol = mix(vec3(0.95, 0.62, 0.3), vec3(1.0, 0.88, 0.6), nearPtr);
  float pulse = 0.75 + 0.25 * sin(uTime * 2.0 - depth * 12.0);
  col += rootCol * r * grown * pulse * (0.9 + nearPtr);

  // Surface line and emblem reveal once the network is complete.
  col += vec3(0.9, 0.7, 0.45) * smoothstep(0.006, 0.0, abs(vUv.y - 0.94)) * 0.35;
  float ring = smoothstep(0.012, 0.0, abs(length(p) - 0.2));
  float core = smoothstep(0.09, 0.0, length(p));
  float reveal = smoothstep(0.8, 1.0, uProgress);
  col += vec3(1.0, 0.82, 0.5) * (ring * 1.2 + core * 0.35) * reveal;

  float vignette = smoothstep(1.25, 0.2, length(vUv - 0.5) * 1.6);
  col *= mix(0.5, 1.0, vignette);
  gl_FragColor = vec4(shoulder(col) * uFade, 1.0);
}
`;

export function RootsScene({ hold }: SceneProps) {
  return <FullscreenShader hold={hold} fragmentShader={FRAGMENT} smoothing={2} />;
}
