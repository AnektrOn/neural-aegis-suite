import * as THREE from "three";

const lutCubeUrls = import.meta.glob<string>("../assets/lut/**/*.cube", {
  eager: true,
  query: "?url",
  import: "default",
});

function finalizeLandingLut3dTexture(
  rgb01: Float32Array,
  size: number,
): THREE.Data3DTexture {
  const data = new Uint8Array(rgb01.length);
  for (let i = 0; i < rgb01.length; i++) {
    data[i] = Math.round(THREE.MathUtils.clamp(rgb01[i], 0, 1) * 255);
  }
  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RGBFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

/** LUT 3D de secours (ciné froid/chaud) si `F-6800-STD.cube` absent du repo. */
export function createLandingFallbackLutTexture(size = 17): THREE.Data3DTexture {
  const data = new Float32Array(size * size * size * 3);
  let ptr = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const rf = r / (size - 1);
        const gf = g / (size - 1);
        const bf = b / (size - 1);
        const luma = rf * 0.2126 + gf * 0.7152 + bf * 0.0722;
        const teal = Math.max(0, 0.55 - luma) * 0.12;
        const warm = Math.max(0, luma - 0.45) * 0.14;
        data[ptr++] = THREE.MathUtils.clamp(rf - teal * 0.4 + warm * 0.35, 0, 1);
        data[ptr++] = THREE.MathUtils.clamp(gf - teal * 0.15 + warm * 0.12, 0, 1);
        data[ptr++] = THREE.MathUtils.clamp(bf + teal * 0.55 - warm * 0.08, 0, 1);
      }
    }
  }
  return finalizeLandingLut3dTexture(data, size);
}

function parseCubeLut(text: string): THREE.Data3DTexture | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  let size = 0;
  const values: number[] = [];
  for (const line of lines) {
    if (line.startsWith("TITLE")) continue;
    const m = line.match(/^LUT_3D_SIZE\s+(\d+)/i);
    if (m) {
      size = Number(m[1]);
      continue;
    }
    const parts = line.split(/\s+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      values.push(parts[0], parts[1], parts[2]);
    }
  }
  if (!size || values.length !== size * size * size * 3) return null;
  const data = new Float32Array(values);
  return finalizeLandingLut3dTexture(data, size);
}

/** Charge `assets/lut/F-6800-STD.cube` si présent, sinon LUT procédurale. */
export async function resolveLandingLutTexture(): Promise<{
  texture: THREE.Data3DTexture;
  source: "cube" | "fallback";
}> {
  const preferred =
    Object.entries(lutCubeUrls).find(([p]) => /f-6800-std/i.test(p)) ??
    Object.entries(lutCubeUrls)[0];
  if (preferred) {
    try {
      const res = await fetch(preferred[1]);
      const text = await res.text();
      const parsed = parseCubeLut(text);
      if (parsed) {
        return { texture: parsed, source: "cube" };
      }
    } catch (err) {
      console.warn("LUT .cube illisible, fallback procédural:", err);
    }
  }
  return { texture: createLandingFallbackLutTexture(), source: "fallback" };
}
