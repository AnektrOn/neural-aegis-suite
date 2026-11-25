/**
 * Path prefixes served by the authenticated member shell (`App.tsx` `path="/*"`).
 * Any other path that reaches the catch-all should show a public 404 (not auth redirect).
 */
export const MEMBER_APP_PATH_PREFIXES: string[] = [
  "/capture",
  "/dashboard",
  "/persona",
  "/mood",
  "/decisions",
  "/habits",
  "/journal",
  "/toolbox",
  "/pratiques",
  "/pulse",
  "/bibliotheque",
  "/meditation",
  "/people",
  "/analytics",
  "/profile",
  "/settings",
  "/messages",
  "/install",
  "/ambassadeur",
  "/calendar",
  "/onboarding/assessment",
  "/onboarding/results",
  "/assessment/maisons",
  "/deep-dive",
  "/cartographie",
];

export function isMemberAppPath(pathname: string): boolean {
  return MEMBER_APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}