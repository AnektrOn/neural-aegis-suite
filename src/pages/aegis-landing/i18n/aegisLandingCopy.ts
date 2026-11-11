/** Landing-only catalog (not `src/i18n/translations.ts`). */
export type AegisLandingLocale = "fr" | "en";
export type AegisLandingAudience = "individuel" | "entreprise";

export type AegisLandingCopy = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    comment: string;
    pourQui: string;
    tarif: string;
    faq: string;
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
    price: string;
    period: string;
    features: string[];
    cta: string;
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
    title: "AEGIS — Exocortex pour dirigeants",
    description:
      "AEGIS lit chaque semaine ce que vous faites réellement, le compare à votre trajectoire, et vous dit où vous dérivez.",
  },
  nav: { ...navFr, cta: "Demander mon accès" },
  hero: {
    chip: "AEGIS · EXOCORTEX POUR DIRIGEANTS",
    title: "Vous décidez seul. Vous reprenez les mêmes décisions. Vous le savez.",
    subtitle:
      "AEGIS est l'exocortex qui lit chaque semaine ce que vous faites réellement, le compare à la trajectoire que vous avez choisie, et vous dit où vous dérivez.",
    cta: "Demander mon accès · Sur devis",
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
        title: "Dirigeants et founders",
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
    title: "Un abonnement. Un rapport chaque semaine.",
    chip: "ACCÈS PRIORITAIRE",
    price: "Sur devis",
    period: "",
    features: [
      "Rapport hebdomadaire personnalisé",
      "Connexion des sources que vous choisissez",
      "Historique de vos trajectoires et écarts",
      "Support par email sous 24 h",
    ],
    cta: "Demander mon accès",
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
        a: "Le produit cible les dirigeants et membres de boards. Chaque demande est revue manuellement.",
      },
    ],
  },
  finalCta: {
    title: "Dans trois mois, vous aurez soit changé, soit répété.",
    cta: "Demander mon accès",
  },
  footer: { ...footerFr, links: [...footerFr.links] },
};

const individuelEn: AegisLandingCopy = {
  meta: {
    title: "AEGIS — Exocortex for executives",
    description:
      "Each week AEGIS reads what you actually do, compares it to the trajectory you chose, and tells you where you drift.",
  },
  nav: { ...navEn, cta: "Request access" },
  hero: {
    chip: "AEGIS · EXOCORTEX FOR EXECUTIVES",
    title: "You decide alone. You make the same calls again. You know it.",
    subtitle:
      "AEGIS is the exocortex that reads what you actually do each week, compares it to the trajectory you chose, and tells you where you drift.",
    cta: "Request access · On request",
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
        title: "Founders and executives",
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
    title: "One subscription. One report every week.",
    chip: "PRIORITY ACCESS",
    price: "On request",
    period: "",
    features: [
      "Personalised weekly report",
      "Connect the sources you choose",
      "History of trajectories and gaps",
      "Email support within 24 hours",
    ],
    cta: "Request access",
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
        a: "The product is for executives and board members. Each request is reviewed manually.",
      },
    ],
  },
  finalCta: {
    title: "In three months you will have either changed, or repeated.",
    cta: "Request access",
  },
  footer: { ...footerEn, links: [...footerEn.links] },
};

const entrepriseFr: AegisLandingCopy = {
  meta: {
    title: "AEGIS — Exocortex pour entreprises",
    description:
      "AEGIS lit chaque semaine ce que l'organisation fait réellement, le compare à sa trajectoire, et vous dit où elle dérive.",
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
    title: "AEGIS — Exocortex for companies",
    description:
      "Each week AEGIS reads what the organisation actually does, compares it to its trajectory, and tells you where it drifts.",
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
