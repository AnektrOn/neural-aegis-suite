/** Mixamo Xbot bone mapping for the body-scan preview. */

export const BODY_SCAN_MODEL_URL = "/models/gltf/Xbot.glb";

export type ZoneFacing = "front" | "back";
export type ZoneLateral = "left" | "right" | "center" | "outer" | "inner";

/** Spatial mask within the zone’s bone-weighted vertices (bind-pose, 0–1). */
export type ZoneRegion = {
  /** Relative height: 0 = bottom of zone verts, 1 = top. */
  yMin?: number;
  yMax?: number;
  yFeather?: number;
  facing?: ZoneFacing;
  /** Higher = sharper front/back split (default 1.5). */
  facingPower?: number;
  /**
   * Lateral band on |x| (0 = midline, 1 = outermost).
   * center/inner = near midline; outer = sides (ears/temples); left/right = signed.
   */
  lateral?: ZoneLateral;
  /** Edge for center/outer split (default 0.48). */
  lateralEdge?: number;
  xFeather?: number;
};

type ZoneBoneSpec = {
  exact?: string[];
  prefix?: string[];
  /** Bind-pose +Z is the face / front of the body on Xbot. */
  facing?: ZoneFacing;
  /** Extra Y/Z mask — required to split forehead / crown / occiput. */
  region?: ZoneRegion;
};

/**
 * Bone keys are Mixamo names without the `mixamorig:` prefix.
 * `prefix` matches fingers / toes (LeftHand → LeftHandThumb1…).
 *
 * Head / torso / limb zones often share bones — separation is spatial (region).
 */
