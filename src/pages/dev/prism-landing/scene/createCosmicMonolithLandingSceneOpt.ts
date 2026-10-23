import type { CosmicMonolithLandingHandle } from "./createCosmicMonolithLandingScene";
import { createCosmicMonolithScene } from "./createCosmicMonolithScene";
import { resolveLandingShoreTextures } from "./landingShoreGround";

/**
 * Landing travelling avec profil performance `optimized` (route /dev/prism-landing-opt).
 * La route golden utilise `createCosmicMonolithLandingScene` sans ce profil.
 */
export async function createCosmicMonolithLandingSceneOpt(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
): Promise<CosmicMonolithLandingHandle> {
  const shoreGround = await resolveLandingShoreTextures();
  return createCosmicMonolithScene(canvas, onCinematicChange, {
    landingTravelling: true,
    performanceProfile: "optimized",
    shoreGround,
  }) as CosmicMonolithLandingHandle;
}
