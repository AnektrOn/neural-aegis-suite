import type { ToolGuide } from "./types";

export const TOOL_GUIDES = {
  "executive-coaching-cost-calculator": {
    plainExplain:
      "Vous payez peut‑être un coach exécutif sans avoir jamais additionné le vrai coût annuel : tarif horaire × nombre de séances × années. Cet outil vous donne un chiffre clair, pas une brochure marketing.",
    bestFor: "CEO ou dirigeant qui a (ou envisage) un accompagnement personnel payant à l'heure.",
    durationLabel: "2 min",
    questionCount: 3,
    prepareWhat: "Une idée de votre tarif horaire coach, combien de fois vous vous voyez par mois, et depuis combien de temps.",
    outcomes: [
      "Coût annuel total et coût par heure d'arbitrage accompagné",
      "Comparaison implicite avec un outil qui garde le contexte entre les séances",
    ],
    example: "Coach à 800 €/h, 2×/mois → souvent 19 000 €+ / an avant déplacements.",
  },
  "peer-network-roi-calculator": {
    plainExplain:
      "YPO, EO, Vistage… la cotisation n'est que la partie visible. Il faut aussi compter les heures de réunion, les vols, et le fait que vous ne faites pas autre chose pendant ce temps‑là.",
    bestFor: "Membre ou candidat d'un cercle de pairs qui veut voir le prix complet (argent + temps).",
    durationLabel: "3 min",
    questionCount: 4,
    prepareWhat: "Cotisation annuelle, heures/mois en réunions + trajets, et votre valeur horaire.",
    outcomes: [
      "Coût financier + coût d'opportunité du dirigeant",
      "ROI « temps investi » pour relancer la conversation avec le groupe",
    ],
    example: "15 k€ de cotisation + 12 h/mois de réunions à 400 €/h ≈ 70 k€+ de coût réel annuel.",
  },
  "second-brain-waste-audit": {
    plainExplain:
      "Notion, Obsidian, Apple Notes… Si vous capturez beaucoup mais ne retrouvez rien en moins de 30 secondes, vous entretenez un « cimetière de notes », pas un second brain.",
    bestFor: "Fondateur qui sent que son système de notes ne sert plus à décider.",
    durationLabel: "3 min",
    questionCount: 4,
    prepareWhat: "Estimation honnête : combien de notes/mois, combien vous relisez, temps de classement.",
    outcomes: [
      "Pourcentage de notes « mortes » estimé",
      "Heures perdues par an en maintenance passive",
    ],
    example: "40 notes/mois, 20 % relues, 4 h de tagging → index de gaspillage souvent > 50 %.",
  },
  "cloud-ai-privacy-risk-checker": {
    plainExplain:
      "Vous collez peut‑être des comités, contrats ou chiffres dans ChatGPT, Granola ou des transcribeurs cloud. Cet outil liste où vos données sensibles sortent du périmètre que vous contrôlez.",
    bestFor: "CEO, avocat d'affaires, ou DPO qui utilise des IA grand public avec des données stratégiques.",
    durationLabel: "2 min",
    questionCount: 3,
    prepareWhat: "La liste des outils IA / transcription que vous utilisez vraiment (pas ceux « qu'on devrait » utiliser).",
    outcomes: [
      "Score d'exposition ComEx avec niveau de risque",
      "Zones à durcir en priorité (hébergement, rétention)",
    ],
    example: "ChatGPT perso + enregistreur de board sans vault dédié → score souvent en zone orange/rouge.",
  },
  "executive-saas-runrate-calculator": {
    plainExplain:
      "Notion + Claude + Otter + Superhuman + une part de coach… Chaque outil semble petit. Additionnés, ils font une « taxe cognitive » mensuelle et dispersent votre contexte entre des dizaines d'onglets.",
    bestFor: "Dirigeant qui paie 5+ abonnements « productivité » sans vue consolidée.",
    durationLabel: "3 min",
    questionCount: 3,
    prepareWhat: "Cochez ce que vous payez et ajustez les prix si vous êtes en plan annuel ou équipe.",
    outcomes: [
      "Facture mensuelle et annuelle réelle",
      "Indice de dispersion (combien de silos de contexte)",
    ],
    example: "Notion + 2 LLM + transcription + e-mail premium → souvent 150–400 €/mois hors coach.",
  },
  "ceo-decision-fatigue-index": {
    plainExplain:
      "Ce n'est pas un diagnostic médical : c'est un miroir sur vos habitudes de fin de journée. Est‑ce que vous repoussez les gros sujets ? Est‑ce que vous choisissez la solution facile parce que le cerveau est plein ?",
    bestFor: "CEO qui finit la journée épuisé avec encore 3 arbitrages en attente.",
    durationLabel: "2 min",
    questionCount: 4,
    prepareWhat: "Pensez à la semaine écoulée, surtout après 17 h–19 h (pas votre meilleur jour).",
    outcomes: [
      "Indice /100 avec niveau (maîtrisé → critique)",
      "Leviers dominants + lecture personnalisée si profil calibré",
    ],
    example: "Reports souvent le soir + saturation 8/10 → index typique 55–75.",
  },
  "decision-bias-reframe-tool": {
    plainExplain:
      "Vous avez UNE décision qui tourne en boucle dans votre tête. Avant de laisser l'émotion ou la politique interne bloquer le choix, vous passez par trois filtres simples (conseil à un pair, successeur, enjeux divisés par deux).",
    bestFor: "Dirigeant bloqué sur un oui/non stratégique depuis plus d'une semaine.",
    durationLabel: "5 min",
    questionCount: 4,
    prepareWhat: "Formulez mentalement la décision (licenciement, pivot, partenariat…) — vous l'écrirez dans l'outil.",
    outcomes: [
      "Score de clarté après reframe",
      "Synthèse texte « ce que je dirais à un pair » pour archiver",
    ],
    example: "« Remplacer mon CTO » : le filtre pair sort souvent une action plus froide que ce que vous redoutiez.",
  },
  "cost-of-delayed-decision-calculator": {
    plainExplain:
      "Reporter une décision n'est pas gratuit : le burn continue, l'équipe attend, les deals glissent. Ici vous mettez des fourchettes (même approximatives) pour voir le coût d'1 à 3 mois d'inaction.",
    bestFor: "Fondateur qui sait qu'il doit trancher mais repousse « encore un mois ».",
    durationLabel: "3 min",
    questionCount: 4,
    prepareWhat: "Burn mensuel, taille d'équipe en attente, et un ordre de grandeur de revenus ou deals en jeu.",
    outcomes: [
      "Estimation € du report (trésorerie + flottement équipe + opportunités)",
      "Argument chiffré pour forcer la date de décision",
    ],
    example: "80 k€ burn + 12 personnes en attente + 1 mois → souvent 6 chiffres de coût caché.",
  },
  "founder-prioritization-matrix": {
    plainExplain:
      "On vous demande un oui (conférence, partenariat, recrutement…) qui sent bon mais mange votre agenda. Cet outil vous force à dire si c'est aligné avec votre cap — ou si c'est juste urgent pour l'autre.",
    bestFor: "Fondateur noyé sous les sollicitations « opportunités » externes.",
    durationLabel: "3 min",
    questionCount: 3,
    prepareWhat: "Une demande concrète en tête (celle que vous hésitez à accepter cette semaine).",
    outcomes: [
      "Verdict : non / peut‑être / oui avec justification",
      "Rappel de la charge cachée (pas seulement le temps de la réunion)",
    ],
    example: "Podcast « prestigieux » mais hors ICP → alignement faible, verdict non même si ça flatte l'ego.",
  },
  "executive-context-switching-calculator": {
    plainExplain:
      "Entre board, équipe, investisseurs et clients, vous changez de chapeau toute la journée. À chaque fois, il faut des minutes pour retrouver le fil. Multipliez par la semaine : c'est une taxe invisible sur votre agenda.",
    bestFor: "CEO avec 10+ réunions/jour sur des sujets très différents.",
    durationLabel: "3 min",
    questionCount: 4,
    prepareWhat: "Nombre de bascules réalistes + minutes pour « se remettre dans le sujet » + valeur horaire.",
    outcomes: [
      "Heures perdues / semaine et coût annuel",
      "Comparaison à la médiane de votre profil si calibré",
    ],
    example: "14 bascules × 18 min/jour × 5 j → souvent 8 h+ perdues par semaine.",
  },
} as const satisfies Record<string, ToolGuide>;