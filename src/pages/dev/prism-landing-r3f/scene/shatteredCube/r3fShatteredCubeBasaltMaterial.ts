import * as THREE from "three";

const GLSL_NOISE = /* glsl */ `
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float a = 0.5; float s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(5.2, 1.3, 8.7); a *= 0.5; }
  return s / 0.96875;
}
`;

export type R3fBasaltMaterialUniforms = {
  uTime: { value: number };
  uCell: { value: number };
};

export function createR3fShatteredCubeBasaltMaterial(
  uniforms: R3fBasaltMaterialUniforms,
  envMap?: THREE.Texture | null,
  envMapIntensity = 1.5,
) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: "#141821",
    metalness: 0.38,
    roughness: 0.36,
    ior: 1.55,
    specularIntensity: 1.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.24,
    envMapIntensity,
  });
  if (envMap) mat.envMap = envMap;
  mat.fog = true;
  mat.customProgramCacheKey = () => "r3f-monolith-basalt-v1";

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uCell = uniforms.uCell;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec3 aRest;
uniform float uCell;
varying vec3 vCube;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vCube = aRest + position * uCell;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vCube;
uniform float uTime;
${GLSL_NOISE}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 mp = vCube * 3.2;
float grain = fbm(mp * 6.5);
float micro = vnoise(mp * 24.0);
float slate = fbm(mp * 1.8 + vec3(0.0, grain * 0.6, 0.0));
vec3 darkBasalt = vec3(0.020, 0.024, 0.032);
vec3 coldSlate  = vec3(0.075, 0.090, 0.115);
vec3 stoneCol = mix(darkBasalt, coldSlate, slate * 0.75 + grain * 0.25);
stoneCol *= (0.88 + 0.24 * micro);
diffuseColor.rgb = stoneCol;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = clamp(0.24 + 0.26 * grain - 0.08 * micro, 0.14, 0.58);`,
      );
  };

  return mat;
}
