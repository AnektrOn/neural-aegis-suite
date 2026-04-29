/**
 * Dynamic Deep Dive profile builder.
 *
 * Transforms REAL assessment data (archetype_scores + analysis_results) into
 * a `SampleProfile` shape consumed by the Deep Dive cards/radar/report.
 *
 * Pure function — no I/O. Fed by `loadDeepDiveProfileForSession()` in the page.
 */

import type { SampleProfile, SampleArchetypeScore, ProfileNarrative } from "./sampleProfile";
import type { AnyArchetypeKey } from "./types";
import { archetypeIntro } from "./narrativeTemplates";

interface ArchetypeScoreRow {
  archetype_key: string;
  normalized_score: number;
  rank: number;
}

interface AnalysisRow {
  top_archetypes: string[] | null;
  shadow_signals: Record<string, number> | null;
  strengths_fr: string[] | null;
  watchouts_fr: string[] | null;
  summary_fr: string | null;
}

const SURVIVAL_KEYS: AnyArchetypeKey[] = ["child", "victim", "saboteur", "prostitute"];
const CORE_12: AnyArchetypeKey[] = [
  "sovereign", "warrior", "lover", "caregiver", "creator", "explorer",
  "rebel", "sage", "mystic", "healer", "magician", "jester",
];

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystique", healer: "Healer", magician: "Magicien", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

const RANKS: Array<"dominant" | "secondaire" | "tertiaire"> = ["dominant", "secondaire", "tertiaire"];

/** Default house mapping per archetype (Myss-inspired). Used when we don't yet
 *  persist per-question house data for V1 sessions. */
const DEFAULT_HOUSES: Record<AnyArchetypeKey, number[]> = {
  sovereign: [1, 10], warrior: [6, 7], lover: [5, 7], caregiver: [4, 6],
  creator: [5, 10], explorer: [9, 11], rebel: [11, 12], sage: [3, 9],
  mystic: [9, 12], healer: [4, 6], magician: [10, 12], jester: [5, 11],
  child: [4], victim: [2, 7], saboteur: [6, 9], prostitute: [2, 8],
};

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export interface BuildDynamicProfileInput {
  sessionId: string;
  displayName?: string | null;
  scores: ArchetypeScoreRow[];      // archetype_scores rows for this session
  analysis: AnalysisRow | null;     // analysis_results row
}

export function buildDynamicProfile(input: BuildDynamicProfileInput): SampleProfile {
  const { displayName, scores, analysis } = input;

  // Sort scores by rank (1 = top). Filter only the 12 core archetypes.
  const coreScores = scores
    .filter((s) => CORE_12.includes(s.archetype_key as AnyArchetypeKey))
    .sort((a, b) => a.rank - b.rank);

  // Top 3 archetypes
  const topThree = coreScores.slice(0, 3).map((s) => s.archetype_key as AnyArchetypeKey);

  // `normalized_score` is a percentage that sums to 100 across all 12 archetypes,
  // so the top archetype is typically ~20–30, never 100. To get a meaningful
  // 0..1 intensity for the radar (dominant = full ring, others proportional),
  // we rescale relative to the strongest score in the session.
  const maxScore = coreScores.reduce((m, s) => Math.max(m, Number(s.normalized_score) || 0), 0);

  // Map all 12 to majors (for radar / score bars)
  const majors: SampleArchetypeScore[] = coreScores.map((s) => {
    const arch = s.archetype_key as AnyArchetypeKey;
    const raw = Number(s.normalized_score) || 0;
    const intensity = maxScore > 0 ? clamp01(raw / maxScore) : 0;
    // shadow ratio approximated from associated shadow signals (avg of all);
    // fallback: 0.35 baseline when no signal.
    const shadowRatio = estimateShadowRatio(arch, analysis?.shadow_signals ?? {});
    return {
      archetype: arch,
      intensity,
      light: 1 - shadowRatio,
      shadow: shadowRatio,
      topHouses: DEFAULT_HOUSES[arch] ?? [],
    };
  });

  // Survival quartet from shadow_signals
  const shadow = analysis?.shadow_signals ?? {};
  const survival: SampleArchetypeScore[] = SURVIVAL_KEYS.map((k) => {
    const v = clamp01(Number(shadow[k] ?? 0));
    return {
      archetype: k,
      intensity: v,
      light: 1 - v,
      shadow: v,
      topHouses: DEFAULT_HOUSES[k] ?? [],
      shadowHouses: v >= 0.3 ? DEFAULT_HOUSES[k] : [],
    };
  });

  // Wheel buckets: split 12 archetypes by intensity tiers.
  const sortedByIntensity = [...majors].sort((a, b) => b.intensity - a.intensity);
  const veryActive = sortedByIntensity.slice(0, 3).map((m) => m.archetype);
  const moderate = sortedByIntensity.slice(3, 7).map((m) => m.archetype);
  const discreet = sortedByIntensity.slice(7).map((m) => m.archetype);

  // Hotspot houses: take houses of top 3 archetypes
  const hotspotHouses = topThree.flatMap((arch, i) => {
    const houses = DEFAULT_HOUSES[arch] ?? [];
    return houses.slice(0, 1).map((h) => ({
      house: h,
      label: HOUSE_LABELS[h] ?? `Maison ${h}`,
      archetypes: [arch],
      theme: `Activation de ${ARCH_LABEL_FR[arch]} — ${HOUSE_THEMES[h] ?? "domaine clé"}.`,
    }));
  });

  // Build narrative dynamically from the real top 3
  const narrative = buildNarrative({
    topThree,
    survival,
    analysis,
  });

  const labelArchs = topThree.map((a) => ARCH_LABEL_FR[a]).join(" / ") || "Profil archétypal";

  return {
    id: `dynamic-${input.sessionId}`,
    label: displayName ? `${displayName} — ${labelArchs}` : labelArchs,
    subtitle: `Triade dominante : ${labelArchs}`,
    majors,
    survival,
    wheelBuckets: { veryActive, moderate, discreet },
    hotspotHouses,
    narrative,
  };
}

