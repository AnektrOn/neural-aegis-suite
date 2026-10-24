import * as THREE from "three";

/** Réglages live caméra / rendu / étalonnage (panneau landing). */
export type LandingRenderTuning = {
  fov: number;
  exposure: number;
  vignette: number;
  fogDensity: number;
  bloomStrength: number;
  /** Multiplicateur godrays écran (1 = suit l'atmosphère). */
  godrayStrength: number;
  /** Grain argentique (0 = off, ~0.08 = fort). */
  grain: number;
  /** Échelle du grain (1 = fin, 3 = gros). */
  grainSize: number;
  /** Température WB : -1 froid (bleu) → +1 chaud (orange). */
  temperature: number;
  /** Teinte WB : -1 vert → +1 magenta. */
  tint: number;
  /** Contraste global (1 = neutre). */
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  /** Saturation (1 = neutre, 0 = N&B). */
  saturation: number;
  /** Vibrance (pousse les couleurs faibles sans brûler les saturées). */
  vibrance: number;
  /** Fade filmique : relève les noirs (0–0.2). */
  fade: number;
  /** Aberration chromatique légère. */
  chromaticAberration: number;
  /** Preset actif (affiche seulement — les sliders portent la vérité). */
  filterId: LandingFilterId;
  exploreCamDistance: number;
  exploreCamHeight: number;
  exploreCamLerp: number;
  exploreBodyLerp: number;
  exploreMaxSpeed: number;
  guideLineOpacity: number;
  /** Ajuste le DPR selon le FPS (landing). */
  autoPixelRatio: boolean;
  /** Si `autoPixelRatio` est faux, DPR fixe (1–2). */
  manualPixelRatio: number;
  /** IBL crépusculaire (HDRI Poly Haven) en complément du dôme. */
  hdriEnvironment: boolean;
  hdriIntensity: number;
  groundAntiTiling: boolean;
  groundParallax: boolean;
  groundRoughnessNoise: boolean;
  portalVolumetric: boolean;
  portalVolumetricStrength: number;
  puddleReflection: boolean;
  /** GTAO demi-résolution (désactivé si DPR < 1.5). */
  highQualityAo: boolean;
  /** LUT ciné (`assets/lut/F-6800-STD.cube` ou fallback). */
  lutStrength: number;
  /** AgX plutôt qu'ACES dans le grade (comparaison hautes lumières). */
  toneMappingAgx: boolean;
  depthOfField: boolean;
  depthOfFieldStrength: number;
};

export type LandingFilterId =
  | "custom"
  | "mine"
  | "neutral"
  | "film"
  | "tealOrange"
  | "mono"
  | "cold"
  | "warm"
  | "bleach"
  | "dusk"
  | "villeneuve";

export type LandingFilterPreset = {
  id: LandingFilterId;
  label: string;
  /** Champs d’étalonnage appliqués au clic (hors caméra / explore). */
  grade: Partial<
    Pick<
      LandingRenderTuning,
      | "exposure"
      | "vignette"
      | "grain"
      | "grainSize"
      | "temperature"
      | "tint"
      | "contrast"
      | "highlights"
      | "shadows"
      | "whites"
      | "blacks"
      | "saturation"
      | "vibrance"
      | "fade"
      | "chromaticAberration"
      | "bloomStrength"
      | "godrayStrength"
      | "fogDensity"
      | "fov"
    >
  >;
};

/** Ciné Villeneuve — multiplicateurs sur l'atmosphère (fog/bloom/godray/grade de base). */
export const LANDING_RENDER_TUNING_DEFAULTS: LandingRenderTuning = {
  fov: 26,
  exposure: 1,
  vignette: 1,
  fogDensity: 1,
  bloomStrength: 0.52,
  godrayStrength: 0.62,
  grain: 1,
  grainSize: 1.1,
  temperature: -0.18,
  tint: 0,
  contrast: 1.02,
  highlights: -0.1,
  shadows: 0.08,
  whites: 0,
  blacks: 0.06,
  saturation: 0.78,
  vibrance: 0.06,
  fade: 0.045,
  chromaticAberration: 1,
  filterId: "villeneuve",
  exploreCamDistance: 4.2,
  exploreCamHeight: 2.1,
  exploreCamLerp: 6,
  exploreBodyLerp: 12,
  exploreMaxSpeed: 5.5,
  guideLineOpacity: 0.72,
  autoPixelRatio: true,
  manualPixelRatio: 1.5,
  hdriEnvironment: false,
  hdriIntensity: 0.35,
  groundAntiTiling: false,
  groundParallax: false,
  groundRoughnessNoise: false,
  portalVolumetric: false,
  portalVolumetricStrength: 0.55,
  puddleReflection: false,
  highQualityAo: false,
  lutStrength: 0.42,
  toneMappingAgx: false,
  depthOfField: false,
  depthOfFieldStrength: 0.55,
};

