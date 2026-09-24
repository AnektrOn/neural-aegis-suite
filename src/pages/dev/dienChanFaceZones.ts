import * as THREE from "three";
import {
  diagramUvToMeshTarget,
  isLateralDiagramUv,
  mapBqcUvToMeshUv,
} from "./dienChanMeshCalibration";

/** Face-region tests in normalized local space: u∈[0,1] left→right, v∈[0,1] bottom→top. */

export type DienChanZoneId =
  | "forehead"
  | "forehead_center"
  | "forehead_hairline"
  | "eyebrows"
  | "nose_center"
  | "nose_full"
  | "ears_front"
  | "mouth_area"
  | "jaw_line"
  | "chin_hollow"
  | "nasolabial_folds"
  | "cheeks_under_eyes";

type RegionFn = (u: number, v: number, front: number) => boolean;

function inBand(v: number, a: number, b: number) {
  return v >= a && v <= b;
}

function nearX(u: number, center: number, half: number) {
  return Math.abs(u - center) <= half;
}

export const ZONE_REGIONS: Record<DienChanZoneId, RegionFn> = {
  forehead: (u, v, front) => v > 0.7 && front > 0.15 && nearX(u, 0.5, 0.42),
  forehead_center: (u, v, front) => v > 0.68 && v < 0.92 && nearX(u, 0.5, 0.14) && front > 0.2,
  forehead_hairline: (u, v, front) => v > 0.84 && front > 0.1 && nearX(u, 0.5, 0.45),
  eyebrows: (u, v, front) => {
    if (!inBand(v, 0.58, 0.7) || front < 0.2) return false;
    const d = Math.abs(u - 0.5);
    return d > 0.08 && d < 0.36;
  },
  nose_center: (u, v, front) => nearX(u, 0.5, 0.07) && inBand(v, 0.38, 0.64) && front > 0.35,
  nose_full: (u, v, front) => nearX(u, 0.5, 0.13) && inBand(v, 0.36, 0.64) && front > 0.28,
  ears_front: (u, v) => Math.abs(u - 0.5) > 0.4 && inBand(v, 0.38, 0.68),
  mouth_area: (u, v, front) => nearX(u, 0.5, 0.2) && inBand(v, 0.22, 0.4) && front > 0.25,
  jaw_line: (u, v, front) => v < 0.28 && Math.abs(u - 0.5) > 0.12 && front > 0.05,
  chin_hollow: (u, v, front) => nearX(u, 0.5, 0.12) && inBand(v, 0.12, 0.28) && front > 0.2,
  nasolabial_folds: (u, v, front) => {
    const d = Math.abs(u - 0.5);
    return d > 0.08 && d < 0.22 && inBand(v, 0.32, 0.5) && front > 0.3;
  },
  cheeks_under_eyes: (u, v, front) => {
    const d = Math.abs(u - 0.5);
    return d > 0.14 && d < 0.38 && inBand(v, 0.48, 0.6) && front > 0.25;
  },
};

export const POINT_TO_ZONES: Record<number, DienChanZoneId[]> = {
  0: ["ears_front"],
  1: ["nose_center", "nose_full"],
  3: ["nose_full"],
  5: ["mouth_area", "jaw_line", "nasolabial_folds"],
  12: ["ears_front"],
  14: ["ears_front", "jaw_line"],
  17: ["mouth_area", "nasolabial_folds"],
  19: ["mouth_area", "nose_full"],
  20: ["ears_front", "jaw_line"],
  26: ["eyebrows", "forehead_center"],
  34: ["eyebrows"],
  37: ["cheeks_under_eyes", "nasolabial_folds"],
  38: ["mouth_area", "nasolabial_folds"],
  39: ["cheeks_under_eyes", "mouth_area"],
  41: ["cheeks_under_eyes", "mouth_area"],
  43: ["nose_center", "nose_full"],
  50: ["cheeks_under_eyes", "nasolabial_folds"],
  60: ["cheeks_under_eyes"],
  61: ["nose_full"],
  63: ["mouth_area"],
  65: ["eyebrows", "forehead"],
  73: ["cheeks_under_eyes"],
  74: ["jaw_line", "mouth_area"],
  97: ["eyebrows"],
  98: ["eyebrows"],
  99: ["eyebrows"],
  100: ["eyebrows", "cheeks_under_eyes"],
  103: ["forehead_center", "forehead"],
  106: ["forehead_center"],
  107: ["forehead", "eyebrows"],
  108: ["forehead_center"],
  113: ["mouth_area", "nasolabial_folds"],
  124: ["forehead", "forehead_hairline"],
  126: ["forehead_hairline"],
  127: ["chin_hollow", "mouth_area"],
  143: ["nose_center"],
  156: ["jaw_line"],
  300: ["forehead_hairline"],
  319: ["eyebrows", "cheeks_under_eyes"],
  216: ["eyebrows"],
  324: ["eyebrows"],
  477: ["eyebrows"],
  365: ["chin_hollow"],
};

