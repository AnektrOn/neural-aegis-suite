/** Post-login hub — shown after each sign-in, not a one-time onboarding flag. */
export const WELCOME_HUB_PATH = "/welcome";

export function postLoginPath(isGuest: boolean): string {
  return isGuest ? "/visitor" : WELCOME_HUB_PATH;
}
