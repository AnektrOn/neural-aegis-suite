import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import {
  buildMeshPlacementField,
  type MeshPlacementField,
} from "./dienChanMeshPlacementField";
import {
  BQC_MARKER_USER_DATA_KEY,
  headMeshSpanY,
  MARKER_RADIUS_RATIO,
  MARKER_RADIUS_SPOT_RATIO,
  rebuildBqcMarkersOnHead,
  type BqcMarker3d,
} from "./dienChanBqcMarkers3d";
import {
  CAMERA_Z_DEFAULT,
  clampCameraZ,
  isTapGesture,
} from "./dienChanFaceInteraction";
import { readAegisWirePalette } from "./dienChanAegisPalette";
import { paintZoneColors, type DienChanZoneId } from "./dienChanFaceZones";

/** Face Cap GLB — wireframe head (no eyes / teeth). Geometry intact + bloom. */
const FACECAP_URL = "/models/gltf/facecap.glb";
const BASIS_PATH = "/basis/";

const HIDE_MESH_NAMES = new Set(["mesh_0", "mesh_1", "mesh_3"]);
const HEAD_MESH_NAME = "mesh_2";
const FILL_SHELL_NAME = "head-black-fill";

function isLightTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

function freezeMorphs(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.morphTargetInfluences) return;
    for (let i = 0; i < obj.morphTargetInfluences.length; i++) {
      obj.morphTargetInfluences[i] = 0;
    }
  });
}

function shouldHideMesh(obj: THREE.Mesh): boolean {
  if (HIDE_MESH_NAMES.has(obj.name)) return true;
  const n = obj.name.toLowerCase();
  if (/eye|pupil|iris|cornea|tooth|teeth|gum|dent/.test(n)) return true;
  const verts = obj.geometry?.attributes?.position?.count ?? 0;
  if (obj.name !== HEAD_MESH_NAME && verts > 0 && verts < 1200) return true;
  return false;
}

export type DienChanPointCoord = { x: number; y: number };

export type DienChanWireframeFaceHandle = {
  resetView: () => void;
};

interface DienChanWireframeFaceProps {
  className?: string;
  /** Ignoré en 3D — seuls les points BQC sont mis en avant (zones = UI / 2D si besoin). */
  activeZones?: DienChanZoneId[];
  spotlightPointId?: number | null;
  activePoints?: number[];
  hoveredPoint?: number | null;
  pointsCoordinates?: Record<number, DienChanPointCoord[]>;
  onPointSelect?: (pointId: number) => void;
  reducedMotion?: boolean;
}

/** Face Cap : coque noire opaque + fil de fer par-dessus (masque l’intérieur sans déformer le mesh). */
export const DienChanWireframeFace = forwardRef<
  DienChanWireframeFaceHandle,
  DienChanWireframeFaceProps
