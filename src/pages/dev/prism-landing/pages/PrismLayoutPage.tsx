import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { ArrowLeft, Copy, Pause, Play, Trash2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLayoutEditorPathSampler } from "../camera/layoutEditorCameraPath";
import { keyframeStepIndexForU } from "../camera/pathSamplerByKeyframeU";
import { CAMERA_PATH_PLAY_DURATION, type PathHeightMode } from "../camera/cameraPath";
import {
  attachVisibilityPauseRaf,
  resolveRendererPixelRatio,
} from "../scene/prismLandingPerformance";
import {
  DEFAULT_COMPACT_SCENE_LAYOUT,
  LANDING_CAMERA_KEYFRAMES,
  type LayoutEditorCameraKeyframe,
  type LayoutEditorVec3,
  type SceneLayoutData,
  layoutKeyframesToExportJson,
  movePortal,
  sceneLayoutToExportJson,
  withDefaultKeyframeCinematics,
} from "../layout/sceneLayout";
import {
  LANDING_SUBJECTS,
  SHOT_ANGLE_LABELS,
  SHOT_FOCUS_LABELS,
  SHOT_FRAMING_LABELS,
  SHOT_MOVEMENT_LABELS,
  SHOT_SIZE_LABELS,
  SHOT_SIZE_SUGGESTED_DISTANCE_M,
  landingSubjectLookAt,
  type LandingCameraKeyframeCinematic,
  type LandingSubjectId,
  type ShotAngle,
  type ShotFocus,
  type ShotFraming,
  type ShotMovement,
  type ShotSizeAbbrev,
} from "../cinematic/landingCinematicContract";
import {
  DRONE_COLOR_LABELS,
  DRONE_FRAME_LABELS,
  DRONE_POST_PROFILE_LABELS,
  DRONE_SPEED_LABELS,
  DRONE_STABILIZATION_LABELS,
  DRONE_TRANSITION_LABELS,
  type DroneColorStage,
  type DroneFrameTreatment,
  type DronePostProfileId,
  type DroneSpeedTreatment,
  type DroneStabilizationApproach,
  type DroneTransitionStyle,
} from "../cinematic/landingDronePostContract";
import {
  applyShotListMetadataToKeyframes,
  frameCameraForBeat,
  keyframesForPathPreset,
  LANDING_CAMERA_PATH_PRESETS,
  type LandingCameraPathPresetId,
} from "../camera/landingCameraPathPresets";
import { cameraDistanceForShot, landingSubjectBounds } from "../layout/landingSubjectBounds";
import { shotBeatForU } from "../cinematic/landingDefaultShotList";
import {
  CINEMATIC_DRONE_MOVES,
  type CinematicDroneMoveId,
} from "../cinematic/landingDroneMovesContract";
import { portalAssemblyLocalOffsets } from "../layout/portalAssemblyLayout";
import {
  LAYOUT_CUBE_CENTER_Y,
  LAYOUT_CUBE_SIZE,
  LAYOUT_MARBLE_HOVER,
  LAYOUT_MARBLE_SIZE,
  LAYOUT_PILLAR,
  LAYOUT_PORTAL_HEIGHT,
} from "../layout/prismLayoutSceneScale";
import {
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
} from "../layout/landingSceneLayout";
import { createLayoutCopyLabels } from "../scene/createLayoutCopyLabels";
import "../styles/prism-layout.css";

type DragKind = "cube" | "marble" | "portal" | "camPos" | "camLookAt" | null;

type LayoutItemKey = "cube" | "marble" | "portal";
type EditorViewMode = "top" | "perspective";

const ITEM_COLORS: Record<LayoutItemKey, number> = {
  cube: 0xf97316,
  marble: 0x94a3b8,
  portal: 0x22d3ee,
};

const PILLAR_COLOR = 0xeab308;

const FLY_MOVE_SPEED = 14;
const FLY_FAST_MULT = 2.75;
const MOUSE_LOOK_SENS = 0.003;
const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

type LookRel = { yaw: number; pitch: number; distance: number };

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function lookRelFromEyeTarget(eye: LayoutEditorVec3, target: LayoutEditorVec3): LookRel {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dz = target.z - eye.z;
  const distance = Math.max(Math.hypot(dx, dy, dz), 0.25);
  const horiz = Math.hypot(dx, dz);
  return {
    yaw: Math.atan2(dx, dz),
    pitch: Math.atan2(dy, horiz),
    distance,
  };
}

function targetFromLookRel(eye: LayoutEditorVec3, rel: LookRel): LayoutEditorVec3 {
  const cosP = Math.cos(rel.pitch);
  return {
    x: eye.x + Math.sin(rel.yaw) * cosP * rel.distance,
    y: eye.y + Math.sin(rel.pitch) * rel.distance,
    z: eye.z + Math.cos(rel.yaw) * cosP * rel.distance,
  };
}

function sceneFocus(layout: SceneLayoutData) {
  const x = (layout.cube.x + layout.marble.x + layout.portal.x) / 3;
  const z = (layout.cube.z + layout.marble.z + layout.portal.z) / 3;
  return { x, z };
}

function yawPitchFromLookAt(
  eye: THREE.Vector3,
  target: THREE.Vector3,
): { yaw: number; pitch: number } {
  const dir = target.clone().sub(eye);
  const horiz = Math.hypot(dir.x, dir.z);
  const yaw = Math.atan2(dir.x, dir.z);
  const pitch = Math.atan2(dir.y, horiz);
  return { yaw, pitch };
}

