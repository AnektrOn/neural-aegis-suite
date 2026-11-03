import type { WeeklyDigest } from "@/pages/dashboard/dashboard-shared";
import type { AegisHealthScore } from "@/types/aegisHealth";
import type {
  BioExecutiveMoodVitals,
  BioExecutiveOpenDecisionItem,
  BioExecutivePendingDecision,
  BioExecutiveViewModel,
} from "./types";

const DEFAULT_SLEEP_GOAL_H = 8;

export type BuildBioExecutiveInput = {
  locale: "fr" | "en";
  sessionLabel: string;
  digest: WeeklyDigest | null;
  moodAvg: string;
  openDecisions: string;
  aegisScore: AegisHealthScore | null;
  aegisScoreDelta: number;
  habitProgressPct: number;
  /** @deprecated Prefer openDecisionItems */
  firstOpenDecisionName?: string;
  journalSnippet?: string | null;
  moodVitals?: BioExecutiveMoodVitals | null;
  oldestDecisionDays?: number;
  maxDecisionPriority?: number;
  scoreTrendSparkline?: number[];
  openDecisionItems?: BioExecutiveOpenDecisionItem[];
  pulseCard?: BioExecutiveViewModel["pulseCard"];
  toolboxInbox?: Partial<BioExecutiveViewModel["toolboxInbox"]>;
  adminMessage?: BioExecutiveViewModel["adminMessage"];
  messageOfTheDay?: BioExecutiveViewModel["messageOfTheDay"];
};

function sortOpenDecisions(items: BioExecutiveOpenDecisionItem[]): BioExecutiveOpenDecisionItem[] {
  return [...items].sort((a, b) => b.priority - a.priority || b.ageDays - a.ageDays);
}

function resolveOpenDecisionItems(input: BuildBioExecutiveInput): BioExecutiveOpenDecisionItem[] {
  if (input.openDecisionItems?.length) {
    return sortOpenDecisions(input.openDecisionItems);
  }
  const count = Number(input.openDecisions) || 0;
  if (input.firstOpenDecisionName) {
    return [
      {
        id: "legacy-primary",
        name: input.firstOpenDecisionName,
        priority: input.maxDecisionPriority ?? 0,
        ageDays: input.oldestDecisionDays ?? 0,
      },
    ];
  }
  if (count > 0) {
    return [
      {
        id: "legacy-count",
        name: input.locale === "fr" ? `${count} décision(s) ouverte(s)` : `${count} open decision(s)`,
        priority: input.maxDecisionPriority ?? 0,
        ageDays: input.oldestDecisionDays ?? 0,
      },
    ];
  }
  return [];
}

function toPendingDecision(item: BioExecutiveOpenDecisionItem | undefined): BioExecutivePendingDecision | null {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    ageDays: item.ageDays,
    priority: item.priority,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatSleepHours(h: number, isFr: boolean): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins <= 0) return isFr ? `${hrs}h` : `${hrs}h`;
  return isFr ? `${hrs}h${String(mins).padStart(2, "0")}` : `${hrs}h ${mins}m`;
}

function stressStatus(stress: number | null, isFr: boolean): string {
  if (stress == null) return isFr ? "Stable" : "Stable";
  if (stress <= 3) return isFr ? "Calme" : "Calm";
  if (stress <= 6) return isFr ? "Modéré" : "Moderate";
  return isFr ? "Élevé" : "High";
}

function moodAlignStatus(trend: WeeklyDigest["moodTrend"] | undefined, isFr: boolean): string {
  if (trend === "up") return isFr ? "En hausse" : "Rising";
  if (trend === "down") return isFr ? "En baisse" : "Softening";
  return isFr ? "Aligné" : "Aligned";
}

function computeDecisionLoad(input: BuildBioExecutiveInput): { display: string; subtitle: string } {
  const isFr = input.locale === "fr";
  const openDec = Number(input.openDecisions) || 0;
  const resolved = input.digest?.decisionsResolved ?? 0;
  const oldest = input.oldestDecisionDays ?? 0;
  const priority = input.maxDecisionPriority ?? 0;
  const decisionScore = input.aegisScore?.decision_score;

  let display: string;
  if (decisionScore != null && decisionScore > 0) {
    display = ((100 - decisionScore) / 10).toFixed(1);
  } else {
    const raw = openDec * 0.45 + Math.min(oldest, 21) * 0.08 + priority * 0.12;
    display = Math.min(10, raw).toFixed(1);
  }

  const parts: string[] = [];
  if (openDec > 0) {
    parts.push(
      isFr
        ? `${openDec} ouverte${openDec > 1 ? "s" : ""}`
        : `${openDec} open`,
    );
  }
  if (oldest > 0) {
    parts.push(isFr ? `plus ancienne ${oldest} j` : `oldest ${oldest}d`);
  }
  if (resolved > 0) {
    parts.push(isFr ? `${resolved} résolue${resolved > 1 ? "s" : ""} (7 j)` : `${resolved} resolved (7d)`);
  }

  const subtitle =
    parts.length > 0
      ? parts.join(" · ")
      : isFr
        ? "Aucune décision ouverte"
        : "No open decisions";

  return { display, subtitle };
}

