/**
 * Single source of truth for public SEO copy, prerender bodies, sitemap eligibility and noindex routes.
 * FR is the primary metadata language (V1: one URL, toggle EN in-app — no hreflang).
 */

import { SEO_DEFAULT_LOCALE, SEO_OG_IMAGE, seoCanonical } from "./site";

export type SeoFaqItem = { question: string; answer: string };

export type SeoPageRecord = {
  route: string;
  indexable: boolean;
  title: string;
  description: string;
  ogTitle: string;
  h1: string;
  canonical: string;
  ogLocale: string;
  ogImage: string;
  noindex?: boolean;
  /** When noindex: `noindex, follow` for funnel pages linked from marketing; default `noindex, nofollow` for private areas. */
  robots?: "noindex, follow" | "noindex, nofollow";
  /** Static HTML inside #root for crawlers without JS (must match visible React copy). */
  prerenderBody: string;
  faq?: SeoFaqItem[];
  lastmod?: string;
};

export const HOME_SEO_COPY = {
  title: "Diagnostic décisionnel pour dirigeants & fondateurs | AEGIS",
  description:
    "AEGIS aide les dirigeants et fondateurs à mieux décider : diagnostic décisionnel gratuit, outils pratiques et lecture de profil.",
  ogTitle: "Diagnostic décisionnel pour dirigeants & fondateurs | AEGIS",
  h1: "Décidez plus clairement, avec moins de bruit cognitif",
  subtitle:
    "AEGIS combine diagnostics décisionnels, outils pratiques et une lecture de profil pour dirigeants, fondateurs et équipes.",
  primaryCta: "Passer le diagnostic gratuit",
  secondaryCta: "Explorer les outils décisionnels",
  tldr:
    "AEGIS est une suite cognitive pour dirigeants : un diagnostic gratuit en 30 questions, dix outils décisionnels sans compte, une lecture de profil par un humain possible, et LOGOS pour confronter vos arbitrages à voix haute.",
} as const;

export const HOME_FAQ: SeoFaqItem[] = [
  {
    question: "Qu'est-ce que le diagnostic décisionnel AEGIS ?",
    answer:
      "Un questionnaire gratuit de 30 questions sur la façon dont vous décidez sous pression. Vous obtenez une cartographie de vos tendances, sans étiquette figée ni test de personnalité.",
  },
  {
    question: "Qu'est-ce que la Lecture Neural ?",
    answer:
      "Après le questionnaire, un humain peut relire votre profil et vous renvoyer une lecture structurée des angles morts et des schémas qui reviennent — en complément des synthèses automatiques.",
  },
  {
    question: "LOGOS, c'est quoi par rapport au diagnostic ?",
    answer:
      "LOGOS est le miroir d'arbitrage vocal : un sparring pour confronter un arbitrage critique à voix haute. Il complète le diagnostic et le suivi, il ne le remplace pas.",
  },
  {
    question: "Les outils sur /tools sont-ils vraiment gratuits ?",
    answer:
      "Oui : calculateurs et micro-diagnostics pour CEO et fondateurs, sans compte obligatoire. Ils servent de premier pas avant le questionnaire approfondi.",
  },
  {
    question: "À qui s'adresse AEGIS ?",
    answer:
      "Aux CEO, fondateurs, dirigeants et membres de comités de direction qui portent des décisions à conséquences réelles et manquent de recul entre deux arbitrages.",
  },
];

function buildHomePrerenderBody(): string {
  return `<main>
<header>
<h1>${HOME_SEO_COPY.h1}</h1>
<blockquote><p>${HOME_SEO_COPY.tldr}</p></blockquote>
<p>${HOME_SEO_COPY.subtitle}</p>
<p><a href="/quiz">Passer le diagnostic gratuit</a> · <a href="/tools">Explorer les outils décisionnels</a></p>
</header>
<section><h2>Le problème</h2>
<p>Fatigue décisionnelle, biais cognitifs, priorisation floue et décisions répétitives : la journée sature, les arbitrages se ressemblent et il reste peu de traces exploitables.</p>
</section>
<section><h2>La solution AEGIS</h2>
<ul>
<li>Diagnostic gratuit (30 questions) et lecture de profil possible.</li>
<li>10 outils décisionnels gratuits sur <a href="/tools">/tools</a>.</li>
<li>LOGOS : miroir d'arbitrage et sparring vocal pour les sujets critiques.</li>
</ul>
</section>
<section><h2>Pour qui</h2>
<p>CEO, fondateurs, dirigeants et équipes de direction.</p>
</section>
<section><h2>Liens utiles</h2>
<p><a href="/tools">Outils décisionnels</a> · <a href="/pricing">Tarifs</a> · <a href="/newsletter">Newsletter</a> · <a href="/entreprise">AEGIS Entreprise</a> · <a href="/quiz">Diagnostic</a></p>
</section>
<section><h2>Questions fréquentes</h2>
${HOME_FAQ.map((f) => `<h3>${f.question}</h3><p>${f.answer}</p>`).join("")}
</section>
</main>`;
}

