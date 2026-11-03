import * as THREE from "three";
import {
  R3F_CUBE_CORE_EMISSION,
  R3F_CUBE_CORE_ESCAPE,
  R3F_SHATTERED_CUBE_TIMING,
} from "./r3fShatteredCubeConstants";
import type { R3fShatteredCubeLattice } from "./r3fShatteredCubeLattice";
import { clamp01, r3fShatteredCubeEaseInOutCubic } from "./r3fShatteredCubeLattice";

export type ShatteredCubePhase = "hold" | "burst";

export type ShatteredCubePhaseState = {
  phase: ShatteredCubePhase;
  t0: number;
  lastNotified: ShatteredCubePhase;
};

export type ShatteredCubeInstancePose = {
  center: THREE.Vector3;
  k: number;
};

export type CubeLightingHull = {
  center: THREE.Vector3;
  halfExtent: number;
};

export type CubeCoreVisualLevels = {
  emissiveIntensity: number;
  corePointIntensity: number;
  haloOpacity: number;
  haloScale: number;
  godrayReveal: number;
  escapeGain: number;
};

export type CubeCoreLightingFrame = {
  timeline: number;
  reveal: number;
  pulse: number;
  phase: ShatteredCubePhase;
  levels: CubeCoreVisualLevels;
};

export type CoreRayMarchResult = {
  clearance: number;
  /** Distance depuis le centre jusqu’au cœur de la fissure (couloir libre dans la coque). */
  exitDistance: number;
};

const CORE_ORIGIN = new THREE.Vector3(0, 0, 0);
const _dir = new THREE.Vector3();
const _sample = new THREE.Vector3();
const _wakeOffset = new THREE.Vector3();

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 + 1e-6));
  return t * t * (3 - 2 * t);
}

function shellFactor(rest: THREE.Vector3, minShell: number): number {
  const m = Math.max(Math.abs(rest.x), Math.abs(rest.y), Math.abs(rest.z));
  if (m < minShell) return 0;
  return clamp01((m - minShell) / (1 - minShell + 1e-6));
}

function pointInsideHull(p: THREE.Vector3, hull: CubeLightingHull): boolean {
  const h = hull.halfExtent;
  return (
    Math.abs(p.x - hull.center.x) <= h &&
    Math.abs(p.y - hull.center.y) <= h &&
    Math.abs(p.z - hull.center.z) <= h
  );
}

function isInsideEmitter(p: THREE.Vector3, emitterHalf: number): boolean {
  return pointInsideHull(p, { center: CORE_ORIGIN, halfExtent: emitterHalf });
}

function isInsideAnyInstance(p: THREE.Vector3, hulls: readonly CubeLightingHull[]): boolean {
  for (let i = 0; i < hulls.length; i++) {
    if (pointInsideHull(p, hulls[i])) return true;
  }
  return false;
}

/**
 * Index d'octant [0..7] selon les signes de (x, y, z).
 */
function octantIndex(v: THREE.Vector3): number {
  return (v.x >= 0 ? 1 : 0) | (v.y >= 0 ? 2 : 0) | (v.z >= 0 ? 4 : 0);
}

export function buildOctantHulls(hulls: readonly CubeLightingHull[]): CubeLightingHull[][] {
  const buckets: CubeLightingHull[][] = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < hulls.length; i++) {
    const hull = hulls[i];
    const c = hull.center;
    const h = hull.halfExtent;
    const xNeg = c.x - h <= 0;
    const xPos = c.x + h >= 0;
    const yNeg = c.y - h <= 0;
    const yPos = c.y + h >= 0;
    const zNeg = c.z - h <= 0;
    const zPos = c.z + h >= 0;

    for (let oct = 0; oct < 8; oct++) {
      const ox = (oct & 1) !== 0 ? xPos : xNeg;
      const oy = (oct & 2) !== 0 ? yPos : yNeg;
      const oz = (oct & 4) !== 0 ? zPos : zNeg;
      if (ox && oy && oz) {
        buckets[oct].push(hull);
      }
    }
  }
  return buckets;
}

/**
 * Ray march depuis le centre (0,0,0) à travers le cube plein en défragmentation :
 * mesure l'ouverture du couloir dans l'épaisseur de la coque et localise la fissure.
 */
