/**
 * @file narrativeContent.ts
 * Bilingual static content used by `dynamicProfileBuilder.ts`.
 * All editorial text is colocated here so the builder stays a pure data pipeline.
 *
 * ─── STYLE GUARDRAILS ────────────────────────────────────────────────────────
 * 1. TONE: "tu" in FR, "you" in EN. Clinical-useful, never alarmist.
 * 2. DISTINCTIVENESS: Every archetype block must be non-interchangeable.
 *    Run a smell-check: could this sentence apply to 3+ other archetypes? Rewrite.
 * 3. STRUCTURE per block:
 *    - gives      → lumière concrète (ce que l'archétype permet)
 *    - watchout   → risque court terme (signal précoce, observable)
 *    - adminRisks → pattern chronique (ce qui s'installe si non travaillé)
 *    - adminWork  → axe immédiatement praticable (verbe d'action + contexte)
 * 4. ANCHORS (enforced by tests in __tests__/narrativeContent.guardrails.test.ts):
 *    - Each WATCHOUTS[key].fr MUST contain "Signal précoce"
 *    - Each ADMIN_RISKS[key].fr MUST contain "Pattern chronique"
 *    - Each TAGLINES[key].fr MUST be unique
 * 5. SURVIVAL: Frame as guardians / regulators, never as defects.
 *    Ref: Myss, "Gallery of Archetypes" — Survival Family overview (Child,
 *    Victim, Saboteur, Prostitute as "trusted allies and a source of spiritual
 *    and material strength").
 * 6. SACRED CONTRACT: Operational > mystical. "Ta mission implique concrètement…"
 * 7. NO MAGIC NUMBERS in narrative text: any threshold (ratios, percentages)
 *    must be labelled as "indicatif" / "à ajuster", not prescriptive.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AnyArchetypeKey } from "./types";
import type { Locale } from "@/i18n/translations";

type ArchKey = AnyArchetypeKey;
type Bi = { fr: string; en: string };
type BiPractice = { fr: { title: string; description: string }; en: { title: string; description: string } };

/* -------------------------------------------------------------------------- */
/* Archetype labels                                                            */
/* -------------------------------------------------------------------------- */

const ARCH_LABEL: Record<ArchKey, Bi> = {
  sovereign:  { fr: "Sovereign",  en: "Sovereign"  },
  warrior:    { fr: "Warrior",    en: "Warrior"    },
  lover:      { fr: "Lover",      en: "Lover"      },
  caregiver:  { fr: "Caregiver",  en: "Caregiver"  },
  creator:    { fr: "Creator",    en: "Creator"    },
  explorer:   { fr: "Explorer",   en: "Explorer"   },
  rebel:      { fr: "Rebel",      en: "Rebel"      },
  sage:       { fr: "Sage",       en: "Sage"       },
  mystic:     { fr: "Mystique",   en: "Mystic"     },
  healer:     { fr: "Healer",     en: "Healer"     },
  magician:   { fr: "Magicien",   en: "Magician"   },
  jester:     { fr: "Jester",     en: "Jester"     },
  child:      { fr: "Child",      en: "Child"      },
  victim:     { fr: "Victim",     en: "Victim"     },
  saboteur:   { fr: "Saboteur",   en: "Saboteur"   },
  prostitute: { fr: "Prostitute", en: "Prostitute" },
};

export function archLabel(arch: ArchKey, locale: Locale): string {
  return ARCH_LABEL[arch]?.[locale] ?? arch;
}

/** Exposed for test introspection only. */
export const CORE_ARCH_KEYS: ArchKey[] = [
  "sovereign", "warrior", "lover", "caregiver", "creator", "explorer",
  "rebel", "sage", "mystic", "healer", "magician", "jester",
];
export const SURVIVAL_ARCH_KEYS: ArchKey[] = ["child", "victim", "saboteur", "prostitute"];

/* -------------------------------------------------------------------------- */
/* Taglines — une seule phrase, signature distinctive                         */
/* GUARDRAIL: must be unique per archetype.                                   */
/* -------------------------------------------------------------------------- */

const TAGLINES: Partial<Record<ArchKey, Bi>> = {
  sovereign:  {
    fr: "Tient le cap, gouverne avec clarté, assume la responsabilité finale.",
    en: "Holds the course, governs with clarity, takes final responsibility.",
  },
  warrior:    {
    fr: "Protège, exécute sous pression, défend ce qui est juste — même seul.",
    en: "Protects, executes under pressure, defends what is right — even alone.",
  },
  lover:      {
    fr: "Entre en relation avec une intensité rare, aime sans détour.",
    en: "Enters relationship with rare intensity, loves without detour.",
  },
  caregiver:  {
    fr: "Nourrit, contient, prend soin — des personnes comme des projets.",
    en: "Nourishes, contains, takes care — of people as much as projects.",
  },
  creator:    {
    fr: "Donne forme à ce qui n'existait pas encore.",
    en: "Gives form to what did not exist yet.",
  },
  explorer:   {
    fr: "Cherche l'inconnu, ouvre des chemins là où il n'y a pas de carte.",
    en: "Seeks the unknown, opens paths where there is no map.",
  },
  rebel:      {
    fr: "Défie les systèmes injustes, tranche les liens morts, ouvre des brèches.",
    en: "Challenges unjust systems, cuts dead ties, opens breaches.",
  },
  sage:       {
    fr: "Cherche la vérité, comprend en profondeur, transmet avec clarté.",
    en: "Seeks truth, understands deeply, transmits with clarity.",
  },
  mystic:     {
    fr: "Perçoit la dimension symbolique de chaque expérience, habite le sens.",
    en: "Perceives the symbolic dimension of every experience, dwells in meaning.",
  },
  healer:     {
    fr: "Transforme la blessure traversée en ressource vivante pour soi et les autres.",
    en: "Transforms lived wounds into living resources for self and others.",
  },
  magician:   {
    fr: "Transforme l'invisible en réel, catalyse les changements en coulisses.",
    en: "Turns the invisible into real, catalyses change behind the scenes.",
  },
  jester:     {
    fr: "Rit, allège, renverse les évidences — là où tout est figé.",
    en: "Laughs, lightens, flips certainties — where everything is stuck.",
  },
};

/* -------------------------------------------------------------------------- */
/* Gives — lumière concrète, observable                                       */
/* GUARDRAIL: describe a SPECIFIC cognitive/relational/behavioral gift.       */
/* -------------------------------------------------------------------------- */

