import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { MonolithSlitCore } from "./MonolithSlitCore";
import marbleColorUrl from "../assets/textures/marble/Marble_Orange_Streaks_baseColor.png";
import marbleRoughnessUrl from "../assets/textures/marble/Marble_Orange_Streaks_roughness.png";
import terrainUrl from "../assets/gltf/snowy-mountain-terrain.glb";

RectAreaLightUniformsLib.init();

/** AEGIS dark tokens — :root in src/index.css (light left aside). */
const VOID = "#0d0f13";
const FOG = "#0c161c";
const CARD = "#162026";
const TEAL = "#18bec7";
const INFO = "#33b8e6";
const SLIT = "#d19d7b";

/** 1 unit ≈ 1 m. Width −60%, depth unchanged. */
const TOWER_W = 0.88;
const TOWER_D = 2.5;
const TOWER_H = 18;
const GAP = 0.7;
const SLIT_W = 0.48;
const SLIT_H = TOWER_H;
const TERRAIN_SPAN = 1600;
const LEFT_X = -(TOWER_W * 0.5 + GAP * 0.5);
const RIGHT_X = TOWER_W * 0.5 + GAP * 0.5;

function usePillarMaps() {
  const maps = useTexture({
    map: marbleColorUrl,
    roughnessMap: marbleRoughnessUrl,
  });

  useLayoutEffect(() => {
    for (const tex of [maps.map, maps.roughnessMap]) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.4, 3.2);
      tex.anisotropy = 8;
    }
    maps.map.colorSpace = THREE.SRGBColorSpace;
    maps.roughnessMap.colorSpace = THREE.NoColorSpace;
  }, [maps]);

  return maps;
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
  const hits = ray.intersectObject(root, true);
  return hits[0]?.point.y ?? null;
}

function footprintYs(root: THREE.Object3D, cx: number, cz: number, topY: number) {
  const hw = TOWER_W * 0.45;
  const hd = TOWER_D * 0.45;
  const pts: [number, number][] = [
    [cx + LEFT_X - hw, cz - hd],
    [cx + LEFT_X, cz],
    [cx + LEFT_X + hw, cz + hd],
    [cx + RIGHT_X - hw, cz - hd],
    [cx + RIGHT_X, cz],
    [cx + RIGHT_X + hw, cz + hd],
  ];
  const ys = pts.map(([x, z]) => sampleGroundY(root, x, z, topY));
  if (ys.some((y) => y == null)) return null;
  return ys as number[];
}

function findFlatPad(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root);
  const topY = box.max.y + 80;
  const midY = (box.min.y + box.max.y) * 0.5;
  let best: { x: number; z: number; y: number; score: number } | null = null;

  const reach = Math.min(box.max.x, box.max.z) * 0.22;
  const step = 18;

  for (let x = -reach; x <= reach; x += step) {
    for (let z = -reach; z <= reach; z += step) {
      const ys = footprintYs(root, x, z, topY);
      if (!ys) continue;
      const min = Math.min(...ys);
      const max = Math.max(...ys);
      const spread = max - min;
      const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
      if (mean > midY + (box.max.y - box.min.y) * 0.35) continue;
      if (spread > 1.6) continue;
      const dist = Math.hypot(x, z);
      const score = spread * 8 + dist * 0.004 + mean * 0.001;
      if (!best || score < best.score) {
        best = { x, z, y: mean, score };
      }
    }
  }

  if (best) return best;

  const originYs = footprintYs(root, 0, 0, topY);
  const y = originYs
    ? originYs.reduce((a, b) => a + b, 0) / originYs.length
    : box.max.y;
  return { x: 0, z: 0, y, score: 99 };
}

function Terrain() {
  const { scene } = useGLTF(terrainUrl);
  const root = useMemo(() => {
    const clone = scene.clone(true);
    const relief = new THREE.MeshStandardMaterial({
      color: CARD,
      roughness: 0.94,
      metalness: 0.04,
      envMapIntensity: 0,
    });
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.material = relief;
      child.castShadow = false;
      child.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  useLayoutEffect(() => {
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

    const pad = findFlatPad(root);
    root.position.x -= pad.x;
    root.position.z -= pad.z;
    root.position.y -= pad.y;
    root.updateMatrixWorld(true);
  }, [root]);

  return <primitive object={root} />;
}

function MonolithTower({
  x,
  map,
  roughnessMap,
}: {
  x: number;
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
}) {
  return (
    <mesh position={[x, TOWER_H * 0.5 - 0.08, 0]} castShadow receiveShadow>
      <boxGeometry args={[TOWER_W, TOWER_H, TOWER_D]} />
      <meshStandardMaterial
        map={map}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
        envMapIntensity={0}
      />
    </mesh>
  );
}

export function MonolithScene() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const pillarMaps = usePillarMaps();

  useLayoutEffect(() => {
    target.position.set(0, 4.2, 0.6);
    const dir = dirRef.current;
    if (!dir) return;
    dir.target = target;
    dir.target.updateMatrixWorld();
  }, [target]);

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fogExp2 attach="fog" args={[FOG, 0.016]} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        target={[0, 4.2, 0]}
        maxPolarAngle={Math.PI * 0.495}
        minDistance={1.4}
        maxDistance={90}
      />
      <hemisphereLight intensity={0.22} color={TEAL} groundColor={VOID} />
      <primitive object={target} />
      <directionalLight
        ref={dirRef}
        position={[8, 22, -18]}
        intensity={0.55}
        color={INFO}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={2}
        shadow-camera-far={80}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <pointLight
        position={[0, 8.2, 0]}
        color={SLIT}
        intensity={42}
        distance={22}
        decay={2}
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight
        position={[0, 3.2, -0.35]}
        color={SLIT}
        intensity={22}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[0, 1.1, 0.45]}
        color={INFO}
        intensity={8}
        distance={8}
        decay={2}
      />
      <rectAreaLight
        width={SLIT_W}
        height={SLIT_H}
        intensity={14}
        color={SLIT}
        position={[0, SLIT_H * 0.5, 0]}
        rotation={[0, Math.PI, 0]}
      />
      <MonolithSlitCore width={SLIT_W} height={SLIT_H} />
      <MonolithTower
        x={LEFT_X}
        map={pillarMaps.map}
        roughnessMap={pillarMaps.roughnessMap}
      />
      <MonolithTower
        x={RIGHT_X}
        map={pillarMaps.map}
        roughnessMap={pillarMaps.roughnessMap}
      />
      <Terrain />
    </>
  );
}
