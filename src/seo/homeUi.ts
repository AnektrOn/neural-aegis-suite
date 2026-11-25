/** Visible home copy (FR primary + EN mirror) aligned with HOME_SEO_COPY / prerender. */

import { HOME_SEO_COPY } from "./seoPages";

type Bi = { fr: string; en: string };

export const homeHeroUi = {
  chip: {
    fr: "Diagnostic décisionnel · Dirigeants & fondateurs",
    en: "Decision diagnostic · Leaders & founders",
  },
  h1: {
    fr: HOME_SEO_COPY.h1,
    en: "Decide more clearly, with less cognitive noise",
  },
  subtitle: {
    fr: HOME_SEO_COPY.subtitle,
    en: "AEGIS combines decision diagnostics, practical tools, and a human profile reading for executives, founders, and leadership teams.",
  },
  primaryCta: { fr: HOME_SEO_COPY.primaryCta, en: "Take the free diagnostic" },
  secondaryCta: { fr: HOME_SEO_COPY.secondaryCta, en: "Explore decision tools" },
  tldr: {
    fr: HOME_SEO_COPY.tldr,
    en: "AEGIS is a cognitive suite for leaders: a free 30-question diagnostic, ten decision tools without an account, an optional human profile reading, and LOGOS for voice arbitration.",
  },
} as const;

export const homeProblemSection: { title: Bi; body: Bi } = {
  title: {
    fr: "Fatigue décisionnelle, biais et arbitrages qui reviennent",
    en: "Decision fatigue, bias, and repeating trade-offs",
  },
  body: {
    fr: "Entre l'urgence, la priorisation floue et les décisions répétitives, il manque une trace lisible : ce qui a pesé, ce qui fatigue, ce qui se reproduit. Sans recul, le même schéma revient sous un autre prétexte.",
    en: "Between urgency, fuzzy priorities, and repeated calls, there is little readable trace of what weighed, what drains you, and what repeats. Without distance, the same pattern returns under another name.",
  },
};

export const homeSolutionSection: {
  title: Bi;
  items: { title: Bi; body: Bi }[];
} = {
  title: { fr: "Comment AEGIS vous aide à décider", en: "How AEGIS helps you decide" },
  items: [
    {
      title: { fr: "Diagnostic gratuit", en: "Free diagnostic" },
      body: {
        fr: "30 questions sur la personne qui décide : cartographie de vos tendances sous pression, sans étiquette.",
        en: "30 questions on how you decide under pressure — a map of your tendencies, not a label.",
      },
    },
    {
      title: { fr: "Outils décisionnels", en: "Decision tools" },
      body: {
        fr: "Dix calculateurs gratuits : fatigue, biais, coût du coaching, priorisation, inaction.",
        en: "Ten free calculators: fatigue, bias, coaching cost, prioritization, cost of inaction.",
      },
    },
    {
      title: { fr: "Lecture Neural", en: "Neural Reading" },
      body: {
        fr: "Un humain peut relire votre profil et nommer ce qui revient — en complément des synthèses automatiques.",
        en: "A human can read your profile and name what repeats — alongside automated syntheses.",
      },
    },
  ],
};

export const homeLogosSection: { title: Bi; body: Bi } = {
  title: {
    fr: "LOGOS : miroir d'arbitrage et sparring vocal",
    en: "LOGOS: arbitration mirror and voice sparring",
  },
  body: {
    fr: "Pour les arbitrages critiques, parlez à voix haute : LOGOS confronte vos angles morts sans complaisance. Produit vocal complémentaire, pas un substitut au diagnostic.",
    en: "For critical trade-offs, speak aloud: LOGOS confronts blind spots without flattery. A complementary voice product, not a substitute for the diagnostic.",
  },
};

export const homeAudienceSection: { title: Bi; body: Bi } = {
  title: { fr: "Pour qui", en: "Who it's for" },
  body: {
    fr: "CEO, fondateurs, dirigeants et équipes de direction qui portent des décisions à conséquences réelles.",
    en: "CEOs, founders, executives, and leadership teams carrying decisions with real consequences.",
  },
};

export const homeFaqUi: { q: Bi; a: Bi }[] = [
  {
    q: { fr: "Qu'est-ce que le diagnostic décisionnel AEGIS ?", en: "What is the AEGIS decision diagnostic?" },
    a: {
      fr: "Un questionnaire gratuit de 30 questions sur la façon dont vous décidez sous pression. Vous obtenez une cartographie de vos tendances, sans étiquette figée.",
      en: "A free 30-question flow on how you decide under pressure — a map of tendencies, not a fixed label.",
    },
  },
  {
    q: { fr: "Qu'est-ce que la Lecture Neural ?", en: "What is the Neural Reading?" },
    a: {
      fr: "Un humain peut relire votre profil et structurer les angles morts et schémas qui reviennent, en complément des synthèses automatiques.",
      en: "A human can read your profile and structure blind spots and repeating patterns, alongside automated syntheses.",
    },
  },
  {
    q: { fr: "LOGOS, c'est quoi par rapport au diagnostic ?", en: "What is LOGOS relative to the diagnostic?" },
    a: {
      fr: "LOGOS est le miroir d'arbitrage vocal pour confronter un sujet critique à voix haute. Il complète le diagnostic, il ne le remplace pas.",
      en: "LOGOS is the voice arbitration mirror for critical trade-offs spoken aloud. It complements the diagnostic; it does not replace it.",
    },
  },
  {
    q: { fr: "Les outils sur /tools sont-ils gratuits ?", en: "Are the /tools calculators free?" },
    a: {
      fr: "Oui : micro-outils pour dirigeants sans compte obligatoire, en entrée avant le questionnaire approfondi.",
      en: "Yes — micro-tools for leaders without a mandatory account, as a first step before the full questionnaire.",
    },
  },
  {
    q: { fr: "À qui s'adresse AEGIS ?", en: "Who is AEGIS for?" },
    a: {
      fr: "CEO, fondateurs, dirigeants et équipes de direction qui portent des décisions à conséquences réelles.",
      en: "CEOs, founders, executives, and leadership teams carrying decisions with real consequences.",
    },
  },
];

export const homeDiscoverLinks: { to: string; label: Bi }[] = [
  { to: "/tools", label: { fr: "Outils décisionnels", en: "Decision tools" } },
  { to: "/pricing", label: { fr: "Tarifs", en: "Pricing" } },
  { to: "/newsletter", label: { fr: "Newsletter", en: "Newsletter" } },
  { to: "/entreprise", label: { fr: "AEGIS Entreprise", en: "AEGIS Enterprise" } },
  { to: "/blog", label: { fr: "Blog", en: "Blog" } },
];