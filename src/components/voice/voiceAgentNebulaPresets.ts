import type { QuantumNebulaVisualTuning } from "@/components/ui/quantum-nebula";

/** Voice agent — sparser cloud than default welcome, slightly livelier drift. */
export function getVoiceAgentNebulaVisualTuning(): Partial<QuantumNebulaVisualTuning> {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return {
    particleCount: mobile ? 6_500 : 12_000,
    sphereRadius: 1.1,
    cameraDistance: 3.6,
    noiseSpeed: 0.082,
    noiseScale: 1.28,
    baseForce: 0.00072,
    solidRotation: 0.00052,
    reflexionPulseSpeed: 2.15,
    reflexionWave: 0.052,
    mouvementAmbientPulseSpeed: 2.05,
    mouvementAmbientPulseStrength: 0.16,
    mouvementOrbital: 0.00072,
    mouvementRotation: 0.00068,
    mouvementShimmerSpeed: 1.35,
  };
}