export const ZONE_BONE_SPEC: Record<string, ZoneBoneSpec> = {
  // ── Head / face — non-overlapping Y + lateral bands ──────────
  forehead: {
    exact: ["Head", "HeadTop_End"],
    region: {
      yMin: 0.55, yMax: 0.74, yFeather: 0.035,
      facing: "front", facingPower: 3.6,
      lateral: "center", lateralEdge: 0.55,
    },
  },
  temples: {
    exact: ["Head"],
    region: {
      yMin: 0.5,
      yMax: 0.68,
      yFeather: 0.03,
      facing: "front",
      facingPower: 2.8,
      lateral: "outer",
      lateralEdge: 0.58,
      xFeather: 0.04,
    },
  },
  eyes: {
    exact: ["LeftEye", "RightEye", "Head"],
    region: {
      yMin: 0.4, yMax: 0.54, yFeather: 0.03,
      facing: "front", facingPower: 3.6,
      lateral: "center", lateralEdge: 0.62,
    },
  },
  face: {
    exact: ["Head"],
    region: {
      yMin: 0.26, yMax: 0.42, yFeather: 0.03,
      facing: "front", facingPower: 3.2,
      lateral: "outer", lateralEdge: 0.28,
    },
  },
  jaw: {
    exact: ["Head"],
    region: {
      yMin: 0, yMax: 0.16, yFeather: 0.03,
      facing: "front", facingPower: 3.4,
      lateral: "center", lateralEdge: 0.7,
    },
  },
  mouth: {
    exact: ["Head"],
    region: {
      yMin: 0.14, yMax: 0.28, yFeather: 0.025,
      facing: "front", facingPower: 3.8,
      lateral: "center", lateralEdge: 0.42,
    },
  },
  head: {
    exact: ["Head", "HeadTop_End"],
    region: { yMin: 0.8, yMax: 1.0, yFeather: 0.035 },
  },
  back_head: {
    exact: ["Head", "HeadTop_End"],
    region: {
      yMin: 0.35, yMax: 0.78, yFeather: 0.035,
      facing: "back", facingPower: 3.6,
      lateral: "center", lateralEdge: 0.75,
    },
  },
  ears: {
    exact: ["Head"],
    region: {
      yMin: 0.36,
      yMax: 0.55,
      yFeather: 0.025,
      lateral: "outer",
      lateralEdge: 0.78,
      xFeather: 0.04,
    },
  },

  // ── Neck ─────────────────────────────────────────────────────
  throat: {
    exact: ["Neck"],
    region: { facing: "front", facingPower: 3.2, lateral: "center", lateralEdge: 0.55 },
  },
  neck: {
    exact: ["Neck"],
    region: { yMin: 0.2, yMax: 0.85, yFeather: 0.06 },
  },
  nape: {
    exact: ["Neck"],
    region: { facing: "back", facingPower: 3.2, lateral: "center", lateralEdge: 0.6 },
  },

  // ── Shoulders / torso ────────────────────────────────────────
  shoulders: {
    exact: ["LeftShoulder", "RightShoulder"],
    region: { yMin: 0.35, yMax: 1, yFeather: 0.08 },
  },
  trapezius: {
    exact: ["LeftShoulder", "RightShoulder", "Spine2"],
    region: { facing: "back", facingPower: 2.8, yMin: 0.45, yMax: 1, yFeather: 0.08 },
  },
  chest: {
    exact: ["Spine2", "Spine1"],
    region: {
      facing: "front", facingPower: 2.8,
      yMin: 0.35, yMax: 1, yFeather: 0.06,
      lateral: "center", lateralEdge: 0.7,
    },
  },
  upper_back: {
    exact: ["Spine2", "Spine1"],
    region: { facing: "back", facingPower: 2.8, yMin: 0.4, yMax: 1, yFeather: 0.06 },
  },
  solar_plexus: {
    exact: ["Spine1"],
    region: {
      yMin: 0.15, yMax: 0.55, yFeather: 0.05,
      facing: "front", facingPower: 2.8,
      lateral: "center", lateralEdge: 0.5,
    },
  },
  mid_back: {
    exact: ["Spine1", "Spine"],
    region: { facing: "back", facingPower: 2.8, yMin: 0.25, yMax: 0.7, yFeather: 0.06 },
  },
  abdomen: {
    exact: ["Spine", "Hips"],
    region: {
      facing: "front", facingPower: 2.6,
      yMin: 0.25, yMax: 0.75, yFeather: 0.06,
      lateral: "center", lateralEdge: 0.65,
    },
  },
  lower_back: {
    exact: ["Spine", "Hips"],
    region: { facing: "back", facingPower: 2.8, yMin: 0.15, yMax: 0.55, yFeather: 0.06 },
  },
  flanks: {
    exact: ["Spine", "Spine1", "Hips"],
    region: { lateral: "outer", lateralEdge: 0.45, yMin: 0.2, yMax: 0.8, yFeather: 0.06 },
  },
  pelvis: {
    exact: ["Hips"],
    region: { facing: "front", facingPower: 2.6, yMin: 0, yMax: 0.45, yFeather: 0.05 },
  },
  glutes: {
    exact: ["Hips"],
    region: { facing: "back", facingPower: 3, yMin: 0, yMax: 0.55, yFeather: 0.05 },
  },

  // ── Arms ─────────────────────────────────────────────────────
  upper_arms: {
    exact: ["LeftArm", "RightArm"],
    region: { facing: "front", facingPower: 2.6, yMin: 0.35, yMax: 1, yFeather: 0.06 },
  },
  back_arms: {
    exact: ["LeftArm", "RightArm"],
    region: { facing: "back", facingPower: 2.6, yMin: 0.35, yMax: 1, yFeather: 0.06 },
  },
  elbows: {
    exact: ["LeftArm", "LeftForeArm", "RightArm", "RightForeArm"],
    region: { yMin: 0.38, yMax: 0.62, yFeather: 0.05 },
  },
  forearms: {
    exact: ["LeftForeArm", "RightForeArm"],
    region: { facing: "front", facingPower: 2.4, yMin: 0.15, yMax: 0.85, yFeather: 0.05 },
  },
  back_forearms: {
    exact: ["LeftForeArm", "RightForeArm"],
    region: { facing: "back", facingPower: 2.4, yMin: 0.15, yMax: 0.85, yFeather: 0.05 },
  },
  wrists: {
    exact: ["LeftForeArm", "LeftHand", "RightForeArm", "RightHand"],
    region: { yMin: 0, yMax: 0.28, yFeather: 0.04 },
  },
  hands: {
    exact: ["LeftHand", "RightHand"],
    region: { facing: "front", facingPower: 2.8 },
  },
  back_hands: {
    exact: ["LeftHand", "RightHand"],
    region: { facing: "back", facingPower: 2.8 },
  },
  fingers: {
    prefix: [
      "LeftHandThumb", "LeftHandIndex", "LeftHandMiddle", "LeftHandRing", "LeftHandPinky",
      "RightHandThumb", "RightHandIndex", "RightHandMiddle", "RightHandRing", "RightHandPinky",
    ],
  },

  // ── Legs ─────────────────────────────────────────────────────
  hips: {
    exact: ["Hips"],
    region: { yMin: 0.35, yMax: 1, yFeather: 0.06, lateral: "outer", lateralEdge: 0.25 },
  },
  thighs: {
    exact: ["LeftUpLeg", "RightUpLeg"],
    region: { facing: "front", facingPower: 2.4, yMin: 0.25, yMax: 1, yFeather: 0.05 },
  },
  hamstrings: {
    exact: ["LeftUpLeg", "RightUpLeg"],
    region: { facing: "back", facingPower: 2.4, yMin: 0.25, yMax: 1, yFeather: 0.05 },
  },
  knees: {
    exact: ["LeftUpLeg", "LeftLeg", "RightUpLeg", "RightLeg"],
    region: { yMin: 0.4, yMax: 0.6, yFeather: 0.04 },
  },
  shins: {
    exact: ["LeftLeg", "RightLeg"],
    region: { facing: "front", facingPower: 2.4, yMin: 0.2, yMax: 0.85, yFeather: 0.05 },
  },
  calves: {
    exact: ["LeftLeg", "RightLeg"],
    region: { facing: "back", facingPower: 2.4, yMin: 0.15, yMax: 0.8, yFeather: 0.05 },
  },
  ankles: {
    exact: ["LeftLeg", "LeftFoot", "RightLeg", "RightFoot"],
    region: { yMin: 0, yMax: 0.28, yFeather: 0.04 },
  },
  feet: { exact: ["LeftFoot", "RightFoot"] },
  soles: {
    exact: ["LeftFoot", "RightFoot"],
    region: { facing: "back", facingPower: 2.2, yMin: 0, yMax: 0.45, yFeather: 0.05 },
  },
  toes: { prefix: ["LeftToe", "RightToe"] },
  heels: {
    exact: ["LeftFoot", "RightFoot"],
    region: {
      facing: "back", facingPower: 3,
      yMin: 0.35, yMax: 1, yFeather: 0.05,
      lateral: "center", lateralEdge: 0.55,
    },
  },

  // Legacy alias for prod DEFAULT zones
  arms: {
    exact: ["LeftArm", "LeftForeArm", "RightArm", "RightForeArm"],
    region: { facing: "front", facingPower: 2 },
  },
};

