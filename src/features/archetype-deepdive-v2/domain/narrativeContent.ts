/**
 * Bilingual static content used by `dynamicProfileBuilder.ts`.
 * All editorial text is colocated here so the builder stays a pure data pipeline.
 *
 * Tone: "tu" in FR, "you" in EN. Keep parallel structure between the two locales.
 */

import type { AnyArchetypeKey } from "./types";
import type { Locale } from "@/i18n/translations";

type ArchKey = AnyArchetypeKey;
type Bi = { fr: string; en: string };
type BiPractice = { fr: { title: string; description: string }; en: { title: string; description: string } };

/* -------------------------------------------------------------------------- */
/* Archetype labels                                                           */
/* -------------------------------------------------------------------------- */

const ARCH_LABEL: Record<ArchKey, Bi> = {
  sovereign: { fr: "Sovereign", en: "Sovereign" },
  warrior: { fr: "Warrior", en: "Warrior" },
  lover: { fr: "Lover", en: "Lover" },
  caregiver: { fr: "Caregiver", en: "Caregiver" },
  creator: { fr: "Creator", en: "Creator" },
  explorer: { fr: "Explorer", en: "Explorer" },
  rebel: { fr: "Rebel", en: "Rebel" },
  sage: { fr: "Sage", en: "Sage" },
  mystic: { fr: "Mystique", en: "Mystic" },
  healer: { fr: "Healer", en: "Healer" },
  magician: { fr: "Magicien", en: "Magician" },
  jester: { fr: "Jester", en: "Jester" },
  child: { fr: "Child", en: "Child" },
  victim: { fr: "Victim", en: "Victim" },
  saboteur: { fr: "Saboteur", en: "Saboteur" },
  prostitute: { fr: "Prostitute", en: "Prostitute" },
};

export function archLabel(arch: ArchKey, locale: Locale): string {
  return ARCH_LABEL[arch]?.[locale] ?? arch;
}

/* -------------------------------------------------------------------------- */
/* Taglines                                                                   */
/* -------------------------------------------------------------------------- */

const TAGLINES: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Tient le cap, gouverne, prend la responsabilité.", en: "Holds the course, governs, takes responsibility." },
  warrior: { fr: "Tient sous pression, défend ce qui est juste.", en: "Holds under pressure, defends what is right." },
  lover: { fr: "Aime, désire, entre en relation profonde.", en: "Loves, desires, enters into deep relationship." },
  caregiver: { fr: "Nourrit, contient, prend soin.", en: "Nourishes, contains, takes care." },
  creator: { fr: "Donne forme à ce qui n'existait pas.", en: "Gives form to what didn't exist." },
  explorer: { fr: "Cherche l'ailleurs, ouvre des chemins.", en: "Seeks elsewhere, opens new paths." },
  rebel: { fr: "Défie l'ordre injuste, ouvre des brèches.", en: "Challenges unjust order, opens breaches." },
  sage: { fr: "Cherche la vérité, comprend, transmet.", en: "Seeks truth, understands, transmits." },
  mystic: { fr: "Quête du sacré, du sens et de l'unité.", en: "Quest for the sacred, meaning and unity." },
  healer: { fr: "Transforme la blessure en ressource.", en: "Transforms wounds into resources." },
  magician: { fr: "Transforme l'invisible en réel, ouvre des possibles.", en: "Turns the invisible into real, opens possibilities." },
  jester: { fr: "Rit, allège, renverse les perspectives.", en: "Laughs, lightens, flips perspectives." },
};

