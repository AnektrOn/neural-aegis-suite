import type { LocaleText } from "@/features/intro/intro.copy";
import { INTRO_UI, pick } from "@/features/intro/intro.copy";
export type IntroV2ChapterId = "neural" | "sculpture" | "flow" | "asteroids";

export type IntroV2Chapter = {
  id: IntroV2ChapterId;
  number: number;
  titlePrefix: LocaleText;
  titleEmphasis: LocaleText;
  shortTitle: LocaleText;
  hintPointer: LocaleText;
  hintTouch: LocaleText;
  lines: LocaleText[];
  /** First line is shown before hold; remaining lines sync to hold. */
  prologueThenHold?: boolean;
  /** Voiceover advances with the hold instead of after it. */
  linesDuringHold?: boolean;
  /** After hold, only show continue (no line replay). */
  skipPostHoldNarrate?: boolean;
};

export const INTRO_V2_ENTRY = {
  eyebrow: { fr: "AEGIS", en: "AEGIS" },
  titleSmall: { fr: "Bienvenue sur", en: "Welcome to" },
  title: { fr: "AEGIS", en: "AEGIS" },
  tagline: {
    fr: "Voici notre histoire.",
    en: "Here is our story.",
  },
  cta: { fr: "Commencer", en: "Begin" },
} satisfies Record<string, LocaleText>;

export const INTRO_V2_CHAPTERS: IntroV2Chapter[] = [
  {
    id: "asteroids",
    number: 1,
    titlePrefix: { fr: "Du silence", en: "From silence" },
    titleEmphasis: { fr: "au signal", en: "to signal" },
    shortTitle: { fr: "Du silence au signal", en: "From silence to signal" },
    hintPointer: {
      fr: "Maintenez le clic pour faire avancer l'histoire.",
      en: "Press and hold to advance the story.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour faire avancer l'histoire.",
      en: "Press and hold to advance the story.",
    },
    prologueThenHold: true,
    linesDuringHold: true,
    skipPostHoldNarrate: true,
    lines: [
      { fr: "Tout commence dans le noir.", en: "Everything begins in darkness." },
      { fr: "Sans repère. Sans carte. Sans toi.", en: "No landmark. No map. No you." },
      { fr: "Puis une information apparaît.", en: "Then a piece of information appears." },
      { fr: "Une sensation. Un mot. Une idée.", en: "A sensation. A word. An idea." },
      { fr: "Puis dix.", en: "Then ten." },
      { fr: "Puis des centaines.", en: "Then hundreds." },
      { fr: "Une pluie de signaux.", en: "A rain of signals." },
      { fr: "Trop d’informations, trop vite.", en: "Too much information, too fast." },
      { fr: "Trop de voix, sans direction.", en: "Too many voices, without direction." },
      {
        fr: "C’est ainsi que nous naissons dans le monde :",
        en: "This is how we are born into the world:",
      },
      {
        fr: "noyés avant même de savoir qui nous sommes.",
        en: "drowned before we even know who we are.",
      },
    ],
  },
  {
    id: "sculpture",
    number: 2,
    titlePrefix: { fr: "Le premier", en: "The first" },
    titleEmphasis: { fr: "ordre", en: "order" },
    shortTitle: { fr: "Le premier ordre", en: "The first order" },
    hintPointer: {
      fr: "Maintenez pour que l'ordre prenne forme.",
      en: "Hold until order takes form.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour que l'ordre prenne forme.",
      en: "Press and hold until order takes form.",
    },
    prologueThenHold: true,
    linesDuringHold: true,
    skipPostHoldNarrate: true,
    lines: [
      { fr: "Les pensées se dispersent.", en: "Thoughts scatter." },
      { fr: "Les fragments se cherchent.", en: "Fragments search for one another." },
      { fr: "Ce que l’on nous dit.", en: "What we are told." },
      { fr: "Ce que l’on croit être.", en: "What we believe we are." },
      { fr: "Ce que l’on craint de ne pas être.", en: "What we fear we are not." },
      { fr: "Puis, dans le désordre, un ordre émerge.", en: "Then, within the disorder, an order emerges." },
      { fr: "Une silhouette apparaît.", en: "A silhouette appears." },
      { fr: "Un être humain.", en: "A human being." },
      { fr: "Ce n’est pas seulement de la clarté.", en: "This is not merely clarity." },
      { fr: "C’est la connaissance de soi.", en: "It is self-knowledge." },
    ],
  },
  {
    id: "flow",
    number: 3,
    titlePrefix: { fr: "Le monde", en: "The world" },
    titleEmphasis: { fr: "des mondes", en: "of worlds" },
    shortTitle: { fr: "Le monde des mondes", en: "The world of worlds" },
    hintPointer: {
      fr: "Maintenez pour entrer dans le champ.",
      en: "Hold to enter the field.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour entrer dans le champ.",
      en: "Press and hold to enter the field.",
    },
    lines: [
      { fr: "Puis l’individu rencontre les autres.", en: "Then the individual meets the others." },
      { fr: "Des identités. Des intentions. Des champs.", en: "Identities. Intentions. Fields." },
      {
        fr: "Ils se touchent, se repoussent, s’entremêlent.",
        en: "They touch, repel, intertwine.",
      },
      { fr: "Un espace vivant. Connecté.", en: "A living space. Connected." },
      { fr: "Et encore brouillé.", en: "And still blurred." },
      { fr: "Car être soi ne suffit pas :", en: "For being oneself is not enough:" },
      {
        fr: "il faut apprendre à exister, décider et créer avec les autres.",
        en: "one must learn to exist, decide, and create with others.",
      },
    ],
  },
  {
    id: "neural",
    number: 4,
    titlePrefix: { fr: "L’", en: "The" },
    titleEmphasis: { fr: "osmose", en: "osmosis" },
    shortTitle: { fr: "L’osmose", en: "Osmosis" },
    hintPointer: {
      fr: "Maintenez pour laisser circuler.",
      en: "Hold and let it flow.",
    },
    hintTouch: {
      fr: "Maintenez appuyé pour laisser circuler.",
      en: "Press and hold and let it flow.",
    },
    lines: [
      { fr: "Les frontières deviennent fluides.", en: "Boundaries become fluid." },
      { fr: "Ce qui était dispersé commence à circuler.", en: "What was scattered begins to flow." },
      { fr: "Ce qui se heurtait commence à résonner.", en: "What collided begins to resonate." },
      { fr: "Une osmose naît.", en: "An osmosis is born." },
      { fr: "L’être. Le collectif. Le système.", en: "The self. The collective. The system." },
      { fr: "Une intelligence en mouvement.", en: "An intelligence in motion." },
    ],
  },
];

export const INTRO_V2_END = {
  eyebrow: { fr: "AEGIS", en: "AEGIS" },
  title: { fr: "Entrez dans", en: "Enter" },
  titleEmphasis: { fr: "AEGIS", en: "AEGIS" },
  body: { fr: "", en: "" },
  cta: { fr: "Entrer dans AEGIS", en: "Enter AEGIS" },
  restart: { fr: "Rejouer", en: "Replay" },
} satisfies Record<string, LocaleText>;

export { INTRO_UI, pick };
