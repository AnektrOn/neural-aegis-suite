export type GuardianGender = "male" | "female";

/** Voice + UI language for Guardian guide audio. */
export type GuardianLocale = "fr" | "en";

export type GuardianStatus =
  | "pending"
  | "active"
  | "declined"
  | "skipped"
  | "completed";

/** Onboarding guide steps 1–4 */
export type GuardianStep = 1 | 2 | 3 | 4;

export type GuardianPostQuizChoice = "guardian" | "autonomous";

export type GuardianUiPhase =
  | "idle"
  | "activate"
  | "gender"
  | "language"
  | "step1"
  | "post_quiz"
  | "step2"
  | "step3"
  | "step4"
  | "done";

export interface GuardianPersistedState {
  status: GuardianStatus;
  gender: GuardianGender | null;
  /** Audio / captions language; chosen after gender. */
  locale: GuardianLocale | null;
  step: GuardianStep;
  postQuizChoice: GuardianPostQuizChoice | null;
  /** Set when assessment finishes while Guardian is active */
  awaitingPostQuiz: boolean;
  /** Decision log modal completed within step 4 */
  decisionDone: boolean;
  version: 1;
}

export const GUARDIAN_DEFAULT_STATE: GuardianPersistedState = {
  status: "pending",
  gender: null,
  locale: null,
  step: 1,
  postQuizChoice: null,
  awaitingPostQuiz: false,
  decisionDone: false,
  version: 1,
};
