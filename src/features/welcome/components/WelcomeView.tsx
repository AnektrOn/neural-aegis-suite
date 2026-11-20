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
