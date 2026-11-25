import type { OnboardingStep } from "@/store/useOnboardingStore";
import { CURATED_DILEMMA_KEYS } from "../components/steps/Step5DecisionDilemmas";

export function microStepToLegacyStep(micro: number): OnboardingStep {
  if (micro <= 5) return 1;
  if (micro === 6) return 2;
  if (micro === 7) return 3;
  if (micro === 8) return 4;
  return 5;
}

export function dilemmaKeyForMicroStep(micro: number): (typeof CURATED_DILEMMA_KEYS)[number] | null {
  if (micro === 9) return "q1";
  if (micro === 10) return "q2";
  if (micro === 11) return "q3";
  return null;
}