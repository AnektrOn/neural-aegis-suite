import * as THREE from "three";

/** Références lumières principales (landing wasteland / travelling). */
export type LandingLightRig = {
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  moon: THREE.DirectionalLight;
  portalSpot: THREE.SpotLight;
  groundBounce: THREE.PointLight;
  midPortal: THREE.PointLight;
  topPortal: THREE.PointLight;
  rightGrazing: THREE.PointLight;
};

/** Paramètres initiaux bloom / godrays / fog pour la route landing. */
export type LandingPostFxBootstrap = {
  fogDensity: number;
  /** Diffusion brouillard (pass écran, type three.js fog scattering). */
  fogScattering: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  godrayDecay: number;
  godrayDensity: number;
  godrayThreshold: number;
  /** Poids de chaque échantillon du shader godray (uWeight). Optionnel : 0.14 par défaut. */
  godrayWeight?: number;
  /** Multiplicateur écran (× atmosphere.postFx.godrayStrength × tuning). */
  godrayScreenMul: number;
};

/** Wasteland post-pluie : halation douce, rayons discrets, brouillard homogène. */
export const LANDING_WASTELAND_POST: LandingPostFxBootstrap = {
  fogDensity: 0.0032,
  fogScattering: 1.15,
  bloomStrength: 0.36,
  bloomRadius: 0.9,
  bloomThreshold: 0.91,
  godrayDecay: 0.931,
  // Godrays landing : la fente n'est plus entourée de sprites « boules », le halo restant
  // (baseBloomSprite) vaut ~0.2 en luminance linéaire. Un seuil à 0.38 l'excluait, seul le point
  // émissif passait → rayons invisibles. Seuil abaissé, densité relevée pour que les rayons
  // atteignent la source, poids/multiplicateur relevés car la chaîne de facteurs était ~0.005.
  // Valeurs de départ à ajuster à l'œil (voir godrayScreenMul d'abord).
  godrayDensity: 0.92,
  godrayThreshold: 0.12,
  godrayWeight: 1.0,
  godrayScreenMul: 1.6,
};

const terrainAnchor = new THREE.Vector3();

/**
 * Éclairage landing : ciel gris-ocre, lune voilée, portail comme seule source chaude forte.
 * Centre les ombres directionnelles sur le terrain compact.
 */
export type LandingWastelandLightingOptions = {
  /** Sol lisible (texture PBR) dès le chargement — moins de fill gris hémisphérique. */
  groundReadable?: boolean;
};

export function applyLandingWastelandLighting(
  rig: LandingLightRig,
  terrainCenterX: number,
  terrainCenterZ: number,
  options?: LandingWastelandLightingOptions,
) {
  terrainAnchor.set(terrainCenterX, 0, terrainCenterZ);
  rig.moon.target.position.copy(terrainAnchor);
  if (options?.groundReadable) {
    rig.moon.intensity = 1.65;
    rig.moon.color.setHex(0xb0bcc8);
    rig.moon.position.set(-18, 32, 22);
    rig.hemi.intensity = 0.11;
    rig.hemi.color.setHex(0x6a7078);
    rig.hemi.groundColor.setHex(0x4a3e32);
    rig.ambient.intensity = 0.07;
    rig.ambient.color.setHex(0x1a1c20);
  } else {
    rig.moon.intensity = 0.58;
    rig.moon.color.setHex(0x8a94a4);
    rig.moon.position.set(-14, 26, 18);
    rig.hemi.intensity = 0.42;
    rig.hemi.color.setHex(0x3a4048);
    rig.hemi.groundColor.setHex(0x241e18);
    rig.ambient.intensity = 0.22;
    rig.ambient.color.setHex(0x14161a);
  }

  rig.portalSpot.intensity = 58;
  rig.portalSpot.color.setHex(0xf08f38);
  rig.groundBounce.intensity = 14;
  rig.midPortal.intensity = 10;
  rig.topPortal.intensity = 7.5;
  rig.rightGrazing.intensity = 5.5;
}

/** Applique les uniforms godray / bloom de bootstrap (avant la boucle). */
export function applyLandingPostFxBootstrap(
  bootstrap: LandingPostFxBootstrap,
  fog: THREE.FogExp2 | null,
  bloomPass: { strength: number; radius: number; threshold: number } | null,
  godrayPass: { uniforms: Record<string, { value: unknown }> } | null,
) {
  if (fog) fog.density = bootstrap.fogDensity;
  if (bloomPass) {
    bloomPass.strength = bootstrap.bloomStrength;
    bloomPass.radius = bootstrap.bloomRadius;
    bloomPass.threshold = bootstrap.bloomThreshold;
  }
  if (godrayPass) {
    godrayPass.uniforms.uDecay.value = bootstrap.godrayDecay;
    godrayPass.uniforms.uDensity.value = bootstrap.godrayDensity;
    godrayPass.uniforms.uThreshold.value = bootstrap.godrayThreshold;
    if (godrayPass.uniforms.uWeight) {
      godrayPass.uniforms.uWeight.value = bootstrap.godrayWeight ?? 0.14;
    }
  }
}

/** Teintes grade (multiplicateurs RGB) depuis les couleurs d'atmosphère interpolées. */
export function atmosphereColorsToGradeTints(
  shadow: THREE.Color,
  high: THREE.Color,
  shadowMul: THREE.Vector3,
  highMul: THREE.Vector3,
) {
  shadowMul.set(
    0.72 + shadow.r * 0.55,
    0.72 + shadow.g * 0.55,
    0.74 + shadow.b * 0.58,
  );
  highMul.set(
    0.88 + high.r * 0.42,
    0.86 + high.g * 0.4,
    0.82 + high.b * 0.38,
  );
}