const GIVES: Partial<Record<ArchKey, Bi>> = {
  sovereign: {
    fr: "Tu incarnes naturellement l'autorité sans avoir besoin de la revendiquer. Dans les situations de crise ou d'ambiguïté, tu sais donner une direction lisible et porter la responsabilité du collectif — même quand c'est inconfortable. Tu vois les systèmes de haut et tu maintiens un cadre là où d'autres se laissent emporter.",
    en: "You naturally embody authority without having to claim it. In crisis or ambiguity, you can give a clear direction and carry collective responsibility — even when it is uncomfortable. You see systems from above and hold a frame where others get swept away.",
  },
  warrior: {
    fr: "Tu as une capacité réelle à tenir sous pression sans te dissoudre. Tu sais quand te battre, quand protéger, et tu exécutes — là où d'autres attendent. Ton endurance n'est pas de la résistance aveugle : tu distingues les combats qui valent ton énergie de ceux qui t'usent pour rien.",
    en: "You have a real capacity to hold under pressure without dissolving. You know when to fight, when to protect, and you execute — where others wait. Your endurance is not blind resistance: you distinguish battles worth your energy from those that wear you out for nothing.",
  },
  lover: {
    fr: "Tu es présent avec une intensité que les autres ressentent immédiatement. Tu crées des connexions profondes vite, tu mets de la vie dans ce que tu touches, et tu inspires confiance par ta sincérité. Ta passion est contagieuse — les projets et les personnes que tu choisis reçoivent ton engagement entier.",
    en: "You are present with an intensity others feel immediately. You create deep connections quickly, bring life to what you touch, and inspire trust through your sincerity. Your passion is contagious — projects and people you choose receive your full commitment.",
  },
  caregiver: {
    fr: "Tu sais créer un climat de sécurité dans lequel les autres peuvent se déposer et grandir. Tu anticipes les besoins, tu contiens les débordements, et ton soin est concret — pas seulement des bonnes intentions. Ta présence régule les situations tendues et donne aux équipes ou aux proches un sentiment d'être soutenus.",
    en: "You know how to create a climate of safety in which others can rest and grow. You anticipate needs, contain overflow, and your care is concrete — not just good intentions. Your presence regulates tense situations and gives teams or close ones a sense of being supported.",
  },
  creator: {
    fr: "Tu vois des possibilités là où d'autres voient des contraintes. Tu sais transformer une idée abstraite en quelque chose de tangible — un système, une forme, une expérience. Ta signature n'est pas dans le volume de ce que tu produis, mais dans la qualité distinctive de ce que tu crées quand tu es aligné.",
    en: "You see possibilities where others see constraints. You know how to turn an abstract idea into something tangible — a system, a form, an experience. Your signature is not in the volume you produce, but in the distinctive quality of what you create when aligned.",
  },
  explorer: {
    fr: "Tu sais sortir des scripts hérités pour trouver ta propre voie. Ta capacité à entrer dans l'inconnu sans te figer est réelle — tu découvres en avançant, et cette forme d'intelligence de terrain te permet d'ouvrir des chemins que les autres n'auraient pas pris. Tu apportes une fraîcheur de regard que les systèmes établis ont du mal à générer seuls.",
    en: "You know how to step out of inherited scripts and find your own way. Your ability to enter the unknown without freezing is real — you discover by moving, and this field intelligence allows you to open paths others would not have taken. You bring a freshness of perspective that established systems struggle to generate on their own.",
  },
  rebel: {
    fr: "Tu perçois les structures injustes ou périmées avant les autres et tu sais les nommer sans diplomatie molle. Tu ouvres des brèches dans des systèmes qui en avaient besoin. Ta capacité à dire non, à changer de cap, à défier ce qui « ne se questionne pas » est une ressource précieuse — surtout quand les autres sont trop installés pour voir le problème.",
    en: "You perceive unjust or obsolete structures before others and can name them without soft diplomacy. You open breaches in systems that needed it. Your ability to say no, change course, and challenge what 'is not questioned' is a precious resource — especially when others are too settled to see the problem.",
  },
  sage: {
    fr: "Tu as un vrai talent pour comprendre la structure profonde d'une situation — pas seulement la surface. Tu synthétises, tu relies des éléments épars en une image cohérente, et tu transmets avec une clarté qui aide les autres à se repérer. Sous stress, ton réflexe est de prendre du recul pour lire la dynamique plutôt que de réagir à chaud — ce qui est souvent la décision juste.",
    en: "You have a real talent for understanding the deep structure of a situation — not just the surface. You synthesize, connect scattered elements into a coherent picture, and transmit with a clarity that helps others orient themselves. Under stress, your reflex is to step back and read the dynamic rather than react hot — which is often the right move.",
  },
  mystic: {
    fr: "Tu perçois la dimension symbolique et la cohérence sous-jacente de ta vie avec une acuité rare. Tu lis les synchronicités, tu sens quand un chemin est juste avant de pouvoir le justifier rationnellement. Cette intelligence intuitive est une ressource stratégique — elle te permet de prendre des décisions de fond que la seule analyse n'aurait pas produites.",
    en: "You perceive the symbolic dimension and underlying coherence of your life with rare acuity. You read synchronicities, you feel when a path is right before you can justify it rationally. This intuitive intelligence is a strategic resource — it allows you to make foundational decisions that analysis alone would not have produced.",
  },
  healer: {
    fr: "Ce que tu as traversé n'est pas resté bloqué comme une blessure — tu l'as transformé en compréhension et en capacité d'accompagnement. Tu écoutes à un niveau que la plupart des gens ne touchent pas, tu perçois ce qui ne se dit pas, et tu sais tenir la souffrance de l'autre sans te laisser submerger. C'est un don clinique autant qu'humain.",
    en: "What you have been through has not stayed locked as a wound — you have transformed it into understanding and the capacity to accompany others. You listen at a level most people never reach, you perceive what goes unsaid, and you know how to hold another's suffering without being overwhelmed. This is a clinical gift as much as a human one.",
  },
  magician: {
    fr: "Tu travailles simultanément sur les niveaux visible et invisible d'une situation. Tu captes les dynamiques de pouvoir avant qu'elles se formalisent, tu identifies les bons leviers, et tu sais orchestrer des transformations qui paraissent naturelles aux autres — alors qu'elles ont été soigneusement préparées. Ton intelligence stratégique est réelle et souvent sous-estimée.",
    en: "You work simultaneously on the visible and invisible levels of a situation. You catch power dynamics before they formalize, identify the right levers, and orchestrate transformations that seem natural to others — though carefully prepared. Your strategic intelligence is real and often underestimated.",
  },
  jester: {
    fr: "Tu as la capacité de faire circuler l'énergie là où tout est figé. Un mot juste au bon moment, une perspective renversée qui fait rire — et soudain la tension se défait. Tu révèles des vérités que personne n'osait dire, en les enveloppant dans une forme que les autres peuvent recevoir. C'est une forme d'intelligence sociale et de courage.",
    en: "You have the ability to get energy moving where everything is stuck. The right word at the right moment, a flipped perspective that sparks laughter — and suddenly the tension dissolves. You reveal truths no one dared to say, wrapped in a form others can receive. This is a form of social intelligence and courage.",
  },
};

/* -------------------------------------------------------------------------- */
/* Watchouts — risque court terme, observable rapidement                      */
/* GUARDRAIL: this is the EARLY WARNING signal, not the chronic pattern.      */
/* MUST contain "Signal précoce" (FR) — enforced by tests.                    */
/* -------------------------------------------------------------------------- */

const WATCHOUTS: Partial<Record<ArchKey, Bi>> = {
  sovereign: {
    fr: "Quand ton autorité est challengée ou que le contexte devient imprévisible, tu risques de sur-contrôler le cadre ou de t'isoler au sommet pour éviter d'être perçu comme vulnérable. Signal précoce : tu décides seul des choses que tu pourrais déléguer, ou tu résistes aux feedbacks qui questionnent ton cap.",
    en: "When your authority is challenged or the context becomes unpredictable, you risk over-controlling the frame or isolating at the top to avoid being perceived as vulnerable. Early signal: you decide alone on things you could delegate, or you resist feedback that questions your direction.",
  },
  warrior: {
    fr: "Ton endurance peut se retourner contre toi : tu restes dans des contextes qui t'usent physiquement ou émotionnellement au nom de 'tenir'. Signal précoce : fatigue chronique normalisée, irritabilité défensive, ou confusion entre résistance et intégrité.",
    en: "Your endurance can turn against you: you stay in contexts that wear you physically or emotionally in the name of 'holding the line'. Early signal: normalized chronic fatigue, defensive irritability, or confusion between resistance and integrity.",
  },
  lover: {
    fr: "Quand la connexion manque ou que tu te sens peu vu, tu risques de chercher une validation externe sous forme d'intensité : drama relationnel, fusion, ou investissement disproportionné dans une relation au détriment des autres. Signal précoce : sentiment de vide entre les pics d'intensité.",
    en: "When connection is missing or you feel unseen, you risk seeking external validation through intensity: relational drama, fusion, or disproportionate investment in one relationship at the expense of others. Early signal: feeling of emptiness between intensity peaks.",
  },
  caregiver: {
    fr: "Tu peux commencer à 'soigner' pour anticiper le conflit ou maintenir le lien plutôt que par vraie générosité. Signal précoce : ressentiment silencieux quand le soin n'est pas reconnu, ou sensation de devoir 'mériter ta place' en étant utile.",
    en: "You may start 'caring' to pre-empt conflict or maintain the bond rather than out of genuine generosity. Early signal: quiet resentment when care goes unrecognized, or feeling you need to 'earn your place' by being useful.",
  },
  creator: {
    fr: "Perfectionnisme comme évitement : tu affines, tu retouches, tu reportes la livraison parce que 'ce n'est pas encore prêt'. Signal précoce : proportion de temps passé à réviser versus à créer du neuf, projets qui durent 3× leur estimation initiale.",
    en: "Perfectionism as avoidance: you refine, retouch, delay delivery because 'it's not ready yet'. Early signal: proportion of time spent revising versus creating new, projects lasting 3× their initial estimate.",
  },
  explorer: {
    fr: "Un nouveau projet, une nouvelle direction, un nouvel environnement peut apparaître exactement au moment où l'actuel demande une solidification. Signal précoce : excitation pour ce qui est neuf corrélée avec essoufflement pour ce qui est en cours.",
    en: "A new project, direction, or environment may appear exactly when the current one needs consolidating. Early signal: excitement for what is new correlated with fatigue for what is ongoing.",
  },
  rebel: {
    fr: "Tu peux challenger par réflexe plutôt que par discernement — dire non avant même d'avoir évalué le oui. Signal précoce : opposition à des structures ou des personnes qui pourraient en fait être des alliés, ou sentiment constant d'être 'le seul à voir le problème'.",
    en: "You may challenge by reflex rather than discernment — saying no before even evaluating the yes. Early signal: opposition to structures or people who could actually be allies, or constant feeling of being 'the only one who sees the problem'.",
  },
  sage: {
    fr: "Sur-mentalisation sous stress : tu passes à l'analyse et à la mise en mots là où une décision incarnée serait plus utile. Signal précoce : sentiment de comprendre parfaitement une situation tout en restant paralysé dans l'action, ou distance émotionnelle habillée en 'objectivité'.",
    en: "Over-mentalization under stress: you move to analysis and articulation where an embodied decision would be more useful. Early signal: feeling of perfectly understanding a situation while remaining paralysed in action, or emotional distance dressed up as 'objectivity'.",
  },
  mystic: {
    fr: "Quand le concret devient douloureux ou trop bruyant, tu peux te réfugier dans l'intériorité ou la dimension symbolique — spiritual bypassing. Signal précoce : multiplier les pratiques spirituelles ou les lectures de sens au moment où une action concrète est en attente.",
    en: "When the concrete becomes painful or too noisy, you may retreat into interiority or symbolic reading — spiritual bypassing. Early signal: multiplying spiritual practices or meaning-reading exactly when a concrete action is waiting.",
  },
  healer: {
    fr: "Ta capacité d'écoute peut devenir une dette invisible : tu absorbes la souffrance des autres sans mettre de limite parce que 'tu peux tenir'. Signal précoce : épuisement après les conversations profondes, sentiment que les autres viennent systématiquement déposer leurs charges chez toi.",
    en: "Your listening capacity may become an invisible debt: you absorb others' suffering without setting limits because 'you can handle it'. Early signal: exhaustion after deep conversations, feeling that others systematically come to deposit their burdens with you.",
  },
  magician: {
    fr: "Tu peux rester en coulisses sous prétexte que 'les choses se feront naturellement' — en réalité pour éviter l'exposition directe. Signal précoce : actions importantes coordonnées indirectement, résistance aux engagements publics ou irréversibles.",
    en: "You may stay behind the scenes under the premise that 'things will unfold naturally' — actually to avoid direct exposure. Early signal: important actions coordinated indirectly, resistance to public or irreversible commitments.",
  },
  jester: {
    fr: "Le rire peut court-circuiter les moments de profondeur exactement là où ils étaient nécessaires. Signal précoce : blague ou légèreté réflexe au moment où une émotion difficile émerge dans la relation ou la conversation.",
    en: "Laughter can short-circuit moments of depth exactly where they were needed. Early signal: reflexive joke or lightness exactly when a difficult emotion emerges in the relationship or conversation.",
  },
};