export type SweepAxis = "x" | "y" | "z" | "absx";

export type SweepWaypoint = {
  bone: string;
  offset: [number, number, number];
};

export type ZoneSweep = {
  /** Bind-pose axis used to drive the traveling highlight. */
  axis: SweepAxis;
  invert?: boolean;
  /** One polyline per light (center = 1 path, left/right = 2). */
  paths: SweepWaypoint[][];
};

const F = 0.15;
const B = -0.15;

function wp(bone: string, x: number, y: number, z: number): SweepWaypoint {
  return { bone, offset: [x, y, z] };
}

/** Smooth scan paths: the light travels these polylines during the zone. */
export const ZONE_SWEEPS: Record<string, ZoneSweep> = {
  forehead: {
    axis: "x",
    paths: [[wp("Head", -0.1, 0.1, F), wp("Head", 0, 0.12, F), wp("Head", 0.1, 0.1, F)]],
  },
  temples: {
    axis: "x",
    paths: [
      [wp("Head", -0.12, 0.06, 0.08), wp("Head", -0.1, 0.08, F)],
      [wp("Head", 0.12, 0.06, 0.08), wp("Head", 0.1, 0.08, F)],
    ],
  },
  eyes: {
    axis: "x",
    paths: [[wp("LeftEye", 0, 0, 0.02), wp("RightEye", 0, 0, 0.02)]],
  },
  face: {
    axis: "y",
    invert: true,
    paths: [[wp("Head", 0, 0.04, F), wp("Head", 0, -0.04, F)]],
  },
  jaw: {
    axis: "x",
    paths: [[wp("Head", -0.07, -0.05, 0.12), wp("Head", 0.07, -0.06, 0.12)]],
  },
  mouth: {
    axis: "x",
    paths: [[wp("Head", -0.04, -0.04, 0.13), wp("Head", 0.04, -0.04, 0.13)]],
  },
  head: {
    axis: "y",
    invert: true,
    paths: [[wp("HeadTop_End", 0, 0.02, 0.04), wp("Head", 0, 0.04, 0.05)]],
  },
  back_head: {
    axis: "x",
    paths: [[wp("Head", -0.09, 0.1, B), wp("Head", 0.09, 0.06, B)]],
  },
  ears: {
    axis: "x",
    paths: [
      [wp("Head", -0.14, 0.02, 0), wp("Head", -0.12, 0.04, 0.02)],
      [wp("Head", 0.14, 0.02, 0), wp("Head", 0.12, 0.04, 0.02)],
    ],
  },
  throat: {
    axis: "y",
    invert: true,
    paths: [[wp("Neck", 0, 0.03, F), wp("Neck", 0, -0.02, F)]],
  },
  neck: {
    axis: "y",
    invert: true,
    paths: [[wp("Neck", 0, 0.04, 0.1), wp("Neck", 0, -0.02, 0.1)]],
  },
  nape: {
    axis: "y",
    invert: true,
    paths: [[wp("Neck", 0, 0.04, B), wp("Neck", 0, -0.02, B)]],
  },
  shoulders: {
    axis: "x",
    paths: [[wp("LeftShoulder", 0, 0.05, 0.12), wp("RightShoulder", 0, 0.05, 0.12)]],
  },
  trapezius: {
    axis: "x",
    paths: [[wp("LeftShoulder", 0, 0.04, B), wp("Spine2", 0, 0.08, B), wp("RightShoulder", 0, 0.04, B)]],
  },
  chest: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine2", 0, 0.1, F), wp("Spine1", 0, 0.0, F)]],
  },
  upper_back: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine2", 0, 0.1, B), wp("Spine1", 0, 0.0, B)]],
  },
  solar_plexus: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine1", 0, 0.04, F), wp("Spine", 0, 0.02, F)]],
  },
  mid_back: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine1", 0, 0.04, B), wp("Spine", 0, 0.02, B)]],
  },
  abdomen: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine", 0, 0.06, 0.14), wp("Hips", 0, 0.03, 0.12)]],
  },
  lower_back: {
    axis: "y",
    invert: true,
    paths: [[wp("Spine", 0, 0.04, B), wp("Hips", 0, 0.02, B)]],
  },
  flanks: {
    axis: "x",
    paths: [
      [wp("Spine1", -0.1, 0.02, 0), wp("Hips", -0.1, 0.04, 0)],
      [wp("Spine1", 0.1, 0.02, 0), wp("Hips", 0.1, 0.04, 0)],
    ],
  },
  pelvis: {
    axis: "x",
    paths: [[wp("Hips", -0.08, 0.02, F), wp("Hips", 0.08, 0.02, F)]],
  },
  glutes: {
    axis: "x",
    paths: [[wp("Hips", -0.08, 0.02, B), wp("Hips", 0.08, 0.02, B)]],
  },
  upper_arms: {
    axis: "absx",
    paths: [
      [wp("LeftShoulder", 0, 0.02, 0.08), wp("LeftArm", 0, 0, 0.08)],
      [wp("RightShoulder", 0, 0.02, 0.08), wp("RightArm", 0, 0, 0.08)],
    ],
  },
  back_arms: {
    axis: "absx",
    paths: [
      [wp("LeftShoulder", 0, 0.02, B), wp("LeftArm", 0, 0, B)],
      [wp("RightShoulder", 0, 0.02, B), wp("RightArm", 0, 0, B)],
    ],
  },
  elbows: {
    axis: "absx",
    paths: [
      [wp("LeftArm", 0, -0.05, 0.04), wp("LeftForeArm", 0, 0.05, 0.04)],
      [wp("RightArm", 0, -0.05, 0.04), wp("RightForeArm", 0, 0.05, 0.04)],
    ],
  },
  forearms: {
    axis: "absx",
    paths: [
      [wp("LeftArm", 0, -0.06, 0.08), wp("LeftForeArm", 0, 0, 0.08), wp("LeftHand", 0, 0.02, 0.06)],
      [wp("RightArm", 0, -0.06, 0.08), wp("RightForeArm", 0, 0, 0.08), wp("RightHand", 0, 0.02, 0.06)],
    ],
  },
  back_forearms: {
    axis: "absx",
    paths: [
      [wp("LeftForeArm", 0, 0, B), wp("LeftHand", 0, 0.02, B)],
      [wp("RightForeArm", 0, 0, B), wp("RightHand", 0, 0.02, B)],
    ],
  },
  wrists: {
    axis: "absx",
    paths: [
      [wp("LeftForeArm", 0, -0.04, 0.05), wp("LeftHand", 0, 0.04, 0.05)],
      [wp("RightForeArm", 0, -0.04, 0.05), wp("RightHand", 0, 0.04, 0.05)],
    ],
  },
  hands: {
    axis: "absx",
    paths: [
      [wp("LeftHand", 0, 0.02, 0.07), wp("LeftHand", 0.02, -0.1, 0.06)],
      [wp("RightHand", 0, 0.02, 0.07), wp("RightHand", -0.02, -0.1, 0.06)],
    ],
  },
  back_hands: {
    axis: "absx",
    paths: [
      [wp("LeftHand", 0, 0.02, -0.06), wp("LeftHand", 0.02, -0.1, -0.05)],
      [wp("RightHand", 0, 0.02, -0.06), wp("RightHand", -0.02, -0.1, -0.05)],
    ],
  },
  fingers: {
    axis: "absx",
    paths: [
      [wp("LeftHand", 0.02, -0.04, 0.05), wp("LeftHand", 0.04, -0.12, 0.04)],
      [wp("RightHand", -0.02, -0.04, 0.05), wp("RightHand", -0.04, -0.12, 0.04)],
    ],
  },
  arms: {
    axis: "absx",
    paths: [
      [wp("LeftShoulder", 0, 0.02, 0.1), wp("LeftArm", 0, 0, 0.1), wp("LeftForeArm", 0, 0, 0.09)],
      [wp("RightShoulder", 0, 0.02, 0.1), wp("RightArm", 0, 0, 0.1), wp("RightForeArm", 0, 0, 0.09)],
    ],
  },
  hips: {
    axis: "x",
    paths: [[wp("Hips", -0.08, 0.03, 0.12), wp("Hips", 0.08, 0.03, 0.12)]],
  },
  thighs: {
    axis: "y",
    invert: true,
    paths: [
      [wp("LeftUpLeg", 0, 0.04, F), wp("LeftLeg", 0, 0.02, F)],
      [wp("RightUpLeg", 0, 0.04, F), wp("RightLeg", 0, 0.02, F)],
    ],
  },
  hamstrings: {
    axis: "y",
    invert: true,
    paths: [
      [wp("LeftUpLeg", 0, 0.04, B), wp("LeftLeg", 0, 0.02, B)],
      [wp("RightUpLeg", 0, 0.04, B), wp("RightLeg", 0, 0.02, B)],
    ],
  },
  knees: {
    axis: "x",
    paths: [[wp("LeftLeg", 0, 0.08, 0.06), wp("RightLeg", 0, 0.08, 0.06)]],
  },
  shins: {
    axis: "y",
    invert: true,
    paths: [
      [wp("LeftLeg", 0, 0.04, F), wp("LeftFoot", 0, 0.04, F)],
      [wp("RightLeg", 0, 0.04, F), wp("RightFoot", 0, 0.04, F)],
    ],
  },
  calves: {
    axis: "y",
    invert: true,
    paths: [
      [wp("LeftLeg", 0, 0.02, B), wp("LeftFoot", 0, 0.04, B)],
      [wp("RightLeg", 0, 0.02, B), wp("RightFoot", 0, 0.04, B)],
    ],
  },
  ankles: {
    axis: "x",
    paths: [
      [wp("LeftLeg", 0, -0.04, 0.04), wp("LeftFoot", 0, 0.06, 0.04)],
      [wp("RightLeg", 0, -0.04, 0.04), wp("RightFoot", 0, 0.06, 0.04)],
    ],
  },
  feet: {
    axis: "z",
    paths: [
      [wp("LeftFoot", 0, 0.04, 0.04), wp("LeftToeBase", 0, 0.03, 0.08)],
      [wp("RightFoot", 0, 0.04, 0.04), wp("RightToeBase", 0, 0.03, 0.08)],
    ],
  },
  soles: {
    axis: "z",
    paths: [
      [wp("LeftFoot", 0, -0.02, 0), wp("LeftToeBase", 0, -0.01, 0.04)],
      [wp("RightFoot", 0, -0.02, 0), wp("RightToeBase", 0, -0.01, 0.04)],
    ],
  },
  toes: {
    axis: "x",
    paths: [
      [wp("LeftToeBase", -0.02, 0.02, 0.04), wp("LeftToeBase", 0.02, 0.02, 0.04)],
      [wp("RightToeBase", -0.02, 0.02, 0.04), wp("RightToeBase", 0.02, 0.02, 0.04)],
    ],
  },
  heels: {
    axis: "x",
    paths: [
      [wp("LeftFoot", 0, 0.02, B), wp("LeftFoot", 0.02, 0.01, B)],
      [wp("RightFoot", 0, 0.02, B), wp("RightFoot", -0.02, 0.01, B)],
    ],
  },
};

