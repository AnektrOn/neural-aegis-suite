import * as THREE from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { LandingPortalVolumetricPass } from "./landingPortalVolumetricPass";

export type LandingPostRealismBundle = {
  gtaoPass: GTAOPass | null;
  bokehPass: BokehPass | null;
  portalVolumePass: LandingPortalVolumetricPass | null;
  setGtaoEnabled: (on: boolean) => void;
  setPortalVolumeStrength: (strength: number) => void;
  setBokehEnabled: (on: boolean) => void;
  setBokehStrength: (strength: number) => void;
  resize: (width: number, height: number, pixelRatio: number) => void;
  dispose: () => void;
};

export function attachLandingPostRealism(
  composer: EffectComposer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  pixelRatio: number,
  insertBeforeBloomIndex: number,
): LandingPostRealismBundle {
  const halfW = Math.max(4, Math.floor(width * pixelRatio * 0.5));
  const halfH = Math.max(4, Math.floor(height * pixelRatio * 0.5));

  const gtaoPass = new GTAOPass(scene, camera, halfW, halfH);
  gtaoPass.enabled = false;
  gtaoPass.output = GTAOPass.OUTPUT.Default;

  const portalVolumePass = new LandingPortalVolumetricPass();
  portalVolumePass.enabled = false;
  portalVolumePass.setSize(halfW, halfH);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 18,
    aperture: 0.00012,
    maxblur: 0.008,
  });
  bokehPass.enabled = false;

  composer.insertPass(gtaoPass, insertBeforeBloomIndex);
  composer.insertPass(portalVolumePass, insertBeforeBloomIndex + 1);
  composer.insertPass(bokehPass, insertBeforeBloomIndex + 2);

  return {
    gtaoPass,
    bokehPass,
    portalVolumePass,
    setGtaoEnabled(on) {
      if (gtaoPass) gtaoPass.enabled = on;
    },
    setPortalVolumeStrength(strength) {
      portalVolumePass.material.uniforms.uStrength.value = strength;
      portalVolumePass.enabled = strength > 0.001;
    },
    setBokehEnabled(on) {
      bokehPass.enabled = on;
    },
    setBokehStrength(strength) {
      (bokehPass.uniforms as { maxblur: { value: number } }).maxblur.value =
        0.003 + strength * 0.012;
    },
    resize(w, h, pr) {
      const hw = Math.max(4, Math.floor(w * pr * 0.5));
      const hh = Math.max(4, Math.floor(h * pr * 0.5));
      gtaoPass.setSize(hw, hh);
      portalVolumePass.setSize(hw, hh);
      bokehPass.renderTargetDepth.setSize(w * pr, h * pr);
    },
    dispose() {
      gtaoPass.dispose();
      portalVolumePass.dispose();
      bokehPass.dispose();
    },
  };
}
