import type { CSSProperties } from "react";
import heroLabMobilePresets from "./bioExecutiveHeroLabMobilePresets.json";

export const HERO_LAB_STORAGE_KEY = "aegis_bio_hero_lab_config_v3";
export const HERO_LAB_EDITOR_OPEN_KEY = "aegis_bio_hero_lab_editor_open_v1";
export const HERO_LAB_VIEWPORT_DISPLAY_KEY = "aegis_bio_hero_lab_viewport_display_v1";

/** Canvas layout preview while Hero Builder is open (independent of browser width). */
export type HeroLabViewportDisplay = "auto" | "mobile" | "tablet" | "desktop";

export type HeroLabPreviewChrome = "mobile" | "tablet" | "desktop";

/** Device frame used in Hero Builder (WYSIWYG). */
export type HeroLabPreviewFrameKey = HeroBreakpointKey | "desktop";

const HERO_PREVIEW_FRAME_SLUG: Record<HeroLabPreviewFrameKey, string> = {
  desktop: "desktop",
  tabletLandscape: "tablet-landscape",
  tabletPortrait: "tablet-portrait",
  mobilePortrait: "mobile-portrait",
  mobileLandscape: "mobile-landscape",
};

export type HeroBreakpointKey =
  | "desktop"
  | "tabletLandscape"
  | "tabletPortrait"
  | "mobilePortrait"
  | "mobileLandscape";

export const HERO_BREAKPOINT_LABELS: Record<HeroBreakpointKey, string> = {
  desktop: "Desktop",
  tabletLandscape: "Tablette paysage",
  tabletPortrait: "Tablette portrait",
  mobilePortrait: "Mobile portrait",
  mobileLandscape: "Mobile paysage",
};

export const HERO_BREAKPOINT_ORDER: HeroBreakpointKey[] = [
  "desktop",
  "tabletLandscape",
  "tabletPortrait",
  "mobilePortrait",
  "mobileLandscape",
];

export type HeroElementId =
  | "sessionLabel"
  | "nodeTitle"
  | "pageTitle"
  | "nodeBrain"
  | "nodeHeart"
  | "nodeSolar"
  | "sideRail"
  | "sleepStats"
  | "cognitionMood"
  | "metricCallout";

export const HERO_ELEMENT_LABELS: Record<HeroElementId, string> = {
  sessionLabel: "Session · Alignement",
  nodeTitle: "Cohérence & Stress",
  pageTitle: "État & Résonance",
  nodeBrain: "Hotspot · Cognition",
  nodeHeart: "Hotspot · Cohérence",
  nodeSolar: "Hotspot · Énergie",
  sideRail: "Rail icônes",
  sleepStats: "Bloc sommeil",
  cognitionMood: "Cognition / humeur",
  metricCallout: "Métrique active",
};

export const HERO_LAB_ELEMENT_GROUPS: { label: string; targets: Array<"silhouette" | "overlay" | HeroElementId> }[] = [
  { label: "Structure", targets: ["silhouette", "overlay"] },
  { label: "Titres", targets: ["sessionLabel", "nodeTitle"] },
  { label: "Hotspots", targets: ["nodeBrain", "nodeHeart", "nodeSolar"] },
  { label: "Panache", targets: ["sideRail", "sleepStats", "metricCallout"] },
];

export const HERO_CANVAS_ELEMENT_IDS: HeroElementId[] = ["sessionLabel", "nodeTitle"];

export const HERO_TEXT_ELEMENT_IDS: HeroElementId[] = ["sessionLabel", "nodeTitle", "sleepStats", "metricCallout"];

export const HERO_HOTSPOT_ELEMENT_IDS: HeroElementId[] = ["nodeBrain", "nodeHeart", "nodeSolar"];

/** Retirés de l'UI produit — conservés dans le schéma JSON pour compat. */
export const HERO_DEPRECATED_ELEMENT_IDS: HeroElementId[] = ["pageTitle", "cognitionMood"];

export type HeroTextAlign = "left" | "center" | "right";

export type HeroElementAnchor = "center" | "centerLeft" | "topLeft" | "bottomLeft" | "topRight" | "bottomRight";

