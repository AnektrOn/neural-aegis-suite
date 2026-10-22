/**
 * /dev/prism-landing WebGL monolith. Pipeline: RenderPass → Bloom → ACES ToneMappingEffect → SMAA (encodeOutput once).
 * Tone owner: ToneMappingEffect only (renderer stays NoToneMapping; exposure is renderer.toneMappingExposure).
 * Bloom owner: BloomEffect in HDR, before tone map. The slit shader stays readable with bloom at 0.
 * Halo: additive portal core, base sprite, column and top spill (the cosmic-monolith reference).
 * Debug: ?monolithDebug=hdr|nobloom|nogodrays|nopost &exposure=0.95 &bloom=0.48 &glow=1.15 &adapt=1
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Water } from "three/addons/objects/Water.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createMonolithColorPipeline } from "../monolith/monolithColorPipeline";
import { createMonolithPortalGlow } from "../monolith/monolithPortalGlow";
import { MonolithExposureMeter } from "../monolith/monolithExposureMeter";
import { SLIT_HDR } from "../monolith/monolithEmissiveLevels";
import {
  readMonolithPipelineTuning,
  type MonolithPipelineTuning,
} from "../monolith/monolithPipelineDebug";
import { applyMonolithRendererTone } from "../monolith/monolithRendererTone";
import type { MonolithPipelineDiagnostics } from "../monolith/monolithColorPipeline";
import marbleColorUrl from "../assets/textures/marble/Marble_Orange_Streaks_baseColor.png";
import marbleRoughnessUrl from "../assets/textures/marble/Marble_Orange_Streaks_roughness.png";
import marbleNormalUrl from "../assets/textures/marble/Marble_Orange_Streaks_any.png";
import terrainUrl from "../assets/gltf/snowy-mountain-terrain.glb";
import waterNormalsUrl from "../assets/textures/waternormals.jpeg";

/** Night haze — keep prism-landing.css / canvas background on this hex. */
const FOG = 0x0a0908;
const HEAT = 0xff6a22;
const SKY = 0x4a433c;
const GROUND = 0x100e0c;

const TOWER_W = 0.88;
const TOWER_D = 2.5;
const TOWER_H = 18;
const GAP = 0.7;
const TERRAIN_SPAN = 1600;
const LEFT_X = -(TOWER_W * 0.5 + GAP * 0.5);
const RIGHT_X = TOWER_W * 0.5 + GAP * 0.5;

const WATER_Y = -0.08;
const BASIN_Y = WATER_Y - 0.9;
const BASIN_R_INNER = 40;
const BASIN_R_OUTER = 72;
const WATER_TIME_SCALE = 0.02;
/** Toward the shaft (updated once the slit axis is known). */
const WATER_SUN_DIRECTION = new THREE.Vector3(0, 0.35, -1).normalize();
const DESIGN_CAMERA = new THREE.Vector3(0, 1.55, 14);
/** Marble texel density: one texture tile per N meters on pillar faces. */
const MARBLE_TILE_M = 2.4;
const GROUND_TILE_M = 6;

export type MonolithWebgpuHandle = {
  resize: (width: number, height: number) => void;
  dispose: () => void;
  getPipelineDiagnostics: () => MonolithPipelineDiagnostics;
  setTuning: (next: MonolithPipelineTuning) => void;
  setCameraBookmark: (bookmark: "near" | "design" | "far") => void;
};

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function placeTerrain(root: THREE.Object3D) {
  root.position.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z, 0.001);
  root.scale.setScalar(TERRAIN_SPAN / span);
  root.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);

  const ray = new THREE.Raycaster(
    new THREE.Vector3(0, fitted.max.y + 80, 0),
    new THREE.Vector3(0, -1, 0),
  );
  const hit = ray.intersectObject(root, true)[0];
  root.position.y -= hit ? hit.point.y : fitted.max.y;
  root.updateMatrixWorld(true);
}

function sculptTerrain(root: THREE.Object3D) {
  const world = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    let geo = child.geometry as THREE.BufferGeometry;
    geo = mergeVertices(geo.index ? geo.toNonIndexed() : geo, 1e-3);
    child.geometry = geo;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    inv.copy(child.matrixWorld).invert();
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      world.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      const r = Math.hypot(world.x, world.z);
      if (r < BASIN_R_OUTER) {
        const t = smoothstep(BASIN_R_INNER, BASIN_R_OUTER, r);
        const basin = BASIN_Y - 0.35 * (1 - r / BASIN_R_OUTER);
        world.y = Math.min(world.y, THREE.MathUtils.lerp(basin, world.y, t));
      }
      uv[i * 2] = world.x / GROUND_TILE_M;
      uv[i * 2 + 1] = world.z / GROUND_TILE_M;
      world.applyMatrix4(inv);
      pos.setXYZ(i, world.x, world.y, world.z);
    }
    pos.needsUpdate = true;
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  });
}

