import type { CosmicMonolithHandle } from "./createCosmicMonolithScene";
import { createCosmicMonolithScene } from "./createCosmicMonolithScene";
import type { LandingRenderTuningHandle } from "./landingRenderTuning";
import type { LandingTravellingHandle } from "../camera/landingTravellingRig";

export type CosmicMonolithLandingHandle = CosmicMonolithHandle &
  LandingTravellingHandle &
  LandingRenderTuningHandle;

/**
 * Scène monolithe + rig travelling / POV pour la landing éditoriale.
 * N'altère pas le comportement de `createCosmicMonolithScene` utilisé ailleurs (Dev Lab).
 */
export type CreateCosmicMonolithLandingSceneOptions = object;

export async function createCosmicMonolithLandingScene(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
  _sceneOptions?: CreateCosmicMonolithLandingSceneOptions,
): Promise<CosmicMonolithLandingHandle> {
  return createCosmicMonolithScene(canvas, onCinematicChange, {
    landingTravelling: true,
  }) as CosmicMonolithLandingHandle;
}
