import { GuardianNebula } from "@/features/guardian/components/GuardianNebula";

/** Welcome background — same Guardian visual, idle solid, no audio. */
export function WelcomeQuantumNebula() {
  return <GuardianNebula state="solid" audioSrc={null} autoPlayAudio={false} className="z-0" />;
}