export function marchRayFromCore(
  direction: THREE.Vector3,
  instanceHulls: readonly CubeLightingHull[],
  emitterHalf: number,
  options: {
    maxDistance: number;
    stepSize: number;
    maxSteps: number;
    minConsecutiveClearSteps: number;
  },
): CoreRayMarchResult {
  _dir.copy(direction).normalize();
  let t = Math.max(options.stepSize, emitterHalf);
  let consecutiveClear = 0;
  let maxConsecutiveClear = 0;
  let clearSteps = 0;
  let blockedSteps = 0;
  let bestCorridorMidT = 0;
  let currentCorridorStartT = t;

  for (let step = 0; step < options.maxSteps && t <= options.maxDistance; step++) {
    _sample.copy(_dir).multiplyScalar(t);

    if (isInsideEmitter(_sample, emitterHalf)) {
      t += options.stepSize;
      currentCorridorStartT = t;
      continue;
    }

    if (isInsideAnyInstance(_sample, instanceHulls)) {
      blockedSteps += t < 1.15 ? 1.35 : 1.0;
      consecutiveClear = 0;
      currentCorridorStartT = t + options.stepSize;
    } else {
      clearSteps++;
      consecutiveClear++;
      if (consecutiveClear >= maxConsecutiveClear) {
        maxConsecutiveClear = consecutiveClear;
        const midT = 0.5 * (currentCorridorStartT + t);
        if (midT >= 0.35 && midT <= 1.35) {
          bestCorridorMidT = midT;
        }
      }
    }
    t += options.stepSize;
  }

  if (maxConsecutiveClear < options.minConsecutiveClearSteps) {
    return { clearance: 0, exitDistance: 0 };
  }
  const total = clearSteps + blockedSteps;
  if (total <= 0) {
    return { clearance: 0, exitDistance: 0 };
  }

  const clearance = clamp01(clearSteps / total);
  const exitDistance =
    bestCorridorMidT > 0 ? Math.min(Math.max(bestCorridorMidT, 0.52), 1.22) : 0.78;

  return { clearance, exitDistance };
}

/**
 * Calcule la direction d'interstice (fissure laissée par l'écartement du fragment `i`).
 */
function computeFissureDirection(
  rest: THREE.Vector3,
  poseCenter: THREE.Vector3,
  blastVector: THREE.Vector3,
  outDir: THREE.Vector3,
): THREE.Vector3 {
  _wakeOffset.subVectors(poseCenter, rest);
  if (_wakeOffset.lengthSq() > 1e-5) {
    // Viser le sillon ouvert entre la position de repos et le décalage tangentiel du bloc
    outDir.copy(rest).addScaledVector(_wakeOffset, -0.22);
    if (outDir.lengthSq() > 1e-5) {
      return outDir.normalize();
    }
  }
  outDir.copy(rest);
  if (outDir.lengthSq() < 1e-6) outDir.copy(blastVector);
  return outDir.normalize();
}

export function computeCoreEscapeGain(
  lattice: R3fShatteredCubeLattice,
  poses: ShatteredCubeInstancePose[],
  octantHulls: readonly (readonly CubeLightingHull[])[],
  emitterHalf: number,
  reveal: number,
): number {
  const cfg = R3F_CUBE_CORE_ESCAPE;
  if (reveal < cfg.minReveal) return 0;

  const marchOpts = {
    maxDistance: cfg.marchMaxDistance,
    stepSize: cfg.marchStepSize,
    maxSteps: cfg.marchMaxSteps,
    minConsecutiveClearSteps: cfg.minConsecutiveClearSteps,
  };

  let sum = 0;
  let count = 0;
  const stride = Math.max(1, Math.floor(lattice.count / 120));

  for (let i = 0; i < lattice.count; i += stride) {
    const it = lattice.items[i];
    const pose = poses[i];
    if (pose.k < cfg.minInstanceK) continue;
    if (shellFactor(it.rest, cfg.shellRestMin) <= 0) continue;

    computeFissureDirection(it.rest, pose.center, it.blastVector, _dir);
    const hulls = octantHulls[octantIndex(_dir)];

    const { clearance } = marchRayFromCore(_dir, hulls, emitterHalf, marchOpts);
    if (clearance <= 0) continue;
    sum += clearance * pose.k;
    count++;
  }

  if (count === 0) return clamp01(reveal * 0.35);
  return clamp01((sum / count) * (0.45 + 0.55 * reveal));
}

export function advanceShatteredCubePhase(
  state: ShatteredCubePhaseState,
  time: number,
  autoPlay: boolean,
): number {
  const { hold: HOLD_T, burst: BURST_T } = R3F_SHATTERED_CUBE_TIMING;

  if (state.t0 < 0) state.t0 = time;
  const e = time - state.t0;

  if (state.phase === "hold") {
    if (autoPlay && e > HOLD_T) {
      state.phase = "burst";
      state.t0 = time;
      return 0;
    }
    return 0;
  }

  // Phase burst : progresse de 0 à 1 et reste ouvert à 1 (pas de phase reform).
  return clamp01(e / BURST_T);
}