export type HeroFontPreset =
  | "inherit"
  | "barlow"
  | "grotesk"
  | "cormorant"
  | "cinzel"
  | "quattrocento"
  | "mono"
  | "system";

/** Polices chargées dans l'app (index.html Google Fonts + tokens Tailwind). */
export const HERO_FONT_PRESETS: { value: HeroFontPreset; label: string }[] = [
  { value: "inherit", label: "Barlow (défaut app)" },
  { value: "barlow", label: "Barlow" },
  { value: "grotesk", label: "Barlow / Grotesk" },
  { value: "cormorant", label: "Cormorant Garamond" },
  { value: "cinzel", label: "Cinzel" },
  { value: "quattrocento", label: "Quattrocento" },
  { value: "mono", label: "DM Mono" },
  { value: "system", label: "System UI" },
];

export type HeroElementTypography = {
  fontPreset: HeroFontPreset;
  /** 0 = laisser les classes responsive du composant */
  fontSizePx: number;
  fontWeight: 300 | 400 | 500 | 600 | 700;
  lineHeight: number;
  letterSpacingEm: number;
  opacityPct: number;
  uppercase: boolean;
  italic: boolean;
  hidden: boolean;
  maxWidthPct: number;
};

export type HeroOverlayBlurMode = "uniform" | "gradual";

export type HeroGradualBlurDirection = "bottom" | "top" | "left" | "right";

export type HeroOverlayTint = "frame" | "dark" | "light" | "none";

export type HeroSilhouetteOverlay = {
  enabled: boolean;
  /** Pleine largeur du panneau hero (compense le padding colonne). */
  columnFullWidth: boolean;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  blurMode: HeroOverlayBlurMode;
  blurMinPx: number;
  blurMaxPx: number;
  opacityMinPct: number;
  opacityMaxPct: number;
  gradualDirection: HeroGradualBlurDirection;
  /** 4–16 strips for progressive blur quality */
  gradualLayers: number;
  tint: HeroOverlayTint;
  radiusRem: number;
};

export type HeroSilhouetteLayout = {
  widthPct: number;
  leftPct: number;
  bottomPct: number;
};

export type HeroElementLayout = {
  leftPct?: number;
  rightPct?: number;
  topPct?: number;
  bottomPct?: number;
  anchor: HeroElementAnchor;
  textAlign: HeroTextAlign;
  /** Outer diameter (px) for nodeBrain / nodeHeart / nodeSolar hotspots. */
  hotspotSizePx?: number;
  /** sideRail: hit target + icon scale (px). */
  railSizePx?: number;
  typography: HeroElementTypography;
};

export type HeroBreakpointSlice = {
  silhouette: HeroSilhouetteLayout;
  overlay: HeroSilhouetteOverlay;
  elements: Record<HeroElementId, HeroElementLayout>;
};

export type HeroLabConfig = Record<HeroBreakpointKey, HeroBreakpointSlice>;

const DEFAULT_TYPO: HeroElementTypography = {
  fontPreset: "inherit",
  fontSizePx: 0,
  fontWeight: 400,
  lineHeight: 1.25,
  letterSpacingEm: 0,
  opacityPct: 100,
  uppercase: false,
  italic: false,
  hidden: false,
  maxWidthPct: 0,
};

function typo(partial: Partial<HeroElementTypography>): HeroElementTypography {
  return { ...DEFAULT_TYPO, ...partial };
}

const DEFAULT_OVERLAY: HeroSilhouetteOverlay = {
  enabled: false,
  columnFullWidth: false,
  leftPct: 18,
  topPct: 8,
  widthPct: 64,
  heightPct: 78,
  blurMode: "gradual",
  blurMinPx: 0,
  blurMaxPx: 18,
  opacityMinPct: 0,
  opacityMaxPct: 42,
  gradualDirection: "bottom",
  gradualLayers: 12,
  tint: "frame",
  radiusRem: 1.25,
};