/** First bone of each sweep — used by tests / fallbacks. */
export const ZONE_LIGHT_ANCHORS: Record<
  string,
  { bones: string[]; offset: [number, number, number] }
> = Object.fromEntries(
  Object.entries(ZONE_SWEEPS).map(([id, sweep]) => [
    id,
    {
      bones: sweep.paths.flatMap((path) => path.map((point) => point.bone)),
      offset: sweep.paths[0][0].offset,
    },
  ]),
);

export const BODY_SCAN_PREVIEW_ZONES = [
  // Head / face
  {
    id: "forehead",
    label: "Forehead",
    instruction: "Soften the forehead and the space between the eyebrows.",
    duration_sec: 8,
  },
  {
    id: "temples",
    label: "Temples",
    instruction: "Release the temples. Let the sides of the head soften.",
    duration_sec: 8,
  },
  {
    id: "eyes",
    label: "Eyes",
    instruction: "Rest the eyes in their sockets. Soften the eyelids.",
    duration_sec: 8,
  },
  {
    id: "face",
    label: "Face",
    instruction: "Soften the cheeks and the whole face. No holding.",
    duration_sec: 8,
  },
  {
    id: "jaw",
    label: "Jaw",
    instruction: "Let your teeth separate slightly. Relax your tongue.",
    duration_sec: 10,
  },
  {
    id: "mouth",
    label: "Mouth",
    instruction: "Soften the lips. Let the tongue rest in the mouth.",
    duration_sec: 8,
  },
  {
    id: "head",
    label: "Crown / scalp",
    instruction: "Feel the weight of the skull. Let the scalp rest.",
    duration_sec: 8,
  },
  {
    id: "back_head",
    label: "Occiput",
    instruction: "Release the occiput and the base of the skull.",
    duration_sec: 8,
  },
  {
    id: "ears",
    label: "Ears",
    instruction: "Soften around the ears. Release any tension at the sides.",
    duration_sec: 8,
  },
  // Neck
  {
    id: "throat",
    label: "Throat",
    instruction: "Soften the front of the throat. Let the breath pass freely.",
    duration_sec: 8,
  },
  {
    id: "neck",
    label: "Neck",
    instruction: "Feel the length of the neck. No bracing.",
    duration_sec: 8,
  },
  {
    id: "nape",
    label: "Nape",
    instruction: "Release the back of the neck and the nape.",
    duration_sec: 8,
  },
  // Torso
  {
    id: "shoulders",
    label: "Shoulders",
    instruction: "Let your shoulders drop. Feel their weight.",
    duration_sec: 10,
  },
  {
    id: "trapezius",
    label: "Trapezius",
    instruction: "Release the tops of the shoulders and the upper traps.",
    duration_sec: 8,
  },
  {
    id: "chest",
    label: "Chest",
    instruction: "Observe your natural breathing without trying to control it.",
    duration_sec: 10,
  },
  {
    id: "upper_back",
    label: "Upper back",
    instruction: "Soften between the shoulder blades.",
    duration_sec: 8,
  },
  {
    id: "solar_plexus",
    label: "Solar plexus",
    instruction: "Release the diaphragm area. Soften under the ribs.",
    duration_sec: 8,
  },
  {
    id: "mid_back",
    label: "Mid back",
    instruction: "Let the mid-back widen and settle.",
    duration_sec: 8,
  },
  {
    id: "abdomen",
    label: "Abdomen",
    instruction: "Let your belly soften completely. No bracing.",
    duration_sec: 10,
  },
  {
    id: "lower_back",
    label: "Lower back",
    instruction: "Release the lumbar area. Soften the lower back.",
    duration_sec: 8,
  },
  {
    id: "flanks",
    label: "Flanks",
    instruction: "Soften the sides of the waist.",
    duration_sec: 8,
  },
  {
    id: "pelvis",
    label: "Pelvis",
    instruction: "Feel the weight of the pelvis. Soften the front of the hips.",
    duration_sec: 8,
  },
  {
    id: "glutes",
    label: "Glutes",
    instruction: "Release the buttocks. Let them rest heavy.",
    duration_sec: 8,
  },
  // Arms
  {
    id: "upper_arms",
    label: "Upper arms",
    instruction: "Feel the biceps and the front of the upper arms.",
    duration_sec: 8,
  },
  {
    id: "back_arms",
    label: "Triceps",
    instruction: "Release the triceps and the back of the upper arms.",
    duration_sec: 8,
  },
  {
    id: "elbows",
    label: "Elbows",
    instruction: "Soften the elbows. No locking.",
    duration_sec: 6,
  },
  {
    id: "forearms",
    label: "Forearms",
    instruction: "Feel the length of the forearms down to the wrists.",
    duration_sec: 8,
  },
  {
    id: "back_forearms",
    label: "Back of forearms",
    instruction: "Release the back of the forearms.",
    duration_sec: 6,
  },
  {
    id: "wrists",
    label: "Wrists",
    instruction: "Soften the wrists. Let them feel loose.",
    duration_sec: 6,
  },
  {
    id: "hands",
    label: "Palms",
    instruction: "Fingers gently open. Feel the palms.",
    duration_sec: 8,
  },
  {
    id: "back_hands",
    label: "Back of hands",
    instruction: "Soften the back of the hands and the knuckles.",
    duration_sec: 6,
  },
  {
    id: "fingers",
    label: "Fingers",
    instruction: "Relax each finger, from base to tip.",
    duration_sec: 8,
  },
  // Legs
  {
    id: "hips",
    label: "Hips",
    instruction: "Feel the hip joints. Soften around them.",
    duration_sec: 8,
  },
  {
    id: "thighs",
    label: "Thighs",
    instruction: "Release your quadriceps. Let your legs soften.",
    duration_sec: 10,
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    instruction: "Release the back of the thighs.",
    duration_sec: 8,
  },
  {
    id: "knees",
    label: "Knees",
    instruction: "Soften behind and around the knees.",
    duration_sec: 6,
  },
  {
    id: "shins",
    label: "Shins",
    instruction: "Feel the front of the lower legs.",
    duration_sec: 6,
  },
  {
    id: "calves",
    label: "Calves",
    instruction: "Release the calves. Soften the lower legs.",
    duration_sec: 8,
  },
  {
    id: "ankles",
    label: "Ankles",
    instruction: "Soften the ankles. Let them feel free.",
    duration_sec: 6,
  },
  {
    id: "feet",
    label: "Feet",
    instruction: "Feel the contact with the ground.",
    duration_sec: 8,
  },
  {
    id: "soles",
    label: "Soles",
    instruction: "Sense the soles of the feet against the ground.",
    duration_sec: 6,
  },
  {
    id: "toes",
    label: "Toes",
    instruction: "Relax each toe, one by one.",
    duration_sec: 8,
  },
  {
    id: "heels",
    label: "Heels",
    instruction: "Feel the heels settle. Soften the back of the feet.",
    duration_sec: 6,
  },
] as const;

