# Landing AEGIS individuel (`/`) — export source complet

> Export lecture / revue hors-ligne. Chaîne : `AegisLandingPage` (`audience=individuel`) → `WelcomeView` + nébula scroll.
> Fichier régénérable ; ne pas éditer ici — modifier les sources listées ci-dessous.

## Table des matières

- `src/pages/aegis-landing/AegisLandingPage.tsx`
- `src/pages/aegis-landing/landingCtaHrefs.ts`
- `src/pages/aegis-landing/i18n/AegisLandingLocaleProvider.tsx`
- `src/pages/aegis-landing/i18n/aegisLandingCopy.ts`
- `src/features/welcome/components/WelcomeView.tsx`
- `src/features/welcome/components/WelcomeLandingNebula.tsx`
- `src/features/welcome/components/WelcomeQuantumNebula.tsx`
- `src/features/welcome/components/SilentDemoPlayer.tsx`
- `src/features/welcome/hooks/useWelcomeLandingNebulaWordDrive.ts`
- `src/features/welcome/hooks/useWelcomeNebulaViewportLayout.ts`
- `src/features/welcome/welcomeNebulaScrollStory.ts`
- `src/features/welcome/welcomeNebulaWordLayout.ts`
- `src/components/ui/quantum-nebula-hero-v3.tsx`
- `src/components/ui/quantumNebulaWordMask.ts`
- `src/components/ui/quantumNebulaViewportFlow.ts`
- `src/features/welcome/DESIGN.md`

## `src/pages/aegis-landing/AegisLandingPage.tsx`

```tsx
import { Helmet } from "react-helmet-async";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import "./aegisLanding.css";
import { AegisLandingLocaleProvider, useAegisLandingLocale } from "./i18n/AegisLandingLocaleProvider";
import type { AegisLandingAudience } from "./i18n/aegisLandingCopy";
import { LANDING_QUIZ_HREF } from "./landingCtaHrefs";
import { LandingNav } from "./components/LandingNav";
import { LandingHero } from "./components/LandingHero";
import { MobileStickyCta } from "./components/MobileStickyCta";
import { LandingFooter } from "./components/LandingFooter";
import { WelcomeView } from "@/features/welcome/components/WelcomeView";

const ProblemSection = lazy(() =>
  import("./sections/ProblemSection").then((m) => ({ default: m.ProblemSection })),
);
const ManifestoSection = lazy(() =>
  import("./sections/ManifestoSection").then((m) => ({ default: m.ManifestoSection })),
);
const RecevezSection = lazy(() =>
  import("./sections/RecevezSection").then((m) => ({ default: m.RecevezSection })),
);
const CommentCaMarcheSection = lazy(() =>
  import("./sections/CommentCaMarcheSection").then((m) => ({ default: m.CommentCaMarcheSection })),
);
const ComparatifSection = lazy(() =>
  import("./sections/ComparatifSection").then((m) => ({ default: m.ComparatifSection })),
);
const PourQuiSection = lazy(() =>
  import("./sections/PourQuiSection").then((m) => ({ default: m.PourQuiSection })),
);
const DonneesSection = lazy(() =>
  import("./sections/DonneesSection").then((m) => ({ default: m.DonneesSection })),
);
const TarifSection = lazy(() =>
  import("./sections/TarifSection").then((m) => ({ default: m.TarifSection })),
);
const FaqSection = lazy(() =>
  import("./sections/FaqSection").then((m) => ({ default: m.FaqSection })),
);
const FinalCtaSection = lazy(() =>
  import("./sections/FinalCtaSection").then((m) => ({ default: m.FinalCtaSection })),
);

const LANDING_OG_IMAGE =
  "https://aegis.humancatalystbeacon.com/aegis-landing/hero-scene-1440.jpg";
const LANDING_CANONICAL_INDIV = "https://aegis.humancatalystbeacon.com/";
const LANDING_CANONICAL_ENT = "https://aegis.humancatalystbeacon.com/entreprise";

function LandingHelmet({ audience }: { audience: AegisLandingAudience }) {
  const { copy, locale } = useAegisLandingLocale();
  const canonical =
    audience === "entreprise" ? LANDING_CANONICAL_ENT : LANDING_CANONICAL_INDIV;
  return (
    <Helmet>
      <title>{copy.meta.title}</title>
      <meta name="description" content={copy.meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={copy.meta.ogTitle} />
      <meta property="og:description" content={copy.meta.description} />
      <meta property="og:image" content={LANDING_OG_IMAGE} />
      <meta property="og:locale" content={locale === "en" ? "en_US" : "fr_FR"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={copy.meta.ogTitle} />
      <meta name="twitter:description" content={copy.meta.description} />
      <meta name="twitter:image" content={LANDING_OG_IMAGE} />
      <meta name="theme-color" content="#0b0b0a" />
    </Helmet>
  );
}

function LandingSections() {
  return (
    <>
      <ProblemSection />
      <ManifestoSection />
      <RecevezSection />
      <CommentCaMarcheSection />
      <ComparatifSection />
      <PourQuiSection />
      <DonneesSection />
      <TarifSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

/** Public AEGIS marketing page. `audience` is chosen by the route (`/` vs `/entreprise`). */
export default function AegisLandingPage({
  audience = "individuel",
}: {
  audience?: AegisLandingAudience;
}) {
  const navigate = useNavigate();

  if (audience === "individuel") {
    return (
      <AegisLandingLocaleProvider audience={audience}>
        <LandingHelmet audience={audience} />
        <WelcomeView onStartAudit={() => navigate(LANDING_QUIZ_HREF)} />
      </AegisLandingLocaleProvider>
    );
  }

  return (
    <AegisLandingLocaleProvider audience={audience}>
      <LandingHelmet audience={audience} />
      <div className="aegis-landing relative min-h-dvh pb-32 sm:pb-0">
        <LandingSkip />
        <LandingNav />
        <main id="aegis-landing-main">
          <LandingHero />
          <Suspense fallback={null}>
            <LandingSections />
          </Suspense>
        </main>
        <LandingFooter />
        <MobileStickyCta />
      </div>
    </AegisLandingLocaleProvider>
  );
}

function LandingSkip() {
  const { copy } = useAegisLandingLocale();
  return (
    <a className="aegis-landing__skip" href="#aegis-landing-main">
      {copy.nav.skip}
    </a>
  );
}
```

## `src/pages/aegis-landing/landingCtaHrefs.ts`

```typescript
/** Lecture checkout lives on the pricing page until a dedicated Stripe link exists. */
export const LIEN_PAIEMENT_LECTURE = "/pricing";

export const LANDING_QUIZ_HREF = "/quiz";
```

## `src/pages/aegis-landing/i18n/AegisLandingLocaleProvider.tsx`

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  AEGIS_LANDING_COPY,
  type AegisLandingAudience,
  type AegisLandingCopy,
  type AegisLandingLocale,
} from "./aegisLandingCopy";
import { useLanguage } from '@/i18n/LanguageContext';

type Ctx = {
  locale: AegisLandingLocale;
  setLocale: (l: AegisLandingLocale) => void;
  audience: AegisLandingAudience;
  copy: AegisLandingCopy;
};

const AegisLandingLocaleContext = createContext<Ctx | null>(null);

/** Locale + audience context. Locale persists in `localStorage`; audience is a route prop. */
export function AegisLandingLocaleProvider({
  audience,
  children,
}: {
  audience: AegisLandingAudience;
  children: ReactNode;
}) {
  const { locale, setLocale } = useLanguage();

  const copy = AEGIS_LANDING_COPY[audience][locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, audience, copy }),
    [locale, setLocale, audience, copy],
  );

  return (
    <AegisLandingLocaleContext.Provider value={value}>
      {children}
    </AegisLandingLocaleContext.Provider>
  );
}

/** Must be called under `AegisLandingLocaleProvider`. */
export function useAegisLandingLocale() {
  const ctx = useContext(AegisLandingLocaleContext);
  if (!ctx) throw new Error("useAegisLandingLocale outside provider");
  return ctx;
}
```

## `src/pages/aegis-landing/i18n/aegisLandingCopy.ts`

```typescript
import { LANDING_QUIZ_HREF, LIEN_PAIEMENT_LECTURE } from "../landingCtaHrefs";

/** Landing-only catalog (not `src/i18n/translations.ts`). */
export type AegisLandingLocale = "fr" | "en";
export type AegisLandingAudience = "individuel" | "entreprise";

export type AegisLandingCopy = {
  meta: {
    title: string;
    ogTitle: string;
    description: string;
  };
  nav: {
    comment: string;
    pourQui: string;
    tarif: string;
    faq: string;
    tools: string;
    cta: string;
    langFr: string;
    signUpFree: string;
    langEn: string;
    audienceIndividuel: string;
    audienceEntreprise: string;
    primary: string;
    audience: string;
    skip: string;
    menu: string;
    menuClose: string;
    lang: string;
    signIn: string;
  };
  hero: {
    chip: string;
    title: string;
    subtitle: string;
    cta: string;
    caption: string;
    scrollLabel: string;
    ghostWordmark: string;
  };
  problem: {
    label: string;
    title: string;
    col1: string;
    col2: string;
    points?: string[];
    diagramLabel?: string;
  };
  manifesto: {
    label: string;
    title: string;
    body: string;
    cardLabel: string;
    cardBody: string;
  } | null;
  recevez: {
    label: string;
    title: string;
    cards: { title: string; body: string }[];
    reportTitle: string;
    weekLabel: string;
    weekPlaceholder: string;
    illustrative: string;
    mockup: {
      risk: string;
      opportunity: string;
      alignment: string;
      alerts: string;
      alertsItems: string[];
      synthesis: string;
      synthesisBody: string;
      load: string;
      heatmapTitle?: string;
      heatmapRows?: string[];
      chartTitle?: string;
    };
    heatmapLegend?: string;
  };
  comment: {
    label: string;
    title: string;
    steps: { title: string; body: string }[];
  };
  comparatif: {
    label: string;
    title: string;
    headers: { feature: string; aegis: string; autres: string };
    rows: { feature: string; aegis: boolean; autres: boolean }[];
    yes: string;
    no: string;
  };
  pourQui: {
    label: string;
    title: string;
    cards: { title: string; bullets: string[] }[];
  };
  donnees: {
    label: string;
    title: string;
    body: string;
    points: string[];
  };
  tarif: {
    label: string;
    title: string;
    chip: string;
    body?: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    ctaHref?: string;
    secondaryCta?: string;
    secondaryCtaHref?: string;
  };
  faq: {
    label: string;
    title: string;
    items: { q: string; a: string }[];
  };
  finalCta: {
    title: string;
    cta: string;
    caption?: string;
  };
  footer: {
    product: string;
    legal: string;
    links: { href: string; label: string }[];
    copyright: string;
  };
};

const footerFr = {
  product: "AEGIS",
  legal: "Légal",
  links: [
    { href: "/legal/mentions", label: "Mentions légales" },
    { href: "/legal/terms", label: "Conditions générales" },
    { href: "/legal/privacy", label: "Confidentialité" },
    { href: "/legal/refund", label: "Remboursement" },
  ],
  copyright: "© Protocole Nomos",
} as const;

const footerEn = {
  product: "AEGIS",
  legal: "Legal",
  links: [
    { href: "/legal/mentions", label: "Legal notice" },
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/legal/refund", label: "Refunds" },
  ],
  copyright: "© Protocole Nomos",
} as const;

const navFr = {
  comment: "Comment ça marche",
  pourQui: "Pour qui",
  tarif: "Tarif",
  faq: "FAQ",
  tools: "Outils CEO",
  langFr: "FR",
  langEn: "EN",
  audienceIndividuel: "Individuel",
  audienceEntreprise: "Entreprise",
  primary: "Navigation principale",
  audience: "Offre",
  skip: "Aller au contenu",
  menu: "Ouvrir le menu",
  menuClose: "Fermer le menu",
  lang: "Langue",
  signIn: "Se connecter",
  signUpFree: "S’inscrire gratuitement",
} as const;

const navEn = {
  comment: "How it works",
  pourQui: "Who it's for",
  tarif: "Pricing",
  faq: "FAQ",
  tools: "CEO tools",
  langFr: "FR",
  langEn: "EN",
  audienceIndividuel: "Individual",
  audienceEntreprise: "Enterprise",
  primary: "Main navigation",
  audience: "Audience",
  skip: "Skip to content",
  menu: "Open menu",
  menuClose: "Close menu",
  lang: "Language",
  signIn: "Sign in",
  signUpFree: "Sign up for free",
} as const;

const individuelFr: AegisLandingCopy = {
  meta: {
    title: "AEGIS — LOGOS | Fin de la solitude décisionnelle",
    ogTitle: "AEGIS — La fin de la solitude décisionnelle pour dirigeants",
    description:
      "Audit gratuit en 30 questions (32 pôles). Puis, si vous le souhaitez, une Grande Lecture à 149 € et l’exocortex vocal LOGOS — sans document à uploader.",
  },
  nav: {
    ...navFr,
    cta: "Réserver ma Lecture — 149 €",
    signUpFree: "Faire le questionnaire — 30 questions, gratuit",
  },
  hero: {
    chip: "AEGIS · POUR CELUI QUI DÉCIDE SEUL",
    title: "Vous décidez seul. Vous reprenez les mêmes décisions. Vous le savez.",
    subtitle:
      "AEGIS est l'exocortex qui lit chaque semaine ce que vous faites réellement, le compare à la trajectoire que vous avez choisie, et vous dit où vous dérivez.",
    cta: "Réserver ma Lecture — 149 €",
    caption: "Réponse sous 24 h",
    scrollLabel: "Défiler vers le contenu",
    ghostWordmark: "AEGIS",
  },
  problem: {
    label: "LE PROBLÈME",
    title: "Vous ne manquez pas de lucidité. Vous manquez de recul sur vos propres décisions.",
    col1:
      "Chaque semaine, vous tranchez vite : priorités, recrutements, arbitrages budgétaires, conversations difficiles. Sur le moment, la décision paraît évidente.",
    col2:
      "Deux mois plus tard, le même type de situation revient. Les mêmes tensions, les mêmes compromis. Sans trace structurée, vous ne voyez pas le motif — seulement le résultat.",
  },
  manifesto: null,
  recevez: {
    label: "CE QUE VOUS RECEVEZ",
    title: "Chaque semaine, un rapport qui confronte vos actes à votre trajectoire.",
    cards: [
      { title: "Décisions", body: "Ce que vous avez tranché, reporté ou délégué." },
      { title: "Risques", body: "Où la trajectoire se fragilise avant qu'il soit trop tard." },
      { title: "Signaux", body: "Les répétitions que vous ne percevez plus au quotidien." },
      { title: "Énergie", body: "Le coût réel des arbitrages sur votre capacité." },
      { title: "Relations", body: "Les tensions qui influencent vos choix sans être nommées." },
    ],
    reportTitle: "Rapport hebdomadaire",
    weekLabel: "Semaine",
    weekPlaceholder: "12",
    illustrative: "Exemple illustratif",
    mockup: {
      risk: "Risque",
      opportunity: "Opportunité",
      alignment: "Alignement",
      alerts: "Alertes",
      alertsItems: [
        "Arbitrage budget Q4 reporté trois fois",
        "Tension non traitée avec le COO",
        "Même priorité déclarée, peu d'actions visibles",
      ],
      synthesis: "Synthèse stratégique",
      synthesisBody:
        "Vous dites vouloir accélérer le recrutement produit, mais votre calendrier consacre moins de 8 % à ce sujet sur deux semaines.",
      load: "Charge décisionnelle",
    },
  },
  comment: {
    label: "COMMENT ÇA MARCHE",
    title: "Quatre gestes. Un rythme hebdomadaire.",
    steps: [
      {
        title: "Connecter vos sources",
        body: "Calendrier, notes, décisions — uniquement ce que vous choisissez de partager.",
      },
      {
        title: "AEGIS lit et structure",
        body: "Chaque semaine, l'exocortex compare vos actes à la trajectoire déclarée.",
      },
      {
        title: "Vous validez le contexte",
        body: "Vous corrigez, complétez ou nuancez — le rapport reste ancré dans votre réalité.",
      },
      {
        title: "Vous recevez le rapport",
        body: "Synthèse lisible en quelques minutes, avant la semaine suivante.",
      },
    ],
  },
  comparatif: {
    label: "COMPARATIF",
    title: "Ce que d'autres outils ne tiennent pas sur une semaine de direction.",
    headers: { feature: "", aegis: "AEGIS", autres: "Autres solutions" },
    yes: "Oui",
    no: "Non",
    rows: [
      { feature: "Lecture hebdomadaire de vos décisions réelles", aegis: true, autres: false },
      { feature: "Comparaison à une trajectoire que vous définissez", aegis: true, autres: false },
      { feature: "Synthèse actionnable en moins de dix minutes", aegis: true, autres: false },
      { feature: "Sans coach, sans tableau de bord à maintenir", aegis: true, autres: false },
      { feature: "Conçu pour un seul décideur", aegis: true, autres: false },
    ],
  },
  pourQui: {
    label: "POUR QUI",
    title: "Un produit pour les personnes qui portent la décision finale.",
    cards: [
      {
        title: "Celui qui décide seul",
        bullets: [
          "Vous portez seul des arbitrages que personne ne voit en entier.",
          "Vous voulez un miroir hebdomadaire, pas un outil de plus.",
          "Vous acceptez de confronter vos actes à vos intentions.",
        ],
      },
      {
        title: "Investisseurs et boards",
        bullets: [
          "Vous devez lire vite où un portefeuille ou une équipe dérive.",
          "Vous cherchez de la clarté, pas du bruit de conformité.",
          "Vous voulez un langage commun sur les risques de décision.",
        ],
      },
    ],
  },
  donnees: {
    label: "DONNÉES & CONFIDENTIALITÉ",
    title: "Vos données restent les vôtres. Le rapport est pour vous seul.",
    body:
      "AEGIS traite uniquement les sources que vous connectez. Rien n'est revendu, rien n'alimente un modèle public.",
    points: [
      "Chiffrement en transit et au repos",
      "Accès limité à votre compte",
      "Suppression sur demande",
      "Localisation d'hébergement précisée à la souscription",
    ],
  },
  tarif: {
    label: "TARIF",
    title: "Les offres AEGIS Solo",
    chip: "",
    body:
      "Vous passez le questionnaire complet. Une personne lit votre dossier, vous écrit un rapport, puis vous en parle trente minutes en visio. Elle vous dit ce qu'elle voit, pas quoi faire.",
    price: "149 € HT, une fois",
    period: "",
    features: [
      "Remboursée dans les 30 jours sur simple e-mail, sans justification.",
      "Une suite vous sera proposée en fin de rendez-vous, sans obligation.",
    ],
    cta: "Réserver ma Lecture — 149 €",
    ctaHref: LIEN_PAIEMENT_LECTURE,
    secondaryCta: "Commencer par le questionnaire gratuit",
    secondaryCtaHref: LANDING_QUIZ_HREF,
  },
  faq: {
    label: "FAQ",
    title: "Questions fréquentes",
    items: [
      {
        q: "Quand reçois-je le premier rapport ?",
        a: "Après validation de votre accès et connexion des premières sources. Le délai vous est communiqué à la validation.",
      },
      {
        q: "AEGIS décide-t-il à ma place ?",
        a: "Non. AEGIS confronte vos actes à votre trajectoire et formule des hypothèses. Vous gardez la décision.",
      },
      {
        q: "Quelles données sont nécessaires ?",
        a: "Un minimum pour établir une lecture hebdomadaire : calendrier, notes de décision ou journal structuré — selon les sources que vous connectez.",
      },
      {
        q: "Puis-je arrêter à tout moment ?",
        a: "Oui. L'abonnement est mensuel. Les conditions de résiliation sont détaillées dans les CGV.",
      },
      {
        q: "Le rapport est-il partageable ?",
        a: "Par défaut, non. Vous choisissez si une synthèse sort de votre espace.",
      },
      {
        q: "Qui peut demander un accès ?",
        a: "Le produit cible celui qui décide seul et les membres de boards. Chaque demande est revue manuellement.",
      },
    ],
  },
  finalCta: {
    title: "Dans trois mois, vous aurez soit changé, soit répété.",
    cta: "Réserver ma Lecture — 149 €",
  },
  footer: { ...footerFr, links: [...footerFr.links] },
};

