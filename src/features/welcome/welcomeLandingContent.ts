/** Copy & data — landing LOGOS (`WelcomeView`). FR source of truth + EN mirror. */

export const WELCOME_GOLD = "#BC9746";
export const WELCOME_MUTED = "#D1D5DB";

export type Bilingual = { fr: string; en: string };

export const VOICE_CONTRACT_CARDS: {
  index: string;
  title: Bilingual;
  body: Bilingual;
}[] = [
  {
    index: "01",
    title: { fr: "Décharge brute en marchant", en: "Raw offload while walking" },
    body: {
      fr: "Pas de formulaires, pas de rapports à taper. Parlez entre deux réunions ou sur le trajet. LOGOS capte la nuance, le ton et la tension.",
      en: "No forms, no reports to type. Speak between meetings or on the move. LOGOS captures nuance, tone, and tension.",
    },
  },
  {
    index: "02",
    title: { fr: "Zéro complaisance thérapeutique", en: "Zero therapeutic complacency" },
    body: {
      fr: "LOGOS ne vous flatte pas. Il n'a aucun plan de carrière à protéger. C'est un miroir socratique qui coupe court à vos justifications d'évitement.",
      en: "LOGOS doesn't flatter you. It has no career path to protect. A Socratic mirror that cuts through avoidance rationalizations.",
    },
  },
  {
    index: "03",
    title: { fr: "Effet Cockpit en temps réel", en: "Real-time cockpit effect" },
    body: {
      fr: "Pendant que vous parlez, LOGOS commande votre exocortex : il met en quarantaine un contact toxique sur le People Board 3D et consigne l'arbitrage P1 dans votre registre.",
      en: "As you speak, LOGOS drives your exocortex: quarantine a toxic contact on the 3D People Board and log P1 arbitration in your registry.",
    },
  },
];

export const VALUE_MATRIX_ROWS: {
  criterion: Bilingual;
  board: Bilingual;
  coach: Bilingual;
  logos: Bilingual;
}[] = [
  {
    criterion: { fr: "Coût annuel constaté", en: "Observed annual cost" },
    board: { fr: "20 000 € à 60 000 € + dilution de capital", en: "€20,000–€60,000 + equity dilution" },
    coach: { fr: "18 000 € à 45 000 € (350 € à 1 500 € / h)", en: "€18,000–€45,000 (€350–€1,500 / h)" },
    logos: { fr: "Dès 35 € / mois ou 350 € à vie", en: "From €35 / month or €350 lifetime" },
  },
  {
    criterion: { fr: "Disponibilité", en: "Availability" },
    board: { fr: "1 fois par trimestre", en: "Once per quarter" },
    coach: { fr: "Sur rendez-vous (J+7)", en: "By appointment (D+7)" },
    logos: { fr: "Immédiat, 24h/24, en marchant", en: "Immediate, 24/7, on the move" },
  },
  {
    criterion: { fr: "Posture", en: "Posture" },
    board: {
      fr: "Politique & protectrice des intérêts d'actionnaires",
      en: "Political & protective of shareholder interests",
    },
    coach: { fr: "Thérapeutique & complaisante", en: "Therapeutic & accommodating" },
    logos: { fr: "Sparring socratique chirurgical sans filtre", en: "Unfiltered surgical Socratic sparring" },
  },
  {
    criterion: { fr: "Confidentialité", en: "Confidentiality" },
    board: { fr: "Risque réputationnel immédiat", en: "Immediate reputational risk" },
    coach: { fr: "Facteur humain non confiné", en: "Human factor not confined" },
    logos: {
      fr: "Chiffrement privé étanche sur serveur dédié",
      en: "Air-tight private encryption on dedicated server",
    },
  },
];

export const QUIZ_REVELATIONS: Bilingual[] = [
  {
    fr: "Votre Triade Dominante : Souverain, Guerrier ou Sage (votre levier naturel de pouvoir).",
    en: "Your Dominant Triad: Sovereign, Warrior, or Sage (your natural lever of power).",
  },
  {
    fr: "Votre Conseil de l'Ombre : La peur inconsciente qui dicte vos hésitations sous haute pression.",
    en: "Your Shadow Council: The unconscious fear behind your hesitations under pressure.",
  },
  {
    fr: "Vos Gardiens de Survie : Les automatismes réflexes qui fatiguent vos équipes.",
    en: "Your Survival Guards: Reflex habits that exhaust your teams.",
  },
];

export const QUICK_TOOLS: { label: Bilingual; href: string }[] = [
  {
    label: {
      fr: "Simulateur de coût d'un conflit d'associés",
      en: "Partner conflict cost simulator",
    },
    href: "/tools/decision-bias-reframe-tool/run",
  },
  {
    label: {
      fr: "Audit de perte financière du coaching",
      en: "Executive coaching cost audit",
    },
    href: "/tools/executive-coaching-cost-calculator/run",
  },
  {
    label: {
      fr: "Calculateur de fatigue décisionnelle",
      en: "Decision fatigue calculator",
    },
    href: "/tools/ceo-decision-fatigue-index/run",
  },
  {
    label: {
      fr: "Test d'exposition des données aux LLMs publics",
      en: "Public LLM data exposure test",
    },
    href: "/tools/cloud-ai-privacy-risk-checker/run",
  },
  {
    label: {
      fr: "Évaluateur de burnout du fondateur",
      en: "Founder burnout evaluator",
    },
    href: "/tools/executive-context-switching-calculator/run",
  },
];

