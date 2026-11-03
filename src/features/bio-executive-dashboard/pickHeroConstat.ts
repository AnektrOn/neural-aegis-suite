import type { PlanTier } from "@/hooks/useSubscription";

export type HeroConstatLocale = "fr" | "en";

export type HeroConstatContext = {
  tier: PlanTier;
  /** Gratuit : rapport archétype / évaluation disponible */
  reportReady?: boolean;
  pendingCount: number | null;
  oldestPendingDays: number | null;
  lastContactDays: number | null;
};

export function pickHeroConstat(ctx: HeroConstatContext, locale: HeroConstatLocale): string {
  const isFr = locale === "fr";

  if (ctx.tier === "free") {
    if (ctx.reportReady) {
      return isFr ? "Votre rapport est prêt" : "Your report is ready";
    }
    return isFr ? "Votre rapport est en préparation" : "Your report is being prepared";
  }

  const pending = ctx.pendingCount;
  const oldest = ctx.oldestPendingDays;

  if (oldest != null && oldest > 7 && pending != null && pending > 0) {
    return isFr
      ? `${pending} décision${pending > 1 ? "s" : ""} attend${pending > 1 ? "ent" : ""}. La plus ancienne : ${oldest} jour${oldest > 1 ? "s" : ""}.`
      : `${pending} decision${pending > 1 ? "s" : ""} pending. Oldest: ${oldest} day${oldest > 1 ? "s" : ""}.`;
  }

  if (pending != null && pending > 5) {
    return isFr
      ? `${pending} décisions ouvertes.`
      : `${pending} open decisions.`;
  }

  if (ctx.lastContactDays != null && ctx.lastContactDays > 14) {
    const d = ctx.lastContactDays;
    return isFr
      ? `Aucune relation mise à jour depuis ${d} jour${d > 1 ? "s" : ""}.`
      : `No relationship updated in ${d} day${d > 1 ? "s" : ""}.`;
  }

  return isFr ? "Aucune décision en attente. Mémoire à jour." : "No pending decisions. Memory up to date.";
}
