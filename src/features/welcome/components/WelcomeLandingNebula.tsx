import { QuantumNebulaHeroV3 } from "@/components/ui/quantum-nebula-hero-v3";
import { useWelcomeLandingNebulaWordDrive } from "@/features/welcome/hooks/useWelcomeLandingNebulaWordDrive";
import {
  LANDING_NEBULA_VISUAL_TUNING,
  LANDING_NEBULA_WORD,
} from "@/features/welcome/welcomeLandingNebulaConfig";

/** Landing long-scroll (`WelcomeView`) — mot piloté par `welcomeNebulaScrollStory`. */
export function WelcomeLandingNebula() {
  const wordDriveRef = useWelcomeLandingNebulaWordDrive();

  return (
    <QuantumNebulaHeroV3
      fullscreen
      theme="auto"
      state="repos"
      flowMode="vortex"
      visualTuning={LANDING_NEBULA_VISUAL_TUNING}
      word={LANDING_NEBULA_WORD}
      wordDriveRef={wordDriveRef}
      passBehindWord
      className="fixed inset-0 z-0"
    />
  );
}