const GIVES: Partial<Record<ArchKey, Bi>> = {
  sovereign: {
    fr: "Tu sais incarner l'autorité, donner une direction et porter la responsabilité du collectif. Tu vois les choses de haut et tiens un cadre.",
    en: "You know how to embody authority, give direction and carry collective responsibility. You see things from above and hold a frame.",
  },
  warrior: {
    fr: "Tu as une vraie capacité à tenir sous pression, à défendre ce qui est juste pour toi et les autres, et à exécuter quand il faut.",
    en: "You have a real ability to hold under pressure, to defend what is right for you and others, and to execute when needed.",
  },
  lover: {
    fr: "Tu es présent, intense, capable de connexions profondes. Tu mets de la chaleur dans ce que tu fais et inspires confiance par ta sincérité.",
    en: "You are present, intense, capable of deep connections. You bring warmth to what you do and inspire trust through your sincerity.",
  },
  caregiver: {
    fr: "Tu sais soutenir sans te sacrifier, créer un climat de sécurité, materner de façon mature autour de toi.",
    en: "You know how to support without sacrificing yourself, create a climate of safety, and nurture maturely around you.",
  },
  creator: {
    fr: "Tu canalises l'inspiration en formes concrètes. Tu vois des possibilités là où les autres voient des limites.",
    en: "You channel inspiration into concrete forms. You see possibilities where others see limits.",
  },
  explorer: {
    fr: "Tu sais sortir des scripts familiaux, ouvrir ta vie, aller chercher ailleurs ce qui n'existe pas encore.",
    en: "You know how to step out of family scripts, open up your life, and go elsewhere to find what doesn't yet exist.",
  },
  rebel: {
    fr: "Tu défies les systèmes injustes, tu ouvres des voies alternatives, tu protèges la vérité.",
    en: "You challenge unjust systems, open alternative paths, and protect the truth.",
  },
  sage: {
    fr: "Tu as un vrai talent pour comprendre, synthétiser, structurer la complexité et la rendre intelligible.",
    en: "You have a real talent for understanding, synthesizing, structuring complexity and making it intelligible.",
  },
  mystic: {
    fr: "Tu as un accès naturel à l'intuition, aux synchronicités, aux niveaux sous-jacents de ce que tu vis.",
    en: "You have natural access to intuition, synchronicities, and the underlying levels of what you experience.",
  },
  healer: {
    fr: "Tu transformes blessure en ressource, tu écoutes en profondeur, tu accompagnes la guérison.",
    en: "You transform wounds into resources, you listen deeply, you accompany healing.",
  },
  magician: {
    fr: "Tu fonctionnes en vision stratégique + intuition. Tu captes des patterns et tu fais bouger les lignes en finesse.",
    en: "You operate with strategic vision + intuition. You catch patterns and shift things with subtlety.",
  },
  jester: {
    fr: "Tu allèges, tu révèles des vérités à travers le rire, tu fais circuler l'énergie là où tout est figé.",
    en: "You lighten things, reveal truths through laughter, and circulate energy where everything is frozen.",
  },
};

const WATCHOUTS: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Risque de rigidification du cadre, isolement au sommet, difficulté à déléguer ou à se laisser challenger.", en: "Risk of frame rigidification, isolation at the top, difficulty delegating or accepting challenge." },
  warrior: { fr: "Tendance à te battre contre ton propre corps ou à rester dans des environnements qui te usent au nom de la tenue.", en: "Tendency to fight against your own body or stay in environments that wear you out in the name of holding the line." },
  lover: { fr: "Risque de dépendance affective, recherche de validation, ou drama relationnel quand l'intensité manque.", en: "Risk of emotional dependency, seeking validation, or relational drama when intensity is missing." },
  caregiver: { fr: "Risque de sur-sacrifice, de materner pour contrôler, ou de t'oublier complètement pour les autres.", en: "Risk of over-sacrifice, mothering to control, or completely forgetting yourself for others." },
  creator: { fr: "Perfectionnisme, auto-critique paralysante, ou utilisation du talent pour manipuler plutôt que créer.", en: "Perfectionism, paralyzing self-criticism, or using talent to manipulate rather than create." },
  explorer: { fr: "Fuite de l'engagement et de la stabilité, confusion entre mouvement et vraie liberté.", en: "Avoidance of commitment and stability, confusion between movement and true freedom." },
  rebel: { fr: "Casser pour casser, rejeter avant de comprendre, te couper de soutiens possibles par principe.", en: "Breaking for the sake of breaking, rejecting before understanding, cutting yourself off from possible support on principle." },
  sage: { fr: "Sur-mentalisation, distance émotionnelle, ou tendance à figer des visions en théories rigides.", en: "Over-mentalization, emotional distance, or tendency to freeze visions into rigid theories." },
  mystic: { fr: "Spiritual bypassing : te réfugier dans l'intériorité ou la spiritualité pour ne plus sentir le concret.", en: "Spiritual bypassing: retreating into interiority or spirituality to no longer feel the concrete." },
  healer: { fr: "Te définir par tes blessures, vouloir sauver tout le monde, t'épuiser dans l'aide aux autres.", en: "Defining yourself by your wounds, wanting to save everyone, exhausting yourself helping others." },
  magician: { fr: "Glisser vers la micro-manipulation, l'élitisme, ou rester en coulisses sans t'exposer vraiment.", en: "Sliding into micro-manipulation, elitism, or staying behind the scenes without truly exposing yourself." },
  jester: { fr: "Te cacher derrière la blague pour ne jamais te montrer, minimiser, saboter la profondeur.", en: "Hiding behind jokes to never show yourself, minimizing, sabotaging depth." },
};

