/**
 * Aegis Deep Dive (V2) — narrative templates (bilingual FR/EN).
 *
 * Pure, deterministic content used by the Deep Dive report generator.
 * No I/O, no React. Bilingual via locale-aware getters.
 *
 * Public API (locale-aware):
 *   - getArchetypeIntro(arch, locale)
 *   - getHouseContext(house, locale)
 *   - tonePhrase(light, shadow, locale)
 *   - composeArchetypeHouse(arch, house, stats, locale)
 *   - pickTopCombos(analysis, limit)
 *
 * Backwards-compat (defaults to FR — used by legacy callers):
 *   - archetypeIntro, houseContext
 */

import type {
  AnyArchetypeKey,
  ArchetypeStats,
  DeepDiveAnalysis,
  HouseStats,
} from "./types";
import { HOUSES } from "./types";
import type { Locale } from "@/i18n/translations";

/* -------------------------------------------------------------------------- */
/* Archetype portraits — FR                                                    */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_INTRO_FR: Record<AnyArchetypeKey, string> = {
  caregiver: "Le Caregiver représente ton élan naturel à nourrir, contenir et prendre soin, des personnes comme des projets. En lumière, il sait soutenir sans se sacrifier, créer un climat de sécurité, materner de façon mature. En ombre, il se sur-sacrifie, materne pour contrôler, ou s’oublie complètement. Son travail est d’équilibrer « je prends soin de toi » avec « je prends aussi soin de moi ».",
  child: "Le Child construit ta manière de percevoir la vie, la sécurité, la loyauté et le fait de « grandir ». En lumière, il apporte innocence, créativité, confiance et capacité à recommencer. En ombre, il reste bloqué dans la dépendance, la peur de la responsabilité ou le refus de quitter des rôles infantiles. Travailler avec ce Child, c’est affiner l’équilibre entre innocence et responsabilité.",
  creator: "Le Creator porte ta pulsion de faire exister des choses : idées, œuvres, systèmes, relations. En lumière, il canalise l’inspiration en formes concrètes, voit des possibilités où les autres voient des limites. En ombre, il se perd dans la perfection, l’auto-critique ou l’utilisation de son talent pour manipuler. Il t’apprend à assumer ton rôle de co-créateur, sans saboter tes propres œuvres.",
  explorer: "L’Explorer est ton élan vers l’inconnu, le changement, la découverte de nouvelles perspectives. En lumière, il te permet de sortir des scripts familiaux, d’ouvrir ta vie, de trouver ta propre voie. En ombre, il fuit l’engagement, la stabilité, et confond mouvement et liberté. Il travaille à transformer la fuite en exploration consciente et assumée.",
  healer: "Le Healer concerne ta manière de rencontrer la souffrance — la tienne et celle des autres. En lumière, il transforme blessure en ressource, écoute en profondeur, accompagne la guérison. En ombre, il se définit par ses blessures, cherche à sauver tout le monde, s’épuise. Il t’apprend à guérir avec, pas contre, ce que tu as traversé.",
  jester: "Le Jester est ta fonction de jeu, d’humour, de renversement des perspectives. En lumière, il allège, révèle des vérités à travers le rire, fait circuler l’énergie là où tout est figé. En ombre, il se cache derrière la blague pour ne jamais se montrer, minimise tout, sabote la profondeur. Il te montre quand le rire ouvre, et quand il sert à fuir.",
  lover: "Le Lover colore ta façon d’aimer, de désirer, d’entrer en relation avec les personnes, les projets et la vie. En lumière, il apporte présence, intensité, capacité de connexion profonde. En ombre, il tombe dans la dépendance, la recherche de validation ou le drama. Le Lover t’apprend à aimer sans te perdre, et à laisser la passion nourrir plutôt que consommer.",
  magician: "Le Magician touche ta capacité à transformer, influencer, jouer avec les dynamiques visibles et invisibles. En lumière, il alchimise, connecte les bonnes personnes, voit les effets à long terme, fait bouger les lignes en finesse. En ombre, il manipule, garde l’avantage, retient l’information ou l’énergie pour contrôler. Son travail est de passer du pouvoir sur les autres à la maîtrise de ton propre pouvoir créateur.",
  mystic: "Le Mystic reflète ton lien direct avec le sacré, l’invisible, le niveau symbolique de ta vie. En lumière, il perçoit les synchronicités, les signes, et fait confiance à un ordre plus vaste. En ombre, il se coupe du monde ou se perd dans les expériences intérieures sans ancrage. Il t’enseigne à vivre ta spiritualité au cœur du quotidien, pas comme une échappatoire.",
  prostitute: "La Prostitute garde la frontière entre ce qui est à vendre et ce qui ne l’est pas. En lumière, elle protège ton intégrité : « je ne sacrifie pas mon âme, même pour la sécurité ». En ombre, elle accepte des situations qui te trahissent par peur de manquer. Elle te montre précisément à quel prix tu es encore prêt à te vendre pour rester en sécurité.",
  rebel: "Le Rebel porte ta relation à la règle, à la norme et à l’autorité. En lumière, il défie les systèmes injustes, ouvre des voies alternatives, protège la vérité. En ombre, il casse pour casser, rejette avant de comprendre, se coupe de soutiens possibles. Son enjeu est de choisir quand la rébellion sert vraiment ton contrat, et quand elle rejoue une vieille guerre.",
  saboteur: "Le Saboteur est le gardien de tes choix : il se manifeste surtout au moment où une vraie opportunité arrive. En lumière, il t’alerte sur les risques et t’invite à vérifier tes motivations avant d’agir. En ombre, il te coupe les jambes juste avant le pas important : procrastination, autocritique, fuite. Il t’apprend à reconnaître quand tu empêches toi-même ta propre expansion.",
  sage: "Le Sage représente ton besoin de comprendre, de donner du sens et de transmettre. En lumière, il observe, relie, clarifie, enseigne avec humilité. En ombre, il intellectualise tout, se cache derrière le mental, ou utilise le savoir pour prendre le dessus. Il t’invite à laisser ta compréhension descendre dans la vie concrète, pas seulement dans les concepts.",
  sovereign: "Le Sovereign structure ta façon de prendre des responsabilités, de décider et d’ordonner ta vie. En lumière, il gouverne avec clarté, justesse, sens du bien commun. En ombre, il devient contrôlant, autoritaire, obsédé par le statut ou l’image. Son travail consiste à passer d’un pouvoir centré sur l’ego à une autorité au service de ta vocation et de ton entourage.",
  victim: "Le Victim touche à tes frontières et à ton rapport au pouvoir personnel. En lumière, il te signale quand une situation est abusive et t’aide à te positionner. En ombre, il se complaît dans l’impuissance, le ressentiment et la recherche de coupables. Son travail consiste à passer de « on me fait » à « comment je récupère ma puissance dans cette histoire ».",
  warrior: "Le Warrior incarne ta capacité à te battre pour ce qui compte, à protéger et à tenir sous pression. En lumière, il te donne courage, endurance, sens des limites et de la justice. En ombre, il devient agressif, défensif, ou se bat contre les mauvaises choses (ton propre corps, tes alliés). Il te montre quels combats valent ton énergie et lesquels rejouent un vieux champ de bataille.",
};

