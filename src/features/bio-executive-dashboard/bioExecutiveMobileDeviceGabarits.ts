import type { CSSProperties } from "react";
import type { BioExecutiveShellPreset } from "./bioExecutiveShellPresets";
import type { HeroBreakpointKey } from "./bioExecutiveHeroLabConfig";

/** Gabarits physiques mobile (portrait) — QA avant ship, distincts des 5 breakpoints layout hero. */
export type HeroMobileDeviceGabaritKey =
  | "compact"
  | "ios-standard"
  | "ios-modern"
  | "android-standard"
  | "phablet";

export type HeroMobileDeviceGabarit = {
  key: HeroMobileDeviceGabaritKey;
  label: string;
  widthPx: number;
  heightPx: number;
  usage: string;
  testFocus: string;
};

export const HERO_LAB_MOBILE_DEVICE_GABARIT_KEY = "aegis_bio_hero_mobile_device_gabarit_v1";

export const DEFAULT_MOBILE_DEVICE_GABARIT: HeroMobileDeviceGabaritKey = "ios-modern";

export const MOBILE_DEVICE_GABARITS: HeroMobileDeviceGabarit[] = [
  {
    key: "compact",
    label: "Mobile compact",
    widthPx: 320,
    heightPx: 568,
    usage: "Petits Android, anciens iPhone, reflow WCAG",
    testFocus: "Pas de débordement horizontal · grilles 1 colonne",
  },
  {
    key: "ios-standard",
    label: "iOS 375×812",
    widthPx: 375,
    heightPx: 812,
    usage: "iPhone SE / 8 / X classique",
    testFocus: "Lisibilité · tap targets · dock bas",
  },
  {
    key: "ios-modern",
    label: "iOS 390×844",
    widthPx: 390,
    heightPx: 844,
    usage: "iPhone 12–16 standard (défaut design)",
    testFocus: "Marges · cards · CTA sur écran haut",
  },
  {
    key: "android-standard",
    label: "Android 360×800",
    widthPx: 360,
    heightPx: 800,
    usage: "Base Android très répandue",
    testFocus: "Polices · densité · alignement Material",
  },
  {
    key: "phablet",
    label: "Phablet 414×896",
    widthPx: 414,
    heightPx: 896,
    usage: "iPhone Plus/Max, grands Android",
    testFocus: "Dashboard riche sans colonnes trop larges",
  },
];

const GABARIT_BY_KEY = Object.fromEntries(
  MOBILE_DEVICE_GABARITS.map((g) => [g.key, g]),
) as Record<HeroMobileDeviceGabaritKey, HeroMobileDeviceGabarit>;

export function getMobileDeviceGabarit(key: HeroMobileDeviceGabaritKey): HeroMobileDeviceGabarit {
  return GABARIT_BY_KEY[key] ?? GABARIT_BY_KEY[DEFAULT_MOBILE_DEVICE_GABARIT];
}

export function loadHeroLabMobileDeviceGabarit(): HeroMobileDeviceGabaritKey {
  try {
    const v = sessionStorage.getItem(HERO_LAB_MOBILE_DEVICE_GABARIT_KEY);
    if (v && v in GABARIT_BY_KEY) return v as HeroMobileDeviceGabaritKey;
  } catch {
    /* ignore */
  }
  return DEFAULT_MOBILE_DEVICE_GABARIT;
}

export function saveHeroLabMobileDeviceGabarit(key: HeroMobileDeviceGabaritKey) {
  try {
    sessionStorage.setItem(HERO_LAB_MOBILE_DEVICE_GABARIT_KEY, key);
  } catch {
    /* ignore */
  }
}

/** Associe la largeur CSS réelle à un gabarit (prod + auto lab en « Auto »). */
export function detectMobileDeviceGabaritKey(viewportWidthPx: number): HeroMobileDeviceGabaritKey {
  if (viewportWidthPx <= 320) return "compact";
  if (viewportWidthPx <= 359) return "android-standard";
  if (viewportWidthPx <= 375) return "ios-standard";
  /* 390–402 : iPhone 12–16 (393×852), Pro non-Max */
  if (viewportWidthPx <= 402) return "ios-modern";
  return "phablet";
}

export function heroMobileDeviceGabaritClassName(key: HeroMobileDeviceGabaritKey): string {
  return `aegis-bio-exec-lab--hero-device-${key}`;
}

export function mobileDeviceGabaritPreviewStyle(
  key: HeroMobileDeviceGabaritKey,
  orientation: "portrait" | "landscape",
): CSSProperties {
  const g = getMobileDeviceGabarit(key);
  const w = orientation === "landscape" ? g.heightPx : g.widthPx;
  const h = orientation === "landscape" ? g.widthPx : g.heightPx;
  return {
    ["--bio-hero-preview-max-width" as string]: `${w}px`,
    ["--bio-hero-preview-frame-height" as string]: `${h}px`,
  };
}

/** Overrides shell mobile (footer / carousel) selon gabarit physique. */
export type MobileDeviceShellPatch = Partial<BioExecutiveShellPreset>;

export const MOBILE_DEVICE_SHELL_PATCHES: Record<HeroMobileDeviceGabaritKey, MobileDeviceShellPatch> = {
  compact: {
    contentPaddingPx: 10,
    carouselSlideWidthVw: 94,
    carouselLabelPx: 10,
    bentoMinHeightPx: 118,
    bentoTitlePx: 10,
    bentoBodyPx: 11,
    bentoChipPx: 10,
    footerBioNodeFontPx: 11,
    footerDetailPx: 11,
    footerQuickLogFontPx: 10,
  },
  "ios-standard": {
    contentPaddingPx: 12,
    carouselSlideWidthVw: 88,
  },
  "ios-modern": {},
  "android-standard": {
    contentPaddingPx: 11,
    carouselSlideWidthVw: 90,
    footerDetailPx: 11,
  },
  phablet: {
    contentPaddingPx: 14,
    carouselSlideWidthVw: 84,
    bentoBodyPx: 13,
  },
};

export function resolveMobileShellPreset(
  layoutBreakpoint: HeroBreakpointKey,
  base: BioExecutiveShellPreset,
  viewportWidthPx: number,
): BioExecutiveShellPreset {
  if (layoutBreakpoint !== "mobilePortrait" && layoutBreakpoint !== "mobileLandscape") {
    return base;
  }
  const deviceKey = detectMobileDeviceGabaritKey(viewportWidthPx);
  const patch = MOBILE_DEVICE_SHELL_PATCHES[deviceKey];
  return { ...base, ...patch };
}

export function isMobileLayoutBreakpoint(key: HeroBreakpointKey): boolean {
  return key === "mobilePortrait" || key === "mobileLandscape";
}