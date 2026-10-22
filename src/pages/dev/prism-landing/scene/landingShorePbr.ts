import * as THREE from "three";
import {
  createVilleneuveShoreTextures,
  SHORE_WORLD_TEX_SCALE,
  type LandingShoreTextures,
} from "./landingShoreGround";

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

/** PBR rive — ne pas importer depuis le chunk de première frame. */
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

  if (albedoEntry && roughnessEntry && normalEntry) {
    const loader = new THREE.TextureLoader();
    const [albedo, roughness, normal] = await Promise.all([
      loader.loadAsync(albedoEntry.url),
      loader.loadAsync(roughnessEntry.url),
      loader.loadAsync(normalEntry.url),
    ]);
    configureShoreMap(albedo, true);
    configureShoreMap(roughness, false);
    configureShoreMap(normal, false);
    const dxNormal =
      normalEntry.stem.includes("normal-dx") || normalEntry.stem.includes("-dx");
    const normalScale = new THREE.Vector2(1, dxNormal ? -1 : 1);
    return {
      albedo,
      normal,
      roughness,
      source: "pbr",
      normalScale,
      dispose() {
        albedo.dispose();
        normal.dispose();
        roughness.dispose();
      },
    };
  }

  const procedural = createVilleneuveShoreTextures();
  return { ...procedural, source: "procedural" };
}