/* -------------------------------------------------------------------------- */
/* Admin functions — what this archetype enables operationally                */
/* -------------------------------------------------------------------------- */

const ADMIN_FUNCTIONS: Partial<Record<ArchKey, Bi>> = {
  sovereign:  { fr: "Vision long terme, gouvernance du système, autorité de cadre, responsabilité finale.", en: "Long-term vision, system governance, frame authority, final responsibility." },
  warrior:    { fr: "Protection, exécution sous contrainte, discipline de corps et d'esprit, défense des valeurs.", en: "Protection, execution under constraint, body and mind discipline, defense of values." },
  lover:      { fr: "Connexion profonde, intensité relationnelle, présence affective, engagement total.", en: "Deep connection, relational intensity, emotional presence, total commitment." },
  caregiver:  { fr: "Contenance émotionnelle, soin concret, soutien de la croissance, régulation de la sécurité.", en: "Emotional containment, concrete care, growth support, safety regulation." },
  creator:    { fr: "Manifestation, mise en forme de l'idée en réalité tangible, canalisation de l'inspiration.", en: "Manifestation, shaping ideas into tangible reality, channeling inspiration." },
  explorer:   { fr: "Ouverture de nouvelles voies, sortie des scripts familiaux, intelligence de terrain.", en: "Opening new paths, exiting family scripts, field intelligence." },
  rebel:      { fr: "Défi des systèmes périmés, rupture fondée sur les valeurs, ouverture de brèches nécessaires.", en: "Challenging obsolete systems, values-based rupture, opening necessary breaches." },
  sage:       { fr: "Discernement profond, structuration du sens, transmission pédagogique, lecture de patterns.", en: "Deep discernment, structuring meaning, pedagogical transmission, pattern reading." },
  mystic:     { fr: "Lecture symbolique, connexion au sens vertical, intuition fondamentale, intelligence du seuil.", en: "Symbolic reading, connection to vertical meaning, foundational intuition, threshold intelligence." },
  healer:     { fr: "Transformation de la souffrance en ressource, écoute clinique, accompagnement de la blessure.", en: "Transforming suffering into resource, clinical listening, wound accompaniment." },
  magician:   { fr: "Transformation des systèmes, orchestration stratégique, lecture des dynamiques de pouvoir.", en: "Systems transformation, strategic orchestration, power dynamics reading." },
  jester:     { fr: "Régulation de la tension sociale, révélation par l'humour, déplacement des énergies figées.", en: "Social tension regulation, revelation through humor, displacement of frozen energies." },
};

/* -------------------------------------------------------------------------- */
/* Admin risks — pattern chronique si non travaillé                           */
/* GUARDRAIL: MUST contain "Pattern chronique" (FR) — enforced by tests.      */
/* -------------------------------------------------------------------------- */

const ADMIN_RISKS: Partial<Record<ArchKey, Bi>> = {
  sovereign: {
    fr: "Pattern chronique : isolation progressive au sommet. Le Sovereign ombre construit une bulle de certitude qui lui évite d'être challengé — mais qui le coupe de la réalité du terrain et de ses alliés. Sur la durée : décisions déconnectées, alliés qui cessent d'être honnêtes, perte de légitimité perçue malgré le maintien du statut.",
    en: "Chronic pattern: progressive isolation at the top. The shadow Sovereign builds a certainty bubble that shields them from challenge — but cuts them from ground reality and allies. Over time: disconnected decisions, allies who stop being honest, loss of perceived legitimacy despite maintained status.",
  },
  warrior: {
    fr: "Pattern chronique : corps et relations sacrifiés sur l'autel de la tenue. Le Warrior ombre normalise l'effort excessif jusqu'à l'épuisement structurel — burnout, maladies de surmenage, relations appauvries. Paradoxe : plus il tient, moins il protège vraiment ce qui compte.",
    en: "Chronic pattern: body and relationships sacrificed on the altar of endurance. The shadow Warrior normalizes excessive effort until structural exhaustion — burnout, overwork illnesses, impoverished relationships. Paradox: the more they hold, the less they truly protect what matters.",
  },
  lover: {
    fr: "Pattern chronique : identité construite dans et par la relation à l'autre. Le Lover ombre finit par ne plus exister hors de la dyade intense — perte de soi progressive, dépendance affective structurelle, incapacité à habiter la solitude de façon créative.",
    en: "Chronic pattern: identity built in and through the relationship to the other. The shadow Lover ends up not existing outside the intense dyad — progressive loss of self, structural emotional dependency, inability to inhabit solitude creatively.",
  },
  caregiver: {
    fr: "Pattern chronique : martyr inconscient. Le Caregiver ombre finit par organiser sa vie entière autour du soin des autres comme moyen de contrôle déguisé en générosité. Conséquences : ressentiment profond, santé négligée, incapacité à recevoir.",
    en: "Chronic pattern: unconscious martyr. The shadow Caregiver ends up organizing their entire life around caring for others as a control mechanism disguised as generosity. Consequences: deep resentment, neglected health, inability to receive.",
  },
  creator: {
    fr: "Pattern chronique : paralysie perfectionniste ou blocage créatif défensif. Le Creator ombre se protège de l'échec en ne livrant jamais — ou en livrant tellement retravaillé que l'œuvre originale a perdu sa vie. Sur la durée : dépression créative, sentiment de gâchis, œuvres mort-nées.",
    en: "Chronic pattern: perfectionist paralysis or defensive creative block. The shadow Creator protects against failure by never delivering — or by over-reworking to the point where the original work has lost its life. Over time: creative depression, sense of waste, stillborn works.",
  },
  explorer: {
    fr: "Pattern chronique : instabilité comme identité. L'Explorer ombre ne peut plus s'arrêter — chaque stabilisation est vécue comme une mort symbolique. Conséquences : relations éphémères, constructions jamais achevées, fatigue de la nouveauté elle-même.",
    en: "Chronic pattern: instability as identity. The shadow Explorer can no longer stop — every stabilization is experienced as symbolic death. Consequences: ephemeral relationships, never-finished constructions, fatigue of novelty itself.",
  },
  rebel: {
    fr: "Pattern chronique : opposition systématique comme défense. Le Rebel ombre n'est plus capable de distinguer les vrais combats des réactions automatiques — il s'isole progressivement, perd ses alliés potentiels, et finit par se battre contre des ombres.",
    en: "Chronic pattern: systematic opposition as defense. The shadow Rebel can no longer distinguish real fights from automatic reactions — progressively isolates, loses potential allies, and ends up fighting shadows.",
  },
  sage: {
    fr: "Pattern chronique : dogmatisme intellectuel doux. Le Sage ombre accumule des modèles qui fonctionnent et finit par y rester — incapable de se laisser surprendre, de tolérer ce qui ne rentre pas dans le cadre, de vivre dans l'ambiguïté productive. Distance émotionnelle comme style de vie.",
    en: "Chronic pattern: soft intellectual dogmatism. The shadow Sage accumulates models that work and ends up staying in them — unable to be surprised, tolerate what doesn't fit the frame, or live in productive ambiguity. Emotional distance as a lifestyle.",
  },
  mystic: {
    fr: "Pattern chronique : fuite du réel par le sacré. Le Mystique ombre utilise les pratiques spirituelles, les synchronicités et la lecture symbolique comme anesthésiant — pour ne plus avoir à agir, à confronter, à s'incarner. Résultat : vie spirituellement riche, matériellement ou relationnellement appauvrie.",
    en: "Chronic pattern: flight from reality through the sacred. The shadow Mystic uses spiritual practices, synchronicities and symbolic reading as anaesthetic — to avoid having to act, confront, or embody. Result: spiritually rich life, materially or relationally impoverished.",
  },
  healer: {
    fr: "Pattern chronique : identification à la blessure comme fondement identitaire. Le Healer ombre a besoin de la souffrance — la sienne ou celle des autres — pour exister. Sans blessure à transformer, il ne sait plus qui il est. Résultat : complexe du sauveur, épuisement compassionnel, résistance à la guérison propre.",
    en: "Chronic pattern: identification with the wound as identity foundation. The shadow Healer needs suffering — their own or others' — to exist. Without a wound to transform, they no longer know who they are. Result: savior complex, compassion fatigue, resistance to their own healing.",
  },
  magician: {
    fr: "Pattern chronique : stratège détaché qui ne s'expose jamais. Le Magicien ombre orchestre tout sans jamais mettre sa propre peau dans le jeu — actions indirectes, engagement évité, influence maintenue mais sans responsabilité explicite. Résultat : isolation de la reconnaissance, méfiance des proches.",
    en: "Chronic pattern: detached strategist who never exposes themselves. The shadow Magician orchestrates everything without ever putting their own skin in the game — indirect actions, avoided commitment, maintained influence but without explicit responsibility. Result: isolation from recognition, distrust from close ones.",
  },
  jester: {
    fr: "Pattern chronique : humour comme armure. Le Jester ombre n'a plus accès à la profondeur — chaque fois qu'elle s'approche, la blague arrive. Résultat : relations superficielles malgré une intelligence relationnelle réelle, intimité évitée, sentiment d'être mal compris.",
    en: "Chronic pattern: humor as armor. The shadow Jester no longer has access to depth — every time it approaches, a joke arrives. Result: superficial relationships despite real relational intelligence, avoided intimacy, feeling of being misunderstood.",
  },
};

