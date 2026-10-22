import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CAMERA_PATH_PLAY_DURATION,
  createCameraPathSampler,
  type PathExhibit,
} from "./cameraPath";
import { createNavigationGuideLine } from "../scene/navigationGuideLine";
import { MARBLE_MONOLITH_WORLD_XZ } from "../scene/marbleMonolithAssets";
import { SHATTERED_CUBE_WORLD_XZ } from "../scene/shatteredCubeAssets";
import type { LandingRenderTuning } from "../scene/landingRenderTuning";
import { samplePathLensFov } from "./landingPathLensFov";
import type { ThirdPersonWalkController, WalkCollider } from "../locomotion/thirdPersonWalk";
import { createWalkSurface } from "../locomotion/walkSurface";

const PORTAL_HEIGHT = 23.5;

export type LandingTravellingHandle = {
  setPathU: (u: number) => void;
  getPathU: () => number;
  playPath: () => void;
  pausePath: () => void;
  isPathPlaying: () => boolean;
  setPovMode: (on: boolean) => void;
  getPovMode: () => boolean;
  getPathExhibit: () => PathExhibit;
};

export type LandingTravellingRigContext = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  terrainMesh: THREE.Mesh;
  waterLevel: number;
  getTerrainHeight: (x: number, z: number) => number;
  applyLightFalloff: (material: THREE.Material) => void;
  portalFootY: number;
  cubeFootY: number;
  marbleFootY: number;
  marbleMonolithHeight: number;
  gapLeft: number;
  gapRight: number;
  portalWorldZ: number;
  isSceneDisposed: () => boolean;
  onExitExplore: () => void;
  clearCameraTransition: () => void;
  setCinematicMode: (on: boolean) => void;
  notifyCinematicChange: (on: boolean) => void;
  renderTuning: LandingRenderTuning;
};

export type LandingTravellingRig = {
  handle: LandingTravellingHandle;
  /** true = le rig pilote la caméra (pas OrbitControls). */
  ownsCamera: () => boolean;
  getExploreFocusWorldPosition: (target: THREE.Vector3) => boolean;
  update: (dt: number) => void;
  beforeCameraTransition: () => void;
  dispose: () => void;
};

