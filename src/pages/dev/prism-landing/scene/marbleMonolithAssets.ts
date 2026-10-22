import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { LANDING_SCENE_LAYOUT } from "../layout/landingSceneLayout";
import { createMarbleTwoLayerSideMaterial } from "./marbleTwoLayerMaterial";
import type { MarbleTwoLayerTextures } from "./marbleTwoLayerTextures";

let rectAreaLightReady = false;

export function ensureRectAreaLightSupport() {
  if (!rectAreaLightReady) {
    RectAreaLightUniformsLib.init();
    rectAreaLightReady = true;
  }
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

type Maps = {
  color: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
};

function makeMaps(seed: number, W: number, H: number): Maps {
  const rand = mulberry32(seed);
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const colorC = mk();
  const roughC = mk();
  const emisC = mk();
  const col = colorC.getContext("2d")!;
  const rgh = roughC.getContext("2d")!;
  const ems = emisC.getContext("2d")!;

  col.fillStyle = "#07070a";
  col.fillRect(0, 0, W, H);
  rgh.fillStyle = "rgb(70,70,70)";
  rgh.fillRect(0, 0, W, H);
  ems.fillStyle = "#000";
  ems.fillRect(0, 0, W, H);

  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = (0.1 + rand() * 0.45) * W;
    const a = 0.025 + rand() * 0.05;
    const g = col.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(70,68,74,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    col.fillStyle = g;
    col.fillRect(x - r, y - r, r * 2, r * 2);
    const g2 = rgh.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(
      0,
      `rgba(${rand() > 0.5 ? 130 : 30},${rand() > 0.5 ? 130 : 30},120,${a * 3})`,
    );
    g2.addColorStop(1, "rgba(0,0,0,0)");
    rgh.fillStyle = g2;
    rgh.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const img = col.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 7;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 1.1;
  }
  col.putImageData(img, 0, 0);

  const unit = W / 512;
  const crack = (
    x: number,
    y: number,
    ang: number,
    len: number,
    w: number,
    depth: number,
  ) => {
    let px = x;
    let py = y;
    for (let s = 0; s < len; s++) {
      ang += (rand() - 0.5) * 0.55;
      const step = (6 + rand() * 10) * unit;
      const nx = px + Math.cos(ang) * step;
      const ny = py + Math.sin(ang) * step;
      const lw = Math.max(0.5, w * (1 - (s / len) * 0.7));

      ems.lineCap = "round";
      ems.strokeStyle = "rgba(255,170,60,0.9)";
      ems.lineWidth = lw;
      ems.shadowColor = "rgba(255,150,40,0.9)";
      ems.shadowBlur = 10 * unit;
      ems.beginPath();
      ems.moveTo(px, py);
      ems.lineTo(nx, ny);
      ems.stroke();
      ems.shadowBlur = 0;
      ems.strokeStyle = "rgba(255,225,160,1)";
      ems.lineWidth = lw * 0.45;
      ems.beginPath();
      ems.moveTo(px, py);
      ems.lineTo(nx, ny);
      ems.stroke();
      col.lineCap = "round";
      col.strokeStyle = "rgba(120,80,25,0.55)";
      col.lineWidth = lw * 1.4;
      col.beginPath();
      col.moveTo(px, py);
      col.lineTo(nx, ny);
      col.stroke();
      rgh.lineCap = "round";
      rgh.strokeStyle = "rgba(25,25,25,0.9)";
      rgh.lineWidth = lw * 2.5;
      rgh.beginPath();
      rgh.moveTo(px, py);
      rgh.lineTo(nx, ny);
      rgh.stroke();

      if (depth < 3 && rand() < 0.09) {
        crack(
          nx,
          ny,
          ang + (rand() > 0.5 ? 1 : -1) * (0.4 + rand() * 0.8),
          len * (0.35 + rand() * 0.3),
          w * 0.6,
          depth + 1,
        );
      }
      px = nx;
      py = ny;
      if (px < -50 || px > W + 50 || py < -50 || py > H + 50) break;
    }
  };

  const count = Math.round(5 + (W / 512) * 3);
  for (let i = 0; i < count; i++) {
    const fromBottom = rand() < 0.55;
    const y = fromBottom ? H * (0.55 + rand() * 0.45) : rand() * H;
    const dir =
      (rand() > 0.5 ? -1 : 1) * (Math.PI / 2 + (rand() - 0.5) * 2.2) + Math.PI / 2;
    crack(rand() * W, y, dir, 40 + rand() * 60, (2 + rand() * 3) * unit, 0);
  }

  const toTex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { color: toTex(colorC, true), rough: toTex(roughC, false), emissive: toTex(emisC, true) };
}

export function makeMarbleSideMaterial(seed: number, W: number, H: number) {
  const m = makeMaps(seed, W, H);
  return new THREE.MeshPhysicalMaterial({
    map: m.color,
    roughnessMap: m.rough,
    bumpMap: m.rough,
    bumpScale: 0.6,
    emissiveMap: m.emissive,
    emissive: new THREE.Color("#ffffff"),
    emissiveIntensity: 1.8,
    roughness: 1,
    metalness: 0.15,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });
}

export type MarbleMonolithOptions = {
  size?: [number, number, number];
  position?: THREE.Vector3;
  seed?: number;
  glow?: string;
  glowIntensity?: number;
  envMap?: THREE.Texture | null;
  /** Calque base + veines PBR (`textures/marble/base` + `veins`). */
  twoLayer?: MarbleTwoLayerTextures | null;
};

export type MarbleMonolithInstance = {
  group: THREE.Group;
  update: (time: number) => void;
  dispose: () => void;
};

/** Monolithe de marbre veiné d'or (vanilla Three.js, même logique que le composant R3F). */
export function createMarbleMonolithGroup(options: MarbleMonolithOptions = {}): MarbleMonolithInstance {
  ensureRectAreaLightSupport();

  const size = options.size ?? [1.6, 6.4, 0.6];
  const [w, h, d] = size;
  const seed = options.seed ?? 11;
  const glow = options.glow ?? "#ffb04a";
  const glowIntensity = options.glowIntensity ?? 40;
  const basePosition = options.position?.clone() ?? new THREE.Vector3(0, 4, 0);

  const group = new THREE.Group();
  group.name = "MarbleMonolith";
  group.position.copy(basePosition);

  const two = options.twoLayer;
  const front = two
    ? createMarbleTwoLayerSideMaterial(two, {
        veinTint: glow,
        veinMask: two.veinMasks[0],
        veinBlend: 0.36,
        veinEmissive: 0.58,
        envMap: options.envMap,
        envMapIntensity: 0.14,
      })
    : makeMarbleSideMaterial(seed, 512, 2048);
  const back = two
    ? createMarbleTwoLayerSideMaterial(two, {
        veinTint: glow,
        veinMask: two.veinMasks[1],
        veinBlend: 0.36,
        veinEmissive: 0.58,
        envMap: options.envMap,
        envMapIntensity: 0.14,
      })
    : makeMarbleSideMaterial(seed + 1, 512, 2048);
  const left = two
    ? createMarbleTwoLayerSideMaterial(two, {
        veinTint: glow,
        veinMask: two.veinMasks[2],
        veinBlend: 0.36,
        veinEmissive: 0.58,
        envMap: options.envMap,
        envMapIntensity: 0.14,
      })
    : makeMarbleSideMaterial(seed + 2, 256, 2048);
  const right = two
    ? createMarbleTwoLayerSideMaterial(two, {
        veinTint: glow,
        veinMask: two.veinMasks[3],
        veinBlend: 0.36,
        veinEmissive: 0.58,
        envMap: options.envMap,
        envMapIntensity: 0.14,
      })
    : makeMarbleSideMaterial(seed + 3, 256, 2048);
  const sideMat = two ? front : null;
  const top = new THREE.MeshPhysicalMaterial({
    color: "#0b0b0e",
    roughness: 0.35,
    metalness: 0.2,
    clearcoat: 0.6,
  });
  const bottom = new THREE.MeshStandardMaterial({
    color: "#1a1006",
    emissive: new THREE.Color(glow),
    emissiveIntensity: 3.5,
    roughness: 0.6,
  });

  if (options.envMap && !sideMat) {
    for (const mat of [front, back, left, right, top]) {
      mat.envMap = options.envMap;
      mat.envMapIntensity = 0.35;
    }
  }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    [right, left, top, bottom, front, back],
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const point = new THREE.PointLight(glow, options.twoLayer ? glowIntensity * 0.35 : glowIntensity, 14, 2);
  point.position.set(0, -h / 2 - 0.25, 0);
  group.add(point);

  const rect = new THREE.RectAreaLight(glow, options.twoLayer ? 5 : 14, w * 0.9, d * 0.9);
  rect.position.set(0, -h / 2 - 0.02, 0);
  rect.rotation.x = -Math.PI / 2;
  group.add(rect);

  const baseY = basePosition.y;

  return {
    group,
    update(time) {
      group.position.y = baseY + Math.sin(time * 0.5) * 0.08;
      group.rotation.y = Math.sin(time * 0.15) * 0.04;
    },
    dispose() {
      mesh.geometry.dispose();
      const mats = mesh.material as THREE.Material[];
      const unique = two ? [front, back, left, right, top, bottom] : mats;
      for (const mat of unique) {
        if (!sideMat) {
          const physical = mat as THREE.MeshPhysicalMaterial;
          physical.map?.dispose();
          physical.roughnessMap?.dispose();
          physical.bumpMap?.dispose();
          physical.emissiveMap?.dispose();
        }
        mat.dispose();
      }
    },
  };
}

/** Position monde du monolithe de marbre. */
export const MARBLE_MONOLITH_WORLD_XZ = {
  x: LANDING_SCENE_LAYOUT.marble.x,
  z: LANDING_SCENE_LAYOUT.marble.z,
};

export const MARBLE_MONOLITH_VIEW = {
  camera: new THREE.Vector3(-2, 5.4, 16),
  target: new THREE.Vector3(
    MARBLE_MONOLITH_WORLD_XZ.x,
    5.8,
    MARBLE_MONOLITH_WORLD_XZ.z,
  ),
};
