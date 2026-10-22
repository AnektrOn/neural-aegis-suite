import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import characterFbxUrl from "../assets/gltf/human_body_base_cartoon.fbx?url";
import breathingIdleUrl from "../assets/gltf/Breathing Idle.fbx?url";
import walkingUrl from "../assets/gltf/Walking.fbx?url";
import charBaseTexUrl from "../assets/gltf/human_body_base_cartoon/Char_base.png?url";
import { loadMotifectLocomotionClips, resetMotifectFbxCache } from "./prismLandingCharacterFbx";
import { getCharacterSkeletonBoneSet } from "./motifectFbxRemap";
import {
  CHARACTER_GROUND_DEFORM_SEGMENTS,
  CHARACTER_GROUND_DEFORM_SIZE,
  LANDING_ENABLE_CHARACTER_GROUND_DEFORM,
} from "../layout/prismSceneConstants";

/** Hauteur cible (pieds → sommet), en mètres. */
export const TARGET_CHARACTER_HEIGHT = 1.68;

const REFERENCE_WEIGHT = 70;
const WALK_REF_SPEED = 1.4;
const MIN_SKELETON_TRACKS = 6;

export type GroundSurface = "earth" | "water";
export type CharacterDriveMode = "external" | "internal";

export type InnerLight = {
  id: string;
  /** Position dans le repère du personnage : pieds à y=0, +z = devant (mètres). */
  position: { x: number; y: number; z: number };
  color: THREE.ColorRepresentation;
  intensity: number;
  radius: number;
};

export type CharacterAssets = {
  modelUrl: string;
  idleUrl?: string;
  walkUrl?: string;
  bodyTextureUrl?: string;
};

export type PrismLandingCharacter = {
  pivot: THREE.Group;
  lookHeight: number;
  weight: number;
  ground: { earth: GroundDeformer };
  setDriveMode: (mode: CharacterDriveMode) => void;
  setWeight: (kg: number) => void;
  setVelocity: (v: THREE.Vector3) => void;
  setSurfaceAt: (fn: (x: number, z: number) => GroundSurface) => void;
  setInnerLight: (id: string, patch: Partial<Omit<InnerLight, "id">>) => void;
  addInnerLight: (light: InnerLight) => void;
  removeInnerLight: (id: string) => void;
  getInnerLights: () => InnerLight[];
  setBodyColors: (edge: THREE.ColorRepresentation, core: THREE.ColorRepresentation) => void;
  update: (dt: number) => void;
  dispose: () => void;
};

/* -------------------------------------------------------------------------- */
/*  Sol déformable (terre uniquement sur la landing)                           */
/* -------------------------------------------------------------------------- */

export class GroundDeformer {
  readonly mesh: THREE.Mesh;
  readonly kind: GroundSurface;

  private readonly size: number;
  private readonly seg: number;
  private readonly dx: number;
  private readonly h: Float32Array;
  private readonly v: Float32Array;
  private readonly rest: Float32Array;
  private readonly geo: THREE.PlaneGeometry;
  private readonly mat: THREE.Material;

  constructor(
    kind: GroundSurface,
    opts?: { size?: number; segments?: number },
  ) {
    this.kind = kind;
    this.size = opts?.size ?? CHARACTER_GROUND_DEFORM_SIZE;
    this.seg = opts?.segments ?? CHARACTER_GROUND_DEFORM_SEGMENTS;
    this.dx = this.size / this.seg;

    const count = (this.seg + 1) * (this.seg + 1);
    this.h = new Float32Array(count);
    this.v = new Float32Array(count);
    this.rest = new Float32Array(count);

    this.geo = new THREE.PlaneGeometry(this.size, this.size, this.seg, this.seg);
    this.geo.rotateX(-Math.PI / 2);

    this.mat = new THREE.MeshStandardMaterial({
      color: 0x3b3a36,
      roughness: 0.95,
    });

    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.name = `Ground_${kind}`;
    this.mesh.receiveShadow = true;
    /** Simulation d’empreintes seulement — le sol visible est le terrain de la scène. */
    this.mesh.visible = false;
  }

  /** Impact en coordonnées locales du mesh (centre du plan = 0,0). */
  impact(localX: number, localZ: number, strength: number, radius: number) {
    const n = this.seg;
    const row = n + 1;
    const cx = (localX / this.size + 0.5) * n;
    const cz = (localZ / this.size + 0.5) * n;
    const r = Math.ceil(radius / this.dx) + 1;
    const z0 = Math.max(1, Math.floor(cz - r));
    const z1 = Math.min(n - 1, Math.ceil(cz + r));
    const x0 = Math.max(1, Math.floor(cx - r));
    const x1 = Math.min(n - 1, Math.ceil(cx + r));

    for (let iz = z0; iz <= z1; iz++) {
      for (let ix = x0; ix <= x1; ix++) {
        const dxw = (ix - cx) * this.dx;
        const dzw = (iz - cz) * this.dx;
        const g = Math.exp(-(dxw * dxw + dzw * dzw) / (2 * radius * radius));
        const i = iz * row + ix;
        this.h[i] -= strength * g;
        this.rest[i] -= strength * g * 0.4;
      }
    }
  }

