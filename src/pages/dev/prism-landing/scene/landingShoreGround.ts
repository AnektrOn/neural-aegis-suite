/**
 * Sol landing « rive humide » (réf. monolithe / fente orange).
 * Textures procédurales + shader d’humidité ; option PBR si fichiers dans assets/textures/shore/.
 */
import * as THREE from "three";
import { PORTAL_CENTER_X, PORTAL_WORLD_Z, LANDING_WATER_LEVEL } from "../layout/prismSceneConstants";
import {
  LANDING_PLAYA_SHADER_COMMON,
  type LandingPlayaEnvelope,
} from "./landingSceneEnvelope";

export const SHORE_WORLD_TEX_SCALE = 0.22; // ~4.5 m par répétition texture

export type LandingShoreTextures = {
  albedo: THREE.Texture;
  normal: THREE.Texture;
  roughness: THREE.Texture;
  /** Height / displacement (PBR Fab) — parallax uniquement, pas de déplacement vertex. */
  height?: THREE.Texture | null;
  /** `pbr` si fichiers dans `textures/shore/`, sinon procédural. */
  source: "pbr" | "procedural";
  /** Normal DirectX (Fab *-normal-dx*) → invert Y pour Three.js. */
  normalScale?: THREE.Vector2;
  dispose: () => void;
};

const shoreFileUrls = import.meta.glob<string>("../assets/textures/shore/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

function shoreFileStem(path: string) {
  return path.split("/").pop()?.toLowerCase() ?? "";
}

function findShoreFile(
  match: (name: string) => boolean,
  rank?: (name: string) => number,
): { url: string; stem: string } | undefined {
  let best: { url: string; stem: string; score: number } | undefined;
  for (const [path, url] of Object.entries(shoreFileUrls)) {
    const stem = shoreFileStem(path);
    if (!match(stem)) continue;
    const score = rank ? rank(stem) : 0;
    if (!best || score > best.score) {
      best = { url, stem, score };
    }
  }
  return best ? { url: best.url, stem: best.stem } : undefined;
}

function configureShoreMap(tex: THREE.Texture, srgb: boolean) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const repeat = 1 / SHORE_WORLD_TEX_SCALE;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
}

/**
 * Sol landing : PBR Fab si 3 maps dans `textures/shore/`, sinon procédural.
 * Noms Fab acceptés : *BaseColor* / *Albedo*, *Roughness*, *Normal* (OpenGL).
 */
export async function resolveLandingShoreTextures(): Promise<LandingShoreTextures> {
  const albedoEntry = findShoreFile((n) => {
    if (/preview|normal|rough|ao|metal|height|bump|opacity|mask/.test(n)) return false;
    return /basecolor|base_color|albedo|diffuse|color/.test(n) || n === "basecolor.png";
  });
  const roughnessEntry = findShoreFile((n) => /roughness|_rough/.test(n));
  const normalEntry = findShoreFile(
    (n) => /normal/.test(n) && !/rough/.test(n),
    (n) => {
      if (n.includes("normal-gl") || n.includes("opengl")) return 3;
      if (n.includes("normal-dx") || n.includes("-dx")) return 2;
      return 1;
    },
  );
  const heightEntry = findShoreFile((n) => /height|displacement|_disp/.test(n));

  if (albedoEntry && roughnessEntry && normalEntry) {
    const loader = new THREE.TextureLoader();
    const [albedo, roughness, normal, height] = await Promise.all([
      loader.loadAsync(albedoEntry.url),
      loader.loadAsync(roughnessEntry.url),
      loader.loadAsync(normalEntry.url),
      heightEntry ? loader.loadAsync(heightEntry.url) : Promise.resolve(null),
    ]);
    configureShoreMap(albedo, true);
    configureShoreMap(roughness, false);
    configureShoreMap(normal, false);
    if (height) configureShoreMap(height, false);
    const dxNormal =
      normalEntry.stem.includes("normal-dx") || normalEntry.stem.includes("-dx");
    const normalScale = new THREE.Vector2(1, dxNormal ? -1 : 1);
    return {
      albedo,
      normal,
      roughness,
      height,
      source: "pbr",
      normalScale,
      dispose() {
        albedo.dispose();
        normal.dispose();
        roughness.dispose();
        height?.dispose();
      },
    };
  }

  const procedural = createVilleneuveShoreTextures();
  return { ...procedural, source: "procedural" };
}

function periodicFbm(nx: number, ny: number, octaves: number, sx: number, sy: number, seed: number) {
  let v = 0;
  let a = 0.5;
  let fx = nx * sx + seed;
  let fy = ny * sy + seed * 0.7;
  for (let i = 0; i < octaves; i++) {
    v += a * (Math.sin(fx * 1.9 + fy * 2.3) * 0.5 + 0.5);
    fx *= 2.03;
    fy *= 2.03;
    a *= 0.5;
  }
  return v;
}

