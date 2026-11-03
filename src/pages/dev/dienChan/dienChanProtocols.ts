import type { DienChanProtocol } from "./DienChanProtocolPanels";

export const DIEN_CHAN_PROTOCOLS: DienChanProtocol[] = [
  {
    id: "relax",
    category: "Protocoles de Base",
    name: "Relaxation du Système Nerveux",
    description:
      'Protocole essentiel à effectuer avant de traiter une zone spécifique. Vise à éliminer les "barrages" pour rétablir la circulation énergétique.',
    points: [124, 34, 26, 0],
    zones: [],
    instruction:
      "Stimulez chaque point le même nombre de fois (10, 20 ou 50 passages). Ne tracez pas de lignes continues, mais travaillez la zone de chaque point de manière bilatérale.",
  },
  {
    id: "tonify",
    category: "Protocoles de Base",
    name: "Tonification du Système Nerveux",
    description:
      "Vise à redistribuer délibérément l'énergie, en l'alignant correctement avec chaque organe et fonction.",
    points: [127, 19, 103, 126, 0],
    zones: [],
    instruction: "Peut être tapoté, travaillé verticalement ou stimulé avec un mouvement rotatoire.",
  },
  {
    id: "base_points",
    category: "Protocoles de Base",
    name: "Points de Base Obligatoires",
    description:
      "Correspondent à des fonctions spécifiques et essentielles pour un flux énergétique correct (nerveux, sanguin, lymphatique, respiratoire et méridiens).",
    points: [61, 39, 37, 50, 38, 17],
    zones: [],
    instruction:
      "Effectuez ce protocole après la Relaxation et la Tonification. Le point 39 et 37 sont à gauche, le 50 à droite.",
  },
  {
    id: "headache",
    category: "Massages Simplifiés",
    name: "Maux de tête (Général)",
    description:
      "En phase aiguë : amélioration de la douleur. En phase préventive : agit sur la prédisposition à accumuler le stress et les toxines.",
    points: [103, 106, 124, 34, 26, 0],
    zones: ["forehead_center", "forehead_hairline"],
    instruction:
      "Massez du centre des sourcils au centre du front, et du centre des sourcils à la racine des cheveux.",
  },
  {
    id: "nervousness",
    category: "Massages Simplifiés",
    name: "Nervosité & Troubles du sommeil",
    description:
      "Agit sur la difficulté à s'endormir, les réveils fréquents, l'agitation, les états d'anxiété et le besoin de fumer.",
    points: [124, 34, 26, 0],
    zones: ["forehead", "eyebrows", "ears_front"],
    instruction:
      "Ligne horizontale centrale du front, toute la longueur des sourcils, et la ligne verticale devant les oreilles.",
  },
  {
    id: "back_pain",
    category: "Douleurs Articulaires",
    name: "Mal de dos",
    description:
      "Problèmes mécaniques et fonctionnels, douleurs de posture, effets d'une opération, hernie discale, ostéoporose.",
    points: [1, 43, 143],
    zones: ["nose_center", "forehead_center", "forehead_hairline", "ears_front"],
    instruction:
      "Massez la ligne centrale verticale du nez, la ligne centrale verticale du front, la ligne horizontale des cheveux, et la ligne verticale devant les oreilles.",
  },
  {
    id: "sciatica",
    category: "Douleurs Articulaires",
    name: "Sciatique",
    description:
      "Douleur irradiant de la zone lombaire, des fesses, à l'arrière de la jambe le long du nerf.",
    points: [5, 17, 38, 74],
    zones: ["forehead_hairline", "nasolabial_folds", "jaw_line"],
    instruction:
      "Racine des cheveux sur le front (2cm de large de chaque côté), des narines le long des sillons labiaux, et le long du bord de la mâchoire inférieure.",
  },
  {
    id: "cold",
    category: "Systèmes du Corps",
    name: "Rhume",
    description:
      "Interrompt le processus dégénératif du rhume. À effectuer dès le premier éternuement.",
    points: [61, 3, 73, 60],
    zones: ["nose_full", "ears_front"],
    instruction:
      "Massez la zone latérale du nez (de la base des narines à la naissance des cheveux), et la zone verticale devant les oreilles.",
  },
  {
    id: "sore_throat",
    category: "Systèmes du Corps",
    name: "Mal de gorge",
    description:
      "Amélioration presque immédiate. À effectuer dès les premières sensations de brûlure.",
    points: [12, 14, 20],
    zones: ["ears_front", "jaw_line"],
    instruction:
      "Zone verticale devant les oreilles, ligne horizontale sous les oreilles, et zone devant la partie inférieure des oreilles (glandes salivaires).",
  },
  {
    id: "digestion",
    category: "Systèmes du Corps",
    name: "Digestion / Constipation",
    description:
      "Massage pour favoriser le péristaltisme (mouvement des déchets à travers le système digestif).",
    points: [50, 41, 38, 113, 39, 37, 127, 365],
    zones: ["mouth_area", "chin_hollow"],
    instruction:
      "Périmètre de la bouche, en suivant le trajet du côlon : de la droite vers le haut, transversalement sous le nez, puis descendant à gauche.",
  },
];

export function getDefaultDienChanProtocolName(): string | null {
  return DIEN_CHAN_PROTOCOLS[0]?.name ?? null;
}