function applyFlyOrientation(cam: THREE.PerspectiveCamera, yaw: number, pitch: number) {
  const cosP = Math.cos(pitch);
  const forward = new THREE.Vector3(
    Math.sin(yaw) * cosP,
    Math.sin(pitch),
    Math.cos(yaw) * cosP,
  );
  const target = cam.position.clone().add(forward);
  cam.lookAt(target);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export default function PrismLayoutPage() {
  const [layout, setLayout] = useState<SceneLayoutData>(() =>
    DEFAULT_COMPACT_SCENE_LAYOUT,
  );
  const [pathPresetId, setPathPresetId] = useState<LandingCameraPathPresetId>("prism_landing");
  const [keyframes, setKeyframes] = useState<LayoutEditorCameraKeyframe[]>(() =>
    [...LANDING_CAMERA_KEYFRAMES],
  );
  const [camPos, setCamPos] = useState(() => ({
    ...LANDING_CAMERA_KEYFRAMES[0].position,
  }));
  const [camLookAt, setCamLookAt] = useState(() => ({
    ...LANDING_CAMERA_KEYFRAMES[0].lookAt,
  }));
  const [camHeightMode, setCamHeightMode] = useState<PathHeightMode>("drone");
  const [pathU, setPathU] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("top");
  const [followCineCam, setFollowCineCam] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LayoutItemKey>("portal");
  const [selectedKf, setSelectedKf] = useState<number | null>(null);
  const [lookRel, setLookRel] = useState<LookRel>(() =>
    lookRelFromEyeTarget(
      LANDING_CAMERA_KEYFRAMES[0].position,
      LANDING_CAMERA_KEYFRAMES[0].lookAt,
    ),
  );
  const [copiedLayout, setCopiedLayout] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(layout);
  const camPosRef = useRef(camPos);
  const camLookAtRef = useRef(camLookAt);
  const pathURef = useRef(pathU);
  const dragRef = useRef<DragKind>(null);
  const viewModeRef = useRef(viewMode);
  const followCineRef = useRef(followCineCam);
  const keyframesRef = useRef(keyframes);
  const selectedKfRef = useRef(selectedKf);
  const selectedKeyframeURef = useRef<number | null>(null);
  const lookRelRef = useRef(lookRel);
  const commitSelectedKeyframeRef = useRef<
    (pos: LayoutEditorVec3, look: LayoutEditorVec3, mode?: PathHeightMode) => void
  >(() => {});
  const keysRef = useRef(new Set<string>());
  const lookDragRef = useRef(false);
  const flyRef = useRef({
    x: 20,
    y: 14,
    z: 22,
    yaw: -Math.PI / 4,
    pitch: -0.22,
  });

  layoutRef.current = layout;
  camPosRef.current = camPos;
  camLookAtRef.current = camLookAt;
  pathURef.current = pathU;
  viewModeRef.current = viewMode;
  followCineRef.current = followCineCam;
  keyframesRef.current = keyframes;
  selectedKfRef.current = selectedKf;
  lookRelRef.current = lookRel;

  const sortedKeyframes = useMemo(
    () => [...keyframes].sort((a, b) => a.u - b.u),
    [keyframes],
  );

  const pathStepIndex = useMemo(
    () => keyframeStepIndexForU(sortedKeyframes, pathU),
    [sortedKeyframes, pathU],
  );

  const sampler = useMemo(
    () => createLayoutEditorPathSampler(keyframes),
    [keyframes],
  );

  const syncFlyFromCine = useCallback(() => {
    const cp = camPosRef.current;
    const cl = camLookAtRef.current;
    const eye = new THREE.Vector3(cp.x, cp.y, cp.z);
    const target = new THREE.Vector3(cl.x, cl.y, cl.z);
    const { yaw, pitch } = yawPitchFromLookAt(eye, target);
    flyRef.current = { x: cp.x, y: cp.y, z: cp.z, yaw, pitch };
  }, []);

  /** Sliders / path / keyframes → vue perspective alignée sur la caméra ciné. */
  const bindPerspectiveToCine = useCallback(() => {
    followCineRef.current = true;
    setFollowCineCam(true);
    syncFlyFromCine();
  }, [syncFlyFromCine]);

  const commitSelectedKeyframe = useCallback(
    (
      pos: LayoutEditorVec3,
      look: LayoutEditorVec3,
      mode?: PathHeightMode,
      cinematic?: LandingCameraKeyframeCinematic,
    ) => {
      const i = selectedKfRef.current;
      if (i === null) return;
      setKeyframes((prev) =>
        prev.map((kf, j) =>
          j === i
            ? {
                ...kf,
                position: { ...pos },
                lookAt: { ...look },
                heightMode: mode ?? kf.heightMode,
                cinematic: cinematic ?? kf.cinematic ?? shotBeatForU(kf.u),
              }
            : kf,
        ),
      );
    },
    [],
  );

  commitSelectedKeyframeRef.current = commitSelectedKeyframe;

  const applyCinePose = useCallback(
    (
      pos: LayoutEditorVec3,
      look: LayoutEditorVec3,
      rel?: LookRel,
      opts?: {
        commitKeyframe?: boolean;
        syncFly?: boolean;
        cinematic?: LandingCameraKeyframeCinematic;
      },
    ) => {
      camPosRef.current = pos;
      camLookAtRef.current = look;
      setCamPos(pos);
      setCamLookAt(look);
      const nextRel = rel ?? lookRelFromEyeTarget(pos, look);
      lookRelRef.current = nextRel;
      setLookRel(nextRel);
      if (opts?.commitKeyframe) {
        commitSelectedKeyframe(pos, look, undefined, opts.cinematic);
      }
      if (opts?.syncFly !== false) {
        bindPerspectiveToCine();
      }
    },
    [bindPerspectiveToCine, commitSelectedKeyframe],
  );

  const patchSelectedCinematic = useCallback(
    (patch: Partial<LandingCameraKeyframeCinematic>) => {
      const i = selectedKfRef.current;
      if (i === null) return;
      const shouldFrame =
        "subjectId" in patch ||
        "secondarySubjectId" in patch ||
        "shotSize" in patch ||
        "angle" in patch;
      setKeyframes((prev) =>
        prev.map((kf, j) => {
          if (j !== i) return kf;
          const base: LandingCameraKeyframeCinematic = {
            subjectId: kf.cinematic?.subjectId ?? "scene_envelope",
            shotSize: kf.cinematic?.shotSize ?? "MS",
            ...kf.cinematic,
            ...patch,
          };
          if (!shouldFrame) {
            return { ...kf, cinematic: base };
          }
          const { position, lookAt } = frameCameraForBeat(
            base,
            kf.position,
            kf.heightMode,
          );
          queueMicrotask(() => {
            const rel = lookRelFromEyeTarget(position, lookAt);
            applyCinePose(position, lookAt, rel, {
              commitKeyframe: false,
              syncFly: true,
            });
          });
          return { ...kf, position, lookAt, cinematic: base };
        }),
      );
    },
    [applyCinePose],
  );

  const applyCamPosKeepingLook = useCallback(
    (pos: LayoutEditorVec3) => {
      const look = targetFromLookRel(pos, lookRelRef.current);
      applyCinePose(pos, look, lookRelRef.current, {
        commitKeyframe: selectedKfRef.current !== null,
      });
    },
    [applyCinePose],
  );

  const applyLookRel = useCallback(
    (patch: Partial<LookRel>) => {
      const nextRel = { ...lookRelRef.current, ...patch };
      const pos = camPosRef.current;
      const look = targetFromLookRel(pos, nextRel);
      applyCinePose(pos, look, nextRel, {
        commitKeyframe: selectedKfRef.current !== null,
      });
    },
    [applyCinePose],
  );

  const findKeyframeIndexByU = useCallback((u: number, list = keyframesRef.current) => {
    return list.findIndex((k) => Math.abs(k.u - u) < 1e-5);
  }, []);

  const clearSelectedKeyframe = useCallback(() => {
    setSelectedKf(null);
    selectedKfRef.current = null;
    selectedKeyframeURef.current = null;
  }, []);

  const selectKeyframe = useCallback(
    (index: number) => {
      const kf = keyframesRef.current[index];
      if (!kf) return;
      if (!kf.cinematic) {
        setKeyframes((prev) =>
          prev.map((item, j) =>
            j === index ? { ...item, cinematic: { ...shotBeatForU(item.u) } } : item,
          ),
        );
      }
      setSelectedKf(index);
      selectedKfRef.current = index;
      selectedKeyframeURef.current = kf.u;
      setPlaying(false);
      setPathU(kf.u);
      setCamHeightMode(kf.heightMode);
      const rel = lookRelFromEyeTarget(kf.position, kf.lookAt);
      applyCinePose(kf.position, kf.lookAt, rel, { commitKeyframe: false });
    },
    [applyCinePose],
  );

  const loadPathPreset = useCallback(
    (id: LandingCameraPathPresetId) => {
      const next = keyframesForPathPreset(id);
      setPathPresetId(id);
      setPlaying(false);
      clearSelectedKeyframe();
      setKeyframes(next);
      if (next[0]) {
        setPathU(next[0].u);
        applyCinePose(next[0].position, next[0].lookAt, undefined, {
          commitKeyframe: false,
        });
      }
    },
    [applyCinePose, clearSelectedKeyframe],
  );

  const applyShotListToAllKeyframes = useCallback(() => {
    setKeyframes((prev) => applyShotListMetadataToKeyframes(prev));
  }, []);

  const frameSelectedStepFromShot = useCallback(() => {
    const i = selectedKfRef.current;
    if (i === null) return;
    const kf = keyframesRef.current[i];
    const beat = kf.cinematic ?? shotBeatForU(kf.u);
    const { position, lookAt } = frameCameraForBeat(beat, kf.position, kf.heightMode);
    const rel = lookRelFromEyeTarget(position, lookAt);
    applyCinePose(position, lookAt, rel, { commitKeyframe: true, cinematic: beat });
  }, [applyCinePose]);

  const applySuggestedDistanceToLook = useCallback(() => {
    const i = selectedKfRef.current;
    if (i === null) return;
    const kf = keyframesRef.current[i];
    const beat = kf.cinematic ?? shotBeatForU(kf.u);
    const bounds = landingSubjectBounds(beat.subjectId);
    const dist = cameraDistanceForShot(bounds, beat.shotSize);
    applyLookRel({ distance: dist });
  }, [applyLookRel]);

  const goToPathStep = useCallback(
    (stepIndex: number) => {
      const kf = sortedKeyframes[stepIndex];
      if (!kf) return;
      setPlaying(false);
      clearSelectedKeyframe();
      setPathU(kf.u);
    },
    [sortedKeyframes, clearSelectedKeyframe],
  );

  useEffect(() => {
    const u = selectedKeyframeURef.current;
    if (u === null) return;
    const idx = findKeyframeIndexByU(u, keyframes);
    if (idx >= 0 && idx !== selectedKf) {
      setSelectedKf(idx);
      selectedKfRef.current = idx;
    }
  }, [keyframes, selectedKf, findKeyframeIndexByU]);

  const addStepAtPathU = useCallback(() => {
    const u = THREE.MathUtils.clamp(pathU, 0, 1);
    if (keyframesRef.current.some((k) => Math.abs(k.u - u) < 0.008)) {
      return;
    }
    const localSampler = createLayoutEditorPathSampler(keyframesRef.current);
    if (!localSampler) return;
    const sample = localSampler.sample(u);
    const pos = {
      x: sample.position.x,
      y: sample.position.y,
      z: sample.position.z,
    };
    const look = {
      x: sample.lookAt.x,
      y: sample.lookAt.y,
      z: sample.lookAt.z,
    };
    const next: LayoutEditorCameraKeyframe = {
      u,
      position: pos,
      lookAt: look,
      heightMode: camHeightMode,
    };
    setKeyframes((prev) => {
      const merged = [...prev, next].sort((a, b) => a.u - b.u);
      const idx = merged.findIndex((k) => Math.abs(k.u - u) < 1e-5);
      queueMicrotask(() => {
        if (idx >= 0) selectKeyframe(idx);
      });
      return merged;
    });
  }, [pathU, camHeightMode, selectKeyframe]);

  const captureKeyframe = useCallback(() => {
    const pos = camPosRef.current;
    const look = camLookAtRef.current;
    const i = selectedKfRef.current;
    if (i !== null) {
      commitSelectedKeyframe(pos, look, camHeightMode);
      return;
    }
    const u = THREE.MathUtils.clamp(pathU, 0, 1);
    const next: LayoutEditorCameraKeyframe = {
      u,
      position: { ...pos },
      lookAt: { ...look },
      heightMode: camHeightMode,
    };
    setKeyframes((prev) => {
      const without = prev.filter((k) => Math.abs(k.u - u) > 0.02);
      const merged = [...without, next].sort((a, b) => a.u - b.u);
      const idx = merged.findIndex((k) => Math.abs(k.u - u) < 1e-5);
      queueMicrotask(() => {
        if (idx >= 0) selectKeyframe(idx);
      });
      return merged;
    });
  }, [camHeightMode, pathU, commitSelectedKeyframe, selectKeyframe]);

  const aimAtCinematicSubject = useCallback(() => {
    const i = selectedKfRef.current;
    const subjectId: LandingSubjectId =
      i !== null && keyframesRef.current[i]?.cinematic?.subjectId
        ? keyframesRef.current[i].cinematic!.subjectId
        : "scene_envelope";
    const look = landingSubjectLookAt(subjectId);
    applyCinePose(camPosRef.current, look, undefined, {
      commitKeyframe: i !== null,
    });
  }, [applyCinePose]);

  const aimAtSelected = useCallback(() => {
    const L = layoutRef.current;
    let x = 0;
    let z = 0;
    let y = 5;
    switch (selectedItem) {
      case "cube":
        x = L.cube.x;
        z = L.cube.z;
        y = 6;
        break;
      case "marble":
        x = L.marble.x;
        z = L.marble.z;
        y = 6;
        break;
      case "portal":
        x = L.portal.x;
        z = L.portal.z;
        y = 9;
        break;
    }
    const pos = camPosRef.current;
    const look = { x, y, z };
    applyCinePose(pos, look, undefined, {
      commitKeyframe: selectedKfRef.current !== null,
    });
  }, [selectedItem, applyCinePose]);

  useEffect(() => {
    if (!playing || !sampler) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const u = (elapsed / CAMERA_PATH_PLAY_DURATION) % 1;
      setPathU(u);
      const sample = sampler.sample(u);
      setCamPos({
        x: sample.position.x,
        y: sample.position.y,
        z: sample.position.z,
      });
      setCamLookAt({
        x: sample.lookAt.x,
        y: sample.lookAt.y,
        z: sample.lookAt.z,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, sampler]);

  useEffect(() => {
    if (viewMode === "perspective" && followCineCam) {
      syncFlyFromCine();
    }
  }, [camPos, camLookAt, viewMode, followCineCam, syncFlyFromCine]);

  useEffect(() => {
    const host = mainRef.current;
    if (!host) return;

    syncFlyFromCine();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f14);

    const aspect = host.clientWidth / host.clientHeight;
    const zoneHalfX = LANDING_TERRAIN_WIDTH / 2;
    const zoneHalfZ = LANDING_TERRAIN_DEPTH / 2;
    const orthoHalf = Math.max(zoneHalfX, zoneHalfZ) + 2;
    const ortho = new THREE.OrthographicCamera(
      -orthoHalf * aspect,
      orthoHalf * aspect,
      orthoHalf,
      -orthoHalf,
      0.1,
      500,
    );
    const persp = new THREE.PerspectiveCamera(55, aspect, 0.1, 400);
    persp.position.set(flyRef.current.x, flyRef.current.y, flyRef.current.z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(resolveRendererPixelRatio("optimized"));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;

    const gridDivisions = 14;
    const grid = new THREE.GridHelper(
      LANDING_TERRAIN_WIDTH,
      gridDivisions,
      0x475569,
      0x1e293b,
    );
    grid.position.set(LANDING_TERRAIN_CENTER_X, 0, LANDING_TERRAIN_CENTER_Z);
    scene.add(grid);

    const zoneOutlinePts = [
      new THREE.Vector3(-zoneHalfX, 0.03, -zoneHalfZ),
      new THREE.Vector3(zoneHalfX, 0.03, -zoneHalfZ),
      new THREE.Vector3(zoneHalfX, 0.03, zoneHalfZ),
      new THREE.Vector3(-zoneHalfX, 0.03, zoneHalfZ),
      new THREE.Vector3(-zoneHalfX, 0.03, -zoneHalfZ),
    ];
    const zoneOutline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(zoneOutlinePts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
    );
    zoneOutline.position.set(LANDING_TERRAIN_CENTER_X, 0, LANDING_TERRAIN_CENTER_Z);
    scene.add(zoneOutline);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(LANDING_TERRAIN_WIDTH, LANDING_TERRAIN_DEPTH),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(LANDING_TERRAIN_CENTER_X, 0, LANDING_TERRAIN_CENTER_Z);
    scene.add(ground);

    const makeSolid = (color: number, name: string) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.65,
          metalness: 0.08,
        }),
      );
      mesh.userData.dragKind = name;
      return mesh;
    };

    const cubeMesh = makeSolid(ITEM_COLORS.cube, "cube");
    const marbleMesh = makeSolid(ITEM_COLORS.marble, "marble");

    const portalAssembly = new THREE.Group();
    portalAssembly.name = "PortalAssembly";
    const leftMesh = makeSolid(PILLAR_COLOR, "portal");
    const rightMesh = makeSolid(PILLAR_COLOR, "portal");
    const portalSlitMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, LAYOUT_PORTAL_HEIGHT),
      new THREE.MeshBasicMaterial({
        color: 0xff8a3a,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    portalSlitMesh.userData.dragKind = "portal";
    const portalFloorRing = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1, 32),
      new THREE.MeshBasicMaterial({ color: ITEM_COLORS.portal, side: THREE.DoubleSide }),
    );
    portalFloorRing.rotation.x = -Math.PI / 2;
    portalFloorRing.position.y = 0.04;
    portalFloorRing.userData.dragKind = "portal";
    portalAssembly.add(leftMesh, rightMesh, portalSlitMesh, portalFloorRing);
    scene.add(cubeMesh, marbleMesh, portalAssembly);

    const hemi = new THREE.HemisphereLight(0xb8c4e8, 0x2a2018, 0.9);
    const dir = new THREE.DirectionalLight(0xfff0dd, 1.1);
    dir.position.set(LANDING_TERRAIN_CENTER_X + 8, 32, LANDING_TERRAIN_CENTER_Z + 12);
    scene.add(hemi, dir, new THREE.AmbientLight(0x445566, 0.35));

    const camGizmo = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.1, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    );
    camBody.rotation.x = Math.PI / 2;
    camBody.userData.dragKind = "camPos";
    const lookMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
    );
    lookMarker.userData.dragKind = "camLookAt";
    const camLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
    );
    camGizmo.add(camBody, lookMarker, camLine);
    scene.add(camGizmo);

    const pathLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x64748b }),
    );
    scene.add(pathLine);

    const frustumArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(),
      2.5,
      0x22c55e,
    );
    scene.add(frustumArrow);

    const copyLabels = createLayoutCopyLabels(scene);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();

    const pickables = [
      cubeMesh,
      marbleMesh,
      leftMesh,
      rightMesh,
      portalSlitMesh,
      portalFloorRing,
      camBody,
      lookMarker,
    ];

    const activeCamera = () =>
      viewModeRef.current === "top" ? ortho : persp;

    const updateOrthoFrame = () => {
      const f = sceneFocus(layoutRef.current);
      ortho.position.set(f.x, 80, f.z);
      ortho.up.set(0, 0, -1);
      ortho.lookAt(f.x, 0, f.z);
      ortho.updateProjectionMatrix();
    };
    updateOrthoFrame();

    const onPointerDown = (e: PointerEvent) => {
      if (viewModeRef.current === "perspective" && e.button === 2) {
        lookDragRef.current = true;
        renderer.domElement.setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0) return;

      const cam = activeCamera();
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cam);
      const hits = raycaster.intersectObjects(pickables, false);
      if (hits.length > 0) {
        dragRef.current = hits[0].object.userData.dragKind as DragKind;
        renderer.domElement.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (lookDragRef.current && viewModeRef.current === "perspective") {
        flyRef.current.yaw -= e.movementX * MOUSE_LOOK_SENS;
        flyRef.current.pitch = THREE.MathUtils.clamp(
          flyRef.current.pitch - e.movementY * MOUSE_LOOK_SENS,
          -Math.PI / 2 + 0.05,
          Math.PI / 2 - 0.05,
        );
        if (followCineRef.current) {
          followCineRef.current = false;
          setFollowCineCam(false);
        }
        return;
      }

      if (!dragRef.current) return;
      const cam = activeCamera();
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, cam);
      if (!raycaster.ray.intersectPlane(dragPlane, hit)) return;

      const kind = dragRef.current;
      const x = hit.x;
      const z = hit.z;

      if (kind === "camPos") {
        const next = { ...camPosRef.current, x, z };
        if (selectedKfRef.current !== null) {
          const look = targetFromLookRel(next, lookRelRef.current);
          camPosRef.current = next;
          camLookAtRef.current = look;
          setCamPos(next);
          setCamLookAt(look);
          commitSelectedKeyframeRef.current(next, look);
        } else {
          camPosRef.current = next;
          setCamPos(next);
        }
        return;
      }
      if (kind === "camLookAt") {
        const next = { ...camLookAtRef.current, x, z };
        const rel = lookRelFromEyeTarget(camPosRef.current, next);
        lookRelRef.current = rel;
        setLookRel(rel);
        camLookAtRef.current = next;
        setCamLookAt(next);
        if (selectedKfRef.current !== null) {
          commitSelectedKeyframeRef.current(camPosRef.current, next);
        }
        return;
      }

      setLayout((prev) => {
        if (kind === "cube") return { ...prev, cube: { x, z } };
        if (kind === "marble") return { ...prev, marble: { x, z } };
        if (kind === "portal") return movePortal(prev, x, z);
        return prev;
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      dragRef.current = null;
      lookDragRef.current = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      keysRef.current.add(e.code);
      if (
        ["KeyZ", "KeyS", "KeyQ", "KeyD", "KeyE", "KeyA", "Space"].includes(e.code) &&
        followCineRef.current
      ) {
        followCineRef.current = false;
        setFollowCineCam(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);

    const onBlur = () => keysRef.current.clear();

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    let raf = 0;
    let lastTime = performance.now();
    const cancelAnimate = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const animate = () => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const L = layoutRef.current;
      const ph = LAYOUT_PILLAR.height;
      const pw = LAYOUT_PILLAR.width;
      const pd = LAYOUT_PILLAR.depth;

      cubeMesh.scale.set(LAYOUT_CUBE_SIZE, LAYOUT_CUBE_SIZE, LAYOUT_CUBE_SIZE);
      cubeMesh.position.set(L.cube.x, LAYOUT_CUBE_CENTER_Y, L.cube.z);

      marbleMesh.scale.set(
        LAYOUT_MARBLE_SIZE.width,
        LAYOUT_MARBLE_SIZE.height,
        LAYOUT_MARBLE_SIZE.depth,
      );
      marbleMesh.position.set(
        L.marble.x,
        LAYOUT_MARBLE_SIZE.height / 2 + LAYOUT_MARBLE_HOVER,
        L.marble.z,
      );

      const assembly = portalAssemblyLocalOffsets(L.portal.gapWidth);
      portalAssembly.position.set(L.portal.x, 0, L.portal.z);
      leftMesh.scale.set(pw, ph, pd);
      leftMesh.position.set(assembly.leftPillar.x, ph / 2, assembly.leftPillar.z);
      rightMesh.scale.set(pw, ph, pd);
      rightMesh.position.set(assembly.rightPillar.x, ph / 2, assembly.rightPillar.z);
      portalSlitMesh.scale.set(L.portal.gapWidth, 1, 1);
      portalSlitMesh.position.set(0, ph / 2, assembly.slit.z);

      const cp = camPosRef.current;
      const cl = camLookAtRef.current;
      camBody.position.set(cp.x, cp.y, cp.z);
      lookMarker.position.set(cl.x, cl.y, cl.z);
      const lookDir = new THREE.Vector3().subVectors(
        new THREE.Vector3(cl.x, cl.y, cl.z),
        new THREE.Vector3(cp.x, cp.y, cp.z),
      );
      if (lookDir.lengthSq() > 1e-4) {
        camBody.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, -1, 0),
          lookDir.normalize(),
        );
      }
      camLine.geometry.setFromPoints([
        new THREE.Vector3(cp.x, cp.y, cp.z),
        new THREE.Vector3(cl.x, cl.y, cl.z),
      ]);

      const localSampler = createLayoutEditorPathSampler(keyframesRef.current);
      if (localSampler) {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          pts.push(localSampler.sample(i / 64).position);
        }
        pathLine.geometry.setFromPoints(pts);

        const u = pathURef.current;
        const sample = localSampler.sample(u);
        frustumArrow.position.copy(sample.position);
        const dir = new THREE.Vector3()
          .subVectors(sample.lookAt, sample.position)
          .normalize();
        if (dir.lengthSq() > 1e-4) {
          frustumArrow.setDirection(dir);
        }
      }

      if (viewModeRef.current === "perspective") {
        const fly = flyRef.current;
        if (followCineRef.current) {
          const cine = camPosRef.current;
          const look = camLookAtRef.current;
          fly.x = cine.x;
          fly.y = cine.y;
          fly.z = cine.z;
          const oriented = yawPitchFromLookAt(
            new THREE.Vector3(cine.x, cine.y, cine.z),
            new THREE.Vector3(look.x, look.y, look.z),
          );
          fly.yaw = oriented.yaw;
          fly.pitch = oriented.pitch;
        } else {
          const keys = keysRef.current;
          const fast = keys.has("ShiftLeft") || keys.has("ShiftRight") ? FLY_FAST_MULT : 1;
          const speed = FLY_MOVE_SPEED * fast * dt;
          const cosP = Math.cos(fly.pitch);
          const forward = new THREE.Vector3(
            Math.sin(fly.yaw) * cosP,
            0,
            Math.cos(fly.yaw) * cosP,
          );
          const right = new THREE.Vector3(forward.z, 0, -forward.x);
          if (keys.has("KeyZ") || keys.has("KeyW")) {
            fly.x += forward.x * speed;
            fly.z += forward.z * speed;
          }
          if (keys.has("KeyS")) {
            fly.x -= forward.x * speed;
            fly.z -= forward.z * speed;
          }
          if (keys.has("KeyQ") || keys.has("KeyA")) {
            fly.x -= right.x * speed;
            fly.z -= right.z * speed;
          }
          if (keys.has("KeyD")) {
            fly.x += right.x * speed;
            fly.z += right.z * speed;
          }
          if (keys.has("Space")) fly.y += speed;
          if (keys.has("KeyE")) fly.y -= speed;
        }

        persp.position.set(fly.x, fly.y, fly.z);
        applyFlyOrientation(persp, fly.yaw, fly.pitch);
        persp.aspect = host.clientWidth / host.clientHeight;
        persp.updateProjectionMatrix();
        copyLabels?.sync(pathURef.current, layoutRef.current, persp);
        renderer.render(scene, persp);
      } else {
        updateOrthoFrame();
        const a = host.clientWidth / host.clientHeight;
        ortho.left = -orthoHalf * a;
        ortho.right = orthoHalf * a;
        ortho.top = orthoHalf;
        ortho.bottom = -orthoHalf;
        ortho.updateProjectionMatrix();
        copyLabels?.sync(pathURef.current, layoutRef.current, ortho);
        renderer.render(scene, ortho);
      }
    };
    const startAnimate = () => {
      if (raf) return;
      lastTime = performance.now();
      animate();
    };
    startAnimate();

    const visibilityPause = attachVisibilityPauseRaf(cancelAnimate, startAnimate);

    const onResize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      visibilityPause.dispose();
      cancelAnimate();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("contextmenu", onContextMenu);
      copyLabels?.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [syncFlyFromCine]);

  useEffect(() => {
    if (playing || !sampler || selectedKf !== null) return;
    const sample = sampler.sample(pathU);
    const pos = {
      x: sample.position.x,
      y: sample.position.y,
      z: sample.position.z,
    };
    const look = {
      x: sample.lookAt.x,
      y: sample.lookAt.y,
      z: sample.lookAt.z,
    };
    camPosRef.current = pos;
    camLookAtRef.current = look;
    setCamPos(pos);
    setCamLookAt(look);
    const rel = lookRelFromEyeTarget(pos, look);
    lookRelRef.current = rel;
    setLookRel(rel);
    bindPerspectiveToCine();
  }, [pathU, sampler, playing, selectedKf, bindPerspectiveToCine]);

  const layoutJson = sceneLayoutToExportJson(layout);

  return (
    <div className="prism-layout-root">
      <div className="prism-layout-canvas-wrap" ref={mainRef}>
        <Button variant="secondary" size="sm" className="prism-layout-back gap-2" asChild>
          <Link to="/dev">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Dev Lab
          </Link>
        </Button>

        <div className="prism-layout-toolbar">
          <Button
            size="sm"
            variant={viewMode === "top" ? "default" : "outline"}
            onClick={() => {
              viewModeRef.current = "top";
              setViewMode("top");
            }}
          >
            Vue du haut
          </Button>
          <Button
            size="sm"
            variant={viewMode === "perspective" ? "default" : "outline"}
            onClick={() => {
              viewModeRef.current = "perspective";
              setViewMode("perspective");
              mainRef.current?.querySelector("canvas")?.focus();
              if (followCineCam) syncFlyFromCine();
            }}
          >
            Perspective
          </Button>
          {viewMode === "perspective" ? (
            <label className="prism-layout-follow">
              <input
                type="checkbox"
                checked={followCineCam}
                onChange={(e) => {
                  const on = e.target.checked;
                  setFollowCineCam(on);
                  followCineRef.current = on;
                  if (on) syncFlyFromCine();
                }}
              />
              Suivre caméra ciné
            </label>
          ) : null}
        </div>

        <div className="prism-layout-hud">
          {viewMode === "top" ? (
            <div>
              Vue du haut — cube, marbre, groupe portail+piliers (rigide), gizmos caméra
            </div>
          ) : (
            <div>
              Perspective — curseurs Y / path = caméra ciné (cocher « Suivre »). ZQSD ou clic
              droit = vol libre (découple). Cube &lt; marbre &lt; portail ({LAYOUT_PORTAL_HEIGHT}{" "}
              m).
            </div>
          )}
          <div>
            Zone landing {LANDING_TERRAIN_WIDTH}×{LANDING_TERRAIN_DEPTH} m (centre{" "}
            {LANDING_TERRAIN_CENTER_X}, {LANDING_TERRAIN_CENTER_Z}) — gap fente{" "}
            {round1(layout.portal.gapWidth)} m
          </div>
        </div>
      </div>

      <aside className="prism-layout-sidebar">
        <section>
          <h2>Layout scène</h2>
          {(
            [
              ["cube", "Cube (petit)", layout.cube],
              ["marble", "Marbre (moyen)", layout.marble],
              ["portal", "Portail + piliers", layout.portal],
            ] as const
          ).map(([key, label, pos]) => (
            <button
              key={key}
              type="button"
              className={`prism-layout-coord-row w-full text-left ${
                selectedItem === key ? "opacity-100" : "opacity-80"
              }`}
              onClick={() => setSelectedItem(key)}
            >
              <span>{label}</span>
              <code>
                x {round1(pos.x)}, z {round1(pos.z)}
                {key === "portal" ? ` · gap ${round1(layout.portal.gapWidth)}` : ""}
              </code>
            </button>
          ))}
          <p className="mt-2 text-[11px] text-slate-500 leading-snug">
            gap = largeur de la fente (0,7 m d’origine), pas l’écart entre piliers. Groupe rigide
            — piliers : G (
            {round1(layout.leftPillar.x)}, {round1(layout.leftPillar.z)}) · D (
            {round1(layout.rightPillar.x)}, {round1(layout.rightPillar.z)})
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                void copyText(layoutJson);
                setCopiedLayout(true);
                setTimeout(() => setCopiedLayout(false), 1500);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedLayout ? "Copié" : "Copier JSON layout"}
            </Button>
          </div>
        </section>

        <section>
          <h2>Caméra (gizmos)</h2>
          {selectedKf !== null ? (
            <>
              <p className="mb-2 text-[11px] text-sky-300/90 leading-snug">
                Étape {selectedKf + 1} · u={round1(keyframes[selectedKf]?.u ?? pathU)} — regard
                relatif (azimut / inclinaison / distance). Bible :{" "}
                <code className="text-[10px]">LANDING_CINEMATIC_BIBLE.md</code>
              </p>
              <div className="mb-3 prism-layout-controls">
                  <label className="min-w-full">
                    Titre plan (shot list)
                    <input
                      type="text"
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs w-full"
                      value={keyframes[selectedKf].cinematic?.label ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          label: e.target.value || undefined,
                        })
                      }
                      placeholder="Ex. Cube — plan rapproché"
                    />
                  </label>
                  <label>
                    Mouvement drone (Adorama)
                    <select
                      value={keyframes[selectedKf].cinematic?.droneMove ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          droneMove: (e.target.value || undefined) as
                            | CinematicDroneMoveId
                            | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(CINEMATIC_DRONE_MOVES) as CinematicDroneMoveId[]).map(
                        (id) => (
                          <option key={id} value={id}>
                            {CINEMATIC_DRONE_MOVES[id].label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Sujet (acteur)
                    <select
                      value={keyframes[selectedKf].cinematic?.subjectId ?? "scene_envelope"}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          subjectId: e.target.value as LandingSubjectId,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      {LANDING_SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sujet secondaire
                    <select
                      value={keyframes[selectedKf].cinematic?.secondarySubjectId ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          secondarySubjectId: (e.target.value || undefined) as
                            | LandingSubjectId
                            | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {LANDING_SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Taille de plan
                    <select
                      value={keyframes[selectedKf].cinematic?.shotSize ?? "MS"}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          shotSize: e.target.value as ShotSizeAbbrev,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      {(Object.keys(SHOT_SIZE_LABELS) as ShotSizeAbbrev[]).map((abbr) => (
                        <option key={abbr} value={abbr}>
                          {abbr} — {SHOT_SIZE_LABELS[abbr].fr}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cadrage
                    <select
                      value={keyframes[selectedKf].cinematic?.framing ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          framing: (e.target.value || undefined) as ShotFraming | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(SHOT_FRAMING_LABELS) as ShotFraming[]).map((f) => (
                        <option key={f} value={f}>
                          {SHOT_FRAMING_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Angle
                    <select
                      value={keyframes[selectedKf].cinematic?.angle ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          angle: (e.target.value || undefined) as ShotAngle | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(SHOT_ANGLE_LABELS) as ShotAngle[]).map((a) => (
                        <option key={a} value={a}>
                          {SHOT_ANGLE_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mouvement
                    <select
                      value={keyframes[selectedKf].cinematic?.movement ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          movement: (e.target.value || undefined) as ShotMovement | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(SHOT_MOVEMENT_LABELS) as ShotMovement[]).map((m) => (
                        <option key={m} value={m}>
                          {SHOT_MOVEMENT_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Focus
                    <select
                      value={keyframes[selectedKf].cinematic?.focus ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          focus: (e.target.value || undefined) as ShotFocus | undefined,
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(SHOT_FOCUS_LABELS) as ShotFocus[]).map((f) => (
                        <option key={f} value={f}>
                          {SHOT_FOCUS_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-full">
                    Intention
                    <input
                      type="text"
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                      value={keyframes[selectedKf].cinematic?.intent ?? ""}
                      onChange={(e) => patchSelectedCinematic({ intent: e.target.value })}
                      placeholder="Pourquoi ce plan ?"
                    />
                  </label>
                  <label>
                    Post — profil
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.profile ?? ""}
                      onChange={(e) => {
                        const profile = (e.target.value || undefined) as
                          | DronePostProfileId
                          | undefined;
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            profile,
                          },
                        });
                      }}
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(DRONE_POST_PROFILE_LABELS) as DronePostProfileId[]).map(
                        (id) => (
                          <option key={id} value={id}>
                            {DRONE_POST_PROFILE_LABELS[id].label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Post — stabilisation
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.stabilization ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            stabilization: (e.target.value || undefined) as
                              | DroneStabilizationApproach
                              | undefined,
                          },
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(
                        Object.keys(DRONE_STABILIZATION_LABELS) as DroneStabilizationApproach[]
                      ).map((id) => (
                        <option key={id} value={id}>
                          {DRONE_STABILIZATION_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Post — couleur
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.color ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            color: (e.target.value || undefined) as DroneColorStage | undefined,
                          },
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(DRONE_COLOR_LABELS) as DroneColorStage[]).map((id) => (
                        <option key={id} value={id}>
                          {DRONE_COLOR_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Post — vitesse
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.speed ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            speed: (e.target.value || undefined) as
                              | DroneSpeedTreatment
                              | undefined,
                          },
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(DRONE_SPEED_LABELS) as DroneSpeedTreatment[]).map((id) => (
                        <option key={id} value={id}>
                          {DRONE_SPEED_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Post — cadre
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.frame ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            frame: (e.target.value || undefined) as
                              | DroneFrameTreatment
                              | undefined,
                          },
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(DRONE_FRAME_LABELS) as DroneFrameTreatment[]).map((id) => (
                        <option key={id} value={id}>
                          {DRONE_FRAME_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Post — transition sortie
                    <select
                      value={keyframes[selectedKf].cinematic?.post?.transitionOut ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            transitionOut: (e.target.value || undefined) as
                              | DroneTransitionStyle
                              | undefined,
                          },
                        })
                      }
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {(Object.keys(DRONE_TRANSITION_LABELS) as DroneTransitionStyle[]).map(
                        (id) => (
                          <option key={id} value={id}>
                            {DRONE_TRANSITION_LABELS[id]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="min-w-full">
                    Notes post (AAI)
                    <input
                      type="text"
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                      value={keyframes[selectedKf].cinematic?.post?.notes ?? ""}
                      onChange={(e) =>
                        patchSelectedCinematic({
                          post: {
                            ...keyframes[selectedKf].cinematic?.post,
                            notes: e.target.value,
                          },
                        })
                      }
                      placeholder="Son, LUT, export…"
                    />
                  </label>
                </div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={aimAtCinematicSubject}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Viser sujet
                </Button>
                <Button size="sm" variant="secondary" onClick={frameSelectedStepFromShot}>
                  Cadre auto (plan + angle)
                </Button>
                <Button size="sm" variant="outline" onClick={applySuggestedDistanceToLook}>
                  Distance {keyframes[selectedKf].cinematic?.shotSize ?? "MS"}
                </Button>
              </div>
            </>
          ) : (
            <p className="mb-2 text-[11px] text-slate-500 leading-snug">
              Sélectionne une étape dans Travelling pour régler le lookAt, ou scrube u pour
              prévisualiser.
            </p>
          )}
          <div className="prism-layout-controls">
            <label>
              Y position
              <input
                type="range"
                min={0}
                max={45}
                step={0.1}
                value={camPos.y}
                onChange={(e) => {
                  const next = { ...camPosRef.current, y: Number(e.target.value) };
                  if (selectedKf !== null) {
                    applyCamPosKeepingLook(next);
                  } else {
                    camPosRef.current = next;
                    setCamPos(next);
                    bindPerspectiveToCine();
                  }
                }}
              />
            </label>
            {selectedKf !== null ? (
              <>
                <label>
                  Azimut {round1(lookRel.yaw * RAD2DEG)}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={0.5}
                    value={lookRel.yaw * RAD2DEG}
                    onChange={(e) =>
                      applyLookRel({ yaw: Number(e.target.value) * DEG2RAD })
                    }
                  />
                </label>
                <label>
                  Inclinaison {round1(lookRel.pitch * RAD2DEG)}°
                  <input
                    type="range"
                    min={-75}
                    max={75}
                    step={0.5}
                    value={lookRel.pitch * RAD2DEG}
                    onChange={(e) =>
                      applyLookRel({ pitch: Number(e.target.value) * DEG2RAD })
                    }
                  />
                </label>
                <label>
                  Distance {round1(lookRel.distance)} m
                  <input
                    type="range"
                    min={1}
                    max={90}
                    step={0.25}
                    value={lookRel.distance}
                    onChange={(e) =>
                      applyLookRel({ distance: Number(e.target.value) })
                    }
                  />
                </label>
              </>
            ) : (
              <label>
                Y lookAt
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.1}
                  value={camLookAt.y}
                  onChange={(e) => {
                    const next = { ...camLookAtRef.current, y: Number(e.target.value) };
                    camLookAtRef.current = next;
                    setCamLookAt(next);
                    bindPerspectiveToCine();
                  }}
                />
              </label>
            )}
            <label>
              Mode
              <select
                value={camHeightMode}
                onChange={(e) => {
                  const mode = e.target.value as PathHeightMode;
                  setCamHeightMode(mode);
                  if (selectedKf !== null) {
                    commitSelectedKeyframe(camPos, camLookAt, mode);
                  }
                }}
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="drone">drone</option>
                <option value="human">human</option>
              </select>
            </label>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Pos ({round1(camPos.x)}, {round1(camPos.y)}, {round1(camPos.z)}) → Look (
            {round1(camLookAt.x)}, {round1(camLookAt.y)}, {round1(camLookAt.z)})
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedKf !== null ? (
              <Button size="sm" variant="outline" onClick={clearSelectedKeyframe}>
                Fermer l’étape
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" onClick={captureKeyframe}>
              Capturer keyframe @ u={round1(pathU)}
            </Button>
            <Button size="sm" variant="ghost" className="gap-1" onClick={aimAtSelected}>
              <Crosshair className="h-3.5 w-3.5" />
              Viser {selectedItem}
            </Button>
          </div>
        </section>

        <section>
          <h2>Travelling ({keyframes.length} étapes)</h2>
          <div className="mb-3 prism-layout-controls">
            <label className="min-w-full">
              Preset path
              <select
                value={pathPresetId}
                onChange={(e) => {
                  const id = e.target.value as LandingCameraPathPresetId;
                  if (
                    id !== pathPresetId &&
                    window.confirm(
                      "Charger ce preset remplace les étapes en mémoire (Copier path JSON avant si besoin). Continuer ?",
                    )
                  ) {
                    loadPathPreset(id);
                  }
                }}
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs w-full"
              >
                {LANDING_CAMERA_PATH_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[10px] text-slate-500 leading-snug min-w-full">
              {LANDING_CAMERA_PATH_PRESETS.find((p) => p.id === pathPresetId)?.description}
            </p>
            <div className="flex flex-wrap gap-2 min-w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPathPreset("prism_landing")}
              >
                Recharger landing Villeneuve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPathPreset("user_legacy")}
              >
                Ancien path manuel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPathPreset("cinematic_shot_path")}
              >
                Path drone pur (21)
              </Button>
              <Button size="sm" variant="secondary" onClick={applyShotListToAllKeyframes}>
                Shot list sur positions actuelles
              </Button>
            </div>
          </div>
          <p className="mb-2 text-[11px] text-slate-500 leading-snug">
            Le slider <strong className="text-slate-400">Étape</strong> saute sur les{" "}
            {sortedKeyframes.length} poses exactes. Le slider <strong className="text-slate-400">u</strong>{" "}
            interpole entre elles (comme le Play).
          </p>
          <div className="prism-layout-controls">
            <label>
              Étape {pathStepIndex + 1} / {sortedKeyframes.length}
              <input
                type="range"
                min={0}
                max={Math.max(0, sortedKeyframes.length - 1)}
                step={1}
                value={pathStepIndex}
                disabled={selectedKf !== null || sortedKeyframes.length < 1}
                onChange={(e) => goToPathStep(Number(e.target.value))}
              />
            </label>
            <label>
              u continu {round1(pathU)} — copy landing complète (2D)
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={pathU}
                disabled={selectedKf !== null}
                onChange={(e) => {
                  setPlaying(false);
                  clearSelectedKeyframe();
                  setPathU(Number(e.target.value));
                }}
              />
            </label>
          </div>
          {selectedKf !== null ? (
            <p className="mt-1 text-[11px] text-amber-200/80">
              Slider path désactivé pendant l’édition d’une étape — « Fermer l’étape » pour
              prévisualiser le travelling.
            </p>
          ) : null}
          <div className="mt-2 flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPlaying(false);
                goToPathStep(0);
              }}
            >
              Étape 1
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={selectedKf !== null}
              onClick={addStepAtPathU}
            >
              + Étape @ u={round1(pathU)}
            </Button>
          </div>

          <div className="mt-3 prism-layout-keyframe-list">
            {keyframes.map((kf, i) => (
              <div
                key={`${kf.u}-${i}`}
                className={`prism-layout-keyframe ${
                  selectedKf === i ? "is-selected" : ""
                }`}
                onClick={() => selectKeyframe(i)}
              >
                <div>
                  Étape {i + 1} · u={round1(kf.u)} · {kf.heightMode}
                  {kf.cinematic ? (
                    <span className="text-sky-300/90">
                      {" "}
                      · {kf.cinematic.shotSize} → {kf.cinematic.subjectId}
                      {kf.cinematic.droneMove ? ` · ${kf.cinematic.droneMove}` : ""}
                    </span>
                  ) : null}
                </div>
                  {kf.cinematic?.markShotId ? (
                    <div className="text-amber-200/95 text-[10px] font-medium">
                      ★ Plan marquant — {kf.cinematic.markShotId}
                      {kf.cinematic.lensFov != null ? ` · FOV ${kf.cinematic.lensFov}°` : ""}
                    </div>
                  ) : null}
                  {kf.cinematic?.label ? (
                  <div className="text-slate-300">{kf.cinematic.label}</div>
                ) : null}
                <div className="text-slate-400">
                  P ({round1(kf.position.x)}, {round1(kf.position.y)}, {round1(kf.position.z)})
                </div>
                <div className="text-slate-500">
                  L ({round1(kf.lookAt.x)}, {round1(kf.lookAt.y)}, {round1(kf.lookAt.z)})
                </div>
                <div className="prism-layout-keyframe-actions">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setKeyframes((prev) => prev.filter((_, j) => j !== i));
                      if (selectedKf === i) clearSelectedKeyframe();
                      else if (selectedKf !== null && selectedKf > i) {
                        setSelectedKf(selectedKf - 1);
                        selectedKfRef.current = selectedKf - 1;
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="mt-3 gap-1"
            size="sm"
            variant="outline"
            onClick={() => {
              void copyText(layoutKeyframesToExportJson(keyframes));
              setCopiedPath(true);
              setTimeout(() => setCopiedPath(false), 1500);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedPath ? "Copié" : "Copier path JSON"}
          </Button>
        </section>
      </aside>
    </div>
  );
}
