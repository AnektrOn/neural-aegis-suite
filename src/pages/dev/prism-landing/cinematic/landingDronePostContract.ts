/**
 * Post-production drone — vocabulaire & mapping landing 3D.
 * Source pédagogique : AAI Drones « Post-Production Mastery for Drone Footage » (2025).
 * @see LANDING_DRONE_POSTPRODUCTION.md
 */

/** Profil global pour une étape ou le travelling entier. */
export type DronePostProfileId =
  | "neutral"
  | "cinematic_log_grade"
  | "event_punchy"
  | "slow_reveal"
  | "epic_wide";

export type DroneStabilizationApproach =
  | "in_camera_gimbal"
  | "software_smooth"
  | "intentional_handheld";

export type DroneColorStage =
  | "correction_rec709"
  | "flat_log_source"
  | "creative_grade"
  | "lut_teal_orange";

export type DroneSpeedTreatment =
  | "realtime"
  | "speed_ramp_up"
  | "speed_ramp_down"
  | "slow_motion"
  | "reverse";

export type DroneFrameTreatment =
  | "full_frame"
  | "letterbox_239"
  | "reframe_crop";

export type DroneTransitionStyle =
  | "cut"
  | "dissolve"
  | "whip_pan"
  | "match_move";

export type DroneSoundLayer =
  | "ambient_diegetic"
  | "sfx_whoosh"
  | "music_sync"
  | "non_diegetic_drone";

/** Notes post par étape du path (métadonnées shot list / export JSON). */
export type LandingDronePostMetadata = {
  profile?: DronePostProfileId;
  stabilization?: DroneStabilizationApproach;
  color?: DroneColorStage;
  speed?: DroneSpeedTreatment;
  frame?: DroneFrameTreatment;
  transitionOut?: DroneTransitionStyle;
  soundLayers?: DroneSoundLayer[];
  /** Notes libres (musique, SFX, export ProRes, etc.). */
  notes?: string;
};

export const DRONE_STABILIZATION_LABELS: Record<DroneStabilizationApproach, string> = {
  in_camera_gimbal: "Gimbal drone (in-camera)",
  software_smooth: "Stabilisation logicielle (path lissé)",
  intentional_handheld: "Handheld intentionnel",
};

export const DRONE_COLOR_LABELS: Record<DroneColorStage, string> = {
  correction_rec709: "Correction Rec.709",
  flat_log_source: "Source flat / log",
  creative_grade: "Étalonnage créatif",
  lut_teal_orange: "LUT teal & orange",
};

export const DRONE_SPEED_LABELS: Record<DroneSpeedTreatment, string> = {
  realtime: "Temps réel",
  speed_ramp_up: "Speed ramp (accélération)",
  speed_ramp_down: "Speed ramp (ralenti sortie)",
  slow_motion: "Slow motion",
  reverse: "Reverse",
};

export const DRONE_FRAME_LABELS: Record<DroneFrameTreatment, string> = {
  full_frame: "Plein cadre",
  letterbox_239: "Letterbox 2.39:1",
  reframe_crop: "Reframe / crop",
};

export const DRONE_TRANSITION_LABELS: Record<DroneTransitionStyle, string> = {
  cut: "Cut",
  dissolve: "Dissolve",
  whip_pan: "Whip pan",
  match_move: "Match move",
};

export const DRONE_SOUND_LAYER_LABELS: Record<DroneSoundLayer, string> = {
  ambient_diegetic: "Ambiance diégétique",
  sfx_whoosh: "SFX whoosh",
  music_sync: "Musique (sync montage)",
  non_diegetic_drone: "Drone / voix off",
};

export const DRONE_POST_PROFILE_LABELS: Record<
  DronePostProfileId,
  { label: string; intent: string }
> = {
  neutral: {
    label: "Neutre",
    intent: "Correction légère, pas de look imposé.",
  },
  cinematic_log_grade: {
    label: "Ciné (flat → grade)",
    intent: "Pipeline type D-Log / D-Cinelike puis étalonnage créatif.",
  },
  event_punchy: {
    label: "Event punchy",
    intent: "Contraste, cuts rythmés, SFX discrets.",
  },
  slow_reveal: {
    label: "Slow reveal",
    intent: "Mouvements lents, musique ample, establishing long.",
  },
  epic_wide: {
    label: "Epic wide",
    intent: "EWS/WS, letterbox, brume + bloom, son large.",
  },
};

/**
 * Équivalents dans la stack Prism landing (temps réel, pas Premiere).
 * Utilisé par la bible pour lier article drone → code.
 */
export const LANDING_POST_TOOL_MAP = {
  stabilization: {
    article: "Warp Stabilizer / Gyroflow / gimbal in-flight",
    landing: [
      "Interpolation path par segment (`pathSamplerByKeyframeU.ts`)",
      "Durée Play `CAMERA_PATH_PLAY_DURATION`",
      "Pas de shake caméra en mode path (`landingTravellingRig.ts`)",
      "Orbit damping (`OrbitControls`) hors travelling",
    ],
  },
  color: {
    article: "Correction → grading, LUT, teal/orange",
    landing: [
      "`landingRenderTuning.ts` (exposure, vignette, bloom, fog)",
      "`monolithColorPipeline.ts` / tone mapping ACES",
      "Atmosphere / glow sur portail",
    ],
  },
  cropZoom: {
    article: "Reframe, Ken Burns, éviter sur-crop 4K",
    landing: ["FOV caméra (`LandingRenderTuning.fov`)", "Shot size → distance suggérée"],
  },
  speed: {
    article: "Speed ramps, reverse, 24/30 vs 60/120 slow-mo",
    landing: [
      "Vitesse globale path (secondes)",
      "Futur : easing par segment sur `u`",
    ],
  },
  letterbox: {
    article: "Bandes noires 2.39:1",
    landing: ["CSS overlay canvas (à brancher)", "Safe area dans l’éditeur"],
  },
  vfx: {
    article: "Motion track, haze, CGI, Fusion/AE",
    landing: [
      "Godrays / bloom (`createCosmicMonolithScene`)",
      "Brume, eau, particules poussière",
    ],
  },
  sound: {
    article: "Ambiance, SFX, musique sync cuts",
    landing: [
      "Non implémenté — prévoir pistes diegetic / whoosh / score",
      "Marquer `soundLayers` sur chaque étape export JSON",
    ],
  },
  workflow: {
    article: "Organisation rushes, proxies, export ProRes/H.264",
    landing: [
      "Keyframes + shot list versionnés dans `sceneLayout.ts`",
      "Export JSON layout + path depuis `/dev/prism-layout`",
      "`LANDING_CINEMATIC_BIBLE.md` + ce fichier",
    ],
  },
} as const;