  step(dt: number) {
    const n = this.seg;
    const row = n + 1;
    const { h, v, rest } = this;
    const stiffness = 40;
    const damping = 9;
    const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
    const d = dt / sub;

    for (let s = 0; s < sub; s++) {
      for (let iz = 1; iz < n; iz++) {
        for (let ix = 1; ix < n; ix++) {
          const i = iz * row + ix;
          const acc = -stiffness * (h[i] - rest[i]) - damping * v[i];
          v[i] += acc * d;
        }
      }
      for (let iz = 1; iz < n; iz++) {
        for (let ix = 1; ix < n; ix++) {
          const i = iz * row + ix;
          h[i] += v[i] * d;
        }
      }
    }

    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < h.length; i++) pos.setY(i, h[i]);
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

function prepareCharacterMeshes(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.visible = true;
  });
}

/** Texture Mixamo visible même en Obscurité (pas d’éclairage scène requis). */
function ensureRenderableMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = mats.map((mat) => {
      const map =
        mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshBasicMaterial
          ? mat.map
          : null;
      const color =
        mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshBasicMaterial
          ? mat.color
          : new THREE.Color(0xffffff);
      const basic = new THREE.MeshBasicMaterial({
        color,
        map,
        side: THREE.DoubleSide,
        fog: false,
      });
      mat.dispose();
      return basic;
    });
    mesh.material = next.length === 1 ? next[0] : next;
  });
}

async function applyCartoonBodyTexture(root: THREE.Object3D, textureUrl: string) {
  try {
    const tex = await new THREE.TextureLoader().loadAsync(textureUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
      }
    });
  } catch (err) {
    console.warn("[Prism landing] Texture personnage non chargée:", err);
  }
}

function skeletonUsesMixamo(root: THREE.Object3D) {
  for (const name of getCharacterSkeletonBoneSet(root)) {
    if (name.startsWith("mixamorig")) return true;
  }
  return false;
}

const IDLE_CLIP_RE = /idle|breath|stand|neutral|rest/i;
const WALK_CLIP_RE = /walk|marche|locomotion|move|run/i;

function pickClip(clips: THREE.AnimationClip[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const hit = clips.find((c) => pattern.test(c.name));
    if (hit) return hit;
  }
  return null;
}

function clipMatchesSkeleton(clip: THREE.AnimationClip, boneNames: Set<string>) {
  let hits = 0;
  for (const track of clip.tracks) {
    const boneName = track.name.split(".")[0];
    if (boneNames.has(boneName)) hits++;
  }
  return hits >= MIN_SKELETON_TRACKS;
}

async function resolveLocomotionClips(
  model: THREE.Object3D,
  modelClips: THREE.AnimationClip[],
  assets: CharacterAssets,
): Promise<{ idle: THREE.AnimationClip | null; walk: THREE.AnimationClip | null }> {
  let idle: THREE.AnimationClip | null = null;
  let walk: THREE.AnimationClip | null = null;

  if (assets.idleUrl) {
    idle = (await loadObject(assets.idleUrl)).clips[0] ?? null;
  }
  if (assets.walkUrl) {
    walk = (await loadObject(assets.walkUrl)).clips[0] ?? null;
  }

  const boneNames = getCharacterSkeletonBoneSet(model);
  const bodyClips = modelClips.filter((c) => clipMatchesSkeleton(c, boneNames));

  if (!idle) idle = pickClip(bodyClips, [IDLE_CLIP_RE]);
  if (!walk) walk = pickClip(bodyClips, [WALK_CLIP_RE]);

  if ((!idle || !walk) && boneNames.size > 0 && !skeletonUsesMixamo(model)) {
    try {
      const fbxClips = await loadMotifectLocomotionClips(model);
      if (!idle) {
        idle =
          fbxClips.find((c: THREE.AnimationClip) => c.name === "idle_neutral") ??
          pickClip(fbxClips, [IDLE_CLIP_RE]) ??
          fbxClips[0] ??
          null;
      }
      if (!walk) {
        walk =
          fbxClips.find((c: THREE.AnimationClip) => c.name === "walk_forward") ??
          pickClip(fbxClips, [WALK_CLIP_RE]) ??
          fbxClips[1] ??
          null;
      }
    } catch (err) {
      console.warn("[Prism landing] Locomotion FBX failed:", err);
    }
  }

  return { idle, walk };
}