const ADMIN_FUNCTIONS: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Vision long terme, gouvernance, équilibre du système, autorité.", en: "Long-term vision, governance, system balance, authority." },
  warrior: { fr: "Combat, protection, discipline, capacité d'exécution.", en: "Combat, protection, discipline, execution capacity." },
  lover: { fr: "Connexion, intensité relationnelle, présence affective.", en: "Connection, relational intensity, emotional presence." },
  caregiver: { fr: "Soin, contenance, soutien, maternage mature.", en: "Care, containment, support, mature nurturing." },
  creator: { fr: "Manifestation, mise en forme, canalisation de l'inspiration.", en: "Manifestation, shaping, channeling inspiration." },
  explorer: { fr: "Ouverture, mouvement, exploration de territoires neufs.", en: "Openness, movement, exploration of new territories." },
  rebel: { fr: "Défi des systèmes, rupture, ouverture de brèches.", en: "Challenging systems, rupture, opening breaches." },
  sage: { fr: "Discernement, structuration du sens, transmission.", en: "Discernment, structuring meaning, transmission." },
  mystic: { fr: "Lien au sacré, lecture symbolique, intuition profonde.", en: "Connection to the sacred, symbolic reading, deep intuition." },
  healer: { fr: "Transformation de la souffrance, écoute thérapeutique.", en: "Transformation of suffering, therapeutic listening." },
  magician: { fr: "Transformation, stratégie, jeu avec dynamiques visibles/invisibles.", en: "Transformation, strategy, play with visible/invisible dynamics." },
  jester: { fr: "Allègement, renversement, énergie créative ludique.", en: "Lightening, flipping, playful creative energy." },
};

const ADMIN_RISKS: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Sovereign ombre = autocrate ou marionnette ; perte de souveraineté quand le contexte attaque l'identité.", en: "Sovereign shadow = autocrat or puppet; loss of sovereignty when context attacks identity." },
  warrior: { fr: "Confondre tenue et intégrité ; rester en posture de guerre quand le contexte demande négociation.", en: "Confusing endurance with integrity; staying in war posture when context calls for negotiation." },
  lover: { fr: "Fusion, dépendance, perte de soi dans la relation à l'autre.", en: "Fusion, dependency, loss of self in relationship to the other." },
  caregiver: { fr: "Sur-investissement dans le soin de l'autre au détriment de soi ; martyr inconscient.", en: "Over-investment in caring for the other at one's own expense; unconscious martyr." },
  creator: { fr: "Blocage créatif, procrastination perfectionniste, utilisation manipulatoire du talent.", en: "Creative block, perfectionist procrastination, manipulative use of talent." },
  explorer: { fr: "Fuite chronique de l'enracinement, instabilité relationnelle ou professionnelle.", en: "Chronic flight from rootedness, relational or professional instability." },
  rebel: { fr: "Opposition systématique, isolement, perte de discernement entre vrais et faux combats.", en: "Systematic opposition, isolation, loss of discernment between real and false battles." },
  sage: { fr: "Sur-mentalisation, dogmatisme soft quand un modèle marche bien.", en: "Over-mentalization, soft dogmatism when a model works well." },
  mystic: { fr: "Fuite du réel, spiritual bypassing, déconnexion de la matière.", en: "Flight from reality, spiritual bypassing, disconnection from matter." },
  healer: { fr: "Identification à la blessure, complexe du sauveur, épuisement compassionnel.", en: "Identification with the wound, savior complex, compassion fatigue." },
  magician: { fr: "Stratège détaché qui tient les ficelles sans s'exposer, micro-manipulation justifiée par la vision.", en: "Detached strategist pulling strings without exposing themselves, micro-manipulation justified by vision." },
  jester: { fr: "Évitement par l'humour, sabotage des moments de profondeur.", en: "Avoidance through humor, sabotage of moments of depth." },
};

