/**
 * Fiche thérapeutique BQC — Moricoli & Bergagnini (2016).
 * Usage : UI, protocoles, a11y — pas pour le placement 3D (voir dienChanBqcCoordinates).
 */

import { POINT_TO_ZONES, type DienChanZoneId } from "./dienChanFaceZones";

export type BqcStimulationSide = "midline" | "bilateral" | "left_only" | "right_only";

export type BqcPointCatalogEntry = {
  bookGrid: string;
  anatomicalLogic: string;
  primaryEffects: string;
  systemOrgan: string;
  page: number;
  side?: BqcStimulationSide;
  contraindicatedPregnancy?: boolean;
};

/** Protocoles de base : gestuelle par point (séquence livre). */
export const PROTOCOL_POINT_TECHNIQUES: Record<string, Partial<Record<number, string>>> = {
  relax: {
    124: "Mouvements horizontaux aller-retour sur le front supérieur.",
    34: "Suivre toute la longueur de l’arcade sourcilière (bord interne).",
    26: "Petites rotations entre les sourcils (glabella).",
    0: "Mouvement vertical descendant devant l’oreille (obligatoire en relaxation).",
  },
  tonify: {
    127: "Tapotement ou travail rotatoire sur le creux mentonnier.",
    19: "Tapotement ou rotation sous le nez (philtrum haut).",
    103: "Tapotement ou rotation au milieu du front.",
    126: "Tapotement ou rotation à la naissance des cheveux (milieu).",
    0: "Mouvement vertical ascendant devant l’oreille (tonification).",
  },
  base_points: {
    61: "Bilatéral — sécrétion d’endorphines, analgésie.",
    39: "Uniquement côté gauche du sujet (estomac).",
    37: "Uniquement côté gauche du sujet (rate / circulation).",
    50: "Uniquement côté droit du sujet (foie).",
    38: "Bilatéral — angles du côlon.",
    17: "Bilatéral — commissures labiales (surrénales).",
  },
};