/* -------------------------------------------------------------------------- */
/* Narrative composition                                                      */
/* -------------------------------------------------------------------------- */

function buildNarrative(args: {
  topThree: AnyArchetypeKey[];
  survival: SampleArchetypeScore[];
  analysis: AnalysisRow | null;
}): ProfileNarrative {
  const { topThree, survival, analysis } = args;

  const labels = topThree.map((a) => ARCH_LABEL_FR[a]);
  const overviewLead = topThree.length
    ? `Tes archétypes dominants sont le ${labels.join(", le ")}. ` +
      `Ils décrivent ta façon la plus naturelle de percevoir le monde, de décider et de transformer ce que tu touches.`
    : `Ton profil archétypal est encore en cours de constitution.`;

  // Primary shadow theme = strongest survival
  const topShadow = [...survival].sort((a, b) => b.intensity - a.intensity)[0];
  const primaryShadowTheme = topShadow && topShadow.intensity >= 0.3
    ? shadowThemeLabel(topShadow.archetype)
    : "Contrôle";

  // Per-archetype blocks
  const archetypeBlocks = topThree.map((arch, i) => {
    const intro = archetypeIntro[arch] ?? "";
    const tagline = TAGLINES[arch] ?? `Archétype clé de ton paysage intérieur.`;
    return {
      archetype: arch,
      rank: RANKS[i],
      tagline,
      gives: GIVES[arch] ?? extractFirstSentence(intro, 2),
      watchOut: WATCHOUTS[arch] ?? extractShadowSentence(intro),
      adminFunctions: ADMIN_FUNCTIONS[arch] ?? `Fonctions clés du ${ARCH_LABEL_FR[arch]}.`,
      adminEvidence: `Présent dans le top ${i + 1} des archétypes scorés. Maison(s) typique(s) : ${(DEFAULT_HOUSES[arch] ?? []).join(", ")}.`,
      adminRisks: ADMIN_RISKS[arch] ?? extractShadowSentence(intro),
      adminWorkAxis: ADMIN_WORK[arch] ?? `Intégrer la lumière du ${ARCH_LABEL_FR[arch]} sans tomber dans son ombre.`,
    };
  });

  // Survival narrative
  const activeSurvival = survival.filter((s) => s.intensity >= 0.3);
  const survivalUser = activeSurvival.length === 0
    ? `Tes signaux de survie sont bas sur les quatre archétypes (Child, Victim, Saboteur, Prostitute). ` +
      `Tu n'as pas de pattern de survie dominant qui dirige tes décisions actuellement.`
    : `Tes signaux de survie montrent surtout : ${activeSurvival.map((s) => `**${ARCH_LABEL_FR[s.archetype]}** (${Math.round(s.intensity * 100)}%)`).join(", ")}. ` +
      `Ces zones méritent ton attention car elles peuvent t'éloigner de tes archétypes lumineux quand le stress monte.`;

  const survivalAdmin = activeSurvival.length === 0
    ? `Aucun signal de survie significatif. Profil stable côté ombres archétypales.`
    : `Survival actifs : ${activeSurvival.map((s) => `${ARCH_LABEL_FR[s.archetype]} ${Math.round(s.intensity * 100)}%`).join(" · ")}. ` +
      `Lecture Myss : ces archétypes de survie filtrent la perception du réel et orientent les contrats implicites. ` +
      `À surveiller en accompagnement : moments de bascule entre archétypes lumineux et ombres de survie.`;

  const closingNarrativeUser = analysis?.summary_fr
    ? analysis.summary_fr
    : `Tu exprimes principalement l'énergie du ${labels[0] ?? ""}, soutenu par le ${labels[1] ?? ""} ` +
      `et le ${labels[2] ?? ""}. Cette triade est ta signature naturelle — l'enjeu est de la mettre au service ` +
      `de ce qui compte vraiment pour toi, plutôt que de la laisser tourner en automatique.`;

  const strengths = analysis?.strengths_fr?.length
    ? analysis.strengths_fr
    : topThree.map((a) => `**${ARCH_LABEL_FR[a]}** : ${STRENGTH_HINT[a] ?? "force naturelle de cet archétype."}`);

  const vigilance = analysis?.watchouts_fr?.length
    ? analysis.watchouts_fr
    : topThree.map((a) => VIGILANCE_HINT[a] ?? `Surveiller la zone d'ombre du ${ARCH_LABEL_FR[a]}.`);

  const practices = topThree.map((a) => PRACTICES[a]).filter(Boolean) as Array<{ title: string; description: string }>;
  const finalPractices = practices.length > 0 ? practices : [
    { title: "Body scan — 10 min", description: "Reconnecte tes archétypes au corps avant de prendre toute décision importante." },
    { title: "Journal de clarification", description: "Écris pendant 5 min ce que ta triade dominante cherche à exprimer aujourd'hui." },
  ];

  const adminDiagnostic = {
    triad: labels.join(" – ") || "—",
    resources: `Archétypes secondaires disponibles selon les autres scores (creator, lover, etc.).`,
    survival: activeSurvival.length === 0
      ? "Aucun signal de survie significatif."
      : activeSurvival.map((s) => `${ARCH_LABEL_FR[s.archetype]} ${Math.round(s.intensity * 100)}%`).join(", "),
    hypothesis: `Profil orienté ${labels[0] ?? "?"} avec appui ${labels[1] ?? "?"} / ${labels[2] ?? "?"}. ` +
      `Travailler la complémentarité avec les archétypes les moins activés.`,
  };

  const adminContract = [
    `${labels.join(" + ")} au centre → contrat orienté sur les fonctions de ces 3 archétypes.`,
    activeSurvival.length > 0
      ? `Ombres actives (${activeSurvival.map((s) => ARCH_LABEL_FR[s.archetype]).join(", ")}) → travail de récupération de souveraineté à mener.`
      : `Aucune ombre survie dominante → terrain favorable pour activer pleinement les archétypes lumineux.`,
    `Pour AEGIS : prioriser les pratiques qui honorent le ${labels[0] ?? "?"} sans nourrir ses zones d'ombre.`,
  ];

  return {
    overviewLead,
    primaryShadowTheme,
    archetypeBlocks,
    survivalUser,
    survivalAdmin,
    closingNarrativeUser,
    strengths,
    vigilance,
    practices: finalPractices,
    adminDiagnostic,
    adminContract,
  };
}

