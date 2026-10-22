import * as THREE from "three";
import { LANDING_SCENE_LAYOUT } from "../layout/landingSceneLayout";

/** Timings démo monolithe (secondes). */
export const SHATTERED_CUBE_TIMING = {
  hold: 4,
  burst: 34,
  reform: 20,
  cubeWindow: 0.08,
} as const;

export const SHATTERED_CUBE_GLOW_PRESETS = [
  { name: "Monolithe Glaciaire", glow: "#e2f1ff" },
  { name: "Basalte & Cyan", glow: "#7dd3fc" },
  { name: "Obsidienne & Blanc", glow: "#ffffff" },
  { name: "Noyau Ambre", glow: "#ff8a2b" },
] as const;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** Bruit 3D déterministe pour organiser la défragmentation par blocs/clusters. */
function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise3D(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;
  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;
  return nxy0 + (nxy1 - nxy0) * uz;
}

/* -------------------------------------------------------------------------- */
/*  Matériau : Pierre Basalte / Ardoise Monolithique & Reflets Froids         */
/* -------------------------------------------------------------------------- */

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

type SharedUniforms = {
  uTime: { value: number };
  uCell: { value: number };
};

function createMonolithMaterial(u: SharedUniforms, envMap?: THREE.Texture | null) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: "#141821",
    metalness: 0.38,
    roughness: 0.36,
    ior: 1.55,
    specularIntensity: 1.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.24,
    envMapIntensity: 1.5,
  });
  if (envMap) mat.envMap = envMap;
  mat.fog = true;
  mat.customProgramCacheKey = () => "monolith-basalt-v4";

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uCell = u.uCell;

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
// Grain minéral constant de basalte noir / ardoise : aucun changement de couleur ni émission
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
// Surface minérale mate constante qui capte uniquement les vraies lumières de la scène
roughnessFactor = clamp(0.24 + 0.26 * grain - 0.08 * micro, 0.14, 0.58);`,
      );
  };
  return mat;
}

/* -------------------------------------------------------------------------- */
/*  Explosion Architecturale autour du Cube Émetteur Central                  */
/* -------------------------------------------------------------------------- */

export type ShatteredCubeOptions = {
  /** Demi-arête du grand cube (monde). */
  size?: number;
  /** Résolution de la grille (ex: 10 → 10×10×10). */
  grid?: number;
  seed?: number;
  position?: THREE.Vector3;
  autoPlay?: boolean;
  /** Couleur du cube émetteur central. */
  glow?: string;
  /** Ratio du cœur vide (0.62 → coquille externe uniquement). */
  coreRatio?: number;
  /** Amplitude d'explosion (0.2–0.6 dans la démo). */
  defragDepth?: number;
  envMap?: THREE.Texture | null;
  envMapIntensity?: number;
  studioLights?: boolean;
  onPhaseChange?: (phase: "hold" | "burst" | "reform") => void;
};

export type ShatteredCubeInstance = {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  update: (time: number) => void;
  triggerBurst: () => void;
  setAutoPlay: (auto: boolean) => void;
  setGlow: (color: string) => void;
  setDefragDepth: (val: number) => void;
  dispose: () => void;
};

export function createShatteredCubeGroup(
  options: ShatteredCubeOptions = {},
): ShatteredCubeInstance {
  const size = options.size ?? 2.25;
  const N = Math.max(6, Math.round(options.grid ?? 10));
  const seed = options.seed ?? 5;
  let autoPlay = options.autoPlay ?? true;
  const glow = options.glow ?? "#e2f1ff";
  const coreRatio = options.coreRatio ?? 0.62;
  let defragDepth = options.defragDepth ?? 0.6;
  const basePosition = options.position?.clone() ?? new THREE.Vector3(0, 0, 0);
  const rand = mulberry32(seed + 31);
  const landingScene =
    options.envMapIntensity != null && options.envMapIntensity < 1.2;
  const coreLightScale = landingScene ? 0.38 : 1;

  const cell = 2 / N;
  const L = Math.max(1, Math.round(((1 - coreRatio) * N) / 2));

  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, -1).normalize(),
    new THREE.Vector3(0, -1, 0),
  );

  type SubCubeItem = {
    rest: THREE.Vector3;
    blastVector: THREE.Vector3;
    slotRaw: number;
    start: number;
    blastDistance: number;
    driftFreq: number;
    phaseOffset: number;
  };

  const items: SubCubeItem[] = [];

  for (let ix = 0; ix < N; ix++) {
    for (let iy = 0; iy < N; iy++) {
      for (let iz = 0; iz < N; iz++) {
        const dist = Math.min(ix, N - 1 - ix, iy, N - 1 - iy, iz, N - 1 - iz);
        if (dist >= L) continue;

        const rx = -1 + (ix + 0.5) * cell;
        const ry = -1 + (iy + 0.5) * cell;
        const rz = -1 + (iz + 0.5) * cell;
        const rest = new THREE.Vector3(rx, ry, rz);
        const radialDir = rest.clone().normalize();

        const ax = Math.abs(rx);
        const ay = Math.abs(ry);
        const az = Math.abs(rz);
        const normal = new THREE.Vector3();
        const tangentA = new THREE.Vector3();
        const tangentB = new THREE.Vector3();
        if (ax >= ay && ax >= az) {
          normal.set(Math.sign(rx) || 1, 0, 0);
          tangentA.set(0, 1, 0);
          tangentB.set(0, 0, 1);
        } else if (ay >= ax && ay >= az) {
          normal.set(0, Math.sign(ry) || 1, 0);
          tangentA.set(1, 0, 0);
          tangentB.set(0, 0, 1);
        } else {
          normal.set(0, 0, Math.sign(rz) || 1);
          tangentA.set(1, 0, 0);
          tangentB.set(0, 1, 0);
        }

        const clusterNoise = smoothNoise3D(
          Math.floor(ix / 2) * 1.25 + seed * 0.7,
          Math.floor(iy / 2) * 1.25 + seed * 1.1,
          Math.floor(iz / 2) * 1.25,
        );
        const fine = rand();
        const patternN = smoothNoise3D(
          ix * 0.55 + seed * 0.3,
          iy * 0.55,
          iz * 0.55 + seed * 0.2,
        );
        const slotRaw = dist * 0.7 + patternN * 1.6 + fine * 0.12;

        const blastVector = radialDir
          .clone()
          .multiplyScalar(0.76)
          .addScaledVector(normal, 0.42)
          .addScaledVector(tangentA, (fine - 0.5) * 0.28)
          .addScaledVector(tangentB, (clusterNoise - 0.5) * 0.28)
          .normalize();

        const layerFactor = dist === 0 ? 1.25 : dist === 1 ? 1.0 : 0.85;
        const blastDistance =
          (1.35 + Math.pow(clusterNoise, 1.1) * 2.1 + fine * 1.35) * layerFactor;

        items.push({
          rest,
          blastVector,
          slotRaw,
          start: 0,
          blastDistance,
          driftFreq: 0.5 + fine * 0.6,
          phaseOffset: clusterNoise * Math.PI * 2 + fine * 3.14,
        });
      }
    }
  }

  const count = items.length;
  const order = items.slice().sort((a, b) => a.slotRaw - b.slotRaw);
  order.forEach((it, rank) => {
    it.start = (rank / count) * (1 - 0.08);
  });

  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.computeVertexNormals();
  const restAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  items.forEach((it, i) => restAttr.setXYZ(i, it.rest.x, it.rest.y, it.rest.z));
  geo.setAttribute("aRest", restAttr);

  const uniforms: SharedUniforms = {
    uTime: { value: 0 },
    uCell: { value: cell },
  };
  const material = createMonolithMaterial(uniforms, options.envMap);
  if (options.envMapIntensity != null) {
    material.envMapIntensity = options.envMapIntensity;
  }

  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const emitterSize = cell * 0.94;
  const emitterMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: new THREE.Color(glow),
    emissiveIntensity: 0.6,
    roughness: 0.08,
    metalness: 0.0,
    toneMapped: landingScene,
    fog: true,
  });
  const emitterCube = new THREE.Mesh(
    new THREE.BoxGeometry(emitterSize, emitterSize, emitterSize),
    emitterMat,
  );

  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext("2d");
  if (hctx) {
    const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 128, 128);
  }
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: new THREE.Color(glow),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0,
    fog: true,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(0.6);

  const group = new THREE.Group();
  group.name = "ShatteredCube";
  group.position.copy(basePosition);
  const spinGroup = new THREE.Group();
  group.add(spinGroup);
  const oriented = new THREE.Group();
  oriented.quaternion.copy(quat);
  oriented.scale.setScalar(size);
  spinGroup.add(oriented);
  oriented.add(emitterCube, mesh);
  group.add(halo);

  const corePointLight = new THREE.PointLight(glow, 0.05 * coreLightScale, 28, 1.6);
  group.add(corePointLight);

  if (options.studioLights ?? true) {
    const topKey = new THREE.DirectionalLight(0xeef6ff, 3.6);
    topKey.position.set(2.5, 10.0, 5.5);
    const leftRim = new THREE.DirectionalLight(0x93c5fd, 1.9);
    leftRim.position.set(-9.0, 3.0, -5.0);
    const bottomBounce = new THREE.DirectionalLight(0xcbd5e1, 1.35);
    bottomBounce.position.set(0.0, -9.5, 4.0);
    group.add(
      topKey,
      topKey.target,
      leftRim,
      leftRim.target,
      bottomBounce,
      bottomBounce.target,
    );
  }

  const m = new THREE.Matrix4();
  const identQ = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();
  const baseCubeSize = cell * 0.94;

  const { hold: HOLD_T, burst: BURST_T, reform: REFORM_T, cubeWindow: CUBE_WINDOW } =
    SHATTERED_CUBE_TIMING;

  const state = {
    phase: "burst" as "hold" | "burst" | "reform",
    t0: -1,
    lastNotified: "burst" as "hold" | "burst" | "reform",
  };

  const triggerBurst = () => {
    if (state.phase === "hold") {
      state.phase = "burst";
      state.t0 = -1;
    } else if (state.phase === "burst") {
      state.phase = "reform";
      state.t0 = -1;
    } else {
      state.phase = "burst";
      state.t0 = -1;
    }
  };

  return {
    group,
    meshes: [mesh],
    triggerBurst,
    setAutoPlay(auto: boolean) {
      autoPlay = auto;
    },
    setGlow(color: string) {
      corePointLight.color.set(color);
      emitterMat.emissive.set(color);
      haloMat.color.set(color);
    },
    setDefragDepth(val: number) {
      defragDepth = val;
    },
    update(time) {
      if (state.t0 < 0) state.t0 = time;
      const e = time - state.t0;
      let timeline: number;

      if (state.phase === "hold") {
        timeline = 0;
        if (autoPlay && e > HOLD_T) {
          state.phase = "burst";
          state.t0 = time;
        }
      } else if (state.phase === "burst") {
        timeline = clamp01(e / BURST_T);
        if (autoPlay && e > BURST_T) {
          state.phase = "reform";
          state.t0 = time;
        }
      } else {
        const x = clamp01(e / REFORM_T);
        timeline = 1 - x;
        if (x >= 1) {
          state.phase = "hold";
          state.t0 = time;
          timeline = 0;
        }
      }

      let sum = 0;
      for (let i = 0; i < count; i++) {
        const it = items[i];
        const k = easeInOutCubic(clamp01((timeline - it.start) / CUBE_WINDOW));
        sum += k;
        const slowWave = Math.sin(time * it.driftFreq + it.phaseOffset) * 0.05 * k;
        const travel = (k * it.blastDistance + slowWave) * 1.45 * defragDepth;
        tmpPos.copy(it.rest).addScaledVector(it.blastVector, travel);
        tmpScale.setScalar(baseCubeSize);
        m.compose(tmpPos, identQ, tmpScale);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;

      if (state.lastNotified !== state.phase) {
        state.lastNotified = state.phase;
        options.onPhaseChange?.(state.phase);
      }

      const reveal = sum / count;
      const pulse = 0.97 + 0.03 * Math.sin(time * 1.6);
      uniforms.uTime.value = time;
      emitterMat.emissiveIntensity =
        (0.6 + 9 * reveal) * pulse * coreLightScale;
      corePointLight.intensity =
        (0.05 + 60 * Math.pow(reveal, 1.6)) * pulse * coreLightScale;
      haloMat.opacity = Math.pow(reveal, 1.5) * 0.9 * pulse * coreLightScale;
      halo.scale.setScalar(0.6 + 2.4 * reveal);

      spinGroup.rotation.y = time * 0.08;
      spinGroup.rotation.x = Math.sin(time * 0.16) * 0.045;
    },
    dispose() {
      geo.dispose();
      material.dispose();
      emitterCube.geometry.dispose();
      emitterMat.dispose();
      haloMat.dispose();
      haloTex.dispose();
      mesh.dispose();
    },
  };
}

export const SHATTERED_CUBE_WORLD_XZ = {
  x: LANDING_SCENE_LAYOUT.cube.x,
  z: LANDING_SCENE_LAYOUT.cube.z,
};

/** Aligné sur `landingCubeMarkShot` — même axe que le plan marquant du travelling. */
export const SHATTERED_CUBE_VIEW = {
  camera: new THREE.Vector3(
    SHATTERED_CUBE_WORLD_XZ.x,
    1.72,
    SHATTERED_CUBE_WORLD_XZ.z - 10.5,
  ),
  target: new THREE.Vector3(SHATTERED_CUBE_WORLD_XZ.x, 5.8, SHATTERED_CUBE_WORLD_XZ.z),
};