const BASE_ELEMENTS: Record<HeroElementId, HeroElementLayout> = {
  sessionLabel: {
    leftPct: 0,
    topPct: 0,
    anchor: "topLeft",
    textAlign: "left",
    typography: typo({ fontPreset: "barlow", fontSizePx: 11, fontWeight: 500, letterSpacingEm: 0.2, opacityPct: 50, uppercase: true }),
  },
  nodeTitle: {
    leftPct: 0,
    topPct: 5.5,
    anchor: "topLeft",
    textAlign: "left",
    typography: typo({ fontPreset: "barlow", fontSizePx: 28, fontWeight: 600, lineHeight: 1.15, maxWidthPct: 92 }),
  },
  pageTitle: {
    leftPct: 0,
    topPct: 11,
    anchor: "topLeft",
    textAlign: "left",
    typography: typo({ hidden: true }),
  },
  nodeBrain: { leftPct: 58, topPct: 18, anchor: "center", textAlign: "center", hotspotSizePx: 44, typography: typo({}) },
  nodeHeart: { leftPct: 62, topPct: 52, anchor: "center", textAlign: "center", hotspotSizePx: 44, typography: typo({}) },
  nodeSolar: { leftPct: 54, topPct: 68, anchor: "center", textAlign: "center", hotspotSizePx: 44, typography: typo({}) },
  sideRail: {
    leftPct: 0,
    topPct: 33,
    anchor: "centerLeft",
    textAlign: "left",
    railSizePx: 44,
    typography: typo({}),
  },
  sleepStats: {
    leftPct: 0,
    bottomPct: 5,
    anchor: "bottomLeft",
    textAlign: "left",
    typography: typo({ fontPreset: "inherit", fontSizePx: 0, fontWeight: 300 }),
  },
  cognitionMood: {
    rightPct: 0,
    topPct: 5,
    anchor: "topRight",
    textAlign: "right",
    typography: typo({ hidden: true }),
  },
  metricCallout: {
    rightPct: 0,
    bottomPct: 18,
    anchor: "bottomRight",
    textAlign: "right",
    typography: typo({ fontPreset: "inherit", fontSizePx: 0, fontWeight: 300 }),
  },
};

function slice(silhouette: HeroSilhouetteLayout, overlayPartial?: Partial<HeroSilhouetteOverlay>): HeroBreakpointSlice {
  const overlayBase = overlayPartial ? { ...DEFAULT_OVERLAY, ...overlayPartial } : DEFAULT_OVERLAY;
  return {
    silhouette,
    overlay: structuredClone(overlayBase),
    elements: structuredClone(BASE_ELEMENTS),
  };
}

const DESKTOP_OVERLAY: Partial<HeroSilhouetteOverlay> = {
  enabled: true,
  columnFullWidth: true,
  leftPct: 0,
  topPct: 10.5,
  widthPct: 100,
  heightPct: 100,
  blurMode: "gradual",
  blurMinPx: 0,
  blurMaxPx: 5,
  opacityMinPct: 0,
  opacityMaxPct: 59,
  gradualDirection: "top",
  gradualLayers: 16,
  tint: "none",
  radiusRem: 0,
};

/** Mobile/tablet: pleine largeur + blur lisible (backdrop-filter exige overflow visible sur la colonne). */
const MOBILE_TABLET_OVERLAY: Partial<HeroSilhouetteOverlay> = {
  enabled: true,
  columnFullWidth: true,
  leftPct: 0,
  topPct: 12,
  widthPct: 100,
  heightPct: 88,
  blurMode: "gradual",
  blurMinPx: 0,
  blurMaxPx: 14,
  opacityMinPct: 0,
  opacityMaxPct: 48,
  gradualDirection: "bottom",
  gradualLayers: 10,
  tint: "frame",
  radiusRem: 0,
};

const FONT_FAMILY: Record<HeroFontPreset, string | undefined> = {
  inherit: undefined,
  barlow: "Barlow, ui-sans-serif, system-ui, sans-serif",
  grotesk: "Barlow, ui-sans-serif, system-ui, sans-serif",
  cormorant: '"Cormorant Garamond", Georgia, serif',
  mono: '"DM Mono", ui-monospace, monospace',
  cinzel: "Cinzel, serif",
  quattrocento: '"Quattrocento", Georgia, serif',
  system: "system-ui, -apple-system, sans-serif",
};