/* -------------------------------------------------------------------------- */
/* Static content per archetype                                               */
/* -------------------------------------------------------------------------- */

const TAGLINES: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Tient le cap, gouverne, prend la responsabilité.",
  warrior: "Tient sous pression, défend ce qui est juste.",
  lover: "Aime, désire, entre en relation profonde.",
  caregiver: "Nourrit, contient, prend soin.",
  creator: "Donne forme à ce qui n'existait pas.",
  explorer: "Cherche l'ailleurs, ouvre des chemins.",
  rebel: "Défie l'ordre injuste, ouvre des brèches.",
  sage: "Cherche la vérité, comprend, transmet.",
  mystic: "Quête du sacré, du sens et de l'unité.",
  healer: "Transforme la blessure en ressource.",
  magician: "Transforme l'invisible en réel, ouvre des possibles.",
  jester: "Rit, allège, renverse les perspectives.",
};

const GIVES: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Tu sais incarner l'autorité, donner une direction et porter la responsabilité du collectif. Tu vois les choses de haut et tiens un cadre.",
  warrior: "Tu as une vraie capacité à tenir sous pression, à défendre ce qui est juste pour toi et les autres, et à exécuter quand il faut.",
  lover: "Tu es présent, intense, capable de connexions profondes. Tu mets de la chaleur dans ce que tu fais et inspires confiance par ta sincérité.",
  caregiver: "Tu sais soutenir sans te sacrifier, créer un climat de sécurité, materner de façon mature autour de toi.",
  creator: "Tu canalises l'inspiration en formes concrètes. Tu vois des possibilités là où les autres voient des limites.",
  explorer: "Tu sais sortir des scripts familiaux, ouvrir ta vie, aller chercher ailleurs ce qui n'existe pas encore.",
  rebel: "Tu défies les systèmes injustes, tu ouvres des voies alternatives, tu protèges la vérité.",
  sage: "Tu as un vrai talent pour comprendre, synthétiser, structurer la complexité et la rendre intelligible.",
  mystic: "Tu as un accès naturel à l'intuition, aux synchronicités, aux niveaux sous-jacents de ce que tu vis.",
  healer: "Tu transformes blessure en ressource, tu écoutes en profondeur, tu accompagnes la guérison.",
  magician: "Tu fonctionnes en vision stratégique + intuition. Tu captes des patterns et tu fais bouger les lignes en finesse.",
  jester: "Tu allèges, tu révèles des vérités à travers le rire, tu fais circuler l'énergie là où tout est figé.",
};