const ADMIN_WORK: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Clarifier les contrats explicites avec l'entourage ; déléguer en gardant la responsabilité finale.", en: "Clarify explicit contracts with surroundings; delegate while keeping final responsibility." },
  warrior: { fr: "Passer du combat de survie à la protection consciente : choisir quels combats valent ta santé.", en: "Move from survival combat to conscious protection: choose which battles are worth your health." },
  lover: { fr: "Apprendre à aimer sans se perdre, distinguer fusion et présence.", en: "Learn to love without losing yourself, distinguish fusion from presence." },
  caregiver: { fr: "Équilibrer 'je prends soin de toi' avec 'je prends aussi soin de moi'.", en: "Balance 'I take care of you' with 'I also take care of myself'." },
  creator: { fr: "Assumer le rôle de co-créateur sans saboter ses propres œuvres ; livrer imparfait.", en: "Embrace the co-creator role without sabotaging your own works; ship imperfect." },
  explorer: { fr: "Transformer la fuite en exploration consciente et assumée.", en: "Transform flight into conscious, owned exploration." },
  rebel: { fr: "Choisir quand la rébellion sert vraiment le contrat, et quand elle rejoue une vieille guerre.", en: "Choose when rebellion truly serves the contract, and when it replays an old war." },
  sage: { fr: "Créer des espaces où le Sage écoute sans interpréter ; transmettre du work in progress.", en: "Create spaces where the Sage listens without interpreting; transmit work in progress." },
  mystic: { fr: "Lier toute prise de conscience mystique à un micro-acte concret dans la matière.", en: "Tie every mystical insight to a concrete micro-action in matter." },
  healer: { fr: "Guérir avec, pas contre, ce qu'on a traversé ; poser des limites au soin.", en: "Heal with, not against, what one has been through; set limits on care." },
  magician: { fr: "Accepter des actes visibles et irréversibles, pas seulement des ajustements en coulisses.", en: "Accept visible, irreversible acts, not just behind-the-scenes adjustments." },
  jester: { fr: "Distinguer le rire qui ouvre du rire qui fuit ; oser la profondeur après la blague.", en: "Distinguish laughter that opens from laughter that escapes; dare depth after the joke." },
};

const STRENGTH_HINT: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "autorité naturelle, vision long terme, sens des responsabilités.", en: "natural authority, long-term vision, sense of responsibility." },
  warrior: { fr: "capacité d'exécution, défense des valeurs, endurance sous pression.", en: "execution ability, defense of values, endurance under pressure." },
  lover: { fr: "présence relationnelle, intensité, capacité à inspirer la confiance.", en: "relational presence, intensity, ability to inspire trust." },
  caregiver: { fr: "écoute, soutien, capacité à créer un environnement safe.", en: "listening, support, ability to create a safe environment." },
  creator: { fr: "talent de mise en forme, originalité, énergie créative.", en: "shaping talent, originality, creative energy." },
  explorer: { fr: "ouverture, courage de l'inconnu, créativité du chemin.", en: "openness, courage of the unknown, creativity of the path." },
  rebel: { fr: "courage de défier, vision alternative, protection de la vérité.", en: "courage to challenge, alternative vision, protection of truth." },
  sage: { fr: "clarté mentale, discernement, capacité à expliquer et transmettre.", en: "mental clarity, discernment, ability to explain and transmit." },
  mystic: { fr: "intuition fine, lecture symbolique, accès au sens profond.", en: "fine intuition, symbolic reading, access to deep meaning." },
  healer: { fr: "écoute profonde, capacité de transformation de la souffrance.", en: "deep listening, ability to transform suffering." },
  magician: { fr: "vision stratégique, capacité à orchestrer et faire bouger les lignes.", en: "strategic vision, ability to orchestrate and shift things." },
  jester: { fr: "humour qui désamorce, légèreté qui libère, perspective neuve.", en: "disarming humor, freeing lightness, fresh perspective." },
};