export function attachLandingTravellingRig(ctx: LandingTravellingRigContext): LandingTravellingRig {
  const {
    camera,
    controls,
    canvas,
    scene,
    terrainMesh,
    waterLevel,
    getTerrainHeight,
    applyLightFalloff,
    portalFootY,
    cubeFootY,
    marbleFootY,
    marbleMonolithHeight,
    gapLeft,
    gapRight,
    portalWorldZ,
    isSceneDisposed,
    clearCameraTransition,
    setCinematicMode,
    notifyCinematicChange,
    renderTuning,
  } = ctx;

  const walkSurface = createWalkSurface({
    terrainMesh,
    getTerrainHeight,
    waterLevel,
  });

  const pathSampler = createCameraPathSampler(getTerrainHeight);
  let pathU = 0;
  /** false = OrbitControls libres ; true = caméra sur le path travelling. */
  let pathMode = false;
  let pathPlaying = false;
  let pathExhibit: PathExhibit = "intro";
  const pathLookTarget = new THREE.Vector3();

  const walkColliders: WalkCollider[] = [
    {
      min: new THREE.Vector3(
        SHATTERED_CUBE_WORLD_XZ.x - 4,
        cubeFootY,
        SHATTERED_CUBE_WORLD_XZ.z - 4,
      ),
      max: new THREE.Vector3(
        SHATTERED_CUBE_WORLD_XZ.x + 4,
        cubeFootY + 8,
        SHATTERED_CUBE_WORLD_XZ.z + 4,
      ),
    },
    {
      min: new THREE.Vector3(
        MARBLE_MONOLITH_WORLD_XZ.x - 3,
        marbleFootY,
        MARBLE_MONOLITH_WORLD_XZ.z - 2,
      ),
      max: new THREE.Vector3(
        MARBLE_MONOLITH_WORLD_XZ.x + 3,
        marbleFootY + marbleMonolithHeight + 2,
        MARBLE_MONOLITH_WORLD_XZ.z + 2,
      ),
    },
    {
      min: new THREE.Vector3(gapLeft - 2.2, portalFootY, portalWorldZ - 2.2),
      max: new THREE.Vector3(gapLeft + 0.2, portalFootY + PORTAL_HEIGHT, portalWorldZ + 2.2),
    },
    {
      min: new THREE.Vector3(gapRight - 0.2, portalFootY, portalWorldZ - 2.2),
      max: new THREE.Vector3(gapRight + 2.2, portalFootY + PORTAL_HEIGHT, portalWorldZ + 2.2),
    },
  ];

  /** Garde le point rose du path après corrections de hauteur (orbit preview). */
  const syncOrbitToPathLook = () => {
    camera.lookAt(pathLookTarget);
    controls.target.copy(pathLookTarget);
  };

  const enterOrbitMode = () => {
    pathMode = false;
    pathPlaying = false;
    thirdPerson?.exit();
    guideLine.setVisible(false);
    controls.enabled = true;
    syncOrbitToPathLook();
  };

  const enterPathMode = () => {
    pathMode = true;
    controls.enabled = false;
  };

  let povActive = false;
  const guideLine = createNavigationGuideLine(scene, walkSurface);

  const applyPathSample = (u: number) => {
    pathU = THREE.MathUtils.clamp(u, 0, 1);
    const sample = pathSampler.sample(pathU);
    camera.position.copy(sample.position);
    pathLookTarget.copy(sample.lookAt);
    camera.lookAt(pathLookTarget);
    controls.target.copy(pathLookTarget);
    pathExhibit = pathSampler.getExhibit(pathU);
    const pathFov = samplePathLensFov(pathU, renderTuning.fov);
    if (Math.abs(camera.fov - pathFov) > 0.05) {
      camera.fov = pathFov;
      camera.updateProjectionMatrix();
    }
  };

  let thirdPerson: ThirdPersonWalkController | null = null;
  let thirdPersonLoading = false;

  const ensureThirdPerson = (): Promise<ThirdPersonWalkController | null> => {
    if (thirdPerson) return Promise.resolve(thirdPerson);
    if (thirdPersonLoading) return Promise.resolve(null);
    thirdPersonLoading = true;
    return import("../locomotion/thirdPersonWalk")
      .then(({ createThirdPersonWalkController }) => {
        if (isSceneDisposed()) return null;
        thirdPerson = createThirdPersonWalkController({
          scene,
          canvas,
          walkSurface,
          colliders: walkColliders,
          renderTuning,
          onExit: () => {
            povActive = false;
            applyPathSample(pathU);
            enterOrbitMode();
            ctx.onExitExplore();
          },
        });
        return thirdPerson;
      })
      .catch((err) => {
        console.error("[Prism landing] POV walk failed to load:", err);
        return null;
      })
      .finally(() => {
        thirdPersonLoading = false;
      });
  };

  applyPathSample(0);
  enterOrbitMode();
  setCinematicMode(false);
  notifyCinematicChange(false);

  const handle: LandingTravellingHandle = {
    setPathU(u) {
      thirdPerson?.exit();
      applyPathSample(u);
      enterOrbitMode();
    },
    getPathU() {
      return pathU;
    },
    playPath() {
      thirdPerson?.exit();
      guideLine.setVisible(false);
      enterPathMode();
      pathPlaying = true;
      if (pathU >= 1) pathU = 0;
    },
    pausePath() {
      pathPlaying = false;
      enterOrbitMode();
    },
    isPathPlaying() {
      return pathPlaying;
    },
    setPovMode(on) {
      if (on) {
        pathMode = false;
        pathPlaying = false;
        povActive = true;
        clearCameraTransition();
        setCinematicMode(false);
        controls.enabled = false;
        void ensureThirdPerson().then((tp) => {
          if (!povActive || !tp) return;
          tp.enter(camera, controls.target);
        });
        guideLine.setVisible(true);
      } else {
        povActive = false;
        applyPathSample(pathU);
        enterOrbitMode();
      }
    },
    getPovMode() {
      return thirdPerson?.isActive() ?? false;
    },
    getPathExhibit() {
      return pathExhibit;
    },
  };

  return {
    handle,
    ownsCamera() {
      return (pathMode && pathPlaying) || (thirdPerson?.isActive() ?? false);
    },
    getExploreFocusWorldPosition(target) {
      return thirdPerson?.getFocusWorldPosition(target) ?? false;
    },
    beforeCameraTransition() {
      pathMode = false;
      pathPlaying = false;
      thirdPerson?.exit();
      guideLine.setVisible(false);
      controls.enabled = true;
    },
    update(dt) {
      guideLine.setOpacity(renderTuning.guideLineOpacity);
      if (thirdPerson?.isActive()) {
        thirdPerson.update(dt, camera);
        return true;
      }
      if (pathPlaying) {
        pathMode = true;
        controls.enabled = false;
        const step = dt > 1e-5 ? dt : 1 / 60;
        pathU = Math.min(1, pathU + step / CAMERA_PATH_PLAY_DURATION);
        applyPathSample(pathU);
        if (pathU >= 1) {
          pathPlaying = false;
          enterOrbitMode();
        }
        return true;
      }
      return false;
    },
    dispose() {
      thirdPerson?.dispose();
      guideLine.dispose();
    },
  };
}
