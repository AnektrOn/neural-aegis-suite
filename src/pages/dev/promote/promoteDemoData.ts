import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import type { RuntimeOption, RuntimeQuestion } from "@/features/archetype-assessment/domain/types";
import { ARCHETYPE_KEYS } from "@/features/archetype-assessment/domain/archetypes";
import { V4_QUESTIONS } from "@/features/archetype-assessment/domain/questionsV4";
import type { WeeklyDigest, MobileHabit } from "@/pages/dashboard/dashboard-shared";

export const PROMOTE_USER = {
  firstName: "John",
  lastName: "Reed",
  email: "john@aegis.demo",
  initial: "J",
} as const;

export function copy<T>(isFR: boolean, fr: T, en: T): T {
  return isFR ? fr : en;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const PROMOTE_DIGEST: WeeklyDigest = {
  moodTrend: "up",
  moodDelta: 1.2,
  habitRate: 78,
  decisionsResolved: 4,
  journalCount: 5,
  streakDays: 12,
  moodSeries: [6.2, 6.8, 7.1, 6.4, 7.6, 8.0, 7.8],
};

export const PROMOTE_STATS = {
  moodAvg: "7.4",
  openDecisions: "2",
  habitsDone: "3/4",
};

export const PROMOTE_HABITS: MobileHabit[] = [
  { id: "h1", name: "Respiration 4-7-8", category: "corps", completed: true },
  { id: "h2", name: "Journal du matin", category: "esprit", completed: true },
  { id: "h3", name: "Marche consciente", category: "corps", completed: true },
  { id: "h4", name: "Couvre-feu digital", category: "rituel", completed: false },
];

export const PROMOTE_DECISIONS = [
  {
    id: "d1",
    nameFr: "Recruter un associé produit",
    nameEn: "Hire a product partner",
    priority: 4,
    statusFr: "Ouverte",
    statusEn: "Open",
    created_at: hoursAgo(6),
  },
  {
    id: "d2",
    nameFr: "Dire non au projet parallèle",
    nameEn: "Decline the side project",
    priority: 3,
    statusFr: "Tranchée",
    statusEn: "Decided",
    created_at: hoursAgo(26),
  },
  {
    id: "d3",
    nameFr: "Bloquer deux matinées sans réunion",
    nameEn: "Block two meeting-free mornings",
    priority: 2,
    statusFr: "Ouverte",
    statusEn: "Open",
    created_at: hoursAgo(48),
  },
];

export const PROMOTE_JOURNAL = {
  created_at: hoursAgo(3),
  contentFr:
    "Ce matin j’ai senti la différence entre urgence et importance. Le silence avant la première décision a tout changé.",
  contentEn:
    "This morning I felt the gap between urgency and importance. The silence before the first decision changed everything.",
  promptFr: "Quelle décision mérite encore deux minutes de clarté ?",
  promptEn: "Which decision still deserves two minutes of clarity?",
};

export const PROMOTE_MOOD_WEEK = [
  { dayFr: "D", dayEn: "S", mood: 6.2 },
  { dayFr: "L", dayEn: "M", mood: 6.8 },
  { dayFr: "M", dayEn: "T", mood: 7.1 },
  { dayFr: "M", dayEn: "W", mood: 6.4 },
  { dayFr: "J", dayEn: "T", mood: 7.6 },
  { dayFr: "V", dayEn: "F", mood: 8.0 },
  { dayFr: "S", dayEn: "S", mood: 7.8 },
];

export const PROMOTE_CALENDAR = [
  { time: "07:30", fr: "Journal — 8 min", en: "Journal — 8 min", kind: "journal" },
  { time: "08:10", fr: "Humeur 7.8 · sommeil 7.2", en: "Mood 7.8 · sleep 7.2", kind: "mood" },
  { time: "11:00", fr: "Décision : recrutement", en: "Decision: hiring", kind: "decision" },
  { time: "18:40", fr: "Respiration 4-7-8", en: "4-7-8 breath", kind: "habit" },
];

export const PROMOTE_PERSONA = {
  classFr: "Guerrier · Souverain",
  classEn: "Warrior · Sovereign",
  themeFr: "Tenue sous pression",
  themeEn: "Hold under pressure",
  bioFr: "John tranche vite, mais seulement après avoir nommé ce qui est vrai. Son ombre : trop porter seul.",
  bioEn: "John decides quickly, but only after naming what is true. His shadow: carrying it alone.",
  practiceFr: "Pause de 90 secondes avant chaque arbitrage.",
  practiceEn: "A 90-second pause before every call.",
};

export const PROMOTE_TOOLBOX = [
  { id: "t1", titleFr: "Respiration 4-7-8", titleEn: "4-7-8 breath", duration: "4 min", type: "breathwork" },
  { id: "t2", titleFr: "Scan du corps", titleEn: "Body scan", duration: "8 min", type: "bodyscan" },
  { id: "t3", titleFr: "Visualisation du cadre", titleEn: "Frame visualization", duration: "6 min", type: "visualization" },
];

export const PROMOTE_TRACKS = [
  { id: "m1", titleFr: "Ancrage du matin", titleEn: "Morning grounding", duration: "11 min" },
  { id: "m2", titleFr: "Silence avant la décision", titleEn: "Silence before the call", duration: "7 min" },
  { id: "m3", titleFr: "Retour au corps", titleEn: "Back to the body", duration: "14 min" },
];

export const PROMOTE_PEOPLE = [
  { id: "p1", name: "Marc", roleFr: "Associé", roleEn: "Partner", score: 8.4 },
  { id: "p2", name: "Sofia", roleFr: "Mentore", roleEn: "Mentor", score: 9.1 },
  { id: "p3", name: "Julien", roleFr: "Frère", roleEn: "Brother", score: 7.2 },
  { id: "p4", name: "Nora", roleFr: "Équipe", roleEn: "Team", score: 6.8 },
];

export const PROMOTE_ANALYTICS = [
  {
    titleFr: "Sommeil → clarté",
    titleEn: "Sleep → clarity",
    bodyFr: "Les jours ≥ 7h de sommeil, vos décisions ouvertes chutent de 32%.",
    bodyEn: "On days with ≥ 7h sleep, open decisions drop by 32%.",
    series: [4, 3, 5, 2, 2, 1, 2],
  },
  {
    titleFr: "Journal → humeur",
    titleEn: "Journal → mood",
    bodyFr: "Un journal le matin corrèle +1.1 sur la fréquence du soir.",
    bodyEn: "A morning journal correlates +1.1 on evening frequency.",
    series: [6.1, 6.8, 7.0, 7.4, 7.2, 7.9, 8.1],
  },
];

export const PROMOTE_SHADOW_SIGNALS: Record<string, number> = {
  child: 0.7,
  victim: 0.55,
  prostitute: 0.72,
  saboteur: 0.6,
};

const LIGHT_SCORE: Record<string, number> = {
  warrior: 86,
  sovereign: 79,
  mystic: 73,
  healer: 68,
  creator: 55,
  lover: 52,
  sage: 48,
  magician: 44,
  caregiver: 42,
  jester: 40,
  explorer: 38,
  rebel: 33,
};

export const PROMOTE_LIGHT_SCORES = ARCHETYPE_KEYS.map((key) => ({
  archetype_key: key,
  normalized_score: LIGHT_SCORE[key] ?? 28,
}));

export const PROMOTE_TOP_ARCHETYPES = ["warrior", "sovereign", "mystic"] as const;

export const PROMOTE_PULSE_CARD: PulseCard = {
  id: "promote-pulse-1",
  externalKey: "presence-still-point",
  courseId: null,
  principleCode: "PRESENCE",
  principleName: "Presence",
  principleQuote: "The only time you ever have is now.",
  principleBgClass: "bg-primary/10",
  principleTextClass: "text-primary",
  pulsesToUnlock: 3,
  timeLabel: "4 min",
  title: "Le point immobile",
  problem: "Quand l’agenda accélère, où posez-vous le silence avant de décider ?",
  bullets: [
    "Nommer l’urgence sans lui obéir.",
    "Une respiration complète avant le premier mot.",
    "Traduire la peur en une seule question utile.",
  ],
  format: "Pulse",
  courseContent: {
    hook: "Le présent n’est pas un luxe.",
    concept: "La présence précède la décision lisible.",
    action: "90 secondes les yeux ouverts, puis un seul arbitrage.",
  },
};

function v4ToRuntime(): RuntimeQuestion {
  const seed = V4_QUESTIONS[0];
  const options: RuntimeOption[] = seed.options.map((o) => ({
    id: `promote-opt-${o.position}`,
    position: o.position,
    label_fr: o.label_fr,
    label_en: o.label_en,
    archetype_weights: {},
    shadow_weights: {},
    polarity_weights: [],
    value: o.position,
  }));
  return {
    id: "promote-q1",
    position: seed.position,
    question_type: "multiple_choice",
    prompt_fr: seed.prompt_fr,
    prompt_en: seed.prompt_en,
    helper_fr: null,
    helper_en: null,
    dimension: seed.dimension,
    is_required: true,
    meta: { intensityEnabled: true, scoringModel: "myss_v4" },
    options,
  };
}

export const PROMOTE_QUIZ_QUESTION = v4ToRuntime();
