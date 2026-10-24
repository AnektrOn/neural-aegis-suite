import * as THREE from "three";
import {
  R3F_CUBE_CORE_EMISSION,
  R3F_CUBE_INTERSTICE_BEAMS,
  R3F_SHATTERED_CUBE_TIMING,
} from "./r3fShatteredCubeConstants";
import type { R3fShatteredCubeLattice } from "./r3fShatteredCubeLattice";
import { clamp01, r3fShatteredCubeEaseInOutCubic } from "./r3fShatteredCubeLattice";

export type ShatteredCubePhase = "hold" | "burst" | "reform";

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

export type IntersticeBeamCandidate = {
  /** Point d’émergence (interstice), pas le noyau. */
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  clearance: number;
  weight: number;
  intensity: number;
};

export type CubeCoreVisualLevels = {
  emissiveIntensity: number;
  corePointIntensity: number;
  haloOpacity: number;
  haloScale: number;
  godrayReveal: number;
  /** 0–1 : part des directions où la lumière peut sortir du cube (ray march depuis le centre). */
  escapeGain: number;
};

export type CubeCoreLightingFrame = {
  timeline: number;
  reveal: number;
  pulse: number;
  levels: CubeCoreVisualLevels;
  beams: IntersticeBeamCandidate[];
};

const CORE_ORIGIN = new THREE.Vector3(0, 0, 0);
const _dir = new THREE.Vector3();
const _sample = new THREE.Vector3();

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

function isInsideAnyInstance(p: THREE.Vector3, hulls: CubeLightingHull[]): boolean {
  for (let i = 0; i < hulls.length; i++) {
    if (pointInsideHull(p, hulls[i])) return true;
  }
  return false;
}

export type CoreRayMarchResult = {
  clearance: number;
  /** Distance depuis le centre jusqu’à l’interstice (début du couloir libre). */
  exitDistance: number;
};

/**
 * Ray march depuis le **centre du cube** (0,0,0) : traverse le noyau émissif,
 * puis compte le couloir libre entre les fragments (pas de lumière si basalte bloque).
 */
export function marchRayFromCore(
  direction: THREE.Vector3,
  instanceHulls: CubeLightingHull[],
  emitterHalf: number,
  options: {
    maxDistance: number;
    stepSize: number;
    maxSteps: number;
    minConsecutiveClearSteps: number;
  },
): CoreRayMarchResult {
  _dir.copy(direction).normalize();
  let t = 0;
  let consecutiveClear = 0;
  let maxConsecutiveClear = 0;
  let clearSteps = 0;
  let blockedSteps = 0;
  let exitDistance = 0;

  for (let step = 0; step < options.maxSteps && t <= options.maxDistance; step++) {
    _sample.copy(_dir).multiplyScalar(t);
    const inEmitter = isInsideEmitter(_sample, emitterHalf);

    if (inEmitter) {
      t += options.stepSize;
      continue;
    }

    if (exitDistance <= 0) exitDistance = t;

    if (isInsideAnyInstance(_sample, instanceHulls)) {
      blockedSteps++;
      consecutiveClear = 0;
    } else {
      clearSteps++;
      consecutiveClear++;
      if (consecutiveClear > maxConsecutiveClear) maxConsecutiveClear = consecutiveClear;
    }
    t += options.stepSize;
  }

  if (maxConsecutiveClear < options.minConsecutiveClearSteps) {
    return { clearance: 0, exitDistance: 0 };
  }
  const total = clearSteps + blockedSteps;
  if (total <= 0) return { clearance: 0, exitDistance: 0 };
  return { clearance: clearSteps / total, exitDistance };
}

export function computeCoreEscapeGain(
  lattice: R3fShatteredCubeLattice,
  poses: ShatteredCubeInstancePose[],
  instanceHulls: CubeLightingHull[],
  emitterHalf: number,
  reveal: number,
): number {
  const cfg = R3F_CUBE_INTERSTICE_BEAMS;
  if (reveal < cfg.minReveal) return 0;

  const marchOpts = {
    maxDistance: cfg.marchMaxDistance,
    stepSize: cfg.marchStepSize,
    maxSteps: cfg.marchMaxSteps,
    minConsecutiveClearSteps: cfg.minConsecutiveClearSteps,
  };

  let sum = 0;
  let count = 0;

  for (let i = 0; i < lattice.count; i++) {
    const it = lattice.items[i];
    const pose = poses[i];
    if (pose.k < cfg.minInstanceK) continue;
    if (shellFactor(it.rest, cfg.shellRestMin) <= 0) continue;

    _dir.copy(pose.center);
    if (_dir.lengthSq() < 1e-6) _dir.copy(it.blastVector);
    _dir.normalize();

    const { clearance } = marchRayFromCore(_dir, instanceHulls, emitterHalf, marchOpts);
    if (clearance <= 0) continue;
    sum += clearance * pose.k;
    count++;
  }

  if (count === 0) return 0;
  return clamp01(sum / count);
}

