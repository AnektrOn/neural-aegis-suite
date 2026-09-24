export type LocaleText = { fr: string; en: string };

export type IntroChapterId = "storm" | "current" | "light" | "roots";

export type IntroChapter = {
  id: IntroChapterId;
  number: number;
  titlePrefix: LocaleText;
  titleEmphasis: LocaleText;
  shortTitle: LocaleText;
  hintPointer: LocaleText;
  hintTouch: LocaleText;
  lines: LocaleText[];
};

export const INTRO_ENTRY = {
  eyebrow: { fr: "Protocole Nomos", en: "Protocole Nomos" },
  titleSmall: { fr: "La", en: "The" },
  title: { fr: "Symphonie d'Aegis", en: "Symphony of Aegis" },
  tagline: {
    fr: "Rendre visibles les forces qui orientent nos décisions.",
    en: "Making visible the forces that shape our decisions.",
  },
  cta: { fr: "Entrer dans l’expérience", en: "Enter the experience" },
} satisfies Record<string, LocaleText>;

export const INTRO_CHAPTERS: IntroChapter[] = [
  {
    id: "storm",
    number: 1,
    titlePrefix: { fr: "La Marche de la", en: "The March of the" },
    titleEmphasis: { fr: "Tempête", en: "Storm" },
    shortTitle: { fr: "Tempête", en: "Storm" },
    hintPointer: {
      fr: "Maintenez le clic pour ouvrir une brèche dans l'orage.",
      en: "Press and hold your cursor to break through the storm.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour ouvrir une brèche dans l'orage.",
      en: "Press and hold to break through the storm.",
    },
    lines: [
      {
        fr: "Avant chaque décision, il y a la pression.",
        en: "Before every decision, there is pressure.",
      },
      {
        fr: "Urgences, attentes et responsabilités cherchent toutes à être entendues.",
        en: "Urgencies, expectations, and responsibilities all seek to be heard.",
      },
      {
        fr: "Même dans la tempête, ce qui compte peut devenir plus clair.",
        en: "Even in the storm, what matters can become clearer.",
      },
    ],
  },
  {
    id: "current",
    number: 2,
    titlePrefix: { fr: "Le Rythme du", en: "The Rhythm of the" },
    titleEmphasis: { fr: "Courant", en: "Current" },
    shortTitle: { fr: "Courant", en: "Current" },
    hintPointer: {
      fr: "Maintenez pour faire émerger la structure des profondeurs.",
      en: "Hold to raise the structure from the depths.",
    },
    hintTouch: {
      fr: "Maintenez l'écran pour faire émerger la structure.",
      en: "Press and hold to raise the structure.",
    },
    lines: [
      {
        fr: "Sous la surface, nos décisions dessinent une structure.",
        en: "Beneath the surface, our decisions shape a structure.",
      },
      {
        fr: "Ce que nous rendons visible peut être compris, partagé et porté ensemble.",
        en: "What we make visible can be understood, shared, and carried together.",
      },
      {
        fr: "Diriger, c’est faire remonter ce qui compte.",
        en: "To lead is to bring what matters to the surface.",
      },
    ],
  },
  {
    id: "light",
    number: 3,
    titlePrefix: { fr: "Le Crescendo de la", en: "The Crescendo of" },
    titleEmphasis: { fr: "Lumière", en: "Light" },
    shortTitle: { fr: "Lumière", en: "Light" },
    hintPointer: {
      fr: "Maintenez le clic pour rassembler la lumière.",
      en: "Press and hold your cursor to gather the light.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour rassembler la lumière.",
      en: "Press and hold to gather the light.",
    },
    lines: [
      {
        fr: "Décisions, contextes, relations, responsabilités : des signaux épars.",
        en: "Decisions, contexts, relationships, responsibilities: scattered signals.",
      },
      {
        fr: "Lorsqu’ils se répondent, des repères apparaissent.",
        en: "When they begin to connect, patterns emerge.",
      },
      {
        fr: "La clarté n’est pas donnée. Elle se compose.",
        en: "Clarity is not given. It is composed.",
      },
    ],
  },
  {
    id: "roots",
    number: 4,
    titlePrefix: { fr: "L'Harmonie des", en: "The Harmony of" },
    titleEmphasis: { fr: "Racines", en: "Roots" },
    shortTitle: { fr: "Racines", en: "Roots" },
    hintPointer: {
      fr: "Maintenez le clic pour faire pousser les racines.",
      en: "Press and hold your cursor to grow the roots.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour faire pousser les racines.",
      en: "Press and hold to grow the roots.",
    },
    lines: [
      {
        fr: "Plus profond encore, tout se relie.",
        en: "Deeper still, everything connects.",
      },
      {
        fr: "Valeurs, habitudes, relations et rôles forment un réseau vivant.",
        en: "Values, habits, relationships, and roles form a living network.",
      },
      {
        fr: "C’est là que notre jugement collectif prend racine — et que la coordination devient possible.",
        en: "This is where our collective judgment takes root — and coordination becomes possible.",
      },
    ],
  },
];

export const INTRO_END = {
  eyebrow: { fr: "AEGIS", en: "AEGIS" },
  title: {
    fr: "Façonnés par la pression, les signaux et les liens,",
    en: "Shaped by pressure, signals, and connection,",
  },
  titleEmphasis: {
    fr: "notre jugement collectif devient plus lisible.",
    en: "our collective judgment becomes more legible.",
  },
  body: {
    fr: "AEGIS aide personnes, équipes et organisations à clarifier leurs décisions et leurs dynamiques.",
    en: "AEGIS helps people, teams, and organisations clarify their decisions and dynamics.",
  },
  cta: { fr: "Entrer dans AEGIS", en: "Enter AEGIS" },
  restart: { fr: "Recommencer l’expérience", en: "Restart the experience" },
} satisfies Record<string, LocaleText>;

export const INTRO_UI = {
  skipChapter: { fr: "Passer le chapitre", en: "Skip chapter" },
  skipIntro: { fr: "Passer l'intro", en: "Skip intro" },
  chapter: { fr: "Chapitre", en: "Chapter" },
  nextChapter: { fr: "Chapitre suivant", en: "Next chapter" },
  toEnd: { fr: "Continuer", en: "Continue" },
} satisfies Record<string, LocaleText>;

export function pick(text: LocaleText, isFR: boolean): string {
  return isFR ? text.fr : text.en;
}
