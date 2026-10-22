import * as THREE from "three";

/**
 * Radial godrays (écran) — même famille que `MonolithGodrays.tsx` / pmndrs,
 * adapté au EffectComposer three.js (`ShaderPass`).
 */
export const LANDING_GODRAY_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2(0.5, 0.42) },
    uStrength: { value: 0.22 },
    uDecay: { value: 0.93 },
    uDensity: { value: 0.72 },
    uWeight: { value: 0.09 },
    uExposure: { value: 0.38 },
    uThreshold: { value: 0.72 },
    uBlendColor: { value: new THREE.Color("#d19d7b") },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uStrength;
    uniform float uDecay;
    uniform float uDensity;
    uniform float uWeight;
    uniform float uExposure;
    uniform float uThreshold;
    uniform vec3 uBlendColor;
    uniform float uTime;
    varying vec2 vUv;

    const int SAMPLES = 56;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (uStrength <= 0.0001) {
        gl_FragColor = base;
        return;
      }

      vec2 delta = (vUv - uCenter) * (uDensity / float(SAMPLES));
      vec2 coord = vUv - delta * (hash12(gl_FragCoord.xy + fract(uTime) * 91.7) * 0.35);
      vec3 acc = vec3(0.0);
      float illum = 1.0;

      for (int i = 0; i < SAMPLES; i++) {
        coord -= delta;
        vec2 clamped = clamp(coord, vec2(0.001), vec2(0.999));
        vec3 s = texture2D(tDiffuse, clamped).rgb;
        float lum = max(0.0, dot(s, vec3(0.26, 0.22, 0.14)) - uThreshold);
        acc += s * lum * illum * uWeight;
        illum *= uDecay;
      }

      vec3 rays = acc * uBlendColor * uExposure * uStrength;
      gl_FragColor = vec4(base.rgb + rays, base.a);
    }
  `,
};

const PORTAL_RAY_WARM = new THREE.Color("#d19d7b");

export function syncLandingGodrayWarmth(
  uniforms: Record<string, { value: unknown }>,
  atmosphereHigh: THREE.Color,
  strengthMul: number,
) {
  const blend = uniforms.uBlendColor?.value as THREE.Color | undefined;
  if (blend) blend.copy(PORTAL_RAY_WARM).lerp(atmosphereHigh, 0.28);
  const exp = uniforms.uExposure as { value: number } | undefined;
  if (exp) exp.value = 0.42 + strengthMul * 0.35;
}
