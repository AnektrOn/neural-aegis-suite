import type { QuantumNebulaVisualTuning } from "@/components/ui/quantum-nebula";

/** Voice agent — sparser cloud than default welcome, slightly livelier drift. */
export function getVoiceAgentNebulaVisualTuning(): Partial<QuantumNebulaVisualTuning> {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return {
    particleCount: mobile ? 13_000 : 24_000,
    sphereRadius: mobile ? 1.1 : 1.45,
    cameraDistance: mobile ? 3.6 : 3.0,
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
