export type RunePrincipleCode =
  | "MENTALISM"
  | "CORRESPONDENCE"
  | "VIBRATION"
  | "POLARITY"
  | "RHYTHM"
  | "CAUSE_EFFECT"
  | "GENDER";

export type SwipeAction = "assimilated" | "ignored";

export type CourseSectionType =
  | "hook"
  | "concept"
  | "exercise"
  | "reflection"
  | "action"
  | "quote"
  | "story";

export interface PulseCourseContent {
  hook?: string;
  concept?: string;
  action?: string;
}

export interface PulseCourseSection {
  id: string;
  sectionType: CourseSectionType;
  content: string;
  sortOrder: number;
}

export interface PulseCourse {
  id: string;
  externalKey: string | null;
  principleCode: RunePrincipleCode | null;
  principleName: string | null;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  sections: PulseCourseSection[];
  progress: {
    startedAt: string | null;
    completedAt: string | null;
    lastSectionIdx: number;
  };
}

export interface PulseCard {
  id: string;
  externalKey: string | null;
  courseId: string | null;
  principleCode: RunePrincipleCode;
  principleName: string;
  principleQuote: string;
  principleBgClass: string;
  principleTextClass: string;
  pulsesToUnlock: number;
  timeLabel: string;
  title: string;
  problem: string;
  bullets: string[];
  format: string;
  courseContent: PulseCourseContent;
  swipedAt?: string;
}

export interface RuneProgress {
  principleCode: RunePrincipleCode;
  principleName: string;
  pulsesToUnlock: number;
  pulsesCount: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface SwipeResult {
  ok: true;
  action: SwipeAction;
  principleCode: RunePrincipleCode | null;
  newPulseCount: number | null;
  runeUnlocked: boolean;
}

export type DeckLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; cards: PulseCard[] };

export type GrimoireLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; library: PulseCard[]; runes: RuneProgress[] };

export type CourseLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; course: PulseCourse };
