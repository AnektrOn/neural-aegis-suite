export const AEGIS_TOOLS_SITE_URL = "https://aegis.humancatalystbeacon.com";

export function toolsCanonicalPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${AEGIS_TOOLS_SITE_URL}${normalized}`;
}