/* -------------------------------------------------------------------------- */
/* Archetype portraits — EN                                                    */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_INTRO_EN: Record<AnyArchetypeKey, string> = {
  caregiver: "The Caregiver represents your natural impulse to nourish, contain and care for others and projects. In light, he can support without sacrificing himself, create a climate of safety, mother in a mature way. In shadow, he over-sacrifices, mothers to control, or forgets himself completely. His work is to balance « I take care of you » with « I also take care of myself ».",
  child: "The Child shapes how you perceive life, safety, loyalty and the process of « growing up ». In light, it brings innocence, creativity, trust and the ability to start again. In shadow, it gets stuck in dependency, fear of responsibility or refuses to leave childish roles. Working with this Child means refining the balance between innocence and responsibility.",
  creator: "The Creator carries your drive to bring things into being: ideas, works, systems, relationships. In light, he channels inspiration into concrete forms, sees possibilities where others see limits. In shadow, he gets lost in perfectionism, self-criticism or uses his talent to manipulate. He teaches you to own your role as co-creator, without sabotaging your own works.",
  explorer: "The Explorer is your impulse toward the unknown, change and discovering new perspectives. In light, he allows you to step out of family scripts, open your life and find your own path. In shadow, he flees commitment, stability, and confuses movement with freedom. He works to transform flight into conscious, chosen exploration.",
  healer: "The Healer concerns how you meet suffering — yours and others'. In light, he transforms wounds into resources, listens deeply and accompanies healing. In shadow, he defines himself by his wounds, tries to save everyone, and burns out. He teaches you to heal with, not against, what you have gone through.",
  jester: "The Jester is your function of play, humor and perspective reversal. In light, he lightens, reveals truths through laughter, and gets energy flowing where everything is stuck. In shadow, he hides behind jokes to never show himself, minimizes everything and sabotages depth. He shows you when laughter opens, and when it serves to escape.",
  lover: "The Lover colors how you love, desire and relate to people, projects and life. In light, he brings presence, intensity and the capacity for deep connection. In shadow, he falls into dependency, seeking validation or drama. The Lover teaches you to love without losing yourself, and to let passion nourish rather than consume.",
  magician: "The Magician touches your ability to transform, influence and play with visible and invisible dynamics. In light, he alchemizes, connects the right people, sees long-term effects and nudges change with subtlety. In shadow, he manipulates, keeps the advantage and withholds information or energy to control. His work is to move from power over others to mastery of your own creative power.",
  mystic: "The Mystic reflects your direct link to the sacred, the invisible, the symbolic level of your life. In light, he perceives synchronicities, signs, and trusts a larger order. In shadow, he cuts himself off from the world or gets lost in inner experiences without grounding. He teaches you to live your spirituality at the heart of daily life, not as an escape.",
  prostitute: "The Prostitute guards the boundary between what is for sale and what is not. In light, she protects your integrity: « I will not sacrifice my soul, even for security ». In shadow, she accepts situations that betray you out of fear of lack. She shows you precisely at what price you are still ready to sell yourself to remain safe.",
  rebel: "The Rebel carries your relationship to rules, norms and authority. In light, he challenges unjust systems, opens alternative paths, protects the truth. In shadow, he rebels for the sake of rebelling, rejects before understanding, cuts himself off from possible supports. His issue is choosing when rebellion truly serves your purpose, and when it replays an old war.",
  saboteur: "The Saboteur is the guardian of your choices: it shows up especially when a real opportunity arrives. In light, it alerts you to risks and invites you to check your motivations before acting. In shadow, it cuts your legs out just before the important step: procrastination, self-criticism, escape. It teaches you to recognize when you yourself prevent your own expansion.",
  sage: "The Sage represents your need to understand, to give meaning and to transmit. In light, he observes, connects, clarifies and teaches with humility. In shadow, he intellectualizes everything, hides behind the mind, or uses knowledge to gain the upper hand. He invites you to let your understanding descend into concrete life, not remain only in concepts.",
  sovereign: "The Sovereign structures how you take responsibility, decide and order your life. In light, he governs with clarity, fairness and a sense of the common good. In shadow, he becomes controlling, authoritarian, obsessed with status or image. His work is to shift from ego-centered power to an authority that serves your vocation and your circle.",
  victim: "The Victim touches your boundaries and your relation to personal power. In light, it signals to you when a situation is abusive and helps you take a stand. In shadow, it wallows in powerlessness, resentment and the search for scapegoats. Its work is to move from « things are done to me » to « how do I reclaim my power in this story ».",
  warrior: "The Warrior embodies your capacity to fight for what matters, to protect and to hold under pressure. In light, he gives you courage, endurance, a sense of limits and of justice. In shadow, he becomes aggressive, defensive, or fights the wrong things (your own body, your allies). He shows you which battles deserve your energy and which replay an old battlefield.",
};