function sampleGroundY(
  root: THREE.Object3D,
  x: number,
  z: number,
  topY: number,
) {
  const ray = new THREE.Raycaster(
    new THREE.Vector3(x, topY, z),
    new THREE.Vector3(0, -1, 0),
  );
  return ray.intersectObject(root, true)[0]?.point.y ?? 0;
}

function hash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 5) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

type GroundSet = {
  map: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  normalMap: THREE.DataTexture;
  aoMap: THREE.DataTexture;
};

function makeGroundTextures(size = 1024): GroundSet {
  const height = new Float32Array(size * size);
  const color = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const ao = new Uint8Array(size * size * 4);
  const scale = 6 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const n = fbm(x * scale, y * scale, 3);
      const grit = fbm(x * scale * 7, y * scale * 7, 11, 3);
      height[i] = n * 0.75 + grit * 0.25;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const h = height[i];
      const xl = height[y * size + ((x - 1 + size) % size)];
      const xr = height[y * size + ((x + 1) % size)];
      const yu = height[((y - 1 + size) % size) * size + x];
      const yd = height[((y + 1) % size) * size + x];
      const dx = (xr - xl) * 6;
      const dy = (yd - yu) * 6;
      const len = Math.hypot(dx, dy, 1);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = 1 / len;
      const v = 0.22 + h * 0.55;
      color[i * 4] = Math.floor(v * 42);
      color[i * 4 + 1] = Math.floor(v * 36);
      color[i * 4 + 2] = Math.floor(v * 30);
      color[i * 4 + 3] = 255;
      const r = 0.55 + h * 0.4;
      rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = Math.floor(r * 255);
      rough[i * 4 + 3] = 255;
      normal[i * 4] = Math.floor((nx * 0.5 + 0.5) * 255);
      normal[i * 4 + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      normal[i * 4 + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      normal[i * 4 + 3] = 255;
      ao[i * 4] = ao[i * 4 + 1] = ao[i * 4 + 2] = Math.floor((0.35 + h * 0.5) * 255);
      ao[i * 4 + 3] = 255;
    }
  }
  const mk = (data: Uint8Array, colorSpace: THREE.ColorSpace) => {
    const tex = new THREE.DataTexture(data, size, size);
    tex.colorSpace = colorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  };
  return {
    map: mk(color, THREE.SRGBColorSpace),
    roughnessMap: mk(rough, THREE.NoColorSpace),
    normalMap: mk(normal, THREE.NoColorSpace),
    aoMap: mk(ao, THREE.NoColorSpace),
  };
}