const WATCHOUTS: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Risque de rigidification du cadre, isolement au sommet, difficulté à déléguer ou à se laisser challenger.",
  warrior: "Tendance à te battre contre ton propre corps ou à rester dans des environnements qui te usent au nom de la tenue.",
  lover: "Risque de dépendance affective, recherche de validation, ou drama relationnel quand l'intensité manque.",
  caregiver: "Risque de sur-sacrifice, de materner pour contrôler, ou de t'oublier complètement pour les autres.",
  creator: "Perfectionnisme, auto-critique paralysante, ou utilisation du talent pour manipuler plutôt que créer.",
  explorer: "Fuite de l'engagement et de la stabilité, confusion entre mouvement et vraie liberté.",
  rebel: "Casser pour casser, rejeter avant de comprendre, te couper de soutiens possibles par principe.",
  sage: "Sur-mentalisation, distance émotionnelle, ou tendance à figer des visions en théories rigides.",
  mystic: "Spiritual bypassing : te réfugier dans l'intériorité ou la spiritualité pour ne plus sentir le concret.",
  healer: "Te définir par tes blessures, vouloir sauver tout le monde, t'épuiser dans l'aide aux autres.",
  magician: "Glisser vers la micro-manipulation, l'élitisme, ou rester en coulisses sans t'exposer vraiment.",
  jester: "Te cacher derrière la blague pour ne jamais te montrer, minimiser, saboter la profondeur.",
};

const ADMIN_FUNCTIONS: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Vision long terme, gouvernance, équilibre du système, autorité.",
  warrior: "Combat, protection, discipline, capacité d'exécution.",
  lover: "Connexion, intensité relationnelle, présence affective.",
  caregiver: "Soin, contenance, soutien, maternage mature.",
  creator: "Manifestation, mise en forme, canalisation de l'inspiration.",
  explorer: "Ouverture, mouvement, exploration de territoires neufs.",
  rebel: "Défi des systèmes, rupture, ouverture de brèches.",
  sage: "Discernement, structuration du sens, transmission.",
  mystic: "Lien au sacré, lecture symbolique, intuition profonde.",
  healer: "Transformation de la souffrance, écoute thérapeutique.",
  magician: "Transformation, stratégie, jeu avec dynamiques visibles/invisibles.",
  jester: "Allègement, renversement, énergie créative ludique.",
};

