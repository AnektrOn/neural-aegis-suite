/**
 * Plan access map.
 *
 * Initiation (free) : account management + daily logging (mood, decisions, habits),
 * with unlimited history of their own entries.
 * Matrice / Ultra   : everything else (analyses, Deep Dive, toolbox, pulse,
 * relations, calendar, exports).
 */

/** Paths reachable without any paid plan. */
export const FREE_PATHS = [
  // account
  "/profile",
  "/settings",
  "/install",
  // daily logging
  "/mood",
  "/decisions",
  "/habits",
] as const;

export function isFreePath(pathname: string): boolean {
  return FREE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
