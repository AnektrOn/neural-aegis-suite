import type { CSSProperties } from "react";

export type BioExecutiveSilhouetteLayout = {
  widthPct: number;
  leftPct: number;
  bottomPct: number;
};

export const BIO_EXEC_SILHOUETTE_LAYOUT_STORAGE_KEY = "aegis_bio_hero_silhouette_layout_v1";

export const DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT: BioExecutiveSilhouetteLayout = {
  widthPct: 80,
  leftPct: 50,
  bottomPct: 0,
};

export function loadBioExecutiveSilhouetteLayout(): BioExecutiveSilhouetteLayout {
  try {
    const raw = localStorage.getItem(BIO_EXEC_SILHOUETTE_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<BioExecutiveSilhouetteLayout>;
    return {
      widthPct: clampNum(parsed.widthPct ?? DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT.widthPct, 30, 160),
      leftPct: clampNum(parsed.leftPct ?? DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT.leftPct, 0, 100),
      bottomPct: clampNum(parsed.bottomPct ?? DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT.bottomPct, -30, 60),
    };
  } catch {
    return DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT;
  }
}

export function saveBioExecutiveSilhouetteLayout(layout: BioExecutiveSilhouetteLayout) {
  try {
    localStorage.setItem(BIO_EXEC_SILHOUETTE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function silhouetteLayoutToInlineStyle(layout: BioExecutiveSilhouetteLayout): CSSProperties {
  return {
    width: `${layout.widthPct}%`,
    left: `${layout.leftPct}%`,
    bottom: `${layout.bottomPct}%`,
    transform: "translateX(-50%)",
    transformOrigin: "center bottom",
  };
}

export function formatSilhouetteLayoutForCopy(layout: BioExecutiveSilhouetteLayout): {
  json: string;
  css: string;
  cssVariables: string;
  reactStyle: string;
} {
  const json = JSON.stringify(layout, null, 2);
  const cssVariables = `--bio-hero-silhouette-width: ${layout.widthPct}%;
--bio-hero-silhouette-left: ${layout.leftPct}%;
--bio-hero-silhouette-bottom: ${layout.bottomPct}%;`;
  const css = `.aegis-bio-exec-lab__hero-silhouette {
  width: ${layout.widthPct}%;
  left: ${layout.leftPct}%;
  bottom: ${layout.bottomPct}%;
  transform: translateX(-50%);
  transform-origin: center bottom;
}`;
  const reactStyle = `{ width: "${layout.widthPct}%", left: "${layout.leftPct}%", bottom: "${layout.bottomPct}%", transform: "translateX(-50%)", transformOrigin: "center bottom" }`;
  return { json, css, cssVariables, reactStyle };
}