const ADMIN_RISKS: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Sovereign ombre = autocrate ou marionnette ; perte de souveraineté quand le contexte attaque l'identité.",
  warrior: "Confondre tenue et intégrité ; rester en posture de guerre quand le contexte demande négociation.",
  lover: "Fusion, dépendance, perte de soi dans la relation à l'autre.",
  caregiver: "Sur-investissement dans le soin de l'autre au détriment de soi ; martyr inconscient.",
  creator: "Blocage créatif, procrastination perfectionniste, utilisation manipulatoire du talent.",
  explorer: "Fuite chronique de l'enracinement, instabilité relationnelle ou professionnelle.",
  rebel: "Opposition systématique, isolement, perte de discernement entre vrais et faux combats.",
  sage: "Sur-mentalisation, dogmatisme soft quand un modèle marche bien.",
  mystic: "Fuite du réel, spiritual bypassing, déconnexion de la matière.",
  healer: "Identification à la blessure, complexe du sauveur, épuisement compassionnel.",
  magician: "Stratège détaché qui tient les ficelles sans s'exposer, micro-manipulation justifiée par la vision.",
  jester: "Évitement par l'humour, sabotage des moments de profondeur.",
};

const ADMIN_WORK: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Clarifier les contrats explicites avec l'entourage ; déléguer en gardant la responsabilité finale.",
  warrior: "Passer du combat de survie à la protection consciente : choisir quels combats valent ta santé.",
  lover: "Apprendre à aimer sans se perdre, distinguer fusion et présence.",
  caregiver: "Équilibrer 'je prends soin de toi' avec 'je prends aussi soin de moi'.",
  creator: "Assumer le rôle de co-créateur sans saboter ses propres œuvres ; livrer imparfait.",
  explorer: "Transformer la fuite en exploration consciente et assumée.",
  rebel: "Choisir quand la rébellion sert vraiment le contrat, et quand elle rejoue une vieille guerre.",
  sage: "Créer des espaces où le Sage écoute sans interpréter ; transmettre du work in progress.",
  mystic: "Lier toute prise de conscience mystique à un micro-acte concret dans la matière.",
  healer: "Guérir avec, pas contre, ce qu'on a traversé ; poser des limites au soin.",
  magician: "Accepter des actes visibles et irréversibles, pas seulement des ajustements en coulisses.",
  jester: "Distinguer le rire qui ouvre du rire qui fuit ; oser la profondeur après la blague.",
};

const STRENGTH_HINT: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "autorité naturelle, vision long terme, sens des responsabilités.",
  warrior: "capacité d'exécution, défense des valeurs, endurance sous pression.",
  lover: "présence relationnelle, intensité, capacité à inspirer la confiance.",
  caregiver: "écoute, soutien, capacité à créer un environnement safe.",
  creator: "talent de mise en forme, originalité, énergie créative.",
  explorer: "ouverture, courage de l'inconnu, créativité du chemin.",
  rebel: "courage de défier, vision alternative, protection de la vérité.",
  sage: "clarté mentale, discernement, capacité à expliquer et transmettre.",
  mystic: "intuition fine, lecture symbolique, accès au sens profond.",
  healer: "écoute profonde, capacité de transformation de la souffrance.",
  magician: "vision stratégique, capacité à orchestrer et faire bouger les lignes.",
  jester: "humour qui désamorce, légèreté qui libère, perspective neuve.",
};