function intHash(x: number, y: number, seed: number) {
  let n = x * 374761393 + y * 668265263 + seed * 982451653;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function heightFieldToNormalTexture(
  heights: Float32Array,
  size: number,
  strength: number,
  repeatX: number,
  repeatY: number,
) {
  const normalData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const hL = heights[idx - 1 < 0 ? idx : idx - 1];
      const hR = heights[idx + 1 >= size * size ? idx : idx + 1];
      const hD = heights[idx - size < 0 ? idx : idx - size];
      const hU = heights[idx + size >= size * size ? idx : idx + size];
      const dx = (hR - hL) * strength;
      const dy = (hU - hD) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const o = idx * 4;
      normalData[o] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      normalData[o + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      normalData[o + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      normalData[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Albedo gris-brun froid, stries horizontales (eau peu profonde), taches plus sèches près du portail. */
export function createVilleneuveShoreTextures(): LandingShoreTextures {
  const size = 1024;
  const heights = new Float32Array(size * size);
  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext("2d");
  const roughCtx = roughCanvas.getContext("2d");
  if (!albedoCtx || !roughCtx) {
    const empty = new THREE.Texture();
    return { albedo: empty, normal: empty, roughness: empty, source: "procedural", dispose: () => {} };
  }

  const albedoImg = albedoCtx.createImageData(size, size);
  const roughImg = roughCtx.createImageData(size, size);
  const ad = albedoImg.data;
  const rd = roughImg.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const ripple = Math.sin(ny * 220 + periodicFbm(nx, ny, 3, 6, 6, 3) * 8) * 0.5 + 0.5;
      const grain = periodicFbm(nx, ny, 5, 28, 28, 11);
      const pebble = Math.pow(intHash(x, y, 17), 2.4);
      const h = ripple * 0.38 + grain * 0.42 + pebble * 0.2;
      heights[y * size + x] = h;

      const base = 0.14 + grain * 0.1 + ripple * 0.04;
      const cool = base * (0.92 + pebble * 0.08);
      const r = Math.min(255, Math.floor(cool * 255 * (1.02 + pebble * 0.06)));
      const g = Math.min(255, Math.floor(cool * 248));
      const b = Math.min(255, Math.floor(cool * 238 * (0.98 + ripple * 0.04)));
      const i = (y * size + x) * 4;
      ad[i] = r;
      ad[i + 1] = g;
      ad[i + 2] = b;
      ad[i + 3] = 255;

      const rough = Math.min(1, Math.max(0.04, 0.12 + (1 - ripple) * 0.35 + pebble * 0.45));
      const rv = Math.floor(rough * 255);
      rd[i] = rv;
      rd[i + 1] = rv;
      rd[i + 2] = rv;
      rd[i + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const repeat = 1 / SHORE_WORLD_TEX_SCALE;
  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(repeat, repeat);
  albedo.anisotropy = 8;

  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.colorSpace = THREE.NoColorSpace;
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(repeat, repeat);
  roughness.anisotropy = 8;

  const normal = heightFieldToNormalTexture(heights, size, 3.8, repeat, repeat);

  return {
    albedo,
    normal,
    roughness,
    source: "procedural",
    dispose() {
      albedo.dispose();
      normal.dispose();
      roughness.dispose();
    },
  };
}

export type LandingShoreMaterial = {
  material: THREE.MeshStandardMaterial;
  uniforms: {
    uPortalXZ: THREE.Vector2;
    uWaterLevel: number;
    uTexScale: number;
  };
};

export type ShoreMaterialMode = "legacyWet" | "rainPuddles";

export function createVilleneuveShoreMaterial(
  textures: LandingShoreTextures,
  envMap: THREE.Texture,
  mode: ShoreMaterialMode = "rainPuddles",
  playa?: LandingPlayaEnvelope,
): LandingShoreMaterial {
  const uniforms = {
    uPortalXZ: new THREE.Vector2(PORTAL_CENTER_X, PORTAL_WORLD_Z),
    uWaterLevel: LANDING_WATER_LEVEL,
    uTexScale: SHORE_WORLD_TEX_SCALE,
  };

  const pbr = textures.source === "pbr";
  const material = new THREE.MeshStandardMaterial({
    color: pbr ? 0xffffff : 0x2a2622,
    map: textures.albedo,
    roughness: 1,
    roughnessMap: textures.roughness,
    metalness: 0.02,
    normalMap: textures.normal,
    normalScale: textures.normalScale?.clone() ?? new THREE.Vector2(0.95, 0.95),
    envMap,
    envMapIntensity: pbr ? 0.18 : 0.22,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPortalXZ = { value: uniforms.uPortalXZ };
    shader.uniforms.uWaterLevel = { value: uniforms.uWaterLevel };
    shader.uniforms.uTexScale = { value: uniforms.uTexScale };
    if (playa) {
      shader.uniforms.uPlayaCenter = {
        value: new THREE.Vector2(playa.centerX, playa.centerZ),
      };
      shader.uniforms.uPlayaHalf = {
        value: new THREE.Vector2(playa.halfWidth, playa.halfDepth),
      };
      shader.uniforms.uPlayaHorizon = { value: playa.horizonColor.clone() };
    }

    const puddleMode = mode === "rainPuddles";
    const playaCommon = playa ? LANDING_PLAYA_SHADER_COMMON : "";

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
attribute float puddle;
varying vec3 vShoreWorldPos;
varying float vPuddle;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
vShoreWorldPos = worldPosition.xyz;
vPuddle = puddle;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      puddleMode
        ? `#include <common>
${playaCommon}
varying vec3 vShoreWorldPos;
varying float vPuddle;

float shoreWetness(vec3 wp) {
  float p = clamp(vPuddle, 0.0, 1.0);
  return p * p * p;
}`
        : `#include <common>
${playaCommon}
uniform vec2 uPortalXZ;
uniform float uWaterLevel;
uniform float uTexScale;
varying vec3 vShoreWorldPos;

float shoreWetness(vec3 wp) {
  float dPortal = distance(wp.xz, uPortalXZ);
  float dryBerm = 1.0 - smoothstep(1.5, 7.5, dPortal);
  float towardCam = smoothstep(uPortalXZ.y + 4.0, uPortalXZ.y + 26.0, wp.z);
  float corridor = 1.0 - smoothstep(0.0, 9.0, abs(wp.x - uPortalXZ.x));
  float pool = towardCam * (0.55 + corridor * 0.45);
  float depression = smoothstep(uWaterLevel + 0.35, uWaterLevel - 0.05, wp.y);
  float wet = max(pool * (1.0 - dryBerm * 0.85), depression * 0.9);
  return clamp(wet, 0.0, 1.0);
}`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
float shoreW = shoreWetness(vShoreWorldPos);
roughnessFactor = mix(0.018, roughnessFactor, 1.0 - shoreW * 0.94);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <metalnessmap_fragment>",
      `#include <metalnessmap_fragment>
float shoreWMetal = shoreWetness(vShoreWorldPos);
metalnessFactor = mix(metalnessFactor, clamp(metalnessFactor + 0.14, 0.0, 0.24), shoreWMetal * 0.82);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
float shoreW2 = shoreWetness(vShoreWorldPos);
vec3 dryTint = vec3(1.08, 1.04, 0.98);
vec3 puddleTint = vec3(0.52, 0.48, 0.44);
float meniscus = shoreW2 * shoreW2;
diffuseColor.rgb *= mix(dryTint, puddleTint, meniscus * 0.38);
diffuseColor.rgb += vec3(0.02, 0.022, 0.028) * meniscus * (1.0 - shoreW2);
diffuseColor.rgb = (diffuseColor.rgb - 0.5) * 1.22 + 0.5;
${
  playa
    ? `
float playaK = landingPlayaFade(vShoreWorldPos);
diffuseColor.rgb = mix(uPlayaHorizon, diffuseColor.rgb, playaK);
diffuseColor.rgb = mix(diffuseColor.rgb, uPlayaHorizon, (1.0 - playaK) * 0.04);`
    : ""
}`,
    );

    if (puddleMode) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <envmap_fragment>",
        `#include <envmap_fragment>
float shoreWEnv = shoreWetness(vShoreWorldPos);
reflectedLight.indirectSpecular *= mix(1.0, 3.2, shoreWEnv);`,
      );
    }
  };
  material.customProgramCacheKey = () =>
    mode === "rainPuddles"
      ? playa
        ? "landing_shore_puddles_v4_playa"
        : "landing_shore_puddles_v3"
      : playa
        ? "landing_shore_wetness_v2_playa"
        : "landing_shore_wetness_v1";

  return { material, uniforms };
}

export function createLandingForegroundRocks(
  count: number,
  sampleHeight: (x: number, z: number) => number,
  portalX: number,
  portalZ: number,
): THREE.InstancedMesh {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1816,
    roughness: 0.88,
    metalness: 0.04,
    flatShading: true,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const rand = mulberry32(90210);
  let placed = 0;
  for (let attempt = 0; attempt < count * 12 && placed < count; attempt++) {
    const z = portalZ + 6 + rand() * 32;
    const x = portalX + (rand() - 0.5) * 22;
    const y = sampleHeight(x, z);
    if (y < LANDING_WATER_LEVEL + 0.05) continue;
    const s = 0.12 + rand() * 0.55;
    dummy.position.set(x, y + s * 0.35, z);
    dummy.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.35);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Eau miroir localisée vers la caméra (évite le plan 84×84 sur tout le terrain). */
export function getLandingFilmWaterPlacement(terrainCenterX: number, terrainCenterZ: number) {
  return {
    position: new THREE.Vector3(terrainCenterX, LANDING_WATER_LEVEL, terrainCenterZ + 10),
    sizeX: 44,
    sizeZ: 38,
    distortionScale: 0.14,
    sizeUniform: 5.2,
  };
}
