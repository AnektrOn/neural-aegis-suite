import { forwardRef, useMemo } from "react";
import QuantumNebula from "@/components/ui/quantum-nebula";
import type {
  QuantumNebulaAudioTuning,
  QuantumNebulaHandle,
  QuantumNebulaState,
  QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";

/** Softer than Guardian voice so long music/voice beds stay organic. */
const MEDITATION_AUDIO_TUNING: Partial<QuantumNebulaAudioTuning> = {
  ambientBoomStrength: 0.45,
  boomStrength: 1.15,
  boomForce: 0.008,
  beatThreshold: 0,
  beatAttack: 5,
  beatHold: 2.2,
  boomDecay: 0.78,
  volumeGate: 0,
  silenceThreshold: 0,
  pauseMotionScale: 1,
  midWaveForce: 0.0009,
  trebleJitter: 0.00035,
  bloomBoost: 0.1,
  metatronReveal: 0.38,
  metatronPull: 0.016,
  reflexionAudioScale: 0.22,
};

function resolveParticleCount(): number {
  if (typeof window === "undefined") return 18000;
  const cores = navigator.hardwareConcurrency || 4;
  const small = window.innerWidth < 768 || cores <= 4;
  return small ? 12000 : 24000;
}

interface MeditationNebulaProps {
  state?: QuantumNebulaState;
  audioSrc?: string | null;
  autoPlayAudio?: boolean;
  audioPaused?: boolean;
  onAudioEnded?: () => void;
  onAudioPlay?: () => void;
  onAudioBlocked?: (blocked: boolean) => void;
  onAudioError?: () => void;
  onAudioTimeUpdate?: (currentTimeSec: number) => void;
  className?: string;
}

export const MeditationNebula = forwardRef<QuantumNebulaHandle, MeditationNebulaProps>(
  function MeditationNebula(
    {
      state = "repos",
      audioSrc = null,
      autoPlayAudio = false,
      audioPaused = false,
      onAudioEnded,
      onAudioPlay,
      onAudioBlocked,
      onAudioError,
      onAudioTimeUpdate,
      className = "z-0",
    },
    ref,
  ) {
    const visualTuning = useMemo<Partial<QuantumNebulaVisualTuning>>(
      () => ({ particleCount: resolveParticleCount() }),
      [],
    );

    return (
      <QuantumNebula
        ref={ref}
        fullscreen
        cloudHeightRatio={0.4}
        theme="auto"
        state={state}
        audioSrc={audioSrc}
        autoPlayAudio={autoPlayAudio && Boolean(audioSrc)}
        audioLoop={false}
        audioPaused={audioPaused}
        onAudioEnded={onAudioEnded}
        onAudioPlay={onAudioPlay}
        onAudioBlocked={onAudioBlocked}
        onAudioError={onAudioError}
        onAudioTimeUpdate={onAudioTimeUpdate}
        enableAudioAnalyser
        audioTuning={audioSrc ? MEDITATION_AUDIO_TUNING : undefined}
        visualTuning={visualTuning}
        className={className}
      />
    );
  },
);

MeditationNebula.displayName = "MeditationNebula";