const VIGILANCE_HINT: Partial<Record<ArchKey, Bi>> = {
  sovereign: { fr: "Ne pas confondre autorité et contrôle ; rester ouvert au feedback.", en: "Don't confuse authority with control; stay open to feedback." },
  warrior: { fr: "Ne pas troquer ta santé contre la tenue ; choisir tes combats.", en: "Don't trade your health for endurance; choose your battles." },
  lover: { fr: "Ne pas perdre ton centre dans la relation à l'autre.", en: "Don't lose your center in the relationship with the other." },
  caregiver: { fr: "Ne pas t'oublier dans le soin que tu portes aux autres.", en: "Don't forget yourself in the care you give to others." },
  creator: { fr: "Ne pas laisser le perfectionnisme bloquer la livraison.", en: "Don't let perfectionism block delivery." },
  explorer: { fr: "Ne pas fuir l'enracinement au nom du mouvement.", en: "Don't flee rootedness in the name of movement." },
  rebel: { fr: "Ne pas casser tes propres soutiens par opposition systématique.", en: "Don't break your own supports through systematic opposition." },
  sage: { fr: "Ne pas vivre uniquement dans la tête ; redescendre dans le corps.", en: "Don't live only in the head; come back down into the body." },
  mystic: { fr: "Ne pas utiliser le sacré pour fuir le concret.", en: "Don't use the sacred to flee the concrete." },
  healer: { fr: "Ne pas te définir par tes blessures ; poser des limites.", en: "Don't define yourself by your wounds; set limits." },
  magician: { fr: "Ne pas garder le pouvoir uniquement en coulisses ; t'exposer.", en: "Don't keep power only behind the scenes; expose yourself." },
  jester: { fr: "Ne pas te cacher derrière la blague ; oser la profondeur.", en: "Don't hide behind the joke; dare depth." },
};

const PRACTICES: Partial<Record<ArchKey, BiPractice>> = {
  sovereign: { fr: { title: "Audit de cadre — 10 min/sem", description: "Lister les contrats implicites de la semaine et les rendre explicites." }, en: { title: "Frame audit — 10 min/week", description: "List the implicit contracts of the week and make them explicit." } },
  warrior: { fr: { title: "Audit énergétique hebdo", description: "Lister les combats menés cette semaine — lesquels valaient ta santé ?" }, en: { title: "Weekly energy audit", description: "List the battles fought this week — which were worth your health?" } },
  lover: { fr: { title: "Présence à l'autre — 5 min", description: "Écouter quelqu'un sans interrompre ni anticiper la réponse." }, en: { title: "Presence to the other — 5 min", description: "Listen to someone without interrupting or anticipating the answer." } },
  caregiver: { fr: { title: "Soin de soi — 15 min/jour", description: "Bloquer un créneau quotidien réservé strictement à toi." }, en: { title: "Self-care — 15 min/day", description: "Block a daily slot reserved strictly for you." } },
  creator: { fr: { title: "Livre imparfait — 1×/sem", description: "Publier ou montrer une création inachevée pour casser le perfectionnisme." }, en: { title: "Imperfect ship — 1×/week", description: "Publish or show an unfinished creation to break perfectionism." } },
  explorer: { fr: { title: "Ancrage hebdo — 30 min", description: "Choisir un lieu / une routine et y revenir consciemment chaque semaine." }, en: { title: "Weekly anchor — 30 min", description: "Choose a place or routine and consciously return to it each week." } },
  rebel: { fr: { title: "Pause avant rejet", description: "Avant de dire non, prendre 24h pour vérifier ce qui se rejoue." }, en: { title: "Pause before rejection", description: "Before saying no, take 24h to check what is being replayed." } },
  sage: { fr: { title: "Body scan — 10 min", description: "Pour que le Sage descende dans le corps et ne reste pas en surplomb mental." }, en: { title: "Body scan — 10 min", description: "So the Sage descends into the body instead of staying in mental overhang." } },
  mystic: { fr: { title: "Intention du jour — 3 min", description: "Canaliser le Mystique au matin : 'voici ce que j'incarne aujourd'hui'." }, en: { title: "Daily intention — 3 min", description: "Channel the Mystic in the morning: 'this is what I embody today'." } },
  healer: { fr: { title: "Limite du soin", description: "Identifier une situation où tu vas arrêter de porter ce qui n'est pas à toi." }, en: { title: "Care boundary", description: "Identify a situation where you'll stop carrying what isn't yours." } },
  magician: { fr: { title: "Annonce explicite — 1×/sem", description: "Dire publiquement quelque chose que tu aurais ajusté en coulisses." }, en: { title: "Explicit announcement — 1×/week", description: "Publicly say something you would have adjusted behind the scenes." } },
  jester: { fr: { title: "Profondeur après blague", description: "Dire ce que la blague venait protéger, juste après l'avoir lancée." }, en: { title: "Depth after joke", description: "Say what the joke was protecting, right after telling it." } },
};

