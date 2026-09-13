import type {
  QuantumNebulaParticlePalette,
  QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";

/** Violet / rose — bright enough for additive blending on dark glass. */
export const TOOLBOX_PARTICLE_PALETTE: QuantumNebulaParticlePalette = {
  dark: { dominant: 0xd4a5ff, accent: 0xff8fd0 },
  light: { dominant: 0x3d2066, accent: 0xf0abfc },
};

export const TOOLBOX_PARTICLE_VISUAL: Partial<QuantumNebulaVisualTuning> = {
  bloomStrength: 0.58,
  bloomRadius: 0.42,
  mouvementAmbientPulseStrength: 0.16,
  mouvementBassPulse: 0.28,
  reflexionBloomStrength: 0.72,
};