export const LANDING_FILTER_PRESETS: LandingFilterPreset[] = [
  {
    id: "villeneuve",
    label: "Villeneuve",
    grade: {
      exposure: 0.96,
      vignette: 1,
      grain: 0.85,
      grainSize: 1.1,
      temperature: -0.18,
      tint: 0,
      contrast: 1.06,
      highlights: -0.14,
      shadows: 0.04,
      whites: -0.04,
      blacks: -0.02,
      saturation: 0.58,
      vibrance: 0.04,
      fade: 0.028,
      chromaticAberration: 0.65,
      bloomStrength: 0.42,
      godrayStrength: 0.55,
      fogDensity: 0.88,
      fov: 26,
    },
  },
  {
    id: "mine",
    label: "Mes réglages",
    grade: {
      exposure: 0.48,
      vignette: 1.05,
      grain: 3.8,
      grainSize: 0.65,
      temperature: -0.42,
      tint: 0.06,
      contrast: 1.38,
      highlights: 0.25,
      shadows: -0.17,
      whites: 0.04,
      blacks: 0.45,
      saturation: 0.7,
      vibrance: 0.1,
      fade: 0.03,
      chromaticAberration: 2.2,
      bloomStrength: 2.1,
      godrayStrength: 1.4,
      fogDensity: 1.28,
      fov: 58,
    },
  },
  {
    id: "neutral",
    label: "Neutre",
    grade: {
      exposure: 1.05,
      vignette: 0.2,
      grain: 0.012,
      grainSize: 1,
      temperature: 0,
      tint: 0,
      contrast: 1,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      saturation: 1,
      vibrance: 0,
      fade: 0,
      chromaticAberration: 0,
      bloomStrength: 0.35,
    },
  },
  {
    id: "film",
    label: "Film",
    grade: {
      exposure: 1.0,
      vignette: 0.46,
      grain: 0.045,
      grainSize: 1.2,
      temperature: 0.05,
      tint: -0.02,
      contrast: 1.05,
      highlights: -0.08,
      shadows: 0.06,
      whites: 0,
      blacks: 0.04,
      saturation: 0.74,
      vibrance: 0.12,
      fade: 0.02,
      chromaticAberration: 0.0012,
      bloomStrength: 0.42,
    },
  },
  {
    id: "tealOrange",
    label: "Teal / Orange",
    grade: {
      exposure: 1.02,
      vignette: 0.4,
      grain: 0.03,
      grainSize: 1.1,
      temperature: 0.18,
      tint: -0.08,
      contrast: 1.12,
      highlights: -0.05,
      shadows: 0.12,
      whites: 0.05,
      blacks: 0.02,
      saturation: 0.88,
      vibrance: 0.28,
      fade: 0.015,
      chromaticAberration: 0.0015,
      bloomStrength: 0.48,
    },
  },
  {
    id: "mono",
    label: "N & B",
    grade: {
      exposure: 1.08,
      vignette: 0.55,
      grain: 0.07,
      grainSize: 1.6,
      temperature: 0,
      tint: 0,
      contrast: 1.2,
      highlights: -0.12,
      shadows: 0.08,
      whites: 0.06,
      blacks: -0.04,
      saturation: 0,
      vibrance: 0,
      fade: 0.025,
      chromaticAberration: 0,
      bloomStrength: 0.28,
    },
  },
  {
    id: "cold",
    label: "Froid",
    grade: {
      exposure: 0.98,
      vignette: 0.42,
      grain: 0.04,
      grainSize: 1.1,
      temperature: -0.42,
      tint: 0.06,
      contrast: 1.08,
      highlights: -0.1,
      shadows: 0.1,
      whites: -0.04,
      blacks: 0.02,
      saturation: 0.7,
      vibrance: 0.1,
      fade: 0.018,
      chromaticAberration: 0.001,
      bloomStrength: 0.4,
    },
  },
  {
    id: "warm",
    label: "Chaud",
    grade: {
      exposure: 1.06,
      vignette: 0.38,
      grain: 0.035,
      grainSize: 1.05,
      temperature: 0.48,
      tint: -0.04,
      contrast: 1.06,
      highlights: -0.04,
      shadows: 0.04,
      whites: 0.08,
      blacks: 0.02,
      saturation: 0.92,
      vibrance: 0.22,
      fade: 0.012,
      chromaticAberration: 0.001,
      bloomStrength: 0.5,
    },
  },
  {
    id: "bleach",
    label: "Bleach",
    grade: {
      exposure: 1.12,
      vignette: 0.32,
      grain: 0.055,
      grainSize: 1.4,
      temperature: -0.1,
      tint: 0.04,
      contrast: 1.28,
      highlights: 0.15,
      shadows: -0.08,
      whites: 0.12,
      blacks: -0.1,
      saturation: 0.45,
      vibrance: 0.05,
      fade: 0.04,
      chromaticAberration: 0.002,
      bloomStrength: 0.55,
    },
  },
  {
    id: "dusk",
    label: "Crépuscule",
    grade: {
      exposure: 0.92,
      vignette: 0.52,
      grain: 0.05,
      grainSize: 1.25,
      temperature: 0.32,
      tint: 0.1,
      contrast: 1.1,
      highlights: -0.18,
      shadows: 0.15,
      whites: -0.08,
      blacks: 0.06,
      saturation: 0.8,
      vibrance: 0.2,
      fade: 0.03,
      chromaticAberration: 0.0014,
      bloomStrength: 0.45,
    },
  },
];

