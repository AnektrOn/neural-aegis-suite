export const SEO_SITE_URL = "https://aegis.humancatalystbeacon.com";

export const SEO_OG_IMAGE = `${SEO_SITE_URL}/aegis-landing/hero-scene-1440.jpg`;

export const SEO_DEFAULT_LOCALE = "fr_FR";

export function seoCanonical(route: string): string {
  const path = route === "/" ? "" : route.startsWith("/") ? route : `/${route}`;
  return `${SEO_SITE_URL}${path}`;
}