import * as THREE from "three";

function intHash(x: number, y: number, seed: number) {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) / 4294967296;
}

function periodicNoise(x: number, y: number, px: number, py: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py;
  const y1 = (y0 + 1) % py;
  const a = intHash(x0, y0, seed);
  const b = intHash(x1, y0, seed);
  const c = intHash(x0, y1, seed);
  const d = intHash(x1, y1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function periodicFbm(x: number, y: number, octaves: number, px: number, py: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * periodicNoise(x * f, y * f, px * f, py * f, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

function heightFieldToNormalTexture(
  heights: Float32Array,
  size: number,
  strength: number,
  repeatX: number,
  repeatY: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  const sample = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return heights[wy * size + wx];
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);
      const dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const idx = (y * size + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const normalTex = new THREE.CanvasTexture(canvas);
  normalTex.colorSpace = THREE.NoColorSpace;
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(repeatX, repeatY);
  normalTex.anisotropy = 8;
  return normalTex;
}

export function createLandingMonolithTextures() {
  const size = 1024;
  const heights = new Float32Array(size * size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const empty = new THREE.Texture();
    return { roughnessTex: empty, normalTex: empty };
  }
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const base = periodicFbm(nx * 8, ny * 16, 6, 8, 16, 31);
      const streaks = periodicFbm(nx * 32, ny * 4, 4, 32, 4, 47);
      const microPits = Math.pow(periodicFbm(nx * 64, ny * 64, 3, 64, 64, 73), 2.8);
      const grain = intHash(x, y, 19) * 0.08;
      const h = base * 0.52 + streaks * 0.28 - microPits * 0.25 + grain;
      heights[y * size + x] = h;
      const rough = Math.min(0.75, Math.max(0.16, 0.28 + (1.0 - base) * 0.28 + microPits * 0.35));
      const c = Math.floor(rough * 255);
      const idx = (y * size + x) * 4;
      data[idx] = c;
      data[idx + 1] = c;
      data[idx + 2] = c;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const roughnessTex = new THREE.CanvasTexture(canvas);
  roughnessTex.colorSpace = THREE.NoColorSpace;
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;
  roughnessTex.repeat.set(1, 3);
  roughnessTex.anisotropy = 8;
  const normalTex = heightFieldToNormalTexture(heights, size, 3.6, 1, 3);
  return { roughnessTex, normalTex };
}

export function createLandingJambGlowTexture(u0: number) {
  const w = 128;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const v = 1 - y / (h - 1);
    const vert = 0.16 + 0.84 * Math.exp(-v * 2.8) + 0.22 * Math.exp(-(1 - v) * 16);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const depth = Math.exp(-Math.pow((u - u0) / 0.24, 2));
      const val = Math.min(1, vert * (0.18 + 0.82 * depth)) * 255;
      const i = (y * w + x) * 4;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function createLandingRadialGlowTexture(r: number, g: number, b: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
  grad.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, 0.45)`);
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.10)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
