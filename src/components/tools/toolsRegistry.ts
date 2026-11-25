import type { ToolFaqItem, ToolGuide, ToolSeoMeta } from "./types";
import { TOOL_GUIDES } from "./toolsGuide";

const TOOL_ID_SET = new Set<string>([
  "executive-coaching-cost-calculator",
  "peer-network-roi-calculator",
  "second-brain-waste-audit",
  "cloud-ai-privacy-risk-checker",
  "executive-saas-runrate-calculator",
  "ceo-decision-fatigue-index",
  "decision-bias-reframe-tool",
  "cost-of-delayed-decision-calculator",
  "founder-prioritization-matrix",
  "executive-context-switching-calculator",
]);

export function isToolId(id: string): id is ToolId {
  return TOOL_ID_SET.has(id);
}

export function getToolRunPath(id: ToolId): `/tools/${ToolId}/run` {
  return `/tools/${id}/run`;
}

export type ToolId =
  | "executive-coaching-cost-calculator"
  | "peer-network-roi-calculator"
  | "second-brain-waste-audit"
  | "cloud-ai-privacy-risk-checker"
  | "executive-saas-runrate-calculator"
  | "ceo-decision-fatigue-index"
  | "decision-bias-reframe-tool"
  | "cost-of-delayed-decision-calculator"
  | "founder-prioritization-matrix"
  | "executive-context-switching-calculator";

export interface ToolRegistryEntry {
  id: ToolId;
  path: `/tools/${ToolId}`;
  title: string;
  shortDescription: string;
  hubBlurb: string;
  guide: ToolGuide;
  seo: ToolSeoMeta;
  faq: ToolFaqItem[];
  webAppName: string;
}

type ToolRegistryCore = Omit<ToolRegistryEntry, "guide">;

