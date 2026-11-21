import {
  DEFAULT_HERO_VISUAL_TUNING,
  type QuantumNebulaHeroVisualTuning,
} from "@/components/ui/quantum-nebula-hero-v3";
import type { QuantumNebulaWordConfig } from "@/components/ui/quantumNebulaWordMask";
import { WELCOME_NEBULA_WORD_SCALE_DESKTOP } from "./welcomeNebulaWordLayout";

/** Tuning Hero V3 — landing publique uniquement (`WelcomeLandingNebula`). */
export const LANDING_NEBULA_VISUAL_TUNING: Partial<QuantumNebulaHeroVisualTuning> = {
  particleCount: DEFAULT_HERO_VISUAL_TUNING.particleCount,
  particleSize: DEFAULT_HERO_VISUAL_TUNING.particleSize,
  sphereRadius: DEFAULT_HERO_VISUAL_TUNING.sphereRadius,
  pupilRadius: DEFAULT_HERO_VISUAL_TUNING.pupilRadius,
  cameraDistance: DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
};

export const LANDING_NEBULA_WORD_STYLE: Omit<
  QuantumNebulaWordConfig,
  "offsetX" | "offsetY" | "text"
> = {
  font: "Cinzel",
  scale: WELCOME_NEBULA_WORD_SCALE_DESKTOP,
  weight: 500,
  spacingEm: 0.5,
  italic: false,
  uppercase: true,
  outline: false,
};

export const LANDING_NEBULA_WORD: QuantumNebulaWordConfig = {
  text: "AEGIS",
  ...LANDING_NEBULA_WORD_STYLE,
  offsetX: 0,
  offsetY: 0,
};