function makeStretchedTexture(src: THREE.Texture, repeatX: number, repeatY: number) {
  const tex = src.clone();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

function makeRockGeometry() {
  const geo = new THREE.DodecahedronGeometry(1, 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 1.7 + 3, v.y * 1.7 + v.z * 1.3, 5, 3);
    v.multiplyScalar(0.72 + n * 0.55);
    pos.setXYZ(i, v.x, v.y * 0.72, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return mergeVertices(geo, 1e-4);
}

function scatterRocks(rocks: THREE.InstancedMesh, count: number) {
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s3 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  let placed = 0;
  let seed = 1;
  while (placed < count) {
    const rx = hash(seed, 1, 2) * 2 - 1;
    const rz = hash(seed, 2, 2);
    const rs = hash(seed, 3, 2);
    seed++;
    const x = rx * 11;
    const z = 3 + rz * 11;
    if (Math.abs(x) < 1.1 && z < 9) continue;
    const scale = 0.14 + rs * rs * 0.9;
    p3.set(x, WATER_Y - scale * 0.35, z);
    e.set(
      hash(seed, 4, 2) * 0.6,
      hash(seed, 5, 2) * Math.PI * 2,
      hash(seed, 6, 2) * 0.5,
    );
    q.setFromEuler(e);
    s3.set(
      scale * (0.8 + hash(seed, 7, 2) * 0.5),
      scale,
      scale * (0.8 + hash(seed, 8, 2) * 0.5),
    );
    m4.compose(p3, q, s3);
    rocks.setMatrixAt(placed, m4);
    placed++;
  }
  rocks.instanceMatrix.needsUpdate = true;
}

function scaleBoxUVs(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let g = 0; g < geo.groups.length; g++) {
    const group = geo.groups[g];
    const [fw, fh] = faces[g];
    const idx = geo.index!;
    for (let i = group.start; i < group.start + group.count; i++) {
      const v = idx.getX(i);
      uv.setXY(
        v,
        uv.getX(v) * (fw / MARBLE_TILE_M),
        uv.getY(v) * (fh / MARBLE_TILE_M),
      );
    }
  }
  uv.needsUpdate = true;
}

function makePillarGeometry(h: number) {
  const geo = new THREE.BoxGeometry(TOWER_W, h, TOWER_D, 1, 1, 1);
  scaleBoxUVs(geo, TOWER_W, h, TOWER_D);
  return geo;
}

/** HDR emissive plane in the gap (no side faces — those alias into a bright crack). */
function makeSlabGeometry(width: number, height: number) {
  const geo = new THREE.PlaneGeometry(width, height, 1, 72);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / height + 0.5;
    const base = Math.max(0, 1 - t / 0.14);
    const mid = Math.max(0, 1 - Math.abs(t - 0.28) / 0.42);
    const fade = 1 - smoothstep(0.55, 1, t);
    const heat = (SLIT_HDR.peakBase * base + SLIT_HDR.peakMid * mid) * fade;
    colors[i * 3] = heat;
    colors[i * 3 + 1] = heat * SLIT_HDR.greenRatio;
    colors[i * 3 + 2] = heat * SLIT_HDR.blueRatio;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

function makeEnvironmentMap(renderer: THREE.WebGLRenderer) {
  const envScene = new THREE.Scene();
  const sky = new THREE.SphereGeometry(50, 32, 16);
  const colors = new Float32Array(sky.attributes.position.count * 3);
  const p = sky.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / 50 * 0.5 + 0.5;
    const warm = new THREE.Color(0x3a1a0c);
    const haze = new THREE.Color(0x2b2724);
    const c = warm.clone().lerp(haze, smoothstep(0.1, 0.7, t));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  sky.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  envScene.add(
    new THREE.Mesh(
      sky,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }),
    ),
  );
  const slit = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 3.2, 1.1) }),
  );
  slit.position.set(0, 4, -12);
  envScene.add(slit);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();
  sky.dispose();
  slit.geometry.dispose();
  return tex;
}

/**
 * Shaft sits behind the slit on the design-camera axis and aims back through the gap.
 * The shadow ortho covers the gap and the inner pillar faces. It stops before the
 * outer silhouette, so sky beside the monument stays outside the godray volume.
 */
function aimShaftThroughSlit(
  light: THREE.DirectionalLight,
  slitCenter: THREE.Vector3,
) {
  const toSlit = new THREE.Vector3().subVectors(slitCenter, DESIGN_CAMERA);
  const camDist = Math.max(toSlit.length(), 0.001);
  toSlit.multiplyScalar(1 / camDist);
  const back = 36;
  light.position.copy(slitCenter).addScaledVector(toSlit, back);
  light.target.position.copy(slitCenter).addScaledVector(toSlit, -8);
  light.target.updateMatrixWorld();

  const cam = light.shadow.camera;
  const halfFrustum = GAP * 0.5 + TOWER_W * 0.35;
  cam.near = back - TOWER_D - 4;
  cam.far = back + camDist + 8;
  cam.left = -halfFrustum;
  cam.right = halfFrustum;
  const halfH = TOWER_H * 0.46;
  cam.top = halfH;
  cam.bottom = -halfH;
  cam.updateProjectionMatrix();
  light.shadow.bias = -0.00018;
  light.shadow.normalBias = 0.006;

  WATER_SUN_DIRECTION.copy(light.position).sub(slitCenter).normalize();
}

function canvasSize(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;
  const width = Math.max(
    parent?.clientWidth || 0,
    canvas.clientWidth || 0,
    window.innerWidth,
    2,
  );
  const height = Math.max(
    parent?.clientHeight || 0,
    canvas.clientHeight || 0,
    window.innerHeight,
    2,
  );
  return { width, height };
}

