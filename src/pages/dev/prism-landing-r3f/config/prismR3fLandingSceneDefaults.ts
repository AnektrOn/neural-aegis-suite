import type { R3fSceneConfig } from "./r3fSceneConfig";
import { R3F_PMNDRS_POST_DEFAULTS } from "../scene/post/r3fPmndrsPostDefaults";

/** Overrides scène pour la landing produit `/prism` (pas le lab Godrays Hall). */
export const PRISM_R3F_LANDING_SCENE_DEFAULTS: Partial<R3fSceneConfig> = {
  sceneEditMode: false,
  cubeGutterGodraysAttenuation: 0,
  hallSunIntensity: 0,
  bloomEnabled: true,
  bloomStrength: R3F_PMNDRS_POST_DEFAULTS.bloomStrength,
  bloomRadius: R3F_PMNDRS_POST_DEFAULTS.bloomRadius,
  bloomThreshold: R3F_PMNDRS_POST_DEFAULTS.bloomThreshold,
  n8aoEnabled: true,
  n8aoIntensity: 1.45,
  n8aoRadius: 4.5,
  gradeEnabled: true,
  filmGrainIntensity: 0.032,
  environmentIntensity: R3F_PMNDRS_POST_DEFAULTS.environmentIntensity,
};
