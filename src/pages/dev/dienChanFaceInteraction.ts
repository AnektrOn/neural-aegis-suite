/** Seuil px : en dessous = tap (pick point), au-dessus = rotation. */
export const TAP_DRAG_THRESHOLD_PX = 8;

export function pointerTravelPx(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const dx = endX - startX;
  const dy = endY - startY;
  return Math.hypot(dx, dy);
}

export function isTapGesture(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thresholdPx = TAP_DRAG_THRESHOLD_PX,
): boolean {
  return pointerTravelPx(startX, startY, endX, endY) < thresholdPx;
}

export const CAMERA_Z_DEFAULT = 2.12;
export const CAMERA_Z_MIN = 1.52;
export const CAMERA_Z_MAX = 3.35;

export function clampCameraZ(z: number): number {
  return Math.min(CAMERA_Z_MAX, Math.max(CAMERA_Z_MIN, z));
}
