/**
 * Le Casting des 12 Maisons — 72 questions du Contrat Sacré (Phase 2).
 *
 * 12 Maisons × 6 questions × 6 options.
 * Chaque option porte un vecteur à 4 pôles (même format que V4) :
 *   primaryLight (+2), secondaryLight (+1), primaryShadow (+2), secondaryShadow (+1).
 *
 * Les pôles scorés s'ajoutent au champ morphique global T1 (Bayesian reinforcement)
 * et permettent d'identifier l'archétype dominant par Maison.
 *
 * Maisons 1–12 : banque complète (72 questions).
 */
import type { ArchetypeKey, V4VectorMapping } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Houses72QuestionSeed {
  /** Caroline Myss house number (1–12). */
  house: number;
  /** 1-based position within the house (1–6). */
  position: number;
  prompt_fr: string;
  prompt_en?: string;
  options: Houses72OptionSeed[];
}

export interface Houses72OptionSeed {
  /** 1-based (A=1, B=2, … F=6). */
  position: number;
  label_fr: string;
  label_en?: string;
  vector: V4VectorMapping;
}

// ── Metadata for all 12 Houses ───────────────────────────────────────────────

export interface Houses72Meta {
  title_fr: string;
  title_en: string;
  theme_fr: string;
  theme_en: string;
}

export const HOUSES_72_META: Record<number, Houses72Meta> = {
  1:  { title_fr: "Ego & Identité",         title_en: "Ego & Identity",          theme_fr: "Le masque social et l'impulsion de vie",          theme_en: "The social mask and the life impulse" },
  2:  { title_fr: "Valeurs & Ressources",   title_en: "Values & Resources",      theme_fr: "Argent, sécurité et estime de soi",               theme_en: "Money, security and self-esteem" },
  3:  { title_fr: "Communication & Entourage", title_en: "Communication & Entourage", theme_fr: "Le mental concret et la fratrie",            theme_en: "The concrete mind and the fraternity" },
  4:  { title_fr: "Foyer & Racines",        title_en: "Home & Roots",            theme_fr: "Famille, ancrage et monde émotionnel privé",      theme_en: "Family, grounding and the private emotional world" },
  5:  { title_fr: "Créativité & Éros",      title_en: "Creativity & Eros",       theme_fr: "Plaisir, enfants, expression artistique",         theme_en: "Pleasure, children, artistic expression" },
  6:  { title_fr: "Quotidien & Santé",      title_en: "Daily Life & Health",     theme_fr: "Travail de l'ombre, routine, service",            theme_en: "Shadow work, routine, service" },
  7:  { title_fr: "Partenariats & Mariage", title_en: "Partnerships & Marriage", theme_fr: "Le miroir de l'Autre, les contrats",              theme_en: "The mirror of the Other, contracts" },
  8:  { title_fr: "Ombre, Sexe & Mort",     title_en: "Shadow, Sex & Death",     theme_fr: "Transmutation, héritages, crises",                theme_en: "Transmutation, inheritances, crises" },
  9:  { title_fr: "Vision & Quête",         title_en: "Vision & Quest",          theme_fr: "Philosophie, voyages, haut savoir",               theme_en: "Philosophy, travels, higher knowledge" },
  10: { title_fr: "Carrière & Destin",      title_en: "Career & Destiny",        theme_fr: "Statut social, autorité, l'héritage",             theme_en: "Social status, authority, the legacy" },
  11: { title_fr: "Collectif & Réseaux",    title_en: "Collective & Networks",   theme_fr: "Communautés, idéaux de l'humanité",               theme_en: "Communities, ideals of humanity" },
  12: { title_fr: "L'Inconscient & Le Sacré", title_en: "The Unconscious & The Sacred", theme_fr: "Karma, enfermement, dissolution",          theme_en: "Karma, confinement, dissolution" },
};

// ── Internal compact builders ────────────────────────────────────────────────

const L = "light" as const;
const S = "shadow" as const;

/** Build a 4-slot V4VectorMapping from 4 archetype/polarity pairs. */
function v(
  a1: ArchetypeKey, p1: "light" | "shadow",
  a2: ArchetypeKey, p2: "light" | "shadow",
  a3: ArchetypeKey, p3: "light" | "shadow",
  a4: ArchetypeKey, p4: "light" | "shadow",
): V4VectorMapping {
  return {
    primaryLight:    { archetype: a1, polarity: p1, points: 2 },
    secondaryLight:  { archetype: a2, polarity: p2, points: 1 },
    primaryShadow:   { archetype: a3, polarity: p3, points: 2 },
    secondaryShadow: { archetype: a4, polarity: p4, points: 1 },
  };
}

// ── Question Bank ────────────────────────────────────────────────────────────