const VIGILANCE_HINT: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Ne pas confondre autorité et contrôle ; rester ouvert au feedback.",
  warrior: "Ne pas troquer ta santé contre la tenue ; choisir tes combats.",
  lover: "Ne pas perdre ton centre dans la relation à l'autre.",
  caregiver: "Ne pas t'oublier dans le soin que tu portes aux autres.",
  creator: "Ne pas laisser le perfectionnisme bloquer la livraison.",
  explorer: "Ne pas fuir l'enracinement au nom du mouvement.",
  rebel: "Ne pas casser tes propres soutiens par opposition systématique.",
  sage: "Ne pas vivre uniquement dans la tête ; redescendre dans le corps.",
  mystic: "Ne pas utiliser le sacré pour fuir le concret.",
  healer: "Ne pas te définir par tes blessures ; poser des limites.",
  magician: "Ne pas garder le pouvoir uniquement en coulisses ; t'exposer.",
  jester: "Ne pas te cacher derrière la blague ; oser la profondeur.",
};

const PRACTICES: Partial<Record<AnyArchetypeKey, { title: string; description: string }>> = {
  sovereign: { title: "Audit de cadre — 10 min/sem", description: "Lister les contrats implicites de la semaine et les rendre explicites." },
  warrior: { title: "Audit énergétique hebdo", description: "Lister les combats menés cette semaine — lesquels valaient ta santé ?" },
  lover: { title: "Présence à l'autre — 5 min", description: "Écouter quelqu'un sans interrompre ni anticiper la réponse." },
  caregiver: { title: "Soin de soi — 15 min/jour", description: "Bloquer un créneau quotidien réservé strictement à toi." },
  creator: { title: "Livre imparfait — 1×/sem", description: "Publier ou montrer une création inachevée pour casser le perfectionnisme." },
  explorer: { title: "Ancrage hebdo — 30 min", description: "Choisir un lieu / une routine et y revenir consciemment chaque semaine." },
  rebel: { title: "Pause avant rejet", description: "Avant de dire non, prendre 24h pour vérifier ce qui se rejoue." },
  sage: { title: "Body scan — 10 min", description: "Pour que le Sage descende dans le corps et ne reste pas en surplomb mental." },
  mystic: { title: "Intention du jour — 3 min", description: "Canaliser le Mystique au matin : 'voici ce que j'incarne aujourd'hui'." },
  healer: { title: "Limite du soin", description: "Identifier une situation où tu vas arrêter de porter ce qui n'est pas à toi." },
  magician: { title: "Annonce explicite — 1×/sem", description: "Dire publiquement quelque chose que tu aurais ajusté en coulisses." },
  jester: { title: "Profondeur après blague", description: "Dire ce que la blague venait protéger, juste après l'avoir lancée." },
};

const HOUSE_LABELS: Record<number, string> = {
  1: "Ego & personnalité", 2: "Valeurs & sécurité", 3: "Expression & décisions",
  4: "Foyer & racines", 5: "Créativité & plaisir", 6: "Travail & santé",
  7: "Relations & partenariats", 8: "Ressources partagées", 9: "Spiritualité & quête",
  10: "Vocation & potentiel", 11: "Monde & contribution", 12: "Inconscient & patterns",
};

const HOUSE_THEMES: Record<number, string> = {
  1: "image de soi et présence", 2: "rapport à la sécurité matérielle",
  3: "voix et choix", 4: "racines et foyer", 5: "créativité et jeu",
  6: "travail et santé", 7: "alliances et couple", 8: "intimité et fusion",
  9: "quête de sens", 10: "vocation et autorité", 11: "contribution collective",
  12: "patterns inconscients",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function estimateShadowRatio(_arch: AnyArchetypeKey, shadow: Record<string, number>): number {
  // Approximation: average of survival shadow signals (intensity 0..1).
  const vals = SURVIVAL_KEYS.map((k) => Number(shadow[k] ?? 0)).filter((v) => !Number.isNaN(v));
  if (vals.length === 0) return 0.35;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Map avg [0..1] to a shadow ratio [0.25..0.55]
  return clamp01(0.25 + avg * 0.3);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function shadowThemeLabel(arch: AnyArchetypeKey): string {
  switch (arch) {
    case "child": return "Besoin de sécurité / contrôle";
    case "victim": return "Impuissance apprise";
    case "saboteur": return "Auto-sabotage";
    case "prostitute": return "Compromis d'intégrité";
    default: return "Contrôle";
  }
}

function extractFirstSentence(text: string, count = 1): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, count).join(" ");
}

function extractShadowSentence(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const shadow = sentences.find((s) => /ombre/i.test(s));
  return shadow ?? sentences[1] ?? text;
}