/* -------------------------------------------------------------------------- */
/* Admin work — axe immédiatement praticable                                  */
/* GUARDRAIL: must be action-first (verb-led).                                */
/* -------------------------------------------------------------------------- */

const ADMIN_WORK: Partial<Record<ArchKey, Bi>> = {
  sovereign: {
    fr: "Introduire une pratique de feedback structuré avec 2-3 personnes de confiance qui ont l'autorisation explicite de challenger les décisions — pas juste les exécuter. Identifier chaque semaine une décision déléguée en gardant seulement la responsabilité finale, pas le contrôle du process.",
    en: "Introduce a structured feedback practice with 2-3 trusted people who have explicit permission to challenge decisions — not just execute them. Identify each week one delegated decision while keeping only final responsibility, not process control.",
  },
  warrior: {
    fr: "Cartographier les combats actifs : classer chaque engagement en (1) valeur défendue ou (2) réflexe de survie. Fermer activement 1-2 combats 'réflexe' par mois. Introduire une pratique de récupération non-négociable (sommeil, corps, oisiveté) comme acte de discipline — pas comme récompense.",
    en: "Map active battles: classify each commitment as (1) value defended or (2) survival reflex. Actively close 1-2 'reflex' battles per month. Introduce a non-negotiable recovery practice (sleep, body, idleness) as an act of discipline — not as reward.",
  },
  lover: {
    fr: "Pratiquer la présence à soi dans des contextes non-relationnels (nature, solitude créative, corps) comme contrepoids à la fusion. Nommer explicitement le besoin de connexion avant de le transformer en comportement — « j'ai besoin de reconnexion » plutôt que de créer de l'intensité réactive.",
    en: "Practice self-presence in non-relational contexts (nature, creative solitude, body) as counterweight to fusion. Explicitly name the need for connection before transforming it into behavior — 'I need reconnection' rather than creating reactive intensity.",
  },
  caregiver: {
    fr: "Tenir un journal de soin asymétrique : noter pour chaque semaine (1) ce que tu as donné, (2) ce que tu as reçu, (3) ce que tu as refusé de donner. Observer les patterns. Pratiquer le 'non' comme acte de soin — dire non à quelqu'un pour préserver ta propre capacité à être disponible demain.",
    en: "Keep an asymmetric care journal: note each week (1) what you gave, (2) what you received, (3) what you refused to give. Observe the patterns. Practice 'no' as an act of care — saying no to someone to preserve your own capacity to be available tomorrow.",
  },
  creator: {
    fr: "Instaurer un protocole de livraison volontairement imparfaite : fixer une deadline, livrer à 80 %, recueillir du feedback avant d'atteindre 100 %. Observer la résistance interne à cette pratique comme signal diagnostique — elle te dit où le perfectionnisme protège quelque chose de plus profond.",
    en: "Establish a voluntarily imperfect delivery protocol: set a deadline, deliver at 80%, gather feedback before reaching 100%. Observe the internal resistance to this practice as a diagnostic signal — it tells you where perfectionism is protecting something deeper.",
  },
  explorer: {
    fr: "Définir un 'contrat de présence' pour chaque projet actif : durée minimale d'engagement avant la prochaine évaluation. Nommer explicitement ce qui est en train de se solidifier (et mérite de l'être) versus ce qui est effectivement terminé. Distinguer la lassitude normale d'un projet mature de la fuite.",
    en: "Define a 'presence contract' for each active project: minimum commitment duration before the next evaluation. Explicitly name what is consolidating (and deserves to) versus what is actually finished. Distinguish normal fatigue in a mature project from flight.",
  },
  rebel: {
    fr: "Avant chaque acte de rébellion ou rupture, appliquer un test en 3 temps : (1) Quelle valeur est défendue ici ? (2) Qui d'autre que moi bénéficie de cette rupture ? (3) Est-ce que je choisis ce combat ou est-ce qu'il me choisit ? Créer une liste des combats que tu as fermés volontairement — et observer comment ça libère de l'énergie.",
    en: "Before each act of rebellion or rupture, apply a 3-step test: (1) What value is being defended here? (2) Who other than me benefits from this rupture? (3) Am I choosing this battle or is it choosing me? Create a list of battles you have voluntarily closed — and observe how it frees energy.",
  },
  sage: {
    fr: "Créer des espaces d'attention ouverte — écoute sans grille, observation sans interprétation immédiate (méditation, temps en nature sans objectif). Pratiquer la transmission du 'work in progress' : partager ce que tu apprends actuellement, pas seulement ce que tu maîtrises. Observer la résistance à cette pratique.",
    en: "Create open attention spaces — listening without a grid, observation without immediate interpretation (meditation, time in nature without agenda). Practice 'work in progress' transmission: share what you are currently learning, not only what you master. Observe the resistance to this practice.",
  },
  mystic: {
    fr: "Lier chaque prise de conscience symbolique ou intuitive à un micro-acte concret dans la matière dans les 24h. Choisir un domaine concret (finances, corps, relation clé) comme terrain d'incarnation prioritaire de la vision mystique — pas seulement les pratiques intérieures.",
    en: "Link every symbolic or intuitive insight to a concrete micro-action in matter within 24h. Choose one concrete domain (finances, body, key relationship) as the priority embodiment ground of the mystical vision — not only inner practices.",
  },
  healer: {
    fr: "Établir une politique explicite de disponibilité : horaires, durée, canaux. Observer la résistance interne à cette limitation — elle signale où le Healer a besoin d'être nécessaire pour exister. Créer une pratique de 'guérison propre' hebdomadaire : espace dédié à ta propre maturation, sans être au service de qui que ce soit.",
    en: "Establish an explicit availability policy: schedules, duration, channels. Observe the internal resistance to this limitation — it signals where the Healer needs to be needed in order to exist. Create a weekly 'own healing' practice: space dedicated to your own maturation, without being in service of anyone.",
  },
  magician: {
    fr: "Choisir chaque mois un engagement visible et irréversible — une annonce publique, un contrat signé, une promesse explicite — qui n'est pas précédé d'une stratégie de sortie. Observer la résistance à l'exposition directe et ce qu'elle protège. S'assurer que chaque stratégie activée est reliée à une valeur nommée, pas seulement à un gain d'efficacité.",
    en: "Choose each month one visible and irreversible commitment — a public announcement, a signed contract, an explicit promise — not preceded by an exit strategy. Observe the resistance to direct exposure and what it protects. Ensure every activated strategy is linked to a named value, not just an efficiency gain.",
  },
  jester: {
    fr: "Pratiquer l'atterrissage après la blague : laisser délibérément un silence après un moment d'humour pour voir ce qui émerge. Créer des espaces (journal, relation de confiance) où la profondeur est la règle, pas l'exception. Observer dans quels contextes l'humour arrive comme réflexe — ce sont les zones où quelque chose attend d'être dit autrement.",
    en: "Practice landing after the joke: deliberately allow silence after a moment of humor to see what emerges. Create spaces (journal, trusted relationship) where depth is the rule, not the exception. Observe in which contexts humor arrives as a reflex — those are the zones where something is waiting to be said differently.",
  },
};