export function computeInstancePoses(
  lattice: R3fShatteredCubeLattice,
  timeline: number,
  defragDepth: number,
  time: number,
  cubeWindow: number,
  outPoses: ShatteredCubeInstancePose[],
): { reveal: number } {
  const depth = defragDepth;
  let sum = 0;

  for (let i = 0; i < lattice.count; i++) {
    const it = lattice.items[i];
    const k = r3fShatteredCubeEaseInOutCubic(clamp01((timeline - it.start) / cubeWindow));
    sum += k;
    const slowWave = Math.sin(time * it.driftFreq + it.phaseOffset) * 0.05 * k;
    const travel = (k * it.blastDistance + slowWave) * 1.45 * depth;

    const pose = outPoses[i] ?? { center: new THREE.Vector3(), k: 0 };
    pose.center.copy(it.rest).addScaledVector(it.blastVector, travel);
    pose.k = k;
    outPoses[i] = pose;
  }

  return { reveal: sum / lattice.count };
}

export function buildInstanceHulls(
  lattice: R3fShatteredCubeLattice,
  poses: ShatteredCubeInstancePose[],
): CubeLightingHull[] {
  const hulls: CubeLightingHull[] = [];
  const half = lattice.baseCubeSize * 0.5;
  for (let i = 0; i < lattice.count; i++) {
    hulls.push({ center: poses[i].center, halfExtent: half });
  }
  return hulls;
}

export function computeCubeCoreVisualLevels(
  phase: ShatteredCubePhase,
  reveal: number,
  pulse: number,
  coreLightScale: number,
  escapeGain: number,
): CubeCoreVisualLevels {
  const em = R3F_CUBE_CORE_EMISSION;
  const esc = R3F_CUBE_CORE_ESCAPE;

  if (phase === "hold") {
    const emissiveIntensity = em.emissiveHold * pulse * coreLightScale;
    return {
      emissiveIntensity,
      corePointIntensity: em.pointHold * pulse * coreLightScale,
      haloOpacity: 0.22 * pulse * coreLightScale,
      haloScale: em.haloScaleBase,
      godrayReveal: 0,
      escapeGain: 0,
    };
  }

  const emissiveIntensity =
    (em.emissiveHold + em.emissiveBurstMul * reveal) * pulse * coreLightScale;

  const escapeRamp = Math.max(
    smoothstep(esc.escapeRampLow, esc.escapeRampHigh, escapeGain),
    smoothstep(0.04, 0.55, reveal) * 0.85,
  );
  const burst =
    em.pointHold +
    em.pointBurstPeak * Math.pow(reveal, em.pointBurstPower) * escapeRamp;

  const corePointIntensity = burst * pulse * coreLightScale;

  const holdHalo = 0.22;
  const haloOpacity =
    (holdHalo + Math.pow(reveal, 1.35) * em.haloOpacityMul * escapeRamp) *
    pulse *
    coreLightScale;

  const haloScale = em.haloScaleBase + em.haloScaleReveal * reveal * escapeRamp;

  const godrayReveal =
    escapeRamp >= esc.minGodrayEscape && corePointIntensity > em.pointHold * 1.5
      ? Math.min((corePointIntensity / em.godrayIntensityDivisor) * escapeRamp, 1)
      : 0;

  return {
    emissiveIntensity,
    corePointIntensity,
    haloOpacity,
    haloScale,
    godrayReveal,
    escapeGain,
  };
}

export function computeCubeCoreLightingFrame(
  lattice: R3fShatteredCubeLattice,
  poses: ShatteredCubeInstancePose[],
  phase: ShatteredCubePhase,
  timeline: number,
  reveal: number,
  time: number,
  coreLightScale: number,
): CubeCoreLightingFrame {
  const pulse = 0.97 + 0.03 * Math.sin(time * 1.6);
  const emitterHalf = (lattice.cell * 0.94) * 0.5;

  if (phase === "hold") {
    const levels = computeCubeCoreVisualLevels(phase, 0, pulse, coreLightScale, 0);
    return { timeline, reveal, pulse, phase, levels };
  }

  const instanceHulls = buildInstanceHulls(lattice, poses);
  const octantHulls = buildOctantHulls(instanceHulls);
  const escapeGain = computeCoreEscapeGain(
    lattice,
    poses,
    octantHulls,
    emitterHalf,
    reveal,
  );
  const levels = computeCubeCoreVisualLevels(
    phase,
    reveal,
    pulse,
    coreLightScale,
    escapeGain,
  );

  return { timeline, reveal, pulse, phase, levels };
}
