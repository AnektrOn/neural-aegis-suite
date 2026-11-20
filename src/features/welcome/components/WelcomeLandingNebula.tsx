import { QuantumNebulaHeroV3 } from "@/components/ui/quantum-nebula-hero-v3";
import { useWelcomeLandingNebulaWordDrive } from "@/features/welcome/hooks/useWelcomeLandingNebulaWordDrive";
import {
  WELCOME_NEBULA_VISUAL_TUNING,
  WELCOME_NEBULA_WORD,
} from "./WelcomeQuantumNebula";

/** Landing long-scroll (`WelcomeView`) — mot piloté par `welcomeNebulaScrollStory`. */
export function WelcomeLandingNebula() {
  const wordDriveRef = useWelcomeLandingNebulaWordDrive();

  return (
    <QuantumNebulaHeroV3
      fullscreen
      theme="auto"
      state="repos"
      flowMode="vortex"
      visualTuning={WELCOME_NEBULA_VISUAL_TUNING}
      word={WELCOME_NEBULA_WORD}
      wordDriveRef={wordDriveRef}
      passBehindWord
      className="fixed inset-0 z-0"
    />
  );
}