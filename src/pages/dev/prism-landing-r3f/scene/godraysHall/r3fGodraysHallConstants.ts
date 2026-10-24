/** Valeurs calées sur le lab Godrays Hall (PointLight fente + three-good-godrays). */
export const R3F_GODRAYS_HALL_CAMERA = {
  fov: 55,
  near: 0.1,
  far: 400,
  /** Portail au centre, cube décalé +X (hors lumière dorée). */
  position: [4, 4.8, 20] as [number, number, number],
  lookAt: [3, 7, -3] as [number, number, number],
};

export const R3F_GODRAYS_HALL_ORBIT_TARGET = [2.5, 7.5, -2] as [number, number, number];

export const R3F_GODRAYS_HALL_FOG = ["#0a0605", 35, 160] as [string, number, number];

export const R3F_GODRAYS_HALL_GODRAYS = {
  density: 0.012,
  maxDensity: 0.65,
  edgeStrength: 2,
  edgeRadius: 2,
  distanceAttenuation: 2,
  color: "#ff9038",
  raymarchSteps: 70,
  blur: true,
  /** false quand bloom/grade suivent (README three-good-godrays). */
  gammaCorrection: false,
  resolutionScale: 1,
};

export const R3F_GODRAYS_HALL_BG = "#07090d";

/**
 * Remplissage direct sur les deux piliers (la PointLight godrays est au fond du canal).
 * Pas d’ombres : évite le double shadow map ; pas enregistrée dans R3fGutterLightContext.
 */
export const R3F_SLIT_PILLAR_SPILL = {
  intensityFromEmit: 0.16,
  minIntensity: 22,
  distance: 38,
  decay: 1.35,
} as const;