/* -------------------------------------------------------------------------- */
/* Strength & Vigilance hints — short report-level summaries                  */
/* -------------------------------------------------------------------------- */

const STRENGTH_HINT: Partial<Record<ArchKey, Bi>> = {
  sovereign:  { fr: "autorité naturelle, vision long terme, tenue du cadre sous pression.", en: "natural authority, long-term vision, holding the frame under pressure." },
  warrior:    { fr: "exécution sous contrainte, défense des valeurs, endurance structurée.", en: "execution under constraint, defense of values, structured endurance." },
  lover:      { fr: "présence intense, connexion profonde, engagement total.", en: "intense presence, deep connection, total commitment." },
  caregiver:  { fr: "contenance émotionnelle, soin concret, régulation de la sécurité.", en: "emotional containment, concrete care, safety regulation." },
  creator:    { fr: "manifestation de l'idée en réalité, perception des possibles, signature distinctive.", en: "manifesting idea into reality, perceiving possibilities, distinctive signature." },
  explorer:   { fr: "sortie des scripts familiaux, intelligence de terrain, ouverture de nouvelles voies.", en: "exiting family scripts, field intelligence, opening new paths." },
  rebel:      { fr: "perception des structures périmées, courage de la rupture fondée, ouverture de brèches.", en: "perceiving obsolete structures, courage of grounded rupture, opening breaches." },
  sage:       { fr: "discernement profond, synthèse pédagogique, lecture de patterns complexes.", en: "deep discernment, pedagogical synthesis, reading complex patterns." },
  mystic:     { fr: "intelligence intuitive, lecture symbolique, connexion au sens vertical.", en: "intuitive intelligence, symbolic reading, connection to vertical meaning." },
  healer:     { fr: "transformation de la souffrance en ressource, écoute clinique, accompagnement profond.", en: "transforming suffering into resource, clinical listening, deep accompaniment." },
  magician:   { fr: "orchestration stratégique, lecture des dynamiques de pouvoir, catalyse des transformations.", en: "strategic orchestration, reading power dynamics, catalysing transformation." },
  jester:     { fr: "régulation sociale par l'humour, révélation de vérités difficiles, déplacement des énergies figées.", en: "social regulation through humor, revealing difficult truths, displacing frozen energies." },
};

const VIGILANCE_HINT: Partial<Record<ArchKey, Bi>> = {
  sovereign:  { fr: "Surveiller l'isolement au sommet et la résistance au feedback authentique.", en: "Watch for isolation at the top and resistance to authentic feedback." },
  warrior:    { fr: "Surveiller la normalisation de l'épuisement et la confusion entre tenue et intégrité.", en: "Watch for normalizing exhaustion and confusing endurance with integrity." },
  lover:      { fr: "Surveiller la recherche de validation par l'intensité relationnelle.", en: "Watch for seeking validation through relational intensity." },
  caregiver:  { fr: "Surveiller le soin comme contrôle déguisé et le martyr inconscient.", en: "Watch for care as disguised control and unconscious martyrdom." },
  creator:    { fr: "Surveiller le perfectionnisme comme évitement de l'exposition.", en: "Watch for perfectionism as avoidance of exposure." },
  explorer:   { fr: "Surveiller la confusion entre lassitude normale et signal de départ réel.", en: "Watch for confusing normal fatigue with a real departure signal." },
  rebel:      { fr: "Surveiller la rébellion réflexe qui coupe des alliés potentiels.", en: "Watch for reflexive rebellion that cuts off potential allies." },
  sage:       { fr: "Surveiller la distance émotionnelle habillée en objectivité.", en: "Watch for emotional distance dressed up as objectivity." },
  mystic:     { fr: "Surveiller le spiritual bypassing qui évite l'incarnation.", en: "Watch for spiritual bypassing that avoids embodiment." },
  healer:     { fr: "Surveiller le besoin d'être nécessaire comme fondement identitaire.", en: "Watch for the need to be needed as an identity foundation." },
  magician:   { fr: "Surveiller l'orchestration sans exposition — influence sans responsabilité visible.", en: "Watch for orchestration without exposure — influence without visible responsibility." },
  jester:     { fr: "Surveiller l'humour réflexe aux moments où la profondeur est requise.", en: "Watch for reflexive humor at moments where depth is required." },
};

/* -------------------------------------------------------------------------- */
/* Practices — bilingual, archetype-specific                                  */
/* -------------------------------------------------------------------------- */

const PRACTICES: Partial<Record<ArchKey, BiPractice>> = {
  sovereign: {
    fr: { title: "Conseil de vérité — 15 min/semaine", description: "Désigne 2-3 personnes avec autorisation explicite de dire ce que tu n'entends pas habituellement. Pose une question ouverte sur une décision en cours. Écoute sans répondre." },
    en: { title: "Truth council — 15 min/week", description: "Designate 2-3 people with explicit permission to say what you don't usually hear. Ask an open question about a current decision. Listen without responding." },
  },
  warrior: {
    fr: { title: "Cartographie des combats — 20 min/mois", description: "Liste tous tes engagements actifs. Pour chacun : valeur défendue ou réflexe ? Ferme 1-2 combats réflexes ce mois-ci." },
    en: { title: "Battle mapping — 20 min/month", description: "List all your active commitments. For each: value defended or reflex? Close 1-2 reflex battles this month." },
  },
  lover: {
    fr: { title: "Solitude créative — 30 min/jour", description: "Un temps seul sans objectif de connexion : nature, corps, création. Pour exister hors de la relation avant d'y entrer." },
    en: { title: "Creative solitude — 30 min/day", description: "Time alone without connection agenda: nature, body, creation. To exist outside relationship before entering it." },
  },
  caregiver: {
    fr: { title: "Journal de soin asymétrique — 5 min/soir", description: "Donné / Reçu / Refusé cette semaine. Observer le ratio. Un 'non' comme acte de soin à poser cette semaine." },
    en: { title: "Asymmetric care journal — 5 min/evening", description: "Given / Received / Refused this week. Observe the ratio. One 'no' as an act of care to set this week." },
  },
  creator: {
    fr: { title: "Livraison à 80 % — hebdomadaire", description: "Choisir un livrable. Le sortir à 80 % et recueillir un feedback avant d'atteindre 100 %. Observer la résistance interne." },
    en: { title: "80% delivery — weekly", description: "Choose a deliverable. Release it at 80% and gather feedback before reaching 100%. Observe internal resistance." },
  },
  explorer: {
    fr: { title: "Contrat de présence — par projet", description: "Définir une durée minimale d'engagement avant la prochaine évaluation de sortie. Nommer ce qui se solidifie." },
    en: { title: "Presence contract — per project", description: "Define a minimum commitment duration before the next exit evaluation. Name what is consolidating." },
  },
  rebel: {
    fr: { title: "Test des 3 questions — avant chaque rupture", description: "Valeur défendue ? Bénéficiaire autre que moi ? Choix ou réflexe ? Tenir un registre des combats fermés volontairement." },
    en: { title: "3-question test — before each rupture", description: "Value defended? Beneficiary other than me? Choice or reflex? Keep a log of voluntarily closed battles." },
  },
  sage: {
    fr: { title: "Transmission du work in progress — hebdomadaire", description: "Partager quelque chose que tu apprends actuellement, pas seulement que tu maîtrises. Observer la résistance à l'exposition de l'incertitude." },
    en: { title: "Work in progress transmission — weekly", description: "Share something you are currently learning, not only mastering. Observe resistance to exposing uncertainty." },
  },
  mystic: {
    fr: { title: "Ancrage dans les 24h — quotidien", description: "Après chaque prise de conscience symbolique ou intuition, définir un micro-acte concret à poser dans les 24h dans un domaine matériel." },
    en: { title: "24h grounding — daily", description: "After every symbolic insight or intuition, define one concrete micro-action to take within 24h in a material domain." },
  },
  healer: {
    fr: { title: "Politique de disponibilité — à définir une fois", description: "Horaires, durée, canaux. Afficher ou communiquer clairement. Observer la résistance à cette limitation." },
    en: { title: "Availability policy — define once", description: "Schedules, duration, channels. Display or communicate clearly. Observe resistance to this limitation." },
  },
  magician: {
    fr: { title: "Engagement visible mensuel", description: "Un acte public, irréversible, sans exit strategy préparée. Annonce, contrat, promesse explicite. Observer ce que l'exposition déclenche." },
    en: { title: "Monthly visible commitment", description: "One public, irreversible act without a prepared exit strategy. Announcement, contract, explicit promise. Observe what exposure triggers." },
  },
  jester: {
    fr: { title: "Atterrissage après la blague — quotidien", description: "Après un moment d'humour, laisser 5 secondes de silence. Observer ce qui émerge. Choisir d'y rester ou non." },
    en: { title: "Landing after the joke — daily", description: "After a moment of humor, allow 5 seconds of silence. Observe what emerges. Choose whether to stay there or not." },
  },
};

