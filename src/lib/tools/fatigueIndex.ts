import type { CeoProfile } from "./ceoProfile";
import { CEO_ARCHETYPE_LABELS, CEO_STAGE_LABELS } from "./ceoProfile";
import { getFatigueBenchmark, getRelativePercentile } from "./benchmarks";

export interface FatigueInputs {
  postponeScore: number;
  defaultChoiceScore: number;
  saturation: number;
  fogScore: number;
}

export interface FatigueFactor {
  name: string;
  weightedContribution: number;
}

export interface AdvancedFatigueResult {
  index: number;
  riskLevel: string;
  drivers: string[];
  factors: FatigueFactor[];
  benchmark: number | null;
  percentile: number | null;
  sleepMultiplier: number;
  narrative: string;
  actionBullets: string[];
}

const FACTOR_NAMES = {
  postpone: "Reports en fin de journée",
  defaultChoice: "Choix par défaut",
  saturation: "Saturation cognitive",
  fog: "Mental fog",
} as const;

export function calculateAdvancedFatigueIndex(
  inputs: FatigueInputs,
  profile: CeoProfile | null,
): AdvancedFatigueResult {
  let wPostpone = 0.25;
  let wDefault = 0.25;
  let wSaturation = 0.3;
  let wFog = 0.2;

  if (profile?.archetype === "first-time-founder") {
    wSaturation += 0.08;
    wPostpone -= 0.04;
  } else if (profile?.archetype === "serial-entrepreneur") {
    wDefault += 0.1;
    wFog -= 0.05;
  } else if (profile?.archetype === "technical-founder") {
    wSaturation += 0.06;
    wDefault += 0.04;
  } else if (profile?.archetype === "hypergrowth-leader") {
    wSaturation += 0.12;
    wPostpone += 0.03;
  }

  if (profile?.stage === "hypergrowth") {
    wSaturation += 0.1;
  } else if (profile?.stage === "ideation") {
    wPostpone += 0.08;
  }

  const sum = wPostpone + wDefault + wSaturation + wFog;
  wPostpone /= sum;
  wDefault /= sum;
  wSaturation /= sum;
  wFog /= sum;

  const saturationNorm = (inputs.saturation / 10) * 32;
  const sleepMultiplier =
    profile && profile.sleepHours < 6 ? 1.22 : profile && profile.sleepHours < 7 ? 1.1 : 1;

  const factors: FatigueFactor[] = [
    { name: FACTOR_NAMES.postpone, weightedContribution: inputs.postponeScore * wPostpone },
    { name: FACTOR_NAMES.defaultChoice, weightedContribution: inputs.defaultChoiceScore * wDefault },
    { name: FACTOR_NAMES.saturation, weightedContribution: saturationNorm * wSaturation },
    { name: FACTOR_NAMES.fog, weightedContribution: inputs.fogScore * wFog },
  ];

  const rawIndex = factors.reduce((acc, f) => acc + f.weightedContribution, 0);
  const index = Math.min(100, Math.round(rawIndex * sleepMultiplier));

  const sortedDrivers = [...factors].sort((a, b) => b.weightedContribution - a.weightedContribution);
  const drivers = sortedDrivers.slice(0, 2).map((f) => f.name);

  const criticalThreshold =
    profile?.stage === "hypergrowth" || profile?.archetype === "hypergrowth-leader" ? 65 : 75;
  const riskLevel =
    index >= criticalThreshold ? "Critique" : index >= 50 ? "Élevée" : index >= 30 ? "Modérée" : "Maîtrisée";

  const benchmark = getFatigueBenchmark(profile);
  const percentile = benchmark != null ? getRelativePercentile(index, benchmark) : null;

  const narrative = buildFatigueNarrative(index, drivers, profile, benchmark, percentile);
  const actionBullets = buildFatigueActions(index, drivers, profile);

  return {
    index,
    riskLevel,
    drivers,
    factors,
    benchmark,
    percentile,
    sleepMultiplier,
    narrative,
    actionBullets,
  };
}

function buildFatigueNarrative(
  index: number,
  drivers: string[],
  profile: CeoProfile | null,
  benchmark: number | null,
  percentile: number | null,
): string {
  const driverText = drivers.length ? drivers.join(" et ") : "plusieurs signaux";
  let lead = `Vos deux leviers dominants : ${driverText}.`;

  if (profile && benchmark != null && percentile != null) {
    const vs =
      index > benchmark + 5
        ? "au-dessus de la médiane de votre profil"
        : index < benchmark - 5
          ? "en dessous de la médiane de votre profil"
          : "proche de la médiane de votre profil";
    lead = `Score ${index}/100 — ${vs} (médiane ${benchmark} pour ${CEO_ARCHETYPE_LABELS[profile.archetype]} en ${CEO_STAGE_LABELS[profile.stage]}). Percentile estimé : ${percentile}e. ${lead}`;
  }

  if (profile?.archetype === "serial-entrepreneur" && index >= 55) {
    return `${lead} Votre expérience accélère les décisions « évidentes », mais en fin de journée les arbitrages atypiques paient l'addition de la saturation.`;
  }
  if (profile?.archetype === "first-time-founder" && index >= 50) {
    return `${lead} Sans référentiel interne, chaque arbitrage neuf consomme plus de mémoire vive — la fatigue monte plus vite qu'en série.`;
  }
  if (profile?.archetype === "technical-founder") {
    return `${lead} Le passage du détail technique au jugement collectif multiplie les micro-décisions : la fatigue est souvent liée au volume, pas à l'indécision.`;
  }
  if (index >= 50) {
    return `${lead} La mémoire vive est saturée en fin de journée : externaliser le contexte libère de la capacité pour les sujets structurants.`;
  }
  return `${lead} Vous tenez la charge pour l'instant — verrouillez le contexte avant les pics pour éviter l'accumulation invisible.`;
}

function buildFatigueActions(index: number, drivers: string[], profile: CeoProfile | null): string[] {
  const actions: string[] = [];
  if (drivers.includes("Reports en fin de journée")) {
    actions.push("Bloquer 30 min à 16h pour les 3 arbitrages que vous repoussez après 18h.");
  }
  if (drivers.includes("Saturation cognitive") || drivers.includes("Mental fog")) {
    actions.push("Sanctuariser une fenêtre « zéro réunion » sur les sujets à enjeu avant la fin de journée.");
  }
  if (index >= 50) {
    actions.push("Capturer le contexte des décisions repoussées dans un registre unique (état, parties prenantes, options).");
  }
  if (profile && profile.sleepHours < 7) {
    actions.push(
      `Sommeil à ${profile.sleepHours}h : la dette de sommeil amplifie l'indice — traiter le sommeil comme une variable cap table.`,
    );
  }
  if (actions.length < 2) {
    actions.push("Refaire ce test dans 2 semaines pour voir si la tendance monte après un événement structurant.");
  }
  return actions.slice(0, 3);
}