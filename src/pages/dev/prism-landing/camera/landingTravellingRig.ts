import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CAMERA_PATH_PLAY_DURATION,
  createCameraPathSampler,
  type PathExhibit,
} from "./cameraPath";
import { createLandingHeadlines3D, type LandingHeadline } from "../scene/createLandingHeadlines3D";
import { MARBLE_MONOLITH_WORLD_XZ } from "../scene/marbleMonolithAssets";
import { SHATTERED_CUBE_WORLD_XZ } from "../scene/shatteredCubeAssets";
import type { LandingRenderTuning } from "../scene/landingRenderTuning";

export type LandingTravellingHandle = {
  setPathU: (u: number) => void;
  getPathU: () => number;
  playPath: () => void;
  pausePath: () => void;
  isPathPlaying: () => boolean;
  getPathExhibit: () => PathExhibit;
};

export type LandingTravellingRigContext = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scene: THREE.Scene;
  getTerrainHeight: (x: number, z: number) => number;
  applyLightFalloff: (material: THREE.Material) => void;
  isSceneDisposed: () => boolean;
  setCinematicMode: (on: boolean) => void;
  notifyCinematicChange: (on: boolean) => void;
  renderTuning: LandingRenderTuning;
};

export type LandingTravellingRig = {
  handle: LandingTravellingHandle;
  /** true = le rig pilote la caméra (pas OrbitControls). */
  ownsCamera: () => boolean;
  update: (dt: number) => void;
  beforeCameraTransition: () => void;
  dispose: () => void;
};

export function attachLandingTravellingRig(ctx: LandingTravellingRigContext): LandingTravellingRig {
  const {
    camera,
    controls,
    scene,
    getTerrainHeight,
    applyLightFalloff,
    isSceneDisposed,
    setCinematicMode,
    notifyCinematicChange,
  } = ctx;

  const pathSampler = createCameraPathSampler(getTerrainHeight);
  let pathU = 0;
  /** false = OrbitControls libres ; true = caméra sur le path travelling. */
  let pathMode = false;
  let pathPlaying = false;
  let pathExhibit: PathExhibit = "intro";
  const pathLookTarget = new THREE.Vector3();

  /** Garde le point rose du path après corrections de hauteur (orbit preview). */
  const syncOrbitToPathLook = () => {
    camera.lookAt(pathLookTarget);
    controls.target.copy(pathLookTarget);
  };

  const enterOrbitMode = () => {
    pathMode = false;
    pathPlaying = false;
    controls.enabled = true;
    if (camera.position.y < 2) {
      camera.position.y = 10;
    }
    syncOrbitToPathLook();
  };

  const enterPathMode = () => {
    pathMode = true;
    controls.enabled = false;
  };

  let landingHeadlines: LandingHeadline[] = [];

  const syncHeadlineVisibility = () => {
    for (const headline of landingHeadlines) {
      const show =
        (headline.exhibit === "cube" && (pathExhibit === "cube" || pathExhibit === "intro")) ||
        (headline.exhibit === "marble" && pathExhibit === "marble");
      headline.setVisible(show);
    }
  };

  const applyPathSample = (u: number) => {
    pathU = THREE.MathUtils.clamp(u, 0, 1);
    const sample = pathSampler.sample(pathU);
    camera.position.copy(sample.position);
    pathLookTarget.copy(sample.lookAt);
    camera.lookAt(pathLookTarget);
    controls.target.copy(pathLookTarget);
    pathExhibit = pathSampler.getExhibit(pathU);
    syncHeadlineVisibility();
  };

  void createLandingHeadlines3D({
    scene,
    getGroundHeight: getTerrainHeight,
    applyLightFalloff,
    cubeWorld: SHATTERED_CUBE_WORLD_XZ,
    marbleWorld: MARBLE_MONOLITH_WORLD_XZ,
  })
    .then((built) => {
      if (isSceneDisposed()) {
        for (const h of built) h.dispose();
        return;
      }
      landingHeadlines = built;
      syncHeadlineVisibility();
    })
    .catch((err) => {
      console.error("Landing headlines 3D failed:", err);
    });

  applyPathSample(0);
  enterOrbitMode();
  setCinematicMode(false);
  notifyCinematicChange(false);

  const handle: LandingTravellingHandle = {
    setPathU(u) {
      applyPathSample(u);
      enterOrbitMode();
    },
    getPathU() {
      return pathU;
    },
    playPath() {
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
    getPathExhibit() {
      return pathExhibit;
    },
  };

  return {
    handle,
    ownsCamera() {
      return pathMode && pathPlaying;
    },
    beforeCameraTransition() {
      pathMode = false;
      pathPlaying = false;
      controls.enabled = true;
    },
    update(dt) {
      if (pathPlaying && pathMode) {
        pathU = Math.min(1, pathU + dt / CAMERA_PATH_PLAY_DURATION);
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
      for (const headline of landingHeadlines) {
        scene.remove(headline.group);
        headline.dispose();
      }
      landingHeadlines = [];
    },
  };
}
