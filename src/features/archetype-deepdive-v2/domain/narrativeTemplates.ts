/**
 * Aegis Deep Dive (V2) — narrative templates.
 *
 * Reusable text blocks used to compose the personalized report:
 *   - archetypeIntro[arch]   : 3–4 sentence generic intro per archetype
 *                              (with light & shadow framing).
 *   - houseContext[house]    : 2–3 sentence intro per Myss house (1..12).
 *   - composeArchetypeHouse  : helper that combines intro + house context
 *                              and weaves in light/shadow scores.
 *
 * All copy is grounded in Caroline Myss' archetype × house framework.
 * Strings are French-first (UI is FR-only per project policy).
 */

import type { AnyArchetypeKey, ArchetypeStats } from "./types";

/* -------------------------------------------------------------------------- */
/* 1. Archetype intros                                                         */
/* -------------------------------------------------------------------------- */

export const archetypeIntro: Record<AnyArchetypeKey, string> = {
  /* ---------- Survival quartet ---------- */
  child:
    "Le Child construit ta manière de percevoir la vie, la sécurité, la loyauté et le fait de « grandir ». " +
    "En lumière, il apporte innocence, créativité, confiance et capacité à recommencer. " +
    "En ombre, il reste bloqué dans la dépendance, la peur de la responsabilité ou le refus de quitter des rôles infantiles. " +
    "Travailler avec ce Child, c'est affiner l'équilibre entre innocence et responsabilité.",

  victim:
    "Le Victim touche à tes frontières et à ton rapport au pouvoir personnel. " +
    "En lumière, il te signale quand une situation est abusive et t'aide à te positionner. " +
    "En ombre, il se complaît dans l'impuissance, le ressentiment et la recherche de coupables. " +
    "Son travail consiste à passer de « on me fait » à « comment je récupère ma puissance dans cette histoire ».",

  prostitute:
    "La Prostitute garde la frontière entre ce qui est à vendre et ce qui ne l'est pas. " +
    "En lumière, elle protège ton intégrité : « je ne sacrifie pas mon âme, même pour la sécurité ». " +
    "En ombre, elle accepte des situations qui te trahissent par peur de manquer. " +
    "Elle te montre précisément à quel prix tu es encore prêt à te vendre pour rester en sécurité.",

  saboteur:
    "Le Saboteur est le gardien de tes choix : il se manifeste surtout au moment où une vraie opportunité arrive. " +
    "En lumière, il t'alerte sur les risques et t'invite à vérifier tes motivations avant d'agir. " +
    "En ombre, il te coupe les jambes juste avant le pas important : procrastination, autocritique, fuite. " +
    "Il t'apprend à reconnaître quand tu empêches toi-même ta propre expansion.",

  /* ---------- Twelve archetypes ---------- */
  sovereign:
    "Le Sovereign structure ta façon de prendre des responsabilités, de décider et d'ordonner ta vie. " +
    "En lumière, il gouverne avec clarté, justesse, sens du bien commun. " +
    "En ombre, il devient contrôlant, autoritaire, obsédé par le statut ou l'image. " +
    "Son travail consiste à passer d'un pouvoir centré sur l'ego à une autorité au service de ta vocation et de ton entourage.",

  warrior:
    "Le Warrior incarne ta capacité à te battre pour ce qui compte, à protéger et à tenir sous pression. " +
    "En lumière, il te donne courage, endurance, sens des limites et de la justice. " +
    "En ombre, il devient agressif, défensif, ou se bat contre les mauvaises choses (ton propre corps, tes alliés). " +
    "Il te montre quels combats valent ton énergie et lesquels rejouent un vieux champ de bataille.",

  lover:
    "Le Lover colore ta façon d'aimer, de désirer, d'entrer en relation avec les personnes, les projets et la vie. " +
    "En lumière, il apporte présence, intensité, capacité de connexion profonde. " +
    "En ombre, il tombe dans la dépendance, la recherche de validation ou le drama. " +
    "Le Lover t'apprend à aimer sans te perdre, et à laisser la passion nourrir plutôt que consommer.",

  caregiver:
    "Le Caregiver représente ton élan naturel à nourrir, contenir et prendre soin, des personnes comme des projets. " +
    "En lumière, il sait soutenir sans se sacrifier, créer un climat de sécurité, materner de façon mature. " +
    "En ombre, il se sur-sacrifie, materne pour contrôler, ou s'oublie complètement. " +
    "Son travail est d'équilibrer « je prends soin de toi » avec « je prends aussi soin de moi ».",

  creator:
    "Le Creator porte ta pulsion de faire exister des choses : idées, œuvres, systèmes, relations. " +
    "En lumière, il canalise l'inspiration en formes concrètes, voit des possibilités où les autres voient des limites. " +
    "En ombre, il se perd dans la perfection, l'auto-critique ou l'utilisation de son talent pour manipuler. " +
    "Il t'apprend à assumer ton rôle de co-créateur, sans saboter tes propres œuvres.",

  explorer:
    "L'Explorer est ton élan vers l'inconnu, le changement, la découverte de nouvelles perspectives. " +
    "En lumière, il te permet de sortir des scripts familiaux, d'ouvrir ta vie, de trouver ta propre voie. " +
    "En ombre, il fuit l'engagement, la stabilité, et confond mouvement et liberté. " +
    "Il travaille à transformer la fuite en exploration consciente et assumée.",

  rebel:
    "Le Rebel porte ta relation à la règle, à la norme et à l'autorité. " +
    "En lumière, il défie les systèmes injustes, ouvre des voies alternatives, protège la vérité. " +
    "En ombre, il casse pour casser, rejette avant de comprendre, se coupe de soutiens possibles. " +
    "Son enjeu est de choisir quand la rébellion sert vraiment ton contrat, et quand elle rejoue une vieille guerre.",

  sage:
    "Le Sage représente ton besoin de comprendre, de donner du sens et de transmettre. " +
    "En lumière, il observe, relie, clarifie, enseigne avec humilité. " +
    "En ombre, il intellectualise tout, se cache derrière le mental, ou utilise le savoir pour prendre le dessus. " +
    "Il t'invite à laisser ta compréhension descendre dans la vie concrète, pas seulement dans les concepts.",

  mystic:
    "Le Mystic reflète ton lien direct avec le sacré, l'invisible, le niveau symbolique de ta vie. " +
    "En lumière, il perçoit les synchronicités, les signes, et fait confiance à un ordre plus vaste. " +
    "En ombre, il se coupe du monde ou se perd dans les expériences intérieures sans ancrage. " +
    "Il t'enseigne à vivre ta spiritualité au cœur du quotidien, pas comme une échappatoire.",

  healer:
    "Le Healer concerne ta manière de rencontrer la souffrance — la tienne et celle des autres. " +
    "En lumière, il transforme blessure en ressource, écoute en profondeur, accompagne la guérison. " +
    "En ombre, il se définit par ses blessures, cherche à sauver tout le monde, s'épuise. " +
    "Il t'apprend à guérir avec, pas contre, ce que tu as traversé.",

  magician:
    "Le Magician touche ta capacité à transformer, influencer, jouer avec les dynamiques visibles et invisibles. " +
    "En lumière, il alchimise, connecte les bonnes personnes, voit les effets à long terme, fait bouger les lignes en finesse. " +
    "En ombre, il manipule, garde l'avantage, retient l'information ou l'énergie pour contrôler. " +
    "Son travail est de passer du pouvoir sur les autres à la maîtrise de ton propre pouvoir créateur.",

  jester:
    "Le Jester est ta fonction de jeu, d'humour, de renversement des perspectives. " +
    "En lumière, il allège, révèle des vérités à travers le rire, fait circuler l'énergie là où tout est figé. " +
    "En ombre, il se cache derrière la blague pour ne jamais se montrer, minimise tout, sabote la profondeur. " +
    "Il te montre quand le rire ouvre, et quand il sert à fuir.",
};

