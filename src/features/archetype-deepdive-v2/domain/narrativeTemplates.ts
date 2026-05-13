/**
 * @file narrativeTemplates.ts
 * Aegis Deep Dive (V2) — narrative templates (bilingual FR/EN).
 *
 * Pure, deterministic content used by the Deep Dive report generator.
 * No I/O, no React. Bilingual via locale-aware getters.
 *
 * ─── STYLE GUARDRAILS ────────────────────────────────────────────────────────
 * ARCHETYPE_INTRO_FR/EN:
 * - clinique utile, jamais dramatique
 * - une énergie = une fonction distincte
 * - décrire le mouvement lumière → ombre → intégration
 * - éviter les phrases génériques interchangeables
 * - chaque portrait doit pouvoir résister au "smell-check" :
 *   si la phrase pourrait s'appliquer à 3+ autres archétypes, réécrire.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Public API (locale-aware):
 *   - getArchetypeIntro(arch, locale)
 *   - getHouseContext(house, locale)
 *   - tonePhrase(light, shadow, locale)
 *   - composeArchetypeHouse(arch, house, stats, locale)
 *   - pickTopCombos(analysis, limit)
 *
 * Backwards-compat (defaults to FR — used by the i18n export script):
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
  caregiver:
    "Le Caregiver représente ton élan naturel à nourrir, contenir et prendre soin — des personnes comme des projets. Dans sa forme mature, il soutient sans infantiliser et sécurise sans capturer. En ombre, il compense l'angoisse du lien par le sur-don, le sauvetage ou un soin qui contrôle plus qu'il ne libère. Son axe de maturité consiste à relier tendresse et limites, afin que le soin reste un appui plutôt qu'un mode de domination douce.",

  child:
    "Le Child construit ta manière de percevoir la sécurité, la loyauté, la dépendance et la possibilité de recommencer. En lumière, il garde vivantes l'innocence, la créativité et la capacité à faire confiance sans se naïviser. En ombre, il cherche à déléguer sa responsabilité, s'agrippe à une figure rassurante ou évite les passages de croissance qui demandent de devenir plus adulte. Son travail n'est pas de disparaître, mais de s'affiner : préserver l'élan vivant tout en apprenant à se porter soi-même.",

  creator:
    "Le Creator porte ta pulsion de faire advenir quelque chose qui n'existait pas encore. En lumière, il transforme une intuition en forme, accepte l'imperfection du processus et donne une signature réelle à ce qu'il touche. En ombre, il reporte, retouche, raffine à l'excès ou utilise son talent comme stratégie de contrôle narcissique. Son enjeu est simple et exigeant : livrer, confronter l'œuvre au réel, et laisser la création devenir relation plutôt que fantasme fermé.",

  explorer:
    "L'Explorer incarne ton mouvement vers l'inconnu, le déplacement, les nouveaux terrains de sens. En lumière, il ouvre des portes, sort des loyautés étroites et t'aide à trouver un chemin qui ne soit pas seulement hérité. En ombre, il transforme la liberté en fuite chronique, abandonne ce qui commence à demander de l'enracinement et sacralise le nouveau pour éviter l'intime. Son axe de croissance est de distinguer l'appel réel du déplacement défensif.",

  healer:
    "Le Healer concerne ta manière de rencontrer la souffrance — la tienne comme celle des autres. En lumière, il transforme l'expérience traversée en qualité de présence, d'écoute et de réparation juste. En ombre, il se laisse définir par la blessure, s'épuise à sauver, ou entretient inconsciemment le besoin d'être nécessaire pour ne pas perdre sa place. Son travail est d'apprendre à accompagner sans s'absorber, et à guérir sans faire de la douleur un centre identitaire.",

  jester:
    "Le Jester est ta capacité à relâcher la pression, renverser les angles morts et rendre une vérité dicible par le jeu. En lumière, il assouplit les rigidités, remet du vivant là où tout s'est figé, et crée un espace de respiration psychique. En ombre, il transforme l'humour en écran anti-intimité, tourne en dérision ce qui demande du sérieux, ou sabote la profondeur au moment précis où elle pourrait émerger. Il t'enseigne à distinguer l'humour qui ouvre du divertissement qui évite.",

  lover:
    "Le Lover colore ta façon d'aimer, de désirer, de t'attacher et de t'engager avec intensité. En lumière, il donne présence, chaleur, élan, capacité à goûter la relation et à rendre la vie incarnée. En ombre, il confond intensité et vérité, se dérègle dans la fusion, la dépendance ou la quête de validation affective. Son travail n'est pas de devenir tiède, mais d'aimer sans se perdre et de laisser le désir nourrir plutôt que consumer.",

  magician:
    "Le Magician touche ta capacité à transformer les dynamiques visibles et invisibles d'un système. En lumière, il voit les patterns, lit les leviers, orchestre avec finesse et rend possible un passage que d'autres ne savaient pas nommer. En ombre, il préfère l'influence discrète à l'engagement visible, retient l'information, micro-manipule ou reste en coulisses pour ne pas être entièrement exposé. Son axe de maturation est de passer du contrôle subtil à la responsabilité incarnée.",

  mystic:
    "Le Mystic reflète ton lien au sacré, au symbole, au sens profond et à ce qui dépasse la lecture purement rationnelle. En lumière, il lit les synchronicités, perçoit l'ordre derrière les événements et soutient une confiance fondamentale dans la traversée. En ombre, il se réfugie dans l'intériorité, spiritualise ce qui devrait être incarné, ou utilise le sens pour éviter le réel. Son enjeu est de faire descendre l'expérience intérieure dans la matière, les choix et les actes.",

  prostitute:
    "La Prostitute est la gardienne de ton intégrité dans les situations où la sécurité semble menacée. En lumière, elle te rend sensible au moment exact où tu t'apprêtes à négocier ta dignité, tes valeurs ou ton âme contre de la protection, de l'argent ou de l'appartenance. En ombre, elle rationalise les compromis qui te trahissent au nom du besoin de survivre. Son travail est de faire émerger un 'not for sale' concret, incarné, surtout quand la peur rend le compromis séduisant.",

  rebel:
    "Le Rebel porte ta relation à la norme, à la règle et à l'autorité. En lumière, il protège la vérité, refuse les systèmes injustes et introduit la rupture nécessaire quand tout le monde s'accommode de l'inacceptable. En ombre, il s'oppose avant d'écouter, rejoue un vieux combat contre toute structure et finit par se battre contre des formes plus que pour une valeur. Son axe de travail consiste à rendre la rupture discernée, ciblée et réellement féconde.",

  saboteur:
    "Le Saboteur est le gardien de tes choix majeurs et de ta tolérance au changement. En lumière, il t'alerte sur les angles morts, les emballements et les décisions prises trop vite. En ombre, il désorganise l'élan juste avant l'étape décisive : retard, doute corrosif, distraction, auto-disqualification. Son enjeu n'est pas d'être supprimé, mais reconnu assez tôt pour redevenir un signal de prudence plutôt qu'une force d'inhibition.",

  sage:
    "Le Sage représente ton besoin de comprendre, de relier, d'interpréter et de transmettre. En lumière, il clarifie, synthétise, donne du sens sans écraser la complexité, et transmet avec discernement. En ombre, il sur-intellectualise, remplace l'expérience par le commentaire, ou utilise le savoir comme rempart relationnel. Son travail est de laisser la pensée redevenir un service rendu à la vie plutôt qu'un lieu de retrait.",

  sovereign:
    "Le Sovereign structure ta façon de décider, d'ordonner, de gouverner et de prendre la responsabilité finale. En lumière, il donne direction, stabilité, sens du bien commun et capacité à tenir un cadre qui protège sans étouffer. En ombre, il surcontrôle, s'isole, devient défensif face au feedback ou dérive vers une autorité centrée sur l'image. Son axe de maturité est de convertir le pouvoir de contrôle en autorité de service.",

  victim:
    "Le Victim touche à tes frontières, à ton sentiment de puissance et à ta capacité à nommer l'injustice. En lumière, il t'alerte quand quelque chose te dépossède et te pousse à rétablir une limite juste. En ombre, il cristallise l'impuissance, la plainte, la dette affective ou la conviction que le changement dépend toujours des autres. Son travail consiste à transformer le vécu d'atteinte en reprise de position, pas en identité durable.",

  warrior:
    "Le Warrior incarne ta capacité à défendre ce qui compte, à tenir sous pression, à protéger un territoire et à agir avec netteté. En lumière, il apporte courage, endurance, précision et capacité à traverser l'épreuve sans se dissoudre. En ombre, il se rigidifie, attaque trop vite, vit sur le mode du combat permanent ou se retourne contre son propre corps. Il t'enseigne à choisir tes batailles pour ne pas confondre tension chronique et force réelle.",
};

/* -------------------------------------------------------------------------- */
/* Archetype portraits — EN                                                    */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_INTRO_EN: Record<AnyArchetypeKey, string> = {
  caregiver:
    "The Caregiver represents your natural impulse to nourish, contain and care — for people as much as for projects. In its mature form, it supports without infantilizing and secures without capturing. In shadow, it compensates for attachment anxiety through over-giving, rescuing, or a kind of care that controls more than it frees. Its growth axis is to bind tenderness and boundaries so that care remains support rather than soft domination.",

  child:
    "The Child shapes how you perceive safety, loyalty, dependency and the possibility of beginning again. In the light, it keeps innocence, creativity and the capacity to trust without becoming naive. In shadow, it tries to outsource responsibility, clings to a reassuring figure, or avoids developmental passages that require becoming more adult. Its task is not to disappear, but to refine itself: preserving liveliness while learning to carry itself.",

  creator:
    "The Creator carries your drive to bring into existence something that did not yet exist. In the light, it turns intuition into form, accepts the imperfection of process, and gives a real signature to what it touches. In shadow, it delays, over-refines, endlessly revises, or uses talent as a narcissistic control strategy. Its challenge is simple and demanding: ship the work, let it meet reality, and allow creation to become relationship rather than closed fantasy.",

  explorer:
    "The Explorer embodies your movement toward the unknown, displacement and new territories of meaning. In the light, it opens doors, exits narrow loyalties and helps you find a path that is not merely inherited. In shadow, it turns freedom into chronic flight, abandons what starts asking for rootedness, and sacralizes novelty in order to avoid intimacy. Its growth axis is to distinguish a real call from defensive movement.",

  healer:
    "The Healer concerns how you meet suffering — your own and that of others. In the light, it transforms lived experience into presence, listening and precise repair. In shadow, it lets itself be defined by the wound, exhausts itself saving, or unconsciously maintains the need to be needed in order to keep its place. Its work is to accompany without absorbing, and to heal without making pain into an identity center.",

  jester:
    "The Jester is your capacity to release pressure, flip blind spots and make truth speakable through play. In the light, it softens rigidities, restores life where everything has frozen, and creates psychic breathing room. In shadow, it turns humor into an anti-intimacy screen, mocks what should be taken seriously, or sabotages depth at the exact moment it could emerge. It teaches you to distinguish opening humor from avoidant entertainment.",

  lover:
    "The Lover colors the way you love, desire, attach and commit with intensity. In the light, it brings presence, warmth, momentum, relational depth and embodied aliveness. In shadow, it confuses intensity with truth and dysregulates into fusion, dependency or the pursuit of emotional validation. Its work is not to become lukewarm, but to love without losing yourself and let desire nourish rather than consume.",

  magician:
    "The Magician touches your ability to transform visible and invisible dynamics within a system. In the light, it sees patterns, reads leverage points, orchestrates with finesse and makes possible a passage others could not yet name. In shadow, it prefers discreet influence over visible commitment, withholds information, micro-manipulates, or stays backstage to avoid full exposure. Its maturation axis is moving from subtle control to embodied responsibility.",

  mystic:
    "The Mystic reflects your relationship to the sacred, symbol, deep meaning and what exceeds purely rational reading. In the light, it reads synchronicities, perceives order within events and supports a fundamental trust in the process. In shadow, it retreats into interiority, spiritualizes what should be embodied, or uses meaning to avoid reality. Its challenge is to bring inner experience down into matter, decisions and concrete acts.",

  prostitute:
    "The Prostitute is the guardian of your integrity in situations where safety feels threatened. In the light, it makes you sharply aware of the exact moment you are about to negotiate your dignity, values or soul in exchange for protection, money or belonging. In shadow, it rationalizes self-betraying compromises in the name of survival. Its work is to make a concrete, embodied 'not for sale' emerge, especially when fear makes compromise look attractive.",

  rebel:
    "The Rebel carries your relationship to norms, rules and authority. In the light, it protects truth, refuses unjust systems and introduces necessary rupture when everyone else has normalized the unacceptable. In shadow, it opposes before listening, replays an old war against any structure, and ends up fighting forms instead of fighting for a value. Its work is to make rupture discerning, targeted and genuinely generative.",

  saboteur:
    "The Saboteur is the guardian of your major choices and of your tolerance for change. In the light, it alerts you to blind spots, over-excitement and decisions made too fast. In shadow, it disorganizes your momentum just before the decisive step: delay, corrosive doubt, distraction, self-disqualification. Its purpose is not to be eradicated, but recognized early enough to become a signal of prudence rather than a force of inhibition.",

  sage:
    "The Sage represents your need to understand, connect, interpret and transmit. In the light, it clarifies, synthesizes, offers meaning without flattening complexity, and teaches with discernment. In shadow, it over-intellectualizes, replaces experience with commentary, or uses knowledge as a relational shield. Its work is to let thought become a service to life again rather than a place of withdrawal.",

  sovereign:
    "The Sovereign structures how you decide, order, govern and hold final responsibility. In the light, it brings direction, stability, a sense of the common good, and the capacity to hold a frame that protects without suffocating. In shadow, it over-controls, isolates, becomes defensive toward feedback, or drifts into image-centered authority. Its maturation axis is converting the power to control into the authority to serve.",

  victim:
    "The Victim touches your boundaries, your sense of agency and your ability to name injustice. In the light, it alerts you when something is dispossessing you and pushes you to restore a fair limit. In shadow, it crystallizes helplessness, complaint, emotional debt, or the belief that change always depends on others. Its work is to turn the experience of violation into repositioning, not into a durable identity.",

  warrior:
    "The Warrior embodies your ability to defend what matters, hold under pressure, protect a territory and act with precision. In the light, it brings courage, endurance, sharpness and the ability to move through ordeal without dissolving. In shadow, it hardens, attacks too quickly, lives in permanent combat mode, or turns against its own body. It teaches you to choose your battles so you do not confuse chronic tension with real strength.",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function getArchetypeIntro(arch: AnyArchetypeKey, locale: Locale = "fr"): string {
  return locale === "en" ? ARCHETYPE_INTRO_EN[arch] : ARCHETYPE_INTRO_FR[arch];
}

export function getHouseContext(house: number, locale: Locale = "fr"): string {
  const found = HOUSES.find((h) => h.number === house);
  if (!found) return "";
  return locale === "en"
    ? `${found.label_en}: ${found.theme_en}.`
    : `${found.label_fr} : ${found.theme_fr}.`;
}

/**
 * Returns a qualitative tone phrase based on the light/shadow split.
 * Pure function — easy to unit test.
 *
 * 3 levels:
 *   ≥ 0.68 → mostly light (resource)
 *   ≥ 0.48 → mixed (reactive under stress)
 *   <  0.48 → defensive (shadow leads when safety wavers)
 */
export function tonePhrase(light: number, shadow: number, locale: Locale = "fr"): string {
  const total = light + shadow;
  const lightRatio = total > 0 ? clampRatio(light / total) : 0.5;

  if (locale === "fr") {
    if (lightRatio >= 0.68) return "Polarité majoritairement lumineuse : l'archétype agit comme ressource structurante.";
    if (lightRatio >= 0.48) return "Polarité mixte : le potentiel est réel, mais l'ombre reste facilement réactivable sous stress.";
    return "Polarité défensive dominante : l'ombre prend facilement la main quand la sécurité est menacée.";
  }

  if (lightRatio >= 0.68) return "Mostly light polarity: this archetype currently acts as a structuring resource.";
  if (lightRatio >= 0.48) return "Mixed polarity: the potential is real, but the shadow remains easily reactivated under stress.";
  return "Defensive polarity dominates: the shadow takes over easily when safety feels threatened.";
}

/**
 * Compose a full narrative block for a given (archetype × house) combo.
 * Returns an empty string if the house key is unknown.
 */
export function composeArchetypeHouse(
  arch: AnyArchetypeKey,
  house: number,
  stats: ArchetypeStats,
  locale: Locale = "fr",
): string {
  const houseStats: HouseStats | undefined = stats.byHouse?.[house];
  if (!houseStats) return "";

  const context = getHouseContext(house, locale);
  const tone = tonePhrase(houseStats.light, houseStats.shadow, locale);
  const intro = getArchetypeIntro(arch, locale);

  return `${context} ${tone} ${intro}`;
}

/**
 * Picks the top archetype keys by total weight, descending.
 * Returns up to `limit` archetype keys.
 */
export function pickTopCombos(analysis: DeepDiveAnalysis, limit = 3): AnyArchetypeKey[] {
  const entries = Object.entries(analysis.stats) as Array<[AnyArchetypeKey, ArchetypeStats]>;
  return entries
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([key]) => key);
}

/* -------------------------------------------------------------------------- */
/* Backwards-compat exports (FR — legacy / i18n script)                        */
/* -------------------------------------------------------------------------- */

export const archetypeIntro = ARCHETYPE_INTRO_FR;
export const houseContext: Record<number, string> = Object.fromEntries(
  HOUSES.map((h) => [h.number, `${h.label_fr} : ${h.theme_fr}.`]),
);
