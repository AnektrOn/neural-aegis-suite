import { LAYOUT_PILLAR } from "./prismLayoutSceneScale";
import type { SceneLayoutPortal } from "./sceneLayout";

/** Décalage local Z de la fente (aligné `createCosmicMonolithScene` / `PORTAL_SLIT_LOCAL_Z`). */
export const PORTAL_SLIT_LOCAL_Z = 0.35;

/**
 * Assemblage portail + piliers : offsets locaux par rapport au centre du portail (x, z monde).
 * Recolle la logique landing : pilier G = centre − gap/2 − largeur pilier/2, etc.
 */
export function portalAssemblyLocalOffsets(gapWidth: number) {
  const halfGap = gapWidth / 2;
  const halfPillarW = LAYOUT_PILLAR.width / 2;
  return {
    leftPillar: { x: -halfGap - halfPillarW, z: 0 },
    rightPillar: { x: halfGap + halfPillarW, z: 0 },
    slit: { x: 0, z: PORTAL_SLIT_LOCAL_Z },
  };
}

export function pillarWorldPositionsFromPortal(portal: SceneLayoutPortal) {
  const local = portalAssemblyLocalOffsets(portal.gapWidth);
  return {
    leftPillar: { x: portal.x + local.leftPillar.x, z: portal.z + local.leftPillar.z },
    rightPillar: { x: portal.x + local.rightPillar.x, z: portal.z + local.rightPillar.z },
  };
}
