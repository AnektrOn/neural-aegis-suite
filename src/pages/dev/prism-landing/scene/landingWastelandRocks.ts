/**
 * Rochers Fab (GLB) pour la landing wasteland — `assets/gltf/Rocks/*.glb`.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PORTAL_CENTER_X, PORTAL_WORLD_Z } from "../layout/prismSceneConstants";
import { sampleLandingTerrainHeight } from "../layout/landingTerrainHeight";

const rockGlbUrls = import.meta.glob<string>("../assets/gltf/Rocks/*.glb", {
  eager: true,
  query: "?url",
  import: "default",
});

type RockKind = "hero" | "medium" | "cluster" | "slab";

type RockTemplate = {
  name: string;
  kind: RockKind;
  root: THREE.Object3D;
  baseMaxDim: number;
};

const PLACEMENT_BY_KIND: Record<
  RockKind,
  { instances: number; targetSize: number; sizeJitter: number }
> = {
  hero: { instances: 2, targetSize: 11, sizeJitter: 0.22 },
  medium: { instances: 8, targetSize: 2.6, sizeJitter: 0.35 },
  cluster: { instances: 10, targetSize: 3.2, sizeJitter: 0.3 },
  slab: { instances: 5, targetSize: 4.5, sizeJitter: 0.25 },
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function classifyRock(fileStem: string): RockKind {
  const s = fileStem.toLowerCase();
  if (/cliff|huge|coastal/.test(s)) return "hero";
  if (/slab/.test(s)) return "slab";
  if (/rocks/.test(s)) return "cluster";
  return "medium";
}

function pivotRockToGround(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
  const size = box.getSize(new THREE.Vector3());
  return Math.max(size.x, size.y, size.z, 0.001);
}

function enableShadows(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
}

async function loadRockTemplate(url: string, fileStem: string): Promise<RockTemplate> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  enableShadows(root);
  const baseMaxDim = pivotRockToGround(root);
  return { name: fileStem, kind: classifyRock(fileStem), root, baseMaxDim };
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      m?.dispose();
    }
  });
}

export function disposeLandingWastelandRocks(group: THREE.Group) {
  disposeObject3D(group);
}

/**
 * Charge tous les GLB du dossier Rocks et les disperse sur le terrain (côté caméra).
 */
export async function loadLandingWastelandRocks(): Promise<THREE.Group> {
  const out = new THREE.Group();
  out.name = "landingWastelandRocks";

  const entries = Object.entries(rockGlbUrls);
  if (entries.length === 0) return out;

  const templates = await Promise.all(
    entries.map(([path, url]) => {
      const stem = path.split("/").pop()?.replace(/\.glb$/i, "") ?? "rock";
      return loadRockTemplate(url, stem);
    }),
  );

  const rand = mulberry32(481516);
  const portalX = PORTAL_CENTER_X;
  const portalZ = PORTAL_WORLD_Z;

  for (const template of templates) {
    const spec = PLACEMENT_BY_KIND[template.kind];
    let placed = 0;
    for (let attempt = 0; attempt < spec.instances * 14 && placed < spec.instances; attempt++) {
      const z = portalZ + 5 + rand() * 34;
      const spreadX = template.kind === "hero" ? 28 : 20;
      const x = portalX + (rand() - 0.5) * spreadX;
      const y = sampleLandingTerrainHeight(x, z);

      const clone = template.root.clone(true);
      const size =
        spec.targetSize * (1 - spec.sizeJitter * 0.5 + rand() * spec.sizeJitter);
      const scale = size / template.baseMaxDim;
      clone.scale.setScalar(scale);
      clone.rotation.y = rand() * Math.PI * 2;
      clone.rotation.x = (rand() - 0.5) * 0.12;
      clone.rotation.z = (rand() - 0.5) * 0.1;
      clone.position.set(x, y, z);
      out.add(clone);
      placed++;
    }
    disposeObject3D(template.root);
  }

  return out;
}
