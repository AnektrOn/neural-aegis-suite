/**
 * Aegis Deep Dive (V2) — sample fictional profiles + report builders.
 *
 * Reference data used to:
 *   - drive the user-facing report page (`/deep-dive`)
 *   - drive the admin report page (`/admin/deep-dive-sample`) where the admin
 *     can pick which client profile to inspect.
 *
 * Pure data + pure builders. No I/O.
 */

import type { AnyArchetypeKey } from "./types";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface SampleArchetypeScore {
  archetype: AnyArchetypeKey;
  intensity: number; // 0..1
  light: number;     // 0..1
  shadow: number;    // 0..1
  topHouses: number[];
  shadowHouses?: number[];
}

/** Rich, profile-specific narrative blocks consumed by the report builders. */
export interface ProfileNarrative {
  /** One-sentence overview shown at the top of the user report. */
  overviewLead: string;
  /** Main shadow theme (e.g. "Contrôle"). */
  primaryShadowTheme: string;
  /** Per-archetype rich blocks for the top 3 archetypes (in display order). */
  archetypeBlocks: Array<{
    archetype: AnyArchetypeKey;
    rank: "dominant" | "secondaire" | "tertiaire";
    tagline: string;       // e.g. "Quête du sacré, du sens et de l'unité."
    gives: string;         // "Ce que ça t'apporte"
    watchOut: string;      // "À surveiller"
    /** Admin-only deeper analysis. */
    adminFunctions: string;
    adminEvidence: string;
    adminRisks: string;
    adminWorkAxis: string;
  }>;
  /** Survival shadow narrative (user). */
  survivalUser: string;
  /** Survival shadow narrative (admin, includes Myss-compatible reading). */
  survivalAdmin: string;
  /** Closing user narrative. */
  closingNarrativeUser: string;
  /** Strengths (user, bullet-ready strings). */
  strengths: string[];
  /** Vigilance points (user). */
  vigilance: string[];
  /** Recommended practices (user). */
  practices: Array<{ title: string; description: string }>;
  /** Admin-only diagnostic summary. */
  adminDiagnostic: {
    triad: string;
    resources: string;
    survival: string;
    hypothesis: string;
  };
  /** Admin-only contract reading (Sacred Contracts). */
  adminContract: string[];
}

export interface SampleProfile {
  id: string;
  label: string;
  /** Short subtitle shown next to the label in the admin selector. */
  subtitle?: string;
  majors: SampleArchetypeScore[];
  survival: SampleArchetypeScore[];
  wheelBuckets: {
    veryActive: AnyArchetypeKey[];
    moderate: AnyArchetypeKey[];
    discreet: AnyArchetypeKey[];
  };
  hotspotHouses: Array<{
    house: number;
    label: string;
    archetypes: AnyArchetypeKey[];
    theme: string;
  }>;
  narrative: ProfileNarrative;
}

/* -------------------------------------------------------------------------- */
/* Profiles                                                                    */
/* -------------------------------------------------------------------------- */

