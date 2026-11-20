import { useEffect, useRef } from "react";
import {
  DEFAULT_HERO_VISUAL_TUNING,
  QuantumNebulaHeroV3,
  type QuantumNebulaHeroVisualTuning,
  type QuantumNebulaHeroWordDrive,
} from "@/components/ui/quantum-nebula-hero-v3";
import type { QuantumNebulaWordConfig } from "@/components/ui/quantumNebulaWordMask";
import { useWelcomeNebulaViewportLayout } from "@/features/welcome/hooks/useWelcomeNebulaViewportLayout";

/** Welcome hero — viewport vortex (GenerativeArtSceneV3 HTML prototype). */
export const WELCOME_NEBULA_VISUAL_TUNING: Partial<QuantumNebulaHeroVisualTuning> = {
  particleCount: DEFAULT_HERO_VISUAL_TUNING.particleCount,
  particleSize: DEFAULT_HERO_VISUAL_TUNING.particleSize,
  sphereRadius: DEFAULT_HERO_VISUAL_TUNING.sphereRadius,
  pupilRadius: DEFAULT_HERO_VISUAL_TUNING.pupilRadius,
  cameraDistance: DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
};

export const WELCOME_NEBULA_WORD_STYLE: Omit<
  QuantumNebulaWordConfig,
  "offsetX" | "offsetY" | "text"
> = {
  font: "Cinzel",
  scale: 1.55,
  weight: 500,
  spacingEm: 0.5,
  italic: false,
  uppercase: true,
  outline: false,
};

/** Style + ancre droite (offsets recalculés au resize dans les composants). */
export function buildWelcomeNebulaWordConfig(
  text: string,
  anchor: { offsetX: number; offsetY: number },
): QuantumNebulaWordConfig {
  return { text, ...WELCOME_NEBULA_WORD_STYLE, ...anchor };
}

/** @deprecated Préférer `buildWelcomeNebulaWordConfig` — offsets figés. Conservé pour imports existants. */
export const WELCOME_NEBULA_WORD: QuantumNebulaWordConfig = {
  text: "AEGIS",
  ...WELCOME_NEBULA_WORD_STYLE,
  offsetX: 0,
  offsetY: 0,
};

const WELCOME_HUD_WORD: QuantumNebulaWordConfig = {
  text: "AEGIS",
  ...WELCOME_NEBULA_WORD_STYLE,
  offsetX: 0,
  offsetY: 0,
};

export function WelcomeQuantumNebula() {
  const { right } = useWelcomeNebulaViewportLayout();
  const wordDriveRef = useRef<QuantumNebulaHeroWordDrive>({
    text: "AEGIS",
    offsetX: right.offsetX,
    offsetY: right.offsetY,
    reveal: 1,
  });

  useEffect(() => {
    Object.assign(wordDriveRef.current, {
      text: "AEGIS",
      offsetX: right.offsetX,
      offsetY: right.offsetY,
      reveal: 1,
    });
  }, [right.offsetX, right.offsetY]);

  return (
    <QuantumNebulaHeroV3
      fullscreen
      theme="auto"
      state="repos"
      flowMode="vortex"
      visualTuning={WELCOME_NEBULA_VISUAL_TUNING}
      word={WELCOME_HUD_WORD}
      wordDriveRef={wordDriveRef}
      passBehindWord
      className="z-0"
    />
  );
}