export const TOOLS_HUB_SEO_COPY = {
  title: "10 outils décisionnels gratuits pour CEO, fondateurs et dirigeants | AEGIS",
  description:
    "Calculateurs et diagnostics gratuits pour dirigeants : coût du coaching, fatigue décisionnelle, biais, priorisation et ROI des cercles de pairs.",
  h1: "Outils décisionnels gratuits pour dirigeants et fondateurs",
  intro:
    "Vous décidez dans l'urgence, avec des signaux partiels et peu de temps pour recalculer. Ces dix micro-outils gratuits traduisent vos habitudes en chiffres et repères : coût réel d'un coaching, fatigue en fin de journée, biais sur un arbitrage bloqué, prix de l'inaction, priorisation d'une nouvelle opportunité, fragmentation de votre stack SaaS ou exposition de données sensibles sur l'IA cloud. Chaque fiche explique le problème, le bénéfice concret et le calculateur à lancer sans compte. Complétez le tableau avec le diagnostic AEGIS (30 questions) pour relier vos scores à un profil de décideur.",
  tldr:
    "Les outils AEGIS sont dix calculateurs gratuits pour CEO et fondateurs : ils quantifient fatigue décisionnelle, biais, coût du coaching, priorisation et inaction, sans compte obligatoire.",
} as const;

export const TOOLS_HUB_FAQ: SeoFaqItem[] = [
  {
    question: "Faut-il un compte AEGIS pour utiliser les outils ?",
    answer:
      "Non. Les calculateurs sont accessibles en gratuit ; un profil dirigeant optionnel affine les seuils et percentiles entre outils.",
  },
  {
    question: "En quoi ces outils diffèrent-ils d'un tableur ?",
    answer:
      "Chaque outil encode un cadre métier (fatigue CEO, coût des pairs, Friend Reframe…) avec des questions guidées et une interprétation narrative, pas une grille vide.",
  },
  {
    question: "Puis-je partager les résultats à mon board ?",
    answer:
      "Oui : les résultats sont conçus pour être exportés ou commentés en comité ; évitez d'y coller des données personnelles identifiables.",
  },
  {
    question: "Comment relier les outils au diagnostic AEGIS ?",
    answer:
      "Le questionnaire de 30 questions cartographie votre façon de décider ; les outils quantifient des symptômes ponctuels. Ensemble, ils donnent un langage commun pour prioriser.",
  },
  {
    question: "Les résultats engagent-ils AEGIS médicalement ou juridiquement ?",
    answer:
      "Non : ce sont des aides à la réflexion pour dirigeants, pas des diagnostics de santé ni des conseils juridiques ou financiers.",
  },
];

/** Optional editorial links from hub to blog (only when article exists). */
export const TOOL_TO_BLOG: Record<string, { path: string; label: string }> = {
  "decision-bias-reframe-tool": {
    path: "/blog/conflit-associes-startup-non-dits",
    label: "Lire : conflit d'associés et non-dits",
  },
  "executive-coaching-cost-calculator": {
    path: "/blog/coach-ia-dirigeants-sparring-vocal",
    label: "Lire : coach, IA et sparring vocal",
  },
};

export const ENTREPRISE_SEO_COPY = {
  title: "AEGIS pour comités de direction : décisions plus claires, moins de biais",
  description:
    "Rendez lisibles les arbitrages de votre comité : motifs récurrents, risques et écarts de trajectoire avant le board. Exocortex hebdomadaire pour équipes de direction.",
  ogTitle: "AEGIS pour comités de direction : décisions plus claires, moins de biais",
  /** Visible hero H1 on /entreprise (LandingHero). */
  h1: "Votre entreprise décide. Personne ne voit. Personne n'entend.",
  heroSubtitle:
    "AEGIS lit chaque semaine ce que l'organisation fait réellement, le compare à la trajectoire choisie, et signale où elle dérive — avant que le board ne le découvre trop tard.",
} as const;

