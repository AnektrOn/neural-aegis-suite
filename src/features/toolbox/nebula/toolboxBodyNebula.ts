/** Single routing source for the « Corps & somatique » nebula family. */

export const BODY_SCAN_NEBULA_SLUGS = new Set(["body_scan", "progressive_relax"]);

export const BODY_MOVE_NEBULA_SLUGS = new Set([
  "micro_movement",
  "shake_release",
  "walking_meditation",
  "cold_exposure_prep",
  "posture_reset",
  "energy_activation",
]);

export const BODY_NEBULA_SLUGS = new Set([
  ...BODY_SCAN_NEBULA_SLUGS,
  ...BODY_MOVE_NEBULA_SLUGS,
]);

export function isBodyScanNebulaSlug(slug: string): boolean {
  return BODY_SCAN_NEBULA_SLUGS.has(slug);
}

export function isBodyMoveNebulaSlug(slug: string): boolean {
  return BODY_MOVE_NEBULA_SLUGS.has(slug);
}

export function isBodyNebulaSlug(slug: string): boolean {
  return BODY_NEBULA_SLUGS.has(slug);
}
