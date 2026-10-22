/**
 * Mouvements ciné drone (pilotage manuel) — vocabulaire & mapping landing.
 * Source : Adorama « Cinematic Drone Shots That Make Your Videos Look Pro »
 * (Mujahid Ur Rehman / Muji, Dec 2025).
 * @see LANDING_DRONE_CINEMATIC_MOVES.md
 */

/** Fondation : Cine / Tripod / Cinematic mode — accélération lente, pas de à-coups. */
export type DronePilotMode = "cine" | "normal" | "sport";

/**
 * Top 5 mouvements + tilt reveal (article Adorama).
 * À tagger sur un segment entre deux keyframes (ou sur l’ancre de départ).
 */
export type CinematicDroneMoveId =
  | "orbit"
  | "dronie"
  | "cable_cam"
  | "rocket"
  | "tilt_reveal";

export type DroneStickChannel =
  | "throttle"
  | "yaw"
  | "pitch"
  | "roll"
  | "gimbal_tilt";

export type CinematicDroneMove = {
  id: CinematicDroneMoveId;
  label: string;
  /** Pourquoi le plan fonctionne (story). */
  whyItWorks: string;
  /** Bâtons / axes principaux (référence manette). */
  primaryInputs: DroneStickChannel[];
  /** Conseil article (pause, speed ramp, cine mode…). */
  proTip?: string;
  /** Comment reproduire le geste sur le path 3D landing. */
  landingPathHint: string;
};

export const CINEMATIC_DRONE_MOVES: Record<CinematicDroneMoveId, CinematicDroneMove> = {
  orbit: {
    id: "orbit",
    label: "Orbit (circle of discovery)",
    whyItWorks:
      "Cercle autour du sujet, caméra lockée au centre — contexte 360° et lien au décor.",
    primaryInputs: ["yaw", "roll"],
    proTip: "Yaw + roll synchronisés, pression constante ; peut monter lentement (throttle).",
    landingPathHint:
      "Segment courbe autour du lookAt (cube/marbre/portail) ; lookAt fixe sur sujet.",
  },
  dronie: {
    id: "dronie",
    label: "Dronie (grand reveal)",
    whyItWorks: "Proche sur le sujet puis recul + montée — intimité → échelle du lieu.",
    primaryInputs: ["throttle", "pitch"],
    proTip: "Pause 2–3 s près du sujet avant le pullback ; équivalent dolly zoom aérien.",
    landingPathHint:
      "Keyframes : proche + bas Y → loin + haut Y, lookAt reste sur sujet (souvent u=0 ou fin d’acte).",
  },
  cable_cam: {
    id: "cable_cam",
    label: "Cable cam (straight track)",
    whyItWorks: "Trajectoire droite, gimbal fixe — route, côte, suivi latéral.",
    primaryInputs: ["roll", "pitch"],
    proTip: "Léger yaw pour recentrer un sujet en mouvement.",
    landingPathHint:
      "Enchaînement colinéaire de positions, lookAt stable ou dérive lente (traversée cube→marbre).",
  },
  rocket: {
    id: "rocket",
    label: "Rocket (vertical climb)",
    whyItWorks: "Montée verticale dynamique, caméra 30–45° ou 90° (top-down).",
    primaryInputs: ["throttle"],
    proTip: "Speed ramp en post (AAI) : départ lent, accélération en montée.",
    landingPathHint: "Même XZ, Y croissant ; pitch/lookAt vers horizon ou sol selon angle.",
  },
  tilt_reveal: {
    id: "tilt_reveal",
    label: "Tilt reveal (look-up push-in)",
    whyItWorks: "Avance + gimbal qui monte — momentum, découverte de l’horizon.",
    primaryInputs: ["pitch", "gimbal_tilt"],
    proTip: "Cine mode obligatoire ; ne pas pauser le tilt (continuité du reveal).",
    landingPathHint:
      "Forward + lookAt qui monte (Y lookAt ↑) sur le segment ; pas de stop mid-tilt.",
  },
};

/** Référence manette (article Adorama). */
export const DRONE_CONTROLLER_STICKS: {
  stick: "left" | "right";
  direction: string;
  channel: DroneStickChannel;
  function: string;
}[] = [
  {
    stick: "left",
    direction: "Up/Down",
    channel: "throttle",
    function: "Vertical (montée / descente)",
  },
  {
    stick: "left",
    direction: "Left/Right",
    channel: "yaw",
    function: "Rotation autour de l’axe vertical",
  },
  {
    stick: "right",
    direction: "Up/Down",
    channel: "pitch",
    function: "Avancer / reculer",
  },
  {
    stick: "right",
    direction: "Left/Right",
    channel: "roll",
    function: "Glisser gauche / droite",
  },
];

/**
 * Équivalent « Cine Mode » sur la landing Prism.
 * @see landingTravellingRig.ts, CAMERA_PATH_PLAY_DURATION
 */
export const LANDING_CINE_MODE_EQUIVALENT = {
  article: "Cine / Tripod / Cinematic mode — joystick damped",
  landing: [
    "Play path avec interpolation segment (`pathSamplerByKeyframeU`)",
    "Durée longue `CAMERA_PATH_PLAY_DURATION` (pas de saccades UI)",
    "Pas de correction brusque Y en orbit preview (`syncOrbitToPathLook`)",
    "Éditer en mode « étape » + mouvement taggé `droneMove` entre keyframes",
  ],
} as const;

/** Suggestion mouvement par sujet narratif (défaut shot list). */
export const SUGGESTED_DRONE_MOVE_BY_SUBJECT: Partial<
  Record<string, CinematicDroneMoveId>
> = {
  scene_envelope: "dronie",
  terrain_zone: "rocket",
  cube: "orbit",
  marble: "cable_cam",
  portal: "tilt_reveal",
  portal_slit: "orbit",
};