const HOUSE_LABELS: Record<number, Bi> = {
  1: { fr: "Ego & personnalité", en: "Ego & personality" },
  2: { fr: "Valeurs & sécurité", en: "Values & security" },
  3: { fr: "Expression & décisions", en: "Expression & decisions" },
  4: { fr: "Foyer & racines", en: "Home & roots" },
  5: { fr: "Créativité & plaisir", en: "Creativity & pleasure" },
  6: { fr: "Travail & santé", en: "Work & health" },
  7: { fr: "Relations & partenariats", en: "Relationships & partnerships" },
  8: { fr: "Ressources partagées", en: "Shared resources" },
  9: { fr: "Spiritualité & quête", en: "Spirituality & quest" },
  10: { fr: "Vocation & potentiel", en: "Vocation & potential" },
  11: { fr: "Monde & contribution", en: "World & contribution" },
  12: { fr: "Inconscient & patterns", en: "Unconscious & patterns" },
};

const HOUSE_THEMES: Record<number, Bi> = {
  1: { fr: "image de soi et présence", en: "self-image and presence" },
  2: { fr: "rapport à la sécurité matérielle", en: "relationship to material security" },
  3: { fr: "voix et choix", en: "voice and choice" },
  4: { fr: "racines et foyer", en: "roots and home" },
  5: { fr: "créativité et jeu", en: "creativity and play" },
  6: { fr: "travail et santé", en: "work and health" },
  7: { fr: "alliances et couple", en: "alliances and partnership" },
  8: { fr: "intimité et fusion", en: "intimacy and fusion" },
  9: { fr: "quête de sens", en: "quest for meaning" },
  10: { fr: "vocation et autorité", en: "vocation and authority" },
  11: { fr: "contribution collective", en: "collective contribution" },
  12: { fr: "patterns inconscients", en: "unconscious patterns" },
};

const SHADOW_THEME: Record<ArchKey, Bi> = {
  child: { fr: "Besoin de sécurité / contrôle", en: "Need for security / control" },
  victim: { fr: "Impuissance apprise", en: "Learned helplessness" },
  saboteur: { fr: "Auto-sabotage", en: "Self-sabotage" },
  prostitute: { fr: "Compromis d'intégrité", en: "Integrity compromise" },
  // fallback for non-survival keys
  sovereign: { fr: "Contrôle", en: "Control" }, warrior: { fr: "Contrôle", en: "Control" },
  lover: { fr: "Contrôle", en: "Control" }, caregiver: { fr: "Contrôle", en: "Control" },
  creator: { fr: "Contrôle", en: "Control" }, explorer: { fr: "Contrôle", en: "Control" },
  rebel: { fr: "Contrôle", en: "Control" }, sage: { fr: "Contrôle", en: "Control" },
  mystic: { fr: "Contrôle", en: "Control" }, healer: { fr: "Contrôle", en: "Control" },
  magician: { fr: "Contrôle", en: "Control" }, jester: { fr: "Contrôle", en: "Control" },
};

/* -------------------------------------------------------------------------- */
/* Public getters                                                             */
/* -------------------------------------------------------------------------- */

