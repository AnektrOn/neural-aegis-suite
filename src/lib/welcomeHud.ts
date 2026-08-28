/** Post-login hub — shown after each sign-in once Guardian onboarding is done. */
export const WELCOME_HUB_PATH = "/welcome";

/** Dedicated Guardian onboarding page (full page, not Welcome overlay). */
export const GUARDIAN_ONBOARDING_PATH = "/onboarding";

export function postLoginPath(isGuest: boolean, _userId?: string | null): string {
  // Guests never see Guardian onboarding: they go straight to the quiz.
  if (isGuest) return "/quiz";
  // Les membres vont au hub ; RequireQuizOnboarding redirige vers /onboarding
  // uniquement si le questionnaire n'est pas terminé (source serveur).
  return WELCOME_HUB_PATH;
}
