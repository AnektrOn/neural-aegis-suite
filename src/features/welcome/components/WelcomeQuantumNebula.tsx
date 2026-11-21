import QuantumNebula, {
  type QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";

/** Welcome membre (`/welcome`) — nuage repos, sans mot (typo HUD). */
export const WELCOME_NEBULA_VISUAL_TUNING: Partial<QuantumNebulaVisualTuning> = {
  sphereRadius: 1.1,
  cameraDistance: 3.6,
};

export function WelcomeQuantumNebula() {
  return (
    <QuantumNebula
      fullscreen
      theme="auto"
      state="repos"
      audioSrc={null}
      autoPlayAudio={false}
      visualTuning={WELCOME_NEBULA_VISUAL_TUNING}
      className="z-0"
    />
  );
}