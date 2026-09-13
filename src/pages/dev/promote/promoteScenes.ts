export type PromoteChrome = "none" | "app";

export type PromoteSceneDef = {
  slug: string;
  titleFr: string;
  titleEn: string;
  chrome: PromoteChrome;
};

export const PROMOTE_SCENES: PromoteSceneDef[] = [
  { slug: "landing", titleFr: "Landing", titleEn: "Landing", chrome: "none" },
  { slug: "auth", titleFr: "Connexion", titleEn: "Sign in", chrome: "none" },
  { slug: "guardian-activate", titleFr: "Gardien — activer", titleEn: "Guardian — activate", chrome: "none" },
  { slug: "guardian-voice", titleFr: "Gardien — voix", titleEn: "Guardian — voice", chrome: "none" },
  { slug: "quiz", titleFr: "Quiz V4", titleEn: "Quiz V4", chrome: "none" },
  { slug: "results", titleFr: "Résultats", titleEn: "Results", chrome: "none" },
  { slug: "tour", titleFr: "Tour produit", titleEn: "Product tour", chrome: "none" },
  { slug: "welcome", titleFr: "Welcome HUD", titleEn: "Welcome HUD", chrome: "none" },
  { slug: "dashboard", titleFr: "Dashboard", titleEn: "Dashboard", chrome: "app" },
  { slug: "mood", titleFr: "Humeur", titleEn: "Mood", chrome: "app" },
  { slug: "decisions", titleFr: "Décisions", titleEn: "Decisions", chrome: "app" },
  { slug: "habits", titleFr: "Habitudes", titleEn: "Habits", chrome: "app" },
  { slug: "journal", titleFr: "Journal", titleEn: "Journal", chrome: "app" },
  { slug: "calendar", titleFr: "Calendrier", titleEn: "Calendar", chrome: "app" },
  { slug: "persona", titleFr: "Persona", titleEn: "Persona", chrome: "app" },
  { slug: "houses72", titleFr: "72 Maisons", titleEn: "72 Houses", chrome: "app" },
  { slug: "deep-dive", titleFr: "Deep Dive", titleEn: "Deep Dive", chrome: "app" },
  { slug: "pulse", titleFr: "Pulse", titleEn: "Pulse", chrome: "app" },
  { slug: "toolbox", titleFr: "Toolbox", titleEn: "Toolbox", chrome: "app" },
  { slug: "toolbox-session", titleFr: "Toolbox — 4-7-8", titleEn: "Toolbox — 4-7-8", chrome: "none" },
  { slug: "meditation", titleFr: "Méditation", titleEn: "Meditation", chrome: "app" },
  { slug: "people", titleFr: "Réseau", titleEn: "People", chrome: "app" },
  { slug: "analytics", titleFr: "Insights", titleEn: "Insights", chrome: "app" },
  { slug: "meditation-session", titleFr: "Session méditation", titleEn: "Meditation session", chrome: "none" },
];

export const PROMOTE_SCENE_BY_SLUG = new Map(PROMOTE_SCENES.map((s) => [s.slug, s]));

export const PATH_TO_PROMOTE_SLUG: Record<string, string> = {
  "/": "dashboard",
  "/welcome": "welcome",
  "/auth": "auth",
  "/dashboard": "dashboard",
  "/mood": "mood",
  "/decisions": "decisions",
  "/habits": "habits",
  "/journal": "journal",
  "/calendar": "calendar",
  "/persona": "persona",
  "/profile": "persona",
  "/assessment/maisons": "houses72",
  "/onboarding": "guardian-activate",
  "/onboarding/assessment": "quiz",
  "/onboarding/results": "results",
  "/deep-dive": "deep-dive",
  "/deep-dive/scores": "deep-dive",
  "/pulse": "pulse",
  "/toolbox": "toolbox",
  "/meditation": "meditation",
  "/people": "people",
  "/analytics": "analytics",
  "/bibliotheque": "meditation",
  "/pricing": "landing",
};

export function promoteSceneIndex(slug: string | undefined): number {
  if (!slug) return 0;
  const i = PROMOTE_SCENES.findIndex((s) => s.slug === slug);
  return i >= 0 ? i : 0;
}