const individuelEn: AegisLandingCopy = {
  meta: {
    title: "AEGIS — LOGOS | End of decision-making solitude",
    ogTitle: "AEGIS — The end of decision-making solitude for executives",
    description:
      "Free 30-question audit (32 poles). Then, if you wish, a €149 Grand Reading and the LOGOS vocal exocortex — no documents to upload.",
  },
  nav: {
    ...navEn,
    cta: "Book my Reading — €149",
    signUpFree: "Take the assessment — 30 questions, free",
  },
  hero: {
    chip: "AEGIS · FOR THE PERSON WHO DECIDES ALONE",
    title: "You decide alone. You make the same calls again. You know it.",
    subtitle:
      "AEGIS is the exocortex that reads what you actually do each week, compares it to the trajectory you chose, and tells you where you drift.",
    cta: "Book my Reading — €149",
    caption: "Reply within 24 hours",
    scrollLabel: "Scroll to content",
    ghostWordmark: "AEGIS",
  },
  problem: {
    label: "THE PROBLEM",
    title: "You don't lack lucidity. You lack distance on your own decisions.",
    col1:
      "Every week you cut fast: priorities, hires, budget calls, hard conversations. In the moment, the decision feels obvious.",
    col2:
      "Two months later the same kind of situation returns. The same tensions, the same compromises. Without a structured trace, you don't see the pattern — only the result.",
  },
  manifesto: null,
  recevez: {
    label: "WHAT YOU RECEIVE",
    title: "Each week, a report that holds your actions against your trajectory.",
    cards: [
      { title: "Decisions", body: "What you cut, deferred, or delegated." },
      { title: "Risks", body: "Where the trajectory weakens before it's too late." },
      { title: "Signals", body: "The repetitions you no longer notice day to day." },
      { title: "Energy", body: "The real cost of those calls on your capacity." },
      { title: "Relationships", body: "The tensions that shape your choices without being named." },
    ],
    reportTitle: "Weekly report",
    weekLabel: "Week",
    weekPlaceholder: "12",
    illustrative: "Illustrative example",
    mockup: {
      risk: "Risk",
      opportunity: "Opportunity",
      alignment: "Alignment",
      alerts: "Alerts",
      alertsItems: [
        "Q4 budget call deferred three times",
        "Unresolved tension with the COO",
        "Same declared priority, few visible actions",
      ],
      synthesis: "Strategic synthesis",
      synthesisBody:
        "You say you want to accelerate product hiring, but your calendar gives that topic less than 8% over two weeks.",
      load: "Decision load",
    },
  },
  comment: {
    label: "HOW IT WORKS",
    title: "Four moves. A weekly rhythm.",
    steps: [
      {
        title: "Connect your sources",
        body: "Calendar, notes, decisions — only what you choose to share.",
      },
      {
        title: "AEGIS reads and structures",
        body: "Each week the exocortex compares your actions to the declared trajectory.",
      },
      {
        title: "You validate the context",
        body: "You correct, complete, or nuance — the report stays anchored in your reality.",
      },
      {
        title: "You receive the report",
        body: "A synthesis you can read in minutes, before the next week starts.",
      },
    ],
  },
  comparatif: {
    label: "COMPARE",
    title: "What other tools don't hold across a week of leadership.",
    headers: { feature: "", aegis: "AEGIS", autres: "Other solutions" },
    yes: "Yes",
    no: "No",
    rows: [
      { feature: "Weekly reading of your actual decisions", aegis: true, autres: false },
      { feature: "Comparison to a trajectory you define", aegis: true, autres: false },
      { feature: "Actionable synthesis in under ten minutes", aegis: true, autres: false },
      { feature: "No coach, no dashboard to maintain", aegis: true, autres: false },
      { feature: "Built for a single decision-maker", aegis: true, autres: false },
    ],
  },
  pourQui: {
    label: "WHO IT'S FOR",
    title: "A product for people who carry the final call.",
    cards: [
      {
        title: "The person who decides alone",
        bullets: [
          "You carry calls no one else sees in full.",
          "You want a weekly mirror, not another tool.",
          "You accept holding your actions against your intent.",
        ],
      },
      {
        title: "Investors and boards",
        bullets: [
          "You need to see quickly where a portfolio or a team is drifting.",
          "You want clarity, not compliance noise.",
          "You want a shared language on decision risk.",
        ],
      },
    ],
  },
  donnees: {
    label: "DATA & PRIVACY",
    title: "Your data stays yours. The report is for you alone.",
    body: "AEGIS processes only the sources you connect. Nothing is resold. Nothing trains a public model.",
    points: [
      "Encryption in transit and at rest",
      "Access limited to your account",
      "Deletion on request",
      "Hosting location confirmed at signup",
    ],
  },
  tarif: {
    label: "PRICING",
    title: "AEGIS Solo plans",
    chip: "",
    body:
      "You take the full assessment. An analyst reviews your file, writes your report, and discusses it with you for thirty minutes on video. They tell you what they see, not what to do.",
    price: "€149 excl. tax, one-time",
    period: "",
    features: [
      "100% refunded within 30 days upon simple email request, no questions asked.",
      "Next steps offered at the end of the meeting, with zero obligation.",
    ],
    cta: "Book my Reading — €149",
    ctaHref: LIEN_PAIEMENT_LECTURE,
    secondaryCta: "Start with the free assessment",
    secondaryCtaHref: LANDING_QUIZ_HREF,
  },
  faq: {
    label: "FAQ",
    title: "Common questions",
    items: [
      {
        q: "When do I get the first report?",
        a: "After your access is approved and the first sources are connected. Timing is confirmed when access is granted.",
      },
      {
        q: "Does AEGIS decide for me?",
        a: "No. AEGIS holds your actions against your trajectory and forms hypotheses. You keep the decision.",
      },
      {
        q: "What data is required?",
        a: "A minimum to establish a weekly reading: calendar, decision notes, or a structured journal — depending on the sources you connect.",
      },
      {
        q: "Can I stop at any time?",
        a: "Yes. Billing is monthly. Cancellation terms are in the terms of service.",
      },
      {
        q: "Can the report be shared?",
        a: "By default, no. You choose if a synthesis leaves your workspace.",
      },
      {
        q: "Who can request access?",
        a: "The product is for the person who decides alone and for board members. Each request is reviewed manually.",
      },
    ],
  },
  finalCta: {
    title: "In three months you will have either changed, or repeated.",
    cta: "Book my Reading — €149",
  },
  footer: { ...footerEn, links: [...footerEn.links] },
};

const entrepriseFr: AegisLandingCopy = {
  meta: {
    title: "AEGIS — Exocortex décisionnel pour comités de direction et entreprises",
    ogTitle: "AEGIS — Votre entreprise décide. Personne ne voit le motif.",
    description:
      "Un exocortex décisionnel hebdomadaire pour comités exécutifs, équipes de direction et conseils d'administration.",
  },
  nav: { ...navFr, cta: "Demander un accès" },
  hero: {
    chip: "AEGIS · EXOCORTEX POUR ENTREPRISES",
    title: "Votre entreprise décide.\nPersonne ne voit.\nPersonne n'entend.",
    subtitle:
      "AEGIS lit chaque semaine ce que l'organisation fait réellement, le compare à la trajectoire que vous avez choisie, et vous dit où elle dérive — avant que le board le découvre trop tard.",
    cta: "Demander un accès",
    caption: "Sur devis · Réponse sous 24 h",
    scrollLabel: "Défiler vers le contenu",
    ghostWordmark: "AEGIS",
  },
  problem: {
    label: "LE PROBLÈME",
    title: "Vous avez des tableaux de bord. Personne ne voit le motif.",
    col1:
      "Chaque semaine, des dizaines d'arbitrages : priorités, recrutements, budgets, escalades. Chacun paraît local. Personne ne tient le fil de l'entreprise.",
    col2:
      "Un trimestre plus tard, le même type de friction revient. Les mêmes reports, les mêmes tensions. Sans trace structurée, l'organisation ne voit pas le motif — seulement le résultat.",
    points: [
      "Les décisions se prennent en comité, puis se perdent.",
      "Personne ne tient le fil d'une semaine à l'autre.",
      "Le même écart revient le trimestre suivant.",
      "Le board le découvre trop tard.",
    ],
    diagramLabel: "Réseau de décisions. Le nœud cerclé est un écart qui se répète.",
  },
  manifesto: {
    label: "CE QUE AEGIS CHANGE",
    title: "AEGIS ne remplace pas votre culture.\nIl met par écrit ce que vos équipes ont déjà décidé.",
    body: "Le rapport n'ajoute pas un process. Il rend visible le motif — pour ceux qui portent la décision finale.",
    cardLabel: "Lecture COMEX",
    cardBody: "Une synthèse hebdomadaire. Les écarts, pas les tableaux de bord.",
  },
  recevez: {
    label: "CE QUE VOUS RECEVEZ",
    title: "Chaque semaine, un rapport qui confronte les actes de l'organisation à sa trajectoire.",
    cards: [
      { title: "Décisions", body: "Ce que l'équipe a tranché, reporté ou délégué." },
      { title: "Risques", body: "Où la trajectoire collective se fragilise avant qu'il soit trop tard." },
      { title: "Signaux", body: "Les répétitions que plus personne ne nomme en comité." },
      { title: "Énergie", body: "Le coût réel des arbitrages sur la capacité de l'équipe." },
      { title: "Relations", body: "Les tensions qui influencent les choix sans être mises sur la table." },
    ],
    reportTitle: "Rapport hebdomadaire",
    weekLabel: "Semaine",
    weekPlaceholder: "12",
    illustrative: "Exemple illustratif",
    mockup: {
      risk: "Risque",
      opportunity: "Opportunité",
      alignment: "Alignement",
      alerts: "Alertes",
      alertsItems: [
        "Arbitrage budget Q4 reporté trois fois",
        "Tension non traitée au COMEX",
        "Même priorité déclarée, peu d'actions visibles",
      ],
      synthesis: "Synthèse stratégique",
      synthesisBody:
        "La direction dit vouloir accélérer le recrutement produit, mais le calendrier de l'équipe y consacre moins de 8 % sur deux semaines.",
      load: "Charge décisionnelle",
      heatmapTitle: "Charge par rôle",
      heatmapRows: ["DG", "DAF", "Produit", "Sales", "Ops", "RH", "Legal", "Board"],
      chartTitle: "Écart à la trajectoire",
    },
    heatmapLegend: "Charge : faible → élevée",
  },
  comment: {
    label: "COMMENT ÇA MARCHE",
    title: "Quatre gestes. Un rythme pour le COMEX.",
    steps: [
      {
        title: "Connecter les sources de l'équipe",
        body: "Calendriers, notes, décisions — uniquement ce que l'entreprise choisit de partager.",
      },
      {
        title: "AEGIS lit et structure",
        body: "Chaque semaine, l'exocortex compare les actes à la trajectoire déclarée.",
      },
      {
        title: "Vous validez le contexte",
        body: "Le sponsor corrige, complète ou nuance — le rapport reste ancré dans la réalité de l'organisation.",
      },
      {
        title: "Le COMEX reçoit le rapport",
        body: "Une synthèse lisible en quelques minutes, avant la semaine suivante.",
      },
    ],
  },
  comparatif: {
    label: "COMPARATIF",
    title: "Ce que d'autres outils ne tiennent pas sur une semaine de direction.",
    headers: { feature: "", aegis: "AEGIS", autres: "Autres solutions" },
    yes: "Oui",
    no: "Non",
    rows: [
      { feature: "Lecture hebdomadaire des décisions réelles de l'organisation", aegis: true, autres: false },
      { feature: "Comparaison à une trajectoire définie par la direction", aegis: true, autres: false },
      { feature: "Synthèse actionnable en moins de dix minutes", aegis: true, autres: false },
      { feature: "Sans consultant permanent, sans dashboard à animer", aegis: true, autres: false },
      { feature: "Conçu pour un COMEX, pas pour toute l'entreprise", aegis: true, autres: false },
    ],
  },
  pourQui: {
    label: "POUR QUI",
    title: "Un produit pour les organisations qui portent la décision finale.",
    cards: [
      {
        title: "COMEX et scale-ups",
        bullets: [
          "La direction porte des arbitrages que plus personne ne voit en entier.",
          "Vous voulez un miroir hebdomadaire, pas un outil de plus à déployer.",
          "Vous acceptez de confronter les actes de l'équipe à l'intention déclarée.",
        ],
      },
      {
        title: "Holdings et fonds",
        bullets: [
          "Vous devez lire vite où une participation ou une équipe dérive.",
          "Vous cherchez de la clarté, pas du bruit de conformité.",
          "Vous voulez un langage commun sur les risques de décision.",
        ],
      },
    ],
  },
  donnees: {
    label: "DONNÉES & CONFIDENTIALITÉ",
    title: "Les données de l'entreprise restent les vôtres.",
    body:
      "AEGIS traite uniquement les sources que vous connectez. Rien n'est revendu, rien n'alimente un modèle public. Les accès sont nominatifs.",
    points: [
      "Chiffrement en transit et au repos",
      "Accès limité aux comptes habilités",
      "Suppression sur demande",
      "Localisation d'hébergement précisée à la souscription",
    ],
  },
  tarif: {
    label: "TARIF",
    title: "Un déploiement. Un rythme hebdomadaire.",
    chip: "SUR DEVIS",
    price: "Sur devis",
    period: "",
    features: [
      "Rapport hebdomadaire pour l'équipe de direction",
      "Connexion des sources que l'entreprise choisit",
      "Historique des trajectoires et des écarts",
      "Accompagnement de déploiement · réponse sous 24 h",
    ],
    cta: "Demander un accès entreprise",
  },
  faq: {
    label: "FAQ",
    title: "Questions fréquentes",
    items: [
      {
        q: "Quand recevons-nous le premier rapport ?",
        a: "Après validation de l'accès, cadrage du déploiement et connexion des premières sources. Le délai est communiqué au cadrage.",
      },
      {
        q: "AEGIS décide-t-il à la place du COMEX ?",
        a: "Non. AEGIS confronte les actes à la trajectoire et formule des hypothèses. La décision reste à la direction.",
      },
      {
        q: "Quelles données sont nécessaires ?",
        a: "Un minimum pour une lecture hebdomadaire : calendriers, notes de décision, ou un journal structuré — selon les sources que l'entreprise connecte.",
      },
      {
        q: "Qui voit le rapport ?",
        a: "Les comptes que vous habilitez. Par défaut, rien ne sort de l'espace entreprise.",
      },
      {
        q: "Peut-on arrêter ?",
        a: "Oui. Les conditions sont détaillées dans le contrat et les CGV.",
      },
      {
        q: "Pour combien de personnes ?",
        a: "L'offre cible un COMEX ou un comité restreint, pas un déploiement à toute l'entreprise. Le volume est défini au cadrage.",
      },
    ],
  },
  finalCta: {
    title: "Commencez par ceux qui\ndécident.",
    cta: "Demander un accès entreprise",
    caption: "Sur devis · Réponse sous 24 h",
  },
  footer: { ...footerFr, links: [...footerFr.links] },
};

const entrepriseEn: AegisLandingCopy = {
  meta: {
    title: "AEGIS — Decision exocortex for companies & leadership teams",
    ogTitle: "AEGIS — Your company decides. No one sees the pattern.",
    description:
      "A weekly decision exocortex for executive committees, leadership teams, and boards.",
  },
  nav: { ...navEn, cta: "Request access" },
  hero: {
    chip: "AEGIS · EXOCORTEX FOR COMPANIES",
    title: "Your company decides.\nNo one sees.\nNo one hears.",
    subtitle:
      "Each week AEGIS reads what the organisation actually does, compares it to the trajectory you chose, and tells you where it drifts — before the board finds out too late.",
    cta: "Request access",
    caption: "Custom pricing · Reply within 24 hours",
    scrollLabel: "Scroll to content",
    ghostWordmark: "AEGIS",
  },
  problem: {
    label: "THE PROBLEM",
    title: "You have dashboards. No one sees the pattern.",
    col1:
      "Every week, dozens of calls: priorities, hires, budgets, escalations. Each one looks local. No one holds the company's thread.",
    col2:
      "A quarter later the same friction returns. The same slips, the same tensions. Without a structured trace, the organisation doesn't see the pattern — only the result.",
    points: [
      "Calls are made in committee, then lost.",
      "No one holds the thread from one week to the next.",
      "The same gap returns the following quarter.",
      "The board finds out too late.",
    ],
    diagramLabel: "Decision network. The ringed node is a repeating gap.",
  },
  manifesto: {
    label: "WHAT AEGIS CHANGES",
    title: "AEGIS does not replace your culture.\nIt writes down what your teams have already decided.",
    body: "The report does not add a process. It makes the pattern visible — for those who carry the final call.",
    cardLabel: "Exec reading",
    cardBody: "A weekly synthesis. The gaps, not the dashboards.",
  },
  recevez: {
    label: "WHAT YOU RECEIVE",
    title: "Each week, a report that holds the organisation's actions against its trajectory.",
    cards: [
      { title: "Decisions", body: "What the team cut, deferred, or delegated." },
      { title: "Risks", body: "Where the collective trajectory weakens before it's too late." },
      { title: "Signals", body: "The repetitions no one names in committee anymore." },
      { title: "Energy", body: "The real cost of those calls on the team's capacity." },
      { title: "Relationships", body: "The tensions that shape choices without being put on the table." },
    ],
    reportTitle: "Weekly report",
    weekLabel: "Week",
    weekPlaceholder: "12",
    illustrative: "Illustrative example",
    mockup: {
      risk: "Risk",
      opportunity: "Opportunity",
      alignment: "Alignment",
      alerts: "Alerts",
      alertsItems: [
        "Q4 budget call deferred three times",
        "Unresolved tension in the exec team",
        "Same declared priority, few visible actions",
      ],
      synthesis: "Strategic synthesis",
      synthesisBody:
        "Leadership says it wants to accelerate product hiring, but the team's calendar gives that topic less than 8% over two weeks.",
      load: "Decision load",
      heatmapTitle: "Load by role",
      heatmapRows: ["CEO", "CFO", "Product", "Sales", "Ops", "HR", "Legal", "Board"],
      chartTitle: "Gap to trajectory",
    },
    heatmapLegend: "Load: low → high",
  },
  comment: {
    label: "HOW IT WORKS",
    title: "Four moves. A rhythm for the exec team.",
    steps: [
      {
        title: "Connect the team's sources",
        body: "Calendars, notes, decisions — only what the company chooses to share.",
      },
      {
        title: "AEGIS reads and structures",
        body: "Each week the exocortex compares actions to the declared trajectory.",
      },
      {
        title: "You validate the context",
        body: "The sponsor corrects, completes, or nuances — the report stays anchored in the organisation's reality.",
      },
      {
        title: "The exec team receives the report",
        body: "A synthesis you can read in minutes, before the next week starts.",
      },
    ],
  },
  comparatif: {
    label: "COMPARE",
    title: "What other tools don't hold across a week of leadership.",
    headers: { feature: "", aegis: "AEGIS", autres: "Other solutions" },
    yes: "Yes",
    no: "No",
    rows: [
      { feature: "Weekly reading of the organisation's actual decisions", aegis: true, autres: false },
      { feature: "Comparison to a trajectory set by leadership", aegis: true, autres: false },
      { feature: "Actionable synthesis in under ten minutes", aegis: true, autres: false },
      { feature: "No standing consultant, no dashboard to run", aegis: true, autres: false },
      { feature: "Built for an exec team, not the whole company", aegis: true, autres: false },
    ],
  },
  pourQui: {
    label: "WHO IT'S FOR",
    title: "A product for organisations that carry the final call.",
    cards: [
      {
        title: "Exec teams and scale-ups",
        bullets: [
          "Leadership carries calls no one else sees in full.",
          "You want a weekly mirror, not another tool to roll out.",
          "You accept holding the team's actions against declared intent.",
        ],
      },
      {
        title: "Holdings and funds",
        bullets: [
          "You need to see quickly where a holding or a team is drifting.",
          "You want clarity, not compliance noise.",
          "You want a shared language on decision risk.",
        ],
      },
    ],
  },
  donnees: {
    label: "DATA & PRIVACY",
    title: "The company's data stays yours.",
    body:
      "AEGIS processes only the sources you connect. Nothing is resold. Nothing trains a public model. Access is named.",
    points: [
      "Encryption in transit and at rest",
      "Access limited to authorised accounts",
      "Deletion on request",
      "Hosting location confirmed at signup",
    ],
  },
  tarif: {
    label: "PRICING",
    title: "One deployment. A weekly rhythm.",
    chip: "CUSTOM PRICING",
    price: "Custom",
    period: "",
    features: [
      "Weekly report for the leadership team",
      "Connect the sources the company chooses",
      "History of trajectories and gaps",
      "Deployment support · reply within 24 hours",
    ],
    cta: "Request company access",
  },
  faq: {
    label: "FAQ",
    title: "Common questions",
    items: [
      {
        q: "When do we get the first report?",
        a: "After access is approved, deployment is scoped, and the first sources are connected. Timing is confirmed during scoping.",
      },
      {
        q: "Does AEGIS decide for the exec team?",
        a: "No. AEGIS holds actions against the trajectory and forms hypotheses. Leadership keeps the decision.",
      },
      {
        q: "What data is required?",
        a: "A minimum for a weekly reading: calendars, decision notes, or a structured journal — depending on the sources the company connects.",
      },
      {
        q: "Who sees the report?",
        a: "The accounts you authorise. By default, nothing leaves the company workspace.",
      },
      {
        q: "Can we stop?",
        a: "Yes. Terms are in the contract and the terms of service.",
      },
      {
        q: "For how many people?",
        a: "The offer is for an exec team or a small committee, not a company-wide rollout. Headcount is set during scoping.",
      },
    ],
  },
  finalCta: {
    title: "Start with the people\nwho decide.",
    cta: "Request company access",
    caption: "Custom pricing · Reply within 24 hours",
  },
  footer: { ...footerEn, links: [...footerEn.links] },
};

export const AEGIS_LANDING_COPY: Record<
  AegisLandingAudience,
  Record<AegisLandingLocale, AegisLandingCopy>
> = {
  individuel: { fr: individuelFr, en: individuelEn },
  entreprise: { fr: entrepriseFr, en: entrepriseEn },
};
```

## `src/features/welcome/components/WelcomeView.tsx`

```tsx
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  Compass,
  Eye,
  Flame,
  Languages,
  Menu,
  Mic,
  Shield,
  ShieldAlert,
  Sliders,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { useLanguage } from "@/i18n/LanguageContext";
import AegisLogo from "@/components/AegisLogo";
import { SOLO_PRICING } from "@/pages/aegis-landing/soloPricing";
import {
  SOLO_ACTIVE_PULSE_CARDS,
  SOLO_LOGOS_ACTIVE_PULSE_CARDS,
  SOLO_LOGOS_WEEKLY_TOOLBOX_ITEMS,
  SOLO_WEEKLY_TOOLBOX_ITEMS,
} from "@/lib/soloPlanQuotas";
import { V4_QUESTIONS } from "@/features/archetype-assessment/domain/questionsV4";
import { ARCHETYPES } from "@/features/archetype-assessment/domain/archetypes";
import { WelcomeLandingNebula } from "./WelcomeLandingNebula";
import { SilentDemoPlayer } from "./SilentDemoPlayer";

export interface WelcomeViewProps {
  onStartAudit: () => void;
}

interface MatrixRow {
  criterionFr: string;
  criterionEn: string;
  boardFr: string;
  boardEn: string;
  coachFr: string;
  coachEn: string;
  logosFr: string;
  logosEn: string;
  highlight?: boolean;
}

/**
 * Matrice de Douleur Décisionnelle — La 1ère ligne ancre immédiatement le coût annuel réel constaté
 * (18 000 € – 50 000 € / an vs 149 € Grande Lecture / 1 320 € / an / 350 € Fondateurs à vie).
 */
