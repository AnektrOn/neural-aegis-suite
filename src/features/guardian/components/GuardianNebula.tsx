import { lazy, Suspense } from "react";
import type {
  QuantumNebulaAudioTuning,
  QuantumNebulaState,
} from "@/components/ui/quantum-nebula";

const QuantumNebula = lazy(() => import("@/components/ui/quantum-nebula"));

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
  onAudioTimeUpdate?: (currentTimeSec: number) => void;
  className?: string;
  fullscreen?: boolean;
}

/** Product wrapper around Quantum Nebula for the Guardian guide. */
export function GuardianNebula({
  state = "solid",
  audioSrc = null,
  autoPlayAudio = false,
  audioLoop = false,
  audioPaused = false,
  onAudioEnded,
  onAudioPlay,
  onAudioTimeUpdate,
  className = "z-0",
  fullscreen = true,
}: GuardianNebulaProps) {
  return (
    <Suspense fallback={null}>
      <QuantumNebula
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
        onAudioTimeUpdate={onAudioTimeUpdate}
        audioTuning={audioSrc ? GUARDIAN_VOICE_AUDIO_TUNING : undefined}
        className={className}
      />
    </Suspense>
  );
}
