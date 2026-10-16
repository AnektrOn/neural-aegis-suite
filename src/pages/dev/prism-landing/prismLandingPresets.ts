/**
 * Landing sections — scroll overlay + 3D rig keyframes (`prismScrollKeyframes.ts`).
 * Shield GLB stays the same; scroll drives camera + rig (pmndrs camera-scroll pattern).
 */
export type PrismLandingSectionId =
  | "hero"
  | "features"
  | "proof"
  | "cta";

export type PrismLandingSectionPreset = {
  id: PrismLandingSectionId;
  title: string;
  body: string;
  scrollHeightVh: string;
  targetHeight: number;
  position: [number, number, number];
};

export const PRISM_AEGIS_BASE_HEIGHT = 4.85;

export const PRISM_LANDING_PRESETS: Record<
  PrismLandingSectionId,
  PrismLandingSectionPreset
> = {
  hero: {
    id: "hero",
    title: "AEGIS",
    body:
      "Votre égide numérique — hero fixe avec bouclier interactif. Le parcours scroll est l’étape suivante.",
    scrollHeightVh: "160vh",
    targetHeight: PRISM_AEGIS_BASE_HEIGHT,
    position: [0, -0.85, 0],
  },
  features: {
    id: "features",
    title: "Capacités",
    body: "Modules, protocoles et outils — le bouclier reste au centre de la scène.",
    scrollHeightVh: "130vh",
    targetHeight: 4.2,
    position: [0, -0.55, 0],
  },
  proof: {
    id: "proof",
    title: "Preuves",
    body: "Résultats, témoignages et données — le bouclier reste au centre de la scène.",
    scrollHeightVh: "130vh",
    targetHeight: 3.9,
    position: [0, -0.45, 0],
  },
  cta: {
    id: "cta",
    title: "Commencer",
    body: "Rejoignez AEGIS — dernière section avant l’action.",
    scrollHeightVh: "140vh",
    targetHeight: 4.5,
    position: [0, -0.7, 0],
  },
};

export const PRISM_LANDING_SECTIONS: PrismLandingSectionPreset[] = [
  PRISM_LANDING_PRESETS.hero,
  PRISM_LANDING_PRESETS.features,
  PRISM_LANDING_PRESETS.proof,
  PRISM_LANDING_PRESETS.cta,
];

export const DEFAULT_PRISM_LANDING_SECTION: PrismLandingSectionId = "hero";

export function getPrismLandingPreset(
  section: PrismLandingSectionId = DEFAULT_PRISM_LANDING_SECTION,
): PrismLandingSectionPreset {
  return PRISM_LANDING_PRESETS[section];
}
