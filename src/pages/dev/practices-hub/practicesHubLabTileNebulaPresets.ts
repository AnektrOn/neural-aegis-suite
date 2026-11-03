import type {
  QuantumNebulaAudioTuning,
  QuantumNebulaFigure,
  QuantumNebulaParticlePalette,
  QuantumNebulaState,
  QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";
import type { PracticesHubTileId } from "@/features/practices-hub/practicesHubTiles";

/** AEGIS tokens — bronze primary + wellness gold accent (dark), ink + warm (light). */
export const PRACTICES_HUB_LAB_NEBULA_PALETTE: QuantumNebulaParticlePalette = {
  dark: { dominant: 0xd4aa78, accent: 0xe8b923 },
  light: { dominant: 0x121212, accent: 0xc9922a },
};

/** Same baseline as WelcomeQuantumNebula — scaled down for tile embeds. */
const WELCOME_VISUAL_BASE: Partial<QuantumNebulaVisualTuning> = {
  sphereRadius: 1.1,
  cameraDistance: 3.6,
  bloomStrength: 0.52,
  bloomRadius: 0.38,
};

export type PracticesHubLabTileNebulaPreset = {
  state: QuantumNebulaState;
  figure?: QuantumNebulaFigure;
  visualTuning: Partial<QuantumNebulaVisualTuning>;
  audioTuning?: Partial<QuantumNebulaAudioTuning>;
};

function resolveTileParticleCount(): number {
  if (typeof window === "undefined") return 6500;
  const cores = navigator.hardwareConcurrency || 4;
  const small = window.innerWidth < 768 || cores <= 4;
  return small ? 5500 : 8000;
}

export function getPracticesHubLabTileNebulaPreset(
  tileId: PracticesHubTileId,
): PracticesHubLabTileNebulaPreset {
  const particleCount = resolveTileParticleCount();

  const presets: Record<
    PracticesHubTileId,
    Omit<PracticesHubLabTileNebulaPreset, "visualTuning"> & {
      visualTuning: Partial<QuantumNebulaVisualTuning>;
    }
  > = {
    habits: {
      state: "mouvement",
      visualTuning: {
        ...WELCOME_VISUAL_BASE,
        particleCount,
        mouvementAmbientPulseSpeed: 0.95,
        mouvementAmbientPulseStrength: 0.12,
        mouvementOrbital: 0.55,
        solidRotation: 0.1,
      },
    },
    toolbox: {
      state: "reflexion",
      figure: "metatron",
      visualTuning: {
        ...WELCOME_VISUAL_BASE,
        particleCount,
        reflexionPulseSpeed: 0.62,
        reflexionWave: 0.55,
        reflexionBloomStrength: 0.72,
        bloomStrength: 0.58,
      },
    },
    pulse: {
      state: "mouvement",
      audioTuning: {
        pulsePattern: "ripple",
        ambientBoomStrength: 0.42,
        boomWaveFrequency: 0.55,
        boomWaveSpeed: 0.28,
        rippleSharpness: 6,
      },
      visualTuning: {
        ...WELCOME_VISUAL_BASE,
        particleCount,
        mouvementAmbientPulseSpeed: 1.25,
        mouvementAmbientPulseStrength: 0.18,
        mouvementShimmerSpeed: 0.95,
      },
    },
    bibliotheque: {
      state: "reflexion",
      visualTuning: {
        ...WELCOME_VISUAL_BASE,
        particleCount,
        reflexionPulseSpeed: 0.62,
        reflexionWave: 0.48,
        reflexionBloomStrength: 0.68,
      },
    },
    dien_chan: {
      state: "mouvement",
      visualTuning: {
        ...WELCOME_VISUAL_BASE,
        particleCount,
        mouvementOrbital: 0.75,
        mouvementAmbientPulseSpeed: 0.85,
        mouvementAmbientPulseStrength: 0.14,
        mouvementBassPulse: 0.2,
        sphereRadius: 1.05,
      },
    },
  };

  return presets[tileId];
}
