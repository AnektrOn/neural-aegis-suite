/**
 * Plan access map.
 *
 * Initiation (free) : account management + daily logging (mood, decisions, habits),
 * with unlimited history of their own entries.
 * AEGIS Solo / Ultra : Persona, Deep Dive, relations, calendar, exports (full platform).
 * Initiation keeps /pulse and /toolbox with daily global quotas (see freemium RPCs).
 */

/** Paths reachable without any paid plan. */
export const FREE_PATHS = [
  // account
  "/profile",
  "/settings",
  "/install",
  "/ambassadeur",
  // home (premium blocks are blurred in place)
  "/dashboard",
  // daily logging
  "/mood",
  "/decisions",
  "/habits",
  // Guardian / executive onboarding (must stay free for Initiation users)
  "/start",
  "/onboarding",
  "/onboarding/assessment",
  "/onboarding/results",
  // Starter cockpit modules unlocked immediately post-onboarding
  "/people",
  "/pulse",
  "/toolbox",
] as const;

export function isFreePath(pathname: string): boolean {
  return FREE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