export const get = {
  tagline: (a: ArchKey, l: Locale) => TAGLINES[a]?.[l],
  gives: (a: ArchKey, l: Locale) => GIVES[a]?.[l],
  watchout: (a: ArchKey, l: Locale) => WATCHOUTS[a]?.[l],
  adminFunctions: (a: ArchKey, l: Locale) => ADMIN_FUNCTIONS[a]?.[l],
  adminRisks: (a: ArchKey, l: Locale) => ADMIN_RISKS[a]?.[l],
  adminWork: (a: ArchKey, l: Locale) => ADMIN_WORK[a]?.[l],
  strengthHint: (a: ArchKey, l: Locale) => STRENGTH_HINT[a]?.[l],
  vigilanceHint: (a: ArchKey, l: Locale) => VIGILANCE_HINT[a]?.[l],
  practice: (a: ArchKey, l: Locale) => PRACTICES[a]?.[l],
  houseLabel: (h: number, l: Locale) => HOUSE_LABELS[h]?.[l] ?? `${l === "fr" ? "Maison" : "House"} ${h}`,
  houseTheme: (h: number, l: Locale) => HOUSE_THEMES[h]?.[l] ?? (l === "fr" ? "domaine clé" : "key domain"),
  shadowTheme: (a: ArchKey, l: Locale) => SHADOW_THEME[a]?.[l] ?? (l === "fr" ? "Contrôle" : "Control"),
};

/* -------------------------------------------------------------------------- */
/* Phrasing helpers (sentences with placeholders)                             */
/* -------------------------------------------------------------------------- */

