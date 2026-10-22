import type { CosmicMonolithLandingHandle } from "./createCosmicMonolithLandingScene";
import type { CreateCosmicMonolithLandingSceneOptions } from "./createCosmicMonolithLandingScene";
import { createCosmicMonolithScene } from "./createCosmicMonolithScene";

/**
 * Landing travelling avec profil performance `optimized` (route /dev/prism-landing-opt).
 */
export async function createCosmicMonolithLandingSceneOpt(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
  _sceneOptions?: CreateCosmicMonolithLandingSceneOptions,
): Promise<CosmicMonolithLandingHandle> {
  return createCosmicMonolithScene(canvas, onCinematicChange, {
    landingTravelling: true,
    performanceProfile: "optimized",
  }) as CosmicMonolithLandingHandle;
}