/* -------------------------------------------------------------------------- */
/* House contexts (1..12) — FR                                                 */
/* -------------------------------------------------------------------------- */

const HOUSE_CONTEXT_FR: Record<number, string> = {
  "1": "Cette maison parle de ton masque, de la façon dont tu entres dans le monde et de la première impression que tu donnes. L’archétype ici colore ton style de présence : comment ton ego s’organise, comment tu prends ou évites la place.",
  "10": "Cette maison parle de ton sommet de potentiel, de ta vocation et de ton rôle public. L’archétype ici raconte la forme que peut prendre ta contribution au monde, et les risques de trahison de cette vocation.",
  "11": "Domaine des collectifs, des causes, de la vision pour l’humanité. L’archétype ici colore la manière dont tu te sens relié aux mouvements, communautés et changements collectifs.",
  "12": "Zone des peurs profondes, du karma, de ce que tu caches même à toi-même. L’archétype ici révèle les scénarios récurrents que tu revis, et la façon dont tu peux les transmuter en conscience et en surrender.",
  "2": "Cette maison relie ton archétype à l’argent, aux possessions, à ce que tu considères comme « avoir de la valeur ». On y voit comment tu négocies entre sécurité et intégrité, et ce à quoi tu t’attaches pour te sentir en sécurité.",
  "3": "Domaine de la parole, des choix, du lien cause-effet. L’archétype dans cette maison montre comment tu utilises ta voix, comment tu décides, comment tu gères la responsabilité de tes actes.",
  "4": "Cette maison parle de ta famille d’origine, de ton « home » actuel et de ta sécurité émotionnelle. L’archétype ici éclaire comment tu portes ou refuses ton histoire familiale, et comment tu crées (ou non) un foyer sain pour toi.",
  "5": "Cette maison lie l’archétype à ta créativité, à tes enfants (biologiques ou projets), à ta façon de jouer avec la vie. On y voit comment ton feu créatif s’exprime, et s’il sert la joie ou la manipulation.",
  "6": "Domaine du travail quotidien, de la santé, de l’éthique dans la survie. L’archétype ici montre comment tu te traites dans le contexte pro, et comment tu négocies entre performance, corps et alignement.",
  "7": "Cette maison parle de tes relations clés : couple, associations, duelles. L’archétype ici décrit comment tu co-crées ou rejoues des patterns à deux (projection, dépendance, alliance, trahison).",
  "8": "Cette maison relie l’archétype à l’argent des autres, aux héritages, aux dettes et à l’intimité profonde. On voit comment tu gères fusion, pouvoir partagé, vulnérabilité et ressources qui ne viennent pas directement de toi.",
  "9": "Domaine de la quête de sens, des grandes croyances, des voyages intérieurs et extérieurs. L’archétype ici montre comment tu cherches la vérité, comment tu organises ta vision du monde et du sacré.",
};

