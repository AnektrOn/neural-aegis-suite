import * as THREE from "three";
import { hslToken, readPrismStagePalette } from "./prismLandingTheme";

export type PrismStageLightingVariant = "hero" | "scroll";

export type PrismStageLightColors = {
  key: THREE.Color;
  fill: THREE.Color;
  rim: THREE.Color;
  accent: THREE.Color;
  hemisphereSky: THREE.Color;
  hemisphereGround: THREE.Color;
  glow: string;
};

export type PrismStageLightLevels = {
  environmentIntensity: number;
  hemisphere: number;
  key: number;
  fill: number;
  rim: number;
  accentPoint: number;
  topFill: number;
};

const LEVELS: Record<PrismStageLightingVariant, PrismStageLightLevels> = {
  hero: {
    environmentIntensity: 0.95,
    hemisphere: 0.28,
    key: 1.65,
    fill: 0.62,
    rim: 0.88,
    accentPoint: 0.42,
    topFill: 0.28,
  },
  scroll: {
    environmentIntensity: 0.72,
    hemisphere: 0.22,
    key: 1.45,
    fill: 0.5,
    rim: 0.7,
    accentPoint: 0.32,
    topFill: 0.22,
  },
};

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

export function readPrismStageLightColors(): PrismStageLightColors {
  const palette = readPrismStagePalette();
  const dark = isDarkTheme();
  const primary = hslToken("--primary", "24 48% 65%");
  const foreground = hslToken("--foreground", "24 48% 95%");
  const card = hslToken("--card", "201 28% 12%");
  const heroBg = hslToken("--aegis-hero-bg", "222 26% 5%");

  return {
    key: dark
      ? new THREE.Color("#fff4ea")
      : foreground.clone().lerp(new THREE.Color("#ffffff"), 0.35),
    fill: dark
      ? new THREE.Color("#a8b8e8")
      : new THREE.Color("#8fa6d8"),
    rim: primary.clone(),
    accent: primary.clone(),
    hemisphereSky: foreground.clone().lerp(new THREE.Color("#ffffff"), dark ? 0.08 : 0.25),
    hemisphereGround: dark
      ? heroBg.clone().multiplyScalar(0.85)
      : card.clone().lerp(heroBg, 0.4),
    glow: palette.glow,
  };
}

export function prismStageLightLevels(
  variant: PrismStageLightingVariant,
): PrismStageLightLevels {
  const base = LEVELS[variant];
  const dark = isDarkTheme();
  const exposure = dark ? 1 : 1.08;
  return {
    ...base,
    key: base.key * exposure,
    fill: base.fill * exposure,
    rim: base.rim * exposure,
    environmentIntensity: base.environmentIntensity * (dark ? 1 : 1.05),
  };
}

export function prismStageToneMappingExposure(): number {
  return isDarkTheme() ? 1.02 : 1.1;
}
