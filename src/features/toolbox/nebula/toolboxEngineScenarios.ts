import type { ToolboxVisualLanguage } from "./toolboxNebulaVisuals";

export interface EngineScenario {
  engine: string;
  visual: ToolboxVisualLanguage;
  gesture: string;
  sequence: string;
}

/**
 * One visual + one animation scenario per product engine.
 * visual is exclusive: matter XOR particles (listen = audio).
 */
export const ENGINE_SCENARIOS: EngineScenario[] = [
  {
    engine: "breath",
    visual: "particles",
    gesture: "Deux poumons en particules.",
    sequence:
      "Inspire : les deux lobes gonflent (scale 0.78→1.06). Hold : freeze. Expire : dégonfle. Pas une patate matière, pas une sphère.",
  },
  {
    engine: "interrupt",
    visual: "particles",
    gesture: "Tempête puis coupure nette.",
    sequence:
      "S : vortex en tempête. T : morph colonne (souffle). O : morph anneaux + SNAP freeze. P : jet stream. Tu dois LIRE la lettre dans la forme.",
  },
  {
    engine: "scan",
    visual: "matter",
    gesture: "Matière qui se stabilise zone par zone.",
    sequence:
      "Blob organique central. Chaque zone : légère agitation puis freeze (ancrage). Teinte descend tête→pieds. Overlay compact, pas de silhouette.",
  },
  {
    engine: "move",
    visual: "matter",
    gesture: "Décharge / activation — matière organique.",
    sequence:
      "Même shell matter que body scan. Hero par slug (shake, pulse, steps…). Overlay compact, pas de widget legacy empilé.",
  },
  {
    engine: "visualize",
    visual: "particles",
    gesture: "Changer de lieu sans changer de moteur.",
    sequence:
      "Ancre : lotus. Lieu : dôme. Scène : tunnel. Succès : anneaux. Retour : lotus. Overlay une ligne d’instruction.",
  },
  {
    engine: "attend",
    visual: "particles",
    gesture: "Un méditant quasi immobile.",
    sequence:
      "Silhouette lotus, coherence haute, noise quasi mort. La souris est le seul événement. Pas une boule de matière.",
  },
  {
    engine: "stream",
    visual: "particles",
    gesture: "Colonne d’encre, panneau d’écriture séparé.",
    sequence:
      "Figure colonne calme. L’éditeur n’est plus un overlay : il prend le bas du modal, le nuage reste lisible au-dessus.",
  },
  {
    engine: "savor",
    visual: "particles",
    gesture: "Dôme chaud qui s’allume.",
    sequence: "Dome, bloom or, légère ouverture. Overlay compact pour laisser voir la figure.",
  },
  {
    engine: "affirm",
    visual: "particles",
    gesture: "Anneaux qui battent la phrase.",
    sequence: "Rings + micro scale. Un beat = une affirmation. Overlay compact.",
  },
  {
    engine: "intend",
    visual: "particles",
    gesture: "Tore qui se pose.",
    sequence: "Torus : une inflation lente puis hold. Pas un poumon de matière.",
  },
  {
    engine: "sequence",
    visual: "particles",
    gesture: "Anneau qui cligne à chaque step.",
    sequence: "Idle rings. Spike de noise court à chaque coche.",
  },
  {
    engine: "reframe",
    visual: "particles",
    gesture: "Vortex puis anneaux nets.",
    sequence: "Croyance = vortex. Rewrite = morph rings + freeze court.",
  },
  {
    engine: "weigh",
    visual: "particles",
    gesture: "Tore en balance.",
    sequence: "Torus stable, léger wobble. Quand un côté gagne, freeze.",
  },
  {
    engine: "voices",
    visual: "particles",
    gesture: "Colonne vs anneaux.",
    sequence: "Voix A = column. Voix B = rings. Switch net.",
  },
  {
    engine: "bridge",
    visual: "particles",
    gesture: "Tunnel de perspective.",
    sequence: "Tunnel : profondeur gauche→droite. Overlay compact.",
  },
  {
    engine: "edge",
    visual: "particles",
    gesture: "Coque, pas un blob.",
    sequence: "Dome creux, freeze haut. La souris teste le bord.",
  },
  {
    engine: "gauge",
    visual: "particles",
    gesture: "Corps dont l’intensité change.",
    sequence: "Silhouette body. Scale/noise suivent le score. Overlay compact.",
  },
  {
    engine: "ledger",
    visual: "particles",
    gesture: "Colonne chaude ou froide.",
    sequence: "Column. Overlay compact en bas.",
  },
  {
    engine: "link",
    visual: "particles",
    gesture: "Petite sphère de veille.",
    sequence: "Sphere minimale. CTA au-dessus, pas un mur de widget.",
  },
  {
    engine: "listen",
    visual: "audio",
    gesture: "Le son mène.",
    sequence:
      "Pas matière, pas V3. Spectre audio (MeditationNebula). Ne pas toucher en démo produit.",
  },
];

export const ENGINE_SCENARIO_MAP = new Map(ENGINE_SCENARIOS.map((s) => [s.engine, s]));
