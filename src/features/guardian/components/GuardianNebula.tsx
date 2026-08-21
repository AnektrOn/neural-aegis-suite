import { forwardRef } from "react";
import QuantumNebula from "@/components/ui/quantum-nebula";
import type {
  QuantumNebulaAudioTuning,
  QuantumNebulaHandle,
  QuantumNebulaState,
} from "@/components/ui/quantum-nebula";

/** Voice-friendly tuning so spoken guide still drives visible mouvement. */
const GUARDIAN_VOICE_AUDIO_TUNING: Partial<QuantumNebulaAudioTuning> = {
  ambientBoomStrength: 0.55,
  boomStrength: 1.35,
  boomForce: 0.01,
  beatThreshold: 0,
  beatAttack: 6,
  beatHold: 1.8,
  boomDecay: 0.72,
  volumeGate: 0,
  silenceThreshold: 0,
  pauseMotionScale: 1,
  midWaveForce: 0.0012,
  trebleJitter: 0.0004,
  bloomBoost: 0.12,
  metatronReveal: 0.45,
  metatronPull: 0.02,
  reflexionAudioScale: 0.24,
};

interface GuardianNebulaProps {
  state?: QuantumNebulaState;
  audioSrc?: string | null;
  autoPlayAudio?: boolean;
  audioLoop?: boolean;
  audioPaused?: boolean;
  onAudioEnded?: () => void;
  onAudioPlay?: () => void;
  onAudioBlocked?: (blocked: boolean) => void;
  onAudioError?: () => void;
  onAudioTimeUpdate?: (currentTimeSec: number) => void;
  className?: string;
  fullscreen?: boolean;
}

/** Product wrapper around Quantum Nebula for the Guardian guide. */
export const GuardianNebula = forwardRef<QuantumNebulaHandle, GuardianNebulaProps>(function GuardianNebula({
  state = "solid",
  audioSrc = null,
  autoPlayAudio = false,
  audioLoop = false,
  audioPaused = false,
  onAudioEnded,
  onAudioPlay,
  onAudioBlocked,
  onAudioError,
  onAudioTimeUpdate,
  className = "z-0",
  fullscreen = true,
}, ref) {
  return (
    <QuantumNebula
      ref={ref}
        fullscreen={fullscreen}
        cloudHeightRatio={0.4}
        theme="auto"
        state={state}
        audioSrc={audioSrc}
        autoPlayAudio={autoPlayAudio && Boolean(audioSrc)}
        audioLoop={audioLoop}
        audioPaused={audioPaused}
        onAudioEnded={onAudioEnded}
        onAudioPlay={onAudioPlay}
        onAudioBlocked={onAudioBlocked}
        onAudioError={onAudioError}
        onAudioTimeUpdate={onAudioTimeUpdate}
        enableAudioAnalyser={false}
        audioTuning={audioSrc ? GUARDIAN_VOICE_AUDIO_TUNING : undefined}
        className={className}
      />
  );
});

GuardianNebula.displayName = "GuardianNebula";
