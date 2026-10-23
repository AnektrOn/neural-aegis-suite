import * as THREE from "three";

export type LandingGroundRealismState = {
  antiTiling: boolean;
  parallax: boolean;
  roughnessNoise: boolean;
};

const GROUND_REALISM_KEY = "landing_ground_realism_v1";

/** Anti-tiling + parallax léger + bruit de roughness (sans déplacer les vertices — collision inchangée). */
export function applyLandingGroundRealism(
  material: THREE.MeshStandardMaterial,
  heightMap: THREE.Texture | null,
  getState: () => LandingGroundRealismState,
): void {
  const prevCompile = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey?.bind(material);

  material.onBeforeCompile = (shader, renderer) => {
    prevCompile?.call(material, shader, renderer);
    const state = getState();

    shader.uniforms.uGroundHeightMap = { value: heightMap };
    shader.uniforms.uGroundHasHeight = { value: heightMap ? 1 : 0 };
    shader.uniforms.uGroundAntiTile = { value: state.antiTiling ? 1 : 0 };
    shader.uniforms.uGroundParallax = { value: state.parallax ? 1 : 0 };
    shader.uniforms.uGroundRoughNoise = { value: state.roughnessNoise ? 1 : 0 };

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
uniform sampler2D uGroundHeightMap;
uniform float uGroundHasHeight;
uniform float uGroundAntiTile;
uniform float uGroundParallax;
uniform float uGroundRoughNoise;
varying vec3 vShoreWorldPos;

float landingGroundHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 landingParallaxOffset(vec2 uv, vec3 viewDir) {
  if (uGroundParallax < 0.5 || uGroundHasHeight < 0.5) return uv;
  float h = texture2D(uGroundHeightMap, uv).r;
  float scale = 0.035;
  vec2 offset = viewDir.xy / max(viewDir.z, 0.2) * (h - 0.5) * scale;
  return uv + offset;
}`,
    );

    if (state.antiTiling || state.parallax) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
if (uGroundAntiTile > 0.5 || uGroundParallax > 0.5) {
  vec2 wuv = vShoreWorldPos.xz * 0.08;
  float blend = landingGroundHash(floor(wuv)) * 0.55 + landingGroundHash(floor(wuv * 1.7)) * 0.45;
  vec2 uvA = landingParallaxOffset(mapUv, normalize(vViewPosition));
  vec4 t1 = texture2D(map, uvA);
  vec4 t2 = texture2D(map, landingParallaxOffset(mapUv * 2.35 + vec2(0.17, 0.31), normalize(vViewPosition)));
  diffuseColor *= mix(t1, t2, uGroundAntiTile > 0.5 ? smoothstep(0.25, 0.75, blend) : 1.0);
}`,
      );
    }

    if (state.roughnessNoise) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
if (uGroundRoughNoise > 0.5) {
  float n = landingGroundHash(vShoreWorldPos.xz * 0.04) * 0.5
    + landingGroundHash(vShoreWorldPos.xz * 0.11 + 3.1) * 0.5;
  roughnessFactor = clamp(roughnessFactor * (0.88 + n * 0.22), 0.04, 1.0);
}`,
      );
    }
  };

  material.customProgramCacheKey = () => {
    const s = getState();
    const base = prevKey ? prevKey() : "shore";
    return `${base}_${GROUND_REALISM_KEY}_${s.antiTiling}_${s.parallax}_${s.roughnessNoise}_${heightMap ? 1 : 0}`;
  };
  material.needsUpdate = true;
}
