import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { R3F_MARBLE_GLOW_DEFAULTS } from "./r3fMarbleMonolithConstants";

let rectAreaUniformsReady = false;

export function initR3fRectAreaLightUniforms() {
  if (!rectAreaUniformsReady) {
    RectAreaLightUniformsLib.init();
    rectAreaUniformsReady = true;
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

type MarbleFaceMaps = {
  color: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
};

function buildMarbleFaceMaps(seed: number, width: number, height: number): MarbleFaceMaps {
  const rand = mulberry32(seed);
  const mkCanvas = () => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  };

  const colorC = mkCanvas();
  const roughC = mkCanvas();
  const emisC = mkCanvas();
  const col = colorC.getContext("2d")!;
  const rgh = roughC.getContext("2d")!;
  const ems = emisC.getContext("2d")!;

  col.fillStyle = "#07070a";
  col.fillRect(0, 0, width, height);
  rgh.fillStyle = "rgb(70,70,70)";
  rgh.fillRect(0, 0, width, height);
  ems.fillStyle = "#000";
  ems.fillRect(0, 0, width, height);

  for (let i = 0; i < 72; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = (0.12 + rand() * 0.4) * width;
    const a = 0.02 + rand() * 0.05;
    const g = col.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(68,66,72,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    col.fillStyle = g;
    col.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const img = col.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 6;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 1.05;
  }
  col.putImageData(img, 0, 0);

  const unit = width / 512;
  const veinCount = 5 + Math.floor(rand() * 4);
  for (let v = 0; v < veinCount; v++) {
    let px = rand() * width;
    let py = rand() * height;
    let ang = rand() * Math.PI * 2;
    const len = 28 + Math.floor(rand() * 40);
    const baseW = (1.2 + rand() * 2.8) * unit;

    for (let s = 0; s < len; s++) {
      ang += (rand() - 0.5) * 0.5;
      const step = (5 + rand() * 9) * unit;
      const nx = px + Math.cos(ang) * step;
      const ny = py + Math.sin(ang) * step;
      const lw = Math.max(0.6, baseW * (1 - (s / len) * 0.65));

      ems.lineCap = "round";
      ems.strokeStyle = "rgba(255,165,55,0.85)";
      ems.lineWidth = lw;
      ems.shadowColor = "rgba(255,140,40,0.85)";
      ems.shadowBlur = 8 * unit;
      ems.beginPath();
      ems.moveTo(px, py);
      ems.lineTo(nx, ny);
      ems.stroke();
      ems.shadowBlur = 0;
      ems.strokeStyle = "rgba(255,220,150,0.95)";
      ems.lineWidth = lw * 0.42;
      ems.beginPath();
      ems.moveTo(px, py);
      ems.lineTo(nx, ny);
      ems.stroke();

      col.lineCap = "round";
      col.strokeStyle = "rgba(110,75,28,0.5)";
      col.lineWidth = lw * 1.35;
      col.beginPath();
      col.moveTo(px, py);
      col.lineTo(nx, ny);
      col.stroke();

      const rg = rgh.createLinearGradient(px, py, nx, ny);
      rg.addColorStop(0, `rgba(90,85,80,0.35)`);
      rg.addColorStop(0.5, `rgba(40,38,36,0.5)`);
      rg.addColorStop(1, `rgba(100,95,90,0.3)`);
      rgh.strokeStyle = rg;
      rgh.lineWidth = lw * 1.1;
      rgh.beginPath();
      rgh.moveTo(px, py);
      rgh.lineTo(nx, ny);
      rgh.stroke();

      px = nx;
      py = ny;
    }
  }

  const toTex = (canvas: HTMLCanvasElement, colorSpace: THREE.ColorSpace) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = colorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    color: toTex(colorC, THREE.SRGBColorSpace),
    rough: toTex(roughC, THREE.NoColorSpace),
    emissive: toTex(emisC, THREE.SRGBColorSpace),
  };
}

function makeSideMaterial(maps: MarbleFaceMaps): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    map: maps.color,
    roughnessMap: maps.rough,
    bumpMap: maps.rough,
    bumpScale: 0.55,
    emissiveMap: maps.emissive,
    emissive: new THREE.Color("#ffffff"),
    emissiveIntensity: 1.75,
    roughness: 1,
    metalness: 0.15,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });
  mat.fog = true;
  return mat;
}

export type R3fMarbleMonolithMaterialOptions = {
  seed?: number;
  glow?: string;
  size: [number, number, number];
};

export function createR3fMarbleMonolithMaterials(options: R3fMarbleMonolithMaterialOptions) {
  const seed = options.seed ?? 11;
  const glow = options.glow ?? R3F_MARBLE_GLOW_DEFAULTS.color;

  const front = buildMarbleFaceMaps(seed, 512, 2048);
  const back = buildMarbleFaceMaps(seed + 1, 512, 2048);
  const left = buildMarbleFaceMaps(seed + 2, 256, 2048);
  const right = buildMarbleFaceMaps(seed + 3, 256, 2048);

  const frontMat = makeSideMaterial(front);
  const backMat = makeSideMaterial(back);
  const leftMat = makeSideMaterial(left);
  const rightMat = makeSideMaterial(right);

  const top = new THREE.MeshPhysicalMaterial({
    color: "#0b0b0e",
    roughness: 0.35,
    metalness: 0.2,
    clearcoat: 0.6,
  });
  top.fog = true;

  const bottom = new THREE.MeshStandardMaterial({
    color: "#1a1006",
    emissive: new THREE.Color(glow),
    emissiveIntensity: R3F_MARBLE_GLOW_DEFAULTS.bottomEmissiveIntensity,
    roughness: 0.6,
  });
  bottom.fog = true;

  const materials: THREE.Material[] = [rightMat, leftMat, top, bottom, frontMat, backMat];

  const dispose = () => {
    const disposeMaps = (m: MarbleFaceMaps) => {
      m.color.dispose();
      m.rough.dispose();
      m.emissive.dispose();
    };
    disposeMaps(front);
    disposeMaps(back);
    disposeMaps(left);
    disposeMaps(right);
    for (const mat of materials) mat.dispose();
  };

  return { materials, dispose };
}