export const phrases = {
  tripleTitle: (label: string, locale: Locale) =>
    locale === "fr" ? `Triade dominante : ${label}` : `Dominant triad: ${label}`,

  defaultProfileLabel: (locale: Locale) =>
    locale === "fr" ? "Profil archétypal" : "Archetypal profile",

  overviewLead: (labels: string[], locale: Locale) => {
    if (!labels.length) {
      return locale === "fr"
        ? "Ton profil archétypal est encore en cours de constitution."
        : "Your archetypal profile is still taking shape.";
    }
    if (locale === "fr") {
      return `Tes archétypes dominants sont le ${labels.join(", le ")}. Ils décrivent ta façon la plus naturelle de percevoir le monde, de décider et de transformer ce que tu touches.`;
    }
    return `Your dominant archetypes are the ${labels.join(", the ")}. They describe your most natural way of perceiving the world, deciding, and transforming what you touch.`;
  },

  taglineFallback: (locale: Locale) =>
    locale === "fr" ? "Archétype clé de ton paysage intérieur." : "Key archetype of your inner landscape.",

  adminFunctionsFallback: (label: string, locale: Locale) =>
    locale === "fr" ? `Fonctions clés du ${label}.` : `Key functions of the ${label}.`,

  adminEvidence: (rank: number, houses: number[], locale: Locale) => {
    const houseStr = houses.join(", ");
    return locale === "fr"
      ? `Présent dans le top ${rank} des archétypes scorés. Maison(s) typique(s) : ${houseStr}.`
      : `Present in the top ${rank} of scored archetypes. Typical house(s): ${houseStr}.`;
  },

  adminWorkFallback: (label: string, locale: Locale) =>
    locale === "fr"
      ? `Intégrer la lumière du ${label} sans tomber dans son ombre.`
      : `Integrate the light of the ${label} without falling into its shadow.`,

  hotspotTheme: (label: string, theme: string, locale: Locale) =>
    locale === "fr"
      ? `Activation de ${label} — ${theme}.`
      : `Activation of ${label} — ${theme}.`,

  noActiveSurvivalUser: (locale: Locale) =>
    locale === "fr"
      ? "Tes signaux de survie sont bas sur les quatre archétypes (Child, Victim, Saboteur, Prostitute). Tu n'as pas de pattern de survie dominant qui dirige tes décisions actuellement."
      : "Your survival signals are low across the four archetypes (Child, Victim, Saboteur, Prostitute). You don't have a dominant survival pattern driving your decisions right now.",

  activeSurvivalUser: (parts: string[], locale: Locale) =>
    locale === "fr"
      ? `Tes signaux de survie montrent surtout : ${parts.join(", ")}. Ces zones méritent ton attention car elles peuvent t'éloigner de tes archétypes lumineux quand le stress monte.`
      : `Your survival signals mostly show: ${parts.join(", ")}. These zones deserve attention because they can pull you away from your light archetypes when stress rises.`,

  noActiveSurvivalAdmin: (locale: Locale) =>
    locale === "fr"
      ? "Aucun signal de survie significatif. Profil stable côté ombres archétypales."
      : "No significant survival signal. Profile stable on archetypal shadows.",

  activeSurvivalAdmin: (parts: string[], locale: Locale) =>
    locale === "fr"
      ? `Survival actifs : ${parts.join(" · ")}. Lecture Myss : ces archétypes de survie filtrent la perception du réel et orientent les contrats implicites. À surveiller en accompagnement : moments de bascule entre archétypes lumineux et ombres de survie.`
      : `Active survival: ${parts.join(" · ")}. Myss reading: these survival archetypes filter perception of reality and shape implicit contracts. Watch in coaching: tipping points between light archetypes and survival shadows.`,

  closingNarrative: (l1: string, l2: string, l3: string, locale: Locale) =>
    locale === "fr"
      ? `Tu exprimes principalement l'énergie du ${l1}, soutenu par le ${l2} et le ${l3}. Cette triade est ta signature naturelle — l'enjeu est de la mettre au service de ce qui compte vraiment pour toi, plutôt que de la laisser tourner en automatique.`
      : `You primarily express the energy of the ${l1}, supported by the ${l2} and the ${l3}. This triad is your natural signature — the challenge is to put it in service of what truly matters to you, rather than letting it run on autopilot.`,

  strengthFallback: (label: string, hint: string | undefined, locale: Locale) =>
    `**${label}** : ${hint ?? (locale === "fr" ? "force naturelle de cet archétype." : "natural strength of this archetype.")}`,

  vigilanceFallback: (label: string, locale: Locale) =>
    locale === "fr" ? `Surveiller la zone d'ombre du ${label}.` : `Watch the shadow zone of the ${label}.`,

  defaultPractices: (locale: Locale) => locale === "fr" ? [
    { title: "Body scan — 10 min", description: "Reconnecte tes archétypes au corps avant de prendre toute décision importante." },
    { title: "Journal de clarification", description: "Écris pendant 5 min ce que ta triade dominante cherche à exprimer aujourd'hui." },
  ] : [
    { title: "Body scan — 10 min", description: "Reconnect your archetypes to the body before making any important decision." },
    { title: "Clarification journal", description: "Write for 5 min what your dominant triad is trying to express today." },
  ],

  adminResources: (locale: Locale) =>
    locale === "fr"
      ? "Archétypes secondaires disponibles selon les autres scores (creator, lover, etc.)."
      : "Secondary archetypes available depending on other scores (creator, lover, etc.).",

  adminNoSurvival: (locale: Locale) =>
    locale === "fr" ? "Aucun signal de survie significatif." : "No significant survival signal.",

  adminHypothesis: (l1: string, l2: string, l3: string, locale: Locale) =>
    locale === "fr"
      ? `Profil orienté ${l1} avec appui ${l2} / ${l3}. Travailler la complémentarité avec les archétypes les moins activés.`
      : `Profile oriented toward ${l1} with support from ${l2} / ${l3}. Work the complementarity with the least activated archetypes.`,

  adminContract: (labels: string[], activeSurvivalLabels: string[], topLabel: string, locale: Locale): string[] => {
    const join = labels.join(" + ");
    if (locale === "fr") {
      return [
        `${join} au centre → contrat orienté sur les fonctions de ces 3 archétypes.`,
        activeSurvivalLabels.length > 0
          ? `Ombres actives (${activeSurvivalLabels.join(", ")}) → travail de récupération de souveraineté à mener.`
          : `Aucune ombre survie dominante → terrain favorable pour activer pleinement les archétypes lumineux.`,
        `Pour AEGIS : prioriser les pratiques qui honorent le ${topLabel} sans nourrir ses zones d'ombre.`,
      ];
    }
    return [
      `${join} at the center → contract oriented on the functions of these 3 archetypes.`,
      activeSurvivalLabels.length > 0
        ? `Active shadows (${activeSurvivalLabels.join(", ")}) → sovereignty recovery work to lead.`
        : `No dominant survival shadow → favorable ground to fully activate the light archetypes.`,
      `For AEGIS: prioritize practices that honor the ${topLabel} without feeding its shadow zones.`,
    ];
  },
};