export async function createMonolithWebgpuScene(
  canvas: HTMLCanvasElement,
): Promise<MonolithWebgpuHandle> {
  const { width: startW, height: startH } = canvasSize(canvas);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(startW, startH, false);
  renderer.setClearColor(FOG, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  const pipelineTuning = readMonolithPipelineTuning();
  applyMonolithRendererTone(renderer, true, pipelineTuning.exposure);

  const envMap = makeEnvironmentMap(renderer);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.FogExp2(FOG, 0.012);
  scene.environment = envMap;

  const camera = new THREE.PerspectiveCamera(
    42,
    Math.max(startW / Math.max(startH, 1), 0.1),
    0.12,
    2400,
  );
  camera.position.copy(DESIGN_CAMERA);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 4.2, 0);
  // Design camera sits below the slit (phi > π/2). A cap under 90° clamps the hero view up to the horizon.
  controls.maxPolarAngle = Math.PI * 0.64;
  controls.minDistance = 1.4;
  controls.maxDistance = 90;
  controls.update();

  scene.add(new THREE.HemisphereLight(SKY, GROUND, 0.16));
  const fill = new THREE.DirectionalLight(0xc4b8ae, 0.12);
  fill.position.set(0, 8, 22);
  fill.castShadow = false;
  scene.add(fill);

  // Godrays: re-aimed through the slit once pillar feet are known.
  const shaft = new THREE.DirectionalLight(HEAT, 0.2);
  shaft.castShadow = true;
  shaft.shadow.mapSize.set(2048, 2048);
  scene.add(shaft);
  scene.add(shaft.target);
  aimShaftThroughSlit(shaft, new THREE.Vector3(0, TOWER_H * 0.5, 0));

  const loader = new THREE.TextureLoader();
  const [marbleMap, marbleRough, marbleNormal, waterNormalsSrc] =
    await Promise.all([
      loader.loadAsync(marbleColorUrl),
      loader.loadAsync(marbleRoughnessUrl),
      loader.loadAsync(marbleNormalUrl),
      loader.loadAsync(waterNormalsUrl),
    ]);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  for (const tex of [marbleMap, marbleRough, marbleNormal]) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = maxAniso;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
  }
  marbleMap.colorSpace = THREE.SRGBColorSpace;
  marbleRough.colorSpace = THREE.NoColorSpace;
  marbleNormal.colorSpace = THREE.NoColorSpace;

  const pillarGeo = makePillarGeometry(TOWER_H);
  const pillarMat = new THREE.MeshPhysicalMaterial({
    map: marbleMap,
    roughnessMap: marbleRough,
    color: 0x7a6c60,
    roughness: 0.92,
    metalness: 0,
    clearcoat: 0,
    envMapIntensity: 0.28,
  });

  const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
  const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
  for (const p of [pillarL, pillarR]) {
    p.castShadow = true;
    p.receiveShadow = true;
    scene.add(p);
  }

  const ground = makeGroundTextures(1024);
  for (const tex of Object.values(ground)) tex.anisotropy = maxAniso;
  ground.aoMap.channel = 0;
  const groundMat = new THREE.MeshStandardMaterial({
    map: ground.map,
    roughnessMap: ground.roughnessMap,
    normalMap: ground.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    aoMap: ground.aoMap,
    aoMapIntensity: 0.9,
    roughness: 1,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  groundMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterY = { value: WATER_Y };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vWorldY;",
      )
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vWorldY;\nuniform float uWaterY;",
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor *= mix(0.32, 1.0, smoothstep(uWaterY, uWaterY + 4.0, vWorldY));",
      );
  };

  const gltf = await new GLTFLoader().loadAsync(terrainUrl);
  const terrain = gltf.scene;
  placeTerrain(terrain);
  sculptTerrain(terrain);
  terrain.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = groundMat;
    child.castShadow = false;
    child.receiveShadow = true;
  });
  scene.add(terrain);

  const topY =
    new THREE.Box3().setFromObject(terrain).max.y + 80;
  const footL = sampleGroundY(terrain, LEFT_X, 0, topY);
  const footR = sampleGroundY(terrain, RIGHT_X, 0, topY);
  const footY = (footL + footR) * 0.5;
  const pillarY = footY + TOWER_H * 0.5 - 0.08;
  pillarL.position.set(LEFT_X, pillarY, 0);
  pillarR.position.set(RIGHT_X, pillarY, 0);
  aimShaftThroughSlit(shaft, new THREE.Vector3(0, pillarY, 0));

  const slabH = TOWER_H * 0.96;
  const slabMat = new THREE.MeshBasicMaterial();
  const slab = new THREE.Mesh(makeSlabGeometry(GAP * 0.96, slabH), slabMat);
  slab.position.set(0, pillarY, 0.2);
  slab.castShadow = false;
  slab.receiveShadow = false;
  scene.add(slab);
  const portalGlow = createMonolithPortalGlow(
    scene,
    slab,
    footY,
    pillarY,
    TOWER_H,
  );
  slabMat.dispose();

  const waterNormals = makeStretchedTexture(waterNormalsSrc, 1, 5);
  waterNormals.anisotropy = maxAniso;
  const water = new Water(new THREE.PlaneGeometry(400, 400), {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals,
    sunDirection: WATER_SUN_DIRECTION,
    sunColor: 0xff8a3a,
    waterColor: 0x05040a,
    distortionScale: 0.4,
    fog: true,
    alpha: 0.9,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER_Y, 0);
  const mirrorPass = water.onBeforeRender;
  water.onBeforeRender = (r, s, c, g, m, grp) => {
    const gl = r as THREE.WebGLRenderer;
    const autoShadows = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    shaft.visible = false;
    mirrorPass.call(water, r, s, c, g, m, grp);
    shaft.visible = true;
    gl.shadowMap.autoUpdate = autoShadows;
  };
  scene.add(water);
  const waterTime = (water.material as THREE.ShaderMaterial).uniforms.time;

  const rockGeo = makeRockGeometry();
  const rockMat = new THREE.MeshPhysicalMaterial({
    color: 0x14100d,
    roughness: 0.32,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.5,
    normalMap: ground.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  const rockCount = 70;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  scatterRocks(rocks, rockCount);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  // Base geometry bounds ~1 m at origin; instances span ~±11 m — without this, nothing draws.
  rocks.frustumCulled = false;
  scene.add(rocks);

  const colorPipeline = createMonolithColorPipeline(
    renderer,
    scene,
    camera,
    pipelineTuning,
  );
  const { composer } = colorPipeline;
  const exposureMeter = new MonolithExposureMeter(renderer);
  let meterFrame = 0;

  let running = true;
  let lastT = performance.now();
  const loop = () => {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) * 0.001);
    lastT = now;
    controls.update();
    waterTime.value = now * 0.001 * WATER_TIME_SCALE;
    try {
      colorPipeline.tick(dt, renderer, pipelineTuning, exposureMeter);
      portalGlow.update(
        now * 0.001,
        pipelineTuning.glowIntensity,
        colorPipeline.godraysPass.enabled,
      );
      composer.render();
    } catch (err) {
      canvas.dataset.monolithError =
        err instanceof Error ? err.message : String(err);
      running = false;
      return;
    }
    meterFrame += 1;
    if (
      pipelineTuning.adaptationEnabled &&
      meterFrame % 12 === 0 &&
      !exposureMeter.diagnostics.readbackPending
    ) {
      requestAnimationFrame(() => {
        if (!running) return;
        exposureMeter.sampleHdrTexture(composer.readBuffer.texture);
      });
    }
  };
  renderer.setAnimationLoop(loop);

  if (import.meta.env.DEV) {
    console.info("[monolith] pipeline", {
      contract: "monolithVisualContract.ts",
      debug: pipelineTuning.debugView,
      query:
        "?monolithDebug=hdr|nobloom|nogodrays|nopost & exposure & bloom & adapt=1",
    });
  }

  const bookmarks = {
    near: { position: new THREE.Vector3(0, 1.7, 6), target: new THREE.Vector3(0, 5, 0) },
    design: { position: DESIGN_CAMERA.clone(), target: new THREE.Vector3(0, 4.2, 0) },
    far: { position: new THREE.Vector3(0, 2.4, 55), target: new THREE.Vector3(0, 6, 0) },
  } as const;

  return {
    setTuning(next) {
      Object.assign(pipelineTuning, next);
    },
    setCameraBookmark(bookmark) {
      const shot = bookmarks[bookmark];
      camera.position.copy(shot.position);
      controls.target.copy(shot.target);
      controls.update();
    },
    getPipelineDiagnostics: () =>
      colorPipeline.getDiagnostics(renderer, exposureMeter, pipelineTuning),
    resize(width, height) {
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height, false);
    },
    dispose() {
      running = false;
      renderer.setAnimationLoop(null);
      controls.dispose();
      exposureMeter.dispose();
      envMap.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      marbleMap.dispose();
      marbleRough.dispose();
      marbleNormal.dispose();
      groundMat.dispose();
      for (const tex of Object.values(ground)) tex.dispose();
      waterNormals.dispose();
      waterNormalsSrc.dispose();
      water.geometry.dispose();
      water.material.dispose();
      portalGlow.dispose();
      slab.geometry.dispose();
      rockGeo.dispose();
      rockMat.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
