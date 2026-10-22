/**
 * Shot list narrative — ancres du travelling (u des keyframes « maîtres »).
 * Les étapes intermédiaires peuvent hériter ou rester sans métadonnées.
 * À aligner avec LANDING_CAMERA_KEYFRAMES après chaque passe régie.
 */

import type { LandingShotBeat } from "./landingCinematicContract";

export type LandingAnchorShotListEntry = LandingShotBeat & { u: number };

/** Décisions film — alignées sur `landingCameraKeyframes.ts`. */
export const LANDING_ANCHOR_SHOT_LIST: LandingAnchorShotListEntry[] = [
  {
    u: 0,
    label: "Ouverture — carte du lieu",
    subjectId: "scene_envelope",
    shotSize: "EWS",
    framing: "single",
    angle: "high",
    movement: "static",
    focus: "deep",
    intent: "Establishing : où est la scène, échelle du cube dans le paysage.",
    droneMove: "dronie",
    post: {
      profile: "epic_wide",
      stabilization: "software_smooth",
      color: "creative_grade",
      frame: "letterbox_239",
      soundLayers: ["ambient_diegetic", "music_sync"],
      notes: "AAI: organisation rushes + establishing large avant le sujet.",
    },
  },
  {
    u: 0.066,
    label: "Descente drone — approche cube",
    subjectId: "cube",
    shotSize: "WS",
    angle: "aerial",
    movement: "dolly",
    focus: "deep",
    intent: "Transition vers le premier sujet hero.",
    droneMove: "rocket",
  },
  {
    u: 0.176,
    label: "Cube — plan pied",
    subjectId: "cube",
    shotSize: "MS",
    framing: "pov",
    angle: "eye_level",
    movement: "tracking",
    intent: "Présence du fragment, lecture de la forme.",
    droneMove: "orbit",
    focus: "soft",
    post: { stabilization: "in_camera_gimbal" },
  },
  {
    u: 0.279,
    label: "CUBE — hero Villeneuve (réf. CITY)",
    subjectId: "cube",
    shotSize: "WS",
    framing: "single",
    angle: "low",
    movement: "static",
    focus: "deep",
    intent:
      "Silhouette humaine au premier plan, cube monumental en contre-plongée téléobjectif (FOV 26°).",
    lensFov: 26,
    markShotId: "cube_city_hero_villeneuve",
    post: {
      profile: "cinematic_log_grade",
      frame: "letterbox_239",
      color: "creative_grade",
      soundLayers: ["ambient_diegetic", "music_sync"],
    },
  },
  {
    u: 0.402,
    label: "Traversée vers marbre",
    subjectId: "marble",
    shotSize: "MS",
    framing: "single",
    movement: "tracking",
    intent: "Relier cube → marbre, garder la géographie.",
    droneMove: "cable_cam",
  },
  {
    u: 0.5,
    label: "Marbre — plan américain",
    subjectId: "marble",
    shotSize: "CS",
    angle: "eye_level",
    movement: "static",
    intent: "Poids du monolithe, matière.",
    focus: "soft",
  },
  {
    u: 0.643,
    label: "Acte III — descente à hauteur homme",
    subjectId: "portal",
    secondarySubjectId: "marble",
    shotSize: "WS",
    framing: "two_shot",
    angle: "eye_level",
    movement: "dolly",
    focus: "deep",
    intent: "Quitter l’échelle drone : les deux piliers deviennent la scène finale.",
    droneMove: "cable_cam",
    post: {
      profile: "slow_reveal",
      frame: "letterbox_239",
      color: "creative_grade",
      soundLayers: ["ambient_diegetic", "music_sync"],
      notes: "Villeneuve : travelling lent, symétrie, pas de cut nerveux.",
    },
  },
  {
    u: 0.705,
    label: "Deux piliers — symétrie monumentale",
    subjectId: "portal_slit",
    shotSize: "FS",
    framing: "two_shot",
    angle: "low",
    movement: "static",
    focus: "soft",
    intent: "Échelle humaine vs colosses — brutalité silencieuse.",
    droneMove: "cable_cam",
    post: { profile: "slow_reveal", frame: "letterbox_239", color: "creative_grade" },
  },
  {
    u: 0.807,
    label: "Au pied — axe central",
    subjectId: "portal",
    shotSize: "FS",
    framing: "two_shot",
    angle: "low",
    movement: "static",
    focus: "deep",
    intent: "Plan fixe sacré entre les piliers, regard vers la voûte.",
    post: { profile: "slow_reveal", frame: "letterbox_239" },
  },
  {
    u: 0.877,
    label: "Pilier — contre-plongée brutale",
    subjectId: "portal",
    shotSize: "CU",
    framing: "single",
    angle: "low",
    movement: "static",
    focus: "shallow",
    intent: "Texture et masse — grandeur écrasante.",
    post: { profile: "cinematic_log_grade", frame: "letterbox_239" },
  },
  {
    u: 1,
    label: "Clôture — piliers dominent le ciel",
    subjectId: "cube",
    shotSize: "FS",
    framing: "two_shot",
    angle: "low",
    movement: "static",
    focus: "deep",
    intent: "Grandiosité finale au sol — échelle Villeneuve.",
    droneMove: "dronie",
    post: {
      profile: "epic_wide",
      color: "creative_grade",
      frame: "letterbox_239",
      transitionOut: "dissolve",
      soundLayers: ["music_sync", "ambient_diegetic"],
      notes: "Tenir le plan ; musique ample.",
    },
  },
];

export function shotBeatForAnchorU(u: number): LandingShotBeat | undefined {
  const entry = LANDING_ANCHOR_SHOT_LIST.find((e) => Math.abs(e.u - u) < 0.004);
  if (!entry) return undefined;
  const { u: _u, ...beat } = entry;
  return beat;
}

/** Étapes intermédiaires : hérite du beat d’ancre le plus proche en u. */
export function shotBeatForU(u: number): LandingShotBeat {
  const exact = shotBeatForAnchorU(u);
  if (exact) return { ...exact };
  let best = LANDING_ANCHOR_SHOT_LIST[0];
  let bestDist = Math.abs(best.u - u);
  for (const entry of LANDING_ANCHOR_SHOT_LIST) {
    const d = Math.abs(entry.u - u);
    if (d < bestDist) {
      bestDist = d;
      best = entry;
    }
  }
  const { u: _u, label, ...beat } = best;
  return {
    ...beat,
    label: label ? `${label} (interp.)` : undefined,
  };
}