function filterClipToSkeleton(clip: THREE.AnimationClip, root: THREE.Object3D): THREE.AnimationClip {
  const boneNames = getCharacterSkeletonBoneSet(root);
  const tracks = clip.tracks.filter((track) => {
    const boneName = track.name.split(".")[0];
    return boneNames.has(boneName);
  });
  if (tracks.length === 0) return clip;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

async function loadObject(url: string): Promise<{ object: THREE.Object3D; clips: THREE.AnimationClip[] }> {
  if (/\.fbx(\?|$)/i.test(url)) {
    const object = await new FBXLoader().loadAsync(url);
    return { object, clips: object.animations };
  }
  const gltf = await new GLTFLoader().loadAsync(url);
  return { object: gltf.scene, clips: gltf.animations };
}

function lerpAngle(a: number, b: number, t: number) {
  const d = ((((b - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}

const _footAlign = new THREE.Vector3();

/** Pieds à y=0 dans le repère du pivot (Mixamo : os LeftFoot / RightFoot). */
function alignModelFeetToPivot(
  pivot: THREE.Group,
  model: THREE.Object3D,
  footL: THREE.Object3D | null,
  footR: THREE.Object3D | null,
) {
  pivot.add(model);
  model.updateMatrixWorld(true);

  let lowestFoot: number | null = null;
  for (const foot of [footL, footR]) {
    if (!foot) continue;
    foot.getWorldPosition(_footAlign);
    pivot.worldToLocal(_footAlign);
    lowestFoot = lowestFoot === null ? _footAlign.y : Math.min(lowestFoot, _footAlign.y);
  }
  if (lowestFoot !== null) {
    model.position.y -= lowestFoot;
  }

  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y -= bounds.min.y;
}

const DEFAULT_ASSETS: CharacterAssets = {
  modelUrl: characterFbxUrl,
  idleUrl: breathingIdleUrl,
  walkUrl: walkingUrl,
  bodyTextureUrl: charBaseTexUrl,
};

async function buildCharacter(assets: CharacterAssets): Promise<PrismLandingCharacter> {
  const pivot = new THREE.Group();
  pivot.name = "PrismLandingCharacter";

  const { object: model, clips: modelClips } = await loadObject(assets.modelUrl);
  prepareCharacterMeshes(model);
  ensureRenderableMaterials(model);
  if (assets.bodyTextureUrl) {
    await applyCartoonBodyTexture(model, assets.bodyTextureUrl);
  }

  let footL: THREE.Object3D | null = null;
  let footR: THREE.Object3D | null = null;
  model.traverse((o) => {
    const bone = o.name.replace(/[:_]/g, "").toLowerCase();
    if (/mixamorigleftfoot$/.test(bone) || /leftfoot$/.test(bone) || /footl$/.test(bone)) footL = o;
    if (/mixamorigrightfoot$/.test(bone) || /rightfoot$/.test(bone) || /footr$/.test(bone)) footR = o;
  });

  const box = new THREE.Box3().setFromObject(model);
  const scale = TARGET_CHARACTER_HEIGHT / Math.max(box.max.y - box.min.y, 1e-3);
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
  alignModelFeetToPivot(pivot, model, footL, footR);

  const mixer = new THREE.AnimationMixer(model);
  const { idle: rawIdle, walk: rawWalk } = await resolveLocomotionClips(model, modelClips, assets);
  const idleClip = rawIdle ? filterClipToSkeleton(rawIdle, model) : null;
  const walkClip = rawWalk ? filterClipToSkeleton(rawWalk, model) : null;
  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  if (!idle && !walk) {
    console.warn("[Prism landing] Aucune animation idle/marche pour le personnage.");
  }
  idle?.play();
  if (walk) {
    walk.play();
    walk.setEffectiveWeight(0);
  }
  if (idle) idle.setEffectiveWeight(1);

  const ground = {
    earth: new GroundDeformer("earth", {
      size: CHARACTER_GROUND_DEFORM_SIZE,
      segments: CHARACTER_GROUND_DEFORM_SEGMENTS,
    }),
  };
  ground.earth.mesh.position.y = 0;
  const groundSimEnabled = LANDING_ENABLE_CHARACTER_GROUND_DEFORM;

  let driveMode: CharacterDriveMode = "external";
  let weight = REFERENCE_WEIGHT;
  let surfaceAt: (x: number, z: number) => GroundSurface = () => "earth";
  const velocity = new THREE.Vector3();
  let speed = 0;
  let blend = 0;
  let lastHalf = -1;
  let time = 0;

  const lights = new Map<string, InnerLight>();
  const footWorld = new THREE.Vector3();
  const footLocal = new THREE.Vector3();

  const addInnerLight = (l: InnerLight) => {
    lights.set(l.id, { ...l, position: { ...l.position } });
  };
  const removeInnerLight = (id: string) => void lights.delete(id);
  const setInnerLight = (id: string, patch: Partial<Omit<InnerLight, "id">>) => {
    const cur = lights.get(id);
    if (!cur) return;
    lights.set(id, { ...cur, ...patch, position: patch.position ?? cur.position });
  };

  const onFootstep = () => {
    if (!groundSimEnabled) return;
    let foot: THREE.Object3D | null = null;
    if (footL && footR) {
      const a = (footL as THREE.Object3D).getWorldPosition(new THREE.Vector3()).y;
      const b = (footR as THREE.Object3D).getWorldPosition(new THREE.Vector3()).y;
      foot = a < b ? footL : footR;
    }
    if (foot) foot.getWorldPosition(footWorld);
    else pivot.getWorldPosition(footWorld);

    if (surfaceAt(footWorld.x, footWorld.z) === "water") return;

    ground.earth.mesh.worldToLocal(footLocal.copy(footWorld));
    const load = weight / REFERENCE_WEIGHT;
    const strength = 0.05 * load * THREE.MathUtils.clamp(speed / WALK_REF_SPEED, 0.4, 1.5);
    const radius = 0.16 + 0.05 * load;
    ground.earth.impact(footLocal.x, footLocal.z, strength, radius);
  };

  const update = (dt: number) => {
    time += dt;

    if (driveMode === "internal") {
      pivot.position.addScaledVector(velocity, dt);
    }

    speed = Math.hypot(velocity.x, velocity.z);
    if (driveMode === "internal" && speed > 0.05) {
      const yaw = Math.atan2(velocity.x, velocity.z);
      pivot.rotation.y = lerpAngle(pivot.rotation.y, yaw, 1 - Math.exp(-10 * dt));
    }

    blend = THREE.MathUtils.damp(blend, speed > 0.05 ? 1 : 0, 8, dt);
    idle?.setEffectiveWeight(1 - blend);
    walk?.setEffectiveWeight(blend);
    if (walk) walk.timeScale = THREE.MathUtils.clamp(speed / WALK_REF_SPEED, 0.5, 1.6);
    mixer.update(dt);

    if (walk && blend > 0.3) {
      const cyc = (walk.time / walk.getClip().duration) % 1;
      const half = Math.floor(cyc * 2);
      if (half !== lastHalf) {
        lastHalf = half;
        onFootstep();
      }
    }

    pivot.updateMatrixWorld(true);
    if (groundSimEnabled) ground.earth.step(dt);
  };

  const dispose = () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) mat?.dispose();
    });
    ground.earth.dispose();
    pivot.clear();
  };

  return {
    pivot,
    lookHeight: TARGET_CHARACTER_HEIGHT * 0.82,
    get weight() {
      return weight;
    },
    ground,
    setDriveMode: (mode) => {
      driveMode = mode;
    },
    setWeight: (kg) => {
      weight = Math.max(1, kg);
    },
    setVelocity: (v) => {
      velocity.copy(v);
      velocity.y = 0;
    },
    setSurfaceAt: (fn) => {
      surfaceAt = fn;
    },
    setInnerLight,
    addInnerLight,
    removeInnerLight,
    getInnerLights: () => [...lights.values()].map((l) => ({ ...l, position: { ...l.position } })),
    setBodyColors: () => {},
    update,
    dispose,
  } as PrismLandingCharacter;
}

export function characterHasRenderableMesh(pivot: THREE.Object3D) {
  let found = false;
  pivot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && (mesh.geometry?.attributes?.position?.count ?? 0) > 0) {
      found = true;
    }
  });
  return found;
}

/** Une instance par contrôleur walk — pas de singleton global (évite pivot vide après dispose). */
export function createPrismLandingCharacter(
  assets: CharacterAssets = DEFAULT_ASSETS,
): Promise<PrismLandingCharacter> {
  return buildCharacter(assets);
}

export function disposePrismLandingCharacterMotifectCache() {
  resetMotifectFbxCache();
}

/** Compat HMR / anciens imports — ne pas utiliser en nouveau code. */
export const loadPrismLandingCharacter = createPrismLandingCharacter;
export const disposePrismLandingCharacterGlobal = disposePrismLandingCharacterMotifectCache;