function buildEntreprisePrerenderBody(): string {
  return `<main>
<h1>${ENTREPRISE_SEO_COPY.h1}</h1>
<p>${ENTREPRISE_SEO_COPY.heroSubtitle}</p>
<p><a href="/auth?signup=1">Demander un accès</a> · <a href="/">Offre individuelle</a> · <a href="/tools">Outils gratuits</a> · <a href="/newsletter">Newsletter</a></p>
</main>`;
}

export const PRICING_SEO = {
  route: "/pricing",
  title: "Forfaits AEGIS — Tarifs Solo, LOGOS et Fondateurs",
  description:
    "Tarifs AEGIS : Solo à 35 € HT/mois, Solo + LOGOS à 110 € HT/mois, offre Fondateurs à 350 € HT à vie (20 places). Paiement sécurisé par Stripe.",
  h1: "Forfaits AEGIS",
  body: `<main><h1>Forfaits AEGIS</h1><p>Choisissez votre accès à la suite AEGIS. Prix HT, TVA au paiement selon votre pays.</p><p><a href="/">Accueil</a> · <a href="/newsletter">Newsletter</a></p></main>`,
} as const;

export const NEWSLETTER_SEO = {
  route: "/newsletter",
  title: "Newsletter AEGIS — Archétypes, forme mentale et leadership",
  description:
    "Éditions hebdomadaires sur les archétypes personnels, la forme mentale, la prise de décision et le leadership, par la plateforme de coaching AEGIS.",
  h1: "La newsletter AEGIS",
  body: `<main><h1>La newsletter AEGIS</h1><p>Chaque semaine : archétypes, forme mentale, décision et leadership pour dirigeants.</p><p><a href="/">Accueil</a> · <a href="/pricing">Tarifs</a></p></main>`,
} as const;

/** Draft pilier — not indexed until content is finalized (no route in V1). */
export const DIAGNOSTIC_DECISIONNEL_DRAFT = {
  route: "/diagnostic-decisionnel",
  indexable: false,
  note: "Préparer la page pilier ; ne pas publier tant que le contenu éditorial n'est pas validé.",
};

export const NOINDEX_STATIC_ROUTES: {
  route: string;
  title: string;
  description: string;
  robots: "noindex, follow" | "noindex, nofollow";
}[] = [
  { route: "/auth", title: "Connexion AEGIS", description: "Espace de connexion sécurisé AEGIS.", robots: "noindex, nofollow" },
  { route: "/dashboard", title: "Tableau de bord AEGIS", description: "Espace membre AEGIS.", robots: "noindex, nofollow" },
  { route: "/start", title: "Démarrage AEGIS", description: "Parcours d'onboarding exécutif.", robots: "noindex, nofollow" },
  { route: "/onboarding", title: "Onboarding AEGIS", description: "Configuration du compte AEGIS.", robots: "noindex, nofollow" },
  { route: "/welcome", title: "Espace membre AEGIS", description: "Hub membre AEGIS.", robots: "noindex, nofollow" },
  { route: "/quiz", title: "Questionnaire AEGIS", description: "Diagnostic gratuit — 30 questions sur la façon dont vous décidez.", robots: "noindex, follow" },
  { route: "/visitor", title: "Visiteur AEGIS", description: "Espace visiteur AEGIS.", robots: "noindex, nofollow" },
  { route: "/redeem", title: "AEGIS · AppSumo", description: "Activation AppSumo.", robots: "noindex, nofollow" },
  { route: "/intro", title: "Intro AEGIS", description: "Introduction produit.", robots: "noindex, nofollow" },
  { route: "/reset-password", title: "Réinitialisation mot de passe", description: "Réinitialisation du mot de passe AEGIS.", robots: "noindex, nofollow" },
  { route: "/create-password", title: "Créer un mot de passe", description: "Création du mot de passe AEGIS.", robots: "noindex, nofollow" },
  { route: "/account-deleted", title: "Compte supprimé", description: "Confirmation de suppression de compte.", robots: "noindex, nofollow" },
  { route: "/checkout/success", title: "Paiement confirmé", description: "Confirmation de paiement Stripe.", robots: "noindex, nofollow" },
  { route: "/tools/profile", title: "Profil dirigeant — outils", description: "Calibration du profil pour les outils AEGIS.", robots: "noindex, nofollow" },
  { route: "/install-android", title: "Installer AEGIS Android", description: "Installation de l'application Android AEGIS.", robots: "noindex, nofollow" },
];

export function buildNoindexPrerenderBody(route: string, title: string): string {
  return `<main data-seo-noindex="true"><h1>${title}</h1><p>Page utilitaire AEGIS (${route}).</p></main>`;
}

