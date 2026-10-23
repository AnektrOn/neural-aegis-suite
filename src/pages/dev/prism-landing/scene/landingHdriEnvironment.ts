import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import hdriUrl from "../assets/hdri/moonless_golf_1k.hdr?url";

/** Poly Haven CC0 — https://polyhaven.com/a/moonless_golf */
export const LANDING_HDRI_SOURCE = "Poly Haven — moonless_golf (CC0)";

export type LandingHdriEnvironment = {
  texture: THREE.Texture;
  /** Intensité mixée avec l'IBL procédurale existante. */
  setEnabled: (on: boolean) => void;
  setIntensity: (intensity: number) => void;
  dispose: () => void;
};

export async function createLandingHdriEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  proceduralEnv: THREE.Texture,
): Promise<LandingHdriEnvironment> {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  let hdriTex: THREE.Texture | null = null;
  try {
    const loader = new RGBELoader();
    const equirect = await loader.loadAsync(hdriUrl);
    equirect.mapping = THREE.EquirectangularReflectionMapping;
    hdriTex = pmrem.fromEquirectangular(equirect).texture;
    equirect.dispose();
  } catch (err) {
    console.warn("HDRI landing indisponible, IBL procédurale seule:", err);
  }

  let enabled = false;
  let intensity = 0.35;
  const baseProcedural = proceduralEnv;

  const apply = () => {
    if (!enabled || !hdriTex) {
      scene.environment = baseProcedural;
      scene.environmentIntensity = 1;
      return;
    }
    scene.environment = hdriTex;
    scene.environmentIntensity = intensity;
  };

  apply();

  return {
    texture: hdriTex ?? baseProcedural,
    setEnabled(on) {
      enabled = on;
      apply();
    },
    setIntensity(v) {
      intensity = Math.max(0, Math.min(1.5, v));
      apply();
    },
    dispose() {
      hdriTex?.dispose();
      pmrem.dispose();
    },
  };
}