/* -------------------------------------------------------------------------- */
/* House contexts (1..12) — EN                                                 */
/* -------------------------------------------------------------------------- */

const HOUSE_CONTEXT_EN: Record<number, string> = {
  "1": "This House speaks about your mask, how you enter the world and the first impression you give. The archetype here colors your style of presence: how your ego organizes, how you take or avoid your place.",
  "10": "This House speaks about your summit of potential, your vocation and your public role. The archetype here tells the form your contribution to the world can take, and the risks of betraying that vocation.",
  "11": "Domain of collectives, causes and vision for humanity. The archetype here colors how you feel connected to movements, communities and collective change.",
  "12": "Zone of deep fears, karma and what you hide even from yourself. The archetype here reveals recurring scenarios you replay, and how you can transmute them into awareness and surrender.",
  "2": "This House links your archetype to money, possessions and what you consider to be « having value ». It shows how you negotiate between security and integrity, and what you cling to in order to feel safe.",
  "3": "Domain of speech, choices and cause-effect link. The archetype in this House shows how you use your voice, how you decide, and how you handle responsibility for your actions.",
  "4": "This House speaks about your family of origin, your current « home » and your emotional security. The archetype here illuminates how you carry or refuse your family story, and how you create (or not) a healthy home for yourself.",
  "5": "This House links the archetype to your creativity, your children (biological or projects) and your way of playing with life. It shows how your creative fire expresses itself, and whether it serves joy or manipulation.",
  "6": "Domain of daily work, health and ethics in survival. The archetype here shows how you treat yourself in the professional context, and how you negotiate between performance, body and alignment.",
  "7": "This House speaks about your key relationships: couple, partnerships, duos. The archetype here describes how you co-create or replay two-person patterns (projection, dependency, alliance, betrayal).",
  "8": "This House links the archetype to other people's money, inheritances, debts and deep intimacy. It shows how you handle fusion, shared power, vulnerability and resources that don't come directly from you.",
  "9": "Domain of the quest for meaning, big beliefs and inner and outer journeys. The archetype here shows how you seek truth, and how you organize your vision of the world and the sacred.",
};

/* -------------------------------------------------------------------------- */
/* Tone phrases (light/shadow ratio) — FR & EN                                 */
/* -------------------------------------------------------------------------- */

const TONE_PHRASES_FR = {
  balanced: "Terrain de bascule : la lumière et l’ombre se disputent à parts presque égales.",
  fullLight: "Tu opères ici principalement depuis la lumière de cet archétype.",
  fullShadow: "Tu opères ici principalement depuis l’ombre de cet archétype.",
  mostlyLight: "Lumière dominante, avec quelques zones d’ombre à intégrer.",
  mostlyShadow: "Ombre dominante, avec des éclats de lumière à cultiver.",
  none: "Aucun signal significatif sur ce thème pour l’instant.",
};