export function resolveActiveZones(zones: string[], points: number[]): DienChanZoneId[] {
  const set = new Set<DienChanZoneId>();
  for (const z of zones) {
    if (z in ZONE_REGIONS) set.add(z as DienChanZoneId);
  }
  if (set.size === 0) {
    for (const p of points) {
      for (const z of POINT_TO_ZONES[p] ?? []) set.add(z);
    }
  }
  return [...set];
}

export function paintZoneColors(
  geometry: THREE.BufferGeometry,
  activeZones: DienChanZoneId[],
  baseRgb: [number, number, number],
  activeRgb: [number, number, number],
) {
  const pos = geometry.attributes.position;
  if (!pos) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const min = box.min;
  const size = new THREE.Vector3().subVectors(box.max, box.min);
  const sx = Math.max(size.x, 1e-5);
  const sy = Math.max(size.y, 1e-5);
  const sz = Math.max(size.z, 1e-5);

  let colors = geometry.getAttribute("color") as THREE.BufferAttribute | null;
  if (!colors || colors.count !== pos.count) {
    colors = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geometry.setAttribute("color", colors);
  }

  const tests = activeZones.map((id) => ZONE_REGIONS[id]).filter(Boolean);
  /** Zones Moricoli = face avant (max Z). Arrière du crâne garde la même teinte de base. */
  const FACIAL_FRONT_MIN = 0.28;

  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - min.x) / sx;
    const v = (pos.getY(i) - min.y) / sy;
    const front = (pos.getZ(i) - min.z) / sz;

    let hit = false;
    if (front >= FACIAL_FRONT_MIN) {
      for (const test of tests) {
        if (test(u, v, front)) {
          hit = true;
          break;
        }
      }
    }

    const rgb = hit ? activeRgb : baseRgb;
    colors.setXYZ(i, rgb[0], rgb[1], rgb[2]);
  }

  colors.needsUpdate = true;
}

/** SVG map coords (viewBox 400×450) → normalized face UV (u left→right, v bottom→top). */
export function svgPointToUV(x: number, y: number): { u: number; v: number } {
  const u = (x - 95) / 210;
  const v = 1 - (y - 55) / 365;
  return {
    u: Math.min(1, Math.max(0, u)),
    v: Math.min(1, Math.max(0, v)),
  };
}

/** Seuils scellement bouche (géométrie uniquement — pas l’arrière du crâne). */
export const MOUTH_SEAL_U_HALF = 0.34;
export const MOUTH_SEAL_V_MIN = 0.16;
export const MOUTH_SEAL_V_MAX = 0.52;
export const MOUTH_DEEP_FRONT = 0.5;
export const MOUTH_SHALLOW_FRONT = 0.62;
export const MOUTH_CENTER_PULL_FRONT = 0.38;
export const MOUTH_LIP_Z_RATIO = 0.68;
export const MOUTH_SHALLOW_Z_RATIO = 0.64;

export const NECK_SEAL_V_MAX = 0.14;
export const NECK_COLLAPSE_X = 0.12;
export const NECK_COLLAPSE_Z_RATIO = 0.38;

export type MouthInteriorStats = {
  mouthVerts: number;
  deepVerts: number;
  minFrontInMouth: number;
};

export type RearCraniumStats = {
  rearShellVerts: number;
  rearDeepVerts: number;
};

