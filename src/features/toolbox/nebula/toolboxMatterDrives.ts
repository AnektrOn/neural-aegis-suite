import type { ToolboxMatterDrive } from "./pilots/ToolboxMatterEngine";
import type { BreathPhase } from "./toolboxNebulaSync";
import type { MicroHeroPreset } from "@/lib/toolbox-slug-themes";
import { engineIdForSlug } from "./toolboxNebulaVisuals";

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/** Poumon — matière qui gonfle / gèle / dégonfle. */
export function driveForMatterBreath(
  phase: BreathPhase,
  progress: number,
  isRunning: boolean,
): ToolboxMatterDrive {
  if (!isRunning) {
    return {
      meshScale: 0.5,
      displace: 0.07,
      freeze: 0.15,
      fresnel: 0.55,
      timeScale: 0.2,
      rotation: 0.35,
      hue: 175,
      opacity: 0.9,
    };
  }

  const t = easeInOut(clamp01(progress));

  switch (phase) {
    case "breath_in":
      return {
        meshScale: 0.42 + t * 0.3,
        displace: 0.05 + t * 0.1,
        freeze: 0,
        fresnel: 0.4 + t * 0.2,
        timeScale: 0.35,
        rotation: 0.45,
        hue: 175,
        noiseScale: 1.9,
        opacity: 0.92,
      };
    case "pause1":
      return {
        meshScale: 0.72,
        displace: 0.03,
        freeze: 0.92,
        fresnel: 1.05,
        timeScale: 0.05,
        rotation: 0.05,
        hue: 168,
        noiseScale: 1.4,
        opacity: 0.95,
      };
    case "breath_out":
      return {
        meshScale: 0.72 - t * 0.3,
        displace: 0.14 - t * 0.1,
        freeze: 0,
        fresnel: 0.55,
        timeScale: 0.28,
        rotation: 0.4,
        hue: 185,
        opacity: 0.9,
      };
    case "pause2":
      return {
        meshScale: 0.42,
        displace: 0.03,
        freeze: 0.65,
        fresnel: 0.7,
        timeScale: 0.08,
        rotation: 0.12,
        hue: 190,
        opacity: 0.85,
      };
    default:
      return { meshScale: 1, freeze: 0 };
  }
}

/** Body scan — matière organique qui se stabilise zone par zone (sans silhouette). */
export function driveForMatterBodyScan(
  zoneIndex: number,
  zoneCount: number,
  phaseProgress: number,
  isRunning: boolean,
  elapsedSec: number,
): ToolboxMatterDrive {
  if (!isRunning) {
    return {
      meshScale: 0.88,
      displace: 0.05,
      freeze: 0.28,
      fresnel: 0.62,
      timeScale: 0.1,
      rotation: 0.12,
      hue: 172,
      opacity: 0.88,
    };
  }

  const zoneNorm = zoneCount > 1 ? zoneIndex / (zoneCount - 1) : 0;
  const t = easeInOut(clamp01(phaseProgress));
  const settle = t > 0.65 ? (t - 0.65) / 0.35 : 0;
  const awaken = t < 0.2 ? 1 - t / 0.2 : 0;
  const breath = 0.5 + 0.5 * Math.sin(elapsedSec * 0.55 + zoneIndex * 0.4);

  return {
    meshScale: 0.94 - zoneNorm * 0.14 + breath * 0.03,
    displace: 0.07 + awaken * 0.08 + (1 - settle) * 0.05 - zoneNorm * 0.02,
    freeze: settle * 0.62 + zoneNorm * 0.1,
    fresnel: 0.48 + (1 - zoneNorm) * 0.38 + settle * 0.28,
    timeScale: 0.24 - zoneNorm * 0.1 - settle * 0.08,
    rotation: 0.38 - zoneNorm * 0.22 - settle * 0.12,
    hue: 178 - zoneNorm * 24 + Math.sin(elapsedSec * 0.9 + zoneIndex) * 4,
    noiseScale: 1.55 + awaken * 0.35 + (1 - settle) * 0.25,
    opacity: 0.9,
  };
}

