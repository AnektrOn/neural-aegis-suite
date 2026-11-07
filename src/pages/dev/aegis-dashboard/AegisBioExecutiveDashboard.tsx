import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { buildBioExecutiveViewModel } from "@/features/bio-executive-dashboard/buildBioExecutiveViewModel";
import { BioExecutiveMobileDashboard } from "@/features/bio-executive-dashboard/BioExecutiveMobileDashboard";
import type { BioExecutiveHabitRow } from "@/features/bio-executive-dashboard/types";
import type { AegisHealthScore } from "@/types/aegisHealth";
import QuickLogModal from "@/components/QuickLogModal";

/** Toggle to preview empty action tiles on /dev/aegis-dashboard */
const USE_EMPTY_FIXTURES = false;

/** Documented fixtures mirroring `fetchMobileDashboard` shape for /dev/aegis-dashboard. */
const DEV_FIXTURE = {
  moodAvg: "7.2",
  openDecisions: "1",
  habitProgressPct: 60,
  firstOpenDecisionName: "Restructuration Q4",
  journalSnippet: "Ancrer la routine matinale avant d'ajouter un nouveau projet.",
  moodVitals: {
    latestSleep: 7.5,
    avgSleep7d: 7.2,
    latestStress: 4.2,
    avgStress7d: 4.8,
  },
  oldestDecisionDays: 5,
  maxDecisionPriority: 2,
  scoreTrendSparkline: [82, 84, 83, 86, 88, 89, 90.4],
  openDecisionItems: [
    { id: "dec-q4", name: "Restructuration Q4", priority: 2, ageDays: 5 },
  ],
  pulseCard: USE_EMPTY_FIXTURES
    ? null
    : {
        id: "pulse-1",
        title: "Ancrage matinal — 90 secondes avant la première réunion",
        isNew: true,
        addedLabel: "Ajoutée aujourd'hui",
      },
  toolboxInbox: USE_EMPTY_FIXTURES
    ? { favorites: 0, missing: 0, newer: 0, nextItem: null }
    : {
        favorites: 1,
        missing: 2,
        newer: 1,
        nextItem: { id: "tb-1", title: "Isolation Proactive" },
      },
  adminMessage: USE_EMPTY_FIXTURES
    ? null
    : {
        id: "msg-1",
        subject: "Brief Nomos — semaine 44",
        preview: "Points de vigilance décisionnelle pour la fin de trimestre.",
        isRead: false,
      },
  messageOfTheDay: null,
  digest: {
    moodTrend: "up" as const,
    moodDelta: 0.8,
    habitRate: 60,
    decisionsResolved: 1,
    journalCount: 4,
    streakDays: 5,
    moodSeries: [6.5, 7, 6.8, 7.2, 7.4, 7.1, 7.2],
  },
  aegisScore: {
    id: "dev-score",
    user_id: "dev",
    score_date: new Date().toISOString().split("T")[0],
    overall_score: 90.4,
    mood_score: 72,
    decision_score: 85,
    habit_score: 60,
    journal_score: 55,
    relation_score: 80,
    archetype_coherence: 85,
    log_regularity: 78,
    computed_at: new Date().toISOString(),
  } satisfies AegisHealthScore,
};

const MOCK_HABITS: BioExecutiveHabitRow[] = [
  { id: "1", name: "Méditation d'ancrage", done: true, tag: "Calme", time: "—" },
  { id: "2", name: "Morning stretching", done: true, tag: "Corps", time: "—" },
  { id: "3", name: "Isolation Proactive", done: true, tag: "Focus", time: "—" },
  { id: "4", name: "Ancrage du Mystique", done: false, tag: "Esprit", time: "—" },
];

export default function AegisBioExecutiveDashboard() {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const headerDate = format(new Date(), "EEE d MMM", { locale: fr });
  const viewModel = buildBioExecutiveViewModel({
    locale: "fr",
    sessionLabel: "Après-midi · Alignement",
    digest: DEV_FIXTURE.digest,
    moodAvg: DEV_FIXTURE.moodAvg,
    openDecisions: DEV_FIXTURE.openDecisions,
    aegisScore: DEV_FIXTURE.aegisScore,
    aegisScoreDelta: 2.3,
    habitProgressPct: DEV_FIXTURE.habitProgressPct,
    firstOpenDecisionName: DEV_FIXTURE.firstOpenDecisionName,
    journalSnippet: DEV_FIXTURE.journalSnippet,
    moodVitals: DEV_FIXTURE.moodVitals,
    oldestDecisionDays: DEV_FIXTURE.oldestDecisionDays,
    maxDecisionPriority: DEV_FIXTURE.maxDecisionPriority,
    scoreTrendSparkline: DEV_FIXTURE.scoreTrendSparkline,
    openDecisionItems: USE_EMPTY_FIXTURES ? [] : DEV_FIXTURE.openDecisionItems,
    pulseCard: DEV_FIXTURE.pulseCard,
    toolboxInbox: DEV_FIXTURE.toolboxInbox,
    adminMessage: DEV_FIXTURE.adminMessage,
    messageOfTheDay: DEV_FIXTURE.messageOfTheDay,
  });

  return (
    <>
      <BioExecutiveMobileDashboard
        headerDate={headerDate}
        viewModel={viewModel}
        habits={MOCK_HABITS}
        onToggleHabit={() => {}}
        onQuickLogOpen={() => setShowQuickLog(true)}
        quickLogTitle="Logger maintenant"
        quickLogSubtitle="Humeur · stress · sommeil"
        aiTransparencyBody="Synthèse calculée localement à partir de vos habitudes et de votre rythme de décision. Aucune donnée biométrique n'est envoyée sur le cloud."
        desktopLayout
        heroLab
        immersiveAppShell
      />
      <QuickLogModal open={showQuickLog} onClose={() => setShowQuickLog(false)} />
    </>
  );
}