export const SAMPLE_PROFILE_MYSTIC: SampleProfile = {
  id: "sample-mystic-sage-magician",
  label: "Mystique / Sage / Magicien",
  subtitle: "Profil vertical — sens, vision, transformation",
  majors: [
    { archetype: "mystic",   intensity: 0.88, light: 0.62, shadow: 0.38, topHouses: [9, 12] },
    { archetype: "sage",     intensity: 0.81, light: 0.66, shadow: 0.34, topHouses: [3, 9] },
    { archetype: "magician", intensity: 0.74, light: 0.58, shadow: 0.42, topHouses: [10, 12] },
    { archetype: "creator",  intensity: 0.55, light: 0.60, shadow: 0.40, topHouses: [5] },
  ],
  survival: [
    { archetype: "child",      intensity: 0.50, light: 0.67, shadow: 0.33, topHouses: [4],  shadowHouses: [4] },
    { archetype: "victim",     intensity: 0.18, light: 0.85, shadow: 0.15, topHouses: [2],  shadowHouses: [] },
    { archetype: "saboteur",   intensity: 0.20, light: 0.80, shadow: 0.20, topHouses: [10], shadowHouses: [] },
    { archetype: "prostitute", intensity: 0.15, light: 0.85, shadow: 0.15, topHouses: [2],  shadowHouses: [] },
  ],
  wheelBuckets: {
    veryActive: ["mystic", "sage", "magician"],
    moderate:   ["creator", "lover", "sovereign", "jester"],
    discreet:   ["warrior", "caregiver", "healer", "explorer", "rebel"],
  },
  hotspotHouses: [
    { house: 9,  label: "Spiritualité & quête",   archetypes: ["mystic", "sage"],     theme: "Recherche de sens et structuration des croyances." },
    { house: 12, label: "Inconscient & patterns", archetypes: ["mystic", "magician"], theme: "Travail sur les patterns profonds, transformation invisible." },
    { house: 10, label: "Vocation & potentiel",   archetypes: ["magician", "saboteur"], theme: "Manifestation de la vocation, autorité assumée vs en coulisses." },
  ],
  narrative: {
    overviewLead:
      "Tes archétypes dominants sont le Mystique, le Sage et le Magicien. Ils décrivent ta façon la plus naturelle " +
      "de percevoir le monde, de décider et de transformer ce que tu touches.",
    primaryShadowTheme: "Contrôle",
    archetypeBlocks: [
      {
        archetype: "mystic",
        rank: "dominant",
        tagline: "Quête du sacré, du sens et de l'unité.",
        gives:
          "Tu as un accès naturel à l'intuition, aux synchronicités, aux niveaux « sous-jacents » de ce que tu vis. " +
          "Tu peux sentir quand quelque chose est juste avant même de pouvoir l'expliquer, et tu es attiré par les " +
          "règles profondes du réel plutôt que par la surface.",
        watchOut:
          "Quand la réalité est trop dense ou trop lente, tu peux te réfugier dans l'intériorité, le travail ou la " +
          "spiritualité pour ne plus sentir (spiritual bypassing, fuite du concret). Le risque : rester en orbite " +
          "autour du sens sans l'incarner pleinement dans ta matière (corps, argent, temps).",
        adminFunctions:
          "Lien au sacré, lecture symbolique des événements, capacité à voir la vie comme une aventure initiatique.",
        adminEvidence:
          "Recherche d'enseignements lors de crises existentielles ; rapport au sacré structuré (traditions, règles) ; " +
          "sensation de canalisation dans la créativité ; perception de la vie comme « aventure initiatique pleine de signes ».",
        adminRisks:
          "Fuite du réel quand la densité augmente (refuge dans monde intérieur, spiritualité ou travail face à une relation toxique). " +
          "Spiritual bypassing possible : comprendre et symboliser avant d'avoir totalement traversé émotionnellement.",
        adminWorkAxis:
          "Toujours se demander : « Qu'est-ce que cette intuition / ce signe m'invite à faire de concret ? » Lier " +
          "systématiquement une prise de conscience mystique à un micro-acte dans la matière (appel, mail, décision, " +
          "limite posée, mouvement dans l'espace).",
      },
      {
        archetype: "sage",
        rank: "secondaire",
        tagline: "Cherche la vérité, comprend en profondeur, transmet la clarté.",
        gives:
          "Tu as un vrai talent pour comprendre, synthétiser, structurer les choses complexes et les rendre " +
          "intelligibles. Ton réflexe sous stress est souvent de prendre du recul, d'observer, de « lire » l'autre " +
          "et la dynamique plutôt que de réagir à chaud.",
        watchOut:
          "Sur-mentalisation et distance émotionnelle : tu peux parfois rester dans l'analyse au lieu de sentir, ou " +
          "figer des visions en « théories » alors que la vie reste plus fluide.",
        adminFunctions: "Discernement, lucidité, structuration du sens, transmission.",
        adminEvidence:
          "Lit la dynamique dans la relation ; cherche des modèles pour comprendre ; relie naturellement réflexion et transmission.",
        adminRisks:
          "Sur-mentalisation : rester dans la mise en mots, l'analyse, au lieu de laisser une part plus brute s'exprimer. " +
          "Dogmatisme soft : quand un modèle marche bien, risque de le tenir très fort.",
        adminWorkAxis:
          "Créer des espaces où le Sage écoute sans interpréter immédiatement (attention ouverte, contemplation brute). " +
          "Te challenger à transmettre non pas seulement ce que tu sais, mais aussi ce que tu es en train d'apprendre / tester (work in progress).",
      },
      {
        archetype: "magician",
        rank: "tertiaire",
        tagline: "Transforme l'invisible en réel, ouvre des possibles.",
        gives:
          "Tu fonctionnes beaucoup en vision stratégique + intuition : tu captes des patterns, tu vois comment une " +
          "idée pourrait se manifester, tu joues volontiers en coulisses (alliances, timing, structure). Tu ressens " +
          "souvent ton travail créatif comme une forme de canalisation — « quelque chose passe à travers ».",
        watchOut:
          "Le Magicien peut facilement glisser vers : élitisme (se sentir « à part »), détachement du concret " +
          "(tout est plan, vision, transformation — mais qui exécute ?), et micro-manipulation douce pour garder la main sur le cadre.",
        adminFunctions: "Transformation, stratégie, jeu avec les dynamiques visibles et invisibles.",
        adminEvidence:
          "Prépare silencieusement sa sortie quand un contexte devient invivable ; reprend son pouvoir par la stratégie, " +
          "la négociation, la redéfinition du cadre ; « joue des coulisses » avec les alliés et les règles.",
        adminRisks:
          "Glisser dans l'archétype du Stratège détaché qui tient les ficelles sans être pleinement exposé. " +
          "Micro-manipulation justifiée par la vision globale (« je vois plus loin, donc je peux ajuster les choses »).",
        adminWorkAxis:
          "Créer des situations où tu acceptes des actes visibles et irréversibles (engagements publics, annonces claires), " +
          "pas seulement des ajustements en coulisse. T'assurer que chaque stratégie sert une valeur explicite " +
          "(Mystique + Sage) plutôt qu'un simple gain d'efficacité ou de contrôle.",
      },
    ],
    survivalUser:
      "Tes signaux de survie montrent surtout un Child shadow ~33 %, les autres (Victim, Saboteur, Prostitute) sont bas. " +
      "Ta zone de vulnérabilité, ce n'est pas la victimisation ou la vente de ton intégrité, c'est plutôt le besoin que les choses " +
      "soient tenues pour ne pas te sentir débordé. Quand le monde extérieur est trop chaotique, ton Child peut chercher soit " +
      "une figure rassurante, soit un monde intérieur où tu gardes la main (vision, stratégie, profondeur).",
    survivalAdmin:
      "Le contrôle n'est pas seulement mental : il est lié à la peur du vide (Mystique), de l'erreur (Sage) et de la stagnation " +
      "(Magicien). Le Child shadow peut se traduire par : « je garde tout parfaitement orchestré pour ne jamais me sentir dépassé " +
      "comme un enfant dans un monde trop grand ». Axe de travail : introduire volontairement des espaces où tu ne contrôles pas " +
      "l'issue, mais où le cadre est suffisamment safe pour ne pas être traumatisant (expérimentations, co-créations, labs). " +
      "Surveiller les moments où tu prépares « silencieusement ta sortie » : se demander si une conversation explicite n'est pas " +
      "plus en ligne avec le contrat que la stratégie seulement.",
    closingNarrativeUser:
      "Tu exprimes avant tout l'énergie du Mystique, combinée à une forte présence du Sage, avec un Magicien qui émerge " +
      "comme ressource naturelle pour faire passer les choses du plan subtil au concret. Ton ombre principale de Contrôle " +
      "te protège du chaos, mais peut, à l'excès, t'empêcher de te laisser vraiment surprendre par la vie, les autres, et " +
      "même par tes propres créations.",
    strengths: [
      "**Mystique** : capacité à sentir la direction juste, à percevoir les synchronicités et les « rendez-vous » de ta vie.",
      "**Sage** : clarté mentale, discernement, capacité à expliquer et transmettre.",
      "**Magicien** : talent pour orchestrer, structurer, transformer une vision en expérience réelle.",
    ],
    vigilance: [
      "Ne pas vivre uniquement « dans la tête et le ciel » (Sage + Mystique) ; revenir régulièrement au corps, à la relation, à l'argent comme terrain d'incarnation.",
      "Ne pas garder le pouvoir uniquement en coulisses (Magicien + Contrôle) ; accepter aussi des zones de vulnérabilité visible.",
    ],
    practices: [
      { title: "Intention du jour — 3 min", description: "Pour canaliser le Magicien dès le matin : « voici ce que j'alchimise aujourd'hui », plutôt que laisser la journée décider à ta place." },
      { title: "Body scan — 10 min",        description: "Pour que le Mystique et le Sage descendent dans le corps et ne restent pas uniquement en surplomb mental." },
      { title: "Attention ouverte / méditation non-directive", description: "Pour nourrir le Mystique en restant ouvert sans chercher à contrôler l'expérience." },
      { title: "Journal — Clarification de valeurs & gratitudes", description: "Pour aider le Sage à hiérarchiser ce qui compte vraiment, et le Magicien à aligner ses projets sur ces valeurs plutôt que sur le seul challenge intellectuel." },
    ],
    adminDiagnostic: {
      triad: "Mystique – Sage – Magicien.",
      resources: "Guerrier, Souverain, Amoureux, Créateur, Bouffon : présents mais non dominants → ressources, pas drivers.",
      survival: "Child seul à un niveau moyen, les autres très bas → pas de gros signaux Victim / Saboteur / Prostitute pour l'instant.",
      hypothesis:
        "Profil très fort en dimension verticale (sens, vision, transformation). Besoin de renforcer les dimensions horizontales " +
        "(corps, territoire, lien, finance) pour que le contrat s'incarne.",
    },
    adminContract: [
      "Mystique + Sage + Magicien au centre → contrat orienté sur la compréhension et la transformation des structures invisibles (psychiques, symboliques, systémiques).",
      "Faible activation des archétypes plus « densité » (Guerrier, Soignant, Guérisseur) dans ce test → appel à continuellement ramener ton travail vers le corps, la relation, l'argent, le territoire.",
      "Pour AEGIS, ça valide plutôt bien ton positionnement : appui sur des archétypes très compatibles avec Nomos / Protocole / lecture des structures profondes, mais nécessité de design produit qui aide l'utilisateur à redescendre dans la matière après la prise de conscience.",
    ],
  },
};