export const QUESTIONS_HOUSES_72: Houses72QuestionSeed[] = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 1 : EGO & IDENTITÉ (Le masque social et l'impulsion de vie)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 1, position: 1,
    prompt_fr: "Lorsque vous entrez dans une pièce inconnue, quelle impression cherchez-vous instinctivement à donner ?",
    options: [
      { position: 1, label_fr: "Le charisme et l'autorité naturelle. Je veux qu'on sache qui dirige.",                           vector: v("sovereign",L,"warrior",L, "child",S,"victim",S) },
      { position: 2, label_fr: "La chaleur et la présence. Je veux que les gens se sentent instantanément vus.",                  vector: v("caregiver",L,"healer",L, "prostitute",S,"explorer",S) },
      { position: 3, label_fr: "Le mystère ou le magnétisme. Je veux attirer sans faire le premier pas.",                         vector: v("lover",L,"magician",L, "sage",S,"rebel",S) },
      { position: 4, label_fr: "L'anticonformisme. Je veux qu'on remarque que je ne joue pas leurs règles.",                      vector: v("rebel",L,"explorer",L, "sovereign",S,"caregiver",S) },
      { position: 5, label_fr: "L'intelligence et la réserve. J'observe d'abord, j'impose mon esprit ensuite.",                   vector: v("sage",L,"mystic",L, "child",S,"jester",S) },
      { position: 6, label_fr: "L'humour ou l'extravagance. Je brise la glace pour cacher ma vulnérabilité.",                    vector: v("jester",L,"child",L, "victim",S,"warrior",S) },
    ],
  },
  {
    house: 1, position: 2,
    prompt_fr: "Lorsqu'on vous attaque publiquement et injustement, votre réaction profonde est...",
    options: [
      { position: 1, label_fr: "Je contre-attaque violemment pour détruire la menace immédiatement.",                             vector: v("warrior",S,"sovereign",S, "caregiver",L,"healer",L) },
      { position: 2, label_fr: "Je me victimise pour retourner l'opinion publique contre mon agresseur.",                         vector: v("victim",S,"child",S, "warrior",L,"sovereign",L) },
      { position: 3, label_fr: "Je dédramatise avec une blague piquante qui ridiculise la situation.",                            vector: v("jester",L,"magician",L, "sage",S,"lover",S) },
      { position: 4, label_fr: "Je me ferme et coupe la connexion, affichant une froideur absolue.",                              vector: v("sage",S,"mystic",S, "lover",L,"child",L) },
      { position: 5, label_fr: "Je l'utilise pour montrer que je suis au-dessus de ça (orgueil spirituel).",                     vector: v("magician",S,"healer",S, "rebel",L,"explorer",L) },
      { position: 6, label_fr: "Je pardonne sincèrement, sachant que l'attaque reflète leur propre blessure.",                   vector: v("healer",L,"caregiver",L, "victim",S,"saboteur",S) },
    ],
  },
  {
    house: 1, position: 3,
    prompt_fr: "Lequel de ces masques portez-vous le plus souvent en société ?",
    options: [
      { position: 1, label_fr: "Celui de la personne forte qui n'a jamais besoin d'aide.",                                        vector: v("warrior",S,"sovereign",S, "child",L,"victim",L) },
      { position: 2, label_fr: "Celui de la personne joyeuse et sans problème.",                                                  vector: v("jester",S,"child",S, "sage",L,"mystic",L) },
      { position: 3, label_fr: "Celui de l'expert infaillible qui sait toujours quoi faire.",                                     vector: v("sage",S,"magician",S, "explorer",L,"rebel",L) },
      { position: 4, label_fr: "Celui de la personne dévouée qui s'oublie pour les autres.",                                      vector: v("caregiver",S,"victim",S, "sovereign",L,"warrior",L) },
      { position: 5, label_fr: "Celui de la personne détachée qui se fiche de tout.",                                             vector: v("explorer",S,"rebel",S, "lover",L,"caregiver",L) },
      { position: 6, label_fr: "Celui de la personne parfaite et inatteignable.",                                                 vector: v("creator",S,"lover",S, "jester",L,"saboteur",L) },
    ],
  },
  {
    house: 1, position: 4,
    prompt_fr: "Comment démarrez-vous un nouveau projet qui vous tient vraiment à cœur ?",
    options: [
      { position: 1, label_fr: "Je structure tout militairement avant de faire le premier pas.",                                   vector: v("sovereign",L,"warrior",L, "child",S,"saboteur",S) },
      { position: 2, label_fr: "Je me lance à corps perdu avec passion, sans regarder les risques.",                              vector: v("lover",L,"rebel",L, "sage",S,"caregiver",S) },
      { position: 3, label_fr: "J'attends le 'bon moment' indéfiniment par peur de l'échec.",                                    vector: v("saboteur",S,"creator",S, "warrior",L,"explorer",L) },
      { position: 4, label_fr: "J'étudie toutes les théories possibles mais j'ai du mal à démarrer.",                            vector: v("sage",S,"explorer",S, "magician",L,"creator",L) },
      { position: 5, label_fr: "Je laisse l'intuition et les synchronicités guider mon premier pas.",                             vector: v("mystic",L,"magician",L, "sovereign",S,"prostitute",S) },
      { position: 6, label_fr: "J'ai besoin qu'on me pousse ou qu'on me rassure pour oser y aller.",                             vector: v("child",S,"victim",S, "sovereign",L,"warrior",L) },
    ],
  },
  {
    house: 1, position: 5,
    prompt_fr: "Quel est votre rapport profond à votre corps ?",
    options: [
      { position: 1, label_fr: "C'est une machine que je dois dompter, optimiser et forcer.",                                     vector: v("warrior",S,"sovereign",S, "healer",L,"mystic",L) },
      { position: 2, label_fr: "C'est un temple sacré que je chéris et célèbre (beauté/sensualité).",                            vector: v("lover",L,"creator",L, "prostitute",S,"victim",S) },
      { position: 3, label_fr: "Je l'ignore ou je le méprise, seul mon esprit compte.",                                           vector: v("sage",S,"mystic",S, "lover",L,"warrior",L) },
      { position: 4, label_fr: "Je le néglige parce que je suis trop occupé(e) à soigner les autres.",                           vector: v("caregiver",S,"victim",S, "sovereign",L,"magician",L) },
      { position: 5, label_fr: "Je le vois comme une toile vierge pour exprimer ma différence (tatouages, style).",               vector: v("rebel",L,"creator",L, "child",S,"saboteur",S) },
      { position: 6, label_fr: "C'est un récepteur d'énergie que j'utilise pour capter l'invisible.",                            vector: v("magician",L,"healer",L, "warrior",S,"sage",S) },
    ],
  },
  {
    house: 1, position: 6,
    prompt_fr: "Quelle phrase décrit le mieux votre rapport à vous-même en ce moment ?",
    options: [
      { position: 1, label_fr: "Je ne fais pas assez, je devrais être plus loin dans la vie.",                                    vector: v("saboteur",S,"warrior",S, "child",L,"mystic",L) },
      { position: 2, label_fr: "Qui suis-je vraiment derrière toutes ces responsabilités ?",                                      vector: v("sovereign",S,"caregiver",S, "explorer",L,"rebel",L) },
      { position: 3, label_fr: "Je suis un miracle de la vie en constante évolution.",                                            vector: v("mystic",L,"healer",L, "victim",S,"prostitute",S) },
      { position: 4, label_fr: "J'ai l'impression d'être une fraude et qu'on va finir par s'en rendre compte.",                  vector: v("prostitute",S,"sage",S, "warrior",L,"creator",L) },
      { position: 5, label_fr: "Je m'aime tel(le) que je suis, avec mes zones d'ombre.",                                         vector: v("lover",L,"sage",L, "victim",S,"child",S) },
      { position: 6, label_fr: "Pourquoi dois-je supporter tout le poids du monde ?",                                             vector: v("victim",S,"caregiver",S, "jester",L,"rebel",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 2 : VALEURS & RESSOURCES (Argent, sécurité et estime de soi)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 2, position: 1,
    prompt_fr: "Pour vous, l'argent représente avant tout...",
    options: [
      { position: 1, label_fr: "Le pouvoir de bâtir, de protéger mon territoire et d'imposer mes règles.",                       vector: v("sovereign",L,"warrior",L, "mystic",S,"child",S) },
      { position: 2, label_fr: "Une énergie spirituelle qui doit circuler pour créer de l'abondance.",                            vector: v("magician",L,"healer",L, "prostitute",S,"victim",S) },
      { position: 3, label_fr: "Un fardeau angoissant. J'ai toujours peur de manquer.",                                           vector: v("child",S,"victim",S, "sovereign",L,"creator",L) },
      { position: 4, label_fr: "Le moyen d'acheter ma liberté absolue et mon indépendance.",                                      vector: v("explorer",L,"rebel",L, "caregiver",S,"lover",S) },
      { position: 5, label_fr: "Une chose matérielle sale ou impure dont je me méfie.",                                           vector: v("mystic",S,"sage",S, "prostitute",L,"magician",L) },
      { position: 6, label_fr: "Un outil pour prendre soin de ceux que j'aime avant tout.",                                       vector: v("caregiver",L,"lover",L, "saboteur",S,"rebel",S) },
    ],
  },
  {
    house: 2, position: 2,
    prompt_fr: "Si vous perdiez tout votre argent et vos biens matériels demain, votre réaction profonde serait...",
    options: [
      { position: 1, label_fr: "Je m'effondre, ma valeur personnelle disparaît avec mes biens.",                                  vector: v("prostitute",S,"victim",S, "sage",L,"mystic",L) },
      { position: 2, label_fr: "Je ressens un soulagement secret. Enfin libéré(e) du matériel !",                                vector: v("rebel",L,"explorer",L, "sovereign",S,"warrior",S) },
      { position: 3, label_fr: "J'élabore un plan stratégique froid pour tout reconstruire en double.",                           vector: v("sovereign",L,"sage",L, "child",S,"lover",S) },
      { position: 4, label_fr: "J'y vois l'occasion d'une renaissance alchimique par le vide.",                                   vector: v("magician",L,"mystic",L, "victim",S,"caregiver",S) },
      { position: 5, label_fr: "Je fonce travailler jour et nuit jusqu'à l'épuisement pour survivre.",                           vector: v("warrior",S,"saboteur",S, "healer",L,"jester",L) },
      { position: 6, label_fr: "Je m'appuie sur mon réseau et ma communauté pour être sauvé(e).",                                vector: v("child",S,"caregiver",S, "warrior",L,"creator",L) },
    ],
  },
  {
    house: 2, position: 3,
    prompt_fr: "Lorsque vous faites un achat impulsif et coûteux, c'est généralement parce que...",
    options: [
      { position: 1, label_fr: "Je culpabilise atrocement après, pensant que je ne le mérite pas.",                               vector: v("saboteur",S,"victim",S, "sovereign",L,"lover",L) },
      { position: 2, label_fr: "Je l'achète pour combler un vide affectif ou me consoler.",                                       vector: v("lover",S,"child",S, "sage",L,"healer",L) },
      { position: 3, label_fr: "Je rationalise l'achat en prouvant que c'était un 'investissement'.",                            vector: v("sage",S,"prostitute",S, "jester",L,"explorer",L) },
      { position: 4, label_fr: "Je m'en fiche, l'argent est fait pour être brûlé et célébré !",                                  vector: v("jester",L,"lover",L, "sovereign",S,"caregiver",S) },
      { position: 5, label_fr: "Je n'achète jamais impulsivement, je calcule chaque centime au millimètre.",                     vector: v("sovereign",S,"warrior",S, "magician",L,"child",L) },
      { position: 6, label_fr: "Je l'achète seulement si ça peut être utile à quelqu'un d'autre que moi.",                      vector: v("caregiver",S,"victim",S, "creator",L,"explorer",L) },
    ],
  },
  {
    house: 2, position: 4,
    prompt_fr: "Quelle est la chose qui, pour vous, ne s'achète vraiment pas ?",
    options: [
      { position: 1, label_fr: "Ma liberté de mouvement et de pensée.",                                                           vector: v("explorer",L,"rebel",L, "prostitute",S,"caregiver",S) },
      { position: 2, label_fr: "Mon autorité et mon droit de décision sur ma vie.",                                               vector: v("sovereign",L,"warrior",L, "victim",S,"child",S) },
      { position: 3, label_fr: "Mon intégrité intellectuelle et ma vérité.",                                                      vector: v("sage",L,"magician",L, "prostitute",S,"lover",S) },
      { position: 4, label_fr: "Mon art, mon âme et mon authenticité.",                                                           vector: v("creator",L,"mystic",L, "prostitute",S,"sovereign",S) },
      { position: 5, label_fr: "Mes liens d'amour et ma loyauté envers les miens.",                                              vector: v("lover",L,"caregiver",L, "explorer",S,"sage",S) },
      { position: 6, label_fr: "Je pense que tout s'achète, il suffit d'y mettre le prix.",                                      vector: v("prostitute",S,"saboteur",S, "mystic",L,"healer",L) },
    ],
  },
  {
    house: 2, position: 5,
    prompt_fr: "Lorsqu'on vous fait un vrai compliment sur vos compétences ou votre valeur, vous...",
    options: [
      { position: 1, label_fr: "Je le minimise ou je le rejette par syndrome de l'imposteur.",                                   vector: v("saboteur",S,"victim",S, "sovereign",L,"creator",L) },
      { position: 2, label_fr: "Je l'accueille pleinement, je sais ce que je vaux.",                                              vector: v("sovereign",L,"creator",L, "child",S,"caregiver",S) },
      { position: 3, label_fr: "Je renvoie immédiatement un compliment pour ne pas être en dette.",                               vector: v("caregiver",S,"prostitute",S, "warrior",L,"sage",L) },
      { position: 4, label_fr: "Je l'analyse pour comprendre ce que la personne attend de moi en retour.",                       vector: v("magician",S,"sage",S, "child",L,"lover",L) },
      { position: 5, label_fr: "Je rougis et je me sens comme un enfant pris en faute.",                                         vector: v("child",S,"lover",S, "rebel",L,"explorer",L) },
      { position: 6, label_fr: "Je le prends avec humour et autodérision.",                                                       vector: v("jester",L,"rebel",L, "sovereign",S,"sage",S) },
    ],
  },
  {
    house: 2, position: 6,
    prompt_fr: "Que faites-vous de vos dons naturels et de vos talents ?",
    options: [
      { position: 1, label_fr: "Je les exploite stratégiquement pour bâtir un empire concret.",                                   vector: v("sovereign",L,"creator",L, "mystic",S,"explorer",S) },
      { position: 2, label_fr: "Je les offre gratuitement jusqu'à m'épuiser.",                                                    vector: v("caregiver",S,"healer",S, "prostitute",L,"sovereign",L) },
      { position: 3, label_fr: "Je les cache par peur qu'ils ne soient pas parfaits.",                                            vector: v("creator",S,"saboteur",S, "warrior",L,"magician",L) },
      { position: 4, label_fr: "Je les accumule (formations, diplômes) mais je n'en fais rien.",                                 vector: v("sage",S,"explorer",S, "warrior",L,"rebel",L) },
      { position: 5, label_fr: "Je m'en sers pour manipuler l'énergie et ouvrir des portes.",                                    vector: v("magician",L,"lover",L, "victim",S,"child",S) },
      { position: 6, label_fr: "Je refuse de les monétiser pour qu'ils restent purs.",                                            vector: v("mystic",S,"rebel",S, "creator",L,"prostitute",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 3 : COMMUNICATION & ENTOURAGE (Le mental concret et la fratrie)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 3, position: 1,
    prompt_fr: "Quand vous expliquez quelque chose de complexe à quelqu'un qui ne comprend pas, vous...",
    options: [
      { position: 1, label_fr: "Je deviens magistral et j'attends qu'on m'écoute sans m'interrompre.",                           vector: v("sage",L,"sovereign",L, "child",S,"jester",S) },
      { position: 2, label_fr: "J'utilise l'humour et des métaphores absurdes pour faire passer le message.",                    vector: v("jester",L,"magician",L, "sage",S,"caregiver",S) },
      { position: 3, label_fr: "J'adapte mon discours émotionnellement pour ne blesser personne.",                               vector: v("healer",L,"caregiver",L, "warrior",S,"prostitute",S) },
      { position: 4, label_fr: "Je perds patience rapidement s'ils ne comprennent pas assez vite.",                              vector: v("warrior",S,"sovereign",S, "caregiver",L,"healer",L) },
      { position: 5, label_fr: "Je manipule l'information pour qu'ils arrivent à la conclusion que je veux.",                    vector: v("magician",S,"prostitute",S, "sage",L,"mystic",L) },
      { position: 6, label_fr: "Je m'embrouille et j'abandonne, en me disant qu'on ne me comprend jamais.",                     vector: v("victim",S,"child",S, "warrior",L,"creator",L) },
    ],
  },
  {
    house: 3, position: 2,
    prompt_fr: "Dans un débat ou une discussion qui s'enflamme, vous...",
    options: [
      { position: 1, label_fr: "Je tranche la conversation d'un coup, imposant ma loi.",                                          vector: v("sovereign",S,"warrior",S, "lover",L,"child",L) },
      { position: 2, label_fr: "Je me fais l'avocat du diable juste pour le plaisir de détruire leur logique.",                  vector: v("rebel",L,"jester",L, "caregiver",S,"healer",S) },
      { position: 3, label_fr: "Je me tais pour éviter le conflit, ravalant ma vérité.",                                          vector: v("caregiver",S,"victim",S, "warrior",L,"sovereign",L) },
      { position: 4, label_fr: "J'écoute activement pour trouver le terrain d'entente et guérir la fracture.",                   vector: v("healer",L,"lover",L, "saboteur",S,"rebel",S) },
      { position: 5, label_fr: "Je démonte leurs arguments avec une froideur analytique implacable.",                             vector: v("sage",S,"magician",L, "lover",S,"mystic",S) },
      { position: 6, label_fr: "Je quitte la pièce, mon esprit est déjà ailleurs.",                                               vector: v("explorer",S,"mystic",S, "warrior",L,"sovereign",L) },
    ],
  },
  {
    house: 3, position: 3,
    prompt_fr: "Votre rapport à l'information et aux nouvelles du monde...",
    options: [
      { position: 1, label_fr: "Je suis une éponge anxieuse, j'absorbe tout le chaos du monde.",                                  vector: v("victim",S,"healer",S, "sovereign",L,"sage",L) },
      { position: 2, label_fr: "Je filtre drastiquement : je ne lis que ce qui est utile à mes objectifs.",                      vector: v("sovereign",L,"warrior",L, "explorer",S,"child",S) },
      { position: 3, label_fr: "Je papillonne de sujet en sujet, toujours avide de nouveauté mais sans creuser.",                vector: v("explorer",S,"child",S, "sage",L,"creator",L) },
      { position: 4, label_fr: "Je cherche la vérité cachée derrière la matrice de l'information.",                              vector: v("magician",L,"rebel",L, "prostitute",S,"caregiver",S) },
      { position: 5, label_fr: "Je lis pour le pur plaisir esthétique et poétique de la langue.",                                vector: v("lover",L,"creator",L, "saboteur",S,"warrior",S) },
      { position: 6, label_fr: "Je déconnecte totalement, le bruit mental du monde me fatigue.",                                  vector: v("mystic",L,"explorer",L, "prostitute",S,"sovereign",S) },
    ],
  },
  {
    house: 3, position: 4,
    prompt_fr: "Dans votre famille ou groupe de proches, quel rôle jouez-vous naturellement ?",
    options: [
      { position: 1, label_fr: "Je suis le roc protecteur sur lequel tout le monde s'appuie.",                                   vector: v("sovereign",L,"caregiver",L, "child",S,"victim",S) },
      { position: 2, label_fr: "Je suis le vilain petit canard qui fait tout différemment des autres.",                           vector: v("rebel",L,"explorer",L, "caregiver",S,"lover",S) },
      { position: 3, label_fr: "Je joue le rôle de l'enfant modèle ou du pacificateur sacrifié.",                                vector: v("child",S,"caregiver",S, "warrior",L,"rebel",L) },
      { position: 4, label_fr: "Je les fuis pour préserver mon indépendance absolue.",                                            vector: v("explorer",S,"mystic",S, "lover",L,"healer",L) },
      { position: 5, label_fr: "J'entretiens des relations superficielles et cordiales, sans jamais m'engager.",                 vector: v("prostitute",S,"magician",S, "healer",L,"lover",L) },
      { position: 6, label_fr: "Je suis leur guide spirituel ou le guérisseur secret de la famille.",                            vector: v("healer",L,"mystic",L, "saboteur",S,"victim",S) },
    ],
  },
  {
    house: 3, position: 5,
    prompt_fr: "Quel type de mensonge vous arrive-t-il de dire ?",
    options: [
      { position: 1, label_fr: "\"Tout va bien\", pour ne pas montrer ma vulnérabilité.",                                        vector: v("warrior",S,"sovereign",S, "child",L,"lover",L) },
      { position: 2, label_fr: "\"C'est la faute de X\", pour fuir mes responsabilités.",                                        vector: v("victim",S,"child",S, "sovereign",L,"warrior",L) },
      { position: 3, label_fr: "\"Oui, je le ferai\", alors que je sais que je n'en ai pas l'intention.",                        vector: v("prostitute",S,"saboteur",S, "sage",L,"creator",L) },
      { position: 4, label_fr: "\"Je l'ai fait exprès\", pour transformer une erreur en acte maîtrisé.",                        vector: v("magician",S,"sovereign",S, "jester",L,"healer",L) },
      { position: 5, label_fr: "\"Je suis occupé\", pour justifier mon besoin d'isolement sans blesser.",                       vector: v("explorer",S,"caregiver",S, "rebel",L,"sovereign",L) },
      { position: 6, label_fr: "Je ne mens jamais, quitte à être d'une honnêteté brutale et destructrice.",                     vector: v("sage",S,"rebel",S, "healer",L,"caregiver",L) },
    ],
  },
  {
    house: 3, position: 6,
    prompt_fr: "Lorsque quelqu'un vous coupe la parole en public, vous...",
    options: [
      { position: 1, label_fr: "J'hausse la voix et j'impose le respect par ma présence.",                                        vector: v("sovereign",L,"warrior",L, "victim",S,"child",S) },
      { position: 2, label_fr: "Je me tais définitivement, frustré(e) et rancunier(e).",                                         vector: v("victim",S,"child",S, "warrior",L,"sovereign",L) },
      { position: 3, label_fr: "Je le coupe en retour avec un sarcasme mordant.",                                                  vector: v("jester",S,"rebel",S, "caregiver",L,"healer",L) },
      { position: 4, label_fr: "Je laisse couler avec compassion, percevant son besoin anxieux d'exister.",                      vector: v("healer",L,"mystic",L, "prostitute",S,"saboteur",S) },
      { position: 5, label_fr: "Je l'écoute jusqu'au bout puis je démonte tout ce qu'il a dit.",                                 vector: v("sage",L,"magician",L, "lover",S,"caregiver",S) },
      { position: 6, label_fr: "Je détourne l'attention en charismatisant la conversation.",                                      vector: v("lover",L,"magician",L, "sage",S,"explorer",S) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 4 : FOYER & RACINES (Famille, ancrage et monde émotionnel privé)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 4, position: 1,
    prompt_fr: "Votre espace de vie idéal ressemble à...",
    options: [
      { position: 1, label_fr: "C'est mon laboratoire secret pour étudier et manipuler des idées complexes.",                    vector: v("magician",L,"sage",L, "lover",S,"explorer",S) },
      { position: 2, label_fr: "C'est mon château fort. J'ai besoin de contrôle total sur qui y entre.",                         vector: v("sovereign",S,"warrior",S, "jester",L,"child",L) },
      { position: 3, label_fr: "Un espace de création chaotique et vibrant où je peux être moi-même.",                           vector: v("creator",L,"jester",L, "sovereign",S,"saboteur",S) },
      { position: 4, label_fr: "C'est un sanctuaire de guérison pour moi et ceux que j'abrite.",                                 vector: v("healer",L,"caregiver",L, "rebel",S,"warrior",S) },
      { position: 5, label_fr: "Un lieu où je peux enfin m'effondrer et me laisser aller.",                                       vector: v("victim",S,"child",S, "creator",L,"magician",L) },
      { position: 6, label_fr: "Je n'ai pas de port d'attache, mon foyer est partout et nulle part.",                            vector: v("explorer",L,"mystic",L, "caregiver",S,"prostitute",S) },
    ],
  },
  {
    house: 4, position: 2,
    prompt_fr: "Concernant votre lignée familiale et votre héritage émotionnel, vous...",
    options: [
      { position: 1, label_fr: "Je porte la croix de ma lignée, je subis les traumas de mes parents.",                           vector: v("victim",S,"child",S, "magician",L,"sovereign",L) },
      { position: 2, label_fr: "Je suis le mouton noir qui a brisé toutes les traditions familiales.",                            vector: v("rebel",L,"creator",L, "caregiver",S,"lover",S) },
      { position: 3, label_fr: "Je transforme et transmute l'énergie de ma lignée pour en faire de la force.",                   vector: v("magician",L,"healer",L, "saboteur",S,"victim",S) },
      { position: 4, label_fr: "Je suis le gardien des secrets et de la mémoire de ma famille.",                                  vector: v("sage",L,"caregiver",L, "jester",S,"rebel",S) },
      { position: 5, label_fr: "Je détruis subtilement ce qu'ils m'ont légué pour ne rien leur devoir.",                         vector: v("saboteur",S,"prostitute",S, "mystic",L,"creator",L) },
      { position: 6, label_fr: "Je m'en amuse, je trouve l'histoire de ma famille totalement absurde et drôle.",                vector: v("jester",L,"explorer",L, "sovereign",S,"warrior",S) },
    ],
  },
  {
    house: 4, position: 3,
    prompt_fr: "Lors d'un conflit familial émotionnel et explosif, vous...",
    options: [
      { position: 1, label_fr: "J'utilise l'humour noir pour désamorcer l'agressivité de tout le monde.",                        vector: v("jester",L,"magician",L, "warrior",S,"sovereign",S) },
      { position: 2, label_fr: "Je m'isole physiquement, je me déconnecte du drame.",                                             vector: v("mystic",S,"explorer",S, "healer",L,"caregiver",L) },
      { position: 3, label_fr: "Je fuis mes responsabilités et je dis ce qu'ils veulent entendre pour avoir la paix.",           vector: v("prostitute",S,"victim",S, "rebel",L,"creator",L) },
      { position: 4, label_fr: "Je règle le problème immédiatement, quitte à être tyrannique.",                                   vector: v("sovereign",S,"warrior",S, "lover",L,"child",L) },
      { position: 5, label_fr: "Je perçois la dynamique cachée et j'orchestre une résolution invisible.",                         vector: v("magician",L,"healer",L, "saboteur",S,"rebel",S) },
      { position: 6, label_fr: "Je m'en veux de ne pas avoir réussi à maintenir l'harmonie.",                                    vector: v("caregiver",S,"saboteur",S, "warrior",L,"jester",L) },
    ],
  },
  {
    house: 4, position: 4,
    prompt_fr: "Le secret le plus difficile que vous cachez à votre famille est...",
    options: [
      { position: 1, label_fr: "Que je pourrais tous les abandonner demain matin pour vivre ma vie.",                             vector: v("explorer",S,"rebel",S, "lover",L,"caregiver",L) },
      { position: 2, label_fr: "Que je me sens souvent comme un petit enfant terrifié à l'intérieur.",                           vector: v("child",S,"victim",S, "sovereign",L,"warrior",L) },
      { position: 3, label_fr: "Que ma prétendue 'folie douce' cache une profonde dépression.",                                   vector: v("jester",S,"creator",S, "sage",L,"magician",L) },
      { position: 4, label_fr: "Que je sabote secrètement notre bonheur parce que j'ai peur de le perdre.",                      vector: v("saboteur",S,"prostitute",S, "healer",L,"creator",L) },
      { position: 5, label_fr: "Que j'étudie leurs comportements au lieu de ressentir vraiment les choses.",                     vector: v("sage",S,"magician",S, "lover",L,"healer",L) },
      { position: 6, label_fr: "Que je me sacrifie seulement parce que j'ai besoin qu'on ait besoin de moi.",                   vector: v("caregiver",S,"healer",S, "rebel",L,"explorer",L) },
    ],
  },
  {
    house: 4, position: 5,
    prompt_fr: "La maison de vos rêves serait...",
    options: [
      { position: 1, label_fr: "Un grand chapiteau, rempli d'amis, de rires, de jeux et de surprises.",                         vector: v("jester",L,"lover",L, "sage",S,"mystic",S) },
      { position: 2, label_fr: "Un atelier d'artiste débordant d'outils, de couleurs et d'inspirations.",                        vector: v("creator",L,"magician",L, "sovereign",S,"caregiver",S) },
      { position: 3, label_fr: "Un domaine parfaitement géré, propre, luxueux et impénétrable.",                                  vector: v("sovereign",L,"warrior",L, "child",S,"jester",S) },
      { position: 4, label_fr: "Une bibliothèque silencieuse perdue au milieu d'une forêt.",                                      vector: v("sage",L,"mystic",L, "lover",S,"prostitute",S) },
      { position: 5, label_fr: "Un ashram ou une clinique, où tout le monde vient se ressourcer.",                                vector: v("healer",L,"caregiver",L, "saboteur",S,"explorer",S) },
      { position: 6, label_fr: "Je préfère louer ou habiter chez les autres pour ne pas m'engager.",                             vector: v("prostitute",S,"explorer",S, "creator",L,"sovereign",L) },
    ],
  },
  {
    house: 4, position: 6,
    prompt_fr: "Vos blessures d'enfance, aujourd'hui, vous les...",
    options: [
      { position: 1, label_fr: "Je les sublime en en faisant de l'art, des histoires ou des projets.",                           vector: v("creator",L,"magician",L, "victim",S,"saboteur",S) },
      { position: 2, label_fr: "Je m'en moque ouvertement pour ne pas leur donner de pouvoir.",                                   vector: v("jester",L,"rebel",L, "child",S,"caregiver",S) },
      { position: 3, label_fr: "Je les enfouis sous le travail et la discipline acharnée.",                                       vector: v("warrior",S,"sovereign",S, "mystic",L,"healer",L) },
      { position: 4, label_fr: "Je les utilise pour excuser mes échecs ou mes comportements toxiques.",                           vector: v("victim",S,"saboteur",S, "warrior",L,"sovereign",L) },
      { position: 5, label_fr: "Je m'achète la paix en payant pour éviter de regarder en arrière.",                              vector: v("prostitute",S,"explorer",S, "sage",L,"magician",L) },
      { position: 6, label_fr: "Je les dissèque intellectuellement comme si c'était arrivé à un autre.",                        vector: v("sage",S,"mystic",S, "lover",L,"child",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 5 : CRÉATIVITÉ & ÉROS (Plaisir, enfants, expression artistique)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 5, position: 1,
    prompt_fr: "Votre processus créatif ressemble à...",
    options: [
      { position: 1, label_fr: "C'est une obsession alchimique, je veux modifier la réalité avec ma vision.",                    vector: v("magician",L,"creator",L, "victim",S,"prostitute",S) },
      { position: 2, label_fr: "C'est un acte de joie pure et d'improvisation totale.",                                           vector: v("jester",L,"child",L, "sage",S,"sovereign",S) },
      { position: 3, label_fr: "Je ne termine jamais parce que le résultat ne sera jamais assez parfait.",                       vector: v("saboteur",S,"creator",S, "warrior",L,"magician",L) },
      { position: 4, label_fr: "Je crée uniquement si ça peut se vendre ou m'apporter du statut.",                               vector: v("prostitute",S,"sovereign",S, "mystic",L,"creator",L) },
      { position: 5, label_fr: "C'est un cri de rébellion pour détruire les anciens codes.",                                     vector: v("rebel",L,"explorer",L, "caregiver",S,"healer",S) },
      { position: 6, label_fr: "J'ai besoin de suivre des règles précises pour me sentir en sécurité.",                          vector: v("sage",S,"warrior",S, "creator",L,"jester",L) },
    ],
  },
  {
    house: 5, position: 2,
    prompt_fr: "Votre rapport au jeu et au plaisir spontané est...",
    options: [
      { position: 1, label_fr: "J'adore jouer. La vie est une vaste farce, autant s'amuser !",                                   vector: v("jester",L,"lover",L, "sovereign",S,"sage",S) },
      { position: 2, label_fr: "Je me laisse facilement entraîner, je suis un grand enfant.",                                     vector: v("child",L,"creator",L, "saboteur",S,"warrior",S) },
      { position: 3, label_fr: "Je ne joue que pour gagner. Le plaisir vient de la victoire.",                                    vector: v("warrior",S,"sovereign",L, "jester",L,"mystic",L) },
      { position: 4, label_fr: "Je trouve ça futile et je m'ennuie vite. Je préfère le travail profond.",                        vector: v("sage",S,"mystic",S, "child",L,"creator",L) },
      { position: 5, label_fr: "Je feins de m'amuser pour plaire aux autres, mais je m'éteins.",                                  vector: v("prostitute",S,"caregiver",S, "rebel",L,"jester",L) },
      { position: 6, label_fr: "Je crée mes propres règles du jeu pour que personne ne puisse me contrôler.",                    vector: v("magician",S,"rebel",L, "victim",S,"caregiver",L) },
    ],
  },
  {
    house: 5, position: 3,
    prompt_fr: "Face à un désir ou une attraction intense, vous...",
    options: [
      { position: 1, label_fr: "Je plonge dedans totalement, fusionnant avec l'objet de mon désir.",                              vector: v("lover",L,"creator",L, "saboteur",S,"sage",S) },
      { position: 2, label_fr: "Je sabote la relation ou le projet dès que ça devient trop beau.",                                vector: v("saboteur",S,"rebel",S, "healer",L,"lover",L) },
      { position: 3, label_fr: "J'utilise mon magnétisme pour posséder l'autre sans me donner vraiment.",                         vector: v("magician",S,"prostitute",S, "caregiver",L,"child",L) },
      { position: 4, label_fr: "Je m'amuse de la situation, je flirte mais je refuse le drame.",                                  vector: v("jester",L,"explorer",L, "victim",S,"lover",S) },
      { position: 5, label_fr: "Je deviens immédiatement dépendant(e) et obsédé(e) par la perte.",                               vector: v("victim",S,"child",S, "warrior",L,"sovereign",L) },
      { position: 6, label_fr: "Je garde la tête froide et j'analyse mes émotions avant d'agir.",                                vector: v("sage",L,"mystic",L, "lover",S,"jester",S) },
    ],
  },
  {
    house: 5, position: 4,
    prompt_fr: "Lorsque vos créations ou projets sont critiqués, vous...",
    options: [
      { position: 1, label_fr: "Je tourne la critique en dérision et je fais une blague sur moi-même.",                          vector: v("jester",L,"rebel",L, "victim",S,"child",S) },
      { position: 2, label_fr: "Je doute immédiatement de moi et je détruis ce que j'ai fait.",                                   vector: v("creator",S,"saboteur",S, "sovereign",L,"warrior",L) },
      { position: 3, label_fr: "Je vends mes principes et je modifie mon œuvre pour qu'elle plaise.",                            vector: v("prostitute",S,"caregiver",S, "rebel",L,"magician",L) },
      { position: 4, label_fr: "J'utilise cette critique comme un matériau pour une transmutation alchimique.",                   vector: v("magician",L,"creator",L, "warrior",S,"sage",S) },
      { position: 5, label_fr: "Je les attaque sur leur manque de vision et de connaissance.",                                    vector: v("sovereign",S,"sage",S, "healer",L,"child",L) },
      { position: 6, label_fr: "Ça m'est égal, je crée pour l'expérience spirituelle, pas pour le public.",                     vector: v("mystic",L,"explorer",L, "prostitute",S,"lover",S) },
    ],
  },
  {
    house: 5, position: 5,
    prompt_fr: "Votre relation à la parentalité ou à la transmission...",
    options: [
      { position: 1, label_fr: "C'est une extension de mon empire, ça doit être parfait.",                                        vector: v("sovereign",S,"creator",S, "child",L,"jester",L) },
      { position: 2, label_fr: "C'est une expérience magique pour ramener de la beauté dans le monde.",                          vector: v("creator",L,"magician",L, "saboteur",S,"victim",S) },
      { position: 3, label_fr: "J'ai très peur de ne pas être à la hauteur et de les abîmer.",                                   vector: v("child",S,"healer",S, "warrior",L,"sovereign",L) },
      { position: 4, label_fr: "Je veux juste partager de l'amour inconditionnel et de la joie.",                                vector: v("lover",L,"caregiver",L, "explorer",S,"sage",S) },
      { position: 5, label_fr: "Je refuse de me lier. Je veux préserver mon temps libre avant tout.",                             vector: v("explorer",S,"rebel",S, "caregiver",L,"creator",L) },
      { position: 6, label_fr: "Je vends mon temps à des projets futiles plutôt que de m'engager vraiment.",                    vector: v("prostitute",S,"saboteur",S, "magician",L,"mystic",L) },
    ],
  },
  {
    house: 5, position: 6,
    prompt_fr: "Ce qui brise littéralement l'enchantement dans une relation romantique...",
    options: [
      { position: 1, label_fr: "La routine, les règles, le manque de folie et d'humour.",                                         vector: v("jester",L,"rebel",L, "sage",S,"warrior",S) },
      { position: 2, label_fr: "Le sentiment d'être utilisé(e) ou acheté(e).",                                                   vector: v("prostitute",S,"caregiver",S, "lover",L,"sovereign",L) },
      { position: 3, label_fr: "Le manque de connexion profonde et magique.",                                                      vector: v("magician",L,"lover",L, "explorer",S,"jester",S) },
      { position: 4, label_fr: "L'impression de ne pas être à la hauteur ou d'être jugé(e).",                                    vector: v("saboteur",S,"victim",S, "creator",L,"warrior",L) },
      { position: 5, label_fr: "Le chaos, la saleté ou la perte de contrôle de la situation.",                                    vector: v("sovereign",S,"warrior",S, "child",L,"mystic",L) },
      { position: 6, label_fr: "La superficialité ou le manque de sens spirituel.",                                               vector: v("mystic",L,"sage",L, "lover",S,"prostitute",S) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 6 : QUOTIDIEN & SANTÉ (Travail de l'ombre, routine, service)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 6, position: 1,
    prompt_fr: "Votre rapport aux tâches répétitives et à la routine quotidienne...",
    options: [
      { position: 1, label_fr: "Je transforme la routine en rituel magique pour la rendre sacrée.",                               vector: v("magician",L,"mystic",L, "jester",S,"rebel",S) },
      { position: 2, label_fr: "Je procrastine, je fais le pitre ou je trouve toujours une excuse.",                              vector: v("jester",S,"child",S, "sovereign",L,"warrior",L) },
      { position: 3, label_fr: "J'automatise et j'optimise tout avec une discipline de fer.",                                      vector: v("warrior",L,"sage",L, "creator",S,"lover",S) },
      { position: 4, label_fr: "Je fais semblant de travailler ou j'en fais le minimum pour être payé.",                         vector: v("prostitute",S,"saboteur",S, "explorer",L,"magician",L) },
      { position: 5, label_fr: "Je délègue tout. Je ne suis pas fait pour la logistique.",                                        vector: v("sovereign",S,"creator",S, "caregiver",L,"healer",L) },
      { position: 6, label_fr: "Je m'invente des tâches inutiles pour me prouver que je suis actif(ve).",                        vector: v("saboteur",S,"victim",S, "mystic",L,"jester",L) },
    ],
  },
  {
    house: 6, position: 2,
    prompt_fr: "Lorsque vous tombez malade, vous...",
    options: [
      { position: 1, label_fr: "Je comprends que mon corps me parle et je cherche le sens profond du mal.",                       vector: v("healer",L,"magician",L, "warrior",S,"sovereign",S) },
      { position: 2, label_fr: "Je râle, je me plains, et j'attends qu'on s'occupe de moi.",                                     vector: v("victim",S,"child",S, "healer",L,"caregiver",L) },
      { position: 3, label_fr: "Je l'ignore, je prends un cachet et je continue à travailler.",                                   vector: v("warrior",S,"sovereign",S, "child",L,"lover",L) },
      { position: 4, label_fr: "Je m'amuse de ma condition et j'en fais des blagues à mes proches.",                              vector: v("jester",L,"rebel",L, "sage",S,"mystic",S) },
      { position: 5, label_fr: "Je paie les meilleurs médecins pour régler ça vite, sans y penser.",                              vector: v("prostitute",S,"explorer",S, "mystic",L,"magician",L) },
      { position: 6, label_fr: "Je m'en sers comme excuse pour enfin me reposer (auto-sabotage).",                               vector: v("saboteur",S,"victim",S, "warrior",L,"creator",L) },
    ],
  },
  {
    house: 6, position: 3,
    prompt_fr: "Votre rapport au travail en général...",
    options: [
      { position: 1, label_fr: "Mon travail est mon art, il doit être créatif et me faire vibrer.",                               vector: v("creator",L,"lover",L, "prostitute",S,"saboteur",S) },
      { position: 2, label_fr: "Je travaille pour être libre. Tant que c'est bien payé, ça me va.",                              vector: v("prostitute",S,"explorer",L, "mystic",L,"caregiver",L) },
      { position: 3, label_fr: "Je suis ici pour alléger les souffrances, même si ça m'épuise.",                                 vector: v("caregiver",S,"healer",S, "sovereign",L,"jester",L) },
      { position: 4, label_fr: "Je suis là pour révolutionner mon industrie et casser la matrice.",                               vector: v("rebel",L,"magician",L, "sage",S,"caregiver",S) },
      { position: 5, label_fr: "Le travail n'a aucun sens, la vie est une vaste farce.",                                          vector: v("jester",S,"mystic",S, "creator",L,"warrior",L) },
      { position: 6, label_fr: "Je sers le plus grand bien, sans attachement aux résultats.",                                     vector: v("mystic",L,"sage",L, "sovereign",S,"child",S) },
    ],
  },
  {
    house: 6, position: 4,
    prompt_fr: "Face à un collègue paresseux, vous...",
    options: [
      { position: 1, label_fr: "Je m'en moque ouvertement devant tout le monde pour le piquer.",                                  vector: v("jester",S,"rebel",S, "caregiver",L,"healer",L) },
      { position: 2, label_fr: "Je fais son travail à sa place en soupirant que je suis toujours seul(e).",                     vector: v("victim",S,"caregiver",S, "warrior",L,"sovereign",L) },
      { position: 3, label_fr: "Je crée un levier psychologique subtil pour qu'il s'y mette sans s'en rendre compte.",          vector: v("magician",L,"sage",L, "child",S,"saboteur",S) },
      { position: 4, label_fr: "Je l'aborde directement et exige de la discipline et des résultats.",                             vector: v("warrior",L,"sovereign",L, "victim",S,"prostitute",S) },
      { position: 5, label_fr: "Je sabote mon propre travail pour prouver qu'il a ruiné l'équipe.",                              vector: v("saboteur",S,"victim",S, "creator",L,"magician",L) },
      { position: 6, label_fr: "Je l'aide à trouver sa vraie passion, car il n'est visiblement pas à sa place.",                vector: v("healer",L,"explorer",L, "sovereign",S,"warrior",S) },
    ],
  },
  {
    house: 6, position: 5,
    prompt_fr: "Votre rapport au ménage et à l'organisation de votre espace...",
    options: [
      { position: 1, label_fr: "C'est une forme de méditation, mettre de l'ordre à l'extérieur ordonne l'intérieur.",           vector: v("mystic",L,"sage",L, "jester",S,"rebel",S) },
      { position: 2, label_fr: "Je déteste l'ordre, mon esprit a besoin de chaos créatif pour exister.",                         vector: v("creator",L,"rebel",L, "sovereign",S,"warrior",S) },
      { position: 3, label_fr: "Je suis maniaque, si ce n'est pas parfait, j'ai l'impression de perdre le contrôle.",           vector: v("sovereign",S,"warrior",S, "child",L,"explorer",L) },
      { position: 4, label_fr: "Je paie quelqu'un pour s'en occuper, je ne veux pas me salir les mains.",                       vector: v("prostitute",S,"magician",S, "healer",L,"caregiver",L) },
      { position: 5, label_fr: "Je laisse traîner jusqu'à ce que ce soit invivable, puis je me punis en rangeant.",              vector: v("saboteur",S,"victim",S, "creator",L,"lover",L) },
      { position: 6, label_fr: "Je tourne le ménage en jeu, avec de la musique à fond.",                                          vector: v("jester",L,"child",L, "sage",S,"mystic",S) },
    ],
  },
  {
    house: 6, position: 6,
    prompt_fr: "Votre principal signe de burn-out personnel est...",
    options: [
      { position: 1, label_fr: "Des blocages créatifs, une incapacité totale à produire quoi que ce soit.",                      vector: v("creator",S,"saboteur",S, "warrior",L,"magician",L) },
      { position: 2, label_fr: "Une perte totale d'énergie, l'impression d'être vidé(e) par des vampires.",                     vector: v("healer",S,"caregiver",S, "sovereign",L,"explorer",L) },
      { position: 3, label_fr: "Un sentiment de dépersonnalisation, comme si je n'étais plus dans mon corps.",                   vector: v("mystic",S,"magician",S, "child",L,"lover",L) },
      { position: 4, label_fr: "Des tensions musculaires extrêmes, la mâchoire serrée, le dos bloqué.",                          vector: v("warrior",S,"sovereign",S, "jester",L,"mystic",L) },
      { position: 5, label_fr: "Des crises d'angoisse d'abandon ou une immense vulnérabilité infantile.",                        vector: v("child",S,"victim",S, "sage",L,"creator",L) },
      { position: 6, label_fr: "Une hyperactivité cynique, je ne dors plus et je trouve tout absurde.",                           vector: v("jester",S,"rebel",S, "healer",L,"caregiver",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 7 : PARTENARIATS & MARIAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    house: 7, position: 1,
    prompt_fr: "Comment entrez-vous dans un partenariat ou un engagement important ?",
    options: [
      { position: 1, label_fr: "Je cherche une fusion totale, une connexion d'âme absolue.",                                vector: v("lover",L,"mystic",L, "saboteur",S,"child",S) },
      { position: 2, label_fr: "J'impose mes conditions et je m'assure de garder le contrôle.",                             vector: v("sovereign",S,"warrior",S, "creator",L,"rebel",L) },
      { position: 3, label_fr: "J'étudie l'autre sous toutes ses coutures avant de signer quoi que ce soit.",              vector: v("sage",L,"explorer",L, "lover",S,"magician",L) },
      { position: 4, label_fr: "J'attends qu'on me prenne en charge et qu'on décide pour moi.",                            vector: v("child",S,"victim",S, "caregiver",L,"sovereign",L) },
      { position: 5, label_fr: "Je me sacrifie d'emblée pour prouver ma loyauté.",                                          vector: v("caregiver",S,"prostitute",S, "warrior",L,"healer",L) },
      { position: 6, label_fr: "Je garde toujours une porte de sortie secrète, au cas où.",                                vector: v("saboteur",S,"explorer",S, "jester",L,"rebel",S) },
    ],
  },
  {
    house: 7, position: 2,
    prompt_fr: "Votre peur principale dans toute forme de partenariat est...",
    options: [
      { position: 1, label_fr: "Être abandonné(e) ou remplacé(e).",                                                        vector: v("victim",S,"lover",S, "sage",L,"warrior",L) },
      { position: 2, label_fr: "Perdre mon indépendance et être étouffé(e).",                                               vector: v("rebel",S,"explorer",S, "caregiver",L,"healer",L) },
      { position: 3, label_fr: "Découvrir que l'autre est incompétent ou faible.",                                          vector: v("sovereign",S,"sage",S, "child",L,"lover",L) },
      { position: 4, label_fr: "M'ennuyer à mourir dans la routine conjugale/professionnelle.",                             vector: v("jester",S,"creator",S, "magician",L,"mystic",L) },
      { position: 5, label_fr: "Être trahi(e) financièrement ou utilisé(e) pour mes ressources.",                          vector: v("prostitute",S,"warrior",S, "caregiver",L,"mystic",L) },
      { position: 6, label_fr: "Que l'autre découvre ma face cachée et mes défauts monstrueux.",                           vector: v("saboteur",S,"child",S, "healer",L,"sovereign",L) },
    ],
  },
  {
    house: 7, position: 3,
    prompt_fr: "Lorsqu'on vous trahit profondément dans une relation ou un contrat...",
    options: [
      { position: 1, label_fr: "Je pardonne immédiatement pour éviter la rupture, même si ça fait mal.",                   vector: v("caregiver",S,"victim",S, "warrior",L,"rebel",L) },
      { position: 2, label_fr: "Je coupe les ponts froidement, c'est terminé sans appel.",                                  vector: v("sovereign",S,"sage",S, "healer",L,"lover",L) },
      { position: 3, label_fr: "Je me venge subtilement ou je manipule la situation en coulisse.",                          vector: v("magician",S,"saboteur",S, "mystic",L,"creator",L) },
      { position: 4, label_fr: "Je cherche frénétiquement à comprendre le 'pourquoi' psychologique.",                      vector: v("healer",L,"sage",L, "prostitute",S,"warrior",S) },
      { position: 5, label_fr: "J'explose de rage et je détruis tout ce qu'on a construit.",                               vector: v("warrior",S,"rebel",S, "lover",L,"child",L) },
      { position: 6, label_fr: "Je fuis la discussion et j'agis comme si rien ne s'était passé.",                          vector: v("jester",S,"explorer",S, "caregiver",L,"magician",L) },
    ],
  },
  {
    house: 7, position: 4,
    prompt_fr: "Ce que vous attendez secrètement de votre partenaire ou associé(e)...",
    options: [
      { position: 1, label_fr: "Qu'il me sauve de mes propres démons et de mes échecs.",                                   vector: v("victim",S,"child",S, "sovereign",L,"magician",L) },
      { position: 2, label_fr: "Qu'il me divertisse et maintienne la magie en vie tous les jours.",                        vector: v("jester",S,"creator",S, "sage",L,"explorer",L) },
      { position: 3, label_fr: "Qu'il gère toute l'intendance matérielle pour que je sois libre.",                         vector: v("explorer",S,"prostitute",S, "caregiver",L,"healer",L) },
      { position: 4, label_fr: "Qu'il m'admire inconditionnellement et reconnaisse mon génie.",                             vector: v("creator",S,"sovereign",S, "child",L,"lover",L) },
      { position: 5, label_fr: "Qu'il lise dans mes pensées sans que j'aie à exprimer mes besoins.",                       vector: v("lover",S,"mystic",S, "warrior",L,"sage",L) },
      { position: 6, label_fr: "Je n'attends rien, je préfère tout faire moi-même pour ne rien devoir.",                   vector: v("saboteur",S,"warrior",S, "caregiver",L,"victim",L) },
    ],
  },
  {
    house: 7, position: 5,
    prompt_fr: "Durant une dispute de couple ou professionnelle, votre réflexe est...",
    options: [
      { position: 1, label_fr: "J'utilise des mots tranchants comme des rasoirs pour blesser l'intellect.",                vector: v("sage",S,"magician",S, "healer",L,"caregiver",L) },
      { position: 2, label_fr: "Je pleure et je m'effondre pour qu'il/elle arrête d'attaquer.",                            vector: v("child",S,"victim",S, "warrior",L,"sovereign",L) },
      { position: 3, label_fr: "Je prends une posture de thérapie et j'essaie de guérir l'autre.",                         vector: v("healer",S,"caregiver",S, "rebel",L,"sovereign",L) },
      { position: 4, label_fr: "Je propose une transaction concrète : 'fais ça et j'oublie'.",                              vector: v("prostitute",S,"sovereign",L, "lover",L,"mystic",L) },
      { position: 5, label_fr: "Je retourne la situation pour montrer que je suis le seul rationnel.",                      vector: v("magician",S,"sage",S, "lover",L,"creator",L) },
      { position: 6, label_fr: "Je ris nerveusement ou je fais de l'humour noir déplacé.",                                 vector: v("jester",S,"saboteur",S, "warrior",L,"healer",L) },
    ],
  },
  {
    house: 7, position: 6,
    prompt_fr: "La vraie raison pour laquelle vous mettez fin à une relation ou à un contrat est...",
    options: [
      { position: 1, label_fr: "J'ai trouvé mieux ailleurs, une meilleure opportunité d'ascension.",                       vector: v("prostitute",S,"sovereign",S, "caregiver",L,"sage",L) },
      { position: 2, label_fr: "Je m'étouffe, j'ai un besoin viscéral d'air et de nouveauté.",                             vector: v("explorer",S,"rebel",S, "lover",L,"caregiver",L) },
      { position: 3, label_fr: "Je veux les détruire avant qu'ils ne me détruisent.",                                       vector: v("saboteur",S,"warrior",S, "healer",L,"mystic",L) },
      { position: 4, label_fr: "Je réalise que l'autre ne partage pas mon niveau de conscience spirituelle.",               vector: v("mystic",S,"sage",S, "lover",L,"child",L) },
      { position: 5, label_fr: "L'absence cruelle d'esthétisme, de beauté et de passion.",                                 vector: v("creator",S,"lover",S, "sovereign",L,"warrior",L) },
      { position: 6, label_fr: "Je n'arrive plus à jouer la comédie, je veux retirer mon masque.",                         vector: v("magician",S,"jester",S, "child",L,"explorer",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 8 : OMBRE, SEXE & MORT (Transmutation, héritages, crises)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 8, position: 1,
    prompt_fr: "Votre rapport profond à l'intimité physique et à la sexualité est...",
    options: [
      { position: 1, label_fr: "C'est une expérience mystique, une fusion avec le divin.",                                      vector: v("mystic",L,"lover",L, "sage",S,"warrior",S) },
      { position: 2, label_fr: "C'est une performance où je dois prouver ma puissance.",                                       vector: v("warrior",S,"sovereign",S, "healer",L,"child",L) },
      { position: 3, label_fr: "C'est une monnaie d'échange pour obtenir de l'affection ou du pouvoir.",                       vector: v("prostitute",S,"magician",S, "rebel",L,"explorer",L) },
      { position: 4, label_fr: "J'ai du mal à lâcher le contrôle de mon esprit, le corps me fait peur.",                        vector: v("sage",S,"explorer",S, "lover",L,"creator",L) },
      { position: 5, label_fr: "C'est une exploration joyeuse, ludique et sans tabou.",                                          vector: v("jester",L,"creator",L, "victim",S,"sovereign",S) },
      { position: 6, label_fr: "C'est mon pouvoir de guérison pour moi et mon partenaire.",                                     vector: v("healer",L,"caregiver",L, "saboteur",S,"rebel",S) },
    ],
  },
  {
    house: 8, position: 2,
    prompt_fr: "Face à une fin brutale — relation, emploi, projet — vous...",
    options: [
      { position: 1, label_fr: "Je refuse la fin, je m'accroche désespérément au passé.",                                       vector: v("victim",S,"child",S, "explorer",L,"warrior",L) },
      { position: 2, label_fr: "Je transmute la douleur en art ou en un projet grandiose.",                                      vector: v("creator",L,"magician",L, "saboteur",S,"prostitute",S) },
      { position: 3, label_fr: "Je coupe mes émotions, j'analyse la situation froidement.",                                    vector: v("sage",S,"sovereign",S, "healer",L,"lover",L) },
      { position: 4, label_fr: "Je célèbre la mort de l'ancien pour accueillir le nouveau avec enthousiasme.",                  vector: v("explorer",L,"rebel",L, "caregiver",S,"victim",S) },
      { position: 5, label_fr: "Je m'effondre dans les addictions ou les comportements destructeurs.",                         vector: v("saboteur",S,"rebel",S, "sovereign",L,"healer",L) },
      { position: 6, label_fr: "Je cherche la leçon karmique derrière cet événement.",                                           vector: v("mystic",L,"sage",L, "child",S,"jester",S) },
    ],
  },
  {
    house: 8, position: 3,
    prompt_fr: "Lorsqu'on vous confie un secret lourd ou une trahison, vous...",
    options: [
      { position: 1, label_fr: "Je le porte comme un fardeau, ça m'empoisonne de l'intérieur.",                                vector: v("caregiver",S,"victim",S, "warrior",L,"jester",L) },
      { position: 2, label_fr: "Je l'utilise comme levier de pouvoir (consciemment ou non).",                                   vector: v("magician",S,"prostitute",S, "healer",L,"caregiver",L) },
      { position: 3, label_fr: "Je l'oublie presque instantanément, je ne m'encombre pas de l'ombre des autres.",              vector: v("explorer",S,"jester",S, "sage",L,"sovereign",L) },
      { position: 4, label_fr: "Je tente de purifier cette énergie sombre par la parole et le soin.",                          vector: v("healer",L,"mystic",L, "saboteur",S,"rebel",S) },
      { position: 5, label_fr: "J'analyse la psyché de la personne pour comprendre pourquoi elle a fait ça.",                  vector: v("sage",L,"magician",L, "lover",S,"child",S) },
      { position: 6, label_fr: "Je garde le silence absolu, comme un coffre-fort militaire inviolable.",                       vector: v("warrior",L,"sovereign",L, "jester",S,"creator",S) },
    ],
  },
  {
    house: 8, position: 4,
    prompt_fr: "Dans les zones sombres de l'expérience humaine, ce qui vous fascine le plus est...",
    options: [
      { position: 1, label_fr: "Comprendre l'architecture de la folie et de la manipulation mentale.",                         vector: v("sage",L,"magician",L, "caregiver",S,"lover",S) },
      { position: 2, label_fr: "L'adrénaline et la transgression de l'interdit absolu.",                                         vector: v("rebel",S,"explorer",S, "healer",L,"sovereign",L) },
      { position: 3, label_fr: "La capacité de l'être humain à survivre et à guérir des pires horreurs.",                       vector: v("healer",L,"victim",L, "sovereign",S,"warrior",S) },
      { position: 4, label_fr: "L'humour noir et l'absurdité tragique de notre condition.",                                    vector: v("jester",L,"creator",L, "prostitute",S,"saboteur",S) },
      { position: 5, label_fr: "Rien ne me fascine là-dedans, je fuis ces sujets terrifiants.",                                  vector: v("child",S,"lover",S, "warrior",L,"explorer",L) },
      { position: 6, label_fr: "La mécanique du pouvoir absolu et de la destruction des empires.",                               vector: v("sovereign",S,"warrior",S, "caregiver",L,"mystic",L) },
    ],
  },
  {
    house: 8, position: 5,
    prompt_fr: "Votre rapport à la mortalité et à la finitude est...",
    options: [
      { position: 1, label_fr: "Je combats l'idée, je veux laisser une trace éternelle (mon empire/mon art).",                   vector: v("sovereign",L,"creator",L, "mystic",S,"victim",S) },
      { position: 2, label_fr: "Je suis terrifié(e) par le néant, c'est une angoisse paralysante.",                            vector: v("child",S,"saboteur",S, "sage",L,"magician",L) },
      { position: 3, label_fr: "Je l'accepte paisiblement, la mort n'est qu'une porte vers l'unité.",                          vector: v("mystic",L,"sage",L, "warrior",S,"prostitute",S) },
      { position: 4, label_fr: "Je vis à 200 à l'heure pour ne jamais y penser, je brûle la vie.",                             vector: v("explorer",S,"rebel",S, "healer",L,"caregiver",L) },
      { position: 5, label_fr: "J'en rigole, la faucheuse finit toujours par gagner, autant danser !",                          vector: v("jester",L,"lover",L, "sovereign",S,"warrior",S) },
      { position: 6, label_fr: "J'essaie de repousser la mort en contrôlant ma biologie à l'extrême.",                           vector: v("magician",S,"warrior",S, "child",L,"explorer",L) },
    ],
  },
  {
    house: 8, position: 6,
    prompt_fr: "Face à un héritage, une succession ou des enjeux financiers liés à la mort...",
    options: [
      { position: 1, label_fr: "Je refuse tout héritage ou dette pour ne rien devoir à personne.",                               vector: v("rebel",L,"explorer",L, "caregiver",S,"lover",S) },
      { position: 2, label_fr: "Je calcule comment maximiser cet argent pour asseoir ma sécurité.",                              vector: v("sovereign",L,"sage",L, "victim",S,"jester",S) },
      { position: 3, label_fr: "Je m'embrouille dans la paperasse et je me sens traqué(e) par le système.",                    vector: v("victim",S,"child",S, "warrior",L,"sovereign",L) },
      { position: 4, label_fr: "Je cache mon argent ou je flirte avec les limites de la légalité.",                             vector: v("magician",S,"saboteur",S, "healer",L,"caregiver",L) },
      { position: 5, label_fr: "Je m'en fiche de l'impôt, c'est ma contribution pour aider le collectif.",                     vector: v("caregiver",L,"healer",L, "sovereign",S,"warrior",S) },
      { position: 6, label_fr: "Je vends mes valeurs pour m'assurer une part de l'héritage.",                                   vector: v("prostitute",S,"lover",S, "rebel",L,"explorer",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 9 : VISION & QUÊTE (Philosophie, voyages, haut savoir)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 9, position: 1,
    prompt_fr: "Ce qui vous pousse à chercher la sagesse, la spiritualité ou la philosophie est...",
    options: [
      { position: 1, label_fr: "Acquérir de nouveaux outils pour accroître mon influence sur le monde.",                         vector: v("magician",L,"sovereign",L, "victim",S,"child",S) },
      { position: 2, label_fr: "Trouver la 'Vérité' absolue qui expliquera enfin le sens de l'Univers.",                       vector: v("sage",L,"mystic",L, "jester",S,"lover",S) },
      { position: 3, label_fr: "M'échapper de la banalité de ma vie quotidienne (spiritual bypassing).",                       vector: v("mystic",S,"explorer",S, "warrior",L,"creator",L) },
      { position: 4, label_fr: "Trouver un moyen de me réparer et de soigner mes proches.",                                      vector: v("healer",L,"caregiver",L, "saboteur",S,"rebel",S) },
      { position: 5, label_fr: "Picorer ce qui m'amuse et rejeter les dogmes trop lourds.",                                      vector: v("jester",L,"explorer",L, "sovereign",S,"sage",S) },
      { position: 6, label_fr: "Déconstruire leurs mensonges pour prouver que toutes les religions se valent.",                 vector: v("rebel",L,"saboteur",S, "healer",L,"mystic",L) },
    ],
  },
  {
    house: 9, position: 2,
    prompt_fr: "Face à quelqu'un dont les croyances vous semblent absurdes ou dangereuses, vous...",
    options: [
      { position: 1, label_fr: "Je le vois comme un ennemi à vaincre, je lance une croisade verbale.",                         vector: v("warrior",S,"sovereign",S, "healer",L,"caregiver",L) },
      { position: 2, label_fr: "Je suis fasciné(e), je l'interroge pour élargir ma propre carte du monde.",                    vector: v("explorer",L,"sage",L, "child",S,"victim",S) },
      { position: 3, label_fr: "Je suis d'accord avec lui en face pour éviter tout conflit.",                                    vector: v("prostitute",S,"victim",S, "warrior",L,"rebel",L) },
      { position: 4, label_fr: "J'utilise la dérision pour lui montrer l'absurdité de ses dogmes.",                            vector: v("jester",L,"magician",L, "caregiver",S,"healer",S) },
      { position: 5, label_fr: "Je ressens de la compassion pour son aveuglement.",                                             vector: v("healer",S,"mystic",S, "explorer",L,"sage",L) },
      { position: 6, label_fr: "Je m'inspire de sa vision pour créer une nouvelle œuvre métaphorique.",                        vector: v("creator",L,"lover",L, "sovereign",S,"warrior",S) },
    ],
  },
  {
    house: 9, position: 3,
    prompt_fr: "Votre façon idéale de voyager ou de quitter votre zone de confort est...",
    options: [
      { position: 1, label_fr: "Sans plan, avec un sac à dos, ouvert(e) à toutes les rencontres.",                               vector: v("explorer",L,"rebel",L, "sovereign",S,"sage",S) },
      { position: 2, label_fr: "Des retraites spirituelles en silence ou des pèlerinages solitaires.",                          vector: v("mystic",L,"healer",L, "jester",S,"lover",S) },
      { position: 3, label_fr: "Tout doit être planifié, luxueux et sous mon contrôle total.",                                   vector: v("sovereign",S,"warrior",S, "explorer",L,"child",L) },
      { position: 4, label_fr: "J'y vais pour l'art, les musées, la beauté de l'architecture.",                                 vector: v("creator",L,"lover",L, "prostitute",S,"saboteur",S) },
      { position: 5, label_fr: "Je préfère voyager dans ma tête, à travers mes livres ou mes écrans.",                          vector: v("sage",S,"child",S, "explorer",L,"warrior",L) },
      { position: 6, label_fr: "Je fuis littéralement mes problèmes en partant le plus loin possible.",                          vector: v("saboteur",S,"victim",S, "magician",L,"caregiver",L) },
    ],
  },
  {
    house: 9, position: 4,
    prompt_fr: "Lors d'une crise existentielle ou de foi, votre réaction profonde est...",
    options: [
      { position: 1, label_fr: "Je m'effondre et j'attends qu'un 'Gourou' me donne la réponse.",                                vector: v("child",S,"victim",S, "sovereign",L,"magician",L) },
      { position: 2, label_fr: "J'étudie la psychologie de la crise pour rationaliser la souffrance.",                          vector: v("sage",L,"magician",L, "lover",S,"creator",S) },
      { position: 3, label_fr: "Je la vis comme un feu purificateur qui prépare ma renaissance.",                              vector: v("mystic",L,"healer",L, "prostitute",S,"caregiver",S) },
      { position: 4, label_fr: "Je m'étourdis dans le plaisir, le sexe, la création compulsive.",                               vector: v("creator",S,"lover",S, "sage",L,"mystic",L) },
      { position: 5, label_fr: "Je rejette toutes mes anciennes croyances et je détruis ma vie d'avant.",                        vector: v("rebel",S,"saboteur",S, "healer",L,"caregiver",L) },
      { position: 6, label_fr: "Je continue de marcher droit, la discipline me sauvera du chaos.",                             vector: v("warrior",L,"sovereign",L, "child",S,"victim",S) },
    ],
  },
  {
    house: 9, position: 5,
    prompt_fr: "Lorsque vous recevez une révélation ou une vérité profonde, vous...",
    options: [
      { position: 1, label_fr: "Je veux immédiatement l'enseigner aux autres (parfois de force).",                             vector: v("sovereign",S,"healer",S, "explorer",L,"child",L) },
      { position: 2, label_fr: "Je l'intègre silencieusement dans ma pratique quotidienne secrète.",                            vector: v("mystic",L,"sage",L, "jester",S,"rebel",S) },
      { position: 3, label_fr: "J'en fais un dogme absolu et je juge ceux qui n'ont pas 'compris'.",                            vector: v("sage",S,"magician",S, "healer",L,"lover",L) },
      { position: 4, label_fr: "Je m'en amuse, car toute vérité n'est qu'un concept de plus.",                                   vector: v("jester",L,"explorer",L, "sovereign",S,"warrior",S) },
      { position: 5, label_fr: "Je m'en sers pour créer de la beauté, écrire ou composer.",                                      vector: v("creator",L,"lover",L, "prostitute",S,"victim",S) },
      { position: 6, label_fr: "Je la monétise immédiatement en créant une formation ou un produit.",                            vector: v("prostitute",S,"magician",S, "mystic",L,"caregiver",L) },
    ],
  },
  {
    house: 9, position: 6,
    prompt_fr: "Votre rapport aux mentors, maîtres ou figures d'autorité spirituelle est...",
    options: [
      { position: 1, label_fr: "Qu'ils sont parfaits, infaillibles, et des parents de substitution idéaux.",                   vector: v("child",S,"victim",S, "sovereign",L,"rebel",L) },
      { position: 2, label_fr: "Qu'ils n'ont rien à m'apprendre, je veux toujours tuer le père/mentor.",                        vector: v("rebel",S,"saboteur",S, "sage",L,"magician",L) },
      { position: 3, label_fr: "Que je pourrai capter leur pouvoir secret et les dépasser.",                                     vector: v("magician",S,"sovereign",S, "healer",L,"caregiver",L) },
      { position: 4, label_fr: "Qu'ils m'aimeront inconditionnellement si je suis leur meilleur élève.",                       vector: v("caregiver",S,"lover",S, "warrior",L,"explorer",L) },
      { position: 5, label_fr: "Je n'ai pas de mentor, mon seul guide est ma bibliothèque.",                                     vector: v("sage",S,"explorer",S, "child",L,"jester",L) },
      { position: 6, label_fr: "Qu'ils ont la clé magique pour m'éviter de faire le travail difficile.",                         vector: v("prostitute",S,"saboteur",S, "creator",L,"warrior",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 10 : CARRIÈRE & DESTIN (Statut social, autorité, l'héritage)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 10, position: 1,
    prompt_fr: "Votre ambition profonde en matière de carrière et de statut social est...",
    options: [
      { position: 1, label_fr: "Avoir un empire invincible et dicter les règles du jeu.",                                        vector: v("sovereign",L,"warrior",L, "victim",S,"child",S) },
      { position: 2, label_fr: "Être reconnu comme une sommité intellectuelle incontestable.",                                   vector: v("sage",L,"magician",L, "lover",S,"explorer",S) },
      { position: 3, label_fr: "Pouvoir guérir ou aider des millions de personnes.",                                             vector: v("healer",L,"caregiver",L, "sovereign",S,"warrior",S) },
      { position: 4, label_fr: "Être totalement libre de mon temps et n'avoir aucun patron.",                                    vector: v("explorer",L,"rebel",L, "caregiver",S,"prostitute",S) },
      { position: 5, label_fr: "Créer une œuvre intemporelle d'une beauté absolue.",                                             vector: v("creator",L,"lover",L, "saboteur",S,"sage",S) },
      { position: 6, label_fr: "Avoir amassé assez d'argent pour m'acheter une tranquillité à vie.",                             vector: v("prostitute",S,"child",S, "mystic",L,"jester",L) },
    ],
  },
  {
    house: 10, position: 2,
    prompt_fr: "Face à une figure d'autorité toxique au travail, vous...",
    options: [
      { position: 1, label_fr: "Je l'affronte directement, je pars en guerre contre elle.",                                      vector: v("warrior",L,"rebel",L, "caregiver",S,"victim",S) },
      { position: 2, label_fr: "Je me soumets en silence par peur de perdre ma sécurité financière.",                            vector: v("prostitute",S,"victim",S, "sovereign",L,"rebel",L) },
      { position: 3, label_fr: "Je la manipule en coulisse pour qu'elle s'autodétruise.",                                        vector: v("magician",S,"saboteur",S, "healer",L,"caregiver",L) },
      { position: 4, label_fr: "Je fais semblant d'être l'idiot du village pour qu'on me laisse tranquille.",                   vector: v("jester",S,"child",S, "sovereign",L,"warrior",L) },
      { position: 5, label_fr: "J'essaie de comprendre ses blessures et de la soigner.",                                         vector: v("healer",S,"caregiver",S, "warrior",L,"sovereign",L) },
      { position: 6, label_fr: "Je démissionne instantanément, ma liberté n'a pas de prix.",                                     vector: v("explorer",L,"rebel",L, "prostitute",S,"child",S) },
    ],
  },
  {
    house: 10, position: 3,
    prompt_fr: "La raison profonde pour laquelle vous sabotez parfois votre propre réussite est...",
    options: [
      { position: 1, label_fr: "Parce que je me sens illégitime (syndrome de l'imposteur).",                                     vector: v("saboteur",S,"child",S, "sovereign",L,"creator",L) },
      { position: 2, label_fr: "Parce que l'ennui m'épuise et je veux détruire la routine.",                                      vector: v("jester",S,"rebel",S, "sage",L,"warrior",L) },
      { position: 3, label_fr: "Parce que je refuse de me plier à des codes immoraux ou inesthétiques.",                       vector: v("creator",S,"lover",S, "prostitute",L,"magician",L) },
      { position: 4, label_fr: "Parce que j'ai pris sur mes épaules la charge mentale de toute l'équipe.",                     vector: v("caregiver",S,"healer",S, "explorer",L,"rebel",L) },
      { position: 5, label_fr: "Parce que je crois secrètement que le succès matériel m'éloigne de Dieu.",                     vector: v("mystic",S,"sage",S, "sovereign",L,"creator",L) },
      { position: 6, label_fr: "Je ne sabote jamais. Je suis un rouleau compresseur.",                                           vector: v("warrior",S,"sovereign",S, "child",L,"victim",L) },
    ],
  },
  {
    house: 10, position: 4,
    prompt_fr: "Lorsque vous êtes placé(e) en position de leader ou de responsable, vous...",
    options: [
      { position: 1, label_fr: "Je suis un leader juste, ferme mais protecteur.",                                                vector: v("sovereign",L,"caregiver",L, "saboteur",S,"victim",S) },
      { position: 2, label_fr: "Je deviens tyrannique et exigeant jusqu'à l'absurde.",                                           vector: v("sovereign",S,"warrior",S, "lover",L,"healer",L) },
      { position: 3, label_fr: "Je fuis les responsabilités et je veux être copain avec tout le monde.",                         vector: v("child",S,"jester",S, "sovereign",L,"warrior",L) },
      { position: 4, label_fr: "J'agis comme un gourou mystérieux, distillant le savoir au compte-gouttes.",                   vector: v("magician",S,"sage",S, "caregiver",L,"explorer",L) },
      { position: 5, label_fr: "J'encourage chacun à trouver sa propre liberté et je décentralise tout.",                      vector: v("rebel",L,"explorer",L, "sovereign",S,"caregiver",S) },
      { position: 6, label_fr: "Je les étouffe en voulant trop les materner ou les sauver.",                                       vector: v("caregiver",S,"healer",S, "warrior",L,"rebel",L) },
    ],
  },
  {
    house: 10, position: 5,
    prompt_fr: "Ce que vous souhaitez laisser derrière vous comme héritage est...",
    options: [
      { position: 1, label_fr: "Une œuvre artistique ou une invention qui révolutionne la perception.",                          vector: v("creator",L,"magician",L, "saboteur",S,"prostitute",S) },
      { position: 2, label_fr: "Un système de pensée universel qui éclaire les générations futures.",                            vector: v("sage",L,"mystic",L, "jester",S,"child",S) },
      { position: 3, label_fr: "Une fondation, un empire ou une famille structurée et protégée.",                              vector: v("sovereign",L,"warrior",L, "victim",S,"explorer",S) },
      { position: 4, label_fr: "Rien du tout. Je veux disparaître sans laisser de trace physique.",                              vector: v("explorer",L,"mystic",L, "sovereign",S,"creator",S) },
      { position: 5, label_fr: "Le souvenir de quelqu'un qui a guéri et aimé de tout son cœur.",                                 vector: v("healer",L,"lover",L, "saboteur",S,"warrior",S) },
      { position: 6, label_fr: "Avoir brisé une chaîne d'oppression ou un tabou sociétal majeur.",                               vector: v("rebel",L,"jester",L, "caregiver",S,"prostitute",S) },
    ],
  },
  {
    house: 10, position: 6,
    prompt_fr: "Lorsque le succès public vous est reconnu (applaudissements, promotion, visibilité)...",
    options: [
      { position: 1, label_fr: "Je m'en nourris, je prends ma place de Roi/Reine naturellement.",                                vector: v("sovereign",L,"lover",L, "child",S,"victim",S) },
      { position: 2, label_fr: "Je suis terrifié(e), je cherche la porte de sortie.",                                             vector: v("child",S,"victim",S, "sovereign",L,"warrior",L) },
      { position: 3, label_fr: "Je fais le show, j'adore provoquer et faire rire les foules.",                                   vector: v("jester",L,"rebel",L, "sage",S,"mystic",S) },
      { position: 4, label_fr: "J'utilise cette hypnose collective pour transmettre un message profond.",                        vector: v("magician",L,"sage",L, "prostitute",S,"saboteur",S) },
      { position: 5, label_fr: "Je culpabilise et je rappelle que ce succès est d'abord celui de l'équipe.",                    vector: v("caregiver",S,"healer",S, "warrior",L,"creator",L) },
      { position: 6, label_fr: "J'ai peur qu'ils découvrent que je n'ai pas de vrai talent.",                                    vector: v("prostitute",S,"saboteur",S, "creator",L,"sovereign",L) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 11 : COLLECTIF & RÉSEAUX (Communautés, idéaux de l'humanité)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 11, position: 1,
    prompt_fr: "Lorsque vous entrez dans un nouveau groupe ou une communauté, vous...",
    options: [
      { position: 1, label_fr: "Je prends immédiatement le leadership ou j'organise la logistique.",                            vector: v("sovereign",L,"warrior",L, "victim",S,"child",S) },
      { position: 2, label_fr: "J'observe en silence depuis les marges avant de dire un mot.",                                   vector: v("sage",L,"mystic",L, "jester",S,"lover",S) },
      { position: 3, label_fr: "Je repère le paria ou le plus vulnérable et je vais lui parler.",                                 vector: v("healer",L,"caregiver",L, "sovereign",S,"warrior",S) },
      { position: 4, label_fr: "Je fais une blague bruyante pour casser la glace et attirer l'attention.",                       vector: v("jester",L,"child",L, "sage",S,"mystic",S) },
      { position: 5, label_fr: "Je n'essaie pas de m'intégrer, je marque ma différence d'emblée.",                               vector: v("rebel",L,"explorer",L, "caregiver",S,"prostitute",S) },
      { position: 6, label_fr: "Je me rends indispensable en rendant service à tout le monde.",                                vector: v("caregiver",S,"prostitute",S, "sovereign",L,"rebel",L) },
    ],
  },
  {
    house: 11, position: 2,
    prompt_fr: "Lorsque le groupe adopte une décision qui va à l'encontre de vos valeurs, vous...",
    options: [
      { position: 1, label_fr: "Je me lève, je m'y oppose violemment et je quitte la tribu.",                                    vector: v("rebel",L,"warrior",L, "caregiver",S,"victim",S) },
      { position: 2, label_fr: "Je me tais pour ne pas faire de vagues et garder ma place.",                                     vector: v("prostitute",S,"victim",S, "rebel",L,"warrior",L) },
      { position: 3, label_fr: "J'argumente philosophiquement pour tenter de les ramener à la raison.",                        vector: v("sage",L,"sovereign",L, "child",S,"lover",S) },
      { position: 4, label_fr: "Je manipule les leaders du groupe en privé pour inverser la décision.",                          vector: v("magician",S,"saboteur",S, "healer",L,"creator",L) },
      { position: 5, label_fr: "Je pleure et je prends le rejet du groupe comme une attaque personnelle.",                     vector: v("child",S,"lover",S, "sovereign",L,"sage",L) },
      { position: 6, label_fr: "Je trouve ça drôle et je fais du sarcasme pour montrer leur stupidité.",                        vector: v("jester",L,"rebel",S, "caregiver",L,"healer",L) },
    ],
  },
  {
    house: 11, position: 3,
    prompt_fr: "Dans un collectif, le rôle que vous jouez le plus naturellement est...",
    options: [
      { position: 1, label_fr: "Le pilier inébranlable vers qui on vient en cas de crise majeure.",                              vector: v("sovereign",L,"warrior",L, "child",S,"victim",S) },
      { position: 2, label_fr: "L'oreille attentive et le psy de service qui soigne les cœurs brisés.",                          vector: v("healer",L,"caregiver",L, "saboteur",S,"rebel",S) },
      { position: 3, label_fr: "Le perturbateur qui empêche le groupe de s'embourgeoiser.",                                      vector: v("jester",L,"rebel",L, "sovereign",S,"sage",S) },
      { position: 4, label_fr: "L'électron libre qui n'est là qu'une fois sur deux, mais qu'on adore.",                          vector: v("explorer",L,"magician",L, "caregiver",S,"lover",S) },
      { position: 5, label_fr: "L'esthète qui crée l'ambiance, les dîners et la beauté de nos rencontres.",                    vector: v("creator",L,"lover",L, "warrior",S,"mystic",S) },
      { position: 6, label_fr: "Celui/Celle qu'on doit toujours sauver ou aider financièrement.",                                vector: v("victim",S,"child",S, "sovereign",L,"sage",L) },
    ],
  },
  {
    house: 11, position: 4,
    prompt_fr: "Votre vision profonde de l'humanité et du collectif est...",
    options: [
      { position: 1, label_fr: "L'humanité est une merveilleuse tragédie divine, il faut l'aimer telle quelle.",                 vector: v("lover",L,"mystic",L, "sage",S,"warrior",S) },
      { position: 2, label_fr: "C'est un chaos que seule une discipline de fer ou la technologie peut sauver.",                  vector: v("sovereign",L,"sage",L, "child",S,"victim",S) },
      { position: 3, label_fr: "Nous sommes perdus, tout est corrompu, je suis profondément cynique.",                           vector: v("rebel",S,"jester",S, "healer",L,"creator",L) },
      { position: 4, label_fr: "L'avenir appartient aux marginaux, aux créateurs et aux alchimistes.",                           vector: v("magician",L,"creator",L, "sovereign",S,"caregiver",S) },
      { position: 5, label_fr: "Je me fiche du collectif, seul mon petit cercle de survie m'importe.",                           vector: v("prostitute",S,"child",S, "explorer",L,"mystic",L) },
      { position: 6, label_fr: "Je crois en la guérison planétaire par l'éveil des consciences.",                                vector: v("healer",L,"mystic",L, "saboteur",S,"jester",S) },
    ],
  },
  {
    house: 11, position: 5,
    prompt_fr: "Lorsque vous êtes pris(e) dans une foule ou une émotion collective intense, vous...",
    options: [
      { position: 1, label_fr: "Je suis galvanisé(e), je hurle avec les loups, emporté par l'énergie.",                        vector: v("child",S,"lover",S, "sage",L,"sovereign",L) },
      { position: 2, label_fr: "Je deviens paranoïaque, je cherche une issue de secours en silence.",                           vector: v("saboteur",S,"victim",S, "warrior",L,"explorer",L) },
      { position: 3, label_fr: "Je reste froid comme le marbre et j'analyse la psychologie de masse.",                           vector: v("sage",L,"magician",L, "lover",S,"caregiver",S) },
      { position: 4, label_fr: "Je tente de calmer la foule ou de protéger les plus faibles.",                                   vector: v("caregiver",L,"healer",L, "warrior",S,"sovereign",S) },
      { position: 5, label_fr: "J'utilise cette énergie brute pour prendre le pouvoir ou créer du chaos.",                     vector: v("sovereign",S,"rebel",S, "healer",L,"mystic",L) },
      { position: 6, label_fr: "Je danse au milieu de la tempête, fasciné(e) par l'absurdité du drame.",                         vector: v("jester",L,"creator",L, "sage",S,"warrior",S) },
    ],
  },
  {
    house: 11, position: 6,
    prompt_fr: "La raison principale pour laquelle vous quittez une communauté ou un réseau est...",
    options: [
      { position: 1, label_fr: "Le dogmatisme, la pensée unique et l'obligation de se conformer.",                             vector: v("explorer",L,"rebel",L, "caregiver",S,"child",S) },
      { position: 2, label_fr: "La superficialité absolue et l'absence de vision de long terme.",                               vector: v("sage",L,"mystic",L, "jester",S,"lover",S) },
      { position: 3, label_fr: "Le manque de loyauté ou les manipulations et trahisons dans le dos.",                            vector: v("warrior",L,"sovereign",L, "prostitute",S,"magician",S) },
      { position: 4, label_fr: "L'absence d'esthétisme, de beauté et de passion créative.",                                    vector: v("creator",L,"lover",L, "sage",S,"explorer",S) },
      { position: 5, label_fr: "L'obligation de m'engager ou de payer une lourde cotisation.",                                 vector: v("prostitute",S,"saboteur",S, "creator",L,"healer",L) },
      { position: 6, label_fr: "Le complexe du sauveur, où tout le monde veut guérir tout le monde.",                          vector: v("jester",L,"magician",L, "healer",S,"caregiver",S) },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAISON 12 : L'INCONSCIENT & LE SACRÉ (Karma, enfermement, dissolution)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    house: 12, position: 1,
    prompt_fr: "Votre rapport à la solitude et au retrait du monde est...",
    options: [
      { position: 1, label_fr: "C'est là que je me ressource, je suis un ermite dans l'âme.",                                    vector: v("mystic",L,"sage",L, "lover",S,"child",S) },
      { position: 2, label_fr: "C'est ma plus grande terreur, le vide me rend littéralement fou.",                               vector: v("child",S,"lover",S, "mystic",L,"explorer",L) },
      { position: 3, label_fr: "Je l'utilise comme une grotte alchimique pour concevoir mes chefs-d'œuvre.",                    vector: v("creator",L,"magician",L, "victim",S,"caregiver",S) },
      { position: 4, label_fr: "Je fuis la solitude en travaillant ou en m'imposant des routines folles.",                      vector: v("warrior",S,"sovereign",S, "mystic",L,"healer",L) },
      { position: 5, label_fr: "Je me sens exilé(e) du monde et je nourris ma victimisation.",                                  vector: v("victim",S,"rebel",S, "creator",L,"sovereign",L) },
      { position: 6, label_fr: "Je la recherche quand j'ai besoin de soigner mes blessures secrètes.",                           vector: v("healer",L,"caregiver",L, "warrior",S,"jester",S) },
    ],
  },
  {
    house: 12, position: 2,
    prompt_fr: "Face à un schéma destructeur qui revient sans cesse dans votre vie, vous...",
    options: [
      { position: 1, label_fr: "Je me dis 'Encore !' et je m'effondre, persuadé(e) d'être maudit(e).",                           vector: v("victim",S,"saboteur",S, "warrior",L,"magician",L) },
      { position: 2, label_fr: "Je l'analyse méticuleusement pour le démanteler intellectuellement.",                            vector: v("sage",L,"explorer",L, "child",S,"healer",S) },
      { position: 3, label_fr: "Je l'embrasse et je ritualise sa destruction avec une intention forte.",                         vector: v("magician",L,"healer",L, "prostitute",S,"saboteur",S) },
      { position: 4, label_fr: "Je me punis sévèrement ou je travaille deux fois plus pour l'oublier.",                         vector: v("warrior",S,"sovereign",S, "mystic",L,"creator",L) },
      { position: 5, label_fr: "Je fais une blague cynique sur le fait que je ne changerai jamais.",                             vector: v("jester",S,"rebel",S, "sage",L,"caregiver",L) },
      { position: 6, label_fr: "Je cherche désespérément quelqu'un d'autre pour régler ça à ma place.",                          vector: v("child",S,"prostitute",S, "sovereign",L,"creator",L) },
    ],
  },
  {
    house: 12, position: 3,
    prompt_fr: "Votre rapport à l'intuition, aux rêves et à l'invisible est...",
    options: [
      { position: 1, label_fr: "Je suis un canal naturel, je reçois des intuitions et je me laisse guider.",                     vector: v("mystic",L,"healer",L, "sovereign",S,"warrior",S) },
      { position: 2, label_fr: "J'utilise des techniques ou des rituels précis pour forcer la magie.",                           vector: v("magician",L,"creator",L, "victim",S,"caregiver",S) },
      { position: 3, label_fr: "Je doute toujours. J'essaie de rationaliser mes intuitions ou de les ignorer.",                vector: v("sage",S,"warrior",S, "mystic",L,"explorer",L) },
      { position: 4, label_fr: "Je cherche uniquement des signes qui me promettent chance ou richesse.",                         vector: v("prostitute",S,"child",S, "sage",L,"rebel",L) },
      { position: 5, label_fr: "Je fuis mon inconscient par des substances, de la technologie ou du bruit.",                   vector: v("saboteur",S,"jester",S, "healer",L,"mystic",L) },
      { position: 6, label_fr: "Mon intuition ne se déclenche que pour détecter des dangers ou des mensonges.",                 vector: v("explorer",L,"rebel",L, "caregiver",S,"lover",S) },
    ],
  },
  {
    house: 12, position: 4,
    prompt_fr: "Ce qui vous emprisonne le plus spirituellement — votre 'prison dorée' — est...",
    options: [
      { position: 1, label_fr: "Le perfectionnisme et l'incapacité à déléguer mon empire.",                                      vector: v("sovereign",S,"warrior",S, "jester",L,"child",L) },
      { position: 2, label_fr: "Le sacrifice pour les autres et l'oubli total de mes propres besoins.",                            vector: v("caregiver",S,"healer",S, "rebel",L,"sovereign",L) },
      { position: 3, label_fr: "L'illusion de ma supériorité intellectuelle et mon isolement dans la tête.",                     vector: v("sage",S,"magician",S, "lover",L,"child",L) },
      { position: 4, label_fr: "La procrastination paralysante et la peur chronique de réussir.",                                vector: v("saboteur",S,"creator",S, "warrior",L,"explorer",L) },
      { position: 5, label_fr: "Le cynisme qui me coupe de toute vraie joie et émerveillement.",                                  vector: v("jester",S,"rebel",S, "mystic",L,"healer",L) },
      { position: 6, label_fr: "Le compromis permanent où je vends mon âme pour être en sécurité.",                              vector: v("prostitute",S,"victim",S, "creator",L,"warrior",L) },
    ],
  },
  {
    house: 12, position: 5,
    prompt_fr: "Lorsque tout s'effondre autour de vous — crise, chaos, perte — vous...",
    options: [
      { position: 1, label_fr: "Je veux tout brûler, le système entier doit être détruit.",                                      vector: v("rebel",L,"warrior",L, "caregiver",S,"mystic",S) },
      { position: 2, label_fr: "Je prie, je lâche prise et je fais confiance au Plan Supérieur.",                                vector: v("mystic",L,"healer",L, "sovereign",S,"saboteur",S) },
      { position: 3, label_fr: "Je panique et je me demande pourquoi ces choses m'arrivent toujours à moi.",                    vector: v("victim",S,"child",S, "sage",L,"sovereign",L) },
      { position: 4, label_fr: "Je peins, j'écris ou je sublime cette absurdité dans une œuvre.",                                vector: v("creator",L,"lover",L, "prostitute",S,"warrior",S) },
      { position: 5, label_fr: "Je tente de manipuler la réalité pour créer ma propre bulle de protection.",                   vector: v("magician",S,"sovereign",S, "explorer",L,"healer",L) },
      { position: 6, label_fr: "Je hausse les épaules, le monde est une farce, je continue à jouer.",                           vector: v("jester",L,"explorer",L, "caregiver",S,"child",S) },
    ],
  },
  {
    house: 12, position: 6,
    prompt_fr: "Le moment où vous vous sentez le plus connecté(e) au divin ou au sacré est...",
    options: [
      { position: 1, label_fr: "Quand j'exprime ma vérité brute, peu importe qui ça choque.",                                    vector: v("rebel",L,"warrior",L, "prostitute",S,"caregiver",S) },
      { position: 2, label_fr: "Quand je crée de la beauté ou quand j'aime inconditionnellement.",                               vector: v("lover",L,"creator",L, "saboteur",S,"victim",S) },
      { position: 3, label_fr: "Quand je comprends enfin la mécanique cachée d'une grande loi universelle.",                    vector: v("sage",L,"magician",L, "child",S,"jester",S) },
      { position: 4, label_fr: "Quand j'apaise la souffrance d'un être vivant (homme, animal, plante).",                         vector: v("healer",L,"caregiver",L, "sovereign",S,"explorer",S) },
      { position: 5, label_fr: "Quand je danse avec le chaos et que je me fonds dans l'instant présent.",                        vector: v("jester",L,"explorer",L, "sovereign",S,"warrior",S) },
      { position: 6, label_fr: "Quand je suis dans le silence absolu, fondu dans le Tout.",                                      vector: v("mystic",L,"child",L, "sage",S,"magician",S) },
    ],
  },

];

export const QUESTIONS_HOUSES_72_COUNT = QUESTIONS_HOUSES_72.length;
export const HOUSES_72_POPULATED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const HOUSES_72_QUESTIONS_PER_HOUSE = 6;
export const HOUSES_72_OPTIONS_PER_QUESTION = 6;

/** Return questions for a specific house, sorted by position. */
export function getHouse72Questions(house: number): Houses72QuestionSeed[] {
  return QUESTIONS_HOUSES_72.filter((q) => q.house === house).sort(
    (a, b) => a.position - b.position,
  );
}

/** Return a single question seed by house + position (1-indexed). */
export function getHouse72Question(
  house: number,
  position: number,
): Houses72QuestionSeed | undefined {
  return QUESTIONS_HOUSES_72.find(
    (q) => q.house === house && q.position === position,
  );
}