/* -------------------------------------------------------------------------- */
/* House labels & themes                                                       */
/* -------------------------------------------------------------------------- */

const HOUSE_LABELS: Record<number, Bi> = {
  1:  { fr: "Ego & Personnalité",       en: "Ego & Personality"        },
  2:  { fr: "Valeurs & Sécurité",       en: "Values & Security"        },
  3:  { fr: "Expression & Décisions",   en: "Expression & Choices"     },
  4:  { fr: "Foyer & Racines",          en: "Home & Roots"             },
  5:  { fr: "Créativité & Plaisir",     en: "Creativity & Joy"         },
  6:  { fr: "Travail & Santé",          en: "Work & Health"            },
  7:  { fr: "Relations & Partenariats", en: "Relationships & Partners" },
  8:  { fr: "Ressources Partagées",     en: "Shared Resources"         },
  9:  { fr: "Spiritualité & Quête",     en: "Spirituality & Quest"     },
  10: { fr: "Vocation & Potentiel",     en: "Vocation & Potential"     },
  11: { fr: "Monde & Contribution",     en: "World & Contribution"     },
  12: { fr: "Inconscient & Patterns",   en: "Unconscious & Patterns"   },
};

const HOUSE_THEMES: Record<number, Bi> = {
  1:  { fr: "image de soi, masque, première impression", en: "self-image, mask, first impression" },
  2:  { fr: "argent, possessions, valeurs fondamentales", en: "money, possessions, core values" },
  3:  { fr: "communication, choix, parole, cause/effet", en: "communication, choices, voice, cause/effect" },
  4:  { fr: "famille, sécurité émotionnelle, héritage",   en: "family, emotional safety, legacy" },
  5:  { fr: "créativité, sensualité, jeu, bonne fortune", en: "creativity, sensuality, play, good fortune" },
  6:  { fr: "occupation, éthique, équilibre travail/corps", en: "occupation, ethics, work/body balance" },
  7:  { fr: "couple, alliances, contrats relationnels",   en: "couple, alliances, relational contracts" },
  8:  { fr: "argent des autres, intimité profonde, fusion", en: "other's money, deep intimacy, merging" },
  9:  { fr: "croyances, sens, voyages intérieurs",        en: "beliefs, meaning, inner journeys" },
  10: { fr: "rôle social, autorité, sommet de potentiel", en: "social role, authority, peak potential" },
  11: { fr: "causes, communauté, vision collective",      en: "causes, community, collective vision" },
  12: { fr: "patterns profonds, surrender, karma",        en: "deep patterns, surrender, karma" },
};

/* -------------------------------------------------------------------------- */
/* Shadow theme per survival archetype                                        */
/* GUARDRAIL: survival-only — returns null for the 12 core archetypes.        */
/* Builder MUST handle null with a contextual fallback (see dynamicProfileBuilder). */
/* -------------------------------------------------------------------------- */

const SHADOW_THEME: Partial<Record<ArchKey, Bi>> = {
  child:      { fr: "Dépendance / Fuite de la responsabilité", en: "Dependency / Flight from responsibility" },
  victim:     { fr: "Impuissance / Cession du pouvoir",        en: "Powerlessness / Surrendering power"      },
  saboteur:   { fr: "Auto-sabotage / Peur du changement",      en: "Self-sabotage / Fear of change"          },
  prostitute: { fr: "Compromis d'intégrité / Vente de l'âme",  en: "Integrity compromise / Soul-selling"     },
};

/* -------------------------------------------------------------------------- */
/* Survival guardians — positive function + healing axis (Myss)               */
/* Ref: Myss, Gallery of Archetypes, Survival Family overview.                */
/* Each survival is a "trusted ally", not a defect.                           */
/* -------------------------------------------------------------------------- */

const SURVIVAL_GUARDIAN_FUNCTION: Partial<Record<ArchKey, Bi>> = {
  child: {
    fr: "Gardien de l'innocence et de la curiosité — préserve l'accès au jeu, à l'émerveillement, et signale quand un environnement n'est plus assez sûr pour que tu puisses être pleinement toi.",
    en: "Guardian of innocence and curiosity — preserves access to play, wonder, and signals when an environment is no longer safe enough for you to be fully yourself.",
  },
  victim: {
    fr: "Gardien de l'estime de soi — t'alerte quand tu commences à céder ton pouvoir, à accepter l'inacceptable, ou à laisser quelqu'un définir ta valeur à ta place.",
    en: "Guardian of self-esteem — alerts you when you start surrendering power, accepting the unacceptable, or letting someone else define your worth.",
  },
  saboteur: {
    fr: "Gardien du choix — révèle les peurs cachées au seuil des grandes décisions. Quand il s'active, c'est qu'un choix engageant est sur la table et qu'une partie de toi a besoin d'être entendue avant de pouvoir avancer.",
    en: "Guardian of choice — surfaces hidden fears at the threshold of big decisions. Its activation means a committing choice is on the table and part of you needs to be heard before moving forward.",
  },
  prostitute: {
    fr: "Gardien de la foi — t'alerte quand tu es sur le point de vendre ton intégrité contre une forme de sécurité (financière, relationnelle, statutaire). Son activation signale que tu doutes de ta capacité à être soutenu si tu restes aligné.",
    en: "Guardian of faith — alerts you when you are about to trade your integrity for some form of security (financial, relational, status-based). Its activation signals doubt in your capacity to be supported while staying aligned.",
  },
};

const SURVIVAL_HEALING_AXIS: Partial<Record<ArchKey, Bi>> = {
  child: {
    fr: "Ne pas chercher à 'sortir du Child' — chercher à lui offrir un cadre adulte assez fiable pour qu'il ne soit plus obligé de prendre les décisions à ta place. Identifier 1 zone de vie où tu peux poser un parent intérieur stable cette semaine.",
    en: "Do not try to 'get rid of the Child' — offer it an adult frame reliable enough that it no longer has to make decisions on your behalf. Identify one life zone where you can set a stable inner parent this week.",
  },
  victim: {
    fr: "Repérer les phrases internes 'je ne peux pas / on me fait / je n'ai pas le choix' et les transformer en formulation active : 'je choisis de / je décide de / je refuse de'. Tenir un registre de 3 décisions actives par semaine pour réancrer la souveraineté.",
    en: "Spot internal phrases 'I can't / they make me / I have no choice' and reframe them in active form: 'I choose to / I decide to / I refuse to'. Keep a log of 3 active decisions per week to re-anchor sovereignty.",
  },
  saboteur: {
    fr: "Quand tu sens monter le sabotage avant une décision importante, ne le combattre pas : lui demander explicitement 'de quoi as-tu peur ?'. Écrire la réponse. C'est presque toujours une peur ancienne déplacée sur le présent — l'identifier suffit souvent à débloquer.",
    en: "When sabotage rises before an important decision, do not fight it: explicitly ask 'what are you afraid of?'. Write the answer. It is almost always an old fear displaced onto the present — identifying it is often enough to unblock.",
  },
  prostitute: {
    fr: "Cartographier les 'compromis silencieux' actifs (où tu acceptes moins pour rester en sécurité). Pour chacun, identifier la croyance de manque sous-jacente. Travailler la confiance que tu peux être soutenu autrement — petits actes de cohérence répétés.",
    en: "Map the active 'silent compromises' (where you accept less to stay safe). For each, identify the underlying scarcity belief. Build trust that you can be supported differently — small acts of coherence repeated.",
  },
};

/* -------------------------------------------------------------------------- */
/* Tensions — dyad-level clinical reading                                     */
/* Keys are sorted alphabetically as `"a+b"` to avoid duplicate definitions.  */
/* -------------------------------------------------------------------------- */

function tensionKey(a: ArchKey, b: ArchKey): string {
  return [a, b].sort().join("+");
}

