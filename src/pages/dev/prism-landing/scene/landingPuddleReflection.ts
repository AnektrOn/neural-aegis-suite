import * as THREE from "three";
import { LANDING_WATER_LEVEL } from "../layout/prismSceneConstants";

/** Reflets planaires basse résolution pour flaques (≈15 FPS max). */
export type LandingPuddleReflection = {
  texture: THREE.Texture;
  setEnabled: (on: boolean) => void;
  tick: (dt: number) => void;
  dispose: () => void;
};

export function createLandingPuddleReflection(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  terrainCenter: THREE.Vector3,
): LandingPuddleReflection {
  const size = 256;
  const rt = new THREE.WebGLRenderTarget(size, size, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });

  const reflectCam = new THREE.PerspectiveCamera();
  const reflectorWorld = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const waterY = LANDING_WATER_LEVEL;

  let enabled = false;
  let accum = 0;
  const interval = 1 / 15;

  const renderReflection = () => {
    reflectCam.copy(camera);
    reflectCam.getWorldPosition(reflectorWorld);
    reflectCam.getWorldDirection(lookAt);
    lookAt.add(reflectorWorld);

    reflectCam.position.set(
      reflectorWorld.x,
      2 * waterY - reflectorWorld.y,
      reflectorWorld.z,
    );
    reflectCam.lookAt(lookAt.x, 2 * waterY - lookAt.y, lookAt.z);
    reflectCam.up.set(0, -1, 0);
    reflectCam.updateMatrixWorld();

    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = true;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, reflectCam);
    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;
  };

  return {
    texture: rt.texture,
    setEnabled(on) {
      enabled = on;
    },
    tick(dt) {
      if (!enabled) return;
      accum += dt;
      if (accum < interval) return;
      accum -= interval;
      renderReflection();
    },
    dispose() {
      rt.dispose();
    },
  };
}