export function normalizeMixamoBoneName(name: string): string {
  return name.replace(/^mixamorig[:_]?/i, "").toLowerCase();
}

export function boneBelongsToZone(boneName: string, zoneId: string): boolean {
  const spec = ZONE_BONE_SPEC[zoneId];
  if (!spec) return false;
  const n = normalizeMixamoBoneName(boneName);
  if (spec.exact?.some((key) => normalizeMixamoBoneName(key) === n)) return true;
  if (spec.prefix?.some((key) => n.startsWith(normalizeMixamoBoneName(key)))) return true;
  return false;
}

export function collectZoneBoneIndices(
  bones: ReadonlyArray<{ name: string }>,
  zoneId: string,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < bones.length; i++) {
    if (boneBelongsToZone(bones[i].name, zoneId)) out.push(i);
  }
  return out;
}

export function elapsedAtZoneStart(
  zones: ReadonlyArray<{ duration_sec: number }>,
  index: number,
): number {
  let t = 0;
  const last = Math.max(0, Math.min(index, zones.length));
  for (let i = 0; i < last; i++) t += zones[i].duration_sec;
  return t;
}

export function facingMultiplier(
  z: number,
  zMin: number,
  zMax: number,
  facing: ZoneFacing,
  power = 1.5,
): number {
  const span = Math.max(1e-5, zMax - zMin);
  const t = Math.min(1, Math.max(0, (z - zMin) / span));
  // Hard midline cut so forehead / occiput never share the same verts.
  if (facing === "front") {
    if (t < 0.48) return 0;
    const u = (t - 0.48) / 0.52;
    return Math.pow(u * u * (3 - 2 * u), Math.max(0.5, power));
  }
  if (t > 0.52) return 0;
  const u = (0.52 - t) / 0.52;
  return Math.pow(u * u * (3 - 2 * u), Math.max(0.5, power));
}

