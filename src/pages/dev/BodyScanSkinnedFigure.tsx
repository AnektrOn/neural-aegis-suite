import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cn } from "@/lib/utils";
import { SIMPLEX_NOISE_GLSL } from "@/features/toolbox/nebula/pilots/toolboxMatterShaders";
import {
  BODY_SCAN_MODEL_URL,
  ZONE_BONE_SPEC,
  ZONE_SWEEPS,
  applyZoneRegionMask,
  boneBelongsToZone,
  pingPong01,
  sweepAxisValue,
  sweepBand,
} from "./bodyScanBones";

/** Rest / settled / zone wash / sweep hotspot — self-lit vertex colors on wireframe. */
const BASE_RGB: [number, number, number] = [0.12, 0.22, 0.28];
const DONE_RGB: [number, number, number] = [0.16, 0.32, 0.38];
const ZONE_RGB: [number, number, number] = [0.35, 0.78, 0.95];
const HOT_RGB: [number, number, number] = [1.0, 1.0, 1.0];
const SWEEP_PERIOD = 3.1;
const SWEEP_SIGMA = 0.12;

type MatterUniforms = {
  u_time: { value: number };
  u_displace: { value: number };
  u_noiseScale: { value: number };
};

type SkinnedTint = {
  mesh: THREE.SkinnedMesh;
  color: THREE.BufferAttribute;
  maps: Record<string, Float32Array>;
  sweep: Record<string, Float32Array>;
  uniforms: MatterUniforms;
};

function buildZoneWeightMap(
  geometry: THREE.BufferGeometry,
  bones: THREE.Bone[],
  zoneId: string,
): Float32Array {
  const skinIndex = geometry.getAttribute("skinIndex");
  const skinWeight = geometry.getAttribute("skinWeight");
  const position = geometry.getAttribute("position");
  const count = skinIndex.count;
  const want = new Set<number>();
  bones.forEach((bone, i) => {
    if (boneBelongsToZone(bone.name, zoneId)) want.add(i);
  });
  const weights = new Float32Array(count);
  for (let v = 0; v < count; v++) {
    let w = 0;
    for (let k = 0; k < 4; k++) {
      const bi = skinIndex.getComponent(v, k);
      if (want.has(bi)) w += skinWeight.getComponent(v, k);
    }
    weights[v] = Math.min(1, w);
  }

  return applyZoneRegionMask(weights, position, zoneId);
}