/** Movement / micro-practice — même langage matter, gestuelle par hero slug. */
export function driveForMatterMovement(
  hero: MicroHeroPreset,
  isRunning: boolean,
  elapsedSec: number,
  sessionProgress: number,
): ToolboxMatterDrive {
  if (!isRunning) {
    return {
      meshScale: 0.88,
      displace: 0.05,
      freeze: 0.28,
      fresnel: 0.62,
      timeScale: 0.1,
      rotation: 0.12,
      hue: 172,
      opacity: 0.88,
    };
  }

  const beat = 0.5 + 0.5 * Math.sin(elapsedSec * 2.4);
  const surge = 0.5 + 0.5 * Math.sin(elapsedSec * 1.1);
  const progress = clamp01(sessionProgress);

  switch (hero) {
    case "shake":
      return {
        meshScale: 0.95 + beat * 0.1,
        displace: 0.16 + beat * 0.14,
        freeze: 0,
        fresnel: 0.5 + beat * 0.28,
        timeScale: 0.42,
        rotation: 0.8 + beat * 0.45,
        hue: 358 + beat * 8,
        noiseScale: 2.35,
        opacity: 0.92,
      };
    case "flame":
      return {
        meshScale: 0.92 + surge * 0.14,
        displace: 0.1 + surge * 0.08,
        freeze: 0.05,
        fresnel: 0.55 + surge * 0.35,
        timeScale: 0.32,
        rotation: 0.4,
        hue: 42 + surge * 12,
        opacity: 0.92,
      };
    case "steps":
      return {
        meshScale: 0.9 + beat * 0.06,
        displace: 0.08,
        freeze: beat > 0.85 ? 0.32 : 0.08,
        fresnel: 0.52,
        timeScale: 0.2,
        rotation: 0.28,
        hue: 160 + progress * 18,
        opacity: 0.9,
      };
    case "orbit":
      return {
        meshScale: 0.94,
        displace: 0.06,
        freeze: 0.15,
        fresnel: 0.65 + beat * 0.15,
        timeScale: 0.14,
        rotation: 0.55,
        hue: 200 + beat * 10,
        noiseScale: 1.8,
        opacity: 0.9,
      };
    case "pulse":
    default:
      return {
        meshScale: 0.9 + beat * 0.1,
        displace: 0.09 + beat * 0.06,
        freeze: 0.08,
        fresnel: 0.48 + beat * 0.2,
        timeScale: 0.28,
        rotation: 0.35,
        hue: 35 + beat * 8,
        opacity: 0.9,
      };
  }
}

