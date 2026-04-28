/**
 * Aegis Deep Dive (V2) — narrative templates.
 *
 * Pure, deterministic content used by the Deep Dive report generator.
 * No I/O, no React. Two main blocks:
 *   - archetypeIntro[arch]   : 3–4 sentence portrait (light/shadow) per archetype
 *   - houseContext[house]    : 2–3 sentences explaining the Myss house domain
 *
 * Plus helpers:
 *   - tonePhrase(light, shadow)            : qualitative tone from a light/shadow ratio
 *   - composeArchetypeHouse(arch, house, stats) : assembles a full narrative block
 *   - pickTopCombos(analysis, limit)       : top archetype × house combinations
 */

import type {
  AnyArchetypeKey,
  ArchetypeStats,
  DeepDiveAnalysis,
  HouseStats,
} from "./types";
import { HOUSES } from "./types";

/* -------------------------------------------------------------------------- */
/* Archetype portraits — Survival quartet + 12 core archetypes                 */
/* -------------------------------------------------------------------------- */

export const archetypeIntro: Record<AnyArchetypeKey, string> = {
  // ── Survival quartet ──────────────────────────────────────────────────────
  child:
    "Le Child construit ta manière de percevoir la vie, la sécurité, la loyauté et le fait de « grandir ». " +
    "En lumière, il apporte innocence, créativité, confiance et capacité à recommencer. " +
    "En ombre, il reste bloqué dans la dépendance, la peur de la responsabilité ou le refus de quitter des rôles infantiles. " +
    "Travailler avec ce Child, c’est affiner l’équilibre entre innocence et responsabilité.",

  victim:
    "Le Victim touche à tes frontières et à ton rapport au pouvoir personnel. " +
    "En lumière, il te signale quand une situation est abusive et t’aide à te positionner. " +
    "En ombre, il se complaît dans l’impuissance, le ressentiment et la recherche de coupables. " +
    "Son travail consiste à passer de « on me fait » à « comment je récupère ma puissance dans cette histoire ».",

  prostitute:
    "La Prostitute garde la frontière entre ce qui est à vendre et ce qui ne l’est pas. " +
    "En lumière, elle protège ton intégrité : « je ne sacrifie pas mon âme, même pour la sécurité ». " +
    "En ombre, elle accepte des situations qui te trahissent par peur de manquer. " +
    "Elle te montre précisément à quel prix tu es encore prêt à te vendre pour rester en sécurité.",

  saboteur:
    "Le Saboteur est le gardien de tes choix : il se manifeste surtout au moment où une vraie opportunité arrive. " +
    "En lumière, il t’alerte sur les risques et t’invite à vérifier tes motivations avant d’agir. " +
    "En ombre, il te coupe les jambes juste avant le pas important : procrastination, autocritique, fuite. " +
    "Il t’apprend à reconnaître quand tu empêches toi-même ta propre expansion.",

  // ── 12 core archetypes ───────────────────────────────────────────────────
  sovereign:
    "Le Sovereign structure ta façon de prendre des responsabilités, de décider et d’ordonner ta vie. " +
    "En lumière, il gouverne avec clarté, justesse, sens du bien commun. " +
    "En ombre, il devient contrôlant, autoritaire, obsédé par le statut ou l’image. " +
    "Son travail consiste à passer d’un pouvoir centré sur l’ego à une autorité au service de ta vocation et de ton entourage.",

  warrior:
    "Le Warrior incarne ta capacité à te battre pour ce qui compte, à protéger et à tenir sous pression. " +
    "En lumière, il te donne courage, endurance, sens des limites et de la justice. " +
    "En ombre, il devient agressif, défensif, ou se bat contre les mauvaises choses (ton propre corps, tes alliés). " +
    "Il te montre quels combats valent ton énergie et lesquels rejouent un vieux champ de bataille.",

  lover:
    "Le Lover colore ta façon d’aimer, de désirer, d’entrer en relation avec les personnes, les projets et la vie. " +
    "En lumière, il apporte présence, intensité, capacité de connexion profonde. " +
    "En ombre, il tombe dans la dépendance, la recherche de validation ou le drama. " +
    "Le Lover t’apprend à aimer sans te perdre, et à laisser la passion nourrir plutôt que consommer.",

  caregiver:
    "Le Caregiver représente ton élan naturel à nourrir, contenir et prendre soin, des personnes comme des projets. " +
    "En lumière, il sait soutenir sans se sacrifier, créer un climat de sécurité, materner de façon mature. " +
    "En ombre, il se sur-sacrifie, materne pour contrôler, ou s’oublie complètement. " +
    "Son travail est d’équilibrer « je prends soin de toi » avec « je prends aussi soin de moi ».",

  creator:
    "Le Creator porte ta pulsion de faire exister des choses : idées, œuvres, systèmes, relations. " +
    "En lumière, il canalise l’inspiration en formes concrètes, voit des possibilités où les autres voient des limites. " +
    "En ombre, il se perd dans la perfection, l’auto-critique ou l’utilisation de son talent pour manipuler. " +
    "Il t’apprend à assumer ton rôle de co-créateur, sans saboter tes propres œuvres.",

  explorer:
    "L’Explorer est ton élan vers l’inconnu, le changement, la découverte de nouvelles perspectives. " +
    "En lumière, il te permet de sortir des scripts familiaux, d’ouvrir ta vie, de trouver ta propre voie. " +
    "En ombre, il fuit l’engagement, la stabilité, et confond mouvement et liberté. " +
    "Il travaille à transformer la fuite en exploration consciente et assumée.",

  rebel:
    "Le Rebel porte ta relation à la règle, à la norme et à l’autorité. " +
    "En lumière, il défie les systèmes injustes, ouvre des voies alternatives, protège la vérité. " +
    "En ombre, il casse pour casser, rejette avant de comprendre, se coupe de soutiens possibles. " +
    "Son enjeu est de choisir quand la rébellion sert vraiment ton contrat, et quand elle rejoue une vieille guerre.",

  sage:
    "Le Sage représente ton besoin de comprendre, de donner du sens et de transmettre. " +
    "En lumière, il observe, relie, clarifie, enseigne avec humilité. " +
    "En ombre, il intellectualise tout, se cache derrière le mental, ou utilise le savoir pour prendre le dessus. " +
    "Il t’invite à laisser ta compréhension descendre dans la vie concrète, pas seulement dans les concepts.",

  mystic:
    "Le Mystic reflète ton lien direct avec le sacré, l’invisible, le niveau symbolique de ta vie. " +
    "En lumière, il perçoit les synchronicités, les signes, et fait confiance à un ordre plus vaste. " +
    "En ombre, il se coupe du monde ou se perd dans les expériences intérieures sans ancrage. " +
    "Il t’enseigne à vivre ta spiritualité au cœur du quotidien, pas comme une échappatoire.",

  healer:
    "Le Healer concerne ta manière de rencontrer la souffrance — la tienne et celle des autres. " +
    "En lumière, il transforme blessure en ressource, écoute en profondeur, accompagne la guérison. " +
    "En ombre, il se définit par ses blessures, cherche à sauver tout le monde, s’épuise. " +
    "Il t’apprend à guérir avec, pas contre, ce que tu as traversé.",

  magician:
    "Le Magician touche ta capacité à transformer, influencer, jouer avec les dynamiques visibles et invisibles. " +
    "En lumière, il alchimise, connecte les bonnes personnes, voit les effets à long terme, fait bouger les lignes en finesse. " +
    "En ombre, il manipule, garde l’avantage, retient l’information ou l’énergie pour contrôler. " +
    "Son travail est de passer du pouvoir sur les autres à la maîtrise de ton propre pouvoir créateur.",

  jester:
    "Le Jester est ta fonction de jeu, d’humour, de renversement des perspectives. " +
    "En lumière, il allège, révèle des vérités à travers le rire, fait circuler l’énergie là où tout est figé. " +
    "En ombre, il se cache derrière la blague pour ne jamais se montrer, minimise tout, sabote la profondeur. " +
    "Il te montre quand le rire ouvre, et quand il sert à fuir.",
};

