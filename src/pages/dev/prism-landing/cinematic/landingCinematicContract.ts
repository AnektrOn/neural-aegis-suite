/**
 * Contrat cinéma landing — sujets (acteurs de scène) + vocabulaire de plans.
 * Référence pédagogique : StudioBinder « 50+ Types of Camera Shots » (2025).
 * @see src/pages/dev/prism-landing/docs/LANDING_CINEMATIC_BIBLE.md
 */

import {
  LANDING_SCENE_LAYOUT,
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
} from "../layout/landingSceneLayout";
import {
  LAYOUT_CUBE_CENTER_Y,
  LAYOUT_MARBLE_HOVER,
  LAYOUT_MARBLE_SIZE,
  LAYOUT_PORTAL_HEIGHT,
} from "../layout/prismLayoutSceneScale";
import type { CinematicDroneMoveId } from "./landingDroneMovesContract";
import type { LandingDronePostMetadata } from "./landingDronePostContract";
import type { LayoutEditorVec3 } from "../layout/sceneLayout";

/** Sujets que la caméra peut viser (équivalent « acteurs / set pieces »). */
export type LandingSubjectId =
  | "scene_envelope"
  | "terrain_zone"
  | "cube"
  | "marble"
  | "portal"
  | "portal_slit";

export type LandingSubjectRole = "environment" | "hero" | "set_piece" | "threshold";

export type LandingSubject = {
  id: LandingSubjectId;
  label: string;
  role: LandingSubjectRole;
  /** Point monde pour lookAt / « Viser ». */
  lookAt: LayoutEditorVec3;
  /** Notes pour shot list / régie. */
  narrative: string;
};

/** Tailles de plan (shot size) — abréviations shot list US. */
export type ShotSizeAbbrev =
  | "EST"
  | "EWS"
  | "ELS"
  | "WS"
  | "LS"
  | "FS"
  | "MWS"
  | "MLS"
  | "CS"
  | "MS"
  | "MCU"
  | "CU"
  | "ECU";

export type ShotFraming =
  | "single"
  | "two_shot"
  | "three_shot"
  | "ots"
  | "oth"
  | "pov";

export type ShotAngle =
  | "eye_level"
  | "low"
  | "high"
  | "hip"
  | "knee"
  | "ground"
  | "shoulder"
  | "dutch"
  | "birds_eye"
  | "aerial";

export type ShotMovement =
  | "static"
  | "dolly"
  | "zoom"
  | "dolly_zoom"
  | "pan"
  | "tilt"
  | "whip_pan"
  | "whip_tilt"
  | "tracking"
  | "crab"
  | "arc";

export type ShotFocus =
  | "deep"
  | "shallow"
  | "rack_focus"
  | "soft"
  | "split_diopter"
  | "tilt_shift";

/** Une ligne de shot list pour une étape du travelling (u + intention). */
export type LandingShotBeat = {
  /** Titre lisible (ex. « Acte 1 — révéler la zone »). */
  label?: string;
  subjectId: LandingSubjectId;
  secondarySubjectId?: LandingSubjectId;
  shotSize: ShotSizeAbbrev;
  framing?: ShotFraming;
  angle?: ShotAngle;
  movement?: ShotMovement;
  focus?: ShotFocus;
  /** Intention dramatique / émotion. */
  intent?: string;
  /** Post-production drone (AAI / montage) — voir LANDING_DRONE_POSTPRODUCTION.md */
  post?: LandingDronePostMetadata;
  /** Mouvement pilote Adorama (orbit, dronie, …) — segment depuis cette étape. */
  droneMove?: CinematicDroneMoveId;
  /** FOV vertical (°) pour ce plan — téléobjectif / grand angle. */
  lensFov?: number;
  /** Plan « marquant » (étape dédiée dans l’éditeur). */
  markShotId?: string;
};

export type LandingCameraKeyframeCinematic = LandingShotBeat;

export const LANDING_SUBJECTS: LandingSubject[] = buildLandingSubjects();

function buildLandingSubjects(): LandingSubject[] {
  const L = LANDING_SCENE_LAYOUT;
  const focusX = (L.cube.x + L.marble.x + L.portal.x) / 3;
  const focusZ = (L.cube.z + L.marble.z + L.portal.z) / 3;

  return [
    {
      id: "scene_envelope",
      label: "Scène (ensemble)",
      role: "environment",
      lookAt: { x: focusX, y: 2.5, z: focusZ },
      narrative: "Establishing / geography — où nous sommes avant les sujets.",
    },
    {
      id: "terrain_zone",
      label: "Zone de jeu (terrain)",
      role: "environment",
      lookAt: { x: LANDING_TERRAIN_CENTER_X, y: 0, z: LANDING_TERRAIN_CENTER_Z },
      narrative: "Sol, eau, brume — échelle du lieu.",
    },
    {
      id: "cube",
      label: "Cube fracturé",
      role: "hero",
      lookAt: { x: L.cube.x, y: LAYOUT_CUBE_CENTER_Y, z: L.cube.z },
      narrative: "Premier acte — mystère, fragment, promesse.",
    },
    {
      id: "marble",
      label: "Monolithe marbre",
      role: "set_piece",
      lookAt: {
        x: L.marble.x,
        y: LAYOUT_MARBLE_SIZE.height / 2 + LAYOUT_MARBLE_HOVER,
        z: L.marble.z,
      },
      narrative: "Deuxième acte — matière, poids, craft.",
    },
    {
      id: "portal",
      label: "Portail + piliers",
      role: "threshold",
      lookAt: { x: L.portal.x, y: LAYOUT_PORTAL_HEIGHT * 0.42, z: L.portal.z },
      narrative: "Troisième acte — passage, seuil, lumière de fente.",
    },
    {
      id: "portal_slit",
      label: "Fente du portail",
      role: "threshold",
      lookAt: { x: L.portal.x, y: LAYOUT_PORTAL_HEIGHT * 0.5, z: L.portal.z + 0.35 },
      narrative: "ECU / détail — énergie, regard dans la faille.",
    },
  ];
}