export const SAMPLE_PROFILE_LEADER: SampleProfile = {
  id: "sample-leader-warrior-sovereign",
  label: "Leader Warrior / Sovereign",
  subtitle: "Profil horizontal — action, autorité, quête de sens",
  majors: [
    { archetype: "warrior",   intensity: 0.86, light: 0.58, shadow: 0.42, topHouses: [6, 7] },
    { archetype: "sovereign", intensity: 0.79, light: 0.55, shadow: 0.45, topHouses: [1, 10] },
    { archetype: "mystic",    intensity: 0.73, light: 0.62, shadow: 0.38, topHouses: [9, 12] },
    { archetype: "healer",    intensity: 0.68, light: 0.64, shadow: 0.36, topHouses: [4, 6] },
  ],
  survival: [
    { archetype: "child",      intensity: 0.70, light: 0.40, shadow: 0.60, topHouses: [1, 4], shadowHouses: [1, 4] },
    { archetype: "victim",     intensity: 0.55, light: 0.35, shadow: 0.65, topHouses: [2, 7], shadowHouses: [2, 7] },
    { archetype: "saboteur",   intensity: 0.60, light: 0.40, shadow: 0.60, topHouses: [6, 9], shadowHouses: [6, 9] },
    { archetype: "prostitute", intensity: 0.72, light: 0.40, shadow: 0.60, topHouses: [2],    shadowHouses: [2] },
  ],
  wheelBuckets: {
    veryActive: ["warrior", "sovereign", "mystic", "healer"],
    moderate:   ["lover", "creator", "jester", "caregiver"],
    discreet:   ["explorer", "rebel", "sage", "magician"],
  },
  hotspotHouses: [
    { house: 6, label: "Travail & Santé",     archetypes: ["warrior", "healer", "saboteur"], theme: "Équilibre entre performance, corps et éthique." },
    { house: 7, label: "Relations",           archetypes: ["warrior", "lover", "victim"],    theme: "Juste place dans le couple et les partenariats." },
    { house: 2, label: "Argent & sécurité",   archetypes: ["prostitute", "victim", "sovereign"], theme: "Sécurité matérielle vs intégrité." },
  ],
  narrative: {
    overviewLead:
      "Tes archétypes dominants sont le Warrior, le Sovereign et le Mystique. Tu mènes par l'action et l'autorité, " +
      "tout en cherchant un sens plus large à ce que tu construis.",
    primaryShadowTheme: "Sur-engagement / sacrifice de soi",
    archetypeBlocks: [
      {
        archetype: "warrior",
        rank: "dominant",
        tagline: "Tient sous pression, défend ce qui est juste.",
        gives: "Tu as une capacité à tenir sous pression, à défendre ce qui est juste pour toi et les autres au travail.",
        watchOut: "Tendance à te battre contre ton propre corps ou à rester dans des environnements qui te usent.",
        adminFunctions: "Combat, protection, discipline, capacité d'exécution.",
        adminEvidence: "Forte intensité en maisons 6 & 7 ; saboteur présent en 6 ; récits de tenue malgré les coûts.",
        adminRisks: "Confondre tenue et intégrité ; rester en posture de guerre quand le contexte demande négociation ou retrait.",
        adminWorkAxis: "Passer du combat de survie à la protection consciente de ton énergie : choisir quels combats valent ta santé.",
      },
      {
        archetype: "sovereign",
        rank: "secondaire",
        tagline: "Tient le cap et la responsabilité.",
        gives: "Tu sais incarner l'autorité, donner une direction, porter la responsabilité du collectif.",
        watchOut: "Risque d'isolement, de rigidification du cadre, de difficulté à déléguer.",
        adminFunctions: "Vision long terme, gouvernance, équilibre du système.",
        adminEvidence: "Activations en maisons 1 & 10 ; ratio shadow proche de 0.45.",
        adminRisks: "Sovereign ombre = autocrate ou marionnette ; perte de souveraineté quand le contexte attaque l'identité.",
        adminWorkAxis: "Clarifier les contrats explicites avec ton entourage ; déléguer en gardant la responsabilité finale.",
      },
      {
        archetype: "mystic",
        rank: "tertiaire",
        tagline: "Ressource silencieuse vers le sens.",
        gives: "Capacité à ressentir des appels intérieurs, à chercher du sens au-delà de la performance.",
        watchOut: "Quête qui reste théorique tant que la structure (Sovereign) ne lui donne pas un cadre.",
        adminFunctions: "Sens, dimension symbolique, lien au sacré.",
        adminEvidence: "Intensité 0.73 en maisons 9 & 12, mais shadow modérée.",
        adminRisks: "Spiritual bypassing utilisé pour fuir la fatigue du Warrior.",
        adminWorkAxis: "Soutenir la quête du Mystic avec le Sovereign : structure, temps protégé, pratiques.",
      },
    ],
    survivalUser:
      "Tes signaux de survie pointent un Prostitute et un Child élevés, avec ombre marquée en maisons 2 (sécurité) et 1/4 " +
      "(racines). Tu peux échanger ton énergie contre une sécurité immédiate, ou chercher une figure structurante pour " +
      "ne pas affronter seul l'incertitude.",
    survivalAdmin:
      "Prostitute en maison 2 : observer les deals implicites « j'accepte X en échange de sécurité ». " +
      "Child + Victim en maisons 1, 4, 7 : besoin de figures structurantes ; risque de désengagement passif quand le " +
      "Warrior est épuisé. Saboteur en 6/9 alimente l'auto-sabotage santé / sens.",
    closingNarrativeUser:
      "Ton ossature Warrior + Sovereign te porte loin, mais peut t'enfermer dans le « je tiens quoi qu'il arrive ». " +
      "Le travail consiste à inviter le Mystique à donner du sens, sans laisser le Warrior payer le prix.",
    strengths: [
      "**Warrior** : capacité d'exécution et de défense.",
      "**Sovereign** : autorité, vision long terme, sens des responsabilités.",
      "**Mystique** : appel intérieur à du sens plus large.",
    ],
    vigilance: [
      "Ne pas confondre tenue et intégrité.",
      "Ne pas troquer ta santé contre la sécurité du système.",
      "Ne pas reléguer la quête de sens en activité « du dimanche ».",
    ],
    practices: [
      { title: "Audit énergétique hebdo", description: "Lister les combats menés cette semaine — lesquels valaient ta santé ?" },
      { title: "Rituel de transition Warrior → Sovereign", description: "Marquer la fin de la journée par un acte délibéré qui sort du registre combat." },
      { title: "Pratique de sens — 15 min/sem", description: "Reconnecter explicitement chaque grande décision à une valeur Mystique." },
    ],
    adminDiagnostic: {
      triad: "Warrior – Sovereign – Mystique.",
      resources: "Healer présent ; Lover, Creator, Jester, Caregiver disponibles mais non dominants.",
      survival: "Prostitute et Child élevés, avec ombre nette en maison 2 et maisons 1/4.",
      hypothesis:
        "Profil horizontal très orienté action / autorité. Besoin d'intégrer la verticalité (Mystique, Sage) pour " +
        "que le système ne s'épuise pas dans la tenue.",
    },
    adminContract: [
      "Warrior + Sovereign au centre → contrat de leadership exécutif.",
      "Mystique en ressource → invite à donner un cadre de sens explicite à l'autorité.",
      "Prostitute en maison 2 → travail prioritaire sur les contrats économiques implicites.",
    ],
  },
};