const MATRIX_ROWS: MatrixRow[] = [
  {
    criterionFr: "Coût Annuel Réel Constaté",
    criterionEn: "Observed True Annual Cost",
    boardFr:
      "25 000 € à 80 000 € / an (jetons de présence, BSA/equity dilutif, frais juridiques et inertie politique).",
    boardEn:
      "€25,000 to €80,000 / year (board fees, dilutive equity/warrants, legal overhead, and political inertia).",
    coachFr:
      "18 000 € à 50 000 € / an (500 € à 1 500 € / heure sur 24 à 36 séances fixes, sans disponibilité d'urgence).",
    coachEn:
      "€18,000 to €50,000 / year (€500 to €1,500 / hour across 24–36 fixed sessions, zero emergency availability).",
    logosFr:
      "350 € une fois à vie (Palier Fondateurs, 20 sièges) ou 1 320 € / an (110 € / mois) • Passerelle Grande Lecture à 149 € (100 % déductible).",
    logosEn:
      "€350 once for life (Founders tier, 20 seats) or €1,320 / year (€110 / month) • €149 Grand Reading bridge (100% deductible).",
    highlight: true,
  },
  {
    criterionFr: "Degré de Transparence",
    criterionEn: "Degree of Transparency",
    boardFr:
      "Biaisé par la préservation des intérêts personnels et la politique de gouvernance.",
    boardEn:
      "Biased by self-interest preservation and governance politics.",
    coachFr:
      "Limité par la complaisance commerciale et le besoin de fidéliser le contrat.",
    coachEn:
      "Constrained by commercial complacency and contract retention incentives.",
    logosFr:
      "Neutralité chirurgicale absolue : aucun intérêt politique ou affectif en jeu.",
    logosEn:
      "Absolute surgical neutrality: zero political or emotional stake.",
  },
  {
    criterionFr: "Disponibilité Temporelle",
    criterionEn: "Temporal Availability",
    boardFr:
      "Réunions programmées trimestrielles, inertie de convocation en urgence.",
    boardEn:
      "Quarterly scheduled meetings, high inertia when convening in emergencies.",
    coachFr:
      "Séances bi-mensuelles fixes de 60 minutes avec latence entre les crises.",
    coachEn:
      "Fixed bi-monthly 60-minute sessions with latency between crises.",
    logosFr:
      "Présence vocale immédiate 24 heures sur 24 et 7 jours sur 7 à chaque point de rupture.",
    logosEn:
      "Immediate 24/7 vocal presence at every strategic breaking point.",
  },
  {
    criterionFr: "Continuité Mémorielle",
    criterionEn: "Memory Continuity",
    boardFr:
      "Rétention d'information stratégique sélective selon les alliances du conseil.",
    boardEn:
      "Selective strategic information retention shaped by board alliances.",
    coachFr:
      "Amnésie fréquente entre deux sessions imposant de réexpliquer le contexte.",
    coachEn:
      "Frequent amnesia between sessions requiring constant context re-explanation.",
    logosFr:
      "Continuité stratégique parfaite adossée à une clé de chiffrement souveraine unique.",
    logosEn:
      "Flawless strategic continuity backed by a unique sovereign encryption key.",
  },
  {
    criterionFr: "Exigence de Vérité",
    criterionEn: "Truth Requirement",
    boardFr:
      "Aveu de doute proscrit sous peine d'affaiblir sa position d'autorité.",
    boardEn:
      "Admitting doubt is forbidden under penalty of weakening executive authority.",
    coachFr:
      "Bienveillance passive tendant à valider les rationalisations du fondateur.",
    coachEn:
      "Passive benevolence tending to validate the founder's rationalizations.",
    logosFr:
      "Confrontation sans fard qui attaque directement les angles morts et les dénis.",
    logosEn:
      "Unvarnished confrontation directly targeting blind spots and denials.",
  },
  {
    criterionFr: "Format du Livrable",
    criterionEn: "Deliverable Format",
    boardFr:
      "Procès-verbaux juridiques formels et arbitrages de compromis dilués.",
    boardEn:
      "Formal legal minutes and diluted compromise arbitrations.",
    coachFr:
      "Recommandations générales déconnectées des urgences opérationnelles réelles.",
    coachEn:
      "Generic recommendations disconnected from real operational emergencies.",
    logosFr:
      "Verdict décisionnel formulé en moins de quatre minutes avec scénarios d'action.",
    logosEn:
      "Decision verdict formulated in under four minutes with actionable scenarios.",
  },
];

/**
 * Les 5 Calculateurs Exécutifs interactifs (/tools/...) mis en avant en 60 secondes
 */
const FEATURED_MICRO_TOOLS = [
  {
    code: "CALC_01",
    href: "/tools/cost-of-delayed-decision-calculator/run",
    tagFr: "60 SEC // TRÉSORERIE",
    tagEn: "60 SEC // TREASURY",
    titleFr: "Calculateur du coût d'inaction",
    titleEn: "Cost of Delayed Decision Calculator",
    blurbFr:
      "Chiffrez la perte financière et le flottement d'équipe quand un arbitrage critique glisse de 1 à 3 mois.",
    blurbEn:
      "Quantify financial burn and team drift when a critical arbitration slips by 1 to 3 months.",
  },
  {
    code: "CALC_02",
    href: "/tools/decision-bias-reframe-tool/run",
    tagFr: "60 SEC // GOUVERNANCE",
    tagEn: "60 SEC // GOVERNANCE",
    titleFr: "Test de friction & biais d'arbitrage",
    titleEn: "Partner Friction & Bias Reframe Test",
    blurbFr:
      "Trois filtres d'inversion clinique pour débloquer une impasse d'associés ou un dilemme figé.",
    blurbEn:
      "Three clinical inversion filters to break a partner deadlock or frozen strategic dilemma.",
  },
  {
    code: "CALC_03",
    href: "/tools/executive-coaching-cost-calculator/run",
    tagFr: "60 SEC // BENCHMARK ROI",
    tagEn: "60 SEC // ROI BENCHMARK",
    titleFr: "Vrai coût d'un coaching dirigeant",
    titleEn: "True Executive Coaching Cost",
    blurbFr:
      "Comparez vos honoraires annuels de conseil (18 k€–50 k€/an) avec un exocortex vocal 24/7.",
    blurbEn:
      "Compare annual advisory fees (€18k–€50k/yr) against a 24/7 vocal decision exocortex.",
  },
  {
    code: "CALC_04",
    href: "/tools/ceo-decision-fatigue-index/run",
    tagFr: "60 SEC // CHARGE COGNITIVE",
    tagEn: "60 SEC // COGNITIVE LOAD",
    titleFr: "Indice de fatigue décisionnelle CEO",
    titleEn: "CEO Decision Fatigue Index",
    blurbFr:
      "Mesurez le taux d'arbitrages repoussés après 18h et votre saturation préfrontale hebdomadaire.",
    blurbEn:
      "Measure post-6 PM deferred decisions and your weekly prefrontal saturation.",
  },
  {
    code: "CALC_05",
    href: "/tools/executive-context-switching-calculator/run",
    tagFr: "60 SEC // DISPERSION",
    tagEn: "60 SEC // FRAGMENTATION",
    titleFr: "Perte par bascule de contexte",
    titleEn: "Executive Context-Switching Loss",
    blurbFr:
      "Heures perdues chaque semaine à reconstituer le fil entre board, investisseurs et opérationnel.",
    blurbEn:
      "Hours lost each week reconstructing context across board, investors, and operations.",
  },
] as const;

const VOICE_PILLARS = [
  {
    index: "01",
    kickerFr: "IMMÉDIATETÉ OPÉRATIONNELLE",
    kickerEn: "OPERATIONAL IMMEDIACY",
    titleFr: "Zéro temps de frappe",
    titleEn: "Zero typing overhead",
    metricFr: "0 DOC // 0 CLAVIER",
    metricEn: "0 DOCS // 0 KEYBOARD",
    bodyFr:
      "Déchargez une impasse mentale en marchant ou en quittant un comité de direction, sans jamais ouvrir un éditeur de texte.",
    bodyEn:
      "Offload a mental deadlock while walking or leaving an executive committee, without ever opening a text editor.",
  },
  {
    index: "02",
    kickerFr: "MAÏEUTIQUE SANS COMPLAISANCE",
    kickerEn: "UNCOMPROMISING MAIEUTICS",
    titleFr: "Détection des rationalisations",
    titleEn: "Rationalization detection",
    metricFr: "ISOLATION DES BIAIS",
    metricEn: "BIAS ISOLATION",
    bodyFr:
      "LOGOS relève instantanément les non-dits et les biais émotionnels que vous masquez d'ordinaire à vos équipes.",
    bodyEn:
      "LOGOS instantaneously surfaces the unspoken assumptions and emotional biases you normally mask from your teams.",
  },
  {
    index: "03",
    kickerFr: "ARBITRAGE SOUVERAIN",
    kickerEn: "SOVEREIGN ARBITRATION",
    titleFr: "Verdict opérationnel d'action",
    titleEn: "Operational action verdict",
    metricFr: "VERDICT < 4 MIN",
    metricEn: "VERDICT < 4 MIN",
    bodyFr:
      "Chaque échange se conclut par des arbitrages nets et un plan d'action prêt à être exécuté.",
    bodyEn:
      "Every exchange concludes with sharp arbitrations and an execution-ready action plan.",
  },
];

const PROTOCOL_STEPS = [
  {
    step: "01",
    durationFr: "00:00 — 01:15",
    durationEn: "00:00 — 01:15",
    titleFr: "Décharge vocale à chaud",
    titleEn: "Live vocal offload",
    bodyFr:
      "En sortant d'un conseil ou face à une tension critique, vous exposez la situation à voix haute, sans préparation ni mise en forme.",
    bodyEn:
      "Stepping out of a board meeting or facing a critical deadlock, you state the situation aloud with zero preparation or formatting.",
  },
  {
    step: "02",
    durationFr: "01:15 — 02:30",
    durationEn: "01:15 — 02:30",
    titleFr: "Croisement avec vos 32 pôles",
    titleEn: "Cross-check against your 32 poles",
    bodyFr:
      "Le noyau AEGIS croise votre récit avec votre cartographie issue du questionnaire (Alliance Lumière, Conseil de l'Ombre et Gardiens de Survie).",
    bodyEn:
      "The AEGIS core cross-references your narrative with your assessment cartography (Light Alliance, Shadow Council, and Survival Guards).",
  },
  {
    step: "03",
    durationFr: "02:30 — 03:30",
    durationEn: "02:30 — 03:30",
    titleFr: "Confrontation maïeutique",
    titleEn: "Maieutic confrontation",
    bodyFr:
      "Deux à trois questions chirurgicales brisent vos mécanismes de défense (Saboteur, Prostituée, Enfant ou Victime en ombre) et forcent l'arbitrage.",
    bodyEn:
      "Two to three surgical questions shatter your defense mechanisms (Saboteur, Prostitute, Child, or Victim in shadow) and force arbitration.",
  },
  {
    step: "04",
    durationFr: "03:30 — 04:00",
    durationEn: "03:30 — 04:00",
    titleFr: "Verdict décisionnel verrouillé",
    titleEn: "Locked decision verdict",
    bodyFr:
      "Vous repartez avec un arbitrage tranché, les séquences d'exécution immédiates et la trace consignée dans votre registre souverain.",
    bodyEn:
      "You leave with a decisive arbitration, immediate execution sequences, and the trace logged in your sovereign registry.",
  },
];

const QUIZ_DIMENSIONS = [
  {
    id: "identity",
    range: "Q01 — Q06",
    sampleQuestionPos: 1,
    titleFr: "Identité & Réflexes d'Effondrement",
    titleEn: "Identity & Collapse Reflexes",
    descFr:
      "Votre réaction instinctive quand vos repères s'effondrent, vos peurs inavouables nocturnes et votre rapport à la règle.",
    descEn:
      "Your instinctive reaction when bearings collapse, your unspoken nocturnal fears, and your relationship to rules.",
  },
  {
    id: "power",
    range: "Q07 — Q12",
    sampleQuestionPos: 7,
    titleFr: "Pouvoir, Décision & Confrontation",
    titleEn: "Power, Decision & Confrontation",
    descFr:
      "Votre mécanique d'arbitrage sous pression, votre posture en plein conflit, votre réaction à l'échec visible et à la discipline.",
    descEn:
      "Your arbitration mechanics under pressure, your posture in conflict, and your reaction to visible failure and discipline.",
  },
  {
    id: "relationship",
    range: "Q13 — Q18",
    sampleQuestionPos: 17,
    titleFr: "Relations, Frontières & Trahison",
    titleEn: "Relationships, Boundaries & Betrayal",
    descFr:
      "Votre place spontanée dans un collectif, la gestion de vos limites face aux demandes excessives et vos réflexes face à la trahison.",
    descEn:
      "Your spontaneous role in a group, boundary management under excessive demands, and reflexes facing betrayal.",
  },
  {
    id: "creation",
    range: "Q19 — Q24",
    sampleQuestionPos: 22,
    titleFr: "Création, Argent, Risque & Intégrité",
    titleEn: "Creation, Money, Risk & Integrity",
    descFr:
      "Votre rapport à l'argent, à l'incertitude et aux dilemmes où la sécurité matérielle exige de compromettre vos principes.",
    descEn:
      "Your relationship to money, uncertainty, and dilemmas where material security demands compromising your principles.",
  },
  {
    id: "spirituality",
    range: "Q25 — Q30",
    sampleQuestionPos: 27,
    titleFr: "Vérité, Adversité Irréversible & Héritage",
    titleEn: "Truth, Irreversible Adversity & Legacy",
    descFr:
      "Votre exigence de vérité, la transmutation des épreuves irréversibles et l'empreinte souveraine que vous laissez.",
    descEn:
      "Your truth requirement, transmutation of irreversible trials, and the sovereign legacy you leave behind.",
  },
] as const;

const INTENSITY_PREVIEW = [
  { level: 1, fr: "Occasionnel (×1)", en: "Occasional (×1)" },
  { level: 2, fr: "Fréquent (×2)", en: "Frequent (×2)" },
  { level: 3, fr: "Systématique (×3)", en: "Systematic (×3)" },
] as const;

const FAQ_ITEMS = [
  {
    qFr: "Comment fonctionne exactement le questionnaire d'audit en 30 questions ?",
    qEn: "How exactly does the 30-question audit assessment work?",
    aFr: "Contrairement aux tests de personnalité binaires, l'audit AEGIS V4 traverse 5 dimensions cliniques (Identité, Pouvoir, Relations, Création & Argent, Vérité & Héritage) à travers 30 mises en situation et 180 vecteurs comportementaux. Sur chaque question, vous sélectionnez vos réactions réelles et calibrez leur intensité : Occasionnel (×1), Fréquent (×2) ou Systématique (×3). Le moteur calcule instantanément l'activation de vos 16 archétypes sur 32 pôles (Lumière & Ombre).",
    aEn: "Unlike binary personality tests, the AEGIS V4 audit spans 5 clinical dimensions (Identity, Power, Relationships, Creation & Money, Truth & Legacy) across 30 situational prompts and 180 behavioral vectors. On each question, you select your actual reactions and calibrate their intensity: Occasional (×1), Frequent (×2), or Systematic (×3). The engine instantaneously computes your activation across 16 archetypes and 32 poles (Light & Shadow).",
  },
  {
    qFr: "Qu'est-ce que la « Grande Lecture à 149 € » proposée à l'issue de la 30ᵉ question ?",
    qEn: "What is the '€149 Grand Reading' offered after the 30th question?",
    aFr: "À la fin du questionnaire gratuit, vous recevez immédiatement votre rapport Deep Dive V4. Pour les dirigeants qui veulent éprouver la voix de LOGOS sur un arbitrage critique réel sans s'engager d'emblée sur un abonnement mensuel, la Grande Lecture à 149 € HT (paiement unique) ouvre une session d'arbitrage approfondie de 45 minutes sur votre dossier et vos 32 pôles. Ces 149 € sont 100 % déductibles si vous basculez ensuite sur le plan Membres Fondateurs à 350 € (qui vous revient alors à 201 € à vie).",
    aEn: "Upon completing the free questionnaire, you immediately receive your V4 Deep Dive report. For executives who want to test LOGOS's voice on a real critical arbitration without immediately committing to a monthly plan, the €149 Grand Reading (one-time payment) unlocks a 45-minute deep arbitration session on your case and your 32 poles. That €149 is 100% deductible if you subsequently upgrade to the €350 Founding Members lifetime tier (leaving just €201 for lifetime access).",
  },
  {
    qFr: "Pourquoi n'y a-t-il aucun document à importer dans la version Dirigeant ?",
    qEn: "Why are there no documents to import in the Executive edition?",
    aFr: "Un dirigeant sous haute tension n'a ni le temps ni la disponibilité mentale pour maintenir une base documentaire. Votre cartographie à 32 pôles fournit déjà à LOGOS la matrice exacte de vos réflexes cognitifs et de vos zones de compromission. Dès que vous parlez, la maïeutique vocale croise vos paroles avec vos pôles d'Ombre et extrait la vérité opérationnelle en moins de 4 minutes. L'interfaçage avec les flux documentaires d'entreprise est réservé à LOGOS Business.",
    aEn: "An executive under high tension has neither the time nor the mental bandwidth to maintain a document repository. Your 32-pole cartography already equips LOGOS with the exact matrix of your cognitive reflexes and compromise zones. As soon as you speak, vocal maieutics cross-checks your words against your Shadow poles and extracts operational truth in under 4 minutes. Enterprise document stream interfacing is reserved for LOGOS Business.",
  },
  {
    qFr: "Comment est garantie la confidentialité de mon audit et de mes arbitrages ?",
    qEn: "How is the confidentiality of my audit and arbitrations guaranteed?",
    aFr: "LOGOS opère sous une architecture de confidentialité stricte : chiffrement en transit et au repos, cloisonnement par compte, et aucune exploitation de vos réponses ou échanges vocaux pour entraîner des modèles externes.",
    aEn: "LOGOS operates under a strict confidentiality architecture: encryption in transit and at rest, per-account isolation, and no use of your answers or vocal exchanges to train external models.",
  },
  {
    qFr: "LOGOS prend-il la décision à ma place ?",
    qEn: "Does LOGOS make decisions on my behalf?",
    aFr: "Jamais. Vous conservez l'entière responsabilité du commandement. LOGOS agit comme un exocortex de confrontation : il détecte quand votre Saboteur ou votre besoin de contrôle (Souverain en ombre) fausse votre jugement, et structure les scénarios d'arbitrage pour que vous tranchiez en pleine lucidité.",
    aEn: "Never. You retain full command responsibility. LOGOS acts as a confrontational exocortex: it detects when your Saboteur or need for control (Shadow Sovereign) distorts your judgment, and structures arbitration scenarios so you decide with full lucidity.",
  },
  {
    qFr: "Puis-je résilier ou modifier mon accès à tout moment ?",
    qEn: "Can I cancel or modify my access at any time?",
    aFr: "Oui. Les paliers mensuels AEGIS Solo et AEGIS + LOGOS Solo sont sans engagement de durée, et le plan Membres Fondateurs (350 € une fois, limité à 20 sièges) inclut une garantie sérénité intégrale de 30 jours.",
    aEn: "Yes. The monthly AEGIS Solo and AEGIS + LOGOS Solo tiers carry no long-term lock-in, and the Founding Members tier (€350 once, limited to 20 seats) includes a full 30-day serenity guarantee.",
  },
];

