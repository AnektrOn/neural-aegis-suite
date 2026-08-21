/** Evolution Celestial — 3 états visuels (réf. image) */
export type AegisEvolutionState = "seed" | "emerging" | "evolved";

/** Paramètres pour le disque cosmique (état seed uniquement) */
export interface CosmicDiscParams {
  isCosmicDisc: true;
  voidRadius: number;
  amberZoneEnd: number;
  rayZoneStart: number;
  rayIntensity: number;
  spikeCount: number;
  spikeHeight: number;
  colorVoid: [number, number, number];
  colorAmberDark: [number, number, number];
  colorAmberBright: [number, number, number];
  colorAmberHot: [number, number, number];
  colorRayWhite: [number, number, number];
  colorRaySilver: [number, number, number];
  animateLayers: boolean;
}

/** Paramètres pour les sphères (états emerging/evolved) */
export interface SphereEvolutionParams {
  isCosmicDisc?: false;
  displacementScale: number;
  stripesFrequency: number;
  stripeSharpness: number;
  noiseWeight: number;
  noiseScale: number;
  polarHigh: number;
  polarLow: number;
  equatorFlare: number;
  /** 0 = coque verre parfaitement lisse */
  shellDisplacementScale: number;
  animateLayers: boolean;
}

export type AegisEvolutionParams = CosmicDiscParams | SphereEvolutionParams;

export function isCosmicDiscParams(params: AegisEvolutionParams): params is CosmicDiscParams {
  return (params as CosmicDiscParams).isCosmicDisc === true;
}

export const EVOLUTION_STATES: Record<AegisEvolutionState, AegisEvolutionParams> = {
  /** État Seed: Disque cosmique "020 VOXED" - iris avec vide central et rayons cristallins */
  seed: {
    isCosmicDisc: true,
    voidRadius: 0.055,
    amberZoneEnd: 0.24,
    rayZoneStart: 0.32,
    rayIntensity: 1.4,
    spikeCount: 100,
    spikeHeight: 0.12,
    colorVoid: [0.0, 0.0, 0.0],
    colorAmberDark: [0.22, 0.10, 0.03],
    colorAmberBright: [0.92, 0.58, 0.18],
    colorAmberHot: [1.0, 0.78, 0.32],
    colorRayWhite: [0.98, 0.97, 0.95],
    colorRaySilver: [0.82, 0.85, 0.88],
    animateLayers: true,
  },
  /** Réf. premium — noyau stratifié dense, coque verre lisse */
  emerging: {
    isCosmicDisc: false,
    displacementScale: 0.24,
    stripesFrequency: 52,
    stripeSharpness: 0.82,
    noiseWeight: 0.48,
    noiseScale: 4.2,
    polarHigh: 1,
    polarLow: 0.44,
    equatorFlare: 0.08,
    shellDisplacementScale: 0,
    animateLayers: false,
  },
  evolved: {
    isCosmicDisc: false,
    displacementScale: 0.38,
    stripesFrequency: 58,
    stripeSharpness: 0.94,
    noiseWeight: 0.52,
    noiseScale: 4.8,
    polarHigh: 0.94,
    polarLow: 0.08,
    equatorFlare: 1.25,
    shellDisplacementScale: 0.16,
    animateLayers: true,
  },
};

export const EVOLUTION_LABELS: Record<AegisEvolutionState, { fr: string; en: string }> = {
  seed: { fr: "Graine", en: "Seed" },
  emerging: { fr: "Émergence", en: "Emerging" },
  evolved: { fr: "Évolué", en: "Evolved" },
};

export function getEvolutionParams(state: AegisEvolutionState): AegisEvolutionParams {
  return EVOLUTION_STATES[state];
}
