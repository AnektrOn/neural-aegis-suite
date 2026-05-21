/** Base URL of the web app (emails, partages). Prefer VITE_APP_URL in production. */
export function getAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function newsletterHubPath(): string {
  return "/newsletter";
}

export function newsletterEditionPath(slug: string): string {
  return `/newsletter/${encodeURIComponent(slug)}`;
}

export function newsletterHubUrl(): string {
  const base = getAppBaseUrl();
  return base ? `${base}${newsletterHubPath()}` : newsletterHubPath();
}

export function newsletterEditionUrl(slug: string): string {
  const base = getAppBaseUrl();
  const path = newsletterEditionPath(slug);
  return base ? `${base}${path}` : path;
}