/* -------------------------------------------------------------------------- */
/* House contexts (1..12)                                                      */
/* -------------------------------------------------------------------------- */

export const houseContext: Record<number, string> = {
  1:
    "Cette maison parle de ton masque, de la façon dont tu entres dans le monde et de la première impression que tu donnes. " +
    "L’archétype ici colore ton style de présence : comment ton ego s’organise, comment tu prends ou évites la place.",
  2:
    "Cette maison relie ton archétype à l’argent, aux possessions, à ce que tu considères comme « avoir de la valeur ». " +
    "On y voit comment tu négocies entre sécurité et intégrité, et ce à quoi tu t’attaches pour te sentir en sécurité.",
  3:
    "Domaine de la parole, des choix, du lien cause-effet. " +
    "L’archétype dans cette maison montre comment tu utilises ta voix, comment tu décides, comment tu gères la responsabilité de tes actes.",
  4:
    "Cette maison parle de ta famille d’origine, de ton « home » actuel et de ta sécurité émotionnelle. " +
    "L’archétype ici éclaire comment tu portes ou refuses ton histoire familiale, et comment tu crées (ou non) un foyer sain pour toi.",
  5:
    "Cette maison lie l’archétype à ta créativité, à tes enfants (biologiques ou projets), à ta façon de jouer avec la vie. " +
    "On y voit comment ton feu créatif s’exprime, et s’il sert la joie ou la manipulation.",
  6:
    "Domaine du travail quotidien, de la santé, de l’éthique dans la survie. " +
    "L’archétype ici montre comment tu te traites dans le contexte pro, et comment tu négocies entre performance, corps et alignement.",
  7:
    "Cette maison parle de tes relations clés : couple, associations, duelles. " +
    "L’archétype ici décrit comment tu co-crées ou rejoues des patterns à deux (projection, dépendance, alliance, trahison).",
  8:
    "Cette maison relie l’archétype à l’argent des autres, aux héritages, aux dettes et à l’intimité profonde. " +
    "On voit comment tu gères fusion, pouvoir partagé, vulnérabilité et ressources qui ne viennent pas directement de toi.",
  9:
    "Domaine de la quête de sens, des grandes croyances, des voyages intérieurs et extérieurs. " +
    "L’archétype ici montre comment tu cherches la vérité, comment tu organises ta vision du monde et du sacré.",
  10:
    "Cette maison parle de ton sommet de potentiel, de ta vocation et de ton rôle public. " +
    "L’archétype ici raconte la forme que peut prendre ta contribution au monde, et les risques de trahison de cette vocation.",
  11:
    "Domaine des collectifs, des causes, de la vision pour l’humanité. " +
    "L’archétype ici colore la manière dont tu te sens relié aux mouvements, communautés et changements collectifs.",
  12:
    "Zone des peurs profondes, du karma, de ce que tu caches même à toi-même. " +
    "L’archétype ici révèle les scénarios récurrents que tu revis, et la façon dont tu peux les transmuter en conscience et en surrender.",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Returns a qualitative tone phrase based on the light/shadow split of a stats
 * block. Pure function — easy to unit test.
 */
export function tonePhrase(light: number, shadow: number): string {
  const total = light + shadow;
  if (total <= 0) return "Aucun signal significatif sur ce thème pour l’instant.";
  const lightRatio = light / total;
  if (lightRatio >= 0.75) return "Tu opères ici principalement depuis la lumière de cet archétype.";
  if (lightRatio >= 0.55) return "Lumière dominante, avec quelques zones d’ombre à intégrer.";
  if (lightRatio >= 0.45) return "Terrain de bascule : la lumière et l’ombre se disputent à parts presque égales.";
  if (lightRatio >= 0.25) return "Ombre dominante, avec des éclats de lumière à cultiver.";
  return "Tu opères ici principalement depuis l’ombre de cet archétype.";
}

/**
 * Compose a full narrative block for a given (archetype × house) combo.
 * Returns null if either key is unknown.
 */
export function composeArchetypeHouse(
  arch: AnyArchetypeKey,
  house: number,
  stats?: HouseStats | ArchetypeStats,
): string | null {
  const intro = archetypeIntro[arch];
  const context = houseContext[house];
  if (!intro || !context) return null;

  const houseMeta = HOUSES.find((h) => h.number === house);
  const title = houseMeta
    ? `${capitalize(arch)} — Maison ${house} : ${houseMeta.label_fr}`
    : `${capitalize(arch)} — Maison ${house}`;

  const tone =
    stats && (stats.light + stats.shadow) > 0
      ? `\n\n${tonePhrase(stats.light, stats.shadow)}`
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
