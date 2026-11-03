export type BioNodeId = "brain" | "heart" | "solar";

export type BioNodeCopy = {
  title: string;
  metric: string;
  unit: string;
  status: string;
  desc: string;
};

export type BioExecutiveMoodVitals = {
  latestSleep: number | null;
  avgSleep7d: number | null;
  latestStress: number | null;
  avgStress7d: number | null;
};

export type BioExecutivePendingDecision = {
  id: string;
  name: string;
  ageDays: number;
  priority: number;
};

export type BioExecutivePulseCardTile = {
  id: string;
  title: string;
  isNew: boolean;
  addedLabel: string;
};

export type BioExecutiveToolboxInbox = {
  favorites: number;
  missing: number;
  newer: number;
  nextItem: { id: string; title: string } | null;
};

export type BioExecutiveAdminMessage = {
  id: string;
  subject: string;
  preview: string;
  isRead: boolean;
};

export type BioExecutiveViewModel = {
  sessionLabel: string;
  pageTitleLine: string;
  bioNodes: Record<BioNodeId, BioNodeCopy>;
  sleepHoursLabel: string;
  sleepTargetLabel: string;
  sleepStatusLabel: string;
  sleepGoalHours: number;
  cognitionStatus: string;
  moodStatus: string;
  levelNumber: number;
  levelSubtitle: string;
  levelDeltaLabel: string | null;
  scoreDisplay: string;
  scoreDeltaLabel: string | null;
  moodSeries: number[];
  scoreTrendSparkline: number[];
  decisionLoadDisplay: string;
  decisionLoadSubtitle: string;
  sessionsCount: number;
  regularityPct: number;
  pendingDecision: BioExecutivePendingDecision | null;
  pendingDecisionCount: number;
  lastDecisionDaysAgo: number | null;
  journalSnippet: string | null;
  pulseCard: BioExecutivePulseCardTile | null;
  toolboxInbox: BioExecutiveToolboxInbox;
  adminMessage: BioExecutiveAdminMessage | null;
  /** Reserved for future MOTD slot; not rendered in desktop v1 */
  messageOfTheDay: { text: string; source: string } | null;
  /** @deprecated Use pendingDecision — desktopLayout=false legacy block only */
  pulsePendingTitle: string;
  /** @deprecated Use journalSnippet — desktopLayout=false legacy block only */
  pulseQuote: string | null;
  progressTodayPct: number;
  timeSlots: readonly { time: string; active: boolean }[];
  stressLatest: number | null;
  stressAvg7d: number | null;
  sleepHours: number | null;
  sleepAvg7d: number | null;
};

export type BioExecutiveHabitRow = {
  id: string;
  name: string;
  done: boolean;
  tag: string;
  time: string;
};

export type BioExecutiveOpenDecisionItem = {
  id: string;
  name: string;
  priority: number;
  ageDays: number;
};
