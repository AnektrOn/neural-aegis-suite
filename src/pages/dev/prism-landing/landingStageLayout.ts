import * as THREE from "three";

export type LandingStageItemId = "shield" | "ring" | "aegis";

export type LandingStageLinkMode =
  | "independent"
  | "all"
  | "shield-ring"
  | "shield-aegis"
  | "ring-aegis";

export type LandingStageItemTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  /** Uniform scale (shield uses this as Prism uniformScale). */
  scale: number;
  visible: boolean;
};

export type LandingStageClusterTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

export type LandingStageLayout = {
  link: LandingStageLinkMode;
  /** Applies when `link === "all"`. */
  cluster: LandingStageClusterTransform;
  items: Record<LandingStageItemId, LandingStageItemTransform>;
};

export const LANDING_STAGE_ITEM_LABELS: Record<LandingStageItemId, string> = {
  shield: "Bouclier",
  ring: "Anneau",
  aegis: "AEGIS",
};

export const LANDING_STAGE_LINK_LABELS: Record<LandingStageLinkMode, string> = {
  independent: "Indépendants (3 racines)",
  all: "Tous liés (cluster)",
  "shield-ring": "Bouclier → Anneau",
  "shield-aegis": "Bouclier → AEGIS",
  "ring-aegis": "Anneau → AEGIS",
};

const euler = new THREE.Euler();
const quat = new THREE.Quaternion();
const vec = new THREE.Vector3();
const mat = new THREE.Matrix4();
const matParent = new THREE.Matrix4();

function matrixFromTransform(
  position: [number, number, number],
  rotation: [number, number, number],
  scale: number,
  target: THREE.Matrix4,
) {
  euler.set(rotation[0], rotation[1], rotation[2]);
  quat.setFromEuler(euler);
  vec.set(scale, scale, scale);
  target.compose(
    new THREE.Vector3(...position),
    quat,
    vec,
  );
}

function worldPositionFromMatrix(m: THREE.Matrix4): [number, number, number] {
  vec.setFromMatrixPosition(m);
  return [vec.x, vec.y, vec.z];
}

/** Resolved world-space origins for the layout panel. */
export function computeLandingStageWorldPositions(
  layout: LandingStageLayout,
): Record<LandingStageItemId, [number, number, number]> {
  const { items, cluster, link } = layout;
  const out: Record<LandingStageItemId, [number, number, number]> = {
    shield: [0, 0, 0],
    ring: [0, 0, 0],
    aegis: [0, 0, 0],
  };

  const shieldM = new THREE.Matrix4();
  const ringM = new THREE.Matrix4();
  const aegisM = new THREE.Matrix4();
  const clusterM = new THREE.Matrix4();

  matrixFromTransform(
    items.shield.position,
    items.shield.rotation,
    items.shield.scale,
    shieldM,
  );
  matrixFromTransform(
    items.ring.position,
    items.ring.rotation,
    items.ring.scale,
    ringM,
  );
  matrixFromTransform(
    items.aegis.position,
    items.aegis.rotation,
    items.aegis.scale,
    aegisM,
  );
  matrixFromTransform(
    cluster.position,
    cluster.rotation,
    cluster.scale,
    clusterM,
  );

  switch (link) {
    case "independent":
      out.shield = worldPositionFromMatrix(shieldM);
      out.ring = worldPositionFromMatrix(ringM);
      out.aegis = worldPositionFromMatrix(aegisM);
      break;
    case "all": {
      const s = clusterM.clone().multiply(shieldM);
      const r = clusterM.clone().multiply(ringM);
      const a = clusterM.clone().multiply(aegisM);
      out.shield = worldPositionFromMatrix(s);
      out.ring = worldPositionFromMatrix(r);
      out.aegis = worldPositionFromMatrix(a);
      break;
    }
    case "shield-ring": {
      matParent.copy(ringM);
      mat.copy(matParent).multiply(shieldM);
      out.ring = worldPositionFromMatrix(ringM);
      out.shield = worldPositionFromMatrix(mat);
      out.aegis = worldPositionFromMatrix(aegisM);
      break;
    }
    case "shield-aegis": {
      matParent.copy(aegisM);
      mat.copy(matParent).multiply(shieldM);
      out.aegis = worldPositionFromMatrix(aegisM);
      out.shield = worldPositionFromMatrix(mat);
      out.ring = worldPositionFromMatrix(ringM);
      break;
    }
    case "ring-aegis": {
      matParent.copy(aegisM);
      mat.copy(matParent).multiply(ringM);
      out.aegis = worldPositionFromMatrix(aegisM);
      out.ring = worldPositionFromMatrix(mat);
      out.shield = worldPositionFromMatrix(shieldM);
      break;
    }
  }

  return out;
}

export const DEFAULT_LANDING_STAGE_LAYOUT: LandingStageLayout = {
  link: "independent",
  cluster: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
  },
  items: {
    shield: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 0.7,
      visible: true,
    },
    ring: {
      position: [0, 0, -0.85],
      rotation: [0, 0, 0],
      scale: 1,
      visible: true,
    },
    aegis: {
      position: [0, -0.12, 0.3],
      rotation: [0, 0, 0],
      scale: 1,
      visible: true,
    },
  },
};

export function cloneLandingStageLayout(
  layout: LandingStageLayout,
): LandingStageLayout {
  return JSON.parse(JSON.stringify(layout)) as LandingStageLayout;
}

export function serializeLandingStageLayout(layout: LandingStageLayout): string {
  return JSON.stringify(layout, null, 2);
}

const STORAGE_KEY = "prism-landing-stage-layout:v1";

export function loadLandingStageLayoutFromStorage(): LandingStageLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LandingStageLayout;
    if (!parsed.items?.shield || !parsed.items?.ring || !parsed.items?.aegis) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLandingStageLayoutToStorage(layout: LandingStageLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeLandingStageLayout(layout));
  } catch {
    /* quota / private mode */
  }
}
