import * as THREE from "three";
import type { SceneLayoutData } from "../layout/sceneLayout";
import {
  LAYOUT_CUBE_CENTER_Y,
  LAYOUT_MARBLE_HOVER,
  LAYOUT_MARBLE_SIZE,
  LAYOUT_PORTAL_HEIGHT,
} from "../layout/prismLayoutSceneScale";
import { LANDING_TERRAIN_CENTER_X, LANDING_TERRAIN_CENTER_Z } from "../layout/landingSceneLayout";

export type LayoutCopyRole = "kicker" | "title" | "body";

export type LayoutCopyBeat = {
  id: string;
  uStart: number;
  uEnd: number;
  role: LayoutCopyRole;
  lines: string[];
  color: number;
  worldPos: (layout: SceneLayoutData) => THREE.Vector3;
};

const intro = (y: number, z = 18) => () =>
  new THREE.Vector3(LANDING_TERRAIN_CENTER_X, y, LANDING_TERRAIN_CENTER_Z + z);

const cube = (yOff: number, zOff = 3.2) => (layout: SceneLayoutData) =>
  new THREE.Vector3(layout.cube.x, LAYOUT_CUBE_CENTER_Y + yOff, layout.cube.z + zOff);

const marble = (yOff: number, zOff = 3) => (layout: SceneLayoutData) =>
  new THREE.Vector3(
    layout.marble.x,
    LAYOUT_MARBLE_SIZE.height + LAYOUT_MARBLE_HOVER + yOff,
    layout.marble.z + zOff,
  );

const portal = (yMul: number, zOff = 4.5) => (layout: SceneLayoutData) =>
  new THREE.Vector3(layout.portal.x, LAYOUT_PORTAL_HEIGHT * yMul, layout.portal.z + zOff);