export const PRICING_TIERS: {
  id: string;
  name: Bilingual;
  price: string;
  period: Bilingual;
  recommended?: boolean;
  features: Bilingual[];
  cta: Bilingual;
}[] = [
  {
    id: "aegis_solo_monthly",
    name: { fr: "AEGIS Solo", en: "AEGIS Solo" },
    price: "35 €",
    period: { fr: "/ mois", en: "/ month" },
    features: [
      {
        fr: "Dashboard exécutif & People Board 3D",
        en: "Executive dashboard & 3D People Board",
      },
      { fr: "Registre formel des décisions P1 à P5", en: "Formal P1–P5 decision registry" },
      {
        fr: "Suivi des routines & cadences bio-exécutives",
        en: "Bio-executive routines & cadence tracking",
      },
      { fr: "3 lots de prompts quotidiens (08h, 12h, 18h)", en: "3 daily prompt batches (8am, noon, 6pm)" },
    ],
    cta: { fr: "Commencer en Solo", en: "Start Solo" },
  },
  {
    id: "aegis_solo_logos_monthly",
    name: { fr: "AEGIS + LOGOS", en: "AEGIS + LOGOS" },
    price: "110 €",
    period: { fr: "/ mois", en: "/ month" },
    recommended: true,
    features: [
      { fr: "Tout le cockpit AEGIS Solo", en: "Full AEGIS Solo cockpit" },
      { fr: "Sparring vocal illimité avec LOGOS (sub-seconde)", en: "Unlimited LOGOS vocal sparring (sub-second)" },
      { fr: "Pilotage de l'écran en direct par la voix", en: "Voice-driven on-screen control" },
      { fr: "La Grande Lecture de 45 min offerte à l'onboarding", en: "45-min Grand Reading included at onboarding" },
    ],
    cta: { fr: "Déployer LOGOS", en: "Deploy LOGOS" },
  },
  {
    id: "aegis_founders_lifetime",
    name: { fr: "Cohorte Fondateurs", en: "Founders Cohort" },
    price: "350 €",
    period: { fr: "paiement unique à vie", en: "one-time lifetime" },
    features: [
      { fr: "Accès perpétuel complet au cockpit AEGIS", en: "Perpetual full AEGIS cockpit access" },
      { fr: "Pack vocal de bienvenue LOGOS (30 min)", en: "LOGOS welcome voice pack (30 min)" },
      {
        fr: "Sauvegardes chiffrées & priorité absolue sur les modèles",
        en: "Encrypted backups & top model priority",
      },
      {
        fr: "Garantie Sérénité 30 jours intégralement remboursée",
        en: "30-day serenity guarantee — full refund",
      },
    ],
    cta: { fr: "Rejoindre la cohorte", en: "Join the cohort" },
  },
];

export const FAQ_SOVEREIGN: { q: Bilingual; a: Bilingual }[] = [
  {
    q: {
      fr: "Comment mes secrets d'affaires sont-ils protégés ?",
      en: "How are my business secrets protected?",
    },
    a: {
      fr: "Vos données résident dans un Vault privé chiffré au repos et en transit. Zéro revente, zéro entraînement sur des modèles publics.",
      en: "Your data lives in a private Vault encrypted at rest and in transit. No resale, no training on public models.",
    },
  },
  {
    q: {
      fr: "Pourquoi n'y a-t-il aucun document à importer ?",
      en: "Why is there nothing to import?",
    },
    a: {
      fr: "Parce que la vérité d'une entreprise ne se trouve pas dans des diapositives aseptisées, mais dans les arbitrages bruts que vous formulez à l'oral.",
      en: "Because a company's truth isn't in sanitized slides — it's in the raw arbitrations you speak aloud.",
    },
  },
  {
    q: {
      fr: "Que se passe-t-il après le questionnaire des 30 questions ?",
      en: "What happens after the 30-question assessment?",
    },
    a: {
      fr: "Vous obtenez immédiatement la cartographie de votre triade archétypale et pouvez débloquer votre séance de débriefing vocal de 45 minutes avec LOGOS.",
      en: "You immediately get your archetypal triad map and can unlock a 45-minute vocal debrief with LOGOS.",
    },
  },
  {
    q: {
      fr: "Comment fonctionne la garantie satisfait ou remboursé ?",
      en: "How does the satisfaction guarantee work?",
    },
    a: {
      fr: "Si après 30 jours vous n'avez pas gagné en clarté et en vélocité décisionnelle, un simple message déclenche le remboursement intégral de votre paiement, sans justification demandée.",
      en: "If after 30 days you haven't gained clarity and decision velocity, one message triggers a full refund — no justification required.",
    },
  },
];