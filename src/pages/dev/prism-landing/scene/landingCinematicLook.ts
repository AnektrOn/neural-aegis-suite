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
  /** Multiplicateur écran (× atmosphere.postFx.godrayStrength × tuning). */
  godrayScreenMul: number;
};

/** Wasteland post-pluie : halation douce, rayons discrets, brouillard homogène. */
export const LANDING_WASTELAND_POST: LandingPostFxBootstrap = {
  fogDensity: 0.0208,
  fogScattering: 2.1,
  bloomStrength: 0.36,
  bloomRadius: 0.9,
  bloomThreshold: 0.91,
  godrayDecay: 0.931,
  godrayDensity: 0.76,
  godrayThreshold: 0.38,
  godrayScreenMul: 0.28,
};

const terrainAnchor = new THREE.Vector3();

/**
 * Éclairage landing : ciel gris-ocre, lune voilée, portail comme seule source chaude forte.
 * Centre les ombres directionnelles sur le terrain compact.
 */
export function applyLandingWastelandLighting(
  rig: LandingLightRig,
  terrainCenterX: number,
  terrainCenterZ: number,
) {
  terrainAnchor.set(terrainCenterX, 0, terrainCenterZ);
  rig.moon.target.position.copy(terrainAnchor);
  rig.moon.intensity = 0.46;
  rig.moon.color.setHex(0x7c8696);
  rig.moon.position.set(-14, 26, 18);

  rig.hemi.intensity = 0.33;
  rig.hemi.color.setHex(0x32363d);
  rig.hemi.groundColor.setHex(0x1c1611);

  rig.ambient.intensity = 0.16;
  rig.ambient.color.setHex(0x14161a);

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
    if (godrayPass.uniforms.uWeight) godrayPass.uniforms.uWeight.value = 0.14;
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
