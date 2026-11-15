import type { ToolFaqItem, ToolSeoMeta } from "./types";

export type ToolId =
  | "executive-coaching-cost-calculator"
  | "peer-network-roi-calculator"
  | "second-brain-waste-audit"
  | "cloud-ai-privacy-risk-checker"
  | "executive-saas-runrate-calculator";

export interface ToolRegistryEntry {
  id: ToolId;
  path: `/tools/${ToolId}`;
  title: string;
  shortDescription: string;
  hubBlurb: string;
  seo: ToolSeoMeta;
  faq: ToolFaqItem[];
  webAppName: string;
}

export const TOOLS_REGISTRY: ToolRegistryEntry[] = [
  {
    id: "executive-coaching-cost-calculator",
    path: "/tools/executive-coaching-cost-calculator",
    title: "Calculateur du coût d'un coaching dirigeant",
    shortDescription:
      "Tarif horaire, fréquence et séniorité : visualisez le coût annuel réel et le prix de chaque heure d'arbitrage.",
    hubBlurb: "500 € à 1 500 €/h — quel est votre vrai run-rate annuel ?",
    webAppName: "Executive Coaching Cost Calculator",
    seo: {
      title: "Executive Coaching Cost Calculator (2026) | True Hourly Rates & ROI",
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
      title: "YPO & Vistage Cost vs ROI Calculator | The True Executive Price",
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
      title: "Second Brain Waste Audit | Is Your Notion a Note Graveyard?",
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
      title: "Executive Cloud AI Privacy Risk Checker | ComEx Data Exposure",
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
      title: "Executive Tech Stack Run-Rate Calculator | Optimize Leadership Tools",
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
];

export function getToolById(id: ToolId): ToolRegistryEntry {
  const entry = TOOLS_REGISTRY.find((t) => t.id === id);
  if (!entry) throw new Error(`Unknown tool id: ${id}`);
  return entry;
}

export function getOtherTools(currentId: ToolId): ToolRegistryEntry[] {
  return TOOLS_REGISTRY.filter((t) => t.id !== currentId);
}