export function buildBioExecutiveViewModel(input: BuildBioExecutiveInput): BioExecutiveViewModel {
  const isFr = input.locale === "fr";
  const moodNum = input.moodAvg === "—" ? 0 : Number(input.moodAvg) || 0;
  const habitRate = input.digest?.habitRate ?? input.habitProgressPct;
  const streak = input.digest?.streakDays ?? 0;
  const overall = input.aegisScore?.overall_score ?? habitRate;
  const level = Math.max(1, Math.floor(overall / 50) + 1);

  const moodScore = input.aegisScore?.mood_score;
  const habitScore = input.aegisScore?.habit_score;
  const logRegularity = input.aegisScore?.log_regularity;

  const brainMetric =
    moodScore != null && moodScore > 0
      ? String(Math.round(moodScore))
      : moodNum > 0
        ? String(Math.round(moodNum * 10))
        : String(Math.round(habitRate));

  const vitals = input.moodVitals;
  const stressVal = vitals?.latestStress ?? vitals?.avgStress7d ?? null;
  const heartMetric =
    stressVal != null
      ? stressVal.toFixed(1)
      : habitScore != null && habitScore > 0
        ? String(Math.round(habitScore))
        : String(Math.round(clamp(habitRate, 0, 100)));

  const solarMetric =
    logRegularity != null && logRegularity > 0
      ? String(Math.round(logRegularity))
      : String(Math.round(clamp(streak * 12 + habitRate * 0.4, 0, 100)));

  const sleepH = vitals?.latestSleep ?? vitals?.avgSleep7d ?? null;
  const sleepHoursLabel = sleepH != null ? formatSleepHours(sleepH, isFr) : "—";

  const delta =
    input.aegisScoreDelta !== 0
      ? `${input.aegisScoreDelta > 0 ? "▲" : "▼"} ${Math.abs(input.aegisScoreDelta).toFixed(1)} pts`
      : null;

  const moodDelta = input.digest?.moodDelta ?? 0;
  const moodTrend = input.digest?.moodTrend;
  let levelDeltaLabel: string | null = null;
  if (input.habitProgressPct > 0) {
    levelDeltaLabel = isFr
      ? `+${input.habitProgressPct}% habits`
      : `+${input.habitProgressPct}% habits`;
  }
  if (moodTrend === "up" && moodDelta > 0) {
    const moodPart = isFr ? `▲ ${moodDelta} humeur` : `▲ ${moodDelta} mood`;
    levelDeltaLabel = levelDeltaLabel ? `${levelDeltaLabel} · ${moodPart}` : moodPart;
  }

  const decisionLoad = computeDecisionLoad(input);
  const regularityPct =
    logRegularity != null && logRegularity > 0 ? Math.round(logRegularity) : Math.round(habitRate);

  const moodSeries = input.digest?.moodSeries ?? [];
  const scoreTrendSparkline = input.scoreTrendSparkline ?? [];

  const sortedDecisions = resolveOpenDecisionItems(input);
  const pendingDecision = toPendingDecision(sortedDecisions[0]);
  const pendingDecisionCount = sortedDecisions.length || Number(input.openDecisions) || 0;
  const lastDecisionDaysAgo = pendingDecision?.ageDays ?? input.oldestDecisionDays ?? null;
  const journalSnippet = input.journalSnippet ?? null;

  const emptyDecisionLabel = isFr ? "Aucune décision en attente" : "No pending decision";

  const toolboxDefaults: BioExecutiveViewModel["toolboxInbox"] = {
    favorites: 0,
    missing: 0,
    newer: 0,
    nextItem: null,
  };

  return {
    sessionLabel: input.sessionLabel,
    pageTitleLine: isFr ? "État & Résonance" : "State & Resonance",
    bioNodes: {
      brain: {
        title: isFr ? "Clarté Cognitive" : "Cognitive clarity",
        metric: brainMetric,
        unit: moodScore != null ? "pts" : moodNum > 0 ? "/10" : "pts",
        status:
          moodTrend === "up"
            ? isFr
              ? "En hausse"
              : "Rising"
            : moodTrend === "down"
              ? isFr
                ? "En baisse"
                : "Softening"
              : isFr
                ? "Stable"
                : "Stable",
        desc: isFr
          ? `Humeur moyenne ${input.moodAvg}. Tendance ${input.digest?.moodTrend ?? "stable"}.`
          : `Average mood ${input.moodAvg}. Trend ${input.digest?.moodTrend ?? "stable"}.`,
      },
      heart: {
        title: isFr ? "Cohérence & Stress" : "Coherence & stress",
        metric: heartMetric,
        unit: stressVal != null ? "/10" : "pts",
        status: stressStatus(stressVal, isFr),
        desc: isFr
          ? stressVal != null
            ? `Stress ${stressVal.toFixed(1)}/10 · ${Math.round(habitRate)}% habits (7 j).`
            : `${Math.round(habitRate)}% des habitudes cette semaine. Série ${streak} j.`
          : stressVal != null
            ? `Stress ${stressVal.toFixed(1)}/10 · ${Math.round(habitRate)}% habits (7d).`
            : `${Math.round(habitRate)}% habits this week. ${streak}-day streak.`,
      },
      solar: {
        title: isFr ? "Réserve d'Énergie" : "Energy reserve",
        metric: solarMetric,
        unit: "%",
        status: streak >= 3 ? (isFr ? "Haute" : "High") : isFr ? "Modérée" : "Moderate",
        desc: isFr
          ? sleepH != null
            ? `Sommeil ${formatSleepHours(sleepH, true)} · régularité ${regularityPct}%.`
            : `Régularité ${regularityPct}% · série ${streak} j.`
          : sleepH != null
            ? `Sleep ${formatSleepHours(sleepH, false)} · regularity ${regularityPct}%.`
            : `Regularity ${regularityPct}% · ${streak}-day streak.`,
      },
    },
    sleepHoursLabel,
    sleepTargetLabel: isFr ? `/ ${DEFAULT_SLEEP_GOAL_H}h` : `/ ${DEFAULT_SLEEP_GOAL_H}h goal`,
    sleepStatusLabel:
      sleepH != null && sleepH >= DEFAULT_SLEEP_GOAL_H - 0.5
        ? isFr
          ? "Sommeil OK"
          : "Sleep on track"
        : sleepH != null
          ? isFr
            ? "Sommeil bas"
            : "Sleep low"
          : isFr
            ? "Sommeil"
            : "Sleep",
    sleepGoalHours: DEFAULT_SLEEP_GOAL_H,
    cognitionStatus: stressStatus(vitals?.avgStress7d ?? stressVal, isFr),
    moodStatus: moodAlignStatus(moodTrend, isFr),
    levelNumber: level,
    levelSubtitle: isFr ? `Niv. ${level} · ${Math.round(overall)} pts` : `Lv. ${level} · ${Math.round(overall)} pts`,
    levelDeltaLabel,
    scoreDisplay: overall > 0 ? overall.toFixed(1) : "—",
    scoreDeltaLabel: delta,
    moodSeries,
    scoreTrendSparkline,
    decisionLoadDisplay: decisionLoad.display,
    decisionLoadSubtitle: decisionLoad.subtitle,
    sessionsCount: input.digest?.journalCount ?? 0,
    regularityPct,
    pendingDecision,
    pendingDecisionCount,
    lastDecisionDaysAgo,
    journalSnippet,
    pulseCard: input.pulseCard ?? null,
    toolboxInbox: { ...toolboxDefaults, ...input.toolboxInbox },
    adminMessage: input.adminMessage ?? null,
    messageOfTheDay: input.messageOfTheDay ?? null,
    pulsePendingTitle: pendingDecision?.name ?? emptyDecisionLabel,
    pulseQuote: journalSnippet,
    progressTodayPct: input.habitProgressPct,
    timeSlots: [
      { time: "08:00", active: true },
      { time: "10:00", active: true },
      { time: "12:00", active: true },
      { time: "14:00", active: true },
      { time: "16:00", active: false },
      { time: "18:00", active: false },
    ],
    stressLatest: stressVal,
    stressAvg7d: vitals?.avgStress7d ?? stressVal,
    sleepHours: sleepH,
    sleepAvg7d: vitals?.avgSleep7d ?? sleepH,
  };
}
