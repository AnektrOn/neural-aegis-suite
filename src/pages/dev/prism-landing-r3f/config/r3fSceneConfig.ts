import {
  R3F_GODRAYS_HALL_GODRAYS,
} from "../scene/godraysHall/r3fGodraysHallConstants";
import { R3F_PMNDRS_POST_DEFAULTS } from "../scene/post/r3fPmndrsPostDefaults";

export type R3fSceneConfig = {
  godraysEnabled: boolean;
  godraysDensity: number;
  godraysMaxDensity: number;
  godraysDistanceAttenuation: number;
  godraysRaymarchSteps: number;
  godraysResolutionScale: number;
  godraysColor: string;
  godraysGammaCorrection: boolean;
  monolithCenterX: number;
  monolithCenterZ: number;
  monolithFootY: number;
  monolithHeight: number;
  gapWidth: number;
  pillarWidth: number;
  pillarDepth: number;
  gutterDepth: number;
  gutterWallThickness: number;
  slitEmitterColor: string;
  slitEmitterIntensity: number;
  /** Point au fond de la gouttière (godrays + spill court vers +Z). */
  emitLightIntensity: number;
  emitLightDistance: number;
  sceneEditMode: boolean;
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  n8aoEnabled: boolean;
  n8aoIntensity: number;
  n8aoRadius: number;
  gradeEnabled: boolean;
  environmentIntensity: number;
};

/** Champs lus par la géométrie fente / tuile (mesh + math). */
export type R3fSlitGeometryConfig = Pick<
  R3fSceneConfig,
  | "monolithFootY"
  | "monolithHeight"
  | "gapWidth"
  | "pillarWidth"
  | "pillarDepth"
  | "gutterDepth"
  | "gutterWallThickness"
  | "monolithCenterX"
  | "monolithCenterZ"
>;

export const R3F_SCENE_CONFIG_DEFAULTS: R3fSceneConfig = {
  godraysEnabled: true,
  godraysDensity: R3F_GODRAYS_HALL_GODRAYS.density,
  godraysMaxDensity: R3F_GODRAYS_HALL_GODRAYS.maxDensity,
  godraysDistanceAttenuation: R3F_GODRAYS_HALL_GODRAYS.distanceAttenuation,
  godraysRaymarchSteps: R3F_GODRAYS_HALL_GODRAYS.raymarchSteps,
  godraysResolutionScale: R3F_GODRAYS_HALL_GODRAYS.resolutionScale,
  godraysColor: "#ff9038",
  godraysGammaCorrection: R3F_GODRAYS_HALL_GODRAYS.gammaCorrection,
  monolithCenterX: 0,
  monolithCenterZ: -6,
  monolithFootY: 0,
  monolithHeight: 30,
  gapWidth: 1.7,
  pillarWidth: 2.85,
  pillarDepth: 3.8,
  gutterDepth: 3.35,
  gutterWallThickness: 0.14,
  slitEmitterColor: "#ffaa55",
  slitEmitterIntensity: 6,
  emitLightIntensity: 165,
  emitLightDistance: 52,
  sceneEditMode: false,
  bloomEnabled: R3F_PMNDRS_POST_DEFAULTS.bloomEnabled,
  bloomStrength: R3F_PMNDRS_POST_DEFAULTS.bloomStrength,
  bloomRadius: R3F_PMNDRS_POST_DEFAULTS.bloomRadius,
  bloomThreshold: R3F_PMNDRS_POST_DEFAULTS.bloomThreshold,
  n8aoEnabled: R3F_PMNDRS_POST_DEFAULTS.n8aoEnabled,
  n8aoIntensity: R3F_PMNDRS_POST_DEFAULTS.n8aoIntensity,
  n8aoRadius: R3F_PMNDRS_POST_DEFAULTS.n8aoRadius,
  gradeEnabled: R3F_PMNDRS_POST_DEFAULTS.gradeEnabled,
  environmentIntensity: R3F_PMNDRS_POST_DEFAULTS.environmentIntensity,
};
