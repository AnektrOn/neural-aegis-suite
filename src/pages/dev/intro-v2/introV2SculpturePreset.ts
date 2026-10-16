import type { SculptureColorGrade } from "@/components/ui/liquid-sculpture-hero";

/** Tuned in LiquidSculptureDevPage — exported JSON applied to intro ch.2. */
export const INTRO_V2_SCULPTURE_HOLD_SEC = 28;

export type IntroV2SculptureHeroPreset = {
  strength: number;
  radius: number;
  particleDensity: number;
  dotSize: number;
  particleSpread: number;
  turbulence: number;
  liquid: number;
  returnSpeed: number;
  holdUnifyExponent: number;
  ambientIntensity: number;
  speed: number;
  vortexIntensity: number;
  intro: boolean;
  ambient: boolean;
  streaks: boolean;
  interactive: boolean;
  stabilizeOnHold: boolean;
  sculptureScale: number;
  mobileSculptureScale: number;
  sculptureX: number;
  sculptureY: number;
  colorGrade: SculptureColorGrade;
  colorGradeStrength: number;
};

export const INTRO_V2_SCULPTURE_HERO: IntroV2SculptureHeroPreset = {
  strength: 1.9,
  radius: 240,
  particleDensity: 0.65,
  dotSize: 0.45,
  particleSpread: 1.45,
  turbulence: 1.2,
  liquid: 1.15,
  returnSpeed: 1.55,
  holdUnifyExponent: 2.35,
  ambientIntensity: 0.45,
  speed: 1.05,
  vortexIntensity: 1.65,
  intro: false,
  ambient: true,
  streaks: true,
  interactive: true,
  stabilizeOnHold: true,
  sculptureScale: 1.2,
  mobileSculptureScale: 1.06,
  sculptureX: 0,
  sculptureY: 0,
  colorGrade: "none",
  colorGradeStrength: 1,
};