function buildZoneSweepCoord(
  geometry: THREE.BufferGeometry,
  weights: Float32Array,
  zoneId: string,
): Float32Array {
  const spec = ZONE_SWEEPS[zoneId];
  const position = geometry.getAttribute("position");
  const count = position.count;
  const coords = new Float32Array(count);
  if (!spec) return coords;

  let min = Infinity;
  let max = -Infinity;
  for (let v = 0; v < count; v++) {
    if (weights[v] < 0.08) continue;
    const value = sweepAxisValue(position.getX(v), position.getY(v), position.getZ(v), spec.axis);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = Math.max(1e-5, max - min);
  for (let v = 0; v < count; v++) {
    if (weights[v] < 0.01) continue;
    const value = sweepAxisValue(position.getX(v), position.getY(v), position.getZ(v), spec.axis);
    let t = (value - min) / span;
    if (spec.invert) t = 1 - t;
    coords[v] = Math.min(1, Math.max(0, t));
  }
  return coords;
}

/** Color-only scan: zone tint + traveling hot band (no external lights). */
function paintTint(
  tint: SkinnedTint,
  zoneId: string | null,
  progress: number,
  completedIds: ReadonlySet<string>,
  pulse: number,
  sweepLive: boolean,
) {
  const { color, maps, sweep } = tint;
  const count = color.count;
  const playhead = Math.min(1, Math.max(0, progress));

  for (let i = 0; i < count; i++) {
    let r = BASE_RGB[0];
    let g = BASE_RGB[1];
    let b = BASE_RGB[2];

    for (const id of completedIds) {
      const settled = maps[id]?.[i] ?? 0;
      if (settled > 0.02) {
        const t = settled * 0.35;
        r += (DONE_RGB[0] - r) * t;
        g += (DONE_RGB[1] - g) * t;
        b += (DONE_RGB[2] - b) * t;
      }
    }

    if (zoneId && sweepLive) {
      const wgt = maps[zoneId]?.[i] ?? 0;
      if (wgt > 0.04) {
        const band = sweepBand(sweep[zoneId]?.[i] ?? 0, playhead, SWEEP_SIGMA);
        const zoneGlow = Math.min(1, wgt * 0.95);
        const hot = Math.min(1, wgt * (0.25 + 0.75 * Math.pow(band, 0.55)) * (0.9 + 0.1 * pulse));
        r += (ZONE_RGB[0] - r) * zoneGlow;
        g += (ZONE_RGB[1] - g) * zoneGlow;
        b += (ZONE_RGB[2] - b) * zoneGlow;
        r += (HOT_RGB[0] - r) * hot;
        g += (HOT_RGB[1] - g) * hot;
        b += (HOT_RGB[2] - b) * hot;
      } else {
        // Dim outside the active zone so forehead ≠ crown ≠ occiput.
        r *= 0.28;
        g *= 0.28;
        b *= 0.28;
      }
    }

    color.setXYZ(i, r, g, b);
  }
  color.needsUpdate = true;
}

function createMatterMaterial(uniforms: MatterUniforms): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    vertexColors: true,
    wireframe: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.u_time = uniforms.u_time;
    shader.uniforms.u_displace = uniforms.u_displace;
    shader.uniforms.u_noiseScale = uniforms.u_noiseScale;
    shader.vertexShader =
      `uniform float u_time;\nuniform float u_displace;\nuniform float u_noiseScale;\n${SIMPLEX_NOISE_GLSL}\n` +
      shader.vertexShader.replace(
        "#include <skinning_vertex>",
        `#include <skinning_vertex>
         transformed += objectNormal * snoise(transformed * u_noiseScale + u_time) * u_displace;
        `,
      );
  };
  material.customProgramCacheKey = () => "body-scan-wire-color";
  return material;
}

export interface BodyScanSkinnedFigureProps {
  className?: string;
  zoneId: string | null;
  zoneProgress: number;
  completedZoneIds: string[];
  isRunning: boolean;
  elapsedSec: number;
}

type ScanLiveProps = {
  zoneId: string | null;
  zoneProgress: number;
  completedZoneIds: string[];
  isRunning: boolean;
  elapsedSec: number;
};

const SCAN_PROPS = "__aegisBodyScanProps";
const SCAN_TINTS = "__aegisBodyScanTints";
const SCAN_GEN_KEY = "__aegisBodyScanGen";

function nextScanGeneration(): number {
  const g = (window as unknown as Record<string, number>)[SCAN_GEN_KEY] ?? 0;
  const next = g + 1;
  (window as unknown as Record<string, number>)[SCAN_GEN_KEY] = next;
  return next;
}

function isSkinnedMeshObj(obj: THREE.Object3D): obj is THREE.SkinnedMesh {
  const mesh = obj as THREE.SkinnedMesh;
  if (mesh.isSkinnedMesh === true) return true;
  if (obj.type === "SkinnedMesh") return true;
  return Boolean(mesh.isMesh && mesh.skeleton?.bones?.length);
}

