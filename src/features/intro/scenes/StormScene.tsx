import { useMemo } from "react";
import { NOISE_GLSL } from "../shaders/noise.glsl";
import { Lightning } from "./Lightning";
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
uniform float uFlash;
${NOISE_GLSL}

// Wind-driven rain streaks.
float rain(vec2 uv, float t) {
  vec2 p = vec2(uv.x * 90.0 + uv.y * 18.0, uv.y * 6.0 + t * 9.0);
  vec2 id = floor(p);
  float h = hash21(vec2(id.x, 7.0));
  float y = fract(p.y + h * 10.0);
  float streak = smoothstep(0.0, 0.08, y) * smoothstep(0.35, 0.08, y);
  float lane = smoothstep(0.5, 0.0, abs(fract(p.x) - 0.5) * 6.0);
  return streak * lane * step(0.72, h);
}

void main() {
  vec2 p = aspectUv(vUv, uResolution);
  vec2 ptr = aspectUv(uPointer, uResolution);
  float t = uTime * 0.06;

  vec2 q = vec2(fbm(p * 1.6 + vec2(t, -t * 0.4)), fbm(p * 1.6 + vec2(-t * 0.7, t) + 4.3));
  float clouds = fbm(p * 2.2 + q * 1.8 + vec2(t * 1.5, 0.0));

  // Clouds lit from within by the 3D lightning bolts.
  float bolt = uFlash * (0.25 + smoothstep(0.45, 0.9, clouds) * 1.3);

  vec3 deep = vec3(0.03, 0.04, 0.07);
  vec3 cloud = vec3(0.16, 0.18, 0.24);
  vec3 col = mix(deep, cloud, smoothstep(0.25, 0.85, clouds));
  col += vec3(0.55, 0.62, 0.85) * bolt;

  // Breach of light opening around the pointer while holding.
  float d = length(p - ptr);
  float radius = uProgress * 1.35 + uHolding * 0.05;
  float edge = (clouds - 0.5) * 0.35;
  float breach = smoothstep(radius + 0.08, radius - 0.12, d + edge);
  vec3 warm = mix(vec3(0.98, 0.78, 0.46), vec3(1.0, 0.93, 0.8), smoothstep(radius, 0.0, d));
  vec3 sky = mix(warm * 0.85, vec3(0.62, 0.72, 0.86), smoothstep(0.0, 1.2, vUv.y + uProgress * 0.2));
  float rim = smoothstep(0.18, 0.0, abs(d + edge - radius)) * uProgress * (1.0 - uProgress * 0.6);
  col += vec3(0.5, 0.56, 0.7) * rain(vUv, uTime) * 0.22 * (1.0 - breach) * (1.0 - uProgress * 0.8);
  col = mix(col, sky, breach);
  col += vec3(1.0, 0.72, 0.38) * rim * 0.9;

  float vignette = smoothstep(1.25, 0.25, length(vUv - 0.5) * 1.6);
  col *= mix(0.55, 1.0, vignette);
  gl_FragColor = vec4(shoulder(col) * uFade, 1.0);
}
`;

export function StormScene({ hold, lowPower }: SceneProps & { lowPower: boolean }) {
  const extra = useMemo(() => ({ uFlash: { value: 0 } }), []);
  return (
    <>
      <FullscreenShader hold={hold} fragmentShader={FRAGMENT} smoothing={2.5} extraUniforms={extra} />
      <Lightning hold={hold} flash={extra.uFlash} count={lowPower ? 1 : 2} />
    </>
  );
}
