import type { Locale } from "@/i18n/translations";
import { pickLocalizedText } from "@/lib/content-i18n";

/**
 * Normalize French catalog strings for lookup (typographic apostrophe, spacing).
 */
export function normalizeCatalogFrKey(s: string): string {
  return s
    .normalize("NFC")
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const CATALOG_FR_EN_PAIRS: [string, string][] = [
  // focus_introspectif — intention
  [
    "Fixer un objet neutre sans jugement pour muscler la capacité de concentration convergente.",
    "Fix your gaze on a neutral object without judgment to strengthen convergent concentration.",
  ],
  [
    "Détacher le regard de l'écran pour percevoir les volumes et l'espace à gauche, à droite et au-dessus afin de briser l'attention convergente du stress.",
    "Look away from the screen to sense volume and space to your left, right, and above, breaking convergent stress attention.",
  ],
  [
    "Visualiser la journée non comme une ligne de tâches, mais comme un point unique et immobile pour s'extraire de la pression temporelle.",
    "Picture your day not as a line of tasks but as one still point to step out of time pressure.",
  ],
  // body_scan
  ["Colonne Vertébrale", "Spine"],
  [
    "Redressez la posture et visualisez l'énergie remonter le long de la colonne vers le sommet du crâne pour réirriguer le cerveau antérieur.",
    "Straighten your posture and visualize energy rising along the spine to the top of the head to re-irrigate the anterior brain.",
  ],
  ["Mâchoire et Yeux", "Jaw and eyes"],
  [
    "Relâchez la pression derrière les globes oculaires et desserrez les dents.",
    "Release pressure behind the eyeballs and unclench your teeth.",
  ],
  ["Trapèzes", "Trapezius"],
  [
    "Laissez tomber les épaules comme si elles étaient attirées par le sol.",
    "Let your shoulders drop as if pulled toward the floor.",
  ],
  // visualization
  ["Succès final", "Final success"],
  [
    "Visualisez le résultat final de votre tâche avec une satisfaction intense, comme si elle était déjà réalisée.",
    "Visualize the final outcome of your task with intense satisfaction, as if it were already done.",
  ],
  ["Ordre Interne", "Inner order"],
  [
    "Visualisez un faisceau lumineux ordonnant chaque cellule de votre cerveau vers un but unique.",
    "Visualize a beam of light organizing every cell in your brain toward one single goal.",
  ],
  // intention
  [
    "Quelle est l'unique action prioritaire sur laquelle je pose toute mon attention maintenant ?",
    "What is the one priority action I place all my attention on right now?",
  ],
  [
    "Si cette prochaine heure était un chef-d'œuvre d'efficacité, quelle en serait la couleur dominante ?",
    "If the next hour were a masterpiece of efficiency, what would its dominant color be?",
  ],
  // micro_practice — reset vagal
  [
    "Technique de stimulation du nerf vague pour sortir instantanément du mode survie via le mouvement des yeux.",
    "Vagus nerve stimulation through eye movement to exit survival mode quickly.",
  ],
  ["Gardez la tête droite face à vous.", "Keep your head straight in front of you."],
  [
    "Sans bouger la tête, regardez le plus loin possible à droite.",
    "Without moving your head, look as far to the right as you can.",
  ],
  [
    "Maintenez jusqu'à un soupir, une déglutition ou un bâillement.",
    "Hold until you sigh, swallow, or yawn.",
  ],
  ["Répétez l'opération du côté gauche.", "Repeat on the left side."],
  // micro_practice — posture
  [
    "Utiliser la bio-mécanique pour forcer le cerveau à quitter le mode repli/survie.",
    "Use biomechanics to help the brain leave folded/survival mode.",
  ],
  [
    "Levez-vous et écartez les pieds à la largeur des épaules.",
    "Stand and place your feet shoulder-width apart.",
  ],
  [
    "Ouvrez la poitrine et placez vos mains sur vos hanches.",
    "Open your chest and place your hands on your hips.",
  ],
  [
    "Levez légèrement le menton et respirez profondément par le nez.",
    "Lift your chin slightly and breathe deeply through your nose.",
  ],
  // affirmations
  ["Je suis capable", "I am capable"],
  ["Je reste stable", "I stay steady"],
  ["Je passe à l'action", "I take action"],
  ["Je suis capable.", "I am capable."],
  ["Je reste stable.", "I stay steady."],
  ["Je passe à l'action.", "I take action."],
  ["Je canalise ma détermination inébranlable.", "I channel my unshakeable determination."],
  ["Mon focus est stable et puissant.", "My focus is stable and powerful."],
  ["Je suis le pilote de mon attention.", "I am the pilot of my attention."],
  ["Mon calme est ma puissance d'action.", "My calm is my power to act."],
  ["Je décide à partir de la clarté, non de l'urgence.", "I decide from clarity, not urgency."],
  ["Je respire et j'avance avec calme.", "I breathe and move forward with calm."],
  ["Ma présence est mon ancrage.", "My presence is my anchor."],
  ["Je choisis la clarté avant la réaction.", "I choose clarity before reaction."],
  ["Chaque expiration me ramène au centre.", "Each exhale brings me back to center."],
];

const CATALOG_FR_EN: Record<string, string> = {};
for (const [fr, en] of CATALOG_FR_EN_PAIRS) {
  CATALOG_FR_EN[normalizeCatalogFrKey(fr)] = en;
}

export function lookupCatalogFrToEn(frSource: string): string | undefined {
  return CATALOG_FR_EN[normalizeCatalogFrKey(frSource)];
}

/**
 * For catalog widget strings: when locale is EN, do not fall back to FR from `i18n`
 * (unlike pickLocalizedText, which uses the other locale as fallback).
 * Uses known FR→EN map, then legacy text as last resort.
 */
export function pickWidgetCatalogCopy(
  locale: Locale,
  i18n: Partial<Record<Locale, string>> | Record<string, string> | null | undefined,
  legacy?: string | null
): string {
  if (locale === "fr") {
    return pickLocalizedText("fr", i18n as Partial<Record<Locale, string>> | null, legacy ?? null);
  }
  const obj = (i18n && typeof i18n === "object" ? i18n : {}) as Partial<Record<Locale, string>>;
  const enDirect = typeof obj.en === "string" ? obj.en.trim() : "";
  if (enDirect) return enDirect;

  const leg = legacy?.trim() ?? "";
  const frOnly = typeof obj.fr === "string" ? obj.fr.trim() : "";
  const mapped = lookupCatalogFrToEn(leg) || (frOnly ? lookupCatalogFrToEn(frOnly) : undefined);
  if (mapped) return mapped;
  if (leg) return leg;
  return "";
}
