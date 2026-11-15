import type { CeoProfile } from "./ceoProfile";
import { getContextSwitchBenchmark, getRelativePercentile } from "./benchmarks";

export interface ContextSwitchInputs {
  switchesPerDay: number;
  recoveryMin: number;
  daysPerWeek: number;
  hourlyRate: number;
}

export interface ContextSwitchResult {
  hoursPerWeek: number;
  hoursPerYear: number;
  costPerYear: number;
  effectiveRecoveryMin: number;
  benchmarkHours: number | null;
  percentile: number | null;
  narrative: string;
  overloadLabel: string;
}

export function calculateContextSwitch(
  inputs: ContextSwitchInputs,
  profile: CeoProfile | null,
): ContextSwitchResult {
  let recoveryMultiplier = 1;
  if (profile?.stage === "hypergrowth" || profile?.archetype === "hypergrowth-leader") {
    recoveryMultiplier = 1.15;
  } else if (profile?.archetype === "corporate-escapee") {
    recoveryMultiplier = 1.08;
  }
  if (profile && profile.sleepHours < 6) {
    recoveryMultiplier *= 1.12;
  } else if (profile && profile.sleepHours < 7) {
    recoveryMultiplier *= 1.06;
  }

  const effectiveRecoveryMin = inputs.recoveryMin * recoveryMultiplier;
  const hoursPerWeek = (inputs.switchesPerDay * effectiveRecoveryMin * inputs.daysPerWeek) / 60;
  const hoursPerYear = hoursPerWeek * 48;
  const costPerYear = hoursPerYear * inputs.hourlyRate;

  const benchmarkHours = getContextSwitchBenchmark(profile);
  const percentile =
    benchmarkHours != null ? getRelativePercentile(hoursPerWeek, benchmarkHours) : null;

  const overloadLabel =
    hoursPerWeek >= 10 ? "Overload critique" : hoursPerWeek >= 6 ? "Overload élevé" : "Modéré";

  let narrative: string;
  if (profile?.archetype === "technical-founder" && hoursPerWeek >= 6) {
    narrative =
      "Les bascules code → board → équipe forcent une reconstitution mentale à chaque cercle. Un fil décisionnel unique évite de « recompiler » le contexte à chaque fois.";
  } else if (benchmarkHours != null && percentile != null && hoursPerWeek > benchmarkHours + 1.5) {
    narrative = `Vous perdez ${hoursPerWeek.toFixed(1)} h/semaine — au-dessus de la médiane (${benchmarkHours} h) pour votre profil (percentile ~${percentile}e). La dispersion des cercles décisionnels est probablement votre premier levier.`;
  } else if (hoursPerWeek >= 6) {
    narrative =
      "Overload cognitif élevé : chaque bascule efface une partie du fil précédent. Consolider décisions, personnes et états réduit la reconstitution manuelle.";
  } else {
    narrative =
      "Pertes modérées mais récurrentes : sans mémoire externe, vous repayez le même contexte chaque semaine.";
  }

  return {
    hoursPerWeek,
    hoursPerYear,
    costPerYear,
    effectiveRecoveryMin,
    benchmarkHours,
    percentile,
    narrative,
    overloadLabel,
  };
}