/* -------------------------------------------------------------------------- */
/* 2. House contexts                                                           */
/* -------------------------------------------------------------------------- */

export const houseContext: Record<number, string> = {
  1:
    "Maison 1 — Ego & personnalité. Parle de ton masque, de la façon dont tu entres dans le monde et de la première impression que tu donnes. " +
    "L'archétype ici colore ton style de présence : comment ton ego s'organise, comment tu prends ou évites la place.",

  2:
    "Maison 2 — Valeurs & sécurité matérielle. Relie ton archétype à l'argent, aux possessions, à ce que tu considères comme « avoir de la valeur ». " +
    "Ici, on voit comment tu négocies entre sécurité et intégrité, et ce à quoi tu t'attaches pour te sentir en sécurité.",

  3:
    "Maison 3 — Expression & décisions. Domaine de la parole, des choix, du lien cause-effet. " +
    "L'archétype dans cette maison montre comment tu utilises ta voix, comment tu décides, comment tu gères la responsabilité de tes actes.",

  4:
    "Maison 4 — Foyer, famille & racines. Parle de ta famille d'origine, de ton « home » actuel et de ta sécurité émotionnelle. " +
    "L'archétype ici éclaire comment tu portes ou refuses ton histoire familiale, et comment tu crées (ou non) un foyer sain pour toi.",

  5:
    "Maison 5 — Créativité & bonne fortune. Lie l'archétype à ta créativité, à tes enfants (biologiques ou projets), à ta façon de jouer avec la vie. " +
    "On y voit comment ton feu créatif s'exprime, et s'il sert la joie ou la manipulation.",

  6:
    "Maison 6 — Travail & santé. Domaine du travail quotidien, de la santé, de l'éthique dans la survie. " +
    "L'archétype ici montre comment tu te traites dans le contexte pro, et comment tu négocies entre performance, corps et alignement.",

  7:
    "Maison 7 — Relations & partenariats. Parle de tes relations clés : couple, associations, duelles. " +
    "L'archétype dans cette maison décrit comment tu co-crées ou rejoues des patterns à deux (projection, dépendance, alliance, trahison).",

  8:
    "Maison 8 — Ressources des autres & intimité. Relie l'archétype à l'argent des autres, aux héritages, aux dettes et à l'intimité profonde. " +
    "On voit comment tu gères fusion, pouvoir partagé, vulnérabilité et ressources qui ne viennent pas directement de toi.",

  9:
    "Maison 9 — Spiritualité, croyances & quête. Domaine de la quête de sens, des grandes croyances, des voyages intérieurs et extérieurs. " +
    "L'archétype ici montre comment tu cherches la vérité, comment tu organises ta vision du monde et du sacré.",

  10:
    "Maison 10 — Vocation & potentiel le plus haut. Parle de ton sommet de potentiel, de ta vocation et de ton rôle public. " +
    "L'archétype dans cette maison raconte la forme que peut prendre ta contribution au monde, et les risques de trahison de cette vocation.",

  11:
    "Maison 11 — Monde & contribution collective. Domaine des collectifs, des causes, de la vision pour l'humanité. " +
    "L'archétype ici colore la manière dont tu te sens relié aux mouvements, communautés et changements collectifs.",

  12:
    "Maison 12 — Inconscient & patterns profonds. Zone des peurs profondes, du karma, de ce que tu caches même à toi-même. " +
    "L'archétype dans cette maison révèle les scénarios récurrents que tu revis, et la façon dont tu peux les transmuter en conscience et en surrender.",
};