export function getStaticIndexablePages(): SeoPageRecord[] {
  return [
    {
      route: "/",
      indexable: true,
      title: HOME_SEO_COPY.title,
      description: HOME_SEO_COPY.description,
      ogTitle: HOME_SEO_COPY.ogTitle,
      h1: HOME_SEO_COPY.h1,
      canonical: seoCanonical("/"),
      ogLocale: SEO_DEFAULT_LOCALE,
      ogImage: SEO_OG_IMAGE,
      prerenderBody: buildHomePrerenderBody(),
      faq: HOME_FAQ,
    },
    {
      route: "/entreprise",
      indexable: true,
      title: ENTREPRISE_SEO_COPY.title,
      description: ENTREPRISE_SEO_COPY.description,
      ogTitle: ENTREPRISE_SEO_COPY.ogTitle,
      h1: ENTREPRISE_SEO_COPY.h1,
      canonical: seoCanonical("/entreprise"),
      ogLocale: SEO_DEFAULT_LOCALE,
      ogImage: SEO_OG_IMAGE,
      prerenderBody: buildEntreprisePrerenderBody(),
    },
    {
      route: PRICING_SEO.route,
      indexable: true,
      title: PRICING_SEO.title,
      description: PRICING_SEO.description,
      ogTitle: PRICING_SEO.title,
      h1: PRICING_SEO.h1,
      canonical: seoCanonical(PRICING_SEO.route),
      ogLocale: SEO_DEFAULT_LOCALE,
      ogImage: SEO_OG_IMAGE,
      prerenderBody: PRICING_SEO.body,
    },
    {
      route: NEWSLETTER_SEO.route,
      indexable: true,
      title: NEWSLETTER_SEO.title,
      description: NEWSLETTER_SEO.description,
      ogTitle: NEWSLETTER_SEO.title,
      h1: NEWSLETTER_SEO.h1,
      canonical: seoCanonical(NEWSLETTER_SEO.route),
      ogLocale: SEO_DEFAULT_LOCALE,
      ogImage: SEO_OG_IMAGE,
      prerenderBody: NEWSLETTER_SEO.body,
    },
  ];
}

export function buildToolsHubPageRecord(toolListHtml: string): SeoPageRecord {
  return {
    route: "/tools",
    indexable: true,
    title: TOOLS_HUB_SEO_COPY.title,
    description: TOOLS_HUB_SEO_COPY.description,
    ogTitle: TOOLS_HUB_SEO_COPY.title,
    h1: TOOLS_HUB_SEO_COPY.h1,
    canonical: seoCanonical("/tools"),
    ogLocale: SEO_DEFAULT_LOCALE,
    ogImage: SEO_OG_IMAGE,
    faq: TOOLS_HUB_FAQ,
    prerenderBody: `<main>
<h1>${TOOLS_HUB_SEO_COPY.h1}</h1>
<blockquote><p>${TOOLS_HUB_SEO_COPY.tldr}</p></blockquote>
<p>${TOOLS_HUB_SEO_COPY.intro}</p>
<p><a href="/quiz">Passer le diagnostic AEGIS</a> · <a href="/">Accueil</a></p>
<ul>${toolListHtml}</ul>
<section><h2>Questions fréquentes</h2>
${TOOLS_HUB_FAQ.map((f) => `<h3>${f.question}</h3><p>${f.answer}</p>`).join("")}
</section>
</main>`,
  };
}

export function buildNoindexPageRecords(toolRunRoutes: string[]): SeoPageRecord[] {
  const staticPages = NOINDEX_STATIC_ROUTES.map((p) => ({
    route: p.route,
    indexable: false,
    noindex: true,
    robots: p.robots,
    title: p.title,
    description: p.description,
    ogTitle: p.title,
    h1: p.title,
    canonical: seoCanonical(p.route),
    ogLocale: SEO_DEFAULT_LOCALE,
    ogImage: SEO_OG_IMAGE,
    prerenderBody: buildNoindexPrerenderBody(p.route, p.title),
  }));
  const runPages = toolRunRoutes.map((route) => ({
    route,
    indexable: false,
    noindex: true,
    robots: "noindex, nofollow" as const,
    title: "Calculateur AEGIS",
    description: "Session interactive d'un outil décisionnel AEGIS.",
    ogTitle: "Calculateur AEGIS",
    h1: "Calculateur AEGIS",
    canonical: seoCanonical(route),
    ogLocale: SEO_DEFAULT_LOCALE,
    ogImage: SEO_OG_IMAGE,
    prerenderBody: buildNoindexPrerenderBody(route, "Calculateur AEGIS"),
  }));
  return [...staticPages, ...runPages];
}