import * as THREE from "three";
import type { R3fSceneConfig, R3fSlitGeometryConfig } from "../../config/r3fSceneConfig";

const scratch = new THREE.Vector3();

/** Recul du panneau émissif / point depuis le fond intérieur du canal (local +Z). */
export const R3F_GUTTER_EMITTER_Z_INSET = 0.12;

/** Arrière des piliers (local Z). */
export function getGutterBackZLocal(cfg: R3fSlitGeometryConfig): number {
  return -cfg.pillarDepth / 2;
}

/** Bord avant du canal (ouverture vers +Z uniquement). */
export function getGutterOpenZLocal(cfg: R3fSlitGeometryConfig): number {
  return getGutterBackZLocal(cfg) + cfg.gutterDepth;
}

/** Centre vertical des piliers et du canal (aligné mesh). */
export function getMonolithCenterY(cfg: R3fSlitGeometryConfig): number {
  return cfg.monolithFootY + cfg.monolithHeight / 2;
}

/** Z local du panneau émissif et du PointLight (fond du canal, côté intérieur). */
export function getEmitterLocalZ(cfg: R3fSlitGeometryConfig): number {
  const backZ = getGutterBackZLocal(cfg);
  return backZ + cfg.gutterWallThickness + R3F_GUTTER_EMITTER_Z_INSET;
}

/** Z local du capot arrière (extérieur −Z, flush arrière pilier). */
export function getGutterRearCapZLocal(cfg: R3fSlitGeometryConfig): number {
  const backZ = getGutterBackZLocal(cfg);
  return backZ - cfg.gutterWallThickness / 2;
}

export const R3F_SLIT_MONOLITH_GROUP_NAME = "r3f-slit-monolith";

/** Position locale de l’émetteur dans le groupe monolithe (X/Z = centre du groupe). */
export function getEmitterLocalPosition(cfg: R3fSlitGeometryConfig, out = scratch): THREE.Vector3 {
  return out.set(0, getMonolithCenterY(cfg), getEmitterLocalZ(cfg));
}

/** Spill à l’ouverture (+Z) — face intérieure de chaque pilier (pas la source godrays). */
export function getPillarSpillLocalPosition(
  cfg: R3fSlitGeometryConfig,
  side: "left" | "right",
  out = scratch,
): THREE.Vector3 {
  const halfGap = cfg.gapWidth / 2;
  const openZ = getGutterOpenZLocal(cfg);
  const x = side === "left" ? -halfGap : halfGap;
  return out.set(x, getMonolithCenterY(cfg), openZ - cfg.gutterWallThickness * 0.35);
}

/** Fallback monde si le groupe n’est pas encore monté. */
export function getGutterEmitterWorld(cfg: R3fSceneConfig, out = scratch): THREE.Vector3 {
  return out.set(
    cfg.monolithCenterX,
    getMonolithCenterY(cfg),
    cfg.monolithCenterZ + getEmitterLocalZ(cfg),
  );
}