const TENSIONS: Record<string, Bi> = {
  [tensionKey("sovereign", "rebel")]: {
    fr: "Sovereign + Rebel : tension classique entre tenir le cadre et casser le cadre. Bien intégrée, elle produit un leadership lucide capable de réformer ce qu'il gouverne. Mal intégrée, elle alterne entre rigidité autoritaire et opposition stérile.",
    en: "Sovereign + Rebel: classic tension between holding the frame and breaking it. Well-integrated, it produces a lucid leadership able to reform what it governs. Poorly integrated, it swings between authoritarian rigidity and sterile opposition.",
  },
  [tensionKey("warrior", "lover")]: {
    fr: "Warrior + Lover : énergie de protection couplée à énergie de connexion. L'intégration donne un engagement intense et tenable. La non-intégration produit des cycles 'combat puis fusion' — soit on attaque, soit on se dissout dans l'autre.",
    en: "Warrior + Lover: protective energy coupled with connecting energy. Integration yields intense, sustainable commitment. Non-integration produces 'fight then fuse' cycles — either attacking or dissolving into the other.",
  },
  [tensionKey("mystic", "sage")]: {
    fr: "Mystique + Sage : intuition et analyse côte à côte. Risque de redondance — les deux cherchent du sens mais avec des grammaires différentes. Bien articulée, la triade gagne en autorité ; mal articulée, elle vit beaucoup 'dans la tête + le ciel' au détriment du corps et du concret.",
    en: "Mystic + Sage: intuition and analysis side by side. Risk of redundancy — both seek meaning with different grammars. Well-articulated, the triad gains authority; poorly articulated, it lives mostly 'in the head and the sky' to the detriment of body and the concrete.",
  },
  [tensionKey("caregiver", "sovereign")]: {
    fr: "Caregiver + Sovereign : tu portes à la fois la fonction de soin et la fonction de cadre. Intégré, c'est un leadership profondément humain. Non intégré, le Caregiver paye en silence pour les coûts émotionnels que le Sovereign refuse de voir.",
    en: "Caregiver + Sovereign: you carry both the care function and the frame function. Integrated, it is a deeply human leadership. Non-integrated, the Caregiver silently pays for the emotional costs the Sovereign refuses to see.",
  },
  [tensionKey("creator", "magician")]: {
    fr: "Creator + Magicien : tu manifestes ET tu orchestres. Très puissant en intégration — la création trouve ses canaux de réalisation efficaces. Mal intégré, le Magicien finit par dicter au Creator ce qui est 'stratégiquement opportun' au lieu de ce qui est vivant.",
    en: "Creator + Magician: you manifest AND you orchestrate. Very powerful integrated — creation finds efficient channels of realization. Poorly integrated, the Magician dictates to the Creator what is 'strategically opportune' instead of what is alive.",
  },
  [tensionKey("explorer", "healer")]: {
    fr: "Explorer + Healer : tension entre mouvement vers l'inconnu et présence à la blessure (la tienne ou celle de l'autre). Bien tenue, l'Explorer empêche le Healer de stagner dans la souffrance ; mal tenue, l'Explorer fuit dès que le Healer s'approche de quelque chose qui demande à être traversé.",
    en: "Explorer + Healer: tension between movement toward the unknown and presence to the wound (yours or another's). Well-held, the Explorer prevents the Healer from stagnating in suffering; poorly held, the Explorer flees as soon as the Healer approaches something that needs to be traversed.",
  },
  [tensionKey("jester", "sage")]: {
    fr: "Jester + Sage : intelligence ironique + intelligence structurée. Combinaison rare et puissante quand elle tient — humour qui révèle plutôt que qui esquive. Risque : le Jester court-circuite les conclusions du Sage, ou le Sage 'sérieux' contraint le Jester à se taire au mauvais moment.",
    en: "Jester + Sage: ironic intelligence + structured intelligence. Rare, powerful combo when it holds — humor that reveals rather than escapes. Risk: the Jester short-circuits the Sage's conclusions, or the 'serious' Sage gags the Jester at the wrong moment.",
  },
};

/* -------------------------------------------------------------------------- */
/* Public getters                                                              */
/* -------------------------------------------------------------------------- */

export const get = {
  tagline:                  (a: ArchKey, l: Locale) => TAGLINES[a]?.[l],
  gives:                    (a: ArchKey, l: Locale) => GIVES[a]?.[l],
  watchout:                 (a: ArchKey, l: Locale) => WATCHOUTS[a]?.[l],
  adminFunctions:           (a: ArchKey, l: Locale) => ADMIN_FUNCTIONS[a]?.[l],
  adminRisks:               (a: ArchKey, l: Locale) => ADMIN_RISKS[a]?.[l],
  adminWork:                (a: ArchKey, l: Locale) => ADMIN_WORK[a]?.[l],
  strengthHint:             (a: ArchKey, l: Locale) => STRENGTH_HINT[a]?.[l],
  vigilanceHint:            (a: ArchKey, l: Locale) => VIGILANCE_HINT[a]?.[l],
  practice:                 (a: ArchKey, l: Locale) => PRACTICES[a]?.[l],
  houseLabel:               (h: number,  l: Locale) => HOUSE_LABELS[h]?.[l]  ?? `${l === "fr" ? "Maison" : "House"} ${h}`,
  houseTheme:               (h: number,  l: Locale) => HOUSE_THEMES[h]?.[l]  ?? (l === "fr" ? "domaine clé" : "key domain"),
  /** Returns null for non-survival keys. Builder must provide a contextual fallback. */
  shadowTheme:              (a: ArchKey, l: Locale): string | null => SHADOW_THEME[a]?.[l] ?? null,
  /** Survival-only: positive guardian function per Myss. */
  survivalGuardianFunction: (a: ArchKey, l: Locale) => SURVIVAL_GUARDIAN_FUNCTION[a]?.[l],
  /** Survival-only: how to integrate the guardian rather than fight it. */
  survivalHealingAxis:      (a: ArchKey, l: Locale) => SURVIVAL_HEALING_AXIS[a]?.[l],
  /** Returns a tension reading for a pair of archetypes, if defined. */
  tension:                  (a: ArchKey, b: ArchKey, l: Locale) => TENSIONS[tensionKey(a, b)]?.[l],
};

/* -------------------------------------------------------------------------- */
/* Phrasing helpers                                                            */
/* -------------------------------------------------------------------------- */