/* -------------------------------------------------------------------------- */
/* 3. Composition helpers                                                      */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_LABEL_FR: Record<AnyArchetypeKey, string> = {
  child: "Child",
  victim: "Victim",
  prostitute: "Prostitute",
  saboteur: "Saboteur",
  sovereign: "Sovereign",
  warrior: "Warrior",
  lover: "Lover",
  caregiver: "Caregiver",
  creator: "Creator",
  explorer: "Explorer",
  rebel: "Rebel",
  sage: "Sage",
  mystic: "Mystic",
  healer: "Healer",
  magician: "Magician",
  jester: "Jester",
};

export function archetypeLabel(arch: AnyArchetypeKey): string {
  return ARCHETYPE_LABEL_FR[arch];
}

/**
 * Return a qualitative tone phrase based on light/shadow distribution
 * for an archetype within a single house.
 */
export function tonePhrase(light: number, shadow: number): string {
  const total = light + shadow;
  if (total <= 0) {
    return "Cette dimension reste discrète chez toi pour le moment, sans charge marquée.";
  }
  const lightRatio = light / total;
  if (lightRatio >= 0.7) {
    return "Ton expression ici est nettement portée par la polarité lumineuse : c'est un terrain où cet archétype te sert.";
  }
  if (lightRatio >= 0.55) {
    return "L'équilibre penche vers la lumière, avec quelques zones d'ombre encore actives à observer.";
  }
  if (lightRatio >= 0.45) {
    return "Lumière et ombre se répondent à parts presque égales : c'est un terrain de bascule où ta conscience fait toute la différence.";
  }
  if (lightRatio >= 0.3) {
    return "L'ombre prend la majeure partie de la place : il y a là un nœud précis à reconnaître pour récupérer ta puissance.";
  }
  return "L'archétype s'exprime ici principalement par son ombre : c'est précisément le lieu où Myss inviterait à ouvrir le travail.";
}

/**
 * Compose a full personalized "archetype × house" narrative block.
 *
 * Combines:
 *   - the generic archetype intro,
 *   - the house context,
 *   - a tone phrase derived from the user's actual scores.
 */
export function composeArchetypeHouse(
  arch: AnyArchetypeKey,
  house: number,
  stats: ArchetypeStats | undefined,
): string {
  const intro = archetypeIntro[arch];
  const ctx = houseContext[house] ?? "";

  const houseStats = stats?.byHouse?.[house];
  const light = houseStats?.light ?? 0;
  const shadow = houseStats?.shadow ?? 0;
  const tone = tonePhrase(light, shadow);

  const header = `**${archetypeLabel(arch)} — ${ctx.split(".")[0]}**`;

  return [header, "", intro, "", ctx, "", tone].join("\n");
}

/**
 * Produce the top 3 archetype × dominant-house combos worth narrating.
 */
export function pickTopCombos(
  stats: Record<AnyArchetypeKey, ArchetypeStats>,
  topArchetypes: AnyArchetypeKey[],
  limit = 3,
): Array<{ archetype: AnyArchetypeKey; house: number }> {
  const combos: Array<{ archetype: AnyArchetypeKey; house: number }> = [];
  for (const arch of topArchetypes.slice(0, limit)) {
    const byHouse = stats[arch]?.byHouse ?? {};
    let bestHouse = 0;
    let bestScore = -Infinity;
    for (const [hStr, hStats] of Object.entries(byHouse)) {
      if (hStats.total > bestScore) {
        bestScore = hStats.total;
        bestHouse = Number(hStr);
      }
    }
    if (bestHouse) combos.push({ archetype: arch, house: bestHouse });
  }
  return combos;
}