function normalizeFontPreset(raw: string | undefined, fallback: HeroFontPreset): HeroFontPreset {
  if (raw === "sans") return "barlow";
  const presets = Object.keys(FONT_FAMILY) as HeroFontPreset[];
  return presets.includes(raw as HeroFontPreset) ? (raw as HeroFontPreset) : fallback;
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeTypography(raw: Partial<HeroElementTypography> | undefined, fallback: HeroElementTypography): HeroElementTypography {
  const weights = [300, 400, 500, 600, 700] as const;
  const w = raw?.fontWeight ?? fallback.fontWeight;
  return {
    fontPreset: normalizeFontPreset(raw?.fontPreset as string | undefined, fallback.fontPreset),
    fontSizePx: clampNum(raw?.fontSizePx ?? fallback.fontSizePx, 0, 96),
    fontWeight: weights.includes(w as (typeof weights)[number]) ? (w as (typeof weights)[number]) : fallback.fontWeight,
    lineHeight: clampNum(raw?.lineHeight ?? fallback.lineHeight, 0.8, 2.4),
    letterSpacingEm: clampNum(raw?.letterSpacingEm ?? fallback.letterSpacingEm, -0.1, 0.5),
    opacityPct: clampNum(raw?.opacityPct ?? fallback.opacityPct, 0, 100),
    uppercase: raw?.uppercase ?? fallback.uppercase,
    italic: raw?.italic ?? fallback.italic,
    hidden: raw?.hidden ?? fallback.hidden,
    maxWidthPct: clampNum(raw?.maxWidthPct ?? fallback.maxWidthPct, 0, 100),
  };
}

function normalizeSilhouette(raw: Partial<HeroSilhouetteLayout> | undefined, fallback: HeroSilhouetteLayout): HeroSilhouetteLayout {
  return {
    widthPct: clampNum(raw?.widthPct ?? fallback.widthPct, 20, 140),
    leftPct: clampNum(raw?.leftPct ?? fallback.leftPct, 0, 100),
    bottomPct: clampNum(raw?.bottomPct ?? fallback.bottomPct, -35, 55),
  };
}

function normalizeOverlay(raw: Partial<HeroSilhouetteOverlay> & { blurPx?: number; opacityPct?: number } | undefined, fallback: HeroSilhouetteOverlay): HeroSilhouetteOverlay {
  const blurMinPx = clampNum(raw?.blurMinPx ?? fallback.blurMinPx, 0, 48);
  const blurMaxPx = clampNum(raw?.blurMaxPx ?? raw?.blurPx ?? fallback.blurMaxPx, 0, 48);
  return {
    enabled: raw?.enabled ?? fallback.enabled,
    columnFullWidth: raw?.columnFullWidth ?? fallback.columnFullWidth,
    leftPct: clampNum(raw?.leftPct ?? fallback.leftPct, 0, 100),
    topPct: clampNum(raw?.topPct ?? fallback.topPct, 0, 100),
    widthPct: clampNum(raw?.widthPct ?? fallback.widthPct, 5, 100),
    heightPct: clampNum(raw?.heightPct ?? fallback.heightPct, 5, 100),
    blurMode: raw?.blurMode ?? (raw?.blurPx != null ? "uniform" : fallback.blurMode),
    blurMinPx: Math.min(blurMinPx, blurMaxPx),
    blurMaxPx: Math.max(blurMinPx, blurMaxPx),
    opacityMinPct: clampNum(raw?.opacityMinPct ?? fallback.opacityMinPct, 0, 100),
    opacityMaxPct: clampNum(raw?.opacityMaxPct ?? raw?.opacityPct ?? fallback.opacityMaxPct, 0, 100),
    gradualDirection: raw?.gradualDirection ?? fallback.gradualDirection,
    gradualLayers: clampNum(raw?.gradualLayers ?? fallback.gradualLayers, 6, 24),
    tint: raw?.tint ?? fallback.tint,
    radiusRem: clampNum(raw?.radiusRem ?? fallback.radiusRem, 0, 3),
  };
}

function normalizeElement(raw: Partial<HeroElementLayout> | undefined, fallback: HeroElementLayout): HeroElementLayout {
  const hotspotSizePx = raw?.hotspotSizePx ?? fallback.hotspotSizePx;
  const railSizePx = raw?.railSizePx ?? fallback.railSizePx;
  return {
    leftPct: raw?.leftPct != null ? clampNum(raw.leftPct, 0, 100) : fallback.leftPct,
    rightPct: raw?.rightPct != null ? clampNum(raw.rightPct, 0, 100) : fallback.rightPct,
    topPct: raw?.topPct != null ? clampNum(raw.topPct, 0, 100) : fallback.topPct,
    bottomPct: raw?.bottomPct != null ? clampNum(raw.bottomPct, 0, 100) : fallback.bottomPct,
    anchor: raw?.anchor ?? fallback.anchor,
    textAlign: raw?.textAlign ?? fallback.textAlign,
    typography: normalizeTypography(raw?.typography, fallback.typography),
    ...(hotspotSizePx != null ? { hotspotSizePx: clampNum(hotspotSizePx, 20, 120) } : {}),
    ...(railSizePx != null ? { railSizePx: clampNum(railSizePx, 28, 72) } : {}),
  };
}

function normalizeSlice(raw: Partial<HeroBreakpointSlice> | undefined, fallback: HeroBreakpointSlice): HeroBreakpointSlice {
  const elements = {} as Record<HeroElementId, HeroElementLayout>;
  for (const id of Object.keys(BASE_ELEMENTS) as HeroElementId[]) {
    elements[id] = normalizeElement(raw?.elements?.[id], fallback.elements[id]);
  }
  return {
    silhouette: normalizeSilhouette(raw?.silhouette, fallback.silhouette),
    overlay: normalizeOverlay(raw?.overlay, fallback.overlay),
    elements,
  };
}

function buildDefaultHeroLabConfig(): HeroLabConfig {
  const mobilePortraitSeed = slice(
    { widthPct: 75.5, leftPct: 29.5, bottomPct: -8 },
    {
      enabled: true,
      columnFullWidth: true,
      leftPct: 18,
      topPct: 23.5,
      widthPct: 64,
      heightPct: 100,
      blurMaxPx: 5,
      opacityMaxPct: 80,
      gradualLayers: 24,
      radiusRem: 0.75,
    },
  );
  const mobileLandscapeSeed = slice(
    { widthPct: 74.5, leftPct: 33, bottomPct: -24 },
    {
      enabled: true,
      columnFullWidth: true,
      leftPct: 18,
      topPct: 2.5,
      widthPct: 64,
      heightPct: 98.5,
      blurMaxPx: 2,
      opacityMaxPct: 29,
      gradualLayers: 24,
      tint: "none",
      radiusRem: 1.875,
    },
  );

  const base: HeroLabConfig = {
    desktop: slice({ widthPct: 60.5, leftPct: 24, bottomPct: -5.5 }, DESKTOP_OVERLAY),
    tabletLandscape: slice({ widthPct: 66.5, leftPct: 25, bottomPct: 7.5 }, MOBILE_TABLET_OVERLAY),
    tabletPortrait: slice({ widthPct: 56, leftPct: 23, bottomPct: 3.25 }, MOBILE_TABLET_OVERLAY),
    mobilePortrait: mobilePortraitSeed,
    mobileLandscape: mobileLandscapeSeed,
  };

  const presets = heroLabMobilePresets as {
    mobilePortrait?: Partial<HeroBreakpointSlice>;
    mobileLandscape?: Partial<HeroBreakpointSlice>;
  };

  return {
    ...base,
    mobilePortrait: normalizeSlice(presets.mobilePortrait, base.mobilePortrait),
    mobileLandscape: normalizeSlice(presets.mobileLandscape, base.mobileLandscape),
  };
}

export const DEFAULT_HERO_LAB_CONFIG: HeroLabConfig = buildDefaultHeroLabConfig();

export function normalizeHeroLabConfig(raw: Partial<HeroLabConfig> | undefined): HeroLabConfig {
  const out = {} as HeroLabConfig;
  for (const key of HERO_BREAKPOINT_ORDER) {
    out[key] = normalizeSlice(raw?.[key], DEFAULT_HERO_LAB_CONFIG[key]);
  }
  return out;
}

function loadRawConfig(): Partial<HeroLabConfig> | null {
  try {
    for (const key of [HERO_LAB_STORAGE_KEY, "aegis_bio_hero_lab_config_v2"]) {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored) as Partial<HeroLabConfig>;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadHeroLabConfig(): HeroLabConfig {
  const raw = loadRawConfig();
  if (!raw) return structuredClone(DEFAULT_HERO_LAB_CONFIG);
  return normalizeHeroLabConfig(raw);
}

export function saveHeroLabConfig(config: HeroLabConfig) {
  try {
    localStorage.setItem(HERO_LAB_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function loadHeroLabEditorOpen(): boolean {
  try {
    return sessionStorage.getItem(HERO_LAB_EDITOR_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveHeroLabEditorOpen(open: boolean) {
  try {
    sessionStorage.setItem(HERO_LAB_EDITOR_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadHeroLabViewportDisplay(): HeroLabViewportDisplay {
  try {
    const v = sessionStorage.getItem(HERO_LAB_VIEWPORT_DISPLAY_KEY);
    if (v === "mobile" || v === "tablet" || v === "desktop" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function saveHeroLabViewportDisplay(display: HeroLabViewportDisplay) {
  try {
    sessionStorage.setItem(HERO_LAB_VIEWPORT_DISPLAY_KEY, display);
  } catch {
    /* ignore */
  }
}

/** Resolved preview chrome when the builder panel is open. */
export function resolveHeroLabPreviewChrome(
  viewportDisplay: HeroLabViewportDisplay,
  editBreakpoint: HeroBreakpointKey,
): HeroLabPreviewChrome {
  if (viewportDisplay !== "auto") return viewportDisplay;
  if (editBreakpoint === "desktop") return "desktop";
  if (editBreakpoint === "tabletLandscape" || editBreakpoint === "tabletPortrait") return "tablet";
  return "mobile";
}

/** Exact device frame for Hero Builder canvas (portrait vs paysage). */
export function resolveHeroLabPreviewFrameKey(
  viewportDisplay: HeroLabViewportDisplay,
  editBreakpoint: HeroBreakpointKey,
): HeroLabPreviewFrameKey {
  if (viewportDisplay === "desktop") return "desktop";
  if (viewportDisplay === "mobile") {
    return editBreakpoint === "mobileLandscape" || editBreakpoint === "mobilePortrait"
      ? editBreakpoint
      : "mobilePortrait";
  }
  if (viewportDisplay === "tablet") {
    return editBreakpoint === "tabletLandscape" || editBreakpoint === "tabletPortrait"
      ? editBreakpoint
      : "tabletPortrait";
  }
  if (editBreakpoint === "desktop") return "desktop";
  return editBreakpoint;
}

/** Stacked phone/tablet frame (hero row + metrics row). Paysage mobile = split desktop, not compact. */
export function isHeroLabCompactPreviewFrame(frame: HeroLabPreviewFrameKey): boolean {
  return frame !== "desktop" && frame !== "mobileLandscape";
}

/** Compact frame that uses desktop-style hero | tiles columns (not stacked carousel). */
export function isHeroLabSplitPreviewFrame(frame: HeroLabPreviewFrameKey): boolean {
  return frame === "mobileLandscape";
}

/** Logical viewport for Hero Builder « Mob. paysage » (iPhone 14/15 class, landscape). */
export const HERO_LAB_MOBILE_LANDSCAPE_PREVIEW_SIZE = {
  widthPx: 844,
  heightPx: 390,
} as const;

/** Colonnes grille 12 — hero un peu plus étroit, tuiles plus lisibles en paysage. */
export const HERO_LAB_MOBILE_LANDSCAPE_SPLIT = {
  heroSpan: 5,
  tilesSpan: 7,
} as const;

/** Root classes for the preview device frame (+ shared compact base class in CSS). */
export function heroLabPreviewFrameClassNames(frame: HeroLabPreviewFrameKey): string[] {
  if (frame === "desktop") return ["aegis-bio-exec-lab--hero-preview-desktop"];
  if (isHeroLabSplitPreviewFrame(frame)) {
    return [
      "aegis-bio-exec-lab--hero-preview-split",
      `aegis-bio-exec-lab--hero-preview-${HERO_PREVIEW_FRAME_SLUG[frame]}`,
    ];
  }
  return [
    "aegis-bio-exec-lab--hero-preview-compact",
    `aegis-bio-exec-lab--hero-preview-${HERO_PREVIEW_FRAME_SLUG[frame]}`,
  ];
}

/** @deprecated prefer heroLabPreviewFrameClassNames */
export function heroLabPreviewFrameClassName(frame: HeroLabPreviewFrameKey): string {
  return heroLabPreviewFrameClassNames(frame).join(" ");
}

/** Config slice bound to the canvas in compact preview. */
export function resolveHeroLabPreviewConfigKey(
  viewportDisplay: HeroLabViewportDisplay,
  editBreakpoint: HeroBreakpointKey,
): HeroBreakpointKey {
  const frame = resolveHeroLabPreviewFrameKey(viewportDisplay, editBreakpoint);
  return frame === "desktop" ? "desktop" : frame;
}

export function detectHeroBreakpoint(): HeroBreakpointKey {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const landscape = w > h;
  if (w >= 1024) return "desktop";
  if (w >= 768) return landscape ? "tabletLandscape" : "tabletPortrait";
  return landscape ? "mobileLandscape" : "mobilePortrait";
}

export function heroTypographyToStyle(typography: HeroElementTypography): CSSProperties {
  const style: CSSProperties = {
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacingEm}em`,
    opacity: typography.opacityPct / 100,
    textTransform: typography.uppercase ? "uppercase" : undefined,
    fontStyle: typography.italic ? "italic" : undefined,
  };
  const family = FONT_FAMILY[typography.fontPreset];
  if (family) style.fontFamily = family;
  if (typography.fontSizePx >= 8) style.fontSize = `${typography.fontSizePx}px`;
  if (typography.maxWidthPct > 0) style.maxWidth = `${typography.maxWidthPct}%`;
  return style;
}

const DEFAULT_HOTSPOT_SIZE_PX = 44;
const DEFAULT_RAIL_SIZE_PX = 44;

export function heroHotspotSizePx(layout: HeroElementLayout): number {
  const size = layout.hotspotSizePx ?? DEFAULT_HOTSPOT_SIZE_PX;
  return Math.min(120, Math.max(20, size));
}

/** Diameter + CSS var for inner ring/core scaling on bio hotspots. */
export function heroHotspotBoxStyle(layout: HeroElementLayout): CSSProperties {
  const size = heroHotspotSizePx(layout);
  return {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    ["--bio-hotspot-size" as string]: `${size}px`,
  };
}

export function heroRailSizePx(layout: HeroElementLayout): number {
  const size = layout.railSizePx ?? DEFAULT_RAIL_SIZE_PX;
  return Math.min(72, Math.max(28, size));
}

/** Lucide icon size scaled from 15px @ 44px rail button. */
export function heroRailIconSizePx(layout: HeroElementLayout): number {
  const size = heroRailSizePx(layout);
  return Math.max(12, Math.round((size * 15) / DEFAULT_RAIL_SIZE_PX));
}

export function heroSideRailBoxStyle(layout: HeroElementLayout): CSSProperties {
  const size = heroRailSizePx(layout);
  return {
    ["--bio-rail-btn-size" as string]: `${size}px`,
  };
}

export function heroElementBoxStyle(layout: HeroElementLayout): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    textAlign: layout.textAlign,
  };
  if (layout.leftPct != null) style.left = `${layout.leftPct}%`;
  if (layout.rightPct != null) style.right = `${layout.rightPct}%`;
  if (layout.topPct != null) style.top = `${layout.topPct}%`;
  if (layout.bottomPct != null) style.bottom = `${layout.bottomPct}%`;

  switch (layout.anchor) {
    case "center":
      style.transform = "translate(-50%, -50%)";
      break;
    case "centerLeft":
      style.transform = "translateY(-50%)";
      break;
    default:
      break;
  }
  return style;
}

/** @deprecated use heroElementBoxStyle + heroTypographyToStyle */
export function heroElementToStyle(layout: HeroElementLayout): CSSProperties {
  return { ...heroElementBoxStyle(layout), ...heroTypographyToStyle(layout.typography) };
}

export function heroElementVisible(layout: HeroElementLayout, heroLab: boolean, selected: boolean): boolean {
  if (!layout.typography.hidden) return true;
  return heroLab && selected;
}

export type HeroOverlayEscapeBox = {
  leftPx: number;
  widthPx: number;
  topPx: number;
  heightPx: number;
};

export type HeroOverlayLayoutHost = "figure" | "column-escape";

export function overlayBoxStyle(
  overlay: HeroSilhouetteOverlay,
  host: HeroOverlayLayoutHost = "figure",
  escapeBox?: HeroOverlayEscapeBox | null,
): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    borderRadius: `${overlay.radiusRem}rem`,
  };

  if (overlay.columnFullWidth) {
    if (host === "column-escape" && escapeBox) {
      return {
        ...base,
        borderRadius: 0,
        left: 0,
        right: 0,
        width: "auto",
        top: escapeBox.topPx,
        height: escapeBox.heightPx,
        maxWidth: "none",
      };
    }
    return {
      ...base,
      left: "calc(-1 * var(--bio-hero-pad-x, 1.75rem))",
      right: "calc(-1 * var(--bio-hero-pad-x, 1.75rem))",
      width: "auto",
      maxWidth: "none",
      top: `${overlay.topPct}%`,
      ...(overlay.heightPct >= 99 ? { bottom: 0, height: "auto" } : { height: `${overlay.heightPct}%` }),
    };
  }

  return {
    ...base,
    top: `${overlay.topPct}%`,
    left: `${overlay.leftPct}%`,
    width: `${overlay.widthPct}%`,
    ...(overlay.heightPct >= 99 ? { bottom: 0 } : { height: `${overlay.heightPct}%` }),
  };
}

export function silhouetteToStyle(layout: HeroSilhouetteLayout): CSSProperties {
  return {
    width: `${layout.widthPct}%`,
    left: `${layout.leftPct}%`,
    bottom: `${layout.bottomPct}%`,
    transform: "translateX(-50%)",
    transformOrigin: "center bottom",
  };
}

function isBreakpointSliceShape(value: unknown): value is Partial<HeroBreakpointSlice> {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return "silhouette" in o || "overlay" in o || "elements" in o;
}

export type HeroLabConfigImportResult =
  | { ok: true; config: HeroLabConfig; applied: HeroBreakpointKey[] }
  | { ok: false; error: string };

/** Accepte JSON complet, `{ mobilePortrait: slice }`, ou un slice seul (→ breakpoint actif). */
export function importHeroLabConfigFromJson(
  current: HeroLabConfig,
  jsonText: string,
  activeBreakpoint: HeroBreakpointKey,
): HeroLabConfigImportResult {
  const trimmed = jsonText.trim();
  if (!trimmed) return { ok: false, error: "JSON vide" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON invalide" };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Objet JSON attendu" };
  }

  const merged = structuredClone(current);
  const applied: HeroBreakpointKey[] = [];
  const record = parsed as Partial<HeroLabConfig> & Partial<HeroBreakpointSlice>;

  for (const key of HERO_BREAKPOINT_ORDER) {
    const sliceRaw = record[key];
    if (sliceRaw && typeof sliceRaw === "object") {
      merged[key] = normalizeSlice(sliceRaw as Partial<HeroBreakpointSlice>, merged[key]);
      applied.push(key);
    }
  }

  if (applied.length > 0) {
    return { ok: true, config: merged, applied };
  }

  if (isBreakpointSliceShape(record)) {
    merged[activeBreakpoint] = normalizeSlice(record, merged[activeBreakpoint]);
    return { ok: true, config: merged, applied: [activeBreakpoint] };
  }

  return {
    ok: false,
    error: "Aucun breakpoint reconnu (clés desktop, mobilePortrait, … ou un slice silhouette/overlay/elements)",
  };
}

export function formatHeroLabConfigForCopy(config: HeroLabConfig, breakpoint?: HeroBreakpointKey): string {
  if (breakpoint) {
    return JSON.stringify({ [breakpoint]: config[breakpoint] }, null, 2);
  }
  return JSON.stringify(config, null, 2);
}

/** @deprecated use HeroLabConfig */
export type BioExecutiveSilhouetteLayout = HeroSilhouetteLayout;