/** Soft 1 inside [yMin, yMax], fades outside over `feather`. */
export function heightBandWeight(
  yNorm: number,
  yMin = 0,
  yMax = 1,
  feather = 0.08,
): number {
  const f = Math.max(1e-4, feather);
  const enter = smoothstep(yMin - f, yMin + f, yNorm);
  const leave = 1 - smoothstep(yMax - f, yMax + f, yNorm);
  return Math.min(1, Math.max(0, enter * leave));
}

/**
 * Lateral weight from |x| norm (0 = midline, 1 = outermost) or signed x for L/R.
 * `xSignedNorm` is 0 = left extreme, 0.5 = midline, 1 = right extreme.
 */
export function lateralMultiplier(
  absXNorm: number,
  xSignedNorm: number,
  lateral: ZoneLateral,
  edge = 0.48,
  feather = 0.06,
): number {
  const f = Math.max(1e-4, feather);
  const a = Math.min(1, Math.max(0, absXNorm));
  if (lateral === "center" || lateral === "inner") {
    // 1 near midline, 0 past edge.
    return 1 - smoothstep(edge - f, edge + f, a);
  }
  if (lateral === "outer") {
    // 0 near midline, 1 past edge.
    return smoothstep(edge - f, edge + f, a);
  }
  if (lateral === "left") {
    return 1 - smoothstep(0.48 - f, 0.52 + f, xSignedNorm);
  }
  // right
  return smoothstep(0.48 - f, 0.52 + f, xSignedNorm);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / Math.max(1e-5, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function resolveZoneRegion(zoneId: string): ZoneRegion | null {
  const spec = ZONE_BONE_SPEC[zoneId];
  if (!spec) return null;
  if (spec.region) return spec.region;
  if (spec.facing) return { facing: spec.facing, facingPower: 1.5 };
  return null;
}

/**
 * Multiply bone weights by a spatial region mask (Y + facing + lateral).
 * Mutates `weights` in place; returns the same array.
 */
export function applyZoneRegionMask(
  weights: Float32Array,
  positions: { getX: (i: number) => number; getY: (i: number) => number; getZ: (i: number) => number },
  zoneId: string,
  boneWeightMin = 0.08,
): Float32Array {
  const region = resolveZoneRegion(zoneId);
  if (!region) return weights;

  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  for (let v = 0; v < weights.length; v++) {
    if (weights[v] < boneWeightMin) continue;
    const x = positions.getX(v);
    const y = positions.getY(v);
    const z = positions.getZ(v);
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  if (!Number.isFinite(yMin)) return weights;

  const ySpan = Math.max(1e-5, yMax - yMin);
  const xSpan = Math.max(1e-5, xMax - xMin);
  const xMid = (xMin + xMax) * 0.5;
  const xHalf = Math.max(1e-5, Math.max(Math.abs(xMin - xMid), Math.abs(xMax - xMid)));
  const wantsY = region.yMin != null || region.yMax != null;
  const feather = region.yFeather ?? 0.08;
  const yLo = region.yMin ?? 0;
  const yHi = region.yMax ?? 1;
  const power = region.facingPower ?? 1.5;
  const latEdge = region.lateralEdge ?? 0.48;
  const xFeather = region.xFeather ?? 0.06;

  for (let v = 0; v < weights.length; v++) {
    if (weights[v] < 0.01) continue;
    let m = 1;
    if (wantsY) {
      const yNorm = (positions.getY(v) - yMin) / ySpan;
      m *= heightBandWeight(yNorm, yLo, yHi, feather);
    }
    if (region.facing) {
      m *= facingMultiplier(positions.getZ(v), zMin, zMax, region.facing, power);
    }
    if (region.lateral) {
      const x = positions.getX(v);
      const absXNorm = Math.abs(x - xMid) / xHalf;
      const xSignedNorm = (x - xMin) / xSpan;
      m *= lateralMultiplier(absXNorm, xSignedNorm, region.lateral, latEdge, xFeather);
    }
    weights[v] *= m;
    // Hard kill soft bleed so adjacent zones stay visually distinct.
    if (weights[v] < 0.1) weights[v] = 0;
  }
  return weights;
}

export function easeSweep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Ping-pong 0→1→0… so a zone can be swept several times. */
export function pingPong01(t: number): number {
  const cycle = Math.abs(t) % 2;
  return cycle < 1 ? cycle : 2 - cycle;
}

export function samplePolyline(
  points: ReadonlyArray<readonly [number, number, number]>,
  t: number,
): [number, number, number] {
  if (points.length === 0) return [0, 0, 0];
  if (points.length === 1) return [points[0][0], points[0][1], points[0][2]];
  const u = Math.min(1, Math.max(0, t)) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(u));
  const f = u - i;
  const a = points[i];
  const b = points[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function sweepAxisValue(x: number, y: number, z: number, axis: SweepAxis): number {
  if (axis === "x") return x;
  if (axis === "z") return z;
  if (axis === "absx") return Math.abs(x);
  return y;
}

/** Gaussian band around the current sweep position (coord and t in 0..1). */
export function sweepBand(coord: number, t: number, sigma = 0.16): number {
  const d = coord - t;
  return Math.exp((-d * d) / (2 * sigma * sigma));
}