const CATALOG: Record<number, BqcPointCatalogEntry> = {
  0: {
    bookGrid: "P-Q VII",
    anatomicalLogic: "Devant l’oreille (pré-tragus), aligné point 0.",
    primaryEffects: "Régule l’homéostasie générale du système nerveux.",
    systemOrgan: "Système nerveux",
    page: 105,
    side: "bilateral",
  },
  1: {
    bookGrid: "O VII",
    anatomicalLogic: "Os nasal inférieur (axe médian).",
    primaryEffects: "Soulage les douleurs lombaires ; antipyrétique.",
    systemOrgan: "Dos / lombaires",
    page: 105,
    side: "midline",
  },
  3: {
    bookGrid: "G VII-VIII",
    anatomicalLogic: "Mi-joue, niveau du nez.",
    primaryEffects: "Régule les sécrétions pulmonaires ; analgésique.",
    systemOrgan: "Respiratoire",
    page: 105,
    side: "bilateral",
  },
  5: {
    bookGrid: "D VIII",
    anatomicalLogic: "Aile du nez latérale.",
    primaryEffects: "Modère la réponse sciatique / fessière.",
    systemOrgan: "Musculo-squelettique",
    page: 106,
    side: "bilateral",
  },
  7: {
    bookGrid: "B IX",
    anatomicalLogic: "Lèvre supérieure / narine.",
    primaryEffects: "Régule la sécrétion des hormones sexuelles.",
    systemOrgan: "Endocrinien",
    page: 106,
    side: "midline",
  },
  8: {
    bookGrid: "O V",
    anatomicalLogic: "Pont nasal (dos du nez).",
    primaryEffects: "Régule le rythme cardiaque ; antipyrétique.",
    systemOrgan: "Cardiovasculaire",
    page: 106,
    side: "midline",
  },
  12: {
    bookGrid: "B V",
    anatomicalLogic: "Pont nasal supérieur.",
    primaryEffects: "Régule thyroïde / parathyroïde.",
    systemOrgan: "Endocrinien",
    page: 107,
    side: "bilateral",
  },
  14: {
    bookGrid: "P-Q VIII-IX",
    anatomicalLogic: "Sous le lobe de l’oreille.",
    primaryEffects: "Stimule la salivation ; analgésique.",
    systemOrgan: "Digestif",
    page: 107,
    side: "bilateral",
  },
  16: {
    bookGrid: "P-Q V",
    anatomicalLogic: "Attache supérieure de l’oreille.",
    primaryEffects: "Vasoconstriction ; facilite l’hémostase.",
    systemOrgan: "Sensoriel",
    page: 108,
    side: "bilateral",
  },
  17: {
    bookGrid: "E IX",
    anatomicalLogic: "Commissure labiale (coin de la bouche).",
    primaryEffects: "Stimule la réponse surrénalienne ; anti-allergique.",
    systemOrgan: "Endocrinien",
    page: 108,
    side: "bilateral",
  },
  19: {
    bookGrid: "O VIII-IX",
    anatomicalLogic: "Sous le nez (haut du philtrum).",
    primaryEffects: "Réanimation ; régule la fréquence respiratoire.",
    systemOrgan: "Nerveux / respiratoire",
    page: 109,
    side: "midline",
    contraindicatedPregnancy: true,
  },
  20: {
    bookGrid: "A V",
    anatomicalLogic: "Pont nasal (latéral).",
    primaryEffects: "Anti-inflammatoire ; analgésique.",
    systemOrgan: "Sensoriel",
    page: 109,
    side: "bilateral",
  },
  22: {
    bookGrid: "O XI-XII",
    anatomicalLogic: "Menton inférieur (latéral).",
    primaryEffects: "Régule le tonus vésical.",
    systemOrgan: "Urinaire",
    page: 110,
    side: "bilateral",
  },
  26: {
    bookGrid: "O IV",
    anatomicalLogic: "Entre les sourcils (glabella).",
    primaryEffects: "Module la réponse parasympathique.",
    systemOrgan: "Nerveux",
    page: 110,
    side: "midline",
  },
  29: {
    bookGrid: "E-G X",
    anatomicalLogic: "Courbe menton / mâchoire.",
    primaryEffects: "Diurétique ; hypotenseur.",
    systemOrgan: "Urinaire",
    page: 111,
    side: "bilateral",
  },
  34: {
    bookGrid: "C-D III-IV",
    anatomicalLogic: "Bord interne du sourcil.",
    primaryEffects: "Régule la réponse du nerf optique.",
    systemOrgan: "Nerveux / sensoriel",
    page: 111,
    side: "bilateral",
  },
  37: {
    bookGrid: "G VIII (G)",
    anatomicalLogic: "Joue gauche du sujet (milieu).",
    primaryEffects: "Favorise la circulation ; tonique rate.",
    systemOrgan: "Digestif",
    page: 112,
    side: "left_only",
  },
  38: {
    bookGrid: "G IX",
    anatomicalLogic: "Sillon naso-génien (milieu).",
    primaryEffects: "Favorise la sécrétion d’antibiotiques naturels.",
    systemOrgan: "Immunitaire",
    page: 112,
    side: "bilateral",
  },
  39: {
    bookGrid: "E-G VIII-IX",
    anatomicalLogic: "Naso-génien gauche du sujet (haut).",
    primaryEffects: "Régule la sécrétion gastrique.",
    systemOrgan: "Digestif",
    page: 113,
    side: "left_only",
  },
  41: {
    bookGrid: "H VIII-IX",
    anatomicalLogic: "Joue droite du sujet (latéral).",
    primaryEffects: "Régule le métabolisme du cholestérol.",
    systemOrgan: "Vésicule biliaire",
    page: 113,
    side: "right_only",
  },
  43: {
    bookGrid: "O VII-VIII",
    anatomicalLogic: "Apex nasal.",
    primaryEffects: "Agit sur les calculs rénaux.",
    systemOrgan: "Urinaire",
    page: 114,
    side: "midline",
  },
  45: {
    bookGrid: "B VII-VIII",
    anatomicalLogic: "Pont nasal (milieu).",
    primaryEffects: "Tonifie l’énergie rénale ancestrale.",
    systemOrgan: "Urinaire",
    page: 114,
    side: "midline",
  },
  50: {
    bookGrid: "G VIII-IX",
    anatomicalLogic: "Joue droite du sujet (milieu).",
    primaryEffects: "Renforce la détoxification hépatique.",
    systemOrgan: "Foie",
    page: 115,
    side: "right_only",
  },
  57: {
    bookGrid: "P-Q V-VI",
    anatomicalLogic: "Joue gauche (devant l’oreille).",
    primaryEffects: "Diminue la pression artérielle ; ralentit le cœur.",
    systemOrgan: "Cardiovasculaire",
    page: 115,
    side: "left_only",
  },
  60: {
    bookGrid: "M VI",
    anatomicalLogic: "Orbite latérale de l’œil.",
    primaryEffects: "Régule la transpiration lymphatique.",
    systemOrgan: "Respiratoire",
    page: 116,
    side: "bilateral",
  },
  61: {
    bookGrid: "D VII-VIII",
    anatomicalLogic: "Alvéole nasale (narine).",
    primaryEffects: "Sécrétion d’endorphines ; analgésie.",
    systemOrgan: "Nerveux / immunitaire",
    page: 116,
    side: "bilateral",
  },
  63: {
    bookGrid: "O IX",
    anatomicalLogic: "Centre du philtrum.",
    primaryEffects: "Favorise la progestérone ; tonique utérin.",
    systemOrgan: "Endocrinien / reproduction",
    page: 117,
    side: "midline",
  },
  64: {
    bookGrid: "D VIII-IX",
    anatomicalLogic: "Aile du nez inférieure.",
    primaryEffects: "Détoxifie le bassin pelvien.",
    systemOrgan: "Lymphatique",
    page: 117,
    side: "bilateral",
  },
  73: {
    bookGrid: "G VI",
    anatomicalLogic: "Bord inférieur de l’orbite.",
    primaryEffects: "Stimule glandes mammaires / ovaires.",
    systemOrgan: "Reproductif",
    page: 118,
    side: "bilateral",
  },
  74: {
    bookGrid: "D-E VIII",
    anatomicalLogic: "Naso-génien (bas).",
    primaryEffects: "Tonifie tendons de la cuisse et aine.",
    systemOrgan: "Musculo-squelettique",
    page: 118,
    side: "bilateral",
  },
  85: {
    bookGrid: "E X-XI",
    anatomicalLogic: "Menton (latéral).",
    primaryEffects: "Diurétique ; analgésique urétéral.",
    systemOrgan: "Urinaire",
    page: 119,
    side: "bilateral",
  },
  87: {
    bookGrid: "D XII",
    anatomicalLogic: "Centre du menton.",
    primaryEffects: "Provoque contraction vésicale / utérine.",
    systemOrgan: "Urinaire / reproduction",
    page: 119,
    side: "midline",
  },
  98: {
    bookGrid: "H-K III-IV",
    anatomicalLogic: "Front (latéral).",
    primaryEffects: "Améliore la fonction de l’intestin grêle.",
    systemOrgan: "Digestif",
    page: 120,
    side: "bilateral",
  },
  103: {
    bookGrid: "O II",
    anatomicalLogic: "Milieu du front.",
    primaryEffects: "Améliore la concentration cognitive.",
    systemOrgan: "Nerveux (pinéale)",
    page: 120,
    side: "midline",
  },
  106: {
    bookGrid: "—",
    anatomicalLogic: "Front (repère intermédiaire, protocole maux de tête).",
    primaryEffects: "Complète la ligne frontale du protocole céphalées.",
    systemOrgan: "Nerveux",
    page: 120,
    side: "midline",
  },
  113: {
    bookGrid: "D IX",
    anatomicalLogic: "Lèvre supérieure (latéral).",
    primaryEffects: "Renforce les défenses immunes ; tonique pancréas.",
    systemOrgan: "Endocrinien",
    page: 121,
    side: "bilateral",
  },
  124: {
    bookGrid: "H II",
    anatomicalLogic: "Front supérieur.",
    primaryEffects: "Régule les flux hépatique et gastrique.",
    systemOrgan: "Nerveux",
    page: 121,
    side: "bilateral",
  },
  126: {
    bookGrid: "O 0",
    anatomicalLogic: "Centre de la ligne des cheveux.",
    primaryEffects: "Tonique général ; augmente la pression énergétique.",
    systemOrgan: "Nerveux",
    page: 122,
    side: "midline",
  },
  127: {
    bookGrid: "O XI",
    anatomicalLogic: "Creux mentonnier (mentalis).",
    primaryEffects: "Régule le transit intestinal.",
    systemOrgan: "Digestif",
    page: 122,
    side: "midline",
  },
  143: {
    bookGrid: "Naso",
    anatomicalLogic: "Bout du nez.",
    primaryEffects: "Antipyrétique ; soulage douleur coccygienne.",
    systemOrgan: "Musculo-squelettique",
    page: 123,
    side: "midline",
  },
  156: {
    bookGrid: "D XI-XII",
    anatomicalLogic: "Courbe de la mâchoire.",
    primaryEffects: "Régule les cycles menstruels.",
    systemOrgan: "Reproductif",
    page: 123,
    side: "bilateral",
  },
  173: {
    bookGrid: "O VIII",
    anatomicalLogic: "Apex nasal inférieur.",
    primaryEffects: "Soulage douleur coccygienne.",
    systemOrgan: "Musculo-squelettique",
    page: 124,
    side: "midline",
  },
  184: {
    bookGrid: "B VI-VII",
    anatomicalLogic: "Pont nasal (milieu).",
    primaryEffects: "Régule la sécrétion biliaire.",
    systemOrgan: "Digestif",
    page: 125,
    side: "midline",
  },
  197: {
    bookGrid: "C",
    anatomicalLogic: "Front (partie haute).",
    primaryEffects: "Soulage douleur du genou.",
    systemOrgan: "Musculo-squelettique",
    page: 125,
    side: "bilateral",
  },
  222: {
    bookGrid: "G X",
    anatomicalLogic: "Creux du menton (latéral).",
    primaryEffects: "Module douleur poplitée.",
    systemOrgan: "Urinaire",
    page: 126,
    side: "bilateral",
  },
  233: {
    bookGrid: "GH VIII",
    anatomicalLogic: "Joue droite (bas).",
    primaryEffects: "Régule la fonction hépatique.",
    systemOrgan: "Foie",
    page: 126,
    side: "right_only",
  },
  300: {
    bookGrid: "E I",
    anatomicalLogic: "Ligne des cheveux (latéral).",
    primaryEffects: "Tonifie reins et libido.",
    systemOrgan: "Urinaire",
    page: 127,
    side: "bilateral",
  },
  342: {
    bookGrid: "O-I",
    anatomicalLogic: "Coin supérieur du front.",
    primaryEffects: "Module douleur lombaire d’origine rénale.",
    systemOrgan: "Urinaire",
    page: 127,
    side: "bilateral",
  },
  365: {
    bookGrid: "O XII-XIII",
    anatomicalLogic: "Menton le plus bas (centre).",
    primaryEffects: "Augmente l’énergie systémique ; tonique anal.",
    systemOrgan: "Digestif",
    page: 128,
    side: "midline",
  },
  491: {
    bookGrid: "D VI-VII",
    anatomicalLogic: "Racine nasale (haut).",
    primaryEffects: "Débouche le nez ; clarifie la vision sensorielle.",
    systemOrgan: "Nerveux / sensoriel",
    page: 128,
    side: "midline",
  },
};

