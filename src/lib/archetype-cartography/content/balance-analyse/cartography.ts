import type { CartographyGuardian, CartographyHouse, CartographyMeta } from "../../types";

export const BALANCE_ANALYSE_META: CartographyMeta = {
  title: "Cartographie Archétypale Intégrale",
  subtitle: "100 Questions · PÔLE BALANCE",
  userLabel: "Utilisateur",
  userValue: "note",
  date: "2026-05-16",
  stage: "Blueprint Alchimique (Synthèse)",
  poleLabel: "BALANCE",
};

export const BALANCE_ANALYSE_HOUSES: CartographyHouse[] = [
  {
    id: 1,
    sign: "♈",
    title: "Maison 1 — Ego & Masque",
    tagline: "L'incarnation lucide.",
    shadow:
      "Méfiance réflexe et retrait protecteur (Saboteur 100% Shadow). Disruption du Soi par peur du changement.",
    light:
      "Autorité naturelle par la présence calme (Souverain/Sage). Observation et syntonisation.",
    balance:
      'Le Saboteur devient le **Gardien de l\'Alignement**. Il n\'empêche plus le changement mais s\'assure qu\'il est "vrai". Le mouvement est : **Retrait Protecteur → Observation Stratégique → Présence Souveraine**.',
  },
  {
    id: 2,
    sign: "♉",
    title: "Maison 2 — Valeurs & Sécurité",
    tagline: "La souveraineté de la valeur.",
    shadow:
      "Intellectualisation excessive du sens (Sage). Risque de déconnexion de la réalité matérielle.",
    light:
      "Sécurité par le non-attachement et la résilience (Guerrier/Prostituée-L). Valeur ancrée dans l'être.",
    balance:
      "**Intégrité Abondante**. Le sujet comprend que sa valeur n'est pas négociable. La sagesse intellectuelle s'incarne dans une gestion matérielle rigoureuse qui sert l'âme.",
  },
  {
    id: 3,
    sign: "♊",
    title: "Maison 3 — Expression & Choix",
    tagline: "Le verbe alchimique.",
    shadow:
      "Parole comme bouclier ou canal de fracture (Guérisseur-Ombre). Risque de contrôle défensif.",
    light:
      "Parole comme instrument de guérison et de clarté (Sage/Guerrier). Nommer sans détruire.",
    balance:
      "**Sagesse Communicante**. La communication cesse d'être une réaction pour devenir une transmission de la quête. Le mouvement est : **Silence Défensif → Parole Thérapeutique → Verbe de Vérité**.",
  },
  {
    id: 4,
    sign: "♋",
    title: "Maison 4 — Racines & Foyer",
    tagline: "Le sanctuaire dynamique.",
    shadow:
      "Ancrage dans l'Invisible (Mystique). Risque d'isolement anachorétique.",
    light:
      "Laboratoire du sens et conversations vraies. Libération des dettes de lignée.",
    balance:
      '**Fondation Sacrée**. Les racines plongent dans le divin pour stabiliser l\'ego dans le monde. Le foyer est l\'espace où la "bilocation" (Ciel/Terre) est maîtrisée.',
  },
  {
    id: 5,
    sign: "♌",
    title: "Maison 5 — Créativité & Joie",
    tagline: "La manifestation responsable.",
    shadow:
      "Paralysie par peur du jugement (Victime 100% Shadow). Joie consommée par l'injustice perçue.",
    light:
      "Acte de canalisation et de gratitude. Enfant libre de rêver grand.",
    balance:
      "**Sensibilité Créative**. La Victime transmutée devient l'antenne des besoins réels, guidant la créativité vers des formes qui servent la guérison collective.",
  },
  {
    id: 6,
    sign: "♍",
    title: "Maison 6 — Travail & Santé",
    tagline: "Le corps terminal.",
    shadow:
      "Somatisation par défaut. Le corps encaisse les sabotages des autres maisons (vide archétypal).",
    light:
      "Le corps comme canal sacré de l'énergie. Priorité à la santé vibratoire.",
    balance:
      "**Présence Intégrale**. Le corps n'est plus un dépotoir mais un **Langage Morphique**. Chaque tension est écoutée comme un message de réalignement immédiat.",
  },
  {
    id: 7,
    sign: "♎",
    title: "Maison 7 — Relations & Partenariats",
    tagline: "L'alliance des souverains.",
    shadow:
      "Sauvetage sacrificiel (Sauveur-Ombre). Création de dépendances pour se valoriser.",
    light:
      "Dojo de croissance mutuelle. Partenariat fondé sur la vérité.",
    balance:
      '**Partenariat de Croissance**. Sortie du contrat de "sauveur" pour entrer dans la reconnaissance de la souveraineté de l\'autre. Le soin libère au lieu de lier.',
  },
  {
    id: 8,
    sign: "♏",
    title: "Maison 8 — Ressources Partagées",
    tagline: "Le creuset de la foi.",
    shadow:
      "Négociation de l'intégrité face à la survie (Prostituée-Shadow). Peur de la dette.",
    light:
      "Fusion au service de l'invisible. Garde de la foi radicale.",
    balance:
      "**Négociation de l'Esprit**. Utiliser les ressources partagées pour amplifier la mission sans jamais compromettre l'âme. La foi transmute la dette en capital spirituel.",
  },
  {
    id: 9,
    sign: "♐",
    title: "Maison 9 — Spiritualité & Quête",
    tagline: "L'exégèse incarnée.",
    shadow:
      "Séparation entre le sacré et le matériel (Sage/Prostituée). Intellectualisation de la foi.",
    light:
      "Construction d'une voie propre (Explorateur). Traduction en pratique.",
    balance:
      "**Spiritualité Opérationnelle**. La quête de sens nourrit directement l'action sociale (M10). Le Sage transmute la théorie en Loi de Vie.",
  },
  {
    id: 10,
    sign: "♑",
    title: "Maison 10 — Vocation & Statut",
    tagline: "Le trône du service.",
    shadow:
      "Autorité entre protection et contrôle défensif. Peur de l'exposition.",
    light:
      'Vocation de "Phare". Acceptation de l\'impact et de la responsabilité.',
    balance:
      "**Obéissance au Mandat**. Le Souverain manifeste la révélation du Mystique. Le pouvoir est un service rendu au Grand Œuvre, exercé avec élégance.",
  },
  {
    id: 11,
    sign: "♒",
    title: "Maison 11 — Communauté & Futur",
    tagline: "Le catalyseur morphique.",
    shadow:
      "Humour comme arme de distance (Jester-Ombre). Moquerie protectrice.",
    light:
      "Action dans l'invisible. Clown sacré disant des vérités nécessaires.",
    balance:
      "**Résonance Collective**. Utiliser l'humour et la stratégie (Magicien) pour fluidifier le champ social sans sacrifier l'intimité.",
  },
  {
    id: 12,
    sign: "♓",
    title: "Maison 12 — Inconscient & Karma",
    tagline: "La reddition souveraine.",
    shadow:
      "Risque de schizophrénie spirituelle ou de retrait passif (Mystique).",
    light:
      "Canal de révélation pur. Abandon total au flux de la vie.",
    balance:
      "**Canal Radieux**. L'inconscient est une boussole de précision. Le sujet est un terminal où le Sacré s'incarne avec rigueur.",
  },
];

export const BALANCE_ANALYSE_GUARDIANS: CartographyGuardian[] = [
  {
    name: "Saboteur",
    shadow: "Disruption identitaire",
    light: "Gardien du Choix",
    balance: "Vigilance d'Alignement",
  },
  {
    name: "Victime",
    shadow: "Paralysie créative",
    light: "Boussole de Sensibilité",
    balance: "Responsabilité Émotionnelle",
  },
  {
    name: "Prostituée",
    shadow: "Négociation d'âme",
    light: "Gardienne de la Foi",
    balance: "Intégrité Abondante",
  },
  {
    name: "Enfant",
    shadow: "Rêveur orphelin",
    light: "Éternel Apprenti",
    balance: "Créativité Curieuse",
  },
];