>(function DienChanWireframeFace(
  {
    className,
    activeZones: _activeZones = [],
    spotlightPointId = null,
    activePoints = [],
    hoveredPoint = null,
    pointsCoordinates = {},
    onPointSelect,
    reducedMotion = false,
  },
  ref,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const spotlightPointRef = useRef(spotlightPointId);
  const pointsRef = useRef(activePoints);
  const coordsRef = useRef(pointsCoordinates);
  const hoveredPointRef = useRef(hoveredPoint);
  const onPointSelectRef = useRef(onPointSelect);
  const reducedMotionRef = useRef(reducedMotion);
  const markersDirtyRef = useRef(true);
  const resetViewRef = useRef<() => void>(() => {});

  spotlightPointRef.current = spotlightPointId;
  pointsRef.current = activePoints;
  coordsRef.current = pointsCoordinates;
  hoveredPointRef.current = hoveredPoint;
  onPointSelectRef.current = onPointSelect;
  reducedMotionRef.current = reducedMotion;

  useImperativeHandle(ref, () => ({
    resetView: () => resetViewRef.current(),
  }));

  useEffect(() => {
    markersDirtyRef.current = true;
  }, [activePoints, pointsCoordinates, spotlightPointId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let frameId = 0;
    let root: THREE.Object3D | null = null;
    let headMesh: THREE.Mesh | null = null;
    let ktx2Loader: KTX2Loader | null = null;
    let placementField: MeshPlacementField | null = null;
    let markersGroup: THREE.Group | null = null;
    let markers: BqcMarker3d[] = [];
    let markerGeo: THREE.SphereGeometry | null = null;
    let markerMatSpot: THREE.MeshBasicMaterial | null = null;
    let markerMatRef: THREE.MeshBasicMaterial | null = null;
    let markerHitMat: THREE.MeshBasicMaterial | null = null;
    let markerMatGlow: THREE.MeshBasicMaterial | null = null;
    let composer: EffectComposer | null = null;
    let bloom: UnrealBloomPass | null = null;
    let fillShell: THREE.Mesh | null = null;
    let pulseT = 0;

    const light = isLightTheme();
    const palette = readAegisWirePalette(light);
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let rotY = 0;
    let rotX = 0;
    let cameraZ = CAMERA_Z_DEFAULT;
    let pointerDownX = 0;
    let pointerDownY = 0;
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartCameraZ = cameraZ;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      50,
    );
    camera.position.set(0, -0.02, cameraZ);
    const lookAt = new THREE.Vector3(0, -0.02, 0);
    camera.lookAt(lookAt);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = light ? 1.0 : 1.1;
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1";
    mount.appendChild(canvas);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      palette.bloomStrength,
      palette.bloomRadius,
      palette.bloomThreshold,
    );
    composer.addPass(bloom);

    markerMatSpot = new THREE.MeshBasicMaterial({
      color: 0xff4545,
      depthTest: true,
      depthWrite: true,
      transparent: true,
      opacity: 1,
      toneMapped: false,
    });
    markerMatGlow = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    markerMatRef = new THREE.MeshBasicMaterial({
      color: palette.markerHex,
      depthTest: true,
      depthWrite: true,
      transparent: true,
      opacity: 0.95,
      toneMapped: false,
    });
    markerHitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });

    resetViewRef.current = () => {
      rotX = 0;
      rotY = 0;
      cameraZ = CAMERA_Z_DEFAULT;
      camera.position.z = cameraZ;
    };

    scene.add(new THREE.AmbientLight(palette.ambientHex, light ? 0.85 : 0.48));
    const key = new THREE.DirectionalLight(0xfff6ee, light ? 1.05 : 0.72);
    key.position.set(0.8, 1.4, 2.2);
    scene.add(key);

    const fillMat = new THREE.MeshBasicMaterial({
      color: palette.fillHex,
      wireframe: false,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: light ? 0.82 : 0.94,
      depthWrite: false,
      depthTest: true,
      vertexColors: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    const applyWireLineColors = () => {
      if (!headMesh) return;
      paintZoneColors(headMesh.geometry, [], palette.wireBaseRgb, palette.wireBaseRgb);
    };

    const syncPlacementBounds = () => {
      if (!headMesh || !root) return;
      root.updateMatrixWorld(true);
      headMesh.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      placementField = buildMeshPlacementField(headMesh, camera);
    };

    const withCanonicalHeadPose = (fn: () => void) => {
      if (!root) return;
      const prevX = root.rotation.x;
      const prevY = root.rotation.y;
      root.rotation.x = 0;
      root.rotation.y = 0;
      root.updateMatrixWorld(true);
      fn();
      root.rotation.x = prevX;
      root.rotation.y = prevY;
      root.updateMatrixWorld(true);
    };

    const rebuildMarkers = () => {
      if (
        !headMesh ||
        !markersGroup ||
        !markerMatSpot ||
        !markerMatRef ||
        !markerMatGlow ||
        !markerHitMat ||
        !root
      ) {
        return;
      }
      if (!markerGeo) markerGeo = new THREE.SphereGeometry(1, 12, 12);

      withCanonicalHeadPose(() => {
        syncPlacementBounds();
        if (!placementField) return;
        markers = rebuildBqcMarkersOnHead(headMesh!, markersGroup!, {
          pointIds: pointsRef.current,
          coords: coordsRef.current,
          spotlightId: spotlightPointRef.current,
          placementField: placementField!,
          camera,
          sharedGeo: markerGeo,
          matSpot: markerMatSpot!,
          matRef: markerMatRef!,
          matGlow: markerMatGlow!,
          hitMat: markerHitMat!,
          existing: markers,
        });
      });
      markersDirtyRef.current = false;
    };

    ktx2Loader = new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(renderer);

    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      FACECAP_URL,
      (gltf) => {
        if (cancelled) return;

        root = gltf.scene;

        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;

          if (shouldHideMesh(obj)) {
            obj.visible = false;
            return;
          }

          const prev = obj.material;
          const prevList = Array.isArray(prev) ? prev : [prev];
          for (const m of prevList) {
            m?.map?.dispose();
            m?.dispose();
          }
          obj.material = wireMat;

          if (obj.name === HEAD_MESH_NAME || !headMesh) {
            headMesh = obj;
          }
        });

        freezeMorphs(root);

        if (headMesh) {
          applyWireLineColors();

          fillShell = new THREE.Mesh(headMesh.geometry, fillMat);
          fillShell.name = FILL_SHELL_NAME;
          fillShell.renderOrder = 0;
          fillShell.frustumCulled = false;
          headMesh.add(fillShell);

          headMesh.renderOrder = 1;

          markersGroup = new THREE.Group();
          markersGroup.name = "bqc-markers";
          headMesh.add(markersGroup);
        }

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.82 / Math.max(size.y, 0.001);
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -center.y * scale + 0.14, -center.z * scale);
        root.rotation.set(0, 0, 0);

        scene.add(root);
        camera.updateMatrixWorld();
        markersDirtyRef.current = true;
        rebuildMarkers();
      },
      undefined,
      (err) => {
        console.error("[DienChan] Failed to load facecap.glb", err);
      },
    );

    const animate = () => {
      if (cancelled) return;
      if (root) freezeMorphs(root);

      if (!reducedMotionRef.current) pulseT += 0.045;

      if (root) {
        root.rotation.y = rotY;
        root.rotation.x = rotX;
      }

      camera.position.z = cameraZ;
      camera.lookAt(lookAt);
      camera.updateMatrixWorld();

      if (markersDirtyRef.current) rebuildMarkers();

      const span = headMesh ? headMeshSpanY(headMesh.geometry) : 1;
      const pulse = reducedMotionRef.current
        ? 1
        : 0.88 + 0.22 * Math.sin(pulseT * 2.4);
      const hoverId = hoveredPointRef.current;
      const hasSpotlight = spotlightPointRef.current != null;
      if (bloom) {
        bloom.strength = hasSpotlight
          ? palette.bloomStrength * 1.35
          : palette.bloomStrength;
      }
      for (const m of markers) {
        const baseR =
          span *
          (m.spotlight ? MARKER_RADIUS_SPOT_RATIO : MARKER_RADIUS_RATIO) *
          m.radiusScale;
        let r = m.spotlight ? baseR * pulse : baseR;
        if (!m.spotlight && hoverId !== null && m.id === hoverId) r *= 1.22;
        m.mesh.scale.setScalar(r);
        if (m.spotlight && markerMatGlow) {
          const glowPulse = reducedMotionRef.current ? 1 : 0.92 + 0.14 * Math.sin(pulseT * 2.4 + 0.5);
          markerMatGlow.opacity = 0.32 + 0.22 * (glowPulse - 0.92);
        }
      }

      composer?.render();
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      bloom?.setSize(w, h);
    };

    const pickBqcAtClient = (clientX: number, clientY: number) => {
      if (!markersGroup || !onPointSelectRef.current) return;
      const rect = mount.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(markersGroup.children, false);
      for (const hit of hits) {
        const id = hit.object.userData[BQC_MARKER_USER_DATA_KEY];
        if (typeof id === "number") {
          onPointSelectRef.current(id);
          return;
        }
      }
    };

    const pointerDistance = () => {
      const pts = [...activePointers.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        pinchStartDist = pointerDistance();
        pinchStartCameraZ = cameraZ;
        isDragging = false;
        return;
      }
      isDragging = true;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      mount.setPointerCapture(e.pointerId);
      mount.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (activePointers.size >= 2 && pinchStartDist > 0) {
        const dist = pointerDistance();
        const ratio = pinchStartDist / Math.max(dist, 1);
        cameraZ = clampCameraZ(pinchStartCameraZ * ratio);
        return;
      }
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      rotY += dx * 0.006;
      rotX += dy * 0.005;
      rotX = Math.max(-0.5, Math.min(0.5, rotX));
    };

    const endDrag = (e: PointerEvent) => {
      const wasDragging = isDragging;
      const endX = e.clientX;
      const endY = e.clientY;
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        pinchStartDist = 0;
      }
      if (activePointers.size === 0) {
        if (wasDragging && isTapGesture(pointerDownX, pointerDownY, endX, endY)) {
          pickBqcAtClient(endX, endY);
        }
        isDragging = false;
        if (mount.hasPointerCapture(e.pointerId)) {
          mount.releasePointerCapture(e.pointerId);
        }
        mount.style.cursor = "grab";
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraZ = clampCameraZ(cameraZ + e.deltaY * 0.0025);
    };

    mount.style.cursor = "grab";
    mount.style.touchAction = "none";
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", endDrag);
    mount.addEventListener("pointercancel", endDrag);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    onResize();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", endDrag);
      mount.removeEventListener("pointercancel", endDrag);
      mount.removeEventListener("wheel", onWheel);
      ktx2Loader?.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      wireMat.dispose();
      fillMat.dispose();
      fillShell?.parent?.remove(fillShell);
      for (const m of markers) markersGroup?.remove(m.mesh);
      markerGeo?.dispose();
      markerMatSpot?.dispose();
      markerMatRef?.dispose();
      markerMatGlow?.dispose();
      markerHitMat?.dispose();
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const geo = obj.geometry;
        if (geo && !disposedGeometries.has(geo)) {
          disposedGeometries.add(geo);
          geo.dispose();
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (
            m &&
            m !== wireMat &&
            m !== fillMat &&
            m !== markerMatSpot &&
            m !== markerMatRef &&
            m !== markerMatGlow
          ) {
            m.dispose();
          }
        }
      });
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={cn("absolute inset-0 h-full w-full bg-black", className)}>
      <div
        ref={mountRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Visage 3D — glisser pour orienter, toucher un point pour sélectionner"
      />
    </div>
  );
});
