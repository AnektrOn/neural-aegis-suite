import type { CSSProperties } from "react";
import type { HeroBreakpointKey } from "./bioExecutiveHeroLabConfig";

/** Touch + typo + spacing for chrome outside the hero canvas (footer, bento, carousel). */
export type BioExecutiveShellPreset = {
  contentPaddingPx: number;
  carouselSlideWidthVw: number;
  carouselLabelPx: number;
  bentoMinHeightPx: number;
  bentoTitlePx: number;
  bentoBodyPx: number;
  bentoChipPx: number;
  footerBioNodeMinHeightPx: number;
  footerBioNodeFontPx: number;
  footerDetailPx: number;
  footerQuickLogMinHeightPx: number;
  footerQuickLogFontPx: number;
  /** Center session kicker + hide IA chip on immersive prod */
  prodMobileHeroChrome: boolean;
};

export const BIO_EXECUTIVE_SHELL_PRESETS: Record<HeroBreakpointKey, BioExecutiveShellPreset> = {
  desktop: {
    contentPaddingPx: 24,
    carouselSlideWidthVw: 82,
    carouselLabelPx: 10,
    bentoMinHeightPx: 160,
    bentoTitlePx: 11,
    bentoBodyPx: 14,
    bentoChipPx: 11,
    footerBioNodeMinHeightPx: 40,
    footerBioNodeFontPx: 12,
    footerDetailPx: 12,
    footerQuickLogMinHeightPx: 44,
    footerQuickLogFontPx: 11,
    prodMobileHeroChrome: false,
  },
  tabletLandscape: {
    contentPaddingPx: 20,
    carouselSlideWidthVw: 56,
    carouselLabelPx: 11,
    bentoMinHeightPx: 150,
    bentoTitlePx: 11,
    bentoBodyPx: 13,
    bentoChipPx: 11,
    footerBioNodeMinHeightPx: 44,
    footerBioNodeFontPx: 12,
    footerDetailPx: 12,
    footerQuickLogMinHeightPx: 44,
    footerQuickLogFontPx: 11,
    prodMobileHeroChrome: true,
  },
  tabletPortrait: {
    contentPaddingPx: 18,
    carouselSlideWidthVw: 78,
    carouselLabelPx: 11,
    bentoMinHeightPx: 140,
    bentoTitlePx: 11,
    bentoBodyPx: 13,
    bentoChipPx: 11,
    footerBioNodeMinHeightPx: 44,
    footerBioNodeFontPx: 12,
    footerDetailPx: 12,
    footerQuickLogMinHeightPx: 44,
    footerQuickLogFontPx: 11,
    prodMobileHeroChrome: true,
  },
  mobileLandscape: {
    contentPaddingPx: 14,
    carouselSlideWidthVw: 48,
    carouselLabelPx: 10,
    bentoMinHeightPx: 120,
    bentoTitlePx: 10,
    bentoBodyPx: 12,
    bentoChipPx: 10,
    footerBioNodeMinHeightPx: 44,
    footerBioNodeFontPx: 11,
    footerDetailPx: 11,
    footerQuickLogMinHeightPx: 44,
    footerQuickLogFontPx: 10,
    prodMobileHeroChrome: true,
  },
  mobilePortrait: {
    contentPaddingPx: 12,
    carouselSlideWidthVw: 86,
    carouselLabelPx: 11,
    bentoMinHeightPx: 130,
    bentoTitlePx: 11,
    bentoBodyPx: 12,
    bentoChipPx: 11,
    footerBioNodeMinHeightPx: 44,
    footerBioNodeFontPx: 12,
    footerDetailPx: 12,
    footerQuickLogMinHeightPx: 44,
    footerQuickLogFontPx: 11,
    prodMobileHeroChrome: true,
  },
};

const SHELL_VAR_KEYS = [
  "content-padding",
  "carousel-slide-vw",
  "carousel-label",
  "bento-min-h",
  "bento-title",
  "bento-body",
  "bento-chip",
  "footer-node-min-h",
  "footer-node-font",
  "footer-detail",
  "footer-quicklog-min-h",
  "footer-quicklog-font",
] as const;

export function shellPresetToStyle(preset: BioExecutiveShellPreset): CSSProperties {
  return {
    ["--bio-shell-content-padding" as string]: `${preset.contentPaddingPx}px`,
    ["--bio-shell-carousel-slide-vw" as string]: `${preset.carouselSlideWidthVw}vw`,
    ["--bio-shell-carousel-label" as string]: `${preset.carouselLabelPx}px`,
    ["--bio-shell-bento-min-h" as string]: `${preset.bentoMinHeightPx}px`,
    ["--bio-shell-bento-title" as string]: `${preset.bentoTitlePx}px`,
    ["--bio-shell-bento-body" as string]: `${preset.bentoBodyPx}px`,
    ["--bio-shell-bento-chip" as string]: `${preset.bentoChipPx}px`,
    ["--bio-shell-footer-node-min-h" as string]: `${preset.footerBioNodeMinHeightPx}px`,
    ["--bio-shell-footer-node-font" as string]: `${preset.footerBioNodeFontPx}px`,
    ["--bio-shell-footer-detail" as string]: `${preset.footerDetailPx}px`,
    ["--bio-shell-footer-quicklog-min-h" as string]: `${preset.footerQuickLogMinHeightPx}px`,
    ["--bio-shell-footer-quicklog-font" as string]: `${preset.footerQuickLogFontPx}px`,
  };
}

export function shellBreakpointClassName(key: HeroBreakpointKey): string {
  return `aegis-bio-exec-lab--bp-${key}`;
}

/** For devtools / tests */
export const BIO_EXECUTIVE_SHELL_VAR_KEYS = SHELL_VAR_KEYS;