const NAV_LINKS = [
  { href: "#demo-vocale", fr: "Démo", en: "Demo" },
  { href: "#rupture-vocale", fr: "Voix Pure", en: "Pure Voice" },
  { href: "#anatomie-quiz", fr: "Audit 30Q", en: "30Q Audit" },
  { href: "#matrice", fr: "Matrice & ROI", en: "Matrix & ROI" },
  { href: "#tarifs", fr: "Tarifs", en: "Pricing" },
  { href: "#calculateurs", fr: "Calculateurs", en: "Calculators" },
  { href: "#faq", fr: "FAQ", en: "FAQ" },
] as const;

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartAudit }) => {
  const { fadeUp } = useAegisMotion();
  const { locale, setLocale } = useLanguage();
  const isFR = locale !== "en";
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedDimensionIdx, setSelectedDimensionIdx] = useState<number>(1);
  const [previewOptionIdx, setPreviewOptionIdx] = useState<number>(1);
  const [previewIntensity, setPreviewIntensity] = useState<number>(2);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleLanguage = () => setLocale(locale === "fr" ? "en" : "fr");
  const closeMobileNav = () => setMobileNavOpen(false);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: isFR ? item.qFr : item.qEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: isFR ? item.aFr : item.aEn,
      },
    })),
  };

  const activeDim = QUIZ_DIMENSIONS[selectedDimensionIdx] ?? QUIZ_DIMENSIONS[0];
  const sampleQuestion =
    V4_QUESTIONS.find((q) => q.position === activeDim.sampleQuestionPos) ??
    V4_QUESTIONS[0];
  const activeOption =
    sampleQuestion.options[previewOptionIdx] ?? sampleQuestion.options[0];

  const getArchetypeName = (key: string) => {
    const found = ARCHETYPES.find((a) => a.key === key);
    if (!found) return key;
    return isFR ? found.name_fr : found.name_en;
  };

  const survivalArchetypes = ARCHETYPES.filter((a) => a.family === "survival");

  const soloFeatures = isFR
    ? [
        [
          "Audit V4 (30 questions, 32 pôles) & rapport Deep Dive inclus",
          "Cockpit de pilotage & People Board 3D",
          "Registre souverain des décisions",
          `${SOLO_WEEKLY_TOOLBOX_ITEMS} protocoles Toolbox / semaine`,
          `${SOLO_ACTIVE_PULSE_CARDS} cartes Pulse actives`,
          "Continuité mémorielle chiffrée",
        ],
        [
          "Tout l'environnement AEGIS Solo",
          "Exocortex vocal LOGOS intégré 24/7",
          `${SOLO_LOGOS_WEEKLY_TOOLBOX_ITEMS} protocoles Toolbox / semaine (×2)`,
          `${SOLO_LOGOS_ACTIVE_PULSE_CARDS} cartes Pulse actives (×2)`,
          "Débriefing oral & arbitrage vocal adossé à vos 32 pôles",
          "Continuité Vault & historique décisionnel",
        ],
        [
          "Accès à vie au socle AEGIS Solo (zéro abonnement)",
          "149 € de la Grande Lecture 100 % déductibles (reste 201 €)",
          "Cartographie V4 complète & export PDF/PNG inclus",
          "Garantie sérénité 30 jours sur simple e-mail",
          "Canal vocal LOGOS en option dédiée",
        ],
      ]
    : [
        [
          "V4 Audit (30 questions, 32 poles) & Deep Dive report included",
          "Executive cockpit & 3D People Board",
          "Sovereign decision registry",
          `${SOLO_WEEKLY_TOOLBOX_ITEMS} Toolbox protocols / week`,
          `${SOLO_ACTIVE_PULSE_CARDS} active Pulse cards`,
          "Encrypted memory continuity",
        ],
        [
          "Everything in AEGIS Solo",
          "Integrated 24/7 LOGOS vocal exocortex",
          `${SOLO_LOGOS_WEEKLY_TOOLBOX_ITEMS} Toolbox protocols / week (2×)`,
          `${SOLO_LOGOS_ACTIVE_PULSE_CARDS} active Pulse cards (2×)`,
          "Live oral debrief & vocal arbitration backed by your 32 poles",
          "Vault continuity & decision history",
        ],
        [
          "Lifetime access to AEGIS Solo core (zero subscription)",
          "€149 Grand Reading 100% deductible (€201 remaining)",
          "Full V4 cartography & PDF/PNG export included",
          "30-day serenity guarantee via simple email",
          "LOGOS vocal channel available as dedicated add-on",
        ],
      ];

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] selection:bg-primary/25 selection:text-foreground sm:pb-0">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <a
        href="#welcome-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline focus:outline-2 focus:outline-ring"
      >
        {isFR ? "Aller au contenu" : "Skip to content"}
      </a>

      <WelcomeLandingNebula />
      <div className="welcome-hud-bg" aria-hidden />

      <header className="sticky top-0 z-30 w-full border-b border-border/25 bg-background/45 backdrop-blur-[16px]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-8">
          <div className="flex items-center gap-3">
            <AegisLogo
              alt="AEGIS"
              className="h-9 w-9 rounded-lg object-contain"
              width={36}
              height={36}
            />
            <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground">
              AEGIS — LOGOS
            </span>
          </div>

          <nav
            aria-label={isFR ? "Sections de la page" : "Page sections"}
            className="hidden items-center gap-5 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground no-underline transition-colors hover:text-foreground"
              >
                {isFR ? link.fr : link.en}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartAudit}
              className="group hidden min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-display text-[10px] uppercase tracking-[0.22em] text-primary backdrop-blur-sm transition-colors duration-200 hover:border-primary/45 hover:bg-primary/15 sm:inline-flex"
            >
              <span>{isFR ? "Audit 30 questions" : "30-Q Audit"}</span>
              <ArrowRight
                size={12}
                strokeWidth={1.75}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={
                locale === "fr" ? "Switch to English" : "Passer en Français"
              }
              className="inline-flex h-11 min-w-[48px] items-center justify-center gap-1.5 rounded-xl border border-border/25 bg-background/40 px-2.5 text-muted-foreground/80 backdrop-blur-[14px] transition-colors hover:bg-background/55 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
            >
              <Languages size={14} strokeWidth={1.5} aria-hidden />
              <span className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-foreground">
                {locale}
              </span>
            </button>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/25 bg-background/40 text-foreground backdrop-blur-[14px] transition-colors hover:bg-background/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="welcome-mobile-nav"
              aria-label={
                mobileNavOpen
                  ? isFR
                    ? "Fermer le menu"
                    : "Close menu"
                  : isFR
                    ? "Ouvrir le menu"
                    : "Open menu"
              }
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X size={18} strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu size={18} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div
            id="welcome-mobile-nav"
            className="border-t border-border/25 bg-background/90 px-5 py-4 backdrop-blur-xl lg:hidden"
          >
            <nav
              aria-label={isFR ? "Navigation mobile" : "Mobile navigation"}
              className="mx-auto flex max-w-7xl flex-col gap-1"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileNav}
                  className="flex min-h-11 items-center rounded-xl px-3 font-display text-[11px] uppercase tracking-[0.22em] text-foreground no-underline transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {isFR ? link.fr : link.en}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  closeMobileNav();
                  onStartAudit();
                }}
                className="mt-2 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-4 font-display text-[11px] uppercase tracking-[0.22em] text-primary"
              >
                {isFR ? "Lancer l’audit 30 questions" : "Start 30-question audit"}
                <ArrowRight size={13} aria-hidden />
              </button>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="welcome-main" className="relative z-10 flex-1">
        <section
          id="welcome-hero"
          data-nebula-chapter="aegis"
          aria-labelledby="welcome-hero-heading"
          className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-7xl flex-col justify-center px-5 pb-16 pt-10 sm:px-8 lg:py-16"
        >
          <motion.div
            {...fadeUp(0.1)}
            className="relative flex max-w-3xl flex-col items-start text-left"
          >
            <div
              className="welcome-hud-hero-glow !left-1/3 !top-1/3"
              aria-hidden
            />

            <p className="relative font-display text-[10px] uppercase tracking-[0.26em] text-primary">
              {isFR
                ? "AEGIS · EXOCORTEX VOCAL POUR DIRIGEANTS"
                : "AEGIS · VOCAL EXOCORTEX FOR EXECUTIVES"}
            </p>

            <h1
              id="welcome-hero-heading"
              className="relative mt-5 max-w-2xl font-cormorant-display text-[2.65rem] leading-[1.04] tracking-[-0.01em] text-foreground sm:text-5xl lg:text-[3.65rem]"
            >
              {isFR
                ? "La fin de la solitude décisionnelle pour dirigeants sous haute tension."
                : "The end of decision-making solitude for executives under high pressure."}
            </h1>

            <p className="relative mt-6 max-w-xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
              {isFR
                ? "Aucun document à uploader. Branchez votre voix : LOGOS déconstruit vos angles morts et tranche vos dilemmes critiques en temps réel."
                : "No documents to upload. Connect your voice: LOGOS deconstructs your blind spots and arbitrates your critical dilemmas in real time."}
            </p>

            <div className="relative mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-start">
              <button
                type="button"
                onClick={onStartAudit}
                className="group inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-full border border-primary/35 bg-primary/15 px-7 py-3.5 font-display text-[11px] uppercase tracking-[0.22em] text-primary shadow-[0_0_32px_hsl(var(--primary)/0.18)] backdrop-blur-md transition-all duration-200 hover:border-primary/55 hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Mic
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0 opacity-90"
                  aria-hidden
                />
                <span>
                  {isFR
                    ? "Évaluer ma lucidité — 30 questions"
                    : "Assess my lucidity — 30 questions"}
                </span>
                <ArrowRight
                  size={14}
                  strokeWidth={1.75}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </button>

              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground/85">
                {isFR
                  ? "Gratuit · Confidentiel · ~4 minutes"
                  : "Free · Confidential · ~4 minutes"}
              </p>

              <a
                href="#demo-vocale"
                className="inline-flex min-h-11 items-center gap-2 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground no-underline transition-colors hover:text-primary"
              >
                <Terminal size={12} aria-hidden />
                <span>
                  {isFR ? "Écouter une démo vocale" : "Listen to a voice demo"}
                </span>
                <ArrowRight size={12} aria-hidden />
              </a>
            </div>
          </motion.div>
        </section>

        <section
          id="demo-vocale"
          data-nebula-chapter="logos-demo"
          aria-labelledby="welcome-demo-heading"
          className="relative border-t border-border/25 bg-background/30 py-16 backdrop-blur-sm sm:py-24"
        >
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                {isFR ? "00 // DÉMO VOCALE" : "00 // VOICE DEMO"}
              </p>
              <h2
                id="welcome-demo-heading"
                className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-3xl"
              >
                {isFR
                  ? "Entendez LOGOS vous orienter vers l’audit."
                  : "Hear LOGOS point you to the audit."}
              </h2>
              <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                {isFR
                  ? "Un dirigeant sceptique des bilans. LOGOS répond : cartographie, angle mort, pas un score — trente questions."
                  : "A leader tired of assessments. LOGOS answers: a map, the blind spot, not a score — thirty questions."}
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.22em] text-primary/90">
                  <Terminal size={12} aria-hidden />
                  {isFR ? "Console d’arbitrage" : "Arbitration console"}
                </span>
                <span className="font-display text-[10px] uppercase tracking-[0.2em] tabular-nums text-muted-foreground/70">
                  ARGOS / IRIS
                </span>
              </div>

              <SilentDemoPlayer locale={locale === "en" ? "en" : "fr"} />

              <p className="mt-3 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {isFR
                  ? "Cas : solitude décisionnelle → audit 30Q"
                  : "Case: decision solitude → 30Q audit"}
              </p>
            </div>
          </div>
        </section>

        <section
          id="rupture-vocale"
          data-nebula-chapter="rupture"
          aria-labelledby="welcome-voice-heading"
          className="relative border-t border-border/25 bg-background/30 py-20 backdrop-blur-sm sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                {isFR
                  ? "01 // RUPTURE COGNITIVE : VOIX PURE VS ÉCRIT"
                  : "01 // COGNITIVE BREAKTHROUGH: PURE VOICE VS TEXT"}
              </p>
              <h2
                id="welcome-voice-heading"
                className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
              >
                {isFR
                  ? "Parler libère la pensée. Saisir du texte la bride."
                  : "Speaking liberates thought. Typing constrains it."}
              </h2>
              <p className="mt-5 font-body text-base leading-relaxed text-muted-foreground">
                {isFR
                  ? "La rédaction impose une mise en forme qui sature le cortex préfrontal au détriment de l'analyse stratégique brute. Face à un conflit d'associés, une négociation d'acquisition ou une crise de trésorerie, la parole permet d'exprimer les faits sans fard. LOGOS écoute la cadence, isole les contradictions de votre raisonnement et vous renvoie une structure d'arbitrage immédiate :"
                  : "Writing imposes formatting overhead that saturates the prefrontal cortex at the expense of raw strategic analysis. Facing a partner conflict, an acquisition negotiation, or a liquidity crisis, speech lets you state the facts unvarnished. LOGOS listens to the cadence, isolates contradictions in your reasoning, and returns an immediate arbitration structure:"}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {VOICE_PILLARS.map((pillar) => (
                <div
                  key={pillar.index}
                  className="welcome-glass-tile flex min-h-[240px] flex-col justify-between p-6 text-left transition-colors hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border/25 pb-3">
                      <span className="font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                        {isFR ? pillar.kickerFr : pillar.kickerEn}
                      </span>
                      <span className="font-display text-xs tabular-nums text-muted-foreground">
                        {pillar.index}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-xl leading-snug tracking-[-0.01em] text-foreground">
                      {isFR ? pillar.titleFr : pillar.titleEn}
                    </h3>
                    <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                      {isFR ? pillar.bodyFr : pillar.bodyEn}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-3">
                    <span className="font-display text-[10px] uppercase tracking-[0.2em] tabular-nums text-primary/90">
                      {isFR ? pillar.metricFr : pillar.metricEn}
                    </span>
                    <Zap size={13} className="text-primary/70" aria-hidden />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. ANATOMIE DU QUESTIONNAIRE V4 EN 30 QUESTIONS (180 VECTEURS / 32 PÔLES)
           ===================================================================== */}
        <section
          id="anatomie-quiz"
          aria-labelledby="welcome-quiz-anatomy-heading"
          className="relative border-t border-border/25 py-20 sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                  {isFR
                    ? "02 // ANATOMIE DE L'AUDIT DÉCISIONNEL (MOTEUR MYSS-V4)"
                    : "02 // ANATOMY OF THE DECISION AUDIT (MYSS-V4 ENGINE)"}
                </p>
                <h2
                  id="welcome-quiz-anatomy-heading"
                  className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
                >
                  {isFR
                    ? "30 dilemmes cliniques. 180 vecteurs. Vos 32 pôles de gouvernance mis à nu."
                    : "30 clinical dilemmas. 180 vectors. Your 32 governance poles laid bare."}
                </h2>
                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                  {isFR
                    ? "Comment LOGOS peut-il trancher vos crises sans jamais lire vos documents internes ? Parce que l'audit initial cartographie avec une précision chirurgicale qui décide en vous lorsque la pression monte."
                    : "How can LOGOS arbitrate your crises without ever reading your internal documents? Because the initial audit surgically maps who inside you is making the call when pressure spikes."}
                </p>
              </div>

              <button
                type="button"
                onClick={onStartAudit}
                className="group inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-primary/35 bg-primary/15 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-primary transition-colors hover:border-primary/55 hover:bg-primary/20 lg:self-auto"
              >
                <span>
                  {isFR
                    ? "Lancer les 30 questions maintenant"
                    : "Start the 30 questions now"}
                </span>
                <ArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="flex flex-col gap-3 lg:col-span-5">
                <p className="mb-1 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {isFR
                    ? "LES 5 DIMENSIONS CLINIQUES DU QUESTIONNAIRE (CLIQUEZ POUR INSPECTER) :"
                    : "THE 5 CLINICAL DIMENSIONS OF THE ASSESSMENT (CLICK TO INSPECT):"}
                </p>
                {QUIZ_DIMENSIONS.map((dim, idx) => {
                  const isSelected = selectedDimensionIdx === idx;
                  return (
                    <button
                      key={dim.id}
                      type="button"
                      onClick={() => {
                        setSelectedDimensionIdx(idx);
                        setPreviewOptionIdx(0);
                      }}
                      className={`welcome-glass-tile cursor-pointer p-4 text-left transition-all ${
                        isSelected
                          ? "!border-primary/50 bg-primary/[0.08]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-[10px] uppercase tracking-[0.22em] tabular-nums text-primary">
                          {dim.range}
                        </span>
                        <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          {isFR ? "6 QUESTIONS • 36 VECTEURS" : "6 QUESTIONS • 36 VECTORS"}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base text-foreground">
                        {isFR ? dim.titleFr : dim.titleEn}
                      </h3>
                      <p className="mt-1 font-body text-xs leading-relaxed text-muted-foreground">
                        {isFR ? dim.descFr : dim.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7">
                <div className="welcome-glass-tile flex h-full flex-col justify-between p-6 sm:p-8">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/25 pb-4">
                      <div className="flex items-center gap-2">
                        <Sliders
                          size={14}
                          className="text-primary"
                          aria-hidden
                        />
                        <span className="font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                          {isFR
                            ? `APERÇU RÉEL DU QUESTIONNAIRE // QUESTION #${String(sampleQuestion.position).padStart(2, "0")} SUR 30`
                            : `LIVE ASSESSMENT PREVIEW // QUESTION #${String(sampleQuestion.position).padStart(2, "0")} OF 30`}
                        </span>
                      </div>
                      <span className="rounded-full border border-border/35 bg-background/40 px-2.5 py-0.5 font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        {isFR
                          ? "CHOIX MULTIPLES + INTENSITÉ (×1 À ×3)"
                          : "MULTI-SELECT + INTENSITY (×1 TO ×3)"}
                      </span>
                    </div>

                    <h3 className="mt-5 font-cormorant-display text-2xl leading-snug text-foreground sm:text-3xl">
                      « {isFR ? sampleQuestion.prompt_fr : sampleQuestion.prompt_en} »
                    </h3>

                    <p className="mt-3 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {isFR
                        ? "SÉLECTIONNEZ UNE RÉACTION POUR OBSERVER LE DÉCODAGE VECTORIEL :"
                        : "SELECT A REACTION TO OBSERVE THE VECTOR DECODING:"}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {sampleQuestion.options.map((opt, oIdx) => {
                        const active = previewOptionIdx === oIdx;
                        return (
                          <button
                            key={opt.position}
                            type="button"
                            onClick={() => setPreviewOptionIdx(oIdx)}
                            className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                              active
                                ? "border-primary/50 bg-primary/15 text-foreground"
                                : "border-border/25 bg-background/25 text-muted-foreground hover:border-border/45 hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 font-display text-[10px] tabular-nums text-primary">
                                0{opt.position}
                              </span>
                              <span className="font-body text-xs leading-snug">
                                {isFR ? opt.label_fr : opt.label_en}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-primary/30 bg-background/45 p-4 backdrop-blur-md">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-3">
                      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {isFR
                          ? "CALIBRAGE D'INTENSITÉ DU RÉFLEXE :"
                          : "REFLEX INTENSITY CALIBRATION:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {INTENSITY_PREVIEW.map((lvl) => (
                          <button
                            key={lvl.level}
                            type="button"
                            onClick={() => setPreviewIntensity(lvl.level)}
                            className={`cursor-pointer rounded-full border px-3 py-1 font-display text-[9px] uppercase tracking-[0.18em] transition-colors ${
                              previewIntensity === lvl.level
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/35 bg-background/40 text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {isFR ? lvl.fr : lvl.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-border/20 bg-background/30 p-2.5">
                        <span className="font-display text-[9px] uppercase tracking-[0.18em] text-primary">
                          {isFR ? "LUMIÈRE PRIMAIRE" : "PRIMARY LIGHT"}
                        </span>
                        <p className="mt-1 font-display text-xs text-foreground">
                          {getArchetypeName(
                            activeOption.vector.primaryLight.archetype,
                          )}
                        </p>
                        <p className="font-display text-[10px] tabular-nums text-primary">
                          +{activeOption.vector.primaryLight.points * previewIntensity}{" "}
                          pts ({activeOption.vector.primaryLight.polarity})
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/20 bg-background/30 p-2.5">
                        <span className="font-display text-[9px] uppercase tracking-[0.18em] text-primary/80">
                          {isFR ? "LUMIÈRE SECONDAIRE" : "SECONDARY LIGHT"}
                        </span>
                        <p className="mt-1 font-display text-xs text-foreground">
                          {getArchetypeName(
                            activeOption.vector.secondaryLight.archetype,
                          )}
                        </p>
                        <p className="font-display text-[10px] tabular-nums text-primary/80">
                          +{activeOption.vector.secondaryLight.points * previewIntensity}{" "}
                          pts ({activeOption.vector.secondaryLight.polarity})
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/20 bg-background/30 p-2.5">
                        <span className="font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                          {isFR ? "OMBRE PRIMAIRE" : "PRIMARY SHADOW"}
                        </span>
                        <p className="mt-1 font-display text-xs text-foreground">
                          {getArchetypeName(
                            activeOption.vector.primaryShadow.archetype,
                          )}
                        </p>
                        <p className="font-display text-[10px] tabular-nums text-muted-foreground">
                          +{activeOption.vector.primaryShadow.points * previewIntensity}{" "}
                          pts ({activeOption.vector.primaryShadow.polarity})
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/20 bg-background/30 p-2.5">
                        <span className="font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
                          {isFR ? "OMBRE SECONDAIRE" : "SECONDARY SHADOW"}
                        </span>
                        <p className="mt-1 font-display text-xs text-foreground">
                          {getArchetypeName(
                            activeOption.vector.secondaryShadow.archetype,
                          )}
                        </p>
                        <p className="font-display text-[10px] tabular-nums text-muted-foreground/80">
                          +{activeOption.vector.secondaryShadow.points * previewIntensity}{" "}
                          pts ({activeOption.vector.secondaryShadow.polarity})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="welcome-glass-tile p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                    {isFR ? "LIVRABLE QUIZ // 01" : "AUDIT OUTPUT // 01"}
                  </span>
                  <Compass size={15} className="text-primary" aria-hidden />
                </div>
                <h3 className="mt-3 font-display text-lg text-foreground">
                  {isFR
                    ? "L'Alliance Lumière (Top 3 Forces)"
                    : "The Light Alliance (Top 3 Strengths)"}
                </h3>
                <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {isFR
                    ? "Vos 3 pôles de haute maîtrise parmi les 12 archétypes majeurs (Le Souverain, Le Sage, Le Guerrier, Le Magicien, Le Rebelle, Le Créateur…)."
                    : "Your top 3 high-mastery poles among the 12 major archetypes (Sovereign, Sage, Warrior, Magician, Rebel, Creator…)."}
                </p>
              </div>

              <div className="welcome-glass-tile p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                    {isFR ? "LIVRABLE QUIZ // 02" : "AUDIT OUTPUT // 02"}
                  </span>
                  <Eye size={15} className="text-primary" aria-hidden />
                </div>
                <h3 className="mt-3 font-display text-lg text-foreground">
                  {isFR
                    ? "Le Conseil de l'Ombre (Angles Morts)"
                    : "The Shadow Council (Blind Spots)"}
                </h3>
                <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {isFR
                    ? "Les 3 pôles d'Ombre qui prennent le contrôle à votre insu sous stress : sur-mentalisation, dureté autoritaire, évitement ou contrôle."
                    : "The 3 Shadow poles that hijack your command under stress: over-intellectualization, authoritarian harshness, avoidance, or control."}
                </p>
              </div>

              <div className="welcome-glass-tile p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                    {isFR ? "LIVRABLE QUIZ // 03" : "AUDIT OUTPUT // 03"}
                  </span>
                  <ShieldAlert size={15} className="text-primary" aria-hidden />
                </div>
                <h3 className="mt-3 font-display text-lg text-foreground">
                  {isFR
                    ? "Les 4 Gardiens de Survie"
                    : "The 4 Survival Guards"}
                </h3>
                <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {isFR
                    ? "Mesure de la balance Lumière/Ombre sur vos 4 réflexes archaïques : "
                    : "Light/Shadow balance across your 4 archaic survival reflexes: "}
                  <span className="text-foreground">
                    {survivalArchetypes
                      .map((a) => (isFR ? a.name_fr : a.name_en))
                      .join(" • ")}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. PROTOCOLE D'ARBITRAGE EN 4 MINUTES (240 SECONDES)
           ===================================================================== */}
        <section
          id="protocole"
          aria-labelledby="welcome-protocol-heading"
          className="relative border-t border-border/25 bg-background/30 py-20 backdrop-blur-sm sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                  {isFR
                    ? "03 // SÉQUENCE OPÉRATIONNELLE"
                    : "03 // OPERATIONAL SEQUENCE"}
                </p>
                <h2
                  id="welcome-protocol-heading"
                  className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
                >
                  {isFR
                    ? "De l'impasse mentale au verdict exécutable en 240 secondes."
                    : "From mental deadlock to executable verdict in 240 seconds."}
                </h2>
              </div>
              <button
                type="button"
                onClick={onStartAudit}
                className="group inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-primary transition-colors hover:border-primary/45 hover:bg-primary/15 lg:self-auto"
              >
                <span>
                  {isFR
                    ? "Établir ma cartographie (30 questions)"
                    : "Build my cartography (30 questions)"}
                </span>
                <ArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PROTOCOL_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="welcome-glass-tile flex flex-col justify-between p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/35 bg-primary/10 font-display text-xs tabular-nums text-primary">
                        {item.step}
                      </span>
                      <span className="font-display text-[10px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground">
                        {isFR ? item.durationFr : item.durationEn}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg leading-snug text-foreground">
                      {isFR ? item.titleFr : item.titleEn}
                    </h3>
                    <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                      {isFR ? item.bodyFr : item.bodyEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. GRILLE DE CONFRONTATION ASYMÉTRIQUE : LA MATRICE DE DOULEUR (+ COÛT ANNUEL)
           ===================================================================== */}
        <section
          id="matrice"
          aria-labelledby="welcome-matrix-heading"
          className="relative border-t border-border/25 py-20 sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                {isFR
                  ? "04 // CONFRONTATION ASYMÉTRIQUE & ANCRAGE FINANCIER"
                  : "04 // ASYMMETRIC CONFRONTATION & FINANCIAL ANCHORING"}
              </p>
              <h2
                id="welcome-matrix-heading"
                className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
              >
                {isFR
                  ? "La Matrice de Douleur Décisionnelle"
                  : "The Decision Pain Matrix"}
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                {isFR
                  ? "Comparez non seulement la neutralité chirurgicale, mais les euros réellement sortis de votre trésorerie chaque année."
                  : "Compare not only surgical neutrality, but the actual euros leaving your treasury every year."}
              </p>
            </div>

            <div className="welcome-glass-tile mt-12 overflow-x-auto p-0">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/30 bg-background/35">
                    <th className="w-[18%] p-5 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {isFR ? "Critère d'Arbitrage" : "Arbitration Criterion"}
                    </th>
                    <th className="w-[26%] p-5 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {isFR
                        ? "Le Conseil d'Administration et Associés"
                        : "Board of Directors & Partners"}
                    </th>
                    <th className="w-[26%] p-5 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {isFR
                        ? "Les Coachs Exécutifs et Consultants"
                        : "Executive Coaches & Consultants"}
                    </th>
                    <th className="w-[30%] border-l border-primary/35 bg-primary/10 p-5 font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                      {isFR
                        ? "LOGOS (Exocortex Décisionnel Souverain)"
                        : "LOGOS (Sovereign Decision Exocortex)"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-body text-sm">
                  {MATRIX_ROWS.map((row) => (
                    <tr
                      key={row.criterionFr}
                      className={`align-top transition-colors ${
                        row.highlight
                          ? "bg-primary/[0.06]"
                          : "hover:bg-background/20"
                      }`}
                    >
                      <td className="p-5 font-display text-xs uppercase tracking-[0.14em] text-foreground">
                        {isFR ? row.criterionFr : row.criterionEn}
                        {row.highlight ? (
                          <span className="mt-1.5 block font-display text-[9px] uppercase tracking-[0.2em] text-primary">
                            {isFR ? "RATIO ROI ×50" : "50× ROI RATIO"}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`p-5 leading-relaxed ${
                          row.highlight
                            ? "font-display text-xs tabular-nums text-foreground/90"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isFR ? row.boardFr : row.boardEn}
                      </td>
                      <td
                        className={`p-5 leading-relaxed ${
                          row.highlight
                            ? "font-display text-xs tabular-nums text-foreground/90"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isFR ? row.coachFr : row.coachEn}
                      </td>
                      <td
                        className={`border-l border-primary/35 p-5 font-medium leading-relaxed text-foreground ${
                          row.highlight
                            ? "bg-primary/15 font-display text-xs tabular-nums text-primary"
                            : "bg-primary/[0.07]"
                        }`}
                      >
                        {isFR ? row.logosFr : row.logosEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. ARCHITECTURE D'ENGAGEMENT PROGRESSIF : LA GRANDE LECTURE 149 € + PALIERS
               (Correction Playbook Alex Slater : éliminer la friction du 1er paiement)
           ===================================================================== */}
        <section
          id="tarifs"
          aria-labelledby="welcome-pricing-heading"
          className="relative border-t border-border/25 bg-background/30 py-20 backdrop-blur-sm sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                {isFR
                  ? "05 // ESCALIER DE CONVERSION SANS FRICTION"
                  : "05 // FRICTIONLESS CONVERSION LADDER"}
              </p>
              <h2
                id="welcome-pricing-heading"
                className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
              >
                {isFR
                  ? "Ne signez aucun mandat mensuel à l'aveugle."
                  : "Never sign a monthly mandate blind."}
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                {isFR
                  ? "Passez d'abord l'audit gratuit en 30 questions. À la 30ᵉ question, débloquez votre Grande Lecture One-Shot à 149 € — intégralement déductible si vous rejoignez les 20 Membres Fondateurs."
                  : "First take the free 30-question audit. At the 30th question, unlock your One-Shot €149 Grand Reading — 100% deductible if you join the 20 Founding Members."}
              </p>
            </div>

            {/* BLOC VEDETTE : LA PASSERELLE POST-QUIZ — LA GRANDE LECTURE À 149 € */}
            <div className="welcome-glass-tile relative mt-12 overflow-hidden !border-primary/50 p-7 shadow-[0_0_48px_hsl(var(--primary)/0.16)] sm:p-10">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 font-display text-[10px] uppercase tracking-[0.22em] text-primary">
                      {isFR
                        ? "PASSERELLE RECOMMANDÉE À L'ISSUE DE LA 30ᵉ QUESTION"
                        : "RECOMMENDED BRIDGE AFTER THE 30TH QUESTION"}
                    </span>
                    <span className="rounded-full border border-border/35 bg-background/40 px-3 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-foreground">
                      {isFR
                        ? "100 % DÉDUCTIBLE DU PLAN FONDATEURS (350 €)"
                        : "100% DEDUCTIBLE FROM FOUNDERS TIER (€350)"}
                    </span>
                  </div>

                  <h3 className="mt-4 font-cormorant-display text-3xl leading-tight text-foreground sm:text-4xl">
                    {isFR
                      ? "La Grande Lecture Décisionnelle — Session One-Shot de 45 minutes"
                      : "The Grand Decision Reading — 45-Minute One-Shot Session"}
                  </h3>

                  <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {isFR
                      ? "Dès la fin de vos 30 questions, mettez LOGOS à l'épreuve sur votre crise actuelle (blocage d'associés, arbitrage de trésorerie, restructuration) sans aucun abonnement récurrent. Si vous décidez ensuite de verrouiller l'un des 20 sièges Membres Fondateurs à 350 € à vie, vos 149 € sont intégralement déduits."
                      : "Right after your 30 questions, put LOGOS to the test on your current crisis (partner deadlock, treasury trade-off, restructuring) with zero recurring subscription. If you then lock in one of the 20 Founding Member lifetime seats at €350, your €149 is deducted in full."}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 font-body text-xs text-foreground">
                      <Check size={14} className="shrink-0 text-primary" />
                      <span>
                        {isFR
                          ? "Décodage complet de vos 32 pôles V4"
                          : "Full decoding of your 32 V4 poles"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-xs text-foreground">
                      <Check size={14} className="shrink-0 text-primary" />
                      <span>
                        {isFR
                          ? "45 min d'arbitrage sur votre dilemme réel"
                          : "45-min arbitration on your real dilemma"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-xs text-foreground">
                      <Check size={14} className="shrink-0 text-primary" />
                      <span>
                        {isFR
                          ? "Garantie remboursement 30j sur simple e-mail"
                          : "30-day refund guarantee via simple email"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-between rounded-2xl border border-primary/30 bg-background/45 p-6 lg:col-span-4 lg:items-center lg:text-center">
                  <span className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {isFR
                      ? "PAIEMENT UNIQUE • ZÉRO ABONNEMENT"
                      : "ONE-TIME PAYMENT • ZERO SUBSCRIPTION"}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl tabular-nums text-primary sm:text-5xl">
                      149 €
                    </span>
                    <span className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {isFR ? "HT" : "excl. tax"}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-[10px] uppercase tracking-[0.18em] text-foreground/85">
                    {isFR
                      ? "Crédité à 100 % sur l'accès Fondateurs"
                      : "100% credited toward Founders access"}
                  </p>

                  <button
                    type="button"
                    onClick={onStartAudit}
                    className="group mt-6 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/45 bg-primary/20 px-5 py-3 font-display text-[10px] uppercase tracking-[0.22em] text-primary transition-all hover:border-primary/70 hover:bg-primary/30"
                  >
                    <span>
                      {isFR
                        ? "Débloquer via l'audit en 30 questions"
                        : "Unlock via the 30-question audit"}
                    </span>
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* LES 3 PALIERS PERMANENTS (SOLO_PRICING) */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {SOLO_PRICING.map((plan, index) => {
                const isLogosFeatured =
                  plan.id === "aegis_solo_logos_monthly";
                const isFounders = plan.id === "aegis_founders_lifetime";
                return (
                  <div
                    key={plan.id}
                    className={`welcome-glass-tile flex flex-col justify-between p-7 ${
                      isLogosFeatured
                        ? "!border-primary/45 shadow-[0_0_40px_hsl(var(--primary)/0.14)]"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs uppercase tracking-[0.2em] text-foreground">
                          {plan.interval === "once" && !isFR
                            ? "Founding Members"
                            : plan.name}
                        </span>
                        {isLogosFeatured ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-0.5 font-display text-[9px] uppercase tracking-[0.2em] text-primary">
                            <Flame size={10} aria-hidden />
                            {isFR ? "VOIX PURE 24/7" : "24/7 PURE VOICE"}
                          </span>
                        ) : isFounders ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-0.5 font-display text-[9px] uppercase tracking-[0.2em] text-primary">
                            {isFR ? "20 SIÈGES MAX" : "20 SEATS MAX"}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 flex items-baseline gap-2">
                        <span className="font-display text-4xl tabular-nums text-foreground">
                          {plan.amount} €
                        </span>
                        <span className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {isFR ? "HT" : "excl. tax"}
                        </span>
                      </div>

                      <p className="mt-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {plan.interval === "month"
                          ? isFR
                            ? "Facturation mensuelle • Sans engagement"
                            : "Monthly billing • Cancel anytime"
                          : isFR
                            ? `Paiement unique à vie • Soit 201 € après Grande Lecture`
                            : `One-time lifetime payment • Just €201 after Grand Reading`}
                      </p>

                      <ul className="my-7 space-y-3 border-t border-border/25 pt-6 font-body text-sm text-muted-foreground">
                        {soloFeatures[index]?.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <Check
                              size={15}
                              className="mt-0.5 shrink-0 text-primary"
                              aria-hidden
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={onStartAudit}
                        className={`inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] transition-colors ${
                          isLogosFeatured || isFounders
                            ? "border-primary/40 bg-primary/15 text-primary hover:border-primary/60 hover:bg-primary/25"
                            : "border-border/35 bg-background/30 text-foreground hover:border-primary/35 hover:text-primary"
                        }`}
                      >
                        <span>
                          {isFR
                            ? "Passer l'audit gratuit (30 questions)"
                            : "Take the free audit (30 questions)"}
                        </span>
                        <ArrowRight size={12} aria-hidden />
                      </button>

                      <Link
                        to="/pricing"
                        className="inline-flex min-h-9 items-center justify-center font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground no-underline transition-colors hover:text-foreground"
                      >
                        {isFR
                          ? "Détails & souscription directe sur /pricing →"
                          : "Details & direct checkout on /pricing →"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            8. LES 5 CALCULATEURS EXÉCUTIFS EN 60 SECONDES (Engineering-as-Marketing)
               (Correction Melvin Zammit : visibilité maximale des micro-outils)
           ===================================================================== */}
        <section
          id="calculateurs"
          aria-labelledby="welcome-calculators-heading"
          className="relative border-t border-border/25 py-20 sm:py-28"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                  {isFR
                    ? "06 // DIAGNOSTICS FLASH EN 60 SECONDES (SANS COMPTE)"
                    : "06 // 60-SECOND FLASH DIAGNOSTICS (NO ACCOUNT REQUIRED)"}
                </p>
                <h2
                  id="welcome-calculators-heading"
                  className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
                >
                  {isFR
                    ? "Pas le temps pour l'audit complet ? Chiffrez vos pertes en 60 secondes."
                    : "No time for the full audit? Quantify your losses in 60 seconds."}
                </h2>
                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                  {isFR
                    ? "Cinq instruments de mesure chirurgicale pour quantifier immédiatement ce que vous coûtent une décision reportée, une friction d'associés ou la fragmentation de votre attention."
                    : "Five surgical measurement instruments to immediately quantify what a deferred decision, partner friction, or attention fragmentation is costing you."}
                </p>
              </div>

              <Link
                to="/tools"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-border/35 bg-background/35 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-foreground no-underline transition-colors hover:border-primary/45 hover:text-primary lg:self-auto"
              >
                <Calculator size={13} className="text-primary" aria-hidden />
                <span>
                  {isFR
                    ? "Explorer le Hub des 10 Outils CEO"
                    : "Explore All 10 CEO Tools"}
                </span>
                <ArrowRight size={12} aria-hidden />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {FEATURED_MICRO_TOOLS.map((tool) => (
                <Link
                  key={tool.code}
                  to={tool.href}
                  className="welcome-glass-tile group flex flex-col justify-between p-5 no-underline transition-all hover:!border-primary/45"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-2.5">
                      <span className="font-display text-[9px] uppercase tracking-[0.2em] text-primary">
                        {isFR ? tool.tagFr : tool.tagEn}
                      </span>
                      <span className="font-display text-[10px] tabular-nums text-muted-foreground/70">
                        {tool.code}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base leading-snug text-foreground transition-colors group-hover:text-primary">
                      {isFR ? tool.titleFr : tool.titleEn}
                    </h3>
                    <p className="mt-2.5 font-body text-xs leading-relaxed text-muted-foreground">
                      {isFR ? tool.blurbFr : tool.blurbEn}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-primary">
                    <span>
                      {isFR ? "Lancer en 60s" : "Run in 60s"}
                    </span>
                    <ArrowRight
                      size={11}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            9. SECTION FAQ (QUESTIONS FRÉQUENTES DE GOUVERNANCE)
           ===================================================================== */}
        <section
          id="faq"
          data-nebula-chapter="aegis-return"
          aria-labelledby="welcome-faq-heading"
          className="relative border-t border-border/25 bg-background/30 py-20 backdrop-blur-sm sm:py-28"
        >
          <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                {isFR
                  ? "07 // PROTOCOLE & RÉASSURANCE"
                  : "07 // PROTOCOL & REASSURANCE"}
              </p>
              <h2
                id="welcome-faq-heading"
                className="mt-4 font-display text-2xl tracking-[-0.01em] text-foreground sm:text-4xl"
              >
                {isFR
                  ? "Questions Fréquentes des Dirigeants"
                  : "Executive Frequently Asked Questions"}
              </h2>
            </div>

            <div className="mt-12 space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.qFr}
                    className="welcome-glass-tile overflow-hidden p-0 transition-colors"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left"
                    >
                      <span className="font-display text-sm tracking-[-0.01em] text-foreground sm:text-base">
                        {isFR ? item.qFr : item.qEn}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-primary transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border/20 px-6 pb-5 pt-4 font-body text-sm leading-relaxed text-muted-foreground">
                        {isFR ? item.aFr : item.aEn}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            10. SÉQUENCE DE SORTIE & TUNNEL VERS LE QUIZ EN 30 QUESTIONS
           ===================================================================== */}
        <section
          id="quiz"
          aria-labelledby="welcome-exit-heading"
          className="relative border-t border-border/25 py-20 sm:py-28"
        >
          <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
            <div className="welcome-glass-tile relative flex flex-col items-center overflow-hidden p-8 text-center sm:p-14">
              <div className="welcome-hud-hero-glow" aria-hidden />

              <span className="relative inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 font-display text-[10px] uppercase tracking-[0.26em] text-primary">
                <Shield size={12} aria-hidden />
                {isFR
                  ? "DIAGNOSTIC DE GOUVERNANCE // 30 QUESTIONS • 32 PÔLES"
                  : "GOVERNANCE DIAGNOSTIC // 30 QUESTIONS • 32 POLES"}
              </span>

              <h2
                id="welcome-exit-heading"
                className="relative mt-5 max-w-2xl font-display text-2xl leading-tight tracking-[-0.01em] text-foreground sm:text-4xl"
              >
                {isFR
                  ? "Vous ne pouvez pas corriger un angle mort que vous refusez de mesurer."
                  : "You cannot correct a blind spot you refuse to measure."}
              </h2>

              <p className="relative mt-5 max-w-2xl font-body text-base leading-relaxed text-muted-foreground">
                {isFR
                  ? "Trente questions fermées. Quatre minutes de confrontation clinique pour cartographier vos failles de gouvernance, vos dépendances critiques et votre niveau d'isolement décisionnel. À l'issue de cet audit, vous accédez à votre rapport Deep Dive V4 et à l'option Grande Lecture à 149 € (100 % déductible)."
                  : "Thirty closed questions. Four minutes of clinical confrontation to map your governance vulnerabilities, critical dependencies, and level of decision-making isolation. Upon completing this audit, you unlock your V4 Deep Dive report and the €149 Grand Reading option (100% deductible)."}
              </p>

              <div className="relative mt-8 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={onStartAudit}
                  className="group inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-full border border-primary/40 bg-primary/15 px-8 py-3.5 font-display text-[11px] uppercase tracking-[0.22em] text-primary shadow-[0_0_32px_hsl(var(--primary)/0.2)] backdrop-blur-md transition-all duration-200 hover:border-primary/60 hover:bg-primary/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span>
                    {isFR
                      ? "COMMENCER MON AUDIT DÉCISIONNEL SOUVERAIN"
                      : "BEGIN MY SOVEREIGN DECISION AUDIT"}
                  </span>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.75}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  />
                </button>

                <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                  {isFR
                    ? "Résultats strictement confidentiels et chiffrés pour votre profil."
                    : "Results strictly confidential and encrypted for your profile."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          11. PIED DE PAGE COMPLET + MENTION DISCRÈTE LOGOS BUSINESS
         ===================================================================== */}
      <footer className="relative z-10 w-full border-t border-border/25 bg-background/50 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-b border-border/20 pb-8 text-center">
            <p className="mx-auto max-w-3xl font-body text-xs leading-relaxed text-muted-foreground/80 sm:text-sm">
              {isFR ? (
                <>
                  Vous présidez un directoire, un groupe ou un fonds
                  d&apos;investissement et exigez la connexion de LOGOS à vos
                  flux documentaires propriétaires et systèmes
                  d&apos;information stratégiques ? Découvrir le déploiement
                  d&apos;infrastructure{" "}
                  <span className="font-display text-[10px] uppercase tracking-[0.18em] text-primary">
                    LOGOS Business
                  </span>{" "}
                  <Link
                    to="/entreprise"
                    className="inline font-display text-[10px] uppercase tracking-[0.18em] text-foreground/90 underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary"
                  >
                    [Demande d&apos;accès réservé aux comités de direction]
                  </Link>
                  .
                </>
              ) : (
                <>
                  Do you chair an executive board, corporate group, or
                  investment fund requiring LOGOS connectivity to proprietary
                  document streams and strategic information systems? Discover
                  the{" "}
                  <span className="font-display text-[10px] uppercase tracking-[0.18em] text-primary">
                    LOGOS Business
                  </span>{" "}
                  infrastructure deployment{" "}
                  <Link
                    to="/entreprise"
                    className="inline font-display text-[10px] uppercase tracking-[0.18em] text-foreground/90 underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary"
                  >
                    [Executive Committee Access Request]
                  </Link>
                  .
                </>
              )}
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <AegisLogo
                alt="AEGIS"
                className="h-6 w-6 rounded-md object-contain"
                width={24}
                height={24}
              />
              <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                AEGIS — LOGOS // © PROTOCOLE NOMOS
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Link
                to="/tools"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "Calculateurs CEO" : "CEO Calculators"}
              </Link>
              <Link
                to="/pricing"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "Tarifs" : "Pricing"}
              </Link>
              <Link
                to="/auth"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "Accès Membre" : "Member Sign In"}
              </Link>
              <Link
                to="/legal/mentions"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "Mentions légales" : "Legal notice"}
              </Link>
              <Link
                to="/legal/privacy"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "Confidentialité" : "Privacy"}
              </Link>
              <Link
                to="/legal/terms"
                className="no-underline transition-colors hover:text-foreground"
              >
                {isFR ? "CGV" : "Terms"}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/30 bg-background/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onStartAudit}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-5 font-display text-[11px] uppercase tracking-[0.22em] text-primary"
        >
          <Mic size={14} aria-hidden />
          <span>{isFR ? "Audit 30 questions" : "30-question audit"}</span>
          <ArrowRight size={13} aria-hidden />
        </button>
      </div>
    </div>
  );
};
```

## `src/features/welcome/components/WelcomeLandingNebula.tsx`

```tsx
import { QuantumNebulaHeroV3 } from "@/components/ui/quantum-nebula-hero-v3";
import { useWelcomeLandingNebulaWordDrive } from "@/features/welcome/hooks/useWelcomeLandingNebulaWordDrive";
import {
  WELCOME_NEBULA_VISUAL_TUNING,
  WELCOME_NEBULA_WORD,
} from "./WelcomeQuantumNebula";

/** Landing long-scroll (`WelcomeView`) — mot piloté par `welcomeNebulaScrollStory`. */
export function WelcomeLandingNebula() {
  const wordDriveRef = useWelcomeLandingNebulaWordDrive();

  return (
    <QuantumNebulaHeroV3
      fullscreen
      theme="auto"
      state="repos"
      flowMode="vortex"
      visualTuning={WELCOME_NEBULA_VISUAL_TUNING}
      word={WELCOME_NEBULA_WORD}
      wordDriveRef={wordDriveRef}
      passBehindWord
      className="fixed inset-0 z-0"
    />
  );
}
```

## `src/features/welcome/components/WelcomeQuantumNebula.tsx`

```tsx
import { useEffect, useRef } from "react";
import {
  DEFAULT_HERO_VISUAL_TUNING,
  QuantumNebulaHeroV3,
  type QuantumNebulaHeroVisualTuning,
  type QuantumNebulaHeroWordDrive,
} from "@/components/ui/quantum-nebula-hero-v3";
import type { QuantumNebulaWordConfig } from "@/components/ui/quantumNebulaWordMask";
import { useWelcomeNebulaViewportLayout } from "@/features/welcome/hooks/useWelcomeNebulaViewportLayout";

/** Welcome hero — viewport vortex (GenerativeArtSceneV3 HTML prototype). */
export const WELCOME_NEBULA_VISUAL_TUNING: Partial<QuantumNebulaHeroVisualTuning> = {
  particleCount: DEFAULT_HERO_VISUAL_TUNING.particleCount,
  particleSize: DEFAULT_HERO_VISUAL_TUNING.particleSize,
  sphereRadius: DEFAULT_HERO_VISUAL_TUNING.sphereRadius,
  pupilRadius: DEFAULT_HERO_VISUAL_TUNING.pupilRadius,
  cameraDistance: DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
};

export const WELCOME_NEBULA_WORD_STYLE: Omit<
  QuantumNebulaWordConfig,
  "offsetX" | "offsetY" | "text"
> = {
  font: "Cinzel",
  scale: 1.55,
  weight: 500,
  spacingEm: 0.5,
  italic: false,
  uppercase: true,
  outline: false,
};

/** Style + ancre droite (offsets recalculés au resize dans les composants). */
export function buildWelcomeNebulaWordConfig(
  text: string,
  anchor: { offsetX: number; offsetY: number },
): QuantumNebulaWordConfig {
  return { text, ...WELCOME_NEBULA_WORD_STYLE, ...anchor };
}

/** @deprecated Préférer `buildWelcomeNebulaWordConfig` — offsets figés. Conservé pour imports existants. */
export const WELCOME_NEBULA_WORD: QuantumNebulaWordConfig = {
  text: "AEGIS",
  ...WELCOME_NEBULA_WORD_STYLE,
  offsetX: 0,
  offsetY: 0,
};

const WELCOME_HUD_WORD: QuantumNebulaWordConfig = {
  text: "AEGIS",
  ...WELCOME_NEBULA_WORD_STYLE,
  offsetX: 0,
  offsetY: 0,
};

export function WelcomeQuantumNebula() {
  const { right } = useWelcomeNebulaViewportLayout();
  const wordDriveRef = useRef<QuantumNebulaHeroWordDrive>({
    text: "AEGIS",
    offsetX: right.offsetX,
    offsetY: right.offsetY,
    reveal: 1,
  });

  useEffect(() => {
    Object.assign(wordDriveRef.current, {
      text: "AEGIS",
      offsetX: right.offsetX,
      offsetY: right.offsetY,
      reveal: 1,
    });
  }, [right.offsetX, right.offsetY]);

  return (
    <QuantumNebulaHeroV3
      fullscreen
      theme="auto"
      state="repos"
      flowMode="vortex"
      visualTuning={WELCOME_NEBULA_VISUAL_TUNING}
      word={WELCOME_HUD_WORD}
      wordDriveRef={wordDriveRef}
      passBehindWord
      className="z-0"
    />
  );
}
```

## `src/features/welcome/components/SilentDemoPlayer.tsx`

```tsx
import React, { useState, useEffect, useRef } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { getGuardianAudioSrc } from "@/features/guardian/guardianAudio";
import { SovereignWaveform } from "./SovereignWaveform";

interface StepData {
  timeMs: number;
  stage: "INPUT_FOUNDER" | "PROCESSING_AEGIS" | "DECISION_LOGOS";
  textFr: string;
  textEn: string;
}

const SCENARIO_TIMELINE: StepData[] = [
  {
    timeMs: 0,
    stage: "INPUT_FOUNDER",
    textFr:
      "Encore un questionnaire… J’ai déjà testé des bilans. Là j’ai besoin de quelque chose qui me montre où je dérape, pas un score.",
    textEn:
      "Another questionnaire… I’ve done assessments before. I need something that shows where I drift, not a score.",
  },
  {
    timeMs: 3800,
    stage: "PROCESSING_AEGIS",
    textFr: "[LECTURE DU MOTIF RÉCURRENT… PRÉPARATION DE L’AUDIT 30 QUESTIONS…]",
    textEn: "[READING THE RECURRING PATTERN… PREPARING THE 30-QUESTION AUDIT…]",
  },
  {
    timeMs: 5000,
    stage: "DECISION_LOGOS",
    textFr:
      "Ce n’est pas un bilan de plus — c’est une cartographie. Le problème n’est pas ce que vous savez : c’est ce que vous ne voyez plus. Vous n’êtes pas bloqué par le manque d’infos — vous êtes bloqué par l’angle mort. Trente questions, quatre minutes. Ensuite on tranche pour de vrai.",
    textEn:
      "This isn’t another assessment — it’s a map. The issue isn’t what you know — it’s what you can no longer see. You’re not blocked by lack of information — you’re blocked by the blind spot. Thirty questions, four minutes. Then we decide for real.",
  },
];

export interface SilentDemoPlayerProps {
  locale?: "fr" | "en";
}

export const SilentDemoPlayer: React.FC<SilentDemoPlayerProps> = ({
  locale = "fr",
}) => {
  const isFR = locale !== "en";
  const [currentStage, setCurrentStage] =
    useState<StepData["stage"]>("INPUT_FOUNDER");
  const [displayedText, setDisplayedText] = useState<string>(
    isFR ? SCENARIO_TIMELINE[0].textFr : SCENARIO_TIMELINE[0].textEn,
  );
  const [cycleCount, setCycleCount] = useState<number>(0);

  // Vrai lecteur audio LOGOS (timbre chirurgical Argos / Iris — Protocole Décisionnel)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voicePersona, setVoicePersona] = useState<"male" | "female">("male");
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioCurrentSec, setAudioCurrentSec] = useState<number>(0);
  const [audioDurationSec, setAudioDurationSec] = useState<number>(18);

  const audioSrc = getGuardianAudioSrc(
    voicePersona,
    isFR ? "fr" : "en",
    4, // Step 4: Decision Log / Arbitrage vocal
  );

  useEffect(() => {
    // Si l'utilisateur écoute l'extrait audio réel, on verrouille l'affichage sur le verdict vocal LOGOS
    if (isAudioPlaying) {
      setCurrentStage("DECISION_LOGOS");
      setDisplayedText(
        isFR ? SCENARIO_TIMELINE[2].textFr : SCENARIO_TIMELINE[2].textEn,
      );
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Phase 1 : Entrée vocale du dirigeant
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("INPUT_FOUNDER");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[0].textFr : SCENARIO_TIMELINE[0].textEn,
        );
      }, 100),
    );

    // Phase 2 : Isolation logique par l'exocortex
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("PROCESSING_AEGIS");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[1].textFr : SCENARIO_TIMELINE[1].textEn,
        );
      }, 3800),
    );

    // Phase 3 : Verdict souverain LOGOS
    timeouts.push(
      setTimeout(() => {
        setCurrentStage("DECISION_LOGOS");
        setDisplayedText(
          isFR ? SCENARIO_TIMELINE[2].textFr : SCENARIO_TIMELINE[2].textEn,
        );
      }, 5000),
    );

    // Redémarrage de la boucle — beat LOGOS plus long (scénario 10)
    timeouts.push(
      setTimeout(() => {
        setCycleCount((prev) => prev + 1);
      }, 13000),
    );

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [cycleCount, isFR, isAudioPlaying]);

  // Arrêt propre quand la langue ou la voix change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsAudioPlaying(false);
    setAudioCurrentSec(0);
  }, [audioSrc]);

  const toggleRealAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      void audio
        .play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(() => {
          setIsAudioPlaying(false);
        });
    }
  };

  const switchPersona = (nextPersona: "male" | "female") => {
    if (nextPersona === voicePersona) return;
    setVoicePersona(nextPersona);
  };

  const formatSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="welcome-glass-tile mx-auto w-full max-w-xl p-5 text-left font-body">
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setAudioDurationSec(Math.round(d));
          }
        }}
        onTimeUpdate={(e) => {
          setAudioCurrentSec(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsAudioPlaying(false);
          setAudioCurrentSec(0);
        }}
        onPause={() => {
          setIsAudioPlaying(false);
        }}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/25 pb-3">
        <div className="flex items-center space-x-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse"
            aria-hidden
          />
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {isAudioPlaying
              ? isFR
                ? ` CANAL AUDIO RÉEL ACTIF // TIMBRE ${voicePersona === "male" ? "ARGOS" : "IRIS"}`
                : `LIVE AUDIO STREAM // ${voicePersona === "male" ? "ARGOS" : "IRIS"} VOICE`
              : currentStage === "INPUT_FOUNDER"
                ? isFR
                  ? "CANAL VOCAL DIRIGEANT EN COURS"
                  : "EXECUTIVE VOICE CHANNEL ACTIVE"
                : currentStage === "PROCESSING_AEGIS"
                  ? isFR
                    ? "NOYAU AEGIS // ANALYSE DE CRISE"
                    : "AEGIS CORE // CRISIS ANALYSIS"
                  : isFR
                    ? "VERDICT DÉCISIONNEL VERROUILLÉ"
                    : "DECISION VERDICT LOCKED"}
          </span>
        </div>
        <span className="font-display text-[10px] uppercase tracking-[0.22em] tabular-nums text-muted-foreground/70">
          {isAudioPlaying
            ? `${formatSec(audioCurrentSec)} / ${formatSec(audioDurationSec)}`
            : isFR
              ? "CANAL 01 // TEMPO RÉEL"
              : "CHANNEL 01 // REAL-TIME"}
        </span>
      </div>

      <div className="mb-4 flex min-h-[60px] items-center justify-center">
        <SovereignWaveform
          isActive={isAudioPlaying || currentStage !== "PROCESSING_AEGIS"}
        />
      </div>

      {/* Bouton d'écoute audio réelle en 1 clic (Correction Règle Chris Raroque & Jason Lee) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5">
        <button
          type="button"
          onClick={toggleRealAudio}
          className="group inline-flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left font-display text-[10px] uppercase tracking-[0.2em] text-primary"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary transition-transform group-hover:scale-105">
            {isAudioPlaying ? (
              <Pause size={12} aria-hidden />
            ) : (
              <Play size={12} className="translate-x-[0.5px]" aria-hidden />
            )}
          </span>
          <span>
            {isAudioPlaying
              ? isFR
                ? "PAUSE // ÉCOUTE DU TIMBRE RÉEL EN COURS"
                : "PAUSE // LISTENING TO REAL VOICE TIMBRE"
              : isFR
                ? "ÉCOUTER UN EXTRAIT VOCAL RÉEL (18 SEC)"
                : "LISTEN TO A REAL VOICE SAMPLE (18 SEC)"}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <Volume2 size={12} className="mr-1 text-primary/75" aria-hidden />
          <button
            type="button"
            onClick={() => switchPersona("male")}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.18em] transition-colors ${
              voicePersona === "male"
                ? "bg-primary text-primary-foreground"
                : "bg-background/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Argos
          </button>
          <button
            type="button"
            onClick={() => switchPersona("female")}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-display text-[9px] uppercase tracking-[0.18em] transition-colors ${
              voicePersona === "female"
                ? "bg-primary text-primary-foreground"
                : "bg-background/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Iris
          </button>
        </div>
      </div>

      <div className="flex min-h-[148px] flex-col justify-center">
        <p
          className={`text-sm leading-relaxed transition-colors duration-200 ${
            currentStage === "INPUT_FOUNDER"
              ? "italic text-muted-foreground"
              : currentStage === "PROCESSING_AEGIS"
                ? "font-display text-xs uppercase tracking-[0.14em] text-primary"
                : "font-medium text-foreground"
          }`}
        >
          {displayedText}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/25 pt-3 font-display text-[10px] uppercase tracking-[0.22em] tabular-nums text-muted-foreground/75">
        <span>
          {isFR ? "AUCUNE TRACE CONSERVÉE" : "ZERO TRACE RETAINED"}
        </span>
        <span>
          {isFR ? "LATENCE D'ARBITRAGE : 1.2S" : "ARBITRATION LATENCY: 1.2S"}
        </span>
      </div>
    </div>
  );
};
```

## `src/features/welcome/hooks/useWelcomeLandingNebulaWordDrive.ts`

```typescript
import { useEffect, useRef, type MutableRefObject } from "react";
import type { QuantumNebulaHeroWordDrive } from "@/components/ui/quantum-nebula-hero-v3";
import {
  computeWelcomeNebulaWordState,
  queryWelcomeNebulaSections,
} from "@/features/welcome/welcomeNebulaScrollStory";
import { getWelcomeNebulaWorldLayout, readWelcomeNebulaViewport } from "@/features/welcome/welcomeNebulaWordLayout";

export function useWelcomeLandingNebulaWordDrive(): MutableRefObject<QuantumNebulaHeroWordDrive> {
  const initialRight = getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()).right;
  const driveRef = useRef<QuantumNebulaHeroWordDrive>({
    text: "AEGIS",
    offsetX: initialRight.offsetX,
    offsetY: initialRight.offsetY,
    reveal: 1,
  });

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const sections = queryWelcomeNebulaSections();
      const next = computeWelcomeNebulaWordState(sections);
      Object.assign(driveRef.current, next);
    };

    const onScrollOrResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        tick();
      });
    };

    tick();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return driveRef;
}
```

## `src/features/welcome/hooks/useWelcomeNebulaViewportLayout.ts`

```typescript
import { useEffect, useState } from "react";
import {
  getWelcomeNebulaWorldLayout,
  readWelcomeNebulaViewport,
  type WelcomeNebulaWorldAnchor,
} from "@/features/welcome/welcomeNebulaWordLayout";

export function useWelcomeNebulaViewportLayout(): {
  right: WelcomeNebulaWorldAnchor;
  left: WelcomeNebulaWorldAnchor;
  center: WelcomeNebulaWorldAnchor;
} {
  const [layout, setLayout] = useState(() =>
    getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()),
  );

  useEffect(() => {
    const update = () => {
      setLayout(getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()));
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return layout;
}
```

## `src/features/welcome/welcomeNebulaScrollStory.ts`

```typescript
/**
 * Chronologie du mot sur la landing — calée sur les blocs texte de `WelcomeView`.
 *
 * Ch.1 `#welcome-hero`     → AEGIS à droite
 * Ch.2 `#demo-vocale`       → morph LOGOS à gauche
 * Ch.2→3 limite sections    → désintégration
 * Ch.3 `#rupture-vocale`    → suite masquée jusqu’à la réintégration
 * Réint. fin Ch.3 → `#faq`  → AEGIS au centre (avant-dernière section)
 */

import {
  getWelcomeNebulaWorldLayout,
  readWelcomeNebulaViewport,
} from "./welcomeNebulaWordLayout";

export interface WelcomeNebulaWordState {
  text: string;
  offsetX: number;
  offsetY: number;
  reveal: number;
}

export const WELCOME_NEBULA_SECTION_IDS = {
  hero: "welcome-hero",
  demo: "demo-vocale",
  rupture: "rupture-vocale",
  faq: "faq",
} as const;

/** Sticky header landing (~4.5rem) + ligne de lecture */
const STICKY_HEADER_PX = 72;

export interface WelcomeNebulaSectionSpan {
  top: number;
  bottom: number;
  height: number;
}

export function measureWelcomeSection(el: HTMLElement): WelcomeNebulaSectionSpan {
  const rect = el.getBoundingClientRect();
  const top =
    rect.top +
    (typeof window !== "undefined" ? window.scrollY : 0) -
    (typeof document !== "undefined"
      ? document.documentElement.clientTop
      : 0);
  const height = rect.height;
  return { top, bottom: top + height, height };
}

/** Point vertical dans la page qui « lit » le contenu (sous le header). */
export function welcomeNebulaFocusY(scrollY: number, vh: number): number {
  return scrollY + STICKY_HEADER_PX + vh * 0.34;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type SectionEl = HTMLElement | null;

export function computeWelcomeNebulaWordState(
  sections: {
    hero: SectionEl;
    demo: SectionEl;
    rupture: SectionEl;
    faq: SectionEl;
  },
  scrollY: number = typeof window !== "undefined" ? window.scrollY : 0,
  vh: number = typeof window !== "undefined" ? window.innerHeight : 800,
): WelcomeNebulaWordState {
  const { right, left, center } = getWelcomeNebulaWorldLayout(
    readWelcomeNebulaViewport(),
  );
  const fallback: WelcomeNebulaWordState = {
    text: "AEGIS",
    offsetX: right.offsetX,
    offsetY: right.offsetY,
    reveal: 1,
  };

  const { hero, demo, rupture, faq } = sections;
  if (!hero || !demo || !rupture || !faq) return fallback;

  const h = measureWelcomeSection(hero);
  const d = measureWelcomeSection(demo);
  const r = measureWelcomeSection(rupture);
  const f = measureWelcomeSection(faq);

  const focus = welcomeNebulaFocusY(scrollY, vh);

  const hiddenLogos: WelcomeNebulaWordState = {
    text: "LOGOS",
    offsetX: left.offsetX,
    offsetY: left.offsetY,
    reveal: 0,
  };

  // —— Ch.1 : tant que la ligne de lecture est dans le hero (titre + lead). ——
  if (focus < h.bottom) {
    return { text: "AEGIS", ...right, reveal: 1 };
  }

  // —— Ch.2 : bloc démo vocale (#demo-vocale) — morph puis LOGOS stabilisé. ——
  const morphZoneEnd = d.top + d.height * 0.42;
  if (focus < d.bottom) {
    if (focus <= morphZoneEnd) {
      const morphT = smoothstep((focus - d.top) / Math.max(1, morphZoneEnd - d.top));
      return {
        text: morphT >= 0.52 ? "LOGOS" : "AEGIS",
        offsetX: lerp(right.offsetX, left.offsetX, morphT),
        offsetY: lerp(right.offsetY, left.offsetY, morphT),
        reveal: 1,
      };
    }
    return { text: "LOGOS", ...left, reveal: 1 };
  }

  // —— Désintégration : passage contenu démo → rupture (jonction physique des sections). ——
  const disStart = d.bottom - Math.min(vh * 0.12, d.height * 0.15);
  const disEnd =
    r.top +
    Math.min(r.height * 0.22, vh * 0.28);

  if (focus < disEnd) {
    if (focus >= disStart) {
      const disT = smoothstep((focus - disStart) / Math.max(1, disEnd - disStart));
      return {
        text: "LOGOS",
        offsetX: left.offsetX,
        offsetY: left.offsetY,
        reveal: 1 - disT,
      };
    }
    return { text: "LOGOS", ...left, reveal: 1 };
  }

  // —— Réintégration : fin du ch.3 → entrée dans #faq (avant-dernière section). ——
  const reintStart = r.bottom - Math.min(vh * 0.45, r.height * 0.35);
  const reintEnd = f.top + Math.min(f.height * 0.38, vh * 0.42);

  if (focus >= reintStart && focus < reintEnd) {
    const reintT = smoothstep((focus - reintStart) / Math.max(1, reintEnd - reintStart));
    return {
      text: "AEGIS",
      offsetX: lerp(left.offsetX, center.offsetX, reintT),
      offsetY: lerp(left.offsetY, center.offsetY, reintT),
      reveal: reintT,
    };
  }

  if (focus >= reintEnd) {
    return { text: "AEGIS", ...center, reveal: 1 };
  }

  // Milieu de page : ch.3 (rupture) après dissolve + sections intermédiaires.
  return hiddenLogos;
}

export function queryWelcomeNebulaSections(): {
  hero: SectionEl;
  demo: SectionEl;
  rupture: SectionEl;
  faq: SectionEl;
} {
  if (typeof document === "undefined") {
    return { hero: null, demo: null, rupture: null, faq: null };
  }
  const ids = WELCOME_NEBULA_SECTION_IDS;
  return {
    hero: document.getElementById(ids.hero),
    demo: document.getElementById(ids.demo),
    rupture: document.getElementById(ids.rupture),
    faq: document.getElementById(ids.faq),
  };
}
```

## `src/features/welcome/welcomeNebulaWordLayout.ts`

```typescript
import { DEFAULT_HERO_VISUAL_TUNING } from "@/components/ui/quantum-nebula-hero-v3";

/** Doit correspondre à `QuantumNebulaHeroV3` (PerspectiveCamera). */
export const WELCOME_NEBULA_CAMERA_FOV = 65;

export interface WelcomeNebulaViewport {
  width: number;
  height: number;
}

export interface WelcomeNebulaScreenAnchor {
  /** 0 = gauche, 1 = droite */
  x: number;
  /** 0 = haut, 1 = bas */
  y: number;
}

/** Ancres visuelles du mot (fractions du viewport). */
export const WELCOME_NEBULA_SCREEN_ANCHORS = {
  right: { x: 0.78, y: 0.54 },
  left: { x: 0.22, y: 0.54 },
  center: { x: 0.5, y: 0.5 },
} as const satisfies Record<string, WelcomeNebulaScreenAnchor>;

export type WelcomeNebulaWorldAnchor = {
  offsetX: number;
  offsetY: number;
};

/** Convertit une position normalisée écran → offset monde sur le plan z=0 (caméra sur +Z). */
export function screenNormToWorldOffset(
  normX: number,
  normY: number,
  viewport: WelcomeNebulaViewport,
  cameraDistance: number = DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
  fovDeg: number = WELCOME_NEBULA_CAMERA_FOV,
): WelcomeNebulaWorldAnchor {
  const aspect =
    Math.max(viewport.width, 1) / Math.max(viewport.height, 1);
  const vFovRad = (fovDeg * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFovRad / 2) * cameraDistance;
  const visibleWidth = visibleHeight * aspect;
  return {
    offsetX: (normX - 0.5) * visibleWidth,
    offsetY: (0.5 - normY) * visibleHeight,
  };
}

export function getWelcomeNebulaWorldLayout(
  viewport?: WelcomeNebulaViewport,
  cameraDistance: number = DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
): {
  right: WelcomeNebulaWorldAnchor;
  left: WelcomeNebulaWorldAnchor;
  center: WelcomeNebulaWorldAnchor;
} {
  const vp: WelcomeNebulaViewport =
    viewport ??
    (typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 390, height: 844 });

  const anchors = WELCOME_NEBULA_SCREEN_ANCHORS;
  return {
    right: screenNormToWorldOffset(
      anchors.right.x,
      anchors.right.y,
      vp,
      cameraDistance,
    ),
    left: screenNormToWorldOffset(
      anchors.left.x,
      anchors.left.y,
      vp,
      cameraDistance,
    ),
    center: screenNormToWorldOffset(
      anchors.center.x,
      anchors.center.y,
      vp,
      cameraDistance,
    ),
  };
}

export function readWelcomeNebulaViewport(): WelcomeNebulaViewport {
  if (typeof window === "undefined") {
    return { width: 390, height: 844 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
```

## `src/components/ui/quantum-nebula-hero-v3.tsx`

```tsx
/**
 * GenerativeArtSceneV3 hero backdrop — viewport wave/vortex flow, anti-particles,
 * optional word pupil. Ported from the standalone HTML prototype.
 */
import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import { getStoredThemeIsDark } from "@/lib/theme";
import {
  buildMetatronTargets,
  buildNeuralMicrograph,
  type QuantumNebulaState,
} from "./quantumNebulaStates";
import {
  buildWordMaskData,
  type QuantumNebulaWordConfig,
} from "./quantumNebulaWordMask";
import {
  defaultViewportFlowTuning,
  initViewportFlowParticles,
  stepViewportFlow,
  VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE,
  VIEWPORT_PARTICLE_FRAGMENT_SHADER,
  VIEWPORT_PARTICLE_VERTEX_SHADER,
  type ViewportFlowMode,
  type ViewportFlowTuning,
} from "./quantumNebulaViewportFlow";

export type QuantumNebulaHeroTheme = "dark" | "light" | "auto";

export interface QuantumNebulaHeroVisualTuning {
  particleCount: number;
  particleSize: number;
  sphereRadius: number;
  pupilRadius: number;
  cameraDistance: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  reflexionBloomStrength: number;
  reflexionBloomRadius: number;
  reflexionBloomThreshold: number;
}

/** Per-frame word override (scroll story) — read each rAF, do not set React state. */
export interface QuantumNebulaHeroWordDrive {
  text: string;
  offsetX: number;
  offsetY: number;
  reveal: number;
}

export const DEFAULT_HERO_VISUAL_TUNING: QuantumNebulaHeroVisualTuning = {
  particleCount: 55_000,
  particleSize: 0.054,
  sphereRadius: 1.55,
  pupilRadius: 0.22,
  cameraDistance: 5,
  bloomStrength: 0.56,
  bloomRadius: 0.42,
  bloomThreshold: 0.14,
  reflexionBloomStrength: 0.72,
  reflexionBloomRadius: 0.48,
  reflexionBloomThreshold: 0.1,
};

export interface QuantumNebulaHeroV3Props {
  className?: string;
  fullscreen?: boolean;
  theme?: QuantumNebulaHeroTheme;
  state?: QuantumNebulaState;
  visualTuning?: Partial<QuantumNebulaHeroVisualTuning>;
  flowMode?: ViewportFlowMode;
  flowTuning?: Partial<ViewportFlowTuning>;
  antiParticleColor?: string;
  passBehindWord?: boolean;
  /** Empty text → circular pupil */
  word?: QuantumNebulaWordConfig | null;
  wordDriveRef?: MutableRefObject<QuantumNebulaHeroWordDrive | null>;
  children?: ReactNode;
}

function resolveTheme(theme: QuantumNebulaHeroTheme): "dark" | "light" {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("light")) return "light";
    if (root.classList.contains("dark")) return "dark";
  }
  return getStoredThemeIsDark() ? "dark" : "light";
}

export function QuantumNebulaHeroV3({
  className,
  fullscreen = true,
  theme = "auto",
  state = "repos",
  visualTuning,
  flowMode = "vortex",
  flowTuning,
  antiParticleColor = "#e0dfb1",
  passBehindWord = true,
  word = null,
  wordDriveRef,
  children,
}: QuantumNebulaHeroV3Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const visualRef = useRef({ ...DEFAULT_HERO_VISUAL_TUNING, ...visualTuning });
  visualRef.current = { ...DEFAULT_HERO_VISUAL_TUNING, ...visualTuning };
  const flowTuningRef = useRef({ ...defaultViewportFlowTuning, ...flowTuning });
  flowTuningRef.current = { ...defaultViewportFlowTuning, ...flowTuning };
  const wordRef = useRef(word);
  wordRef.current = word;
  const wordDriveRefStable = useRef(wordDriveRef);
  wordDriveRefStable.current = wordDriveRef;
  const themeRef = useRef(resolveTheme(theme));

  useEffect(() => {
    themeRef.current = resolveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const visual = visualRef.current;
    const resolved = themeRef.current;
    const isLight = resolved === "light";
    const bgHex = isLight ? 0xffffff : 0x000000;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgHex);

    const camera = new THREE.PerspectiveCamera(
      65,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 0, visual.cameraDistance);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(bgHex, 1);
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isLight) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          Math.max(1, Math.floor(mount.clientWidth * 0.5)),
          Math.max(1, Math.floor(mount.clientHeight * 0.5)),
        ),
        visual.bloomStrength,
        visual.bloomRadius,
        visual.bloomThreshold,
      );
      composer.addPass(bloomPass);
    }

    const count = Math.max(4000, Math.floor(visual.particleCount));
    const dominant = new THREE.Color(isLight ? 0x0b0f14 : 0x18bec7);
    const anti = new THREE.Color(antiParticleColor);

    const { positions, colors, pointSizes, buffers } = initViewportFlowParticles(
      count,
      9.5,
      4.6,
      dominant,
      anti,
      isLight,
    );
    const velocities = new Float32Array(count * 3);
    const restColors = colors.slice();

    const neural = buildNeuralMicrograph(count, 77, visual.sphereRadius * 0.96, {
      pupilRadius: visual.pupilRadius,
      ringInnerWidth: 0.022,
      ringMidWidth: 0.008,
      ringMidPosition: 0.3,
      ringOuterThinWidth: 0.018,
      ringOuterThickWidth: 0.095,
      ringOuterGap: 0.038,
      ringDensityInner: 0.2,
      ringDensityMid: 0.1,
      ringDensityOuterThin: 0.16,
      ringDensityOuterThick: 0.54,
    });
    const figureTargets = buildMetatronTargets(count, visual.sphereRadius * 0.95);

    const emptyWord: QuantumNebulaWordConfig = {
      text: "",
      font: "Cinzel",
      scale: 1,
      weight: 500,
      spacingEm: 0,
      italic: false,
      uppercase: true,
      outline: false,
    };
    const wordCfg = word ?? emptyWord;
    let wordMask = buildWordMaskData(wordCfg);
    const wordOffsetX = wordCfg.offsetX ?? 0;
    const wordOffsetY = wordCfg.offsetY ?? 0;

    const sizeScale = isLight ? VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE : 1;
    const pixelRatio = renderer.getPixelRatio();

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_pointSize: {
          value: visual.particleSize * pixelRatio * sizeScale * 34,
        },
        u_pupilRadius: { value: visual.pupilRadius },
        u_wordActive: { value: wordMask.active ? 1 : 0 },
        u_wordReveal: { value: 1 },
        u_wordHalfSize: {
          value: new THREE.Vector2(wordMask.planeW * 0.5, wordMask.planeH * 0.5),
        },
        u_wordCenter: { value: new THREE.Vector2(wordOffsetX, wordOffsetY) },
        u_wordTex: { value: wordMask.texture },
        u_passBehind: { value: passBehindWord ? 1 : 0 },
        u_isLight: { value: isLight ? 1 : 0 },
      },
      vertexShader: VIEWPORT_PARTICLE_VERTEX_SHADER,
      fragmentShader: VIEWPORT_PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("a_size", new THREE.BufferAttribute(pointSizes, 1));
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const pupilGeom = new THREE.SphereGeometry(1, 48, 48);
    const pupilMesh = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({ color: bgHex, toneMapped: false }),
    );
    pupilMesh.scale.setScalar(visual.pupilRadius);
    pupilMesh.visible = !wordMask.active;
    scene.add(pupilMesh);

    const pupilOverlayScene = new THREE.Scene();
    const pupilOverlayMesh = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({
        color: bgHex,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      }),
    );
    pupilOverlayMesh.scale.setScalar(visual.pupilRadius);
    pupilOverlayMesh.visible = !wordMask.active;
    pupilOverlayScene.add(pupilOverlayMesh);

    const wordOverlayMaterial = new THREE.MeshBasicMaterial({
      color: bgHex,
      transparent: true,
      opacity: 1,
      alphaTest: 0.22,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    });
    const wordOverlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wordOverlayMaterial);
    wordOverlayMesh.position.set(wordOffsetX, wordOffsetY, 0.01);
    wordOverlayMesh.visible = wordMask.active;
    if (wordMask.active) {
      wordOverlayMesh.scale.set(wordMask.planeW, wordMask.planeH, 1);
      wordOverlayMaterial.alphaMap = wordMask.texture;
    }
    pupilOverlayScene.add(wordOverlayMesh);

    const wordStyleBase = { ...wordCfg };
    let liveText = wordCfg.text;
    let liveReveal = 1;
    let wordOffsetLiveX = wordOffsetX;
    let wordOffsetLiveY = wordOffsetY;

    const applyWordLive = (drive: QuantumNebulaHeroWordDrive | null) => {
      const base = wordStyleBase;
      const text = (drive?.text ?? base.text).trim();
      const ox = drive?.offsetX ?? base.offsetX ?? 0;
      const oy = drive?.offsetY ?? base.offsetY ?? 0;
      const reveal = drive?.reveal ?? 1;

      if (text !== liveText) {
        liveText = text;
        if (wordMask.texture) wordMask.texture.dispose();
        wordMask = buildWordMaskData({ ...base, text, offsetX: ox, offsetY: oy });
        particleMaterial.uniforms.u_wordTex.value = wordMask.texture;
        particleMaterial.uniforms.u_wordHalfSize.value.set(
          wordMask.planeW * 0.5,
          wordMask.planeH * 0.5,
        );
        if (wordMask.active) {
          wordOverlayMesh.scale.set(wordMask.planeW, wordMask.planeH, 1);
          wordOverlayMaterial.alphaMap = wordMask.texture;
          wordOverlayMaterial.needsUpdate = true;
        }
        particleMaterial.uniforms.u_wordActive.value = wordMask.active ? 1 : 0;
        pupilMesh.visible = !wordMask.active;
        pupilOverlayMesh.visible = !wordMask.active;
        wordOverlayMesh.visible = wordMask.active;
      }

      wordOffsetLiveX = ox;
      wordOffsetLiveY = oy;
      liveReveal = reveal;
      particleMaterial.uniforms.u_wordCenter.value.set(ox, oy);
      particleMaterial.uniforms.u_wordReveal.value = Math.max(0, Math.min(1, reveal));
      wordOverlayMesh.position.set(ox, oy, 0.01);
      wordOverlayMaterial.opacity = wordMask.active ? reveal : 0;
      wordOverlayMesh.visible = wordMask.active && reveal > 0.03;
    };

    const clock = new THREE.Clock();
    let reflexionMix = 0;
    let vortexMixRef = { current: flowMode === "vortex" ? 1 : 0 };
    let smoothVortexDirRef = { current: flowTuningRef.current.vortexDirMode === "auto" ? 1 : flowTuningRef.current.vortexDirMode };
    const smoothDirRef = { x: 1, y: 0 };
    const colorsDirtyRef = { current: true };
    let bassLevel = 0;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;
      const targetReflexion = currentState === "reflexion" ? 1 : 0;
      reflexionMix += (targetReflexion - reflexionMix) * 0.075;
      const flowMix = 1 - reflexionMix;
      const figureMix = 0;

      bassLevel *= currentState === "mouvement" ? 0.92 : 0.94;

      if (wordDriveRefStable.current) {
        applyWordLive(wordDriveRefStable.current.current);
      }

      stepViewportFlow({
        count,
        flowMix,
        figureMix,
        reflexionMix,
        elapsedTime: elapsed,
        bassLevel,
        tuning: flowTuningRef.current,
        flowMode,
        positions,
        velocities,
        colors,
        restColors,
        pointSizes,
        buffers,
        figureTargets,
        neural,
        wordMask,
        passBehindWord,
        pupilRadius: visual.pupilRadius,
        smoothVortexDirRef,
        smoothDirRef,
        vortexMixRef,
        colorsDirtyRef,
        reflexionPulseSpeed: 1.85,
        reflexionWaveAmplitude: 0.042,
        reflexionGlowBoost: 0.28,
        reflexionSizePulse: 0.08,
        wordOffsetX: wordOffsetLiveX,
        wordOffsetY: wordOffsetLiveY,
        wordReveal: liveReveal,
      });

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.a_size.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      if (bloomPass) {
        const baseBloom =
          visual.bloomStrength * flowMix + visual.reflexionBloomStrength * reflexionMix;
        bloomPass.strength += (baseBloom - bloomPass.strength) * 0.1;
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(pupilOverlayScene, camera);
      renderer.autoClear = true;
    };

    const onResize = () => {
      const w = Math.max(mount.clientWidth, 1);
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };

    window.addEventListener("resize", onResize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (wordMask.texture) wordMask.texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      pupilGeom.dispose();
      composer?.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [antiParticleColor, flowMode, passBehindWord, theme, word, wordDriveRef]);

  return (
    <div
      className={cn(
        "overflow-hidden bg-black",
        fullscreen ? "fixed inset-0 h-screen w-screen" : "relative h-full w-full",
        className,
      )}
    >
      <div ref={mountRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {children}
    </div>
  );
}

