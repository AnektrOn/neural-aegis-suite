/**
 * Acte final — deux piliers, hauteur homme, grandiosité / brutalité (réf. Denis Villeneuve).
 * Étapes 13+ du travelling landing (u ≥ 0.609).
 */

import { LANDING_SCENE_LAYOUT } from "../layout/landingSceneLayout";
import { pillarWorldPositionsFromPortal } from "../layout/portalAssemblyLayout";
import { LAYOUT_PORTAL_HEIGHT } from "../layout/prismLayoutSceneScale";
import type { LandingCameraKeyframeCinematic } from "../cinematic/landingCinematicContract";
import type { LayoutEditorCameraKeyframe, LayoutEditorVec3 } from "../layout/sceneLayout";

export const LANDING_HUMAN_EYE_HEIGHT = 1.72;

const PORTAL = LANDING_SCENE_LAYOUT.portal;
const PILLARS = pillarWorldPositionsFromPortal(PORTAL);
const LEFT_PILLAR_LOOK: LayoutEditorVec3 = {
  x: PILLARS.leftPillar.x,
  y: LAYOUT_PORTAL_HEIGHT * 0.82,
  z: PILLARS.leftPillar.z,
};
const RIGHT_PILLAR_LOOK: LayoutEditorVec3 = {
  x: PILLARS.rightPillar.x,
  y: LAYOUT_PORTAL_HEIGHT * 0.82,
  z: PILLARS.rightPillar.z,
};
const SLIT_LOOK: LayoutEditorVec3 = {
  x: PORTAL.x,
  y: LAYOUT_PORTAL_HEIGHT * 0.5,
  z: PORTAL.z + 0.35,
};
const TWIN_PILLARS_LOOK: LayoutEditorVec3 = {
  x: PORTAL.x,
  y: LAYOUT_PORTAL_HEIGHT * 0.88,
  z: PORTAL.z,
};

const VILLENEUVE_POST_BASE: NonNullable<LandingCameraKeyframeCinematic["post"]> = {
  profile: "slow_reveal",
  stabilization: "software_smooth",
  color: "creative_grade",
  frame: "letterbox_239",
  speed: "realtime",
  soundLayers: ["ambient_diegetic", "music_sync"],
};

export type PillarFinaleStep = {
  u: number;
  position: LayoutEditorVec3;
  lookAt: LayoutEditorVec3;
  cinematic: LandingCameraKeyframeCinematic;
};

