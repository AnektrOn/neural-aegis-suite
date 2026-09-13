import QuantumNebula from "@/components/ui/quantum-nebula";

/** Welcome — nuage repos plus grand que le Gardien (plein viewport). */
export function WelcomeQuantumNebula() {
  return (
    <QuantumNebula
      fullscreen
      theme="auto"
      state="repos"
      audioSrc={null}
      autoPlayAudio={false}
      visualTuning={{
        sphereRadius: 1.1,
        cameraDistance: 3.6,
      }}
      className="z-0"
    />
  );
}
