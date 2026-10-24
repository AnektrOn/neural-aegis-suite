let studioBooted = false;

/** Charge Theatre Studio + extension R3F une seule fois (dev). */
export function initLandingR3fTheatreStudio(): void {
  if (!import.meta.env.DEV || studioBooted) return;
  studioBooted = true;

  void import("@theatre/studio").then(async (studioMod) => {
    const studio = studioMod.default;
    studio.initialize();
    const r3fExtension = await import("@theatre/r3f/dist/extension");
    studio.extend(r3fExtension.default);
  });
}
