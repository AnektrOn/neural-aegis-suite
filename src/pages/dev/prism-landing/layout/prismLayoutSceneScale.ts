/**
 * Hiérarchie visuelle layout / landing :
 * 1. Cube — le plus petit
 * 2. Marbre — un peu plus grand, léger survol au-dessus du sol
 * 3. Portail + piliers — assemblage rigide, le plus imposant
 */
export const LAYOUT_PORTAL_HEIGHT = 23.5;
export const LAYOUT_PILLAR = { width: 1.15, depth: 2.6, height: LAYOUT_PORTAL_HEIGHT };

/** Cube landing — arête ~1,5 m (demi-taille 0,75 m, −25 % vs ref 2 m). */
export const LAYOUT_CUBE_HALF_SIZE = 0.45;
export const LAYOUT_CUBE_SIZE = LAYOUT_CUBE_HALF_SIZE * 2;
/** Décalage vertical du centre du groupe au-dessus du pied terrain. */
export const LAYOUT_CUBE_ABOVE_FOOT = 2.32;
export const LAYOUT_CUBE_CENTER_Y = LAYOUT_CUBE_ABOVE_FOOT;

/** Monolithe marbre — plus grand que le cube, pas au niveau des piliers. */
export const LAYOUT_MARBLE_SIZE = { width: 3.2, height: 6.4, depth: 1.2 };
/** Survol léger au-dessus du sol (centre du mesh). */
export const LAYOUT_MARBLE_HOVER = 1.20;