export function getBqcPointCatalogEntry(pointId: number): BqcPointCatalogEntry | null {
  return CATALOG[pointId] ?? null;
}

export function getPointReflexZoneIds(pointId: number): DienChanZoneId[] {
  return POINT_TO_ZONES[pointId] ?? [];
}

export function formatStimulationSide(side: BqcStimulationSide): string {
  switch (side) {
    case "midline":
      return "Ligne médiane";
    case "bilateral":
      return "Bilatéral";
    case "left_only":
      return "Côté gauche du sujet uniquement";
    case "right_only":
      return "Côté droit du sujet uniquement";
  }
}

export function getProtocolPointTechnique(protocolId: string, pointId: number): string | null {
  return PROTOCOL_POINT_TECHNIQUES[protocolId]?.[pointId] ?? null;
}

export type BqcPointInsight = {
  pointId: number;
  entry: BqcPointCatalogEntry;
  technique: string | null;
  reflexZones: DienChanZoneId[];
};

export function buildBqcPointInsight(
  pointId: number,
  protocolId?: string,
): BqcPointInsight | null {
  const entry = getBqcPointCatalogEntry(pointId);
  if (!entry) return null;
  return {
    pointId,
    entry,
    technique: protocolId ? getProtocolPointTechnique(protocolId, pointId) : null,
    reflexZones: getPointReflexZoneIds(pointId),
  };
}

/** Une ligne courte pour la barre de lecture sur le stage. */
export function summarizePointForStage(pointId: number, protocolId?: string): string | null {
  const insight = buildBqcPointInsight(pointId, protocolId);
  if (!insight) return null;
  const parts: string[] = [insight.entry.primaryEffects];
  if (insight.technique) parts.push(insight.technique);
  return parts.join(" · ");
}
