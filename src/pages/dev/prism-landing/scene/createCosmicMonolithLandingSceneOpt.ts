import type { CosmicMonolithLandingHandle } from "./createCosmicMonolithLandingScene";
import { createCosmicMonolithScene } from "./createCosmicMonolithScene";
import { resolveLandingShoreTextures } from "./landingShoreGround";
import { resolveLandingLutTexture } from "./landingLutLoader";

/**
 * Landing travelling avec profil performance `optimized` (route /dev/prism-landing-opt).
 * La route golden utilise `createCosmicMonolithLandingScene` sans ce profil.
 */
export async function createCosmicMonolithLandingSceneOpt(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
): Promise<CosmicMonolithLandingHandle> {
  const [shoreGround, lut] = await Promise.all([
    resolveLandingShoreTextures(),
    resolveLandingLutTexture(),
  ]);
  let handle: CosmicMonolithLandingHandle | null = null;
  try {
    handle = createCosmicMonolithScene(canvas, onCinematicChange, {
      landingTravelling: true,
      performanceProfile: "optimized",
      shoreGround,
      landingLut: lut.texture,
    }) as CosmicMonolithLandingHandle;
    return handle;
  } catch (err) {
    handle?.dispose();
    throw err;
  }
}