export default QuantumNebulaHeroV3;
```

## `src/components/ui/quantumNebulaWordMask.ts`

```typescript
import * as THREE from "three";

export interface QuantumNebulaWordConfig {
  text: string;
  font: string;
  scale: number;
  weight: number;
  spacingEm: number;
  italic: boolean;
  uppercase: boolean;
  outline: boolean;
  /** World-space offset of the word pupil (positive X = right). */
  offsetX?: number;
  offsetY?: number;
}

export interface WordMaskData {
  active: boolean;
  texture: THREE.CanvasTexture | null;
  planeW: number;
  planeH: number;
  gridW: number;
  gridH: number;
  mask: Float32Array | null;
  blurred: Float32Array | null;
  gradX: Float32Array | null;
  gradY: Float32Array | null;
}

export function buildWordMaskData(wordCfg: QuantumNebulaWordConfig): WordMaskData {
  const rawText = (wordCfg.text || "").trim();
  if (!rawText) {
    return {
      active: false,
      texture: null,
      planeW: 1,
      planeH: 1,
      gridW: 0,
      gridH: 0,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }

  const displayText = wordCfg.uppercase ? rawText.toUpperCase() : rawText;
  const canvasW = 1024;
  const canvasH = 384;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      active: false,
      texture: null,
      planeW: 1,
      planeH: 1,
      gridW: 0,
      gridH: 0,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }

  const fontStyle = wordCfg.italic ? "italic" : "normal";
  const fontFamily = `"${wordCfg.font}", "Cinzel", serif`;

  let fontPx = 220;
  const measureWithSpacing = (px: number) => {
    ctx.font = `${fontStyle} ${wordCfg.weight} ${px}px ${fontFamily}`;
    const letterSpacePx = wordCfg.spacingEm * px;
    let totalW = 0;
    for (let i = 0; i < displayText.length; i++) {
      totalW += ctx.measureText(displayText[i]).width;
      if (i < displayText.length - 1) totalW += letterSpacePx;
    }
    return { totalW, letterSpacePx };
  };

  let measured = measureWithSpacing(fontPx);
  while (measured.totalW > canvasW * 0.86 && fontPx > 32) {
    fontPx -= 6;
    measured = measureWithSpacing(fontPx);
  }

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.font = `${fontStyle} ${wordCfg.weight} ${fontPx}px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, fontPx * 0.055);

  let cursorX = (canvasW - measured.totalW) * 0.5;
  const centerY = canvasH * 0.52;
  for (let i = 0; i < displayText.length; i++) {
    const ch = displayText[i];
    if (wordCfg.outline) {
      ctx.strokeText(ch, cursorX, centerY);
    } else {
      ctx.fillText(ch, cursorX, centerY);
    }
    cursorX += ctx.measureText(ch).width + measured.letterSpacePx;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const gridW = 160;
  const gridH = 60;
  const small = document.createElement("canvas");
  small.width = gridW;
  small.height = gridH;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  if (!sctx) {
    return {
      active: true,
      texture,
      planeW: 1.08 * wordCfg.scale,
      planeH: 1.08 * wordCfg.scale,
      gridW,
      gridH,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }
  sctx.drawImage(canvas, 0, 0, gridW, gridH);
  const sdata = sctx.getImageData(0, 0, gridW, gridH).data;

  const rawMask = new Float32Array(gridW * gridH);
  for (let i = 0; i < gridW * gridH; i++) {
    rawMask[i] = sdata[i * 4 + 3] / 255;
  }

  const blurred = rawMask.slice();
  const temp = new Float32Array(gridW * gridH);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let sum = 0;
        let count = 0;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < gridW) {
            sum += blurred[y * gridW + nx];
            count++;
          }
        }
        temp[y * gridW + x] = sum / count;
      }
    }
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < gridH) {
            sum += temp[ny * gridW + x];
            count++;
          }
        }
        blurred[y * gridW + x] = sum / count;
      }
    }
  }

  const gradX = new Float32Array(gridW * gridH);
  const gradY = new Float32Array(gridW * gridH);
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      const idx = y * gridW + x;
      const gx = blurred[idx - 1] - blurred[idx + 1];
      const gy = blurred[(y + 1) * gridW + x] - blurred[(y - 1) * gridW + x];
      const len = Math.hypot(gx, gy) + 0.0001;
      gradX[idx] = gx / len;
      gradY[idx] = gy / len;
    }
  }

  const aspect = canvasW / canvasH;
  const planeH = 1.08 * wordCfg.scale;
  const planeW = planeH * aspect;

  return {
    active: true,
    texture,
    planeW,
    planeH,
    gridW,
    gridH,
    mask: rawMask,
    blurred,
    gradX,
    gradY,
  };
}
```

## `src/components/ui/quantumNebulaViewportFlow.ts`

```typescript
import * as THREE from "three";
import type { WordMaskData } from "./quantumNebulaWordMask";

export const VIEWPORT_ANTI_PARTICLE_RATIO = 0.35;
export const VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE = 11.5;

export type ViewportFlowMode = "auto" | "wave" | "vortex";

export interface ViewportFlowTuning {
  friction: number;
  noiseSpeed: number;
  noiseScale: number;
  flowSpeed: number;
  manualVortexMix: number;
  vortexDirMode: "auto" | 1 | -1;
  waveDirMode: "auto" | "manual";
  waveAngleDeg: number;
}

export const defaultViewportFlowTuning: ViewportFlowTuning = {
  friction: 0.915,
  noiseSpeed: 0.24,
  noiseScale: 1.15,
  flowSpeed: 0.25,
  manualVortexMix: 1,
  vortexDirMode: -1,
  waveDirMode: "auto",
  waveAngleDeg: 0,
};

export interface ViewportFlowBuffers {
  waveLayers: Float32Array;
  waveSeeds: Float32Array;
  particleDirs: Int8Array;
  particleColorJitter: Float32Array;
}

export function initViewportFlowParticles(
  count: number,
  spanX: number,
  spanY: number,
  dominant: THREE.Color,
  antiColor: THREE.Color,
  isLight: boolean,
): {
  positions: Float32Array;
  colors: Float32Array;
  pointSizes: Float32Array;
  buffers: ViewportFlowBuffers;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const pointSizes = new Float32Array(count);
  const waveLayers = new Float32Array(count);
  const waveSeeds = new Float32Array(count);
  const particleDirs = new Int8Array(count);
  const particleColorJitter = new Float32Array(count);
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isDust = Math.random() < 0.12;
    const layerIdx = isDust
      ? (Math.random() - 0.5) * 2.4
      : (Math.floor(Math.random() * 5) - 2) * 0.42;
    waveLayers[i] = layerIdx;
    waveSeeds[i] = Math.random();
    const jitter = Math.random() - 0.5;
    particleColorJitter[i] = jitter;

    positions[i3] = (Math.random() - 0.5) * spanX;
    positions[i3 + 1] = (Math.random() - 0.5) * spanY;
    positions[i3 + 2] = layerIdx * 0.55 + (Math.random() - 0.5) * 0.35;

    const isAnti = Math.random() < VIEWPORT_ANTI_PARTICLE_RATIO;
    particleDirs[i] = isAnti ? -1 : 1;

    if (isAnti) {
      tmp.copy(antiColor);
      tmp.offsetHSL(jitter * 0.025, 0, jitter * 0.08);
    } else {
      tmp.copy(dominant);
      if (!isLight) {
        tmp.offsetHSL(jitter * 0.03, 0, jitter * 0.08);
      }
    }
    colors[i3] = tmp.r;
    colors[i3 + 1] = tmp.g;
    colors[i3 + 2] = tmp.b;
    pointSizes[i] = isDust ? 0.65 + Math.random() * 0.6 : 0.8 + Math.random() * 0.55;
  }

  return {
    positions,
    colors,
    pointSizes,
    buffers: { waveLayers, waveSeeds, particleDirs, particleColorJitter },
  };
}

export interface ViewportFlowStepParams {
  count: number;
  flowMix: number;
  figureMix: number;
  reflexionMix: number;
  elapsedTime: number;
  bassLevel: number;
  tuning: ViewportFlowTuning;
  flowMode: ViewportFlowMode;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  restColors: Float32Array;
  pointSizes: Float32Array;
  buffers: ViewportFlowBuffers;
  figureTargets: Float32Array;
  neural: {
    targets: Float32Array;
    sizes: Float32Array;
    brightness: Float32Array;
    phase: Float32Array;
  };
  wordMask: WordMaskData | null;
  passBehindWord: boolean;
  pupilRadius: number;
  smoothVortexDirRef: { current: number };
  smoothDirRef: { x: number; y: number };
  vortexMixRef: { current: number };
  colorsDirtyRef: { current: boolean };
  reflexionPulseSpeed: number;
  reflexionWaveAmplitude: number;
  reflexionGlowBoost: number;
  reflexionSizePulse: number;
  wordOffsetX?: number;
  wordOffsetY?: number;
  /** 0 = mot « pulverisé », 1 = silhouette pleine. */
  wordReveal?: number;
}

/** GenerativeArtSceneV3 viewport flow — wave ↔ vortex, word/pupil bounce (repos / flow states). */
export function stepViewportFlow(params: ViewportFlowStepParams): void {
  const {
    count,
    flowMix,
    figureMix,
    reflexionMix,
    elapsedTime,
    bassLevel,
    tuning,
    flowMode,
    positions: posArr,
    velocities: velArr,
    colors: colArr,
    restColors,
    pointSizes: sizeArr,
    buffers,
    figureTargets,
    neural,
    wordMask,
    passBehindWord,
    pupilRadius,
    smoothVortexDirRef,
    smoothDirRef,
    vortexMixRef,
    colorsDirtyRef,
    reflexionPulseSpeed,
    reflexionWaveAmplitude,
    reflexionGlowBoost,
    reflexionSizePulse,
    wordOffsetX = 0,
    wordOffsetY = 0,
    wordReveal = 1,
  } = params;

  const { waveLayers, waveSeeds, particleDirs } = buffers;

  let targetVortex = tuning.manualVortexMix;
  if (flowMode === "auto") {
    const cycle = (Math.sin(elapsedTime * 0.28 - 0.8) + 1) * 0.5;
    targetVortex = cycle < 0.35 ? 0 : cycle > 0.68 ? 1 : (cycle - 0.35) / 0.33;
  } else if (flowMode === "wave") {
    targetVortex = 0;
  } else if (flowMode === "vortex") {
    targetVortex = 1;
  }
  vortexMixRef.current += (targetVortex - vortexMixRef.current) * 0.045;
  const vortexMix = vortexMixRef.current;
  const waveMix = 1 - vortexMix;
  const transitionEddy = Math.sin(vortexMix * Math.PI);

  let targetVortexDir = 1;
  if (tuning.vortexDirMode === "auto") {
    targetVortexDir = Math.sin(elapsedTime * 0.14) >= 0 ? 1 : -1;
  } else {
    targetVortexDir = tuning.vortexDirMode;
  }
  smoothVortexDirRef.current +=
    (targetVortexDir - smoothVortexDirRef.current) * 0.035;
  const smoothVortexDir = smoothVortexDirRef.current;

  let targetAngleRad = (tuning.waveAngleDeg * Math.PI) / 180;
  if (tuning.waveDirMode === "auto") {
    targetAngleRad =
      (elapsedTime * 0.16 + Math.sin(elapsedTime * 0.23) * 0.65) % (Math.PI * 2);
  }
  smoothDirRef.x += (Math.cos(targetAngleRad) - smoothDirRef.x) * 0.06;
  smoothDirRef.y += (Math.sin(targetAngleRad) - smoothDirRef.y) * 0.06;
  const dirNorm = Math.hypot(smoothDirRef.x, smoothDirRef.y) || 1;
  const cosA = smoothDirRef.x / dirNorm;
  const sinA = smoothDirRef.y / dirNorm;

  const wordActive = wordMask?.active ?? false;
  const halfW = wordActive ? wordMask!.planeW * 0.5 : 0;
  const halfH = wordActive ? wordMask!.planeH * 0.5 : 0;
  const invW = wordActive ? 1 / wordMask!.planeW : 0;
  const invH = wordActive ? 1 / wordMask!.planeH : 0;
  const gridW = wordActive ? wordMask!.gridW : 0;
  const gridH = wordActive ? wordMask!.gridH : 0;
  const wordBlurred = wordActive ? wordMask!.blurred : null;
  const wordGradX = wordActive ? wordMask!.gradX : null;
  const wordGradY = wordActive ? wordMask!.gradY : null;
  const passBehind = passBehindWord;
  const pupilR = pupilRadius;
  const pupilShell = pupilR * 1.08;

  const speedMul = tuning.flowSpeed;
  const vortexOriginR = wordActive ? 0 : pupilR * 1.05;
  const vortexSpinSpeed = (0.0095 + bassLevel * 0.012) * speedMul;
  const vortexTime = elapsedTime * 0.9 * speedMul;
  const waveTime = elapsedTime * 0.85 * speedMul;
  const halfSpanX = 5.2;
  const halfSpanY = 2.9;

  const needColorUpdate = reflexionMix > 0.005 || colorsDirtyRef.current;
  const nSpeed = elapsedTime * tuning.noiseSpeed * speedMul;
  const nScale = tuning.noiseScale;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let px = posArr[i3];
    let py = posArr[i3 + 1];
    let pz = posArr[i3 + 2];
    let vx = velArr[i3];
    let vy = velArr[i3 + 1];
    let vz = velArr[i3 + 2];
    const layer = waveLayers[i];
    const seed = waveSeeds[i];
    const pDir = particleDirs[i];

    if (flowMix > 0.005) {
      let fx = 0;
      let fy = 0;
      let fz = 0;
      let ridge = 0.5;

      const curlX = Math.sin(py * nScale + nSpeed);
      const curlY = Math.cos(pz * nScale + nSpeed);
      const curlZ = Math.sin(px * nScale + nSpeed);

      if (waveMix > 0.005) {
        const pCos = cosA * pDir;
        const pSin = sinA * pDir;
        const u = px * pCos + py * pSin;
        const v = -px * pSin + py * pCos;

        const warpU = u * 0.62 - waveTime + layer * 1.3;
        const warpV = v * 0.85 + Math.sin(warpU * 0.7) * 0.65;
        const swell1 = Math.sin(warpU + Math.cos(warpV) * 0.55);
        const swell2 = Math.cos(u * 0.42 - waveTime * 0.72 + v * 0.52);

        const targetV = swell1 * 0.85 + swell2 * 0.42 + layer * 0.72;
        const targetZ = Math.cos(warpU * 0.85 + layer) * 0.55 + layer * 0.48;
        ridge = 0.5 + 0.5 * swell1;

        const driftSpeed = (0.014 + seed * 0.012 + bassLevel * 0.025) * speedMul;
        const fu = driftSpeed;
        const fv = (targetV - v) * 0.014;

        fx += (fu * pCos - fv * pSin + curlX * 0.0022) * waveMix;
        fy += (fu * pSin + fv * pCos + curlY * 0.0028) * waveMix;
        fz += ((targetZ - pz) * 0.018 + curlZ * 0.002) * waveMix;
      }

      if (vortexMix > 0.005) {
        const vox = wordActive ? wordOffsetX : 0;
        const voy = wordActive ? wordOffsetY : 0;
        const rx = px - vox;
        const ry = py - voy;
        const rXY = Math.sqrt(rx * rx + ry * ry) + 0.001;
        const invR = 1 / rXY;
        const baseTangX = -ry * invR;
        const baseTangY = rx * invR;
        const spinDir = smoothVortexDir * pDir;
        const tangX = baseTangX * spinDir;
        const tangY = baseTangY * spinDir;

        const tightBand = seed * seed * seed * 2.45 + Math.abs(layer) * 0.18;
        const breatheR = Math.sin(elapsedTime * 0.85 + seed * 6.283 + layer * 2) * 0.08;
        const targetR = Math.max(vortexOriginR, vortexOriginR + tightBand + breatheR);

        const speedByRadius =
          vortexSpinSpeed * (0.55 + 0.65 * (rXY / (0.35 + rXY))) * (0.7 + seed * 0.6);

        const vt = vx * baseTangX + vy * baseTangY;
        const centripetal = Math.min(0.035, (vt * vt) / (rXY + 0.08));
        const radialPull = (targetR - rXY) * 0.032 - centripetal;

        const funnelZ =
          layer * 0.22 + Math.sin(rXY * 1.5 - vortexTime * pDir) * 0.12 - rXY * 0.06;
        const zPull = (funnelZ - pz) * 0.035;

        const spiralArm =
          0.5 +
          0.5 *
            Math.sin(rXY * 2.6 - vortexTime * pDir + (tangX - tangY) * 2.0 + layer * 2.4);
        ridge = ridge * waveMix + spiralArm * vortexMix;

        fx += (tangX * speedByRadius + rx * invR * radialPull + curlX * 0.0012) * vortexMix;
        fy += (tangY * speedByRadius + ry * invR * radialPull + curlY * 0.0012) * vortexMix;
        fz += (zPull + curlZ * 0.0012) * vortexMix;
      }

      if (transitionEddy > 0.05) {
        const rad = Math.sqrt(px * px + py * py) + 0.25;
        const whip = (transitionEddy * 0.0042 * speedMul) / (0.45 + rad * 0.35);
        const eddyDir = smoothVortexDir * pDir;
        fx += (-py * eddyDir - px * 0.35) * whip + curlX * transitionEddy * 0.0022;
        fy += (px * 0.75 * eddyDir - py * 0.35) * whip + curlY * transitionEddy * 0.0022;
        fz += curlZ * transitionEddy * 0.0025;
      }

      vx = (vx + fx * flowMix) * tuning.friction;
      vy = (vy + fy * flowMix) * tuning.friction;
      vz = (vz + fz * flowMix) * tuning.friction;

      px += vx;
      py += vy;
      pz += vz;

      if (waveMix > 0.35) {
        if (px > halfSpanX) px = -halfSpanX;
        else if (px < -halfSpanX) px = halfSpanX;
        if (py > halfSpanY + 0.6) py = -halfSpanY - 0.6;
        else if (py < -halfSpanY - 0.6) py = halfSpanY + 0.6;
      }

      const targetSz = (0.72 + ridge * 0.65) * (1 + bassLevel * 0.35);
      sizeArr[i] += (targetSz - sizeArr[i]) * 0.12;
    }

    if (figureMix > 0.01) {
      const tx = figureTargets[i3];
      const ty = figureTargets[i3 + 1];
      const tz = figureTargets[i3 + 2];
      const pull = figureMix * (0.045 + figureMix * 0.14);
      px += (tx - px) * pull;
      py += (ty - py) * pull;
      pz += (tz - pz) * pull;
      vx *= 0.86;
      vy *= 0.86;
      vz *= 0.86;
    }

    if (reflexionMix > 0.005) {
      const thought = Math.sin(elapsedTime * reflexionPulseSpeed + neural.phase[i]);
      const wave = reflexionWaveAmplitude * (1.15 - neural.brightness[i]) * reflexionMix;
      const nx =
        neural.targets[i3] + Math.cos(elapsedTime * 1.3 + neural.phase[i]) * wave;
      const ny =
        neural.targets[i3 + 1] + Math.sin(elapsedTime * 1.1 + neural.phase[i] * 0.85) * wave;
      const nz = neural.targets[i3 + 2] + thought * wave * 0.45;
      px += (nx - px) * reflexionMix * 0.16;
      py += (ny - py) * reflexionMix * 0.16;
      pz += (nz - pz) * reflexionMix * 0.16;
      vx *= 1 - reflexionMix * 0.25;
      vy *= 1 - reflexionMix * 0.25;
      vz *= 1 - reflexionMix * 0.25;

      const glow =
        1 +
        reflexionMix *
          neural.brightness[i] *
          reflexionGlowBoost *
          (1 + Math.max(0, thought) * 0.2);
      colArr[i3] += (restColors[i3] * glow - colArr[i3]) * 0.14;
      colArr[i3 + 1] += (restColors[i3 + 1] * glow - colArr[i3 + 1]) * 0.14;
      colArr[i3 + 2] += (restColors[i3 + 2] * glow - colArr[i3 + 2]) * 0.14;
      sizeArr[i] +=
        (neural.sizes[i] * (0.92 + thought * reflexionSizePulse) - sizeArr[i]) * 0.14;
    } else if (colorsDirtyRef.current) {
      colArr[i3] += (restColors[i3] - colArr[i3]) * 0.12;
      colArr[i3 + 1] += (restColors[i3 + 1] - colArr[i3 + 1]) * 0.12;
      colArr[i3 + 2] += (restColors[i3 + 2] - colArr[i3 + 2]) * 0.12;
    }

    if (wordActive && wordReveal > 0.02 && wordBlurred && wordGradX && wordGradY) {
      const lx = px - wordOffsetX;
      const ly = py - wordOffsetY;
      if (lx > -halfW && lx < halfW && ly > -halfH && ly < halfH) {
        if (!passBehind || pz > -0.22) {
          const gx = Math.floor((lx + halfW) * invW * (gridW - 1));
          const gy = Math.floor((1 - (ly + halfH) * invH) * (gridH - 1));
          const idx = gy * gridW + gx;
          const density = wordBlurred[idx];
          if (density > 0.08 * wordReveal) {
            const nx = wordGradX[idx];
            const ny = wordGradY[idx];
            const inward = vx * nx + vy * ny;
            if (inward < 0) {
              vx -= nx * inward * 1.65;
              vy -= ny * inward * 1.65;
            }
            const repel = density * (passBehind ? 0.012 : 0.018) * wordReveal;
            vx += nx * repel;
            vy += ny * repel;
            if (density > 0.35) {
              px += nx * 0.035;
              py += ny * 0.035;
              if (passBehind && pz > -0.05) {
                vz -= 0.006;
              }
            }
          }
        }
      }
    } else {
      const r = Math.sqrt(px * px + py * py + pz * pz) + 0.0001;
      if (r < pupilShell) {
        const nx = px / r;
        const ny = py / r;
        const nz = pz / r;
        px = nx * pupilShell;
        py = ny * pupilShell;
        pz = nz * pupilShell;
        const inward = vx * nx + vy * ny + vz * nz;
        if (inward < 0) {
          vx -= nx * inward * 1.45;
          vy -= ny * inward * 1.45;
          vz -= nz * inward * 1.45;
        }
      }
    }

    posArr[i3] = px;
    posArr[i3 + 1] = py;
    posArr[i3 + 2] = pz;
    velArr[i3] = vx;
    velArr[i3 + 1] = vy;
    velArr[i3 + 2] = vz;
  }

  if (needColorUpdate && reflexionMix <= 0.01) {
    colorsDirtyRef.current = false;
  } else if (reflexionMix > 0.01) {
    colorsDirtyRef.current = true;
  }
}

export const VIEWPORT_PARTICLE_VERTEX_SHADER = `
  attribute vec3 color;
  attribute float a_size;
  varying vec3 vColor;
  varying float vAlpha;

  uniform float u_pointSize;
  uniform float u_pupilRadius;
  uniform float u_wordActive;
  uniform float u_wordReveal;
  uniform vec2 u_wordHalfSize;
  uniform vec2 u_wordCenter;
  uniform sampler2D u_wordTex;
  uniform float u_passBehind;

  void main() {
    vColor = color;
    vAlpha = 1.0;

    float wordGate = u_wordActive * u_wordReveal;
    if (u_wordActive > 0.5 && wordGate >= 0.02) {
      vec2 uv = ((position.xy - u_wordCenter) / (u_wordHalfSize * 2.0)) + 0.5;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        float letterMask = texture2D(u_wordTex, uv).a;
        if (letterMask > 0.25 * wordGate) {
          if (u_passBehind < 0.5 || position.z > -0.02) {
            vAlpha = 0.0;
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
        }
      }
    } else if (u_wordActive < 0.5) {
      float r = length(position);
      if (r < u_pupilRadius * 1.04) {
        vAlpha = 0.0;
        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
    }

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depth = max(0.8, -mvPosition.z);
    vAlpha = clamp(1.25 - depth * 0.11, 0.28, 1.0);
    gl_PointSize = min(14.0, u_pointSize * a_size * (4.5 / depth));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const VIEWPORT_PARTICLE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float u_isLight;

  void main() {
    if (vAlpha <= 0.01) discard;
    vec2 c = gl_PointCoord - vec2(0.5);
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;
    float core = exp(-d2 * 15.0);
    float alpha = core * vAlpha * (u_isLight > 0.5 ? 0.85 : 0.78);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
```

## `src/features/welcome/DESIGN.md`

```markdown
---
version: alpha
name: AEGIS Welcome HUD
description: >-
  Écran d’accueil membre (/welcome) — cockpit plein viewport, nebula Quantum
  en repos, typo Cormorant + DM Mono, CTAs pills glass/or. Dark par défaut ;
  miroir light atténué. Sources : WelcomeHudScreen, welcome-hud* dans index.css,
  WelcomeQuantumNebula, WelcomeGlassTile, SlideToStart.
colors:
  background: "hsl(var(--background))" # dark ~200 35% 7% · light #f5f2eb
  foreground: "hsl(var(--foreground))" # dark ivoire chaud · light #141412
  primary: "hsl(var(--primary))" # dark cuivre chaud 24 48% 65% · light or #9e7828
  primary-hover: "hsl(var(--primary-hover))"
  primary-foreground: "hsl(var(--primary-foreground))"
  primary-soft-fill: "hsl(var(--primary) / 0.10)"
  primary-soft-border: "hsl(var(--primary) / 0.25)"
  primary-soft-hover-fill: "hsl(var(--primary) / 0.15)"
  primary-soft-hover-border: "hsl(var(--primary) / 0.40)"
  muted: "hsl(var(--muted-foreground))"
  border-soft: "hsl(var(--border) / 0.25)"
  border-cta: "hsl(var(--border) / 0.30)"
  glass-fill: "hsl(var(--background) / 0.20)"
  glass-lang: "hsl(var(--background) / 0.40)"
  hero-glow: "hsl(var(--primary) / 0.28)" # light: foreground/0.04
  hud-wash-top: "hsl(var(--primary) / 0.10)"
  hud-wash-corner: "hsl(var(--neural-accent) / 0.06)"
  hud-wash-side: "hsl(var(--secondary) / 0.05)"
  card-glass-from: "hsl(var(--card) / 0.62)"
  card-glass-to: "hsl(var(--card) / 0.34)"
  tile-border: "hsl(var(--border) / 0.38)"
  slide-track: "hsl(var(--card) / 0.55)"
typography:
  brand-mark:
    fontFamily: Cinzel
    fontSize: 10px
    fontWeight: "600"
    letterSpacing: "0.28em"
    textTransform: uppercase
    content: "AEGIS — LOGOS"
  eyebrow:
    fontFamily: DM Mono
    fontSize: 10px
    fontWeight: "400"
    letterSpacing: "0.3em"
    textTransform: uppercase
    color: "{colors.primary}" # / 0.80 opacity
  hero-title:
    fontFamily: Cormorant Garamond # .font-cormorant-display
    fontSize: "2.5rem" # sm: 3rem (text-5xl)
    fontWeight: "300"
    lineHeight: "1.05"
    letterSpacing: "-0.01em"
  cta:
    fontFamily: DM Mono
    fontSize: 10px
    fontWeight: "400"
    letterSpacing: "0.22em"
    textTransform: uppercase
  lang-toggle:
    fontFamily: Cinzel
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: "0.05em"
    textTransform: uppercase
  tile-kicker:
    fontFamily: DM Mono
    fontSize: 10px
    letterSpacing: "0.22em"
    textTransform: uppercase
  tile-headline:
    fontFamily: DM Mono
    fontSize: "1.5rem" # sm: 1.875rem
    letterSpacing: "-0.01em"
  slide-label:
    fontFamily: DM Mono
    fontSize: 11px
    letterSpacing: "0.28em"
    textTransform: uppercase
rounded:
  lang: 12px # rounded-xl
  logo: 8px # rounded-lg
  cta-pill: 9999px # rounded-full
  glass-tile: 18px
  slide-track: 9999px
  slide-knob: 9999px
spacing:
  page-x: 20px # sm: 24px
  max-col: 28rem # max-w-md
  safe-top: "max(1.5rem, env(safe-area-inset-top))"
  safe-bottom: "max(1.75rem, env(safe-area-inset-bottom))"
  cta-min-h: 44px # min-h-11
  lang-h: 44px
  tile-min-h: 140px
  tile-pad: 16px
  slide-h: 56px
  knob: 48px
components:
  lang-toggle:
    backgroundColor: "{colors.glass-lang}"
    textColor: "{colors.muted}"
    typography: "{typography.lang-toggle}"
    rounded: "{rounded.lang}"
    blur: 14px
    border: "1px solid {colors.border-soft}"
  cta-secondary:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.muted}"
    typography: "{typography.cta}"
    rounded: "{rounded.cta-pill}"
    border: "1px solid {colors.border-cta}"
    blur: 4px
  cta-primary:
    backgroundColor: "{colors.primary-soft-fill}"
    textColor: "{colors.primary}"
    typography: "{typography.cta}"
    rounded: "{rounded.cta-pill}"
    border: "1px solid {colors.primary-soft-border}"
    blur: 4px
  glass-tile:
    backgroundColor: "linear-gradient(155deg, {colors.card-glass-from}, {colors.card-glass-to})"
    rounded: "{rounded.glass-tile}"
    blur: 20px
    border: "1px solid {colors.tile-border}"
  slide-knob:
    backgroundColor: "linear-gradient(145deg, {colors.primary}, {colors.primary-hover})"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.slide-knob}"
---

## Overview

Welcome (`/welcome`) est le **cockpit d’entrée membre** — une composition plein viewport, pas un dashboard.

Stack visuelle (code source) :

| Couche | Rôle | Fichier |
|--------|------|---------|
| **Quantum Nebula** | Fond 3D plein écran, état `repos` | `WelcomeQuantumNebula.tsx` |
| **HUD wash** | Voiles radiaux or / neural / secondary | `.welcome-hud-bg` |
| **Hero glow** | Halo or derrière le titre | `.welcome-hud-hero-glow` |
| **Chrome** | Logo + kickers + 2 CTAs | `WelcomeHudScreen.tsx` |

Une seule phrase héroïque (Cormorant). Brand = `AegisLogo` + « AEGIS — LOGOS » (Cinzel) + eyebrow « Exocortex ». Deux actions : Dashboard (minéral) / Voice agent (or soft).

Parent DA shell : [`.stitch/DESIGN.md`](../../../.stitch/DESIGN.md). Tokens runtime : `src/index.css` (`.welcome-hud*`).

## Composition (1er viewport)

Ordre vertical, colonne `max-w-md`, centrée :

1. **Header** — logo 40×40 → kicker DM Mono → eyebrow or  
2. **Main** — H1 Cormorant (« Bonjour, {name}. ») + glow  
3. **Footer** — 2 pills CTAs  
4. **Lang** — absolu top-right, Cinzel, glass blur 14px  

Pas de cards, stats, chips promo ni overlays stickers sur le hero. Nebula reste derrière (`z-0`) ; chrome à `z-10+`.

## Colors & Atmosphere

Dark (référence) :

- Fond page = `--background` (abysse froid ~`200 35% 7%`).
- Wash haut : ellipse primary 10 % ; coins neural / secondary très faibles.
- Vignette centrale via `::after` (`background / 0.22`).
- Glow titre : primary 28 %, blur 28px, ~440×220.

Light : washes atténués (primary 6 %) ; glow → `foreground / 0.04` (pas d’or flashy).

**Interdit sur Welcome :** purple/indigo glow, bronze landing marketing, cards glass bleutées, Inter/Roboto display.

## Typography

| Voix | Usage Welcome |
|------|----------------|
| **Cormorant Garamond** 300 | H1 seul |
| **DM Mono** (`.font-display`) | Kickers, CTAs, tuiles, slide label — uppercase tracking large |
| **Cinzel** | Toggle langue uniquement |
| **Barlow** | Corps hors HUD (modales post-tour, etc.) |

## Motion

- Entrée titre : `useAegisMotion().fadeUp(0.12)` (Framer).
- CTAs : hover border / translate icône 0.5 ; `duration-200`.
- Glass tile `:active` → `scale(0.985)` ; annulé si `prefers-reduced-motion`.
- Loading : spinner primary ring ; spin off si `reduceMotion`.
- Nebula : état `repos`, `sphereRadius: 1.1`, `cameraDistance: 3.6`, `theme: auto`.

## Components

### CTA secondaire (Dashboard)

Pill `rounded-full`, fill `background/20`, border `border/30`, texte muted, flèche 12px. Hover → texte foreground, border plus lisible.

### CTA primaire (Voice)

Pill or soft : `bg-primary/10`, `border-primary/25`, texte `primary`, icône Mic 12px. Hover → `/15` fill, `/40` border.

### Lang toggle

`h-11`, `rounded-xl`, glass `background/40` + `backdrop-blur-[14px]`, Cinzel locale.

### WelcomeGlassTile (hub legacy / variantes)

Radius **18px**, gradient card 62→34 %, blur 20px, inset hairline ivoire, ombre profonde. Kicker + headline DM Mono ; chip action `rounded-full`.

### SlideToStart

Track `h-14` full pill, glass card/55 %. Knob 48px, gradient primary → primary-hover, ombre or 40 %. Label DM Mono tracking `0.28em`. Seuil drag **82 %**.

## Do's / Don'ts

**Do**

- Garder nebula `repos` fullscreen derrière le HUD.
- Une H1 Cormorant max ; brand via `AegisLogo`.
- Touch targets ≥ 44px ; respecter safe-area.
- Brancher les strings i18n (`welcome.hud.*`, `welcome.choice.*`).

**Don't**

- Remplacer DM Mono kickers par Inter / system.
- Empiler tuiles ou gauges dans le 1er viewport HUD actuel.
- Utiliser le bronze landing (`.aegis-landing`) ici.
- Filtrer le logo ; toujours `AegisLogo`.

## Source map

```
src/pages/Welcome.tsx
src/features/welcome/components/WelcomeHudScreen.tsx
src/features/welcome/components/WelcomeQuantumNebula.tsx
src/features/welcome/components/WelcomeGlassTile.tsx
src/features/welcome/components/SlideToStart.tsx
src/features/welcome/components/ArcGauge.tsx
src/index.css          → .welcome-hud, .welcome-hud-bg, .welcome-hud-hero-glow,
                          .welcome-glass-tile, .welcome-slide-track, .welcome-slide-knob
```
```

## Extraits CSS `welcome-hud*` (`src/index.css`)

```css
.welcome-hud {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.welcome-hud-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    radial-gradient(ellipse 120% 80% at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 85% 100%, hsl(var(--neural-accent) / 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 55% 45% at 10% 65%, hsl(var(--secondary) / 0.05) 0%, transparent 48%),
    linear-gradient(
      180deg,
      hsl(var(--background) / 0.12) 0%,
      hsl(var(--aegis-hero-bg) / 0.08) 42%,
      hsl(var(--background) / 0.18) 100%
    );
}

.welcome-hud-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 95% 85% at 50% 42%,
    transparent 35%,
    hsl(var(--background) / 0.22) 100%
  );
}

.welcome-hud-hero-glow {
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(92vw, 440px);
  height: 220px;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse, hsl(var(--primary) / 0.28) 0%, transparent 72%);
  filter: blur(28px);
  pointer-events: none;
  z-index: 0;
}

html.light .welcome-hud-bg {
  background:
    radial-gradient(ellipse 120% 80% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 55%),
    linear-gradient(
      180deg,
      hsl(var(--background) / 0.08) 0%,
      transparent 45%,
      hsl(var(--background) / 0.14) 100%
    );
}

html.light .welcome-hud-bg::after {
  background: radial-gradient(
    ellipse 95% 85% at 50% 42%,
    transparent 40%,
    hsl(var(--background) / 0.12) 100%
  );
}

html.light .welcome-hud-hero-glow {
  background: radial-gradient(ellipse, hsl(var(--foreground) / 0.04) 0%, transparent 70%);
}
```