const TONE_PHRASES_EN = {
  balanced: "Balance point: light and shadow contend in almost equal measure.",
  fullLight: "You operate here primarily from the light of this archetype.",
  fullShadow: "You operate here primarily from the shadow of this archetype.",
  mostlyLight: "Dominant light, with some shadow areas to integrate.",
  mostlyShadow: "Shadow dominant, with flashes of light to cultivate.",
  none: "No significant signal on this topic for now.",
};

const HOUSE_LABEL = { fr: "Maison", en: "House" };

/* -------------------------------------------------------------------------- */
/* Locale-aware getters                                                        */
/* -------------------------------------------------------------------------- */

export function getArchetypeIntro(arch: AnyArchetypeKey, locale: Locale = "fr"): string {
  return locale === "en" ? ARCHETYPE_INTRO_EN[arch] : ARCHETYPE_INTRO_FR[arch];
}

export function getHouseContext(house: number, locale: Locale = "fr"): string {
  return locale === "en" ? HOUSE_CONTEXT_EN[house] : HOUSE_CONTEXT_FR[house];
}

/**
 * Returns a qualitative tone phrase based on the light/shadow split of a stats
 * block. Pure function — easy to unit test.
 */
export function tonePhrase(light: number, shadow: number, locale: Locale = "fr"): string {
  const dict = locale === "en" ? TONE_PHRASES_EN : TONE_PHRASES_FR;
  const total = light + shadow;
  if (total <= 0) return dict.none;
  const lightRatio = light / total;
  if (lightRatio >= 0.75) return dict.fullLight;
  if (lightRatio >= 0.55) return dict.mostlyLight;
  if (lightRatio >= 0.45) return dict.balanced;
  if (lightRatio >= 0.25) return dict.mostlyShadow;
  return dict.fullShadow;
}

/* -------------------------------------------------------------------------- */
/* Backwards-compat exports (FR — legacy)                                      */
/* -------------------------------------------------------------------------- */

export const archetypeIntro = ARCHETYPE_INTRO_FR;
export const houseContext = HOUSE_CONTEXT_FR;

/* -------------------------------------------------------------------------- */
/* Compose helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Compose a full narrative block for a given (archetype × house) combo.
 * Returns null if either key is unknown.
 */
export function composeArchetypeHouse(
  arch: AnyArchetypeKey,
  house: number,
  stats?: HouseStats | ArchetypeStats,
  locale: Locale = "fr",
): string | null {
  const intro = getArchetypeIntro(arch, locale);
  const context = getHouseContext(house, locale);
  if (!intro || !context) return null;

  const houseMeta = HOUSES.find((h) => h.number === house);
  const houseLabel = HOUSE_LABEL[locale];
  const houseName = houseMeta ? (locale === "en" ? houseMeta.label_en : houseMeta.label_fr) : null;
  const title = houseName
    ? `${capitalize(arch)} — ${houseLabel} ${house} : ${houseName}`
    : `${capitalize(arch)} — ${houseLabel} ${house}`;

  const tone =
    stats && (stats.light + stats.shadow) > 0
      ? `\n\n${tonePhrase(stats.light, stats.shadow, locale)}`
      : "";

  return `### ${title}\n\n${intro}\n\n${context}${tone}`;
}

/**
 * Picks the top (archetype × house) combos by total weight inside the house.
 * Returns up to `limit` items, sorted desc by total.
 */
export function pickTopCombos(
  analysis: DeepDiveAnalysis,
  limit = 3,
): Array<{ archetype: AnyArchetypeKey; house: number; stats: HouseStats }> {
  const all: Array<{ archetype: AnyArchetypeKey; house: number; stats: HouseStats }> = [];
  for (const [arch, archStats] of Object.entries(analysis.stats) as Array<
    [AnyArchetypeKey, ArchetypeStats]
  >) {
    for (const [houseStr, houseStats] of Object.entries(archStats.byHouse)) {
      if (houseStats.total <= 0) continue;
      all.push({ archetype: arch, house: Number(houseStr), stats: houseStats });
    }
  }
  all.sort((a, b) => b.stats.total - a.stats.total);
  return all.slice(0, limit);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