export const phrases = {
  tripleTitle: (label: string, locale: Locale) =>
    locale === "fr" ? `Triade dominante : ${label}` : `Dominant triad: ${label}`,

  defaultProfileLabel: (locale: Locale) =>
    locale === "fr" ? "Profil archétypal" : "Archetypal profile",

  overviewLead: (labels: string[], locale: Locale) => {
    const [l1, l2] = labels;
    if (!labels.length) {
      return locale === "fr"
        ? "Ton profil archétypal est encore en cours de constitution."
        : "Your archetypal profile is still taking shape.";
    }
    if (locale === "fr") {
      return `Ta cartographie révèle une dynamique portée par le **${l1 || "?"}** et le **${l2 || "?"}**. C'est ton **Alliance de Lumière**, ta structure identitaire la plus saine et ta façon la plus naturelle d'impacter le monde.`;
    }
    return `Your cartography reveals a dynamic driven by the **${l1 || "?"}** and the **${l2 || "?"}**. This is your **Light Alliance**, your healthiest identity structure and your most natural way to impact the world.`;
  },

  taglineFallback: (locale: Locale) =>
    locale === "fr" ? "Archétype clé de ton paysage intérieur." : "Key archetype of your inner landscape.",

  adminFunctionsFallback: (label: string, locale: Locale) =>
    locale === "fr" ? `Fonctions clés du ${label}.` : `Key functions of the ${label}.`,

  adminEvidence: (rank: number, houses: number[], locale: Locale) => {
    const houseStr = houses.join(", ");
    return locale === "fr"
      ? `Présent dans le top ${rank} des archétypes scorés. Maison(s) d'activation : ${houseStr}.`
      : `Present in the top ${rank} of scored archetypes. Activation house(s): ${houseStr}.`;
  },

  adminWorkFallback: (label: string, locale: Locale) =>
    locale === "fr"
      ? `Observer les situations où le ${label} s'active en ombre et définir l'acte correctif immédiat.`
      : `Observe situations where the ${label} activates in shadow and define the immediate corrective act.`,

  hotspotTheme: (label: string, theme: string, locale: Locale) =>
    locale === "fr"
      ? `Activation de ${label} — ${theme}.`
      : `Activation of ${label} — ${theme}.`,

  /**
   * Survival narratives — user-facing.
   * Frame as guardian/regulator (Myss), not pathology.
   */
  noActiveSurvivalUser: (locale: Locale) =>
    locale === "fr"
      ? "Tes quatre gardiens de survie (Child, Victim, Saboteur, Prostitute) sont en mode discret en ce moment — aucun ne capte une part dominante de ton énergie. C'est un terrain favorable pour activer tes archétypes lumineux sans trop d'interférence de peur."
      : "Your four survival guardians (Child, Victim, Saboteur, Prostitute) are in quiet mode right now — none is capturing a dominant share of your energy. This is favorable ground to activate your light archetypes without much fear interference.",

  activeSurvivalUser: (parts: string[], locale: Locale) =>
    locale === "fr"
      ? `**Conseil de l'Ombre activé** : ${parts.join(" · ")}.\nCes archétypes de survie ne sont pas des défauts, ce sont des gardiens (Caroline Myss). Leur activation (en ambre) indique des zones où ton système nerveux perçoit une menace profonde sur ton intégrité, ton pouvoir ou ta sécurité. Le danger n'est pas de les ressentir, mais de les laisser signer tes contrats et prendre les décisions à la place de ton Alliance de Lumière.`
      : `**Active Shadow Council**: ${parts.join(" · ")}.\nThese survival archetypes are not flaws, they are guardians (Caroline Myss). Their activation (in amber) indicates zones where your nervous system perceives a deep threat to your integrity, power or safety. The danger is not feeling them, but letting them sign your contracts and make decisions instead of your Light Alliance.`,

  /**
   * Survival narratives — admin-facing.
   * Clinical reading, Myss frame.
   */
  noActiveSurvivalAdmin: (locale: Locale) =>
    locale === "fr"
      ? "Aucun signal de survie significatif. Les quatre gardiens (Child, Victim, Saboteur, Prostitute) sont en mode bas — profil stable côté peurs de survie. Point de vigilance : les survie bas peuvent aussi indiquer un déni ou une adaptation défensive très intégrée. À évaluer en entretien."
      : "No significant survival signal. The four guardians (Child, Victim, Saboteur, Prostitute) are in low mode — profile stable on survival fears. Watchpoint: low survival scores may also indicate denial or a highly integrated defensive adaptation. To evaluate in interview.",

  activeSurvivalAdmin: (parts: string[], locale: Locale) =>
    locale === "fr"
      ? `Conseil de l'Ombre (Gardiens actifs) : ${parts.join(" · ")}. Réf. Myss — Survival Family : chaque gardien actif filtre la perception du réel et oriente les contrats implicites de la personne via son axe de survie. Axes de régulation : (1) nommer la peur racine (impuissance, trahison, perte de sens) de chaque gardien, (2) identifier les décisions d'évitement récentes dictées par cette peur, (3) créer un espace de dissociation consciente avant l'action. En clinique : observer comment l'Alliance de Lumière est souvent instrumentalisée pour ne pas faire face à ces gardiens.`
      : `Shadow Council (Active Guardians): ${parts.join(" · ")}. Ref. Myss — Survival Family: each active guardian filters perception of reality and shapes the person's implicit contracts via its survival axis. Regulation axes: (1) name the root fear (powerlessness, betrayal, loss of meaning) of each guardian, (2) identify recent avoidance decisions dictated by this fear, (3) create a conscious dissociation space before acting. In coaching: observe how the Light Alliance is often weaponized to avoid facing these guardians.`,

  /**
   * Closing narrative — includes contextual shadow theme.
   * GUARDRAIL: must reference the actual primary shadow when known.
   */
  closingNarrative: (l1: string, l2: string, l3: string, primaryShadow: string | null, locale: Locale) => {
    const themeFr = primaryShadow || "les mécanismes de l'Ombre";
    const themeEn = primaryShadow || "Shadow mechanisms";

    if (locale === "fr") {
      return `**Diagnostic Clinique Croisé (Lumière ↔ Ombre)** :\nBien que ta force de frappe identitaire réside dans l'énergie du **${l1 || "?"}**, ta cartographie indique que ton système se protège souvent via **${themeFr}**. \n\nQuand le réel devient menaçant ou que l'impuissance s'installe, le risque (le "Spiritual/Systemic Bypassing") est d'utiliser ton Alliance de Lumière (${l1 || "?"}) non pas pour impacter le monde, mais pour **fuir ou masquer tes douleurs de survie**. L'enjeu de ce rapport est de t'inviter à descendre de ton piédestal lumineux pour aller apaiser cette blessure fondamentale dans la matière, afin que ta Lumière redevienne un choix et non une fuite.`;
    }
    return `**Cross-Clinical Diagnostic (Light ↔ Shadow)**:\nAlthough your identity's striking force lies in the energy of the **${l1 || "?"}**, your cartography indicates that your system often protects itself via **${themeEn}**. \n\nWhen reality becomes threatening or powerlessness sets in, the risk ("Spiritual/Systemic Bypassing") is using your Light Alliance (${l1 || "?"}) not to impact the world, but to **flee or mask your survival pain**. The stakes of this report are to invite you to step down from your luminous pedestal to soothe this fundamental wound in the physical world, so your Light becomes a choice again, not an escape.`;
  },

  strengthFallback: (label: string, hint: string | undefined, locale: Locale) =>
    `**${label}** : ${hint ?? (locale === "fr" ? "force naturelle de cet archétype." : "natural strength of this archetype.")}`,

  vigilanceFallback: (label: string, locale: Locale) =>
    locale === "fr"
      ? `Observer la zone d'ombre du ${label} — signal précoce : ${label.toLowerCase()} qui s'active de façon réflexe plutôt que choisie.`
      : `Watch the shadow zone of the ${label} — early signal: ${label.toLowerCase()} activating reflexively rather than by choice.`,

  defaultPractices: (locale: Locale) => locale === "fr" ? [
    { title: "Body scan — 10 min", description: "Ancre tes archétypes dans le corps avant toute décision importante : 3 respirations, sensation des pieds au sol, scan des tensions." },
    { title: "Journal de clarification — 5 min", description: "Écris ce que ta triade dominante cherche à exprimer aujourd'hui. Puis : quel acte concret honore cet élan sans tomber dans l'ombre ?" },
  ] : [
    { title: "Body scan — 10 min", description: "Ground your archetypes in the body before any important decision: 3 breaths, feet sensation, tension scan." },
    { title: "Clarification journal — 5 min", description: "Write what your dominant triad is trying to express today. Then: what concrete act honors this impulse without falling into shadow?" },
  ],

  adminResources: (locale: Locale) =>
    locale === "fr"
      ? "Archétypes secondaires disponibles comme ressources selon les scores (voir le Wheel). Activer en pratiques ciblées selon les angles morts du profil dominant."
      : "Secondary archetypes available as resources per scores (see the Wheel). Activate in targeted practices according to the blind spots of the dominant profile.",

  adminNoSurvival: (locale: Locale) =>
    locale === "fr" ? "Aucun signal de survie significatif." : "No significant survival signal.",

  /**
   * Admin hypothesis — names the operational reading.
   * GUARDRAIL: avoid prescriptive numeric thresholds in the narrative.
   * Ratios are labelled "indicatif" / "à ajuster" only.
   */
  adminHypothesis: (l1: string, l2: string, l3: string, locale: Locale) =>
    locale === "fr"
      ? `Profil orienté ${l1} (dominant) avec appui ${l2} / ${l3}. Lire le ratio lumière/ombre pour chaque archétype : un ratio ombre élevé sur le dominant suggère une activation défensive à travailler en priorité — seuil indicatif, à ajuster selon le contexte de l'entretien. Axe complémentaire : activer les archétypes peu scorés pour rééquilibrer les angles morts du profil.`
      : `Profile oriented toward ${l1} (dominant) with support from ${l2} / ${l3}. Read the light/shadow ratio per archetype: a high shadow ratio on the dominant suggests a defensive activation to prioritize — indicative threshold, to be adjusted based on interview context. Complementary axis: activate low-scored archetypes to rebalance the profile's blind spots.`,

  /**
   * Sacred Contract — operational formulation, no prescriptive ratios.
   */
  adminContract: (labels: string[], activeSurvivalLabels: string[], topLabel: string, locale: Locale): string[] => {
    const join = labels.join(" + ");
    if (locale === "fr") {
      return [
        `Contrat sacré opérationnel : ta mission de vie implique concrètement d'exercer les fonctions de ${join} — pas comme performances, mais comme modes d'être au service d'un ordre plus grand que l'ego. Le travail est de rendre ces fonctions conscientes et choisies.`,
        activeSurvivalLabels.length > 0
          ? `Régulation des gardiens actifs (${activeSurvivalLabels.join(", ")}) : ces peurs de survie constituent le bruit de fond de tes décisions. L'axe est de créer suffisamment de sécurité intérieure pour que les gardiens passent en mode alerte utile — plutôt qu'en mode prise de contrôle automatique.`
          : `Aucun gardien de survie dominant actif — terrain favorable. Rester vigilant aux activations de survie sous stress aigu : c'est là qu'elles émergent même chez les profils stables.`,
        `Priorité AEGIS : combiner des pratiques qui honorent le ${topLabel} en lumière (renforcement) avec des micro-expositions délibérées à ses zones d'ombre (régulation). Doser le ratio renforcement / travail d'ombre selon la phase actuelle de la personne — au démarrage, le renforcement domine ; en consolidation, le travail d'ombre prend plus de place.`,
      ];
    }
    return [
      `Operational Sacred Contract: your life mission concretely involves exercising the functions of ${join} — not as performances, but as ways of being in service of an order greater than the ego. The work is to make these functions conscious and chosen.`,
      activeSurvivalLabels.length > 0
        ? `Regulation of active guardians (${activeSurvivalLabels.join(", ")}): these survival fears form the background noise of your decisions. The axis is to create enough inner security for guardians to switch to useful alert mode — rather than automatic takeover mode.`
        : `No dominant active survival guardian — favorable ground. Stay vigilant to survival activations under acute stress: that is where they emerge even in stable profiles.`,
      `AEGIS priority: combine practices that honor the ${topLabel} in light (reinforcement) with deliberate micro-exposures to its shadow zones (regulation). Tune the reinforcement / shadow work ratio to the person's current phase — early on, reinforcement dominates; in consolidation, shadow work takes more space.`,
    ];
  },
};
