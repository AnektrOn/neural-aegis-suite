import type { PlanTier } from "@/hooks/useSubscription";
import { formatAvgHours } from "@/lib/decisionAnalytics";
import type { BioNodeId } from "./types";
import { pickHeroConstat, type HeroConstatLocale } from "./pickHeroConstat";
import type { BioExecutiveHeroData } from "./useBioExecutiveHero";

export type ExocortexHeroNodeUi = {
  label: string;
  metric: string;
  unit: string;
  statusChip: string | null;
  detailLines: string[];
  desc: string;
  locked: boolean;
};

export type ExocortexHeroUi = {
  tier: PlanTier;
  statusLine: string;
  constatTitle: string;
  nodes: Record<BioNodeId, ExocortexHeroNodeUi>;
  showMemoryQuerySoon: boolean;
};

function formatDeferralDate(iso: string, locale: HeroConstatLocale): string {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  return new Date(iso).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });
}

function formatStressDelta(delta: number, locale: HeroConstatLocale): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const abs = Math.abs(delta).toFixed(1).replace(/\.0$/, "");
  return locale === "fr"
    ? `${sign}${abs} vs votre moyenne`
    : `${sign}${abs} vs your average`;
}

export function buildExocortexStatusLine(
  data: BioExecutiveHeroData,
  locale: HeroConstatLocale,
): string {
  const isFr = locale === "fr";
  const parts: string[] = [isFr ? "EXOCORTEX" : "EXOCORTEX"];
  if (data.memoryDays != null) {
    parts.push(
      isFr
        ? `DEPUIS ${data.memoryDays} JOUR${data.memoryDays > 1 ? "S" : ""}`
        : `FOR ${data.memoryDays} DAY${data.memoryDays > 1 ? "S" : ""}`,
    );
  }
  if (data.decisionsCount != null) {
    parts.push(
      isFr
        ? `${data.decisionsCount} DÉCISION${data.decisionsCount > 1 ? "S" : ""}`
        : `${data.decisionsCount} DECISION${data.decisionsCount > 1 ? "S" : ""}`,
    );
  }
  if (data.contactsCount != null) {
    parts.push(
      isFr
        ? `${data.contactsCount} RELATION${data.contactsCount > 1 ? "S" : ""}`
        : `${data.contactsCount} RELATION${data.contactsCount > 1 ? "S" : ""}`,
    );
  }
  if (data.placesCount != null) {
    parts.push(
      isFr
        ? `${data.placesCount} LIEU${data.placesCount > 1 ? "X" : ""}`
        : `${data.placesCount} PLACE${data.placesCount > 1 ? "S" : ""}`,
    );
  }
  return parts.join(" · ");
}

function buildDecisionNode(data: BioExecutiveHeroData, locale: HeroConstatLocale): ExocortexHeroNodeUi {
  const isFr = locale === "fr";
  const lines: string[] = [];
  const parts: string[] = [];
  if (data.pendingCount != null) {
    parts.push(isFr ? `${data.pendingCount} en attente` : `${data.pendingCount} pending`);
  }
  if (data.maxPendingPriority != null) {
    parts.push(
      isFr
        ? `priorité max ${data.maxPendingPriority}`
        : `max priority ${data.maxPendingPriority}`,
    );
  }
  if (parts.length > 0) lines.push(parts.join(" · "));
  if (data.nextDeferralDate) {
    lines.push(
      isFr
        ? `prochain report : ${formatDeferralDate(data.nextDeferralDate, locale)}`
        : `next deferral: ${formatDeferralDate(data.nextDeferralDate, locale)}`,
    );
  }
  if (data.avgResolutionHours != null) {
    lines.push(
      isFr
        ? `Résolution moyenne : ${formatAvgHours(data.avgResolutionHours, locale)}`
        : `Average resolution: ${formatAvgHours(data.avgResolutionHours, locale)}`,
    );
  }

  const metric =
    data.oldestPendingDays != null ? String(data.oldestPendingDays) : "";
  const unit = data.oldestPendingDays != null ? (isFr ? " j" : " d") : "";

  return {
    label: isFr ? "Décision" : "Decision",
    metric,
    unit,
    statusChip: data.pendingCount != null ? lines[0] ?? null : null,
    detailLines: lines,
    desc: lines.join(" · ") || (isFr ? "Décisions" : "Decisions"),
    locked: data.tier === "free",
  };
}

function buildRelationsNode(data: BioExecutiveHeroData, locale: HeroConstatLocale): ExocortexHeroNodeUi {
  const isFr = locale === "fr";
  const total = data.relationsTotal;
  const metric = total != null ? String(total) : "";
  const unit = total != null ? (isFr ? " relations" : " relations") : "";
  const desc =
    total != null
      ? isFr
        ? `${total} relation${total > 1 ? "s" : ""}`
        : `${total} relation${total > 1 ? "s" : ""}`
      : isFr
        ? "Relations"
        : "Relations";

  return {
    label: isFr ? "Relations" : "Relations",
    metric,
    unit,
    statusChip: null,
    detailLines: [],
    desc,
    locked: data.tier === "free",
  };
}

function buildSoiNode(data: BioExecutiveHeroData, locale: HeroConstatLocale): ExocortexHeroNodeUi {
  const isFr = locale === "fr";
  const lines: string[] = [];
  if (data.stressVsOwnAvg != null) {
    lines.push(formatStressDelta(data.stressVsOwnAvg, locale));
  }
  if (data.loggedDaysOf14 != null) {
    lines.push(
      isFr
        ? `${data.loggedDaysOf14} jours sur 14`
        : `${data.loggedDaysOf14} days of 14`,
    );
  }

  const metric = data.stress != null ? data.stress.toFixed(1).replace(/\.0$/, "") : "";
  const unit = data.stress != null ? "/10" : "";

  return {
    label: isFr ? "Soi" : "Self",
    metric,
    unit,
    statusChip: data.stress != null ? (isFr ? `Stress ${metric}/10` : `Stress ${metric}/10`) : null,
    detailLines: lines,
    desc: lines.join(" · ") || (isFr ? "Clarté personnelle" : "Personal clarity"),
    locked: false,
  };
}

export function buildExocortexHeroUi(
  data: BioExecutiveHeroData,
  locale: HeroConstatLocale,
): ExocortexHeroUi {
  return {
    tier: data.tier,
    statusLine: buildExocortexStatusLine(data, locale),
    constatTitle: pickHeroConstat(
      {
        tier: data.tier,
        reportReady: data.reportReady,
        pendingCount: data.pendingCount,
        oldestPendingDays: data.oldestPendingDays,
        lastContactDays: data.lastContactDays,
      },
      locale,
    ),
    nodes: {
      brain: buildDecisionNode(data, locale),
      heart: buildRelationsNode(data, locale),
      solar: buildSoiNode(data, locale),
    },
    showMemoryQuerySoon: data.tier === "ultra",
  };
}
