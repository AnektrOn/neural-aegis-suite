import type { PracticesHubStats } from "@/features/practices-hub/services/fetchPracticesHubStats";
import { getDefaultDienChanProtocolName } from "@/pages/dev/dienChan/dienChanProtocols";

/** Maquette lab — données visibles sans session ou si fetch vide. */
export const PRACTICES_HUB_LAB_DEMO_STATS: PracticesHubStats = {
  habitsDone: 1,
  habitsTotal: 4,
  habitsToday: {
    done: 1,
    total: 4,
    pending: [
      { id: "demo-1", name: "Respiration 4-7-8", completed: false },
      { id: "demo-2", name: "Hydratation matinale", completed: false },
      { id: "demo-3", name: "Marche 10 min", completed: false },
    ],
  },
  toolboxTodoCount: 2,
  toolboxFeatured: {
    id: "demo-tb",
    title: "Reset post-réunion",
    description: "Décharge nerveuse en 3 minutes — respiration + ancrage.",
    contentType: "exercise",
  },
  pulseTopCard: {
    id: "demo-pulse",
    externalKey: null,
    courseId: null,
    principleCode: "clarity",
    principleName: "Clarté",
    principleQuote: "",
    principleBgClass: "",
    principleTextClass: "",
    pulsesToUnlock: 3,
    timeLabel: "3 min",
    title: "Décision sous pression",
    problem: "Prioriser sans surchauffer.",
    bullets: [],
    format: "micro",
    courseContent: { hook: "Micro-pause décisionnelle." },
  },
  deckCardCount: 6,
  pulseSwipedToday: false,
  libraryResourceCount: 0,
  dienChanProtocolName: getDefaultDienChanProtocolName(),
  dailyScore: { done: 1, total: 5, hasItems: true },
};

export function resolvePracticesHubLabStats(
  stats: PracticesHubStats | null,
  loading: boolean,
): { stats: PracticesHubStats | null; loading: boolean; usingDemo: boolean } {
  if (loading) {
    return { stats: null, loading: true, usingDemo: false };
  }
  if (stats) {
    return { stats, loading: false, usingDemo: false };
  }
  return { stats: PRACTICES_HUB_LAB_DEMO_STATS, loading: false, usingDemo: true };
}