export function createLandingRenderTuningState(): LandingRenderTuning {
  return { ...LANDING_RENDER_TUNING_DEFAULTS };
}

export function applyLandingFilterPreset(
  current: LandingRenderTuning,
  presetId: LandingFilterId,
): LandingRenderTuning {
  const preset = LANDING_FILTER_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { ...current, filterId: "custom" };
  return {
    ...current,
    ...preset.grade,
    filterId: preset.id,
  };
}

export type LandingRenderTuningTargets = {
  camera: THREE.PerspectiveCamera;
  renderer?: THREE.WebGLRenderer;
  fog?: THREE.FogExp2 | null;
  bloomPass?: { strength: number } | null;
  gradePass?: { uniforms: Record<string, { value: unknown }> } | null;
};

export type LandingRenderTuningHandle = {
  getLandingRenderTuning: () => LandingRenderTuning;
  setLandingRenderTuning: (partial: Partial<LandingRenderTuning>) => void;
};

/** Applique FOV + fog + bloom + uniforms du grade (après atmosphere.update). */
export function syncLandingRenderTuning(
  tuning: LandingRenderTuning,
  targets: LandingRenderTuningTargets,
) {
  const { camera, fog, bloomPass, gradePass } = targets;

  if (camera.fov !== tuning.fov) {
    camera.fov = tuning.fov;
    camera.updateProjectionMatrix();
  }

  if (fog) {
    fog.density = tuning.fogDensity;
  }

  if (bloomPass) {
    bloomPass.strength = tuning.bloomStrength;
  }

  const gu = gradePass?.uniforms;
  if (!gu) return;

  const set = (key: string, value: number) => {
    if (gu[key]) gu[key].value = value;
  };

  set("uExposure", tuning.exposure);
  set("uVignette", tuning.vignette);
  set("uGrain", tuning.grain);
  set("uGrainSize", tuning.grainSize);
  set("uTemp", tuning.temperature);
  set("uTint", tuning.tint);
  set("uContrast", tuning.contrast);
  set("uHighlights", tuning.highlights);
  set("uShadows", tuning.shadows);
  set("uWhites", tuning.whites);
  set("uBlacks", tuning.blacks);
  set("uSaturation", tuning.saturation);
  set("uVibrance", tuning.vibrance);
  set("uFade", tuning.fade);
  set("uCA", tuning.chromaticAberration);
  set("uLUTStrength", tuning.lutStrength);
  set("uToneAgx", tuning.toneMappingAgx ? 1 : 0);
}
