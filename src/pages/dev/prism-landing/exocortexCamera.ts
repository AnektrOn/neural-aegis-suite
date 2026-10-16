/** Orthographic fit from the Aegis Exocortex hero (`OC` / `kC`). */
const NARROW_MAX_WIDTH = 700;

export function isExocortexNarrow(width: number): boolean {
  return width < NARROW_MAX_WIDTH;
}

export function exocortexZoom(width: number, height: number): number {
  if (isExocortexNarrow(width)) {
    return Math.min(width / 8.4, height / 17);
  }
  return Math.min(width / 11, height / 9);
}

export function exocortexCameraY(width: number): number {
  return isExocortexNarrow(width) ? -1.15 : -0.3;
}
