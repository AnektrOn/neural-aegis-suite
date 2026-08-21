import type { GuardianPersistedState } from "./types";

/** True while the user still needs the dedicated Guardian onboarding page. */
export function needsGuardianOnboarding(state: GuardianPersistedState): boolean {
  if (
    state.status === "declined" ||
    state.status === "skipped" ||
    state.status === "completed"
  ) {
    return false;
  }
  if (state.status === "pending") return true;
  if (state.status === "active") {
    if (state.awaitingPostQuiz && !state.postQuizChoice) return true;
    if (state.postQuizChoice === "autonomous") return false;
    return true;
  }
  return false;
}