export function BodyScanSkinnedFigure({
  className,
  zoneId,
  zoneProgress,
  completedZoneIds,
  isRunning,
  elapsedSec,
}: BodyScanSkinnedFigureProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useLayoutEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    (mount as unknown as Record<string, ScanLiveProps>)[SCAN_PROPS] = {
      zoneId,
      zoneProgress,
      completedZoneIds,
      isRunning,
      elapsedSec,
    };
    // Kick (force) the rAF loop if Strict Mode / HMR left it dead, and on every zone change.
    (mount as unknown as Record<string, ((force?: boolean) => void) | undefined>).__aegisEnsureLoop?.(true);
  }, [zoneId, zoneProgress, completedZoneIds, isRunning, elapsedSec]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    setStatus("loading");
    const bootId = String(nextScanGeneration());
    mount.dataset.bootId = bootId;
    mount.dataset.tints = "0";
    mount.dataset.lit = "0";
    mount.dataset.zone = "";
    mount.dataset.raf = "0";
    delete mount.dataset.headZones;
    delete mount.dataset.headOverlap;
    delete mount.dataset.skinned;
    delete mount.dataset.meshTypes;
    (mount as unknown as Record<string, unknown>)[SCAN_TINTS] = [];
    (mount as unknown as Record<string, ScanLiveProps>)[SCAN_PROPS] = {
      zoneId,
      zoneProgress,
      completedZoneIds,
      isRunning,
      elapsedSec,
    };

    let cancelled = false;
    let frameId = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let controls: OrbitControls | null = null;
    let loopRunning = false;

    // Only bootId gates the loop — Strict Mode / HMR must not leave a cancelled
    // closure with a live mount and no remounted effect.
    const isLive = () => mount.dataset.bootId === bootId;
    const read = (): ScanLiveProps =>
      (mount as unknown as Record<string, ScanLiveProps>)[SCAN_PROPS] ?? {
        zoneId: null,
        zoneProgress: 0,
        completedZoneIds: [],
        isRunning: false,
        elapsedSec: 0,
      };
    const readTints = (): SkinnedTint[] =>
      ((mount as unknown as Record<string, SkinnedTint[]>)[SCAN_TINTS] as SkinnedTint[]) ?? [];

    for (const child of [...mount.querySelectorAll("canvas")]) {
      child.remove();
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      80,
    );
    camera.position.set(-1.15, 1.55, 2.85);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshBasicMaterial({
        color: 0x0c0a12,
        transparent: true,
        opacity: 0.85,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.target.set(0, 1.0, 0);
    controls.minDistance = 1.6;
    controls.maxDistance = 5.2;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.update();

    const clock = new THREE.Clock();
    const completedSet = new Set<string>();
    const frozenSweep = { zone: null as string | null, progress: 0 };
    let sweepClock = 0;
    let sweepZoneId: string | null = null;
    let framedZone: string | null = null;
    const camOffset = new THREE.Vector3();
    const camSpherical = new THREE.Spherical();

    const frameZone = (zone: string | null) => {
      if (!controls || !zone || zone === framedZone) return;
      framedZone = zone;
      camOffset.copy(camera.position).sub(controls.target);
      camSpherical.setFromVector3(camOffset);
      if (
        zone === "back_head" ||
        zone === "nape" ||
        zone === "trapezius" ||
        zone === "upper_back" ||
        zone === "mid_back" ||
        zone === "lower_back" ||
        zone === "glutes" ||
        zone === "back_arms" ||
        zone === "back_forearms" ||
        zone === "back_hands" ||
        zone === "hamstrings" ||
        zone === "calves" ||
        zone === "heels" ||
        zone === "soles"
      ) {
        camSpherical.theta = Math.PI * 0.85;
      } else if (
        zone === "forehead" ||
        zone === "temples" ||
        zone === "eyes" ||
        zone === "face" ||
        zone === "jaw" ||
        zone === "mouth" ||
        zone === "throat" ||
        zone === "chest" ||
        zone === "solar_plexus" ||
        zone === "abdomen" ||
        zone === "pelvis"
      ) {
        camSpherical.theta = -0.28;
      } else if (zone === "head") {
        camSpherical.phi = Math.min(camSpherical.phi, 0.95);
        camSpherical.theta = -0.15;
      }
      camera.position.copy(controls.target).add(camOffset.setFromSpherical(camSpherical));
      controls.update();
    };

    const animate = () => {
      if (!isLive()) {
        loopRunning = false;
        return;
      }
      loopRunning = true;
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;
      const {
        zoneId: activeZone,
        zoneProgress: phaseProgress,
        completedZoneIds: completedIds,
        isRunning: running,
        elapsedSec: sessionElapsed,
      } = read();
      const live = running ? 1 : 0.22;
      const sweepLive = Boolean(activeZone) || running || sessionElapsed > 0;

      if (mixer) {
        mixer.timeScale = 0.12;
        mixer.update(dt);
      }

      completedSet.clear();
      for (const id of completedIds) completedSet.add(id);

      const pulse = 0.82 + 0.18 * Math.sin(elapsed * 2.2);
      if (!activeZone && sessionElapsed <= 0 && !running) {
        sweepClock = 0;
        sweepZoneId = null;
        frozenSweep.zone = null;
        frozenSweep.progress = 0;
      } else if (running && activeZone) {
        if (activeZone !== sweepZoneId) {
          sweepClock = 0;
          sweepZoneId = activeZone;
        }
        sweepClock += dt;
        frozenSweep.zone = activeZone;
        frozenSweep.progress = pingPong01(sweepClock / SWEEP_PERIOD);
      } else if (activeZone) {
        if (activeZone !== sweepZoneId) {
          sweepZoneId = activeZone;
          frozenSweep.progress = 0.45;
        }
        frozenSweep.zone = activeZone;
      }

      const tints = readTints();
      for (const tint of tints) {
        paintTint(tint, frozenSweep.zone, frozenSweep.progress, completedSet, pulse, sweepLive);
        tint.uniforms.u_time.value = elapsed * 0.28 * live;
        tint.uniforms.u_displace.value = running ? 0.01 : 0.004;
        const mat = tint.mesh.material;
        if (mat instanceof THREE.MeshBasicMaterial) {
          mat.opacity = running ? 0.95 : 0.82;
        }
      }

      let lit = 0;
      if (tints[0] && frozenSweep.zone) {
        const map = tints[0].maps[frozenSweep.zone];
        if (map) for (let i = 0; i < map.length; i++) if (map[i] > 0.04) lit += 1;
      }

      mount.dataset.zone = frozenSweep.zone ?? "";
      mount.dataset.running = running ? "1" : "0";
      mount.dataset.elapsed = sessionElapsed.toFixed(2);
      mount.dataset.active = activeZone ?? "";
      mount.dataset.sweep = sweepLive ? frozenSweep.progress.toFixed(3) : "";
      mount.dataset.tints = String(tints.length);
      mount.dataset.lit = String(lit);
      mount.dataset.raf = String(Number(mount.dataset.raf || "0") + 1);
      void phaseProgress;

      controls?.update();
      frameZone(frozenSweep.zone);
      renderer.render(scene, camera);
    };

    const ensureLoop = (force = false) => {
      if (!isLive()) return;
      if (loopRunning && !force) return;
      cancelAnimationFrame(frameId);
      loopRunning = true;
      frameId = requestAnimationFrame(animate);
    };
    (mount as unknown as Record<string, (force?: boolean) => void>).__aegisEnsureLoop = ensureLoop;

    const loader = new GLTFLoader();
    loader.load(
      BODY_SCAN_MODEL_URL,
      (gltf) => {
        if (!isLive()) return;

        const model = gltf.scene;
        scene.add(model);

        const skinned: THREE.SkinnedMesh[] = [];
        const foundTypes: string[] = [];
        model.traverse((obj) => {
          foundTypes.push(obj.type);
          if (!isSkinnedMeshObj(obj) && (obj as THREE.Mesh).isMesh !== true) return;
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const isJoints = mats.some((mat) => /joint/i.test(mat?.name ?? ""));
          if (isJoints) {
            mesh.visible = false;
            return;
          }
          if (isSkinnedMeshObj(obj)) skinned.push(obj);
        });
        mount.dataset.meshTypes = [...new Set(foundTypes)].join(",");
        mount.dataset.skinned = String(skinned.length);

        if (skinned.length === 0) {
          console.error("[BodyScan] No SkinnedMesh in Xbot.glb", foundTypes);
          setStatus("error");
          return;
        }

        const zoneIds = Object.keys(ZONE_BONE_SPEC);
        const tints: SkinnedTint[] = [];

        for (const mesh of skinned) {
          const prev = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of prev) {
            mat?.map?.dispose();
            mat?.dispose();
          }

          const uniforms: MatterUniforms = {
            u_time: { value: 0 },
            u_displace: { value: 0.008 },
            u_noiseScale: { value: 3.4 },
          };
          mesh.material = createMatterMaterial(uniforms);

          const count = mesh.geometry.getAttribute("position").count;
          const color = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
          for (let i = 0; i < count; i++) color.setXYZ(i, BASE_RGB[0], BASE_RGB[1], BASE_RGB[2]);
          mesh.geometry.setAttribute("color", color);

          const maps: Record<string, Float32Array> = {};
          const sweep: Record<string, Float32Array> = {};
          for (const id of zoneIds) {
            maps[id] = buildZoneWeightMap(mesh.geometry, mesh.skeleton.bones, id);
            sweep[id] = buildZoneSweepCoord(mesh.geometry, maps[id], id);
          }
          tints.push({ mesh, color, maps, sweep, uniforms });
        }

        if (!isLive()) return;
        (mount as unknown as Record<string, SkinnedTint[]>)[SCAN_TINTS] = tints;
        mount.dataset.tints = String(tints.length);

        if (tints[0]) {
          const headZones = ["forehead", "head", "back_head", "jaw"] as const;
          const counts = headZones.map((id) => {
            const m = tints[0].maps[id];
            let n = 0;
            for (let i = 0; i < m.length; i++) if (m[i] > 0.04) n += 1;
            return `${id}:${n}`;
          });
          let overlapFhBh = 0;
          let overlapFhHd = 0;
          const fh = tints[0].maps.forehead;
          const bh = tints[0].maps.back_head;
          const hd = tints[0].maps.head;
          for (let i = 0; i < fh.length; i++) {
            if (fh[i] > 0.04 && bh[i] > 0.04) overlapFhBh += 1;
            if (fh[i] > 0.04 && hd[i] > 0.04) overlapFhHd += 1;
          }
          mount.dataset.headZones = counts.join("|");
          mount.dataset.headOverlap = `fh∩bh:${overlapFhBh}|fh∩hd:${overlapFhHd}`;
        }

        const idle = gltf.animations.find((clip) => clip.name === "idle");
        if (idle) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(idle).play();
        }

        setStatus("ready");
        ensureLoop();
      },
      undefined,
      (err) => {
        console.error("[BodyScan] Failed to load Xbot.glb", err);
        if (isLive()) setStatus("error");
      },
    );

    ensureLoop();

    const onResize = () => {
      const w = Math.max(mount.clientWidth, 1);
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    onResize();

    return () => {
      cancelled = true;
      loopRunning = false;
      cancelAnimationFrame(frameId);
      if (mount.dataset.bootId === bootId) mount.dataset.bootId = "dead";
      delete (mount as unknown as Record<string, unknown>).__aegisEnsureLoop;
      ro.disconnect();
      controls?.dispose();
      mixer?.stopAllAction();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      const disposed = new Set<THREE.BufferGeometry>();
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        if (obj.geometry && !disposed.has(obj.geometry)) {
          disposed.add(obj.geometry);
          obj.geometry.dispose();
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m?.dispose();
      });
      renderer.dispose();
      void cancelled;
    };
  }, []);

  return (
    <div
      className={cn("absolute inset-0 h-full w-full", className)}
      data-scan-zone={zoneId ?? ""}
    >
      <div
        ref={mountRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Mannequin matière — glisser pour orbit, molette pour zoomer"
      />
      {status === "loading" ? (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center font-display text-[11px] uppercase tracking-[0.18em] text-white/50">
          Chargement Xbot…
        </p>
      ) : null}
      {status === "error" ? (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center text-sm text-destructive">
          Impossible de charger <code>/models/gltf/Xbot.glb</code>
        </p>
      ) : null}
    </div>
  );
}
