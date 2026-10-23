import * as THREE from "three";

/** Mélange la RT de reflet planaire dans les flaques (shader shore existant). */
export function applyLandingPuddleReflectionMap(
  material: THREE.MeshStandardMaterial,
  getTexture: () => THREE.Texture | null,
  getEnabled: () => boolean,
): void {
  const prev = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey?.bind(material);

  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    shader.uniforms.uPuddleReflect = { value: getTexture() };
    shader.uniforms.uPuddleReflectOn = { value: getEnabled() ? 1 : 0 };

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
uniform sampler2D uPuddleReflect;
uniform float uPuddleReflectOn;
varying vec3 vShoreWorldPos;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <envmap_fragment>",
      `#include <envmap_fragment>
if (uPuddleReflectOn > 0.5) {
  float shoreWRef = shoreWetness(vShoreWorldPos);
  vec2 ruv = vShoreWorldPos.xz * 0.02 + vec2(0.37, 0.19);
  vec3 refl = texture2D(uPuddleReflect, fract(ruv)).rgb;
  reflectedLight.indirectSpecular = mix(reflectedLight.indirectSpecular, refl, shoreWRef * 0.65);
}`,
    );
  };

  material.customProgramCacheKey = () =>
    `${prevKey ? prevKey() : "shore"}_puddle_refl_${getEnabled() ? 1 : 0}`;
}
