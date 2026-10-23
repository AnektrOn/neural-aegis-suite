import * as THREE from "three";
import { aimShaftThroughSlit } from "./landingPortalVolumetrics";

export type LandingGodraysLightRig = {
  light: THREE.DirectionalLight;
  updateAim: (camera: THREE.PerspectiveCamera) => void;
  dispose: () => void;
};

/** Lumière directionnelle dédiée aux godrays volumétriques (ombre + faible direct). */
export function createLandingGodraysLight(
  scene: THREE.Scene,
  slitCenter: THREE.Vector3,
  gapWidth: number,
  portalHeight: number,
  shadowMapSize = 2048,
): LandingGodraysLightRig {
  const light = new THREE.DirectionalLight(0xfff0e0, 0.09);
  light.castShadow = true;
  light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  light.shadow.bias = -0.00022;
  light.shadow.normalBias = 0.022;
  light.shadow.autoUpdate = true;

  const updateAim = (camera: THREE.PerspectiveCamera) => {
    aimShaftThroughSlit(light, slitCenter, camera.position, gapWidth, portalHeight);
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  };

  scene.add(light);
  scene.add(light.target);

  return {
    light,
    updateAim,
    dispose() {
      scene.remove(light);
      scene.remove(light.target);
      light.dispose();
    },
  };
}
