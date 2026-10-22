import * as THREE from "three";
import type { MarbleTwoLayerTextures } from "./marbleTwoLayerTextures";

export type MarbleTwoLayerMaterialOptions = {
  veinTint?: string;
  veinBlend?: number;
  veinEmissive?: number;
  veinMask?: THREE.Texture;
  envMap?: THREE.Texture | null;
  envMapIntensity?: number;
};

export function createMarbleTwoLayerSideMaterial(
  layers: MarbleTwoLayerTextures,
  options: MarbleTwoLayerMaterialOptions = {},
): THREE.MeshPhysicalMaterial {
  const veinTint = new THREE.Color(options.veinTint ?? "#c9a066");
  const veinBlend = options.veinBlend ?? 0.38;
  const veinEmissive = options.veinEmissive ?? 0.62;
  const veinMask = options.veinMask ?? layers.veinMask;

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x101012,
    map: layers.baseColor,
    normalMap: layers.baseNormal,
    roughnessMap: layers.baseRoughness,
    roughness: 0.94,
    metalness: 0.025,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    envMap: options.envMap ?? null,
    envMapIntensity: options.envMapIntensity ?? 0.14,
  });

  const uniforms = {
    uVeinMask: { value: veinMask },
    uVeinTint: { value: veinTint },
    uVeinBlend: { value: veinBlend },
    uVeinEmissive: { value: veinEmissive },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uVeinMask = uniforms.uVeinMask;
    shader.uniforms.uVeinTint = uniforms.uVeinTint;
    shader.uniforms.uVeinBlend = uniforms.uVeinBlend;
    shader.uniforms.uVeinEmissive = uniforms.uVeinEmissive;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
uniform sampler2D uVeinMask;
uniform vec3 uVeinTint;
uniform float uVeinBlend;
uniform float uVeinEmissive;

float marbleVeinMask(vec2 uv) {
  float m = texture2D(uVeinMask, uv).r;
  float core = smoothstep(0.06, 0.42, m);
  float rim = smoothstep(0.02, 0.18, m) * 0.35;
  return clamp(core + rim, 0.0, 1.0);
}`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
float vMask = marbleVeinMask(vMapUv);
diffuseColor.rgb = mix(diffuseColor.rgb, uVeinTint, vMask * uVeinBlend);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
float vMaskE = marbleVeinMask(vMapUv);
totalEmissiveRadiance += uVeinTint * pow(vMaskE, 1.45) * uVeinEmissive;`,
    );
  };

  material.customProgramCacheKey = () => "marble_subtle_vein_v4";
  return material;
}