export const TOOLS_REGISTRY: ToolRegistryCore[] = [
  {
    id: "executive-coaching-cost-calculator",
    path: "/tools/executive-coaching-cost-calculator",
    title: "Calculateur du coût d'un coaching dirigeant",
    shortDescription:
      "Tarif horaire, fréquence et séniorité : visualisez le coût annuel réel et le prix de chaque heure d'arbitrage.",
    hubBlurb: "500 € à 1 500 €/h — quel est votre vrai run-rate annuel ?",
    webAppName: "Executive Coaching Cost Calculator",
    seo: {
      title: "Coût coaching dirigeant : calculateur et ROI | AEGIS",
      description:
        "Calculez le coût réel d'un coaching de dirigeant (500 € à 1 500 €/h) selon votre séniorité et comparez avec la continuité d'un exocortex décisionnel.",
    },
    faq: [
      {
        question: "Combien coûte en moyenne un coaching de dirigeant en 2026 ?",
        answer:
          "Les tarifs horaires varient généralement entre 300 € et 2 000 € selon l'expérience du coach et le niveau de séniorité du client (VP, C-Level, CEO). Une cadence de deux séances par mois représente souvent 24 000 € à 72 000 € par an.",
      },
      {
        question: "Le coaching exécutif est-il déductible pour une entreprise ?",
        answer:
          "Dans de nombreuses juridictions, le développement des dirigeants peut être traité comme une dépense de formation ou de conseil, sous réserve de justification et d'avis fiscal local. Consultez votre expert-comptable pour votre cas.",
      },
      {
        question: "Quelle est l'alternative à un coaching ponctuel pour les arbitrages ?",
        answer:
          "Un exocortex décisionnel conserve le contexte entre les séances : décisions, états, relations et traces d'arbitrage accessibles en continu, ce qui réduit l'amnésie contextuelle entre rendez-vous mensuels.",
      },
    ],
  },
  {
    id: "peer-network-roi-calculator",
    path: "/tools/peer-network-roi-calculator",
    title: "ROI des cercles de pairs (YPO, Vistage, EO)",
    shortDescription:
      "Cotisation + temps de réunion et déplacements = coût réel complet du réseau de dirigeants.",
    hubBlurb: "15 k€–39 k€/an + 150 h : le vrai prix de votre cercle.",
    webAppName: "Peer Network ROI Calculator",
    seo: {
      title: "ROI cercles de pairs (YPO, Vistage, EO) | Coût réel | AEGIS",
      description:
        "Estimez le coût complet des cercles de dirigeants (cotisation 15k$-39k$/an + 150h de réunions obligatoires). Évaluez votre retour sur temps investi.",
    },
    faq: [
      {
        question: "Combien coûte une adhésion YPO ou Vistage par an ?",
        answer:
          "Les cotisations annuelles se situent souvent entre 10 000 € et 40 000 €, auxquelles s'ajoutent les déplacements, événements obligatoires et le coût d'opportunité du temps du dirigeant (réunions, préparation, suivi).",
      },
      {
        question: "Comment mesurer le ROI d'un groupe de pairs ?",
        answer:
          "Comparez le coût financier direct au coût d'opportunité (heures × valeur horaire du dirigeant) et aux décisions concrètes accélérées ou évitées grâce au réseau sur 12 mois.",
      },
      {
        question: "Un réseau de pairs remplace-t-il un système d'aide à la décision ?",
        answer:
          "Les cercles apportent des pairs et de la confrontation ponctuelle. Un système 24/7 conserve votre contexte décisionnel entre les réunions sans dépendre d'un calendrier fixe.",
      },
    ],
  },
  {
    id: "second-brain-waste-audit",
    path: "/tools/second-brain-waste-audit",
    title: "Audit de gaspillage du second brain",
    shortDescription:
      "Quatre questions pour estimer vos notes mortes et les heures perdues en maintenance passive.",
    hubBlurb: "Votre Notion est-il un cimetière de notes ?",
    webAppName: "Second Brain Waste Audit",
    seo: {
      title: "Audit gaspillage second brain | Notes mortes & temps perdu | AEGIS",
      description:
        "Testez l'efficacité de votre second cerveau en 4 questions. Calculez votre taux de notes mortes et le temps perdu en maintenance passive.",
    },
    faq: [
      {
        question: "Qu'est-ce qu'une « note morte » dans un second brain ?",
        answer:
          "Une note créée mais jamais reliée à une décision, une action ou une relecture utile. Elle occupe de l'espace cognitif et du temps de classement sans retour mesurable.",
      },
      {
        question: "Combien de temps perdent les dirigeants à organiser leurs notes ?",
        answer:
          "Selon le volume et l'obsession du tagging, entre 2 et 10 heures par mois peuvent partir en classement passif — souvent plus que le temps passé à exploiter les notes pour arbitrer.",
      },
      {
        question: "Comment passer d'un PKM passif à un exocortex actif ?",
        answer:
          "Relier chaque capture à un arbitrage, un état ou une relation, avec recherche en moins de 30 secondes et synthèses automatiques sur ce qui se répète.",
      },
    ],
  },
  {
    id: "cloud-ai-privacy-risk-checker",
    path: "/tools/cloud-ai-privacy-risk-checker",
    title: "Diagnostic risque confidentialité IA cloud",
    shortDescription:
          "Score d'exposition ComEx selon vos outils IA grand public et la sensibilité de vos données.",
    hubBlurb: "ChatGPT, Rewind, Limitless : où fuient vos secrets ?",
    webAppName: "Executive Cloud AI Privacy Risk Checker",
    seo: {
      title: "Risque confidentialité IA cloud pour dirigeants | AEGIS",
      description:
        "Évaluez le risque de fuite de vos données stratégiques et secrets d'affaires sur les IA cloud grand public (ChatGPT, Rewind, Limitless, Granola).",
    },
    faq: [
      {
        question: "Les offres « Team » de ChatGPT protègent-elles les secrets d'affaires ?",
        answer:
          "Les politiques varient selon le plan et la configuration. Sans contrôle contractuel strict, hébergement dédié et interdiction d'entraînement, des données stratégiques peuvent transiter par des infrastructures partagées.",
      },
      {
        question: "Les enregistreurs de réunion cloud sont-ils risqués pour un ComEx ?",
        answer:
          "Oui lorsqu'ils stockent ou transcrivent litiges, RH, finances ou propriété intellectuelle sur des serveurs tiers sans vault isolé et gouvernance d'accès.",
      },
      {
        question: "Quelle architecture réduit l'exposition des dirigeants ?",
        answer:
          "Un vault chiffré, un modèle sur serveur privé étanche, des politiques de rétention explicites et zéro export vers des modèles publics pour les données sensibles.",
      },
    ],
  },
  {
    id: "executive-saas-runrate-calculator",
    path: "/tools/executive-saas-runrate-calculator",
    title: "Run-rate de la stack produitivité dirigeant",
    shortDescription:
      "Additionnez notes, IA, transcription et coaching : coût de la fragmentation.",
    hubBlurb: "Notion + IA + transcription + coach = quelle facture ?",
    webAppName: "Executive Tech Stack Run-Rate Calculator",
    seo: {
      title: "Run-rate stack produitivité dirigeant | AEGIS",
      description:
        "Additionnez vos abonnements dispersés (notes, assistants IA, transcription, coaching) et visualisez le coût de fragmentation de vos outils.",
    },
    faq: [
      {
        question: "Combien coûte en moyenne la stack d'un dirigeant ?",
        answer:
          "Entre 150 € et 800 € par mois lorsque l'on cumule CRM léger, notes, e-mail premium, transcription, plusieurs LLM et un coaching ponctuel — sans compter le temps de bascule entre applications.",
      },
      {
        question: "Qu'est-ce que l'indice de dispersion de l'information ?",
        answer:
          "Plus vous utilisez d'outils non reliés, plus le contexte décisionnel est éclaté : recherches multiples, doublons et perte de fil entre arbitrages.",
      },
      {
        question: "Unifier sous un exocortex réduit-il la facture ?",
        answer:
          "Souvent oui : un socle unique remplace plusieurs abonnements tout en gardant contexte, synthèses et gouvernance des données au même endroit.",
      },
    ],
  },
  {
    id: "ceo-decision-fatigue-index",
    path: "/tools/ceo-decision-fatigue-index",
    title: "Indice de fatigue décisionnelle CEO",
    shortDescription:
      "Mesurez l'épuisement cognitif en fin de journée : reports, choix par défaut, saturation et brouillard mental.",
    hubBlurb: "Combien d'arbitrages repoussez-vous après 18 h ?",
    webAppName: "CEO Decision Fatigue Index",
    seo: {
      title: "Test fatigue décisionnelle CEO (2026) | Indice dirigeant | AEGIS",
      description:
        "Test gratuit de fatigue décisionnelle pour dirigeants : décisions repoussées, choix par défaut et saturation cognitive en fin de journée.",
    },
    faq: [
      {
        question: "Qu'est-ce que la fatigue décisionnelle chez un CEO ?",
        answer:
          "C'est la baisse de qualité de jugement après une longue série d'arbitrages : on reporte, on choisit par défaut ou on évite les sujets structurants — souvent en fin de journée.",
      },
      {
        question: "Le mental fog du fondateur est-il mesurable ?",
        answer:
          "Des signaux comportementaux (reports, défaut, saturation perçue) permettent un indice relatif et de comparer des semaines, même sans capture biométrique.",
      },
      {
        question: "Comment réduire la charge sans arrêter de décider ?",
        answer:
          "Externaliser le contexte (registre, états, synthèses) libère la mémoire vive pour les arbitrages qui exigent encore votre jugement.",
      },
    ],
  },
  {
    id: "decision-bias-reframe-tool",
    path: "/tools/decision-bias-reframe-tool",
    title: "Détecteur de biais — Friend Reframe",
    shortDescription:
      "Trois filtres d'inversion pour débloquer un arbitrage stratégique figé (pair, successeur, enjeux réduits).",
    hubBlurb: "Que conseilleriez-vous à un pair sur cette décision ?",
    webAppName: "Decision Bias Reframe Tool",
    seo: {
      title: "Débloquer une décision difficile | Friend Reframe dirigeants | AEGIS",
      description:
        "Outil Friend Reframe : trois questions pour débloquer une décision difficile — conseil à un pair, lentille successeur, enjeux divisés par deux.",
    },
    faq: [
      {
        question: "Pourquoi conseiller à un pair aide-t-il à décider ?",
        answer:
          "La distance psychologique réduit l'identification au résultat et fait émerger des options ignorées sous pression ou attachement émotionnel.",
      },
      {
        question: "Qu'est-ce que la lentille « successeur demain matin » ?",
        answer:
          "Imaginer ce que ferait votre remplaçant demain force la clarté sur l'action minimale responsable, sans l'historique émotionnel du poste.",
      },
      {
        question: "Faut-il journaliser après le reframe ?",
        answer:
          "Oui : noter la décision, le contexte et les filtres utilisés permet de mesurer les retombées et d'éviter de re-stucker sur le même schéma.",
      },
    ],
  },
  {
    id: "cost-of-delayed-decision-calculator",
    path: "/tools/cost-of-delayed-decision-calculator",
    title: "Coût de l'inaction et procrastination stratégique",
    shortDescription:
      "Quantifiez trésorerie, opportunités et flottement d'équipe quand un arbitrage glisse de 1 à 3 mois.",
    hubBlurb: "1 à 3 mois de retard : quel est le vrai prix ?",
    webAppName: "Cost of Delayed Decision Calculator",
    seo: {
      title: "Coût de l'inaction & décision repoussée | Calculateur | AEGIS",
      description:
        "Calculez la perte financière et opérationnelle d'une décision repoussée : burn, revenus en jeu, équipe en attente.",
    },
    faq: [
      {
        question: "Comment estimer le coût d'une décision repoussée ?",
        answer:
          "Additionnez le burn supplémentaire, une fraction des revenus ou deals en suspens, et le coût d'opportunité du temps d'équipe bloqué.",
      },
      {
        question: "La procrastination stratégique coûte-t-elle plus qu'une erreur ?",
        answer:
          "Souvent oui à l'échelle de l'entreprise : le flottement consomme du cash, fatigue l'équipe et laisse la place aux concurrents.",
      },
      {
        question: "Comment lever les blocages intérieurs au report ?",
        answer:
          "Un parcours d'onboarding structuré (profil archétypal, traces de décision) nomme les résistances et accélère le passage à l'acte.",
      },
    ],
  },
  {
    id: "founder-prioritization-matrix",
    path: "/tools/founder-prioritization-matrix",
    title: "Matrice « Saying No » fondateur",
    shortDescription:
      "Filtre en trois étapes pour rejeter ou accepter une opportunité sans diluer le cap stratégique.",
    hubBlurb: "Cette sollicitation mérite-t-elle un oui ?",
    webAppName: "Founder Prioritization Matrix",
    seo: {
      title: "Matrice de priorisation fondateur | Dire non | AEGIS",
      description:
        "Générateur de matrice de priorisation : alignement stratégique, charge cachée et verdict dire non / peut-être / oui.",
    },
    faq: [
      {
        question: "Pourquoi les CEOs doivent-ils formaliser le « non » ?",
        answer:
          "Sans filtre explicite, les opportunités rentrantes captent le temps du fondateur et déplacent la stratégie par défaut.",
      },
      {
        question: "Alignement vs urgence : que privilégier ?",
        answer:
          "Un alignement faible doit conduire au rejet même si l'urgence perçue est haute — l'urgence est souvent celle du demandeur, pas du cap.",
      },
      {
        question: "Où piloter ses priorités après le filtre ?",
        answer:
          "Un dashboard qui relie décisions, habitudes et suivi évite que les « oui » orphelins ne reviennent sous une autre forme la semaine suivante.",
      },
    ],
  },
  {
    id: "executive-context-switching-calculator",
    path: "/tools/executive-context-switching-calculator",
    title: "Perte par changement de contexte",
    shortDescription:
      "Heures perdues chaque semaine à reconstituer le fil entre board, investisseurs, équipe et opérationnel.",
    hubBlurb: "Combien coûtent vos bascules de contexte ?",
    webAppName: "Executive Context Switching Calculator",
    seo: {
      title: "Coût du changement de contexte dirigeant | Calculateur | AEGIS",
      description:
        "Calculez les heures perdues en reconstitution mentale entre réunions d'associés, investisseurs et équipes — overload cognitif dirigeant.",
    },
    faq: [
      {
        question: "Combien de temps pour retrouver le contexte après une réunion ?",
        answer:
          "Les études sur le context switching citent souvent 15 à 25 minutes ; pour un dirigeant, le coût monte avec la sensibilité et le nombre de bascules.",
      },
      {
        question: "Qu'est-ce que l'overload cognitif du CEO ?",
        answer:
          "C'est l'empilement de fils décisionnels incompatibles (cap table, produit, RH) sans mémoire externe — chaque switch efface une partie du précédent.",
      },
      {
        question: "Un vault privé réduit-il les pertes ?",
        answer:
          "Consolidé decisionnel : décisions, personnes, états — le contexte est là en secondes au lieu d'être reconstruit de zéro.",
      },
    ],
  },
];

function attachGuide(entry: ToolRegistryCore): ToolRegistryEntry {
  const guide = TOOL_GUIDES[entry.id];
  if (!guide) throw new Error(`Missing guide for tool: ${entry.id}`);
  return { ...entry, guide };
}

export function getToolById(id: ToolId): ToolRegistryEntry {
  const entry = TOOLS_REGISTRY.find((t) => t.id === id);
  if (!entry) throw new Error(`Unknown tool id: ${id}`);
  return attachGuide(entry);
}

export function getAllTools(): ToolRegistryEntry[] {
  return TOOLS_REGISTRY.map(attachGuide);
}

export function getOtherTools(currentId: ToolId, limit = 4): ToolRegistryEntry[] {
  const pool = TOOLS_REGISTRY.filter((t) => t.id !== currentId);
  const start = pool.findIndex((t) => t.id > currentId);
  const rotated = start === -1 ? pool : [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, limit).map(attachGuide);
}