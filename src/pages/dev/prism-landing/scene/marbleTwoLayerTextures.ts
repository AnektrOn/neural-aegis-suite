/**
 * Monolithe 2 calques : base PBR (Fab) + veines fines procédurales (style ref kintsugi).
 * Pas d’asphalt crack — trop large pour ce bloc.
 */
import * as THREE from "three";

const marblePngUrls = import.meta.glob<string>("../assets/textures/marble/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

function stem(path: string) {
  return path.split("/").pop()?.toLowerCase() ?? "";
}

function pickUrl(match: (name: string, path: string) => boolean): string | undefined {
  for (const [path, url] of Object.entries(marblePngUrls)) {
    if (match(stem(path), path.toLowerCase())) return url;
  }
  return undefined;
}

function configureMap(
  tex: THREE.Texture,
  srgb: boolean,
  repeatX = 0.45,
  repeatY = 1.35,
) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
}

async function loadTex(url: string, srgb: boolean, repeatX?: number, repeatY?: number) {
  const tex = await new THREE.TextureLoader().loadAsync(url);
  configureMap(tex, srgb, repeatX, repeatY);
  return tex;
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

/** Veines dorées très fines — masque blanc sur noir, une variation par face. */
export function buildSubtleVeinMask(seed: number, W: number, H: number): THREE.CanvasTexture {
  const rand = mulberry32(seed);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  const unit = W / 512;

  const vein = (
    px: number,
    py: number,
    ang: number,
    len: number,
    w: number,
    depth: number,
  ) => {
    let x = px;
    let y = py;
    for (let s = 0; s < len; s++) {
      ang += (rand() - 0.5) * 0.38;
      const step = (4 + rand() * 7) * unit;
      const nx = x + Math.cos(ang) * step;
      const ny = y + Math.sin(ang) * step;
      const lw = Math.max(0.35 * unit, w * (1 - (s / len) * 0.65));

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(255, 248, 235, ${0.62 + rand() * 0.28})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = lw * 0.42;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      if (depth < 2 && rand() < 0.055) {
        vein(
          nx,
          ny,
          ang + (rand() > 0.5 ? 1 : -1) * (0.35 + rand() * 0.55),
          Math.floor(len * (0.28 + rand() * 0.22)),
          w * 0.55,
          depth + 1,
        );
      }
      x = nx;
      y = ny;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break;
    }
  };

  const trunks = 5 + Math.floor(W / 512) * 3;
  for (let i = 0; i < trunks; i++) {
    const fromBase = rand() < 0.72;
    const startY = fromBase ? H * (0.62 + rand() * 0.36) : H * rand();
    const startX = W * (0.15 + rand() * 0.7);
    const angle =
      -Math.PI / 2 + (rand() - 0.5) * 1.1 + (rand() > 0.5 ? 0.25 : -0.25);
    vein(
      startX,
      startY,
      angle,
      32 + Math.floor(rand() * 48),
      (0.45 + rand() * 0.55) * unit,
      0,
    );
  }

  const boosted = ctx.getImageData(0, 0, W, H);
  const bd = boosted.data;
  for (let i = 0; i < bd.length; i += 4) {
    const v = Math.min(255, Math.floor(bd[i] * 1.15));
    bd[i] = bd[i + 1] = bd[i + 2] = v;
  }
  ctx.putImageData(boosted, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  configureMap(tex, false, 1, 1);
  return tex;
}

function createWhiteStubTexture() {
  const data = new Uint8Array([255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export type MarbleTwoLayerTextures = {
  source: "pbr";
  baseColor: THREE.Texture;
  baseNormal: THREE.Texture;
  baseRoughness: THREE.Texture;
  veinColor: THREE.Texture;
  /** @deprecated Utiliser `veinMasks` (une par face latérale). */
  veinMask: THREE.Texture;
  veinMasks: readonly [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];
  dispose: () => void;
};

export async function resolveMarbleTwoLayerTextures(): Promise<MarbleTwoLayerTextures | null> {
  const baseColorUrl = pickUrl(
    (n, p) => p.includes("/base/") && (n.includes("basecolor") || n.includes("base_color")),
  );
  const baseNormalUrl = pickUrl((n, p) => p.includes("/base/") && n.includes("normal"));
  const baseRoughUrl = pickUrl((n, p) => p.includes("/base/") && n.includes("roughness"));

  if (!baseColorUrl || !baseNormalUrl || !baseRoughUrl) {
    return null;
  }

  const [baseColor, baseNormal, baseRoughness] = await Promise.all([
    loadTex(baseColorUrl, true, 0.42, 1.25),
    loadTex(baseNormalUrl, false, 0.42, 1.25),
    loadTex(baseRoughUrl, false, 0.42, 1.25),
  ]);

  const veinMasks = [
    buildSubtleVeinMask(41, 512, 2048),
    buildSubtleVeinMask(53, 512, 2048),
    buildSubtleVeinMask(67, 384, 2048),
    buildSubtleVeinMask(79, 384, 2048),
  ] as const;

  const veinColor = createWhiteStubTexture();

  return {
    source: "pbr",
    baseColor,
    baseNormal,
    baseRoughness,
    veinColor,
    veinMask: veinMasks[0],
    veinMasks,
    dispose() {
      baseColor.dispose();
      baseNormal.dispose();
      baseRoughness.dispose();
      veinColor.dispose();
      for (const m of veinMasks) m.dispose();
    },
  };
}
