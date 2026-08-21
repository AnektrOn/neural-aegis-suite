import { loadGuardianState } from "@/features/guardian/guardianStorage";
import { needsGuardianOnboarding } from "@/features/guardian/needsGuardianOnboarding";

/** Post-login hub — shown after each sign-in once Guardian onboarding is done. */
export const WELCOME_HUB_PATH = "/welcome";

/** Dedicated Guardian onboarding page (full page, not Welcome overlay). */
export const GUARDIAN_ONBOARDING_PATH = "/onboarding";

export function postLoginPath(isGuest: boolean, userId?: string | null): string {
  if (isGuest) return "/visitor";
  if (userId) {
    const guardian = loadGuardianState(userId);
    if (needsGuardianOnboarding(guardian)) return GUARDIAN_ONBOARDING_PATH;
  }
  return WELCOME_HUB_PATH;
}