export const SAMPLE_PROFILES: SampleProfile[] = [
  SAMPLE_PROFILE_MYSTIC,
  SAMPLE_PROFILE_LEADER,
];

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystic", healer: "Healer", magician: "Magician", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

function fmt(n: number): string {
  return n.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

function pct(n: number): string {
  return `${Math.round(n * 100)} %`;
}

/* -------------------------------------------------------------------------- */
/* Report builders — markdown                                                 */
/* -------------------------------------------------------------------------- */

/**
 * USER-facing report. Tone: bienveillant, orienté prise de conscience.
 */
export function buildUserReport(profile: SampleProfile): string {
  const n = profile.narrative;
  const lines: string[] = [];

  lines.push("# Ton paysage archétypal");
  lines.push("");
  lines.push("## Vue d'ensemble");
  lines.push("");
  lines.push(n.overviewLead);
  lines.push("");
  lines.push(`L'ombre principale de ton profil tourne autour du **${n.primaryShadowTheme}** : besoin de garder la main sur ce qui compte, aussi bien intérieurement (sens, cohérence) qu'extérieurement (cadre, trajectoires).`);
  lines.push("");

  for (const block of n.archetypeBlocks) {
    lines.push(`## Archétype ${block.rank} — Le ${ARCH_LABEL_FR[block.archetype]}`);
    lines.push("");
    lines.push(`*${block.tagline}*`);
    lines.push("");
    lines.push("**Ce que ça t'apporte**");
    lines.push("");
    lines.push(block.gives);
    lines.push("");
    lines.push("**À surveiller**");
    lines.push("");
    lines.push(block.watchOut);
    lines.push("");
  }

  lines.push("## Ombres de survie");
  lines.push("");
  lines.push(n.survivalUser);
  lines.push("");

  lines.push("## Ton récit archétypal");
  lines.push("");
  lines.push(n.closingNarrativeUser);
  lines.push("");

  lines.push("## Forces sur lesquelles t'appuyer");
  lines.push("");
  for (const s of n.strengths) lines.push(`- ${s}`);
  lines.push("");

  lines.push("## Points de vigilance");
  lines.push("");
  for (const v of n.vigilance) lines.push(`- ${v}`);
  lines.push("");

  lines.push("## Pratiques recommandées");
  lines.push("");
  for (const p of n.practices) {
    lines.push(`### ${p.title}`);
    lines.push(p.description);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * ADMIN report — Myss-style clinical reading of the same profile.
 */
export function buildAdminReport(profile: SampleProfile): string {
  const n = profile.narrative;
  const lines: string[] = [];

  lines.push(`# Lecture admin — ${profile.label}`);
  lines.push("");

  lines.push("## Diagnostique rapide");
  lines.push("");
  lines.push(`- **Triade dominante** : ${n.adminDiagnostic.triad}`);
  lines.push(`- **Ressources** : ${n.adminDiagnostic.resources}`);
  lines.push(`- **Survie** : ${n.adminDiagnostic.survival}`);
  lines.push("");
  lines.push(`**Hypothèse admin** : ${n.adminDiagnostic.hypothesis}`);
  lines.push("");

  lines.push("## Scores");
  lines.push("");
  for (const m of profile.majors) {
    lines.push(`- **${ARCH_LABEL_FR[m.archetype]}** — intensité ${fmt(m.intensity)} · light ${pct(m.light)} · shadow ${pct(m.shadow)} · maisons ${m.topHouses.join(", ")}.`);
  }
  lines.push("");
  lines.push("**Survie**");
  for (const s of profile.survival) {
    lines.push(`- ${ARCH_LABEL_FR[s.archetype]} — intensité ${fmt(s.intensity)} · shadow ${pct(s.shadow)} · maison ${s.topHouses.join("/")}.`);
  }
  lines.push("");

  lines.push("## Lecture archétype par archétype");
  lines.push("");
  for (const block of n.archetypeBlocks) {
    lines.push(`### ${ARCH_LABEL_FR[block.archetype]} — ${block.rank}`);
    lines.push("");
    lines.push(`**Fonctions** : ${block.adminFunctions}`);
    lines.push("");
    lines.push(`**Ce qu'on voit dans les réponses** : ${block.adminEvidence}`);
    lines.push("");
    lines.push(`**Risques** : ${block.adminRisks}`);
    lines.push("");
    lines.push(`**Axe de travail** : ${block.adminWorkAxis}`);
    lines.push("");
  }

  lines.push(`## Ombre principale — ${n.primaryShadowTheme} & Child`);
  lines.push("");
  lines.push(n.survivalAdmin);
  lines.push("");

  lines.push("## Maisons les plus chargées");
  lines.push("");
  for (const h of profile.hotspotHouses) {
    lines.push(`### Maison ${h.house} — ${h.label}`);
    lines.push(`Archétypes convergents : ${h.archetypes.map((a) => ARCH_LABEL_FR[a]).join(", ")}.`);
    lines.push(`Thème : ${h.theme}`);
    lines.push("");
  }

  lines.push("## Lecture contrat (Sacred Contracts)");
  lines.push("");
  for (const c of n.adminContract) {
    lines.push(`- ${c}`);
  }

  return lines.join("\n");
}
