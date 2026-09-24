import type { ToolboxV3Drive } from "./pilots/ToolboxParticleEngine";
import type { BreathPhase } from "./toolboxNebulaSync";
import { engineIdForSlug } from "./toolboxNebulaVisuals";

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/** Precise lung envelopes — two lobes stay readable. */
export function driveForBreathwork(
  phase: BreathPhase,
  progress: number,
  isRunning: boolean,
  _elapsedSec: number,
): ToolboxV3Drive {
  if (!isRunning) {
    return {
      shape: "lungs",
      cloudScale: 0.86,
      coherence: 0.94,
      noiseForce: 0.08,
      noiseSpeed: 0.28,
      mouseRepulsion: 0.35,
      bloomStrength: 0.16,
      freeze: 0.08,
    };
  }

  const t = easeInOut(clamp01(progress));

  switch (phase) {
    case "breath_in":
      return {
        shape: "lungs",
        cloudScale: 0.78 + t * 0.28,
        coherence: 0.93,
        noiseForce: 0.06 + t * 0.08,
        noiseSpeed: 0.32,
        freeze: 0,
        mouseRepulsion: 0.3,
        bloomStrength: 0.14 + t * 0.04,
      };
    case "pause1":
      return {
        shape: "lungs",
        cloudScale: 1.06,
        coherence: 0.97,
        noiseForce: 0.04,
        freeze: 0.55,
        bloomStrength: 0.18,
      };
    case "breath_out":
      return {
        shape: "lungs",
        cloudScale: 1.06 - t * 0.28,
        coherence: 0.93,
        noiseForce: 0.1,
        freeze: 0,
        bloomStrength: 0.16,
      };
    case "pause2":
      return {
        shape: "lungs",
        cloudScale: 0.78,
        coherence: 0.95,
        noiseForce: 0.05,
        freeze: 0.35,
        bloomStrength: 0.14,
      };
    default:
      return { shape: "lungs", cloudScale: 0.9, coherence: 0.93 };
  }
}

export function driveForStopStep(
  stepIndex: number,
  _progress: number,
  isActive: boolean,
  _elapsedSec: number,
): ToolboxV3Drive {
  if (!isActive || stepIndex < 0) {
    return {
      shape: "vortex",
      cloudScale: 1,
      coherence: 0.22,
      noiseForce: 1.7,
      noiseSpeed: 1.7,
      mouseRepulsion: 1.15,
      radialPush: 0.28,
      freeze: 0,
      bloomStrength: 0.62,
    };
  }

  switch (stepIndex) {
    case 0:
      return {
        shape: "vortex",
        cloudScale: 1.04,
        coherence: 0.05,
        noiseForce: 2.85,
        noiseSpeed: 2.6,
        mouseRepulsion: 1.7,
        radialPush: 0.55,
        freeze: 0,
        bloomStrength: 0.82,
      };
    case 1:
      return {
        shape: "column",
        cloudScale: 1,
        coherence: 0.62,
        noiseForce: 0.7,
        noiseSpeed: 0.85,
        freeze: 0,
        mouseRepulsion: 0.7,
        bloomStrength: 0.5,
      };
    case 2:
      return {
        shape: "rings",
        cloudScale: 1,
        coherence: 0.96,
        noiseForce: 0.02,
        noiseSpeed: 0.04,
        freeze: 0.97,
        mouseRepulsion: 0.04,
        bloomStrength: 0.32,
      };
  }

  return {
    shape: "stream",
    cloudScale: 1,
    coherence: 0.7,
    noiseForce: 0.55,
    noiseSpeed: 0.8,
    radialPush: 0.18,
    freeze: 0,
    bloomStrength: 0.58,
  };
}

/** Visualisation « Grounding » / retour — disque calme, peu de bruit. */
function driveForGroundingField(progress: number, isRunning: boolean): ToolboxV3Drive {
  const breath = isRunning ? 0.96 + Math.sin(progress * Math.PI) * 0.03 : 0.94;
  return {
    shape: "ground",
    cloudScale: breath,
    coherence: 0.97,
    noiseForce: 0.04,
    noiseSpeed: 0.12,
    freeze: 0.45,
    mouseRepulsion: 0.06,
    bloomStrength: 0.28,
    tiltX: 58,
  };
}

export function driveForVisualizationScene(
  sceneId: string,
  progress: number,
  isRunning: boolean,
  _elapsedSec: number,
): ToolboxV3Drive {
  if (!isRunning) {
    return driveForGroundingField(0, false);
  }

  switch (sceneId) {
    case "anchor":
      return driveForGroundingField(progress, true);
    case "place":
      return {
        shape: "dome",
        cloudScale: 1,
        coherence: 0.82,
        noiseForce: 0.28,
        noiseSpeed: 0.45,
        mouseRepulsion: 0.55,
        bloomStrength: 0.5,
      };
    case "scene":
      return {
        shape: "tunnel",
        cloudScale: 1,
        coherence: 0.7,
        noiseForce: 0.55,
        noiseSpeed: 0.75,
        bloomStrength: 0.58,
      };
    case "success":
      return {
        shape: "rings",
        cloudScale: 1.04,
        coherence: 0.85,
        noiseForce: 0.22,
        bloomStrength: 0.72,
      };
    case "return":
      return driveForGroundingField(progress, true);
    default:
      return driveForGroundingField(progress, true);
  }
}

/** Scan : volume + attracteur tête → pieds. */
export function driveForParticleScan(elapsedSec: number, isRunning: boolean): ToolboxV3Drive {
  const cycle = elapsedSec * 0.12 % 1;
  const attractorY = 0.72 - cycle * 1.5;
  return {
    shape: "body",
    cloudScale: 1,
    coherence: 0.9,
    noiseForce: isRunning ? 0.18 : 0.08,
    noiseSpeed: 0.35,
    attractorY,
    attractorStrength: isRunning ? 0.85 : 0.15,
    freeze: 0,
    bloomStrength: 0.48,
    mouseRepulsion: 0.2,
  };
}

export function driveForParticleMove(elapsedSec: number, isRunning: boolean): ToolboxV3Drive {
  const burst = Math.sin(elapsedSec * 2.4) > 0.35;
  if (!isRunning) {
    return { shape: "body", cloudScale: 1, coherence: 0.88, noiseForce: 0.12, freeze: 0.2 };
  }
  return {
    shape: "body",
    cloudScale: 1,
    coherence: burst ? 0.55 : 0.86,
    noiseForce: burst ? 1.45 : 0.22,
    noiseSpeed: burst ? 1.6 : 0.35,
    freeze: 0,
    radialPush: 0,
    bloomStrength: burst ? 0.62 : 0.42,
  };
}

export function driveForParticleEngine(
  slug: string,
  elapsedSec: number,
  isRunning = true,
): ToolboxV3Drive {
  if (/ground|ancrage/i.test(slug)) {
    const t = isRunning ? 0.5 + 0.5 * Math.sin(elapsedSec * 0.35) : 0;
    return driveForGroundingField(t, isRunning);
  }

  const engine = engineIdForSlug(slug) ?? slug;
  const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 2.1);
  switch (engine) {
    case "scan":
      return driveForParticleScan(elapsedSec, isRunning);
    case "move":
      return driveForParticleMove(elapsedSec, isRunning);
    case "interrupt":
      return driveForStopStep(-1, 0, false, elapsedSec);
    case "visualize":
      return {
        shape: "lotus",
        cloudScale: 1,
        coherence: 0.86,
        noiseForce: 0.2,
        freeze: 0.1,
        bloomStrength: 0.48,
      };
    case "attend":
      return {
        shape: "lotus",
        cloudScale: 1,
        coherence: 0.94,
        noiseForce: 0.08,
        freeze: 0.35,
        mouseRepulsion: 0.9,
        bloomStrength: 0.4,
      };
    case "stream":
      return {
        shape: "column",
        cloudScale: 0.92,
        coherence: 0.88,
        noiseForce: 0.12,
        freeze: 0.2,
        bloomStrength: 0.32,
      };
    case "savor":
      return {
        shape: "dome",
        cloudScale: 1.02,
        coherence: 0.86,
        noiseForce: 0.16,
        bloomStrength: 0.55,
      };
    case "affirm":
      return {
        shape: "rings",
        cloudScale: 0.96 + pulse * 0.08,
        coherence: 0.9,
        noiseForce: 0.12,
        bloomStrength: 0.52,
      };
    case "intend":
      return {
        shape: "torus",
        cloudScale: Math.min(1.06, 0.9 + elapsedSec * 0.04),
        coherence: 0.9,
        noiseForce: 0.1,
        freeze: elapsedSec > 4 ? 0.4 : 0.05,
        bloomStrength: 0.48,
      };
    case "sequence":
      return {
        shape: "rings",
        cloudScale: 1,
        coherence: 0.88,
        noiseForce: 0.14 + (Math.sin(elapsedSec * 1.4) > 0.92 ? 0.3 : 0),
        bloomStrength: 0.45,
      };
    case "reframe": {
      const storm = (Math.sin(elapsedSec * 0.4) + 1) * 0.5;
      return {
        shape: storm > 0.45 ? "vortex" : "rings",
        cloudScale: 1,
        coherence: storm > 0.45 ? 0.2 : 0.9,
        noiseForce: storm > 0.45 ? 1.8 : 0.12,
        freeze: storm < 0.25 ? 0.55 : 0,
        bloomStrength: 0.5,
      };
    }
    case "weigh":
      return { shape: "torus", cloudScale: 1, coherence: 0.86, noiseForce: 0.2, bloomStrength: 0.46 };
    case "voices":
      return {
        shape: Math.sin(elapsedSec * 0.55) > 0 ? "column" : "rings",
        cloudScale: 1,
        coherence: 0.84,
        noiseForce: 0.22,
      };
    case "bridge":
      return { shape: "tunnel", cloudScale: 1, coherence: 0.86, noiseForce: 0.16, bloomStrength: 0.5 };
    case "edge":
      return { shape: "dome", cloudScale: 1, coherence: 0.92, noiseForce: 0.08, freeze: 0.4 };
    case "gauge":
      return {
        shape: "body",
        cloudScale: 0.85 + pulse * 0.2,
        coherence: 0.86,
        noiseForce: 0.15 + pulse * 0.25,
      };
    case "ledger":
      return { shape: "column", cloudScale: 1, coherence: 0.88, noiseForce: 0.14 };
    case "link":
      return { shape: "sphere", cloudScale: 0.85, coherence: 0.9, noiseForce: 0.08, freeze: 0.5 };
    default:
      return { shape: "sphere", cloudScale: 1, coherence: 0.75, noiseForce: 0.4 };
  }
}
