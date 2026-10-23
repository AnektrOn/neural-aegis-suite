import type { CosmicMonolithHandle } from "./createCosmicMonolithScene";
import { createCosmicMonolithScene } from "./createCosmicMonolithScene";
import { resolveLandingShoreTextures } from "./landingShoreGround";
import type { LandingRenderTuningHandle } from "./landingRenderTuning";
import type { LandingTravellingHandle } from "../camera/landingTravellingRig";

export type CosmicMonolithLandingHandle = CosmicMonolithHandle &
  LandingTravellingHandle &
  LandingRenderTuningHandle;

/**
 * Scène monolithe + rig travelling / POV pour la landing éditoriale.
 * N'altère pas le comportement de `createCosmicMonolithScene` utilisé ailleurs (Dev Lab).
 */
export async function createCosmicMonolithLandingScene(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
): Promise<CosmicMonolithLandingHandle> {
  const shoreGround = await resolveLandingShoreTextures();
  return createCosmicMonolithScene(canvas, onCinematicChange, {
    landingTravelling: true,
    shoreGround,
  }) as CosmicMonolithLandingHandle;
}
