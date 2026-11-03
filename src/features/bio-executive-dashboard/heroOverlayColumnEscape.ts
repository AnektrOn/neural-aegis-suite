import type { HeroOverlayEscapeBox, HeroSilhouetteOverlay } from "./bioExecutiveHeroLabConfig";

/**
 * Overlay is a position:absolute child of the column.
 * Containing block = padding box of the hero column.
 * Pleine largeur : left/right 0 (100% du panneau) ; haut/hauteur = % du panneau, pas de la figure.
 */
export function computeHeroOverlayColumnEscape(
  columnEl: HTMLElement,
  figureEl: HTMLElement,
  overlay: HeroSilhouetteOverlay,
): HeroOverlayEscapeBox {
  const panelHeight = columnEl.clientHeight;
  const colRect = columnEl.getBoundingClientRect();
  const figRect = figureEl.getBoundingClientRect();
  const borderTop = Number.parseFloat(getComputedStyle(columnEl).borderTopWidth) || 0;
  const paddingBoxTop = colRect.top + borderTop;
  const topPx = (overlay.topPct / 100) * panelHeight + columnEl.scrollTop;
  const figBottomPx = figRect.bottom - paddingBoxTop + columnEl.scrollTop;
  const heightFromPct =
    overlay.heightPct >= 99
      ? Math.max(0, panelHeight - (overlay.topPct / 100) * panelHeight)
      : Math.max(0, (overlay.heightPct / 100) * panelHeight);
  const heightToFigure = Math.max(0, figBottomPx - topPx);
  const heightPx = Math.min(heightFromPct, heightToFigure, Math.max(0, panelHeight - topPx));
  return {
    leftPx: 0,
    widthPx: columnEl.clientWidth,
    topPx,
    heightPx,
  };
}