/** Sommets arrière du crâne encore trop en profondeur (cavité ouverte face cap). */
export function measureRearCraniumExposure(
  geometry: THREE.BufferGeometry,
): RearCraniumStats {
  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos) return { rearShellVerts: 0, rearDeepVerts: 0 };

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return { rearShellVerts: 0, rearDeepVerts: 0 };

  const minY = box.min.y;
  const minZ = box.min.z;
  const maxZ = box.max.z;
  const sy = Math.max(box.max.y - minY, 1e-5);
  const sz = Math.max(maxZ - minZ, 1e-5);

  let rearShellVerts = 0;
  let rearDeepVerts = 0;

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const v = (y - minY) / sy;
    /** 1 = arrière du crâne (min Z), 0 = face (max Z). */
    const rear = (maxZ - z) / sz;
    if (v < 0.15 || v > 0.9) continue;
    if (rear < 0.38) continue;
    rearShellVerts++;
    if (rear > 0.62) rearDeepVerts++;
  }

  return { rearShellVerts, rearDeepVerts };
}

/** Compte les sommets profonds dans la zone bouche (pour debug / tests). */
export function measureMouthInteriorExposure(
  geometry: THREE.BufferGeometry,
): MouthInteriorStats {
  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos) return { mouthVerts: 0, deepVerts: 0, minFrontInMouth: 1 };

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return { mouthVerts: 0, deepVerts: 0, minFrontInMouth: 1 };

  const minX = box.min.x;
  const minY = box.min.y;
  const minZ = box.min.z;
  const sx = Math.max(box.max.x - minX, 1e-5);
  const sy = Math.max(box.max.y - minY, 1e-5);
  const sz = Math.max(box.max.z - minZ, 1e-5);

  let mouthVerts = 0;
  let deepVerts = 0;
  let minFrontInMouth = 1;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const u = (x - minX) / sx;
    const v = (y - minY) / sy;
    const front = (z - minZ) / sz;

    const inMouth =
      Math.abs(u - 0.5) < 0.36 && v > 0.14 && v < 0.56;
    if (!inMouth) continue;

    mouthVerts++;
    minFrontInMouth = Math.min(minFrontInMouth, front);
    if (front < 0.48) deepVerts++;
  }

  return { mouthVerts, deepVerts, minFrontInMouth };
}

type SealBBox = {
  minX: number;
  minY: number;
  minZ: number;
  sx: number;
  sy: number;
  sz: number;
  midX: number;
};

function readSealBBox(geometry: THREE.BufferGeometry): SealBBox | null {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return null;
  const minX = box.min.x;
  const minY = box.min.y;
  const minZ = box.min.z;
  return {
    minX,
    minY,
    minZ,
    sx: Math.max(box.max.x - minX, 1e-5),
    sy: Math.max(box.max.y - minY, 1e-5),
    sz: Math.max(box.max.z - minZ, 1e-5),
    midX: (box.min.x + box.max.x) * 0.5,
  };
}

/** Cavité bouche : tire les sommets profonds vers les lèvres (silhouette extérieure inchangée). */
export function sealMouthCavityForWireframe(geometry: THREE.BufferGeometry): void {
  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  const b = readSealBBox(geometry);
  if (!pos || !b) return;

  const lipZ = b.minZ + b.sz * MOUTH_LIP_Z_RATIO;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const u = (x - b.minX) / b.sx;
    const v = (y - b.minY) / b.sy;
    const front = (z - b.minZ) / b.sz;

    const inMouth =
      Math.abs(u - 0.5) < MOUTH_SEAL_U_HALF &&
      v > MOUTH_SEAL_V_MIN &&
      v < MOUTH_SEAL_V_MAX;
    const deepMouth = inMouth && front < MOUTH_DEEP_FRONT;

    if (deepMouth) {
      pos.setZ(i, Math.max(z, lipZ));
      if (front < MOUTH_CENTER_PULL_FRONT) {
        pos.setX(i, b.midX + (x - b.midX) * 0.9);
      }
      continue;
    }

    if (inMouth && front < MOUTH_SHALLOW_FRONT) {
      pos.setZ(i, Math.max(z, b.minZ + b.sz * MOUTH_SHALLOW_Z_RATIO));
    }
  }

  pos.needsUpdate = true;
}

/** Cou sous le menton : repli géométrique (indépendant de la bouche). */
export function sealNeckForWireframe(
  geometry: THREE.BufferGeometry,
  jawCutRatioFromBottom = 0.14,
): void {
  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  const b = readSealBBox(geometry);
  if (!pos || !b) return;

  const cutY = b.minY + b.sy * jawCutRatioFromBottom;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const v = (y - b.minY) / b.sy;

    if (v >= NECK_SEAL_V_MAX || y >= cutY) continue;

    pos.setY(i, cutY);
    pos.setX(i, b.midX + (x - b.midX) * NECK_COLLAPSE_X);
    pos.setZ(i, Math.min(z, b.minZ + b.sz * NECK_COLLAPSE_Z_RATIO));
  }

  pos.needsUpdate = true;
}