export function landingSubjectById(id: LandingSubjectId): LandingSubject {
  const found = LANDING_SUBJECTS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown landing subject: ${id}`);
  return found;
}

export function landingSubjectLookAt(id: LandingSubjectId): LayoutEditorVec3 {
  return { ...landingSubjectById(id).lookAt };
}

/** Distance caméra → sujet suggérée (m) pour cadrer un shot size. */
export const SHOT_SIZE_SUGGESTED_DISTANCE_M: Record<ShotSizeAbbrev, number> = {
  EST: 55,
  EWS: 48,
  ELS: 48,
  WS: 32,
  LS: 32,
  FS: 22,
  MWS: 18,
  MLS: 18,
  CS: 14,
  MS: 10,
  MCU: 7,
  CU: 4.5,
  ECU: 2.5,
};

export const SHOT_SIZE_LABELS: Record<
  ShotSizeAbbrev,
  { en: string; fr: string; studioBinderNote: string }
> = {
  EST: {
    en: "Establishing Shot",
    fr: "Plan d’ensemble (établissement)",
    studioBinderNote: "Ouvre la scène — géographie, souvent WS/EWS.",
  },
  EWS: {
    en: "Extreme Wide Shot",
    fr: "Très grand plan d’ensemble",
    studioBinderNote: "Sujet petit dans le décor — isolement, échelle.",
  },
  ELS: { en: "Extreme Long Shot", fr: "Plan d’ensemble extrême", studioBinderNote: "Alias EWS." },
  WS: {
    en: "Wide Shot",
    fr: "Plan large",
    studioBinderNote: "Corps entier + décor lisible.",
  },
  LS: { en: "Long Shot", fr: "Plan lointain", studioBinderNote: "Alias WS." },
  FS: {
    en: "Full Shot",
    fr: "Plan pied",
    studioBinderNote: "Sujet tête aux pieds dans le cadre.",
  },
  MWS: {
    en: "Medium Wide Shot",
    fr: "Plan américain large",
    studioBinderNote: "Environ genoux — entre FS et MS.",
  },
  MLS: { en: "Medium Long Shot", fr: "Plan moyen long", studioBinderNote: "Alias MWS." },
  CS: {
    en: "Cowboy Shot",
    fr: "Plan cowboy",
    studioBinderNote: "Mi-cuisses — holster, posture de duel.",
  },
  MS: {
    en: "Medium Shot",
    fr: "Plan moyen",
    studioBinderNote: "Taille — dialogue, blocking.",
  },
  MCU: {
    en: "Medium Close-Up",
    fr: "Plan rapproché poitrine",
    studioBinderNote: "Poitrine / visage partiel.",
  },
  CU: {
    en: "Close-Up",
    fr: "Gros plan",
    studioBinderNote: "Émotion, réaction.",
  },
  ECU: {
    en: "Extreme Close-Up",
    fr: "Très gros plan",
    studioBinderNote: "Détail (yeux, fente, texture).",
  },
};

export const SHOT_FRAMING_LABELS: Record<ShotFraming, string> = {
  single: "Single — un sujet au centre de l’attention",
  two_shot: "Two shot — deux sujets dans le même cadre",
  three_shot: "Three shot — trois sujets",
  ots: "Over-the-shoulder — par-dessus l’épaule",
  oth: "Over-the-hip — par-dessus la hanche",
  pov: "Point of view — regard du personnage / caméra subjective",
};

export const SHOT_ANGLE_LABELS: Record<ShotAngle, string> = {
  eye_level: "Eye level — neutre",
  low: "Low angle — caméra en bas (puissance)",
  high: "High angle — plongée (vulnérabilité)",
  hip: "Hip level",
  knee: "Knee level",
  ground: "Ground level",
  shoulder: "Shoulder level",
  dutch: "Dutch angle — horizon incliné",
  birds_eye: "Bird’s eye / overhead",
  aerial: "Aerial / drone",
};

export const SHOT_MOVEMENT_LABELS: Record<ShotMovement, string> = {
  static: "Static — caméra fixe",
  dolly: "Dolly — chariot",
  zoom: "Zoom optique",
  dolly_zoom: "Dolly zoom / Vertigo",
  pan: "Pan horizontal",
  tilt: "Tilt vertical",
  whip_pan: "Whip pan",
  whip_tilt: "Whip tilt",
  tracking: "Tracking — suit le sujet",
  crab: "Crab — latéral chariot",
  arc: "Arc — orbite autour du sujet",
};

export const SHOT_FOCUS_LABELS: Record<ShotFocus, string> = {
  deep: "Deep focus — tout net",
  shallow: "Shallow focus — sujet isolé",
  rack_focus: "Rack focus — transfert de netteté",
  soft: "Soft focus — onirique",
  split_diopter: "Split diopter",
  tilt_shift: "Tilt-shift",
};
