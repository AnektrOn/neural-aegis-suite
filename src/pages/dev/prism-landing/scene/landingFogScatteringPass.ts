import * as THREE from "three";

/**
 * Diffusion brouillard (écran) — inspiré three.js fog scattering, sans depth texture
 * sur le RT du composer (évite écran noir sur plusieurs GPU WebGL).
 * Le facteur brume mélange distance verticale + densité FogExp2.
 */
export const LANDING_FOG_SCATTERING_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uFogDensity: { value: 0.02 },
    uFogColor: { value: new THREE.Color(0x17140f) },
    uScattering: { value: 2.0 },
    uStrength: { value: 0.0 },
    uHorizonVeil: { value: 0.42 },
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
    uniform vec2 uResolution;
    uniform float uFogDensity;
    uniform vec3 uFogColor;
    uniform float uScattering;
    uniform float uStrength;
    uniform float uHorizonVeil;
    varying vec2 vUv;

    vec3 sampleBlur(vec2 uv, float radiusPx) {
      vec2 texel = radiusPx / uResolution;
      vec3 acc = vec3(0.0);
      acc += texture2D(tDiffuse, uv + texel * vec2(-1.0, -1.0)).rgb * 0.0625;
      acc += texture2D(tDiffuse, uv + texel * vec2( 0.0, -1.0)).rgb * 0.125;
      acc += texture2D(tDiffuse, uv + texel * vec2( 1.0, -1.0)).rgb * 0.0625;
      acc += texture2D(tDiffuse, uv + texel * vec2(-1.0,  0.0)).rgb * 0.125;
      acc += texture2D(tDiffuse, uv).rgb * 0.25;
      acc += texture2D(tDiffuse, uv + texel * vec2( 1.0,  0.0)).rgb * 0.125;
      acc += texture2D(tDiffuse, uv + texel * vec2(-1.0,  1.0)).rgb * 0.0625;
      acc += texture2D(tDiffuse, uv + texel * vec2( 0.0,  1.0)).rgb * 0.125;
      acc += texture2D(tDiffuse, uv + texel * vec2( 1.0,  1.0)).rgb * 0.0625;
      return acc;
    }

    void main() {
      vec4 sharp = texture2D(tDiffuse, vUv);
      vec3 outCol = sharp.rgb;

      if (uStrength > 0.0001 && uScattering > 0.0001) {
        float distY = 1.0 - vUv.y;
        float distX = abs(vUv.x - 0.5) * 1.35;
        float pseudoDepth = mix(12.0, 95.0, clamp(distY * 0.85 + distX * 0.35, 0.0, 1.0));
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * pseudoDepth * pseudoDepth);
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        float blurPx = uScattering * fogFactor * 2.8;
        vec3 blurred = sampleBlur(vUv, blurPx);
        blurred = mix(blurred, uFogColor, fogFactor * 0.28);
        outCol = mix(sharp.rgb, blurred, fogFactor * uStrength);
      }

      vec2 sc = vUv - 0.5;
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      float frameEdge = smoothstep(0.48, 1.02, length(sc * vec2(aspect * 0.58 + 0.42, 1.0)) * 1.32);
      float skyBand = smoothstep(0.42, 0.95, 1.0 - vUv.y);
      float horizonVeil = clamp(max(frameEdge * 0.8, skyBand * 0.5), 0.0, 1.0);
      outCol = mix(outCol, uFogColor, horizonVeil * uHorizonVeil);

      gl_FragColor = vec4(outCol, sharp.a);
    }
  `,
};

export function syncLandingFogScatteringPass(
  uniforms: Record<string, { value: unknown }>,
  fog: THREE.FogExp2 | null,
  scattering: number,
  strength: number,
  width: number,
  height: number,
) {
  const res = uniforms.uResolution as { value: THREE.Vector2 };
  if (res) res.value.set(width, height);
  const scatter = uniforms.uScattering as { value: number };
  if (scatter) scatter.value = scattering;
  const str = uniforms.uStrength as { value: number };
  if (str) str.value = strength;
  if (fog) {
    const d = uniforms.uFogDensity as { value: number };
    const c = uniforms.uFogColor as { value: THREE.Color };
    if (d) d.value = fog.density;
    if (c) c.value.copy(fog.color);
  }
}
