import { forwardRef, useMemo } from "react";
import QuantumNebula from "@/components/ui/quantum-nebula";
import type {
  QuantumNebulaHandle,
  QuantumNebulaParticlePalette,
  QuantumNebulaState,
  QuantumNebulaFigure,
} from "@/components/ui/quantum-nebula";
import type { ToolboxNebulaPreset } from "./toolboxNebulaPresets";
import {
  TOOLBOX_PARTICLE_PALETTE,
  TOOLBOX_PARTICLE_VISUAL,
} from "./toolboxParticlePalette";

function resolveParticleCount(): number {
  if (typeof window === "undefined") return 12000;
  const cores = navigator.hardwareConcurrency || 4;
  const small = window.innerWidth < 768 || cores <= 4;
  return small ? 10000 : 18000;
}

export interface ToolboxNebulaProps {
  preset: ToolboxNebulaPreset;
  stateOverride?: QuantumNebulaState;
  figureOverride?: QuantumNebulaFigure;
  audioSrc?: string | null;
  autoPlayAudio?: boolean;
  audioPaused?: boolean;
  className?: string;
  fullscreen?: boolean;
  /** Defaults to toolbox violet/rose palette (distinct from Guardian). */
  particlePalette?: QuantumNebulaParticlePalette;
}

/** Product wrapper around Quantum Nebula for toolbox exercises. */
export const ToolboxNebula = forwardRef<QuantumNebulaHandle, ToolboxNebulaProps>(
  function ToolboxNebula(
    {
      preset,
      stateOverride,
      figureOverride,
      audioSrc = null,
      autoPlayAudio = false,
      audioPaused = false,
      className = "z-0",
      fullscreen = false,
      particlePalette = TOOLBOX_PARTICLE_PALETTE,
    },
    ref,
  ) {
    const visualTuning = useMemo(
      () => ({
        particleCount: resolveParticleCount(),
        ...TOOLBOX_PARTICLE_VISUAL,
        ...preset.visualTuning,
      }),
      [preset.visualTuning],
    );

    return (
      <QuantumNebula
        ref={ref}
        fullscreen={fullscreen}
        cloudHeightRatio={preset.cloudHeightRatio ?? 0.4}
        theme="auto"
        state={stateOverride ?? preset.state}
        figure={figureOverride ?? preset.figure}
        audioSrc={audioSrc}
        autoPlayAudio={autoPlayAudio && Boolean(audioSrc)}
        audioPaused={audioPaused}
        enableAudioAnalyser={Boolean(audioSrc)}
        audioTuning={audioSrc ? preset.audioTuning : undefined}
        visualTuning={visualTuning}
        particlePalette={particlePalette}
        className={className}
      />
    );
  },
);