/**
 * Bouche puis cou — pas de passe arrière (calotte = occludeur rendu).
 */
export function sealFacialInteriorForWireframe(
  geometry: THREE.BufferGeometry,
  jawCutRatioFromBottom = 0.14,
): MouthInteriorStats {
  sealMouthCavityForWireframe(geometry);
  sealNeckForWireframe(geometry, jawCutRatioFromBottom);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return measureMouthInteriorExposure(geometry);
}

/** Fallback: bbox front plane from UV (not mesh-accurate). */
export function uvToLocalPosition(
  u: number,
  v: number,
  box: THREE.Box3,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const size = new THREE.Vector3().subVectors(box.max, box.min);
  out.set(
    box.min.x + u * size.x,
    box.min.y + v * size.y,
    box.min.z + size.z * 0.92,
  );
  return out;
}

function diagramTargetUvs(du: number, dv: number): [number, number][] {
  const { u: uM, v: vM } = diagramUvToMeshTarget(du, dv);
  const uMir = 1 - uM;
  const out: [number, number][] = [[uM, vM], [uMir, vM]];
  if (isLateralDiagramUv(du)) {
    out.push([du, dv], [1 - du, dv], [uM, dv], [uMir, dv]);
  } else {
    out.push([du, vM], [1 - du, vM]);
  }
  return out;
}

/**
 * Moricoli (x,y) → UV sur le mesh où peindre (vertex frontal le plus cohérent).
 * Essaie plusieurs correspondances u/v (flip, marges tempes) puis ancre sur le maillage réel.
 */
export function resolveMarkMeshUv(
  svgX: number,
  svgY: number,
  geometry: THREE.BufferGeometry,
): FaceUvSpot {
  const { u: du, v: dv } = svgPointToUV(svgX, svgY);
  const lateral = isLateralDiagramUv(du);
  const targets = diagramTargetUvs(du, dv);
  const fallback = diagramUvToMeshTarget(du, dv);

  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos) return { ...fallback, lateral };

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return { ...fallback, lateral };

  const min = box.min;
  const size = new THREE.Vector3().subVectors(box.max, box.min);
  const sx = Math.max(size.x, 1e-5);
  const sy = Math.max(size.y, 1e-5);
  const sz = Math.max(size.z, 1e-5);

  const minFront = lateral ? 0.04 : 0.18;
  const wantLeft = du < 0.5;

  let bestScore = Infinity;
  let best: FaceUvSpot = { u: fallback.u, v: fallback.v, lateral };

  for (let i = 0; i < pos.count; i++) {
    const pu = (pos.getX(i) - min.x) / sx;
    const pv = (pos.getY(i) - min.y) / sy;
    const front = (pos.getZ(i) - min.z) / sz;
    if (front < minFront) continue;

    if (lateral) {
      const onCorrectSide = wantLeft ? pu < 0.48 : pu > 0.52;
      if (!onCorrectSide) continue;
    } else if (dv > 0.52) {
      const onNoseBridge =
        Math.abs(pu - 0.5) < 0.09 && pv > 0.34 && pv < 0.58 && front > 0.25;
      if (onNoseBridge) continue;
    }

    for (const [tu, tv] of targets) {
      const duu = pu - tu;
      const dvv = pv - tv;
      const d2 = duu * duu + dvv * dvv;
      let score = d2 - front * (lateral ? 0.006 : 0.014);
      if (lateral) {
        score -= Math.abs(pu - 0.5) * 0.06;
      }
      if (score < bestScore) {
        bestScore = score;
        best = { u: pu, v: pv, lateral };
      }
    }
  }

  if (bestScore === Infinity && lateral) {
    for (let i = 0; i < pos.count; i++) {
      const pu = (pos.getX(i) - min.x) / sx;
      const pv = (pos.getY(i) - min.y) / sy;
      const front = (pos.getZ(i) - min.z) / sz;
      if (front < 0.03) continue;
      for (const [tu, tv] of targets) {
        const d2 = (pu - tu) ** 2 + (pv - tv) ** 2;
        const score = d2 - Math.abs(pu - 0.5) * 0.05;
        if (score < bestScore) {
          bestScore = score;
          best = { u: pu, v: pv, lateral };
        }
      }
    }
  }

  return best;
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Tight Gaussian on the wireframe — BQC point, not an anatomical band (σ in normalized UV). */
export const BQC_SPOT_SIGMA_U = 0.009;
export const BQC_SPOT_SIGMA_V = 0.01;
const BQC_SPOT_MAX_DIST2 = 12;

