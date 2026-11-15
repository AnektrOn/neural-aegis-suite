import { getCrossToolInsights, type CrossToolInsights } from "./toolsMemory";

export function generateMetaInsight(insights: CrossToolInsights): string | null {
  if (
    insights.fatigueIndex != null &&
    insights.fatigueIndex > 60 &&
    insights.contextSwitchHoursPerWeek != null &&
    insights.contextSwitchHoursPerWeek > 6
  ) {
    return `Pattern « boucle d'épuisement » : fatigue à ${insights.fatigueIndex}/100 et ${insights.contextSwitchHoursPerWeek.toFixed(1)} h/semaine perdues en bascules. Priorité : réduire les cercles decisionnels avant d'ajouter des arbitrages.`;
  }

  if (
    insights.stackRunrateMonthly != null &&
    insights.stackRunrateMonthly > 500 &&
    insights.fatigueIndex != null &&
    insights.fatigueIndex > 50
  ) {
    return `Stack fragmentée (~${Math.round(insights.stackRunrateMonthly)} €/mois) + fatigue modérée : la dispersion d'outils amplifie probablement la charge cognitive.`;
  }

  if (insights.wasteScore != null && insights.wasteScore > 55 && insights.stackRunrateMonthly != null) {
    return `Second brain en mode stockage (${insights.wasteScore}% de gaspillage estimé) alors que vous payez déjà ${Math.round(insights.stackRunrateMonthly)} €/mois d'outils — même symptôme, deux factures.`;
  }

  if (
    insights.biasClarity != null &&
    insights.biasClarity < 45 &&
    insights.delayCost != null &&
    insights.delayCost > 50000
  ) {
    return `Décision encore floue (${insights.biasClarity}% de clarté) alors que l'inaction coûte déjà cher — le reframe seul ne suffit pas : il faut une trace et une échéance.`;
  }

  return null;
}

export function getActiveMetaInsight(): string | null {
  return generateMetaInsight(getCrossToolInsights());
}