export function advanceShatteredCubePhase(
  state: ShatteredCubePhaseState,
  time: number,
  autoPlay: boolean,
): number {
  const { hold: HOLD_T, burst: BURST_T, reform: REFORM_T } = R3F_SHATTERED_CUBE_TIMING;

  if (state.t0 < 0) state.t0 = time;
  const e = time - state.t0;
  let timeline: number;

  if (state.phase === "hold") {
    timeline = 0;
    if (autoPlay && e > HOLD_T) {
      state.phase = "burst";
      state.t0 = time;
    }
  } else if (state.phase === "burst") {
    timeline = clamp01(e / BURST_T);
    if (autoPlay && e > BURST_T) {
      state.phase = "reform";
      state.t0 = time;
    }
  } else {
    const x = clamp01(e / REFORM_T);
    timeline = 1 - x;
    if (x >= 1) {
      state.phase = "hold";
      state.t0 = time;
      timeline = 0;
    }
  }

  return timeline;
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

export function pickIntersticeBeams(
  lattice: R3fShatteredCubeLattice,
  poses: ShatteredCubeInstancePose[],
  instanceHulls: CubeLightingHull[],
  emitterHalf: number,
  reveal: number,
  pulse: number,
  coreLightScale: number,
): IntersticeBeamCandidate[] {
  const cfg = R3F_CUBE_INTERSTICE_BEAMS;
  if (reveal < cfg.minReveal) return [];

  const marchOpts = {
    maxDistance: cfg.marchMaxDistance,
    stepSize: cfg.marchStepSize,
    maxSteps: cfg.marchMaxSteps,
    minConsecutiveClearSteps: cfg.minConsecutiveClearSteps,
  };

  const candidates: IntersticeBeamCandidate[] = [];

  for (let i = 0; i < lattice.count; i++) {
    const it = lattice.items[i];
    const pose = poses[i];
    const k = pose.k;
    if (k < cfg.minInstanceK) continue;

    const shell = shellFactor(it.rest, cfg.shellRestMin);
    if (shell <= 0) continue;

    _dir.copy(pose.center);
    if (_dir.lengthSq() < 1e-6) _dir.copy(it.blastVector);
    _dir.normalize();

    const { clearance, exitDistance } = marchRayFromCore(
      _dir,
      instanceHulls,
      emitterHalf,
      marchOpts,
    );
    if (clearance <= 0 || exitDistance <= 0) continue;

    const weight = k * clearance * shell * (0.35 + reveal * 0.65);
    const intensity =
      (cfg.intensityBase +
        cfg.intensityRevealMul * reveal * clearance * k * pulse * coreLightScale) *
      cfg.intensityClearancePow(clearance);

    _sample.copy(_dir).multiplyScalar(exitDistance);

    candidates.push({
      origin: _sample.clone(),
      direction: _dir.clone(),
      clearance,
      weight,
      intensity,
    });
  }

  candidates.sort((a, b) => b.weight - a.weight);
  return candidates.slice(0, cfg.maxBeams);
}

export function computeCubeCoreVisualLevels(
  reveal: number,
  pulse: number,
  coreLightScale: number,
  escapeGain: number,
): CubeCoreVisualLevels {
  const em = R3F_CUBE_CORE_EMISSION;
  const beams = R3F_CUBE_INTERSTICE_BEAMS;

  const emissiveIntensity =
    (em.emissiveHold + em.emissiveBurstMul * reveal) * pulse * coreLightScale;

  const burst =
    em.pointHold +
    em.pointBurstPeak * Math.pow(reveal, em.pointBurstPower) * Math.max(escapeGain, reveal * 0.08);

  const corePointIntensity = burst * pulse * coreLightScale;

  const holdHalo = 0.22;
  const haloOpacity =
    (holdHalo + Math.pow(reveal, 1.35) * em.haloOpacityMul) * pulse * coreLightScale;

  const haloScale = em.haloScaleBase + em.haloScaleReveal * reveal;

  const godrayReveal = Math.min(
    (corePointIntensity / em.godrayIntensityDivisor) * (0.25 + escapeGain * 0.85),
    1,
  );

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
  timeline: number,
  reveal: number,
  time: number,
  coreLightScale: number,
): CubeCoreLightingFrame {
  const pulse = 0.97 + 0.03 * Math.sin(time * 1.6);
  const emitterHalf = (lattice.cell * 0.94) * 0.5;
  const instanceHulls = buildInstanceHulls(lattice, poses);
  const escapeGain = computeCoreEscapeGain(
    lattice,
    poses,
    instanceHulls,
    emitterHalf,
    reveal,
  );
  const beams = pickIntersticeBeams(
    lattice,
    poses,
    instanceHulls,
    emitterHalf,
    reveal,
    pulse,
    coreLightScale,
  );
  const levels = computeCubeCoreVisualLevels(reveal, pulse, coreLightScale, escapeGain);

  return { timeline, reveal, pulse, levels, beams };
}

/** Lumières d’appoint à l’interstice (le godray principal reste au centre). */
export function applyIntersticeBeamsToLights(
  beams: IntersticeBeamCandidate[],
  lights: THREE.PointLight[],
  glowColor: THREE.Color,
): void {
  const cfg = R3F_CUBE_INTERSTICE_BEAMS;

  for (let i = 0; i < lights.length; i++) {
    const light = lights[i];
    const beam = beams[i];
    if (!beam || beam.intensity <= 0.01) {
      light.intensity = 0;
      light.visible = false;
      continue;
    }
    light.visible = true;
    light.position.copy(beam.origin);
    light.intensity = beam.intensity * cfg.slitLightIntensityMul;
    light.distance = cfg.lightDistance;
    light.decay = cfg.lightDecay;
    light.color.copy(glowColor);
  }
}