export type FaceUvSpot = { u: number; v: number; lateral?: boolean };

function spotWeight(
  u: number,
  v: number,
  front: number,
  spot: FaceUvSpot,
  sigmaU: number,
  sigmaV: number,
): number {
  const minFront = spot.lateral ? 0.045 : 0.12;
  if (front < minFront) return 0;
  const pu = spot.u;
  const pv = spot.v;
  const du = (u - pu) / sigmaU;
  const dv = (v - pv) / sigmaV;
  const d2 = du * du + dv * dv;
  if (d2 > BQC_SPOT_MAX_DIST2) return 0;
  return Math.exp(-0.5 * d2);
}

export type PaintFaceHighlightOptions = {
  baseRgb: [number, number, number];
  spotlightRgb: [number, number, number];
  /** 0–1 pulse from animation loop */
  spotlightPulse?: number;
  /** Active BQC locations (bilateral) for the current protocol step — precise UV from the face map. */
  spotlightSpots: FaceUvSpot[];
  /** Faint reference dots for other points in the protocol (optional). */
  referenceSpots?: FaceUvSpot[];
  referenceRgb?: [number, number, number];
  referenceWeight?: number;
};

export function paintBqcPointHighlights(
  geometry: THREE.BufferGeometry,
  options: PaintFaceHighlightOptions,
) {
  const {
    baseRgb,
    spotlightRgb,
    spotlightPulse = 0,
    spotlightSpots,
    referenceSpots = [],
    referenceRgb = [0.22, 0.34, 0.52],
    referenceWeight = 0.35,
  } = options;

  const pos = geometry.attributes.position;
  if (!pos) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const min = box.min;
  const size = new THREE.Vector3().subVectors(box.max, box.min);
  const sx = Math.max(size.x, 1e-5);
  const sy = Math.max(size.y, 1e-5);
  const sz = Math.max(size.z, 1e-5);

  let colors = geometry.getAttribute("color") as THREE.BufferAttribute | null;
  if (!colors || colors.count !== pos.count) {
    colors = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geometry.setAttribute("color", colors);
  }

  const pulseBoost = 0.78 + spotlightPulse * 0.42;
  const su = BQC_SPOT_SIGMA_U;
  const sv = BQC_SPOT_SIGMA_V;

  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - min.x) / sx;
    const v = (pos.getY(i) - min.y) / sy;
    const front = (pos.getZ(i) - min.z) / sz;

    let wSpot = 0;
    for (const s of spotlightSpots) {
      const sigU = s.lateral ? su * 1.35 : su;
      const sigV = s.lateral ? sv * 1.2 : sv;
      wSpot = Math.max(wSpot, spotWeight(u, v, front, s, sigU, sigV));
    }

    let wRef = 0;
    if (referenceSpots.length > 0 && wSpot < 0.05) {
      for (const s of referenceSpots) {
        const sigU = s.lateral ? su * 1.5 : su * 1.15;
        const sigV = s.lateral ? sv * 1.35 : sv * 1.15;
        wRef = Math.max(wRef, spotWeight(u, v, front, s, sigU, sigV));
      }
      wRef *= referenceWeight;
    }

    const w = Math.min(1, wSpot * pulseBoost + wRef);
    const rgb =
      w > 0.001
        ? mixRgb(baseRgb, wSpot > wRef ? spotlightRgb : referenceRgb, w)
        : baseRgb;

    colors.setXYZ(i, rgb[0], rgb[1], rgb[2]);
  }

  colors.needsUpdate = true;
}

/** UV de marquage sur le mesh (nécessite la géométrie tête après seal). */
export function bqcSpotsFromSvgCoords(
  coords: { x: number; y: number }[],
  geometry: THREE.BufferGeometry,
): FaceUvSpot[] {
  return coords.map((c) => resolveMarkMeshUv(c.x, c.y, geometry));
}