/** Neuf étapes (13→21) — pied des piliers, regard vers le haut / symétrie. */
export const VILLENEUVE_PILLAR_FINALE_STEPS: PillarFinaleStep[] = [
  {
    u: 0.609,
    position: { x: -5.2, y: LANDING_HUMAN_EYE_HEIGHT, z: 22.5 },
    lookAt: { x: PORTAL.x, y: 8, z: PORTAL.z },
    cinematic: {
      label: "Acte III — descente à hauteur homme",
      subjectId: "portal",
      secondarySubjectId: "marble",
      shotSize: "WS",
      framing: "two_shot",
      angle: "eye_level",
      movement: "dolly",
      focus: "deep",
      intent:
        "Quitter l’échelle drone : le portail entre dans le cadre, promesse de monument.",
      droneMove: "cable_cam",
      post: { ...VILLENEUVE_POST_BASE, notes: "Villeneuve : travelling lent, pas de cut." },
    },
  },
  {
    u: 0.646,
    position: { x: 1.5, y: LANDING_HUMAN_EYE_HEIGHT, z: 14 },
    lookAt: { x: PORTAL.x, y: 11, z: PORTAL.z },
    cinematic: {
      label: "Approche au sol — piliers en silhouette",
      subjectId: "portal",
      shotSize: "WS",
      framing: "two_shot",
      angle: "low",
      movement: "tracking",
      focus: "deep",
      intent: "Les deux piliers deviennent le sujet ; masse avant détail.",
      droneMove: "cable_cam",
      post: VILLENEUVE_POST_BASE,
    },
  },
  {
    u: 0.682,
    position: { x: 6.8, y: LANDING_HUMAN_EYE_HEIGHT, z: 7.2 },
    lookAt: TWIN_PILLARS_LOOK,
    cinematic: {
      label: "Deux piliers — plan large symétrique",
      subjectId: "portal",
      shotSize: "FS",
      framing: "two_shot",
      angle: "low",
      movement: "static",
      focus: "deep",
      intent: "Symétrie Villeneuve : cadre tenu, échelle humaine vs colosses.",
      droneMove: "cable_cam",
      post: VILLENEUVE_POST_BASE,
    },
  },
  {
    u: 0.728,
    position: { x: 9.6, y: LANDING_HUMAN_EYE_HEIGHT, z: 2.8 },
    lookAt: { x: PORTAL.x, y: 14.5, z: PORTAL.z },
    cinematic: {
      label: "Marche vers le seuil",
      subjectId: "portal",
      shotSize: "MS",
      framing: "two_shot",
      angle: "low",
      movement: "dolly",
      focus: "deep",
      intent: "Rapprochement inexorable ; le ciel se réduit au-dessus des piliers.",
      droneMove: "tilt_reveal",
      post: { ...VILLENEUVE_POST_BASE, speed: "slow_motion" },
    },
  },
  {
    u: 0.774,
    position: { x: PORTAL.x, y: LANDING_HUMAN_EYE_HEIGHT, z: -0.6 },
    lookAt: { x: PORTAL.x, y: 17.5, z: PORTAL.z },
    cinematic: {
      label: "Au pied — axe central",
      subjectId: "portal",
      shotSize: "FS",
      framing: "two_shot",
      angle: "low",
      movement: "static",
      focus: "deep",
      intent:
        "Plan fixe sacré : nous sommes entre les piliers, regard vers la voûte de pierre.",
      post: VILLENEUVE_POST_BASE,
    },
  },
  {
    u: 0.838,
    position: { x: 9.2, y: LANDING_HUMAN_EYE_HEIGHT, z: -2.9 },
    lookAt: LEFT_PILLAR_LOOK,
    cinematic: {
      label: "Pilier gauche — contre-plongée brutale",
      subjectId: "portal",
      shotSize: "CU",
      framing: "single",
      angle: "low",
      movement: "static",
      focus: "shallow",
      intent: "Texture, masse, verticalité écrasante — brutalité du monolithe.",
      post: { ...VILLENEUVE_POST_BASE, profile: "cinematic_log_grade" },
    },
  },
  {
    u: 0.901,
    position: { x: 14.6, y: LANDING_HUMAN_EYE_HEIGHT, z: -2.9 },
    lookAt: RIGHT_PILLAR_LOOK,
    cinematic: {
      label: "Pilier droit — miroir de puissance",
      subjectId: "portal",
      shotSize: "CU",
      framing: "single",
      angle: "low",
      movement: "static",
      focus: "shallow",
      intent: "Deuxième pilier : même violence visuelle, équilibre menaçant.",
      post: { ...VILLENEUVE_POST_BASE, profile: "cinematic_log_grade" },
    },
  },
  {
    u: 0.951,
    position: { x: PORTAL.x, y: LANDING_HUMAN_EYE_HEIGHT, z: -1.7 },
    lookAt: SLIT_LOOK,
    cinematic: {
      label: "Fente — lumière dans la faille",
      subjectId: "portal_slit",
      shotSize: "MCU",
      framing: "single",
      angle: "low",
      movement: "static",
      focus: "shallow",
      intent: "Détail sacré : la fente comme œil / porte — silence avant le choc final.",
      droneMove: "tilt_reveal",
      post: VILLENEUVE_POST_BASE,
    },
  },
  {
    u: 1,
    position: { x: PORTAL.x, y: LANDING_HUMAN_EYE_HEIGHT, z: 6.2 },
    lookAt: { x: PORTAL.x, y: LAYOUT_PORTAL_HEIGHT * 0.92, z: PORTAL.z },
    cinematic: {
      label: "Clôture — les deux piliers dominent le ciel",
      subjectId: "portal",
      shotSize: "WS",
      framing: "two_shot",
      angle: "low",
      movement: "static",
      focus: "deep",
      intent:
        "Grandiosité finale : recul minimal au sol, les piliers remplissent le cadre — échelle Villeneuve.",
      droneMove: "dronie",
      post: {
        ...VILLENEUVE_POST_BASE,
        profile: "epic_wide",
        transitionOut: "dissolve",
        notes: "Tenir le plan ; musique ample ; letterbox 2.39.",
      },
    },
  },
];

export function buildVilleneuvePillarFinaleKeyframes(): LayoutEditorCameraKeyframe[] {
  return VILLENEUVE_PILLAR_FINALE_STEPS.map((step) => ({
    u: step.u,
    position: { ...step.position },
    lookAt: { ...step.lookAt },
    heightMode: "human" as const,
    cinematic: { ...step.cinematic },
  }));
}