/** Copy complète de `/` (`Landing.tsx`) — FR, cadencée sur le travelling. */
export const LAYOUT_COPY_BEATS: LayoutCopyBeat[] = [
  {
    id: "hero-kicker",
    uStart: 0,
    uEnd: 0.066,
    role: "kicker",
    lines: ["Quand tout repose sur vous"],
    color: 0xd6d3d1,
    worldPos: intro(10.4, 22),
  },
  {
    id: "hero-title",
    uStart: 0,
    uEnd: 0.12,
    role: "title",
    lines: ["Vous avez déjà tranché.", "Ce qui a pesé reste flou."],
    color: 0xfde68a,
    worldPos: intro(8.2, 20),
  },
  {
    id: "hero-body-1",
    uStart: 0.02,
    uEnd: 0.12,
    role: "body",
    lines: [
      "La journée est pleine. Une priorité en remplace une autre,",
      "quelqu’un attend une réponse, et vous décidez quand même.",
      "Sur le moment, cela tient.",
    ],
    color: 0xe7e5e4,
    worldPos: intro(5.6, 18),
  },
  {
    id: "hero-body-2",
    uStart: 0.066,
    uEnd: 0.176,
    role: "body",
    lines: [
      "Ensuite, il reste peu de traces. Fatigue, urgence, conversation tendue,",
      "habitude de tout garder, peur de vous tromper — autant que les faits.",
      "Sans les noter, ces influences se mélangent.",
      "Les mêmes arbitrages reviennent, trop tard.",
    ],
    color: 0xd6d3d1,
    worldPos: cube(5.6, 5.5),
  },
  {
    id: "promise-title",
    uStart: 0.12,
    uEnd: 0.279,
    role: "title",
    lines: ["Décidez avec plus de clarté.", "Comprenez ce qui vous influence."],
    color: 0xfdba74,
    worldPos: cube(4.4, 3.4),
  },
  {
    id: "promise-body",
    uStart: 0.176,
    uEnd: 0.402,
    role: "body",
    lines: [
      "AEGIS relie décisions, énergie, habitudes et relations",
      "pour voir les schémas qui orientent votre manière d’agir —",
      "surtout lorsque la pression augmente.",
      "Ce n’est pas un outil qui décide à votre place.",
      "C’est un espace privé pour relire, relier, rendre lisible.",
    ],
    color: 0xe7e5e4,
    worldPos: cube(2.2, 3.2),
  },
  {
    id: "audience",
    uStart: 0.279,
    uEnd: 0.402,
    role: "body",
    lines: [
      "Pour celles et ceux dont les choix engagent plus qu’eux-mêmes :",
      "fondateurs, dirigeants, managers, indépendants.",
    ],
    color: 0xfde68a,
    worldPos: cube(0.4, 2.4),
  },
  {
    id: "how-title",
    uStart: 0.402,
    uEnd: 0.5,
    role: "title",
    lines: ["Ce que vous faites une fois inscrit"],
    color: 0xe2e8f0,
    worldPos: marble(4.8, 4),
  },
  {
    id: "how-1",
    uStart: 0.42,
    uEnd: 0.52,
    role: "body",
    lines: [
      "1. Vous ouvrez un compte et vous vous situez.",
      "L’inscription est gratuite. Le profil de décision pose un premier repère.",
      "Rien n’est encore une conclusion.",
    ],
    color: 0xcbd5e1,
    worldPos: marble(3.4, 3.2),
  },
  {
    id: "how-2",
    uStart: 0.48,
    uEnd: 0.58,
    role: "body",
    lines: [
      "2. Vous notez ce qui s’est réellement passé.",
      "Quelques minutes : une décision, un état, une habitude, un contexte.",
      "Vous écrivez ce que vous voulez garder.",
    ],
    color: 0xcbd5e1,
    worldPos: marble(2.2, 3),
  },
  {
    id: "how-3",
    uStart: 0.54,
    uEnd: 0.643,
    role: "body",
    lines: [
      "3. Vous relisez les répétitions.",
      "Les synthèses montrent des tendances. Vous ajustez.",
      "Le choix reste le vôtre.",
    ],
    color: 0xcbd5e1,
    worldPos: marble(1, 2.8),
  },
  {
    id: "materials-kicker",
    uStart: 0.58,
    uEnd: 0.643,
    role: "kicker",
    lines: ["Cinq matières, toujours les mêmes.", "Pas pour tout mesurer. Pour avoir de quoi relire."],
    color: 0x94a3b8,
    worldPos: marble(0, 2.2),
  },
  {
    id: "feat-profile",
    uStart: 0.643,
    uEnd: 0.72,
    role: "body",
    lines: [
      "Votre profil de décision",
      "Nommer tendances, réflexes sous pression, angles morts.",
      "Pas une étiquette — un premier langage pour vous observer.",
    ],
    color: 0x67e8f9,
    worldPos: portal(0.72, 6),
  },
  {
    id: "feat-tradeoffs",
    uStart: 0.69,
    uEnd: 0.76,
    role: "body",
    lines: [
      "Les arbitrages qui comptent",
      "Décision, contexte, options, responsabilité, temps de réflexion,",
      "et ce qui a finalement orienté le choix.",
    ],
    color: 0xa5f3fc,
    worldPos: portal(0.62, 5.5),
  },
  {
    id: "feat-state",
    uStart: 0.73,
    uEnd: 0.8,
    role: "body",
    lines: [
      "L’état dans lequel vous décidez",
      "Énergie, sommeil, stress, humeur, habitudes.",
      "Quels contextes soutiennent le discernement — lesquels le fragilisent.",
    ],
    color: 0xa5f3fc,
    worldPos: portal(0.52, 5.2),
  },
  {
    id: "feat-relations",
    uStart: 0.77,
    uEnd: 0.84,
    role: "body",
    lines: [
      "Les relations autour de la décision",
      "Soutien, tension, confiance, attentes, non-dits.",
      "Une décision importante se prend rarement seul.",
    ],
    color: 0xa5f3fc,
    worldPos: portal(0.42, 5),
  },
  {
    id: "feat-review",
    uStart: 0.81,
    uEnd: 0.88,
    role: "body",
    lines: [
      "Une relecture, pas une consigne",
      "Répétitions, tensions possibles, questions utiles.",
      "Incomplets parfois. Ils ne vous disent pas quoi faire.",
    ],
    color: 0xa5f3fc,
    worldPos: portal(0.32, 4.8),
  },
  {
    id: "trust-title",
    uStart: 0.84,
    uEnd: 0.92,
    role: "title",
    lines: ["Ce que vous pouvez vérifier avant de commencer"],
    color: 0xfde68a,
    worldPos: portal(0.78, 3.5),
  },
  {
    id: "trust-body",
    uStart: 0.86,
    uEnd: 0.94,
    role: "body",
    lines: [
      "Vos écrits ne sont pas un produit. Ils ne sont pas vendus.",
      "Vous pouvez commencer sans payer. Initiation est gratuit.",
      "Remboursement intégral 30 jours, sans justification.",
      "Vous choisissez ce qui entre. Rien n’est obligatoire.",
    ],
    color: 0xe7e5e4,
    worldPos: portal(0.55, 3.2),
  },
  {
    id: "limits",
    uStart: 0.9,
    uEnd: 0.97,
    role: "body",
    lines: [
      "Ce qu’AEGIS ne fait pas",
      "Pas une thérapie, un diagnostic, un traitement, ni de la surveillance.",
      "Pas validé cliniquement. Pas de promesse de performance.",
      "Les synthèses peuvent se tromper. Le jugement reste le vôtre.",
    ],
    color: 0xd6d3d1,
    worldPos: portal(0.38, 3),
  },
  {
    id: "cta-kicker",
    uStart: 0.94,
    uEnd: 1,
    role: "kicker",
    lines: ["Commencez par rendre visible ce qui vous influence"],
    color: 0x94a3b8,
    worldPos: portal(0.7, 2.4),
  },
  {
    id: "cta-title",
    uStart: 0.95,
    uEnd: 1,
    role: "title",
    lines: ["Vos décisions laissent des traces.", "AEGIS vous aide à les lire."],
    color: 0xfde68a,
    worldPos: portal(0.5, 2.2),
  },
  {
    id: "cta-body",
    uStart: 0.96,
    uEnd: 1,
    role: "body",
    lines: [
      "Le compte est gratuit.",
      "Un espace privé. Un arbitrage, un état, une habitude — à votre rythme.",
      "Créer un compte  ·  Découvrir votre profil de décision",
    ],
    color: 0xe7e5e4,
    worldPos: portal(0.28, 2),
  },
];

export function opacityForLayoutBeat(u: number, uStart: number, uEnd: number): number {
  if (u < uStart || u > uEnd) return 0;
  const fade = Math.min(0.025, Math.max(0.008, (uEnd - uStart) * 0.22));
  if (u < uStart + fade) return (u - uStart) / fade;
  if (u > uEnd - fade) return (uEnd - u) / fade;
  return 1;
}
