export type StoryChapterId =
  | "silence"
  | "fog"
  | "trace"
  | "network"
  | "map"
  | "threshold";

export type LocaleText = { fr: string; en: string };

export type StoryChapterDef = {
  id: StoryChapterId;
  /** Chapters 1–4 use the WebGL canvas */
  hasCanvas: boolean;
  eyebrow: LocaleText;
  title: LocaleText;
  body: LocaleText;
  hint: LocaleText;
};

export const STORY_CHAPTERS: StoryChapterDef[] = [
  {
    id: "silence",
    hasCanvas: false,
    eyebrow: { fr: "Protocole Nomos", en: "Protocole Nomos" },
    title: { fr: "Aegis", en: "Aegis" },
    body: {
      fr: "Le protocole qui rend vos décisions lisibles.",
      en: "The protocol that makes your decisions legible.",
    },
    hint: { fr: "Entrer", en: "Enter" },
  },
  {
    id: "fog",
    hasCanvas: true,
    eyebrow: { fr: "01 · Illisible", en: "01 · Illegible" },
    title: { fr: "Tout est là. Rien n’est clair.", en: "Everything is there. Nothing is clear." },
    body: {
      fr: "Décisions, tensions, habitudes — un même brouillard.",
      en: "Decisions, tensions, habits — one same fog.",
    },
    hint: { fr: "Glisser pour dissiper", en: "Drag to clear" },
  },
  {
    id: "trace",
    hasCanvas: true,
    eyebrow: { fr: "02 · Trace", en: "02 · Trace" },
    title: { fr: "La première ligne change tout.", en: "The first line changes everything." },
    body: {
      fr: "Consigner un arbitrage, c’est déjà le rendre lisible.",
      en: "Logging a call is already making it legible.",
    },
    hint: { fr: "Maintenir et tracer", en: "Press and draw" },
  },
  {
    id: "network",
    hasCanvas: true,
    eyebrow: { fr: "03 · Liens", en: "03 · Links" },
    title: { fr: "Rien n’existe seul.", en: "Nothing exists alone." },
    body: {
      fr: "Relations, décisions, états — le champ se connecte.",
      en: "Relationships, decisions, states — the field connects.",
    },
    hint: { fr: "Approcher pour révéler", en: "Move closer to reveal" },
  },
  {
    id: "map",
    hasCanvas: true,
    eyebrow: { fr: "04 · Carte", en: "04 · Map" },
    title: { fr: "Le chaos devient un territoire.", en: "Chaos becomes a territory." },
    body: {
      fr: "Aegis ne remplace pas ton jugement. Il le cartographie.",
      en: "Aegis doesn’t replace your judgment. It maps it.",
    },
    hint: { fr: "Explorer la carte", en: "Explore the map" },
  },
  {
    id: "threshold",
    hasCanvas: false,
    eyebrow: { fr: "Seuil", en: "Threshold" },
    title: { fr: "Diriger avec clarté.", en: "Lead with clarity." },
    body: {
      fr: "Journal, pouls, relations, archétypes — un protocole pour lire ce que tu vis.",
      en: "Journal, pulse, relationships, archetypes — a protocol to read what you live.",
    },
    hint: { fr: "Entrer dans Aegis", en: "Enter Aegis" },
  },
];

export function pickText(text: LocaleText, isFR: boolean): string {
  return isFR ? text.fr : text.en;
}
