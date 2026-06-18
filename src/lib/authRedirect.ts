/** Résolution des redirections post-auth / guest (quiz vs newsletter). */

const NEWSLETTER_PREFIX = "/newsletter";

export function normalizeRedirectPath(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const path = raw.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path.split("?")[0];
}

export function isNewsletterRedirect(raw: string | null): boolean {
  const path = normalizeRedirectPath(raw);
  return path === NEWSLETTER_PREFIX || path?.startsWith(`${NEWSLETTER_PREFIX}/`) === true;
}

/** Destination par défaut après inscription guest si aucun ?redirect= */
export function defaultGuestRedirect(): string {
  return "/quiz";
}

export function resolveGuestRedirect(raw: string | null): string {
  const path = normalizeRedirectPath(raw);
  if (path) return path;
  return defaultGuestRedirect();
}