export function driveForMatterEngine(slug: string, elapsedSec: number): ToolboxMatterDrive {
  const engine = engineIdForSlug(slug) ?? slug;
  const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 0.35);
  const beat = 0.5 + 0.5 * Math.sin(elapsedSec * 2.2);

  switch (engine) {
    case "attend":
      return {
        displace: 0.035,
        noiseScale: 1.45,
        fresnel: 0.88,
        timeScale: 0.12,
        meshScale: 1.08,
        opacity: 0.92,
        hue: 270,
        rotation: 0.18,
        freeze: 0.35,
      };
    case "intend":
      return {
        displace: 0.08,
        freeze: elapsedSec > 4 ? 0.55 : 0.1,
        meshScale: Math.min(1.18, 0.92 + elapsedSec * 0.06),
        fresnel: 0.5,
        timeScale: 0.18,
        hue: 42,
        rotation: 0.25,
      };
    case "affirm":
      return {
        meshScale: 0.96 + beat * 0.12,
        displace: 0.05,
        freeze: 0,
        fresnel: 0.45 + beat * 0.25,
        timeScale: 0.4,
        hue: 48,
        rotation: 0.4,
      };
    case "savor":
      return {
        meshScale: 1.05 + pulse * 0.04,
        displace: 0.06,
        fresnel: 0.55 + pulse * 0.2,
        hue: 38,
        freeze: 0.2,
        timeScale: 0.2,
        rotation: 0.3,
      };
    case "stream":
      return {
        meshScale: 1.02,
        displace: 0.045,
        opacity: 0.42,
        freeze: 0.25,
        timeScale: 0.1,
        fresnel: 0.4,
        hue: 220,
        rotation: 0.2,
      };
    case "sequence":
      return {
        meshScale: 1.05,
        displace: 0.05 + (Math.sin(elapsedSec * 1.4) > 0.92 ? 0.08 : 0),
        freeze: 0.2,
        fresnel: 0.5,
        hue: 265,
        rotation: 0.3,
        timeScale: 0.22,
      };
    case "reframe": {
      const storm = (Math.sin(elapsedSec * 0.4) + 1) * 0.5;
      return {
        meshScale: 1.05 + storm * 0.1,
        displace: 0.06 + storm * 0.2,
        freeze: storm < 0.25 ? 0.7 : 0.05,
        hue: 200 + storm * 80,
        timeScale: 0.15 + storm * 0.35,
        fresnel: 0.45,
        rotation: 0.4 + storm,
      };
    }
    case "weigh":
      return {
        meshScale: 1.08 + Math.sin(elapsedSec * 0.8) * 0.06,
        displace: 0.07,
        freeze: 0.15,
        hue: 35,
        fresnel: 0.5,
        rotation: 0.5,
      };
    case "voices":
      return {
        meshScale: 1.1,
        displace: 0.09,
        hue: Math.sin(elapsedSec * 0.55) > 0 ? 220 : 285,
        freeze: 0.1,
        fresnel: 0.55,
        rotation: 0.45,
        timeScale: 0.28,
      };
    case "bridge":
      return {
        meshScale: 1.12,
        displace: 0.05,
        fresnel: 0.55 + pulse * 0.45,
        freeze: 0.2,
        hue: 176,
        rotation: 0.3,
      };
    case "edge":
      return {
        meshScale: 1.22,
        displace: 0.03,
        freeze: 0.55,
        fresnel: 1.2,
        timeScale: 0.08,
        rotation: 0.12,
        hue: 210,
        opacity: 0.96,
      };
    case "gauge":
      return {
        meshScale: 0.75 + pulse * 0.5,
        displace: 0.04 + pulse * 0.18,
        freeze: 0.1,
        hue: 260 + pulse * 30,
        fresnel: 0.45 + pulse * 0.4,
        rotation: 0.3,
      };
    case "ledger":
      return {
        meshScale: 1.08,
        displace: 0.07,
        hue: pulse > 0.5 ? 42 : 210,
        freeze: 0.2,
        fresnel: 0.5,
        rotation: 0.35,
      };
    case "link":
      return {
        meshScale: 0.95,
        displace: 0.035,
        freeze: 0.6,
        rotation: 0.12,
        timeScale: 0.08,
        opacity: 0.5,
        hue: 200,
        fresnel: 0.4,
      };
    case "scan": {
      const wave = 0.5 + 0.5 * Math.sin(elapsedSec * 0.45);
      return {
        meshScale: 0.9 + wave * 0.06,
        displace: 0.06 + wave * 0.04,
        freeze: 0.12 + wave * 0.3,
        fresnel: 0.52 + wave * 0.28,
        timeScale: 0.16,
        hue: 172 + wave * 12,
        rotation: 0.22,
        opacity: 0.9,
      };
    }
    default:
      return {
        displace: 0.12,
        noiseScale: 2,
        fresnel: 0.5,
        timeScale: 0.25,
        meshScale: 1.1,
        hue: 200,
        freeze: 0.1,
      };
  }
}
