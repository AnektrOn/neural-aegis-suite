import type { MicroHeroPreset } from "@/lib/toolbox-slug-themes";

export type ToolboxRendererKind = "native" | "composed_v1" | "external_link";
export type ToolboxContentTypeStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "deprecated";

export type ToolboxTier = "beginner" | "initiate" | "sovereign";

export type ToolboxExocortexOrgan =
  | "vortex_emergency"   // Coupe-circuit de crise / régulation d'urgence
  | "decision_log"       // Arbitrage décisionnel & trajectoire
  | "people_board"       // Hygiène relationnelle, projections, contrats
  | "daily_posture"      // Alignement somatique, énergétique & attentionnel quotidien
  | "voice_oracle";      // Préparation / intégration d'appel vocal

export type ToolboxPillar =
  | "homeostasie_nerveuse"       // Régulation SNA, souffle, somatique, réflexologie
  | "conscience_interface"       // Dépollution cognitive, attention, temps-horloge vs mental
  | "alchimie_archetypale"       // Ombre, Saboteur/Prostitué/Victime/Enfant, Persona, Projections
  | "gouvernance_souveraine";    // Anti-choc, Point Zéro, attracteur, délégation, exécution

export interface AegisToolboxExtendedConfig {
  tier?: ToolboxTier;                          // Défaut: "beginner"
  pillar?: ToolboxPillar;
  exocortex_organ?: ToolboxExocortexOrgan;
  mechanism_tag?: string;                      // Ex: "vagal_brake", "shock_freeze", "projection_withdrawal", "icon_deconstruction"
  parent_template_key?: string;                // Clé du template global parent si c'est une variante custom "individual"
  why_this_for_you?: string;                   // Contexte clinique personnalisé (affiché en bandeau sur les items "individual")
  why_this_for_you_i18n?: { fr?: string; en?: string };
  resistance_fallback_sec?: number;            // Version ultra-courte (ex: 60s) proposée si l'utilisateur manque de temps ou résiste
  archetype_targets?: string[];
  shadow_targets?: string[];
  distribution_mode?: string;
}

export interface ToolboxContentTypeDefinition {
  slug: string;
  label_fr: string;
  label_en: string;
  description_fr: string;
  description_en: string;
  category: string;
  icon: string;
  renderer_kind: ToolboxRendererKind;
  status: ToolboxContentTypeStatus;
  config_schema: Record<string, unknown>;
  ui_blueprint: Record<string, unknown>;
  sample_config: Record<string, unknown> & AegisToolboxExtendedConfig;
  default_title_fr: string;
  default_title_en: string;
  tier?: ToolboxTier;
  pillar?: ToolboxPillar;
  exocortex_organ?: ToolboxExocortexOrgan;
}

const nativeExercise = (
  slug: string,
  labelFr: string,
  labelEn: string,
  category: string,
  icon: string,
  descriptionFr: string,
  descriptionEn: string,
  sampleConfig: Record<string, unknown> & AegisToolboxExtendedConfig,
  required: string[] = ["instructions"],
  presentation: string,
  theme?: { accent: string; hero?: MicroHeroPreset },
): ToolboxContentTypeDefinition => ({
  slug,
  label_fr: labelFr,
  label_en: labelEn,
  description_fr: descriptionFr,
  description_en: descriptionEn,
  category,
  icon,
  renderer_kind: "native",
  status: "published",
  config_schema: { type: "object", required },
  ui_blueprint: { presentation, theme },
  sample_config: {
    tier: "beginner",
    ...sampleConfig,
    ...(theme?.accent ? { accent_color: theme.accent } : {}),
    ...(theme?.hero ? { hero: theme.hero } : {}),
  },
  default_title_fr: labelFr,
  default_title_en: labelEn,
  tier: sampleConfig.tier ?? "beginner",
  pillar: sampleConfig.pillar,
  exocortex_organ: sampleConfig.exocortex_organ,
});

export const BUILTIN_TOOLBOX_CONTENT_TYPES: ToolboxContentTypeDefinition[] = [
  {
    slug: "breathwork",
    label_fr: "Frein Vagal 4-4-6-2",
    label_en: "4-4-6-2 Vagal Brake",
    description_fr: "Régulation parasympathique rapide avant arbitrage à fort enjeu.",
    description_en: "Rapid parasympathetic regulation before high-stakes arbitration.",
    category: "regulation",
    icon: "wind",
    renderer_kind: "native",
    status: "published",
    config_schema: {
      type: "object",
      required: [
        "cycles",
        "breath_in_sec",
        "pause1_sec",
        "breath_out_sec",
        "pause2_sec",
      ],
    },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "vagal_brake",
      resistance_fallback_sec: 64,
      cycles: 6,
      breath_in_sec: 4,
      pause1_sec: 4,
      breath_out_sec: 6,
      pause2_sec: 2,
      instructions:
        "Inspire 4s par le nez, verrouille 4s, expire 6s pour engager le frein vagal, pause 2s.",
      instructions_i18n: {
        fr: "Inspire 4s par le nez, verrouille 4s, expire 6s pour engager le frein vagal, pause 2s.",
        en: "Inhale 4s through the nose, hold 4s, exhale 6s to engage the vagal brake, pause 2s.",
      },
    },
    default_title_fr: "Frein Vagal 4-4-6-2",
    default_title_en: "4-4-6-2 Vagal Brake",
    tier: "beginner",
    pillar: "homeostasie_nerveuse",
    exocortex_organ: "vortex_emergency",
  },
  {
    slug: "focus_introspectif",
    label_fr: "Point Zéro Pré-Décisionnel (Decision Log)",
    label_en: "Pre-Decision Zero Point (Decision Log)",
    description_fr:
      "Calibration à froid de la neutralité avant de trancher : relâcher le biais « pour » et le biais « contre ».",
    description_en:
      "Cold neutrality calibration before deciding: release both 'for' and 'against' biases.",
    category: "attention",
    icon: "eye",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object", required: ["duration_min", "intention"] },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "zero_point_calibration",
      resistance_fallback_sec: 90,
      duration_min: 4,
      intention:
        "Relâcher l'attraction du Pour et la peur du Contre jusqu'à la neutralité du Point Zéro.",
      intention_i18n: {
        fr: "Relâcher l'attraction du Pour et la peur du Contre jusqu'à la neutralité du Point Zéro.",
        en: "Release the pull of For and the fear of Against until reaching Zero Point neutrality.",
      },
    },
    default_title_fr: "Point Zéro Pré-Décisionnel (Decision Log)",
    default_title_en: "Pre-Decision Zero Point (Decision Log)",
    tier: "beginner",
    pillar: "gouvernance_souveraine",
    exocortex_organ: "decision_log",
  },
  {
    slug: "body_scan",
    label_fr: "Scan Somatique de Déverrouillage d'Armure",
    label_en: "Somatic Armor Unlocking Scan",
    description_fr:
      "Détection et relâchement des tensions défensives : front/cortex, mâchoires, trapèzes, plexus, ventre, ancrage au sol.",
    description_en:
      "Detect and release defensive armor tensions: forehead/cortex, jaw, trapezius, solar plexus, belly, ground anchor.",
    category: "body",
    icon: "scan",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object" },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "somatic_armor_unlock",
      resistance_fallback_sec: 90,
      duration_min: 3,
      zones: [
        {
          id: "forehead",
          label: "Front & Cortex",
          label_i18n: { fr: "Front & Cortex", en: "Forehead & Cortex" },
          instruction: "Relâche la pression derrière les yeux et lisse le front pour couper la sur-analyse.",
          instruction_i18n: {
            fr: "Relâche la pression derrière les yeux et lisse le front pour couper la sur-analyse.",
            en: "Release pressure behind the eyes and smooth the forehead to cut over-analysis.",
          },
          duration_sec: 30,
        },
        {
          id: "jaw",
          label: "Mâchoires",
          label_i18n: { fr: "Mâchoires", en: "Jaw" },
          instruction: "Desserre les dents et décolle la langue du palais pour désactiver le réflexe défensif.",
          instruction_i18n: {
            fr: "Desserre les dents et décolle la langue du palais pour désactiver le réflexe défensif.",
            en: "Unclench teeth and drop the tongue from the palate to deactivate defensive bracing.",
          },
          duration_sec: 30,
        },
        {
          id: "trapezius",
          label: "Trapèzes",
          label_i18n: { fr: "Trapèzes", en: "Trapezius" },
          instruction: "Abaisse les épaules de deux centimètres et dépose la surcharge portée.",
          instruction_i18n: {
            fr: "Abaisse les épaules de deux centimètres et dépose la surcharge portée.",
            en: "Drop your shoulders by two centimeters and set down carried overload.",
          },
          duration_sec: 30,
        },
        {
          id: "solar_plexus",
          label: "Plexus Solaire",
          label_i18n: { fr: "Plexus Solaire", en: "Solar Plexus" },
          instruction: "Ouvre le diaphragme et laisse l'expiration dissoudre le nœud de contrôle.",
          instruction_i18n: {
            fr: "Ouvre le diaphragme et laisse l'expiration dissoudre le nœud de contrôle.",
            en: "Open the diaphragm and let the exhale dissolve the control knot.",
          },
          duration_sec: 30,
        },
        {
          id: "abdomen",
          label: "Ventre",
          label_i18n: { fr: "Ventre", en: "Abdomen" },
          instruction: "Relâche le gainage viscéral défensif pour restaurer le signal de sécurité.",
          instruction_i18n: {
            fr: "Relâche le gainage viscéral défensif pour restaurer le signal de sécurité.",
            en: "Release visceral defensive bracing to restore the safety signal.",
          },
          duration_sec: 30,
        },
        {
          id: "feet",
          label: "Ancrage au Sol",
          label_i18n: { fr: "Ancrage au Sol", en: "Ground Anchor" },
          instruction: "Verrouille la sensation de gravité sous les pieds : présence physique totale.",
          instruction_i18n: {
            fr: "Verrouille la sensation de gravité sous les pieds : présence physique totale.",
            en: "Lock gravity sensation under your feet: total physical presence.",
          },
          duration_sec: 30,
        },
      ],
    },
    default_title_fr: "Scan Somatique de Déverrouillage d'Armure",
    default_title_en: "Somatic Armor Unlocking Scan",
    tier: "beginner",
    pillar: "homeostasie_nerveuse",
    exocortex_organ: "daily_posture",
  },
  {
    slug: "visualization",
    label_fr: "Architecture Solve & Coagula (Dissoudre et Reconstruire)",
    label_en: "Solve & Coagula Architecture (Dissolve & Rebuild)",
    description_fr:
      "Scène 1 : Décomposer le problème en faits nus | Scène 2 : Reconstruire la trajectoire essentielle.",
    description_en:
      "Scene 1: Deconstruct the problem into bare facts | Scene 2: Rebuild the essential trajectory.",
    category: "attention",
    icon: "sparkles",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object" },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "decision_log",
      mechanism_tag: "solve_et_coagula",
      resistance_fallback_sec: 90,
      total_sec: 240,
      scenes: [
        {
          id: "solve",
          title: "Solve — Dissoudre les scories",
          label: "Solve — Dissoudre les scories",
          label_i18n: { fr: "Solve — Dissoudre les scories", en: "Solve — Dissolve the dross" },
          instruction:
            "Décompose la situation complexe en faits physiques bruts, en dissolvant les peurs et récits parasites.",
          instruction_i18n: {
            fr: "Décompose la situation complexe en faits physiques bruts, en dissolvant les peurs et récits parasites.",
            en: "Deconstruct the complex situation into raw physical facts, dissolving fears and parasitic narratives.",
          },
          sec: 120,
          duration_sec: 120,
        },
        {
          id: "coagula",
          title: "Coagula — Reconstruire la trajectoire essentielle",
          label: "Coagula — Reconstruire la trajectoire essentielle",
          label_i18n: {
            fr: "Coagula — Reconstruire la trajectoire essentielle",
            en: "Coagula — Rebuild the essential trajectory",
          },
          instruction:
            "Visualise la décision souveraine et le premier geste chirurgical exécuté avec un calme absolu.",
          instruction_i18n: {
            fr: "Visualise la décision souveraine et le premier geste chirurgical exécuté avec un calme absolu.",
            en: "Visualize the sovereign decision and the first surgical move executed with absolute calm.",
          },
          sec: 120,
          duration_sec: 120,
        },
      ],
    },
    default_title_fr: "Architecture Solve & Coagula (Dissoudre et Reconstruire)",
    default_title_en: "Solve & Coagula Architecture (Dissolve & Rebuild)",
    tier: "beginner",
    pillar: "conscience_interface",
    exocortex_organ: "decision_log",
  },
  {
    slug: "affirmations",
    label_fr: "Décrets de Souveraineté & Désidentification",
    label_en: "Sovereignty & Disidentification Decrees",
    description_fr: "Ancrage de postures opératives sobres, sans pensée magique.",
    description_en: "Anchoring sober operative postures, free of magical thinking.",
    category: "cognitive",
    icon: "stars",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object", required: ["duration_min", "affirmations"] },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "daily_posture",
      mechanism_tag: "sovereign_decrees",
      resistance_fallback_sec: 60,
      duration_min: 3,
      affirmations: [
        "Je décide à partir de la clarté, non de l'urgence.",
        "Je suis le pilote de mon attention.",
        "Mon calme est ma puissance d'action.",
      ],
      affirmations_i18n: {
        fr: [
          "Je décide à partir de la clarté, non de l'urgence.",
          "Je suis le pilote de mon attention.",
          "Mon calme est ma puissance d'action.",
        ],
        en: [
          "I decide from clarity, not urgency.",
          "I am the pilot of my attention.",
          "My calm is my power to act.",
        ],
      },
    },
    default_title_fr: "Décrets de Souveraineté & Désidentification",
    default_title_en: "Sovereignty & Disidentification Decrees",
    tier: "beginner",
    pillar: "alchimie_archetypale",
    exocortex_organ: "daily_posture",
  },
  {
    slug: "gratitude",
    label_fr: "Audit des Appuis Souverains (Actifs Réels)",
    label_en: "Sovereign Leverage Audit (Real Assets)",
    description_fr:
      "Identifier 3 leviers ou alliances solides déjà acquis pour couper l'illusion de manque.",
    description_en:
      "Identify 3 solid levers or alliances already secured to cut through scarcity illusion.",
    category: "journal",
    icon: "heart",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object", required: ["entries_count"] },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "sovereign_assets_audit",
      entries_count: 3,
    },
    default_title_fr: "Audit des Appuis Souverains (Actifs Réels)",
    default_title_en: "Sovereign Leverage Audit (Real Assets)",
    tier: "beginner",
    pillar: "gouvernance_souveraine",
    exocortex_organ: "decision_log",
  },
  {
    slug: "journal_prompt",
    label_fr: "Miroir de Retrait de Projection (People Board)",
    label_en: "Projection Withdrawal Mirror (People Board)",
    description_fr:
      "Identifier la projection active sur un interlocuteur et récupérer le pouvoir décisionnel délégué.",
    description_en:
      "Identify active projection onto an interlocutor and reclaim delegated decision-making power.",
    category: "journal",
    icon: "book",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object", required: ["prompt"] },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "projection_withdrawal",
      prompt:
        "Quel trait exact m'irrite ou me fascine chez cet interlocuteur aujourd'hui, et quelle part de mon propre pouvoir suis-je en train de lui déléguer ?",
      prompt_i18n: {
        fr: "Quel trait exact m'irrite ou me fascine chez cet interlocuteur aujourd'hui, et quelle part de mon propre pouvoir suis-je en train de lui déléguer ?",
        en: "What exact trait irritates or fascinates me in this person today, and what part of my own power am I delegating to them?",
      },
    },
    default_title_fr: "Miroir de Retrait de Projection (People Board)",
    default_title_en: "Projection Withdrawal Mirror (People Board)",
    tier: "beginner",
    pillar: "alchimie_archetypale",
    exocortex_organ: "people_board",
  },
  {
    slug: "stop_protocol",
    label_fr: "Coupe-Circuit Anti-Choc (Mode Vortex)",
    label_en: "Anti-Shock Circuit Breaker (Vortex Mode)",
    description_fr:
      "Gel décisionnel en 4 temps : Stopper l'impulsion, Respirer dans la contraction, Séparer le fait brut du scénario, Différer ou trancher au calme.",
    description_en:
      "4-step decision freeze: Stop the impulse, Breathe into the contraction, Separate raw fact from story, Defer or decide in calm.",
    category: "regulation",
    icon: "shield",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object" },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "shock_freeze",
      resistance_fallback_sec: 60,
      mode: "timed",
      step_duration_sec: 30,
      duration_sec: 120,
      steps: [
        {
          title: "S — Stopper l'impulsion",
          hint: "Interdiction formelle d'envoyer un message, de signer ou de répondre sous charge sympathique.",
          title_i18n: { fr: "S — Stopper l'impulsion", en: "S — Stop the impulse" },
          hint_i18n: {
            fr: "Interdiction formelle d'envoyer un message, de signer ou de répondre sous charge sympathique.",
            en: "Strict prohibition on sending a message, signing, or replying under sympathetic load.",
          },
        },
        {
          title: "T — Traverser la contraction par le souffle",
          hint: "Expire longuement en relâchant la mâchoire et les épaules jusqu'à la baisse du rythme cardiaque.",
          title_i18n: {
            fr: "T — Traverser la contraction par le souffle",
            en: "T — Breathe through the contraction",
          },
          hint_i18n: {
            fr: "Expire longuement en relâchant la mâchoire et les épaules jusqu'à la baisse du rythme cardiaque.",
            en: "Exhale slowly while releasing jaw and shoulders until heart rate drops.",
          },
        },
        {
          title: "O — Observer Fait Brut vs Scénario",
          hint: "Sépare ce qu'une caméra aurait filmé (fait) de la catastrophe projetée par l'interface.",
          title_i18n: {
            fr: "O — Observer Fait Brut vs Scénario",
            en: "O — Observe Raw Fact vs Story",
          },
          hint_i18n: {
            fr: "Sépare ce qu'une caméra aurait filmé (fait) de la catastrophe projetée par l'interface.",
            en: "Separate what a camera would record (fact) from the catastrophe projected by the interface.",
          },
        },
        {
          title: "P — Positionner ou différer à froid",
          hint: "Si le Point Zéro est atteint, tranche en une phrase sobre ; sinon, diffère l'arbitrage de 24h.",
          title_i18n: {
            fr: "P — Positionner ou différer à froid",
            en: "P — Proceed or defer cold",
          },
          hint_i18n: {
            fr: "Si le Point Zéro est atteint, tranche en une phrase sobre ; sinon, diffère l'arbitrage de 24h.",
            en: "If Zero Point is reached, decide in one sober sentence; otherwise defer arbitration for 24h.",
          },
        },
      ],
    },
    default_title_fr: "Coupe-Circuit Anti-Choc (Mode Vortex)",
    default_title_en: "Anti-Shock Circuit Breaker (Vortex Mode)",
    tier: "beginner",
    pillar: "gouvernance_souveraine",
    exocortex_organ: "vortex_emergency",
  },
  {
    slug: "intention",
    label_fr: "Attracteur Exécutif du Jour (Une Ligne)",
    label_en: "Daily Executive Attractor (One Line)",
    description_fr:
      "Poser 1 commandement postural clair qui organise les décisions de la journée.",
    description_en:
      "Set 1 clear postural command that organizes the day's decisions.",
    category: "intentionality",
    icon: "target",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object" },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "daily_posture",
      mechanism_tag: "executive_attractor",
      resistance_fallback_sec: 60,
      intention:
        "Quelle est la posture souveraine non-négociable qui gouvernera mes arbitrages aujourd'hui ?",
      question:
        "Quelle est la posture souveraine non-négociable qui gouvernera mes arbitrages aujourd'hui ?",
      question_i18n: {
        fr: "Quelle est la posture souveraine non-négociable qui gouvernera mes arbitrages aujourd'hui ?",
        en: "What is the non-negotiable sovereign posture that will govern my arbitrations today?",
      },
      duration_min: 3,
      duration_sec: 180,
    },
    default_title_fr: "Attracteur Exécutif du Jour (Une Ligne)",
    default_title_en: "Daily Executive Attractor (One Line)",
    tier: "beginner",
    pillar: "gouvernance_souveraine",
    exocortex_organ: "daily_posture",
  },
  {
    slug: "micro_practice",
    label_fr: "Le Framework de Délégation à 70 %",
    label_en: "The 70% Delegation Framework",
    description_fr:
      "Neutraliser le besoin de contrôle du Saboteur et accepter 30 % d'écart pour racheter sa bande passante souveraine.",
    description_en:
      "Neutralize the Saboteur's need for control and accept a 30% gap to buy back sovereign bandwidth.",
    category: "custom",
    icon: "zap",
    renderer_kind: "native",
    status: "published",
    config_schema: { type: "object", required: ["instructions"] },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "saboteur_delegation_70",
      resistance_fallback_sec: 90,
      instructions:
        "Identifie une tâche opérationnelle que tu retiens par perfectionnisme défensif et transfère-la immédiatement.",
      instructions_i18n: {
        fr: "Identifie une tâche opérationnelle que tu retiens par perfectionnisme défensif et transfère-la immédiatement.",
        en: "Identify an operational task you are holding onto out of defensive perfectionism and transfer it immediately.",
      },
      duration_sec: 240,
      steps: [
        {
          text: "Isoler la rétention — Nomme la tâche exacte que tu t'apprêtes à exécuter toi-même par méfiance.",
          text_i18n: {
            fr: "Isoler la rétention — Nomme la tâche exacte que tu t'apprêtes à exécuter toi-même par méfiance.",
            en: "Isolate retention — Name the exact task you are about to execute yourself out of mistrust.",
          },
        },
        {
          text: "Audit du seuil 70 % — Vérifie si un tiers peut livrer 70 % du standard sans mettre en péril une ligne rouge.",
          text_i18n: {
            fr: "Audit du seuil 70 % — Vérifie si un tiers peut livrer 70 % du standard sans mettre en péril une ligne rouge.",
            en: "Audit the 70% threshold — Check if someone else can deliver 70% of the standard without breaching a red line.",
          },
        },
        {
          text: "Transmission chirurgicale — Formule le livrable attendu et l'échéance en 3 lignes, sans micro-manager le comment.",
          text_i18n: {
            fr: "Transmission chirurgicale — Formule le livrable attendu et l'échéance en 3 lignes, sans micro-manager le comment.",
            en: "Surgical handoff — State the expected deliverable and deadline in 3 lines without micromanaging the how.",
          },
        },
        {
          text: "Rachat de bande passante — Accepte les 30 % d'imperfection comme le prix de ta souveraineté stratégique.",
          text_i18n: {
            fr: "Rachat de bande passante — Accepte les 30 % d'imperfection comme le prix de ta souveraineté stratégique.",
            en: "Bandwidth buyback — Accept the 30% imperfection gap as the price of your strategic sovereignty.",
          },
        },
      ],
    },
    default_title_fr: "Le Framework de Délégation à 70 %",
    default_title_en: "The 70% Delegation Framework",
    tier: "beginner",
    pillar: "gouvernance_souveraine",
    exocortex_organ: "decision_log",
  },
  {
    slug: "breath_box",
    label_fr: "Respiration Tactique Carrée 4-4-4-4",
    label_en: "4-4-4-4 Tactical Box Breathing",
    description_fr: "Verrouillage du calme opératif sous feu roulant.",
    description_en: "Locking operational calm under heavy fire.",
    category: "regulation",
    icon: "wind",
    renderer_kind: "native",
    status: "published",
    config_schema: {
      type: "object",
      required: [
        "cycles",
        "breath_in_sec",
        "pause1_sec",
        "breath_out_sec",
        "pause2_sec",
      ],
    },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "tactical_box_lock",
      resistance_fallback_sec: 64,
      cycles: 12,
      breath_in_sec: 4,
      pause1_sec: 4,
      breath_out_sec: 4,
      pause2_sec: 4,
      breath_visual: "box",
      instructions:
        "4s inspire, 4s rétention poumons pleins, 4s expire, 4s rétention poumons vides — stabilise le cortex préfrontal.",
      instructions_i18n: {
        fr: "4s inspire, 4s rétention poumons pleins, 4s expire, 4s rétention poumons vides — stabilise le cortex préfrontal.",
        en: "4s inhale, 4s full retention, 4s exhale, 4s empty retention — stabilize the prefrontal cortex.",
      },
    },
    default_title_fr: "Respiration Tactique Carrée 4-4-4-4",
    default_title_en: "4-4-4-4 Tactical Box Breathing",
    tier: "beginner",
    pillar: "homeostasie_nerveuse",
    exocortex_organ: "vortex_emergency",
  },
  {
    slug: "breath_coherence",
    label_fr: "Cohérence Ventrale 5/5",
    label_en: "5/5 Ventral Coherence",
    description_fr: "Stabilisation de la variabilité cardiaque avant exposition à haute pression.",
    description_en: "Heart rate variability stabilization before high-pressure exposure.",
    category: "regulation",
    icon: "wind",
    renderer_kind: "native",
    status: "published",
    config_schema: {
      type: "object",
      required: [
        "cycles",
        "breath_in_sec",
        "pause1_sec",
        "breath_out_sec",
        "pause2_sec",
      ],
    },
    ui_blueprint: { blocks: ["native"] },
    sample_config: {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "hrv_ventral_coherence",
      resistance_fallback_sec: 90,
      cycles: 18,
      breath_in_sec: 5,
      pause1_sec: 0,
      breath_out_sec: 5,
      pause2_sec: 0,
      breath_visual: "circle",
      instructions: "Inspire 5s / Expire 5s sans pause pour synchroniser le nerf vague ventral.",
      instructions_i18n: {
        fr: "Inspire 5s / Expire 5s sans pause pour synchroniser le nerf vague ventral.",
        en: "Inhale 5s / Exhale 5s without pause to synchronize the ventral vagus nerve.",
      },
    },
    default_title_fr: "Cohérence Ventrale 5/5",
    default_title_en: "5/5 Ventral Coherence",
    tier: "beginner",
    pillar: "homeostasie_nerveuse",
    exocortex_organ: "daily_posture",
  },
  nativeExercise(
    "physiological_sigh",
    "Double Soupir Physiologique",
    "Double Physiological Sigh",
    "regulation",
    "wind",
    "Décharge immédiate du CO2 et de la surchauffe adrénergique en 90s.",
    "Immediate CO2 offload and adrenergic overheat discharge in 90s.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "adrenergic_offload",
      resistance_fallback_sec: 45,
      cycles: 8,
      breath_in_sec: 2,
      pause1_sec: 1,
      breath_out_sec: 8,
      pause2_sec: 0,
      instructions:
        "Double inspiration nasale (2s + 1s d'appoint) suivie d'une longue expiration buccale (8s) pour déplisser les alvéoles et couper l'alerte.",
      instructions_i18n: {
        fr: "Double inspiration nasale (2s + 1s d'appoint) suivie d'une longue expiration buccale (8s) pour déplisser les alvéoles et couper l'alerte.",
        en: "Double nasal inhale (2s + 1s top-up) followed by a long mouth exhale (8s) to reinflate alveoli and cut the alarm.",
      },
    },
    ["instructions"],
    "breathwork",
    { accent: "hsl(176 70% 48%)" },
  ),
  nativeExercise(
    "vagal_hum",
    "Résonance Vagal-Laryngée (4-8)",
    "Vagal-Laryngeal Resonance (4-8)",
    "regulation",
    "wind",
    "Stimulation mécanique du nerf vague par vibration laryngée basse sur l'expiration.",
    "Mechanical vagus nerve stimulation through low laryngeal vibration on exhale.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "laryngeal_vagal_tone",
      resistance_fallback_sec: 60,
      cycles: 12,
      breath_in_sec: 4,
      pause1_sec: 0,
      breath_out_sec: 8,
      pause2_sec: 0,
      instructions:
        "Inspire 4s par le nez, puis émets une vibration grave continue (8s) dans le thorax et la gorge pour calmer le circuit défensif.",
      instructions_i18n: {
        fr: "Inspire 4s par le nez, puis émets une vibration grave continue (8s) dans le thorax et la gorge pour calmer le circuit défensif.",
        en: "Inhale 4s through the nose, then emit a low continuous vibration (8s) in chest and throat to calm the defensive circuit.",
      },
    },
    ["instructions"],
    "breathwork",
    { accent: "hsl(200 70% 55%)" },
  ),
  nativeExercise(
    "micro_movement",
    "Déverrouillage Biomécanique Cervico-Thoracique",
    "Cervico-Thoracic Biomechanical Unlock",
    "body",
    "zap",
    "Ouverture de la cage thoracique et de l'axe vagal pour sortir de la posture de repli défensif.",
    "Ribcage and vagal axis opening to exit defensive folding posture.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "biomechanical_unlock",
      resistance_fallback_sec: 60,
      instructions:
        "Utilise la biomécanique posturale pour envoyer un signal immédiat de non-menace au tronc cérébral.",
      instructions_i18n: {
        fr: "Utilise la biomécanique posturale pour envoyer un signal immédiat de non-menace au tronc cérébral.",
        en: "Use postural biomechanics to send an immediate non-threat signal to the brainstem.",
      },
      steps: [
        {
          text: "Axe occiput-sacrum — Érige la colonne sans cambrer, menton légèrement rentré pour libérer la charnière cervicale.",
          text_i18n: {
            fr: "Axe occiput-sacrum — Érige la colonne sans cambrer, menton légèrement rentré pour libérer la charnière cervicale.",
            en: "Occiput-sacrum axis — Lengthen the spine without arching, chin slightly tucked to free the cervical hinge.",
          },
        },
        {
          text: "Ouverture sternale — Roule les épaules en arrière et vers le bas pour déployer le plexus et le diaphragme.",
          text_i18n: {
            fr: "Ouverture sternale — Roule les épaules en arrière et vers le bas pour déployer le plexus et le diaphragme.",
            en: "Sternal opening — Roll shoulders back and down to expand the solar plexus and diaphragm.",
          },
        },
        {
          text: "Reset oculaire vagal — Sans tourner la tête, porte le regard à l'extrême droite 30s puis à gauche jusqu'au soupir.",
          text_i18n: {
            fr: "Reset oculaire vagal — Sans tourner la tête, porte le regard à l'extrême droite 30s puis à gauche jusqu'au soupir.",
            en: "Ocular vagal reset — Keeping the head still, look far right for 30s then far left until a sigh occurs.",
          },
        },
      ],
      duration_sec: 180,
    },
    ["instructions"],
    "micro",
    { accent: "hsl(35 80% 58%)", hero: "pulse" },
  ),
  nativeExercise(
    "shake_release",
    "Décharge Neuro-Musculaire Adrénergique",
    "Adrenergic Neuro-Muscular Discharge",
    "body",
    "zap",
    "Évacuation somatique rapide du cortisol et du tremblement sympathique contenu après un choc.",
    "Rapid somatic evacuation of cortisol and contained sympathetic tremor after shock.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "sympathetic_discharge",
      resistance_fallback_sec: 45,
      instructions:
        "Debout, genoux déverrouillés, laisse un tremblement volontaire traverser les mains, les épaules et le bassin pendant 90s pour purger la charge sympathique.",
      instructions_i18n: {
        fr: "Debout, genoux déverrouillés, laisse un tremblement volontaire traverser les mains, les épaules et le bassin pendant 90s pour purger la charge sympathique.",
        en: "Standing with unlocked knees, let a deliberate tremor travel through hands, shoulders, and pelvis for 90s to purge sympathetic charge.",
      },
      duration_sec: 90,
    },
    ["instructions"],
    "micro",
    { accent: "hsl(0 65% 55%)", hero: "shake" },
  ),
  nativeExercise(
    "progressive_relax",
    "Relâchement Neuromusculaire par Contraste",
    "Contrast Neuromuscular Release",
    "body",
    "scan",
    "Saturation volontaire puis relâchement des chaînes musculaires sous tension défensive.",
    "Deliberate saturation then release of muscle chains held in defensive tension.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "contrast_neuromuscular_release",
      resistance_fallback_sec: 60,
      instructions:
        "Contracte chaque segment à 70 % pendant 5 secondes à l'inspiration, puis relâche intégralement sur 10 secondes d'expiration.",
      instructions_i18n: {
        fr: "Contracte chaque segment à 70 % pendant 5 secondes à l'inspiration, puis relâche intégralement sur 10 secondes d'expiration.",
        en: "Contract each segment at 70% for 5 seconds on inhale, then release completely over 10 seconds of exhale.",
      },
      steps: [
        {
          text: "Poings & Avant-bras — Serre pour matérialiser la volonté de contrôle, puis ouvre les paumes en lâchant prise.",
          text_i18n: {
            fr: "Poings & Avant-bras — Serre pour matérialiser la volonté de contrôle, puis ouvre les paumes en lâchant prise.",
            en: "Fists & Forearms — Clench to materialize control grip, then open palms in complete release.",
          },
        },
        {
          text: "Trapèzes & Nuque — Monte les épaules vers les oreilles 5s, puis laisse-les tomber lourdement.",
          text_i18n: {
            fr: "Trapèzes & Nuque — Monte les épaules vers les oreilles 5s, puis laisse-les tomber lourdement.",
            en: "Trapezius & Neck — Lift shoulders toward ears for 5s, then let them drop heavily.",
          },
        },
        {
          text: "Bassin & Quadriceps — Verrouille les appuis au sol 5s, puis dissous toute rigidité résiduelle.",
          text_i18n: {
            fr: "Bassin & Quadriceps — Verrouille les appuis au sol 5s, puis dissous toute rigidité résiduelle.",
            en: "Pelvis & Quads — Lock ground support for 5s, then dissolve all residual rigidity.",
          },
        },
      ],
    },
    ["instructions"],
    "body_scan",
    { accent: "hsl(176 70% 48%)" },
  ),
  nativeExercise(
    "walking_meditation",
    "Marche de Décantation Stratégique",
    "Strategic Decantation Walk",
    "body",
    "footprints",
    "Marche cadencée sans écran avec vision panoramique pour débloquer un arbitrage complexe.",
    "Screen-free cadenced walk with panoramic vision to unlock complex arbitration.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "decision_log",
      mechanism_tag: "optic_flow_decantation",
      resistance_fallback_sec: 90,
      instructions:
        "Marche sans téléphone pendant 5 minutes en maintenant un regard panoramique (flux optique horizontal) qui désactive l'amygdale.",
      instructions_i18n: {
        fr: "Marche sans téléphone pendant 5 minutes en maintenant un regard panoramique (flux optique horizontal) qui désactive l'amygdale.",
        en: "Walk without your phone for 5 minutes while holding a panoramic gaze (horizontal optic flow) that deactivates the amygdala.",
      },
      duration_sec: 300,
    },
    ["instructions"],
    "micro",
    { accent: "hsl(160 50% 45%)", hero: "steps" },
  ),
  nativeExercise(
    "cold_exposure_prep",
    "Ancrage Thermique & Réflexe d'Immersion",
    "Thermal Anchor & Dive Reflex",
    "body",
    "snowflake",
    "Activation du réflexe d'immersion des mammifères pour ralentir instantanément la fréquence cardiaque.",
    "Mammalian dive reflex activation to instantaneously slow heart rate.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "mammalian_dive_reflex",
      resistance_fallback_sec: 60,
      duration_sec: 120,
      instructions:
        "Utilise le choc thermique froid sur le visage ou les poignets tout en maintenant une expiration lente pour dominer le réflexe de sursaut.",
      instructions_i18n: {
        fr: "Utilise le choc thermique froid sur le visage ou les poignets tout en maintenant une expiration lente pour dominer le réflexe de sursaut.",
        en: "Apply cold thermal stimulus to the face or wrists while maintaining a slow exhale to master the gasp reflex.",
      },
      steps: [
        {
          text: "Stabilisation pré-contact — 3 expirations longues avant d'appliquer le froid.",
          text_i18n: {
            fr: "Stabilisation pré-contact — 3 expirations longues avant d'appliquer le froid.",
            en: "Pre-contact stabilization — 3 long exhales before applying cold.",
          },
        },
        {
          text: "Immersion faciale ou poignets — Applique l'eau froide 30s sur les zones trigéminales en gardant la mâchoire souple.",
          text_i18n: {
            fr: "Immersion faciale ou poignets — Applique l'eau froide 30s sur les zones trigéminales en gardant la mâchoire souple.",
            en: "Facial or wrist immersion — Apply cold water for 30s to trigeminal zones while keeping the jaw soft.",
          },
        },
        {
          text: "Verrouillage du calme — Observe la chute immédiate du pouls et la clarté corticale retrouvée.",
          text_i18n: {
            fr: "Verrouillage du calme — Observe la chute immédiate du pouls et la clarté corticale retrouvée.",
            en: "Calm lock — Observe the immediate drop in pulse and restored cortical clarity.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(200 70% 55%)", hero: "orbit" },
  ),
  nativeExercise(
    "posture_reset",
    "Alignement Postural de Souveraineté (3 Axes)",
    "Sovereign Postural Alignment (3 Axes)",
    "body",
    "align-center",
    "Réinitialisation de la verticalité gravitaire avant prise de parole ou arbitrage.",
    "Gravitational verticality reset before speaking or arbitrating.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "gravitational_axis_reset",
      resistance_fallback_sec: 60,
      instructions:
        "Réaligne les 3 centres physiques (bassin, thorax, crâne) en 2 minutes pour incarner une autorité sans raideur.",
      instructions_i18n: {
        fr: "Réaligne les 3 centres physiques (bassin, thorax, crâne) en 2 minutes pour incarner une autorité sans raideur.",
        en: "Realign the 3 physical centers (pelvis, thorax, skull) in 2 minutes to embody authority without stiffness.",
      },
      steps: [
        {
          text: "Socle pelvien — Répartis le poids 50/50 sur les deux ischions ou talons, sans croiser les jambes.",
          text_i18n: {
            fr: "Socle pelvien — Répartis le poids 50/50 sur les deux ischions ou talons, sans croiser les jambes.",
            en: "Pelvic base — Distribute weight 50/50 across both sit-bones or heels, uncrossing legs.",
          },
        },
        {
          text: "Ouverture thoracique — Déploie le sternum vers l'avant sans hausser les épaules.",
          text_i18n: {
            fr: "Ouverture thoracique — Déploie le sternum vers l'avant sans hausser les épaules.",
            en: "Thoracic expansion — Open the sternum forward without lifting shoulders.",
          },
        },
        {
          text: "Couronne occipitale — Étire le sommet du crâne vers le haut et pose un regard horizontal stable.",
          text_i18n: {
            fr: "Couronne occipitale — Étire le sommet du crâne vers le haut et pose un regard horizontal stable.",
            en: "Occipital crown — Lengthen the crown upward and set a steady horizontal gaze.",
          },
        },
      ],
      duration_sec: 120,
    },
    ["instructions"],
    "micro",
    { accent: "hsl(176 70% 48%)", hero: "steps" },
  ),
  nativeExercise(
    "energy_activation",
    "Sortie du Figement Dorsal (Allumage Vagal)",
    "Dorsal Freeze Exit (Vagal Ignition)",
    "body",
    "activity",
    "Mobilisation ascendante contrôlée pour sortir de l'inertie, du brouillard ou de la procrastination lourde.",
    "Controlled upward mobilization to exit inertia, brain fog, or heavy procrastination.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "daily_posture",
      mechanism_tag: "dorsal_freeze_exit",
      resistance_fallback_sec: 90,
      duration_sec: 180,
      instructions:
        "Remonte l'échelle autonome de l'hypo-activation dorsale vers l'engagement ventral en 3 paliers progressifs.",
      instructions_i18n: {
        fr: "Remonte l'échelle autonome de l'hypo-activation dorsale vers l'engagement ventral en 3 paliers progressifs.",
        en: "Climb the autonomic ladder from dorsal hypo-arousal back to ventral engagement in 3 progressive stages.",
      },
      steps: [
        {
          text: "Allumage périphérique — Frictionne vigoureusement les paumes et tapote le sternum pendant 30s.",
          text_i18n: {
            fr: "Allumage périphérique — Frictionne vigoureusement les paumes et tapote le sternum pendant 30s.",
            en: "Peripheral ignition — Rub palms vigorously and tap the sternum for 30s.",
          },
        },
        {
          text: "Ventilation ascendante — 5 inspirations nasales dynamiques avec ouverture des bras.",
          text_i18n: {
            fr: "Ventilation ascendante — 5 inspirations nasales dynamiques avec ouverture des bras.",
            en: "Upward ventilation — 5 dynamic nasal inhales with arm expansion.",
          },
        },
        {
          text: "Premier acte irréversible — Exécute dans les 60s la première micro-action physique du dossier bloqué.",
          text_i18n: {
            fr: "Premier acte irréversible — Exécute dans les 60s la première micro-action physique du dossier bloqué.",
            en: "First irreversible act — Execute within 60s the first physical micro-action on the stalled file.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(45 90% 55%)", hero: "flame" },
  ),
  nativeExercise(
    "safe_place",
    "Sanctuaire Cortical & Chambre d'Isolement",
    "Cortical Sanctuary & Isolation Chamber",
    "attention",
    "mountain",
    "Instaurer une chambre de décompression interne étanche aux pressions et urgences externes.",
    "Establish an internal decompression chamber sealed off from external pressures and urgencies.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "cortical_sanctuary",
      resistance_fallback_sec: 90,
      instructions:
        "Érige mentalement ton poste de commandement inaltérable : aucune sollicitation extérieure n'y entre sans ton autorisation explicite.",
      instructions_i18n: {
        fr: "Érige mentalement ton poste de commandement inaltérable : aucune sollicitation extérieure n'y entre sans ton autorisation explicite.",
        en: "Mentally erect your unshakeable command post: no external demand enters without your explicit authorization.",
      },
      duration_sec: 240,
    },
    ["instructions"],
    "visualization",
    { accent: "hsl(220 70% 60%)" },
  ),
  nativeExercise(
    "open_monitoring",
    "Radar de Sécurité Neuroceptif",
    "Neuroceptive Safety Radar",
    "attention",
    "eye",
    "Ré-ancrage sensoriel de l'attention dans l'environnement immédiat pour désactiver l'alerte sous-corticale.",
    "Sensory re-anchoring of attention in the immediate environment to deactivate subcortical alarm.",
    {
      tier: "beginner",
      pillar: "homeostasie_nerveuse",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "neuroceptive_radar_54321",
      resistance_fallback_sec: 60,
      instructions:
        "Bascule du tunnel mental au radar périphérique : scanne 5 repères visuels, 4 points d'appui tactiles, 3 sons distants, 2 flux respiratoires, 1 axe postural.",
      instructions_i18n: {
        fr: "Bascule du tunnel mental au radar périphérique : scanne 5 repères visuels, 4 points d'appui tactiles, 3 sons distants, 2 flux respiratoires, 1 axe postural.",
        en: "Shift from mental tunnel to peripheral radar: scan 5 visual markers, 4 tactile contact points, 3 distant sounds, 2 breath flows, 1 postural axis.",
      },
      duration_sec: 180,
    },
    ["instructions"],
    "visualization",
    { accent: "hsl(270 50% 60%)" },
  ),
  nativeExercise(
    "journal_stream",
    "Vidange de Mémoire Vive (RAM Exécutive)",
    "Working Memory Flush (Executive RAM)",
    "journal",
    "pen-line",
    "Extraction continue de la charge cognitive résiduelle avant un arbitrage majeur.",
    "Continuous extraction of residual cognitive load before a major arbitration.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "decision_log",
      mechanism_tag: "executive_ram_flush",
      resistance_fallback_sec: 90,
      instructions:
        "Écris sans lever le stylo ni éditer pendant 5 minutes pour vider le tampon émotionnel et isoler le vrai nœud décisionnel.",
      instructions_i18n: {
        fr: "Écris sans lever le stylo ni éditer pendant 5 minutes pour vider le tampon émotionnel et isoler le vrai nœud décisionnel.",
        en: "Write continuously without editing for 5 minutes to flush the emotional buffer and isolate the true decision knot.",
      },
      duration_sec: 300,
    },
    ["instructions"],
    "journal_timed",
    { accent: "hsl(220 70% 60%)", hero: "ink" },
  ),
  nativeExercise(
    "gratitude_triple",
    "Audit des Appuis Souverains (Actifs Réels)",
    "Sovereign Leverage Audit (Real Assets)",
    "journal",
    "heart",
    "Identifier 3 leviers ou alliances solides déjà acquis pour couper l'illusion de manque.",
    "Identify 3 solid levers or alliances already secured to cut through scarcity illusion.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "sovereign_assets_audit",
      instructions:
        "Identifie 3 actifs tangibles, compétences ou alliances solides sur lesquels ton autorité repose aujourd'hui.",
      instructions_i18n: {
        fr: "Identifie 3 actifs tangibles, compétences ou alliances solides sur lesquels ton autorité repose aujourd'hui.",
        en: "Identify 3 tangible assets, capabilities, or solid alliances on which your authority rests today.",
      },
      entries_count: 3,
    },
    ["instructions"],
    "gratitude",
  ),
  nativeExercise(
    "worry_dump",
    "Purge du Ratio Information / Action",
    "Information / Action Ratio Purge",
    "journal",
    "cloud-rain",
    "Lister les boucles mentales ouvertes et éliminer tout ce sur quoi tu n'as aucun levier d'action dans les 24h.",
    "List open mental loops and eliminate everything over which you have no action lever within 24h.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "daily_posture",
      mechanism_tag: "info_action_purge",
      resistance_fallback_sec: 90,
      duration_sec: 180,
      instructions:
        "Ferme les onglets cognitifs parasites en filtrant chaque préoccupation par ton levier réel à 24 heures.",
      instructions_i18n: {
        fr: "Ferme les onglets cognitifs parasites en filtrant chaque préoccupation par ton levier réel à 24 heures.",
        en: "Close parasitic cognitive tabs by filtering every concern through your real 24-hour action lever.",
      },
      steps: [
        {
          text: "Extraction brute — Dépose toutes les boucles mentales ouvertes qui consomment ta mémoire de travail.",
          text_i18n: {
            fr: "Extraction brute — Dépose toutes les boucles mentales ouvertes qui consomment ta mémoire de travail.",
            en: "Raw extraction — Dump all open mental loops consuming your working memory.",
          },
        },
        {
          text: "Couper le hors-levier — Raye impitoyablement tout sujet sur lequel tu n'as aucune action directe dans les 24h.",
          text_i18n: {
            fr: "Couper le hors-levier — Raye impitoyablement tout sujet sur lequel tu n'as aucune action directe dans les 24h.",
            en: "Cut non-actionables — Ruthlessly cross out any topic where you have no direct action within 24h.",
          },
        },
        {
          text: "Verrouiller 1 acte — Sélectionne l'unique levier concret restant et assigne-lui un créneau d'exécution.",
          text_i18n: {
            fr: "Verrouiller 1 acte — Sélectionne l'unique levier concret restant et assigne-lui un créneau d'exécution.",
            en: "Lock 1 act — Select the single remaining concrete lever and assign it an execution slot.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(220 55% 55%)", hero: "ink" },
  ),
  nativeExercise(
    "letter_unsent",
    "Purge de Contrat Implicite Non-Dit",
    "Unspoken Implicit Contract Purge",
    "journal",
    "mail",
    "Écrire sans filtre ce qui n'a pas été dit dans une relation professionnelle ou personnelle pour vider la charge émotionnelle avant d'agir froidement.",
    "Write unfiltered what went unsaid in a professional or personal relationship to drain emotional charge before acting coldly.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "implicit_contract_purge",
      resistance_fallback_sec: 90,
      instructions:
        "Écris sans censure tout le ressentiment, la déception ou la dette implicite envers cet interlocuteur afin de purger la charge astrale avant de négocier à froid.",
      instructions_i18n: {
        fr: "Écris sans censure tout le ressentiment, la déception ou la dette implicite envers cet interlocuteur afin de purger la charge astrale avant de négocier à froid.",
        en: "Write uncensored all resentment, disappointment, or implicit debt toward this person to purge emotional charge before negotiating cold.",
      },
      duration_sec: 300,
    },
    ["instructions"],
    "journal_timed",
    { accent: "hsl(0 55% 55%)", hero: "ink" },
  ),
  nativeExercise(
    "dialogue_parts",
    "Arbitrage Ombre vs Souverain (Dialogue Interne)",
    "Shadow vs Sovereign Arbitration (Inner Dialogue)",
    "journal",
    "messages-square",
    "Donner la parole à la réaction défensive (Saboteur/Victime) puis laisser trancher le Souverain.",
    "Give voice to the defensive reaction (Saboteur/Victim) then let the Sovereign arbitrate.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "shadow_sovereign_arbitration",
      instructions:
        "Exprime d'abord la revendication brute de la part défensive, puis réponds depuis l'axe calme et stratégique du Souverain.",
      instructions_i18n: {
        fr: "Exprime d'abord la revendication brute de la part défensive, puis réponds depuis l'axe calme et stratégique du Souverain.",
        en: "First express the raw claim of the defensive part, then respond from the calm strategic axis of the Sovereign.",
      },
      fields: ["Voix Défensive (Ombre)", "Arbitrage du Souverain"],
    },
    ["instructions"],
    "dialogue_parts",
    { accent: "hsl(220 70% 60%)" },
  ),
  nativeExercise(
    "evening_review",
    "Clôture de Journal Décisionnel & Décharge",
    "Decision Log Closure & Offload",
    "journal",
    "moon",
    "Audit froid de fin de journée : faits tranchés, fuite d'énergie détectée, trajectoire J+1.",
    "Cold end-of-day audit: decisions made, energy leak detected, D+1 trajectory.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "evening_ledger_closure",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Ferme proprement la session exécutive du jour en 3 points factuels pour libérer le sommeil de toute rumination.",
      instructions_i18n: {
        fr: "Ferme proprement la session exécutive du jour en 3 points factuels pour libérer le sommeil de toute rumination.",
        en: "Cleanly close today's executive session in 3 factual points to free sleep from rumination.",
      },
      steps: [
        {
          text: "Fait accompli — Quel arbitrage ou livrable réel a été verrouillé aujourd'hui ?",
          text_i18n: {
            fr: "Fait accompli — Quel arbitrage ou livrable réel a été verrouillé aujourd'hui ?",
            en: "Accomplished fact — Which real arbitration or deliverable was locked in today?",
          },
        },
        {
          text: "Fuite détectée — Où as-tu cédé de la bande passante au Saboteur ou au Prostitué ?",
          text_i18n: {
            fr: "Fuite détectée — Où as-tu cédé de la bande passante au Saboteur ou au Prostitué ?",
            en: "Detected leak — Where did you yield bandwidth to the Saboteur or Prostitute?",
          },
        },
        {
          text: "Vecteur J+1 — Quelle est l'unique priorité non-négociable de demain matin ?",
          text_i18n: {
            fr: "Vecteur J+1 — Quelle est l'unique priorité non-négociable de demain matin ?",
            en: "D+1 vector — What is tomorrow morning's single non-negotiable priority?",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(250 45% 55%)", hero: "ink" },
  ),
  nativeExercise(
    "morning_pages",
    "Séparation Temps-Horloge vs Temps-Psychologique",
    "Clock-Time vs Psychological-Time Separation",
    "journal",
    "notebook-pen",
    "Vider le film mental au réveil pour ne garder que l'action factuelle du jour.",
    "Empty the mental movie upon waking to retain only the factual action of the day.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "daily_posture",
      mechanism_tag: "clock_vs_psychological_time",
      resistance_fallback_sec: 90,
      instructions:
        "Décharge sur la page toute anticipation anxieuse ou nostalgie (Temps-Psychologique) jusqu'à ce qu'il ne reste que les coordonnées objectives d'aujourd'hui (Temps-Horloge).",
      instructions_i18n: {
        fr: "Décharge sur la page toute anticipation anxieuse ou nostalgie (Temps-Psychologique) jusqu'à ce qu'il ne reste que les coordonnées objectives d'aujourd'hui (Temps-Horloge).",
        en: "Offload onto the page any anxious anticipation or regret (Psychological-Time) until only today's objective coordinates (Clock-Time) remain.",
      },
      duration_sec: 300,
    },
    ["instructions"],
    "journal_timed",
    { accent: "hsl(45 70% 55%)", hero: "ink" },
  ),
  nativeExercise(
    "intention_morning",
    "Attracteur Exécutif Matinal",
    "Morning Executive Attractor",
    "intentionality",
    "sunrise",
    "Poser le commandement postural qui gouvernera la journée avant l'ouverture des flux.",
    "Set the postural command that will govern the day before opening incoming feeds.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "daily_posture",
      mechanism_tag: "morning_attractor",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Formule en une ligne sobre la posture décisionnelle que tu maintiendras face aux frictions du jour.",
      instructions_i18n: {
        fr: "Formule en une ligne sobre la posture décisionnelle que tu maintiendras face aux frictions du jour.",
        en: "Formulate in one sober line the decision posture you will hold against today's frictions.",
      },
      fields: ["Attracteur du jour"],
    },
    ["instructions"],
    "intention",
    { accent: "hsl(45 90% 55%)" },
  ),
  nativeExercise(
    "intention_week",
    "Architecture Hebdomadaire & 3 Leviers Souverains",
    "Weekly Architecture & 3 Sovereign Levers",
    "intentionality",
    "calendar-days",
    "Définir l'attracteur de la semaine et les 3 décisions structurantes à fort levier.",
    "Define the weekly attractor and the 3 high-leverage structuring decisions.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "weekly_sovereign_levers",
      resistance_fallback_sec: 90,
      duration_sec: 240,
      instructions:
        "Verrouille le cap stratégique de la semaine et les 3 livrables qui rendent tout le reste secondaire.",
      instructions_i18n: {
        fr: "Verrouille le cap stratégique de la semaine et les 3 livrables qui rendent tout le reste secondaire.",
        en: "Lock in the week's strategic heading and the 3 deliverables that make everything else secondary.",
      },
      fields: ["Attracteur Hebdomadaire", "Levier 1", "Levier 2", "Levier 3"],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(270 50% 60%)", hero: "steps" },
  ),
  nativeExercise(
    "ritual_sequence",
    "Séquence de Sanctuarisation de Bande Passante",
    "Bandwidth Sanctuarization Sequence",
    "intentionality",
    "list-checks",
    "Protocole de démarrage en 3 verrous pour protéger le cortex préfrontal du bruit entrant.",
    "3-lock startup protocol to shield the prefrontal cortex from incoming noise.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "daily_posture",
      mechanism_tag: "bandwidth_sanctuarization",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Exécute et valide chaque verrou dans l'ordre avant d'autoriser toute interaction externe.",
      instructions_i18n: {
        fr: "Exécute et valide chaque verrou dans l'ordre avant d'autoriser toute interaction externe.",
        en: "Execute and validate each lock in order before authorizing any external interaction.",
      },
      steps: [
        {
          text: "Verrou Physiologique — Hydratation et 3 cycles de frein vagal pour stabiliser le tonus autonome.",
          text_i18n: {
            fr: "Verrou Physiologique — Hydratation et 3 cycles de frein vagal pour stabiliser le tonus autonome.",
            en: "Physiological Lock — Hydration and 3 vagal brake cycles to stabilize autonomic tone.",
          },
        },
        {
          text: "Verrou d'Interface — Mode avion ou coupure totale des notifications pendant le premier bloc.",
          text_i18n: {
            fr: "Verrou d'Interface — Mode avion ou coupure totale des notifications pendant le premier bloc.",
            en: "Interface Lock — Airplane mode or full notification cutoff during the first block.",
          },
        },
        {
          text: "Verrou Décisionnel — Énoncer l'unique dossier stratégique traité durant les 60 prochaines minutes.",
          text_i18n: {
            fr: "Verrou Décisionnel — Énoncer l'unique dossier stratégique traité durant les 60 prochaines minutes.",
            en: "Decision Lock — State the single strategic file handled during the next 60 minutes.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(270 50% 60%)", hero: "steps" },
  ),
  nativeExercise(
    "habit_checkbox",
    "Verrouillage de Ligne Rouge Non-Négociable",
    "Non-Negotiable Red Line Lock",
    "intentionality",
    "check-square",
    "Exécuter le 1er geste souverain du jour avant d'ouvrir les flux entrants.",
    "Execute the first sovereign act of the day before opening incoming feeds.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "daily_posture",
      mechanism_tag: "red_line_lock",
      resistance_fallback_sec: 60,
      duration_sec: 120,
      instructions:
        "Avant toute ouverture d'écran ou de messagerie, verrouille ta ligne rouge posturale et décisionnelle du jour.",
      instructions_i18n: {
        fr: "Avant toute ouverture d'écran ou de messagerie, verrouille ta ligne rouge posturale et décisionnelle du jour.",
        en: "Before opening any screen or inbox, lock in your postural and decision red line for the day.",
      },
      habit_name: "Ligne rouge non-négociable verrouillée avant les flux",
      steps: [
        {
          text: "Silence des flux entrants — Aucun écran ni notification consulté avant cet ancrage.",
          text_i18n: {
            fr: "Silence des flux entrants — Aucun écran ni notification consulté avant cet ancrage.",
            en: "Incoming feed silence — No screen or notification checked before this anchor.",
          },
        },
        {
          text: "Ligne rouge du jour — Nomme la frontière non-négociable que tu ne franchiras sous aucune pression aujourd'hui.",
          text_i18n: {
            fr: "Ligne rouge du jour — Nomme la frontière non-négociable que tu ne franchiras sous aucune pression aujourd'hui.",
            en: "Daily red line — Name the non-negotiable boundary you will not cross under any pressure today.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(176 70% 48%)", hero: "pulse" },
  ),
  nativeExercise(
    "affirmations_cycle",
    "Cycle de Désidentification & Posture Souveraine",
    "Disidentification & Sovereign Posture Cycle",
    "cognitive",
    "stars",
    "Séquence rythmée de décrets opératifs pour désamorcer l'identification aux récits de survie.",
    "Paced sequence of operative decrees to defuse identification with survival narratives.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "daily_posture",
      mechanism_tag: "disidentification_cycle",
      resistance_fallback_sec: 60,
      instructions:
        "Prononce intérieurement chaque décret sur l'expiration en relâchant toute contraction défensive.",
      instructions_i18n: {
        fr: "Prononce intérieurement chaque décret sur l'expiration en relâchant toute contraction défensive.",
        en: "Speak each decree inwardly on the exhale while releasing all defensive contraction.",
      },
      duration_min: 3,
      affirmations: [
        "Je décide à partir de la clarté, non de l'urgence.",
        "Je choisis la clarté avant la réaction.",
        "Ma présence est mon ancrage.",
      ],
      affirmations_i18n: {
        fr: [
          "Je décide à partir de la clarté, non de l'urgence.",
          "Je choisis la clarté avant la réaction.",
          "Ma présence est mon ancrage.",
        ],
        en: [
          "I decide from clarity, not urgency.",
          "I choose clarity before reaction.",
          "My presence is my anchor.",
        ],
      },
    },
    ["instructions", "duration_min", "affirmations"],
    "affirmations",
  ),
  nativeExercise(
    "belief_reframe",
    "Déconstruction d'Icône (Fait Brut vs Scénario de Survie)",
    "Icon Deconstruction (Raw Fact vs Survival Story)",
    "cognitive",
    "brain",
    "Séparer la réalité vérifiable par caméra de l'interprétation dramatique générée par l'interface.",
    "Separate camera-verifiable reality from the dramatic interpretation generated by the interface.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "decision_log",
      mechanism_tag: "icon_deconstruction",
      resistance_fallback_sec: 90,
      duration_sec: 180,
      instructions:
        "Sépare chirurgicalement la donnée objective du film de survie projeté par ton interface cognitive.",
      instructions_i18n: {
        fr: "Sépare chirurgicalement la donnée objective du film de survie projeté par ton interface cognitive.",
        en: "Surgically separate objective data from the survival movie projected by your cognitive interface.",
      },
      steps: [
        {
          text: "L'Icône de Survie — Écris ou nomme l'interprétation dramatique immédiate (« Il veut me nuire », « Tout va s'effondrer »).",
          text_i18n: {
            fr: "L'Icône de Survie — Écris ou nomme l'interprétation dramatique immédiate (« Il veut me nuire », « Tout va s'effondrer »).",
            en: "The Survival Icon — State the immediate dramatic interpretation ('They want to harm me', 'Everything will collapse').",
          },
        },
        {
          text: "Le Fait Caméra — Réduis la situation à ce qu'une caméra neutre aurait enregistré, sans adjectif ni intention supposée.",
          text_i18n: {
            fr: "Le Fait Caméra — Réduis la situation à ce qu'une caméra neutre aurait enregistré, sans adjectif ni intention supposée.",
            en: "The Camera Fact — Reduce the situation to what a neutral camera would have recorded, with no adjectives or assumed intent.",
          },
        },
        {
          text: "Réponse Opérative — Formule l'unique action proportionnée au Fait Caméra, purgée de toute réaction défensive.",
          text_i18n: {
            fr: "Réponse Opérative — Formule l'unique action proportionnée au Fait Caméra, purgée de toute réaction défensive.",
            en: "Operative Response — Formulate the single action proportional to the Camera Fact, purged of defensive reaction.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(270 50% 60%)", hero: "spark" },
  ),
  nativeExercise(
    "if_then_plan",
    "Protocole d'Interception Si / Alors (Anti-Détournement)",
    "If / Then Interception Protocol (Anti-Hijack)",
    "cognitive",
    "git-branch-plus",
    "Programmer à froid la réponse opérative exacte face à un déclencheur d'ombre connu.",
    "Pre-program in cold blood the exact operative response to a known shadow trigger.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "if_then_interception",
      resistance_fallback_sec: 60,
      duration_sec: 150,
      instructions:
        "Pré-programme ta réponse souveraine avant d'entrer dans la zone de friction pour ne pas dépendre de ta volonté sous stress.",
      instructions_i18n: {
        fr: "Pré-programme ta réponse souveraine avant d'entrer dans la zone de friction pour ne pas dépendre de ta volonté sous stress.",
        en: "Pre-program your sovereign response before entering the friction zone so you do not rely on willpower under stress.",
      },
      steps: [
        {
          text: "SI (Signal de Déclenchement) — Identifie le stimulus précis qui active habituellement ton Saboteur ou ton Prostitué.",
          text_i18n: {
            fr: "SI (Signal de Déclenchement) — Identifie le stimulus précis qui active habituellement ton Saboteur ou ton Prostitué.",
            en: "IF (Trigger Signal) — Identify the exact stimulus that usually activates your Saboteur or Prostitute.",
          },
        },
        {
          text: "ALORS (Manœuvre Souveraine) — Définis le geste physique et la phrase sobre que tu exécuteras immédiatement.",
          text_i18n: {
            fr: "ALORS (Manœuvre Souveraine) — Définis le geste physique et la phrase sobre que tu exécuteras immédiatement.",
            en: "THEN (Sovereign Maneuver) — Define the physical gesture and sober phrase you will execute immediately.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(176 70% 48%)", hero: "steps" },
  ),
  nativeExercise(
    "decision_matrix",
    "Synthèse du 3e Pilier (Hors Faux Dilemme)",
    "Third-Pillar Synthesis (Beyond False Dilemma)",
    "cognitive",
    "table",
    "Sortir du piège binaire A vs B en faisant émerger la 3e voie souveraine alignée sur les lignes rouges.",
    "Break out of the binary A vs B trap by surfacing the sovereign 3rd path aligned with red lines.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "third_pillar_synthesis",
      instructions:
        "Expose les deux options apparentes du faux dilemme, puis définis la Ligne Rouge qui ouvre la 3e voie.",
      instructions_i18n: {
        fr: "Expose les deux options apparentes du faux dilemme, puis définis la Ligne Rouge qui ouvre la 3e voie.",
        en: "Expose the two apparent options of the false dilemma, then define the Red Line that opens the 3rd path.",
      },
      fields: ["Option A (Impulsion)", "Option B (Compromis)", "3e Pilier Souverain (Ligne Rouge)"],
    },
    ["instructions"],
    "decision_matrix",
    { accent: "hsl(35 80% 58%)" },
  ),
  nativeExercise(
    "stop_rumination",
    "Coupe-Circuit de Boucle Corticale",
    "Cortical Loop Circuit Breaker",
    "cognitive",
    "circle-stop",
    "Interrompre immédiatement une boucle de rumination stérile et restaurer l'action factuelle.",
    "Immediately interrupt a sterile rumination loop and restore factual action.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "vortex_emergency",
      mechanism_tag: "cortical_loop_breaker",
      resistance_fallback_sec: 60,
      instructions:
        "Coupe la boucle narrative stérile en 3 temps et bascule sur un acte physique immédiat.",
      instructions_i18n: {
        fr: "Coupe la boucle narrative stérile en 3 temps et bascule sur un acte physique immédiat.",
        en: "Cut the sterile narrative loop in 3 steps and shift to an immediate physical act.",
      },
      duration_sec: 120,
      steps: [
        {
          text: "Nommer l'illusion — Reconnais que ce scénario tourne à vide sans produire de donnée nouvelle.",
          text_i18n: {
            fr: "Nommer l'illusion — Reconnais que ce scénario tourne à vide sans produire de donnée nouvelle.",
            en: "Name the illusion — Recognize that this scenario is spinning idle without producing new data.",
          },
        },
        {
          text: "Purger par l'expiration — 3 expirations lentes en abaissant les épaules.",
          text_i18n: {
            fr: "Purger par l'expiration — 3 expirations lentes en abaissant les épaules.",
            en: "Purge via exhale — 3 slow exhales while dropping the shoulders.",
          },
        },
        {
          text: "Acte factuel — Exécute une action concrète vérifiable dans les 2 minutes.",
          text_i18n: {
            fr: "Acte factuel — Exécute une action concrète vérifiable dans les 2 minutes.",
            en: "Factual act — Execute one verifiable concrete action within 2 minutes.",
          },
        },
      ],
    },
    ["instructions"],
    "stop_protocol",
  ),
  nativeExercise(
    "archetype_mirror",
    "Interception d'Archétype en Régime de Survie",
    "Survival-Mode Archetype Interception",
    "myss",
    "sparkles",
    "Identifier quel archétype de survie (Saboteur, Prostitué, Victime, Enfant) tente de dicter la décision.",
    "Identify which survival archetype (Saboteur, Prostitute, Victim, Child) is trying to dictate the decision.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "survival_archetype_interception",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Démasque la sous-personnalité défensive active avant qu'elle ne signe un contrat ou n'envoie une réponse réactive.",
      instructions_i18n: {
        fr: "Démasque la sous-personnalité défensive active avant qu'elle ne signe un contrat ou n'envoie une réponse réactive.",
        en: "Unmask the active defensive sub-personality before it signs a contract or sends a reactive reply.",
      },
      steps: [
        {
          text: "Identifier la figure — Est-ce le Saboteur (contrôle/méfiance), le Prostitué (complaisance/sécurité), la Victime (plainte) ou l'Enfant (impulsion) ?",
          text_i18n: {
            fr: "Identifier la figure — Est-ce le Saboteur (contrôle/méfiance), le Prostitué (complaisance/sécurité), la Victime (plainte) ou l'Enfant (impulsion) ?",
            en: "Identify the figure — Is it the Saboteur (control/mistrust), Prostitute (compliance/safety), Victim (complaint), or Child (impulse)?",
          },
        },
        {
          text: "Isoler le bénéfice caché — Quelle peur immédiate cette figure essaie-t-elle d'éviter à tout prix ?",
          text_i18n: {
            fr: "Isoler le bénéfice caché — Quelle peur immédiate cette figure essaie-t-elle d'éviter à tout prix ?",
            en: "Isolate the hidden payoff — What immediate fear is this figure trying to avoid at all costs?",
          },
        },
        {
          text: "Reprendre le siège — Quelle décision prendrait le Souverain s'il n'avait rien à prouver ni à protéger ?",
          text_i18n: {
            fr: "Reprendre le siège — Quelle décision prendrait le Souverain s'il n'avait rien à prouver ni à protéger ?",
            en: "Reclaim the seat — What decision would the Sovereign make with nothing to prove or protect?",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(35 80% 58%)", hero: "spark" },
  ),
  nativeExercise(
    "shadow_checkin",
    "Télémétrie d'Activation d'Ombre",
    "Shadow Activation Telemetry",
    "myss",
    "moon-star",
    "Mesurer l'indice de charge d'une ombre active (0-10) et isoler son déclencheur exact.",
    "Measure active shadow charge index (0-10) and isolate its exact trigger.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "shadow_telemetry",
      instructions:
        "Quantifie froidement l'intensité de la charge d'ombre pour transformer la réaction aveugle en donnée d'observation.",
      instructions_i18n: {
        fr: "Quantifie froidement l'intensité de la charge d'ombre pour transformer la réaction aveugle en donnée d'observation.",
        en: "Coldly quantify shadow charge intensity to turn blind reaction into observation data.",
      },
      fields: ["Ombre active", "Intensité (0-10)", "Déclencheur factuel"],
    },
    ["instructions"],
    "shadow_checkin",
    { accent: "hsl(270 40% 45%)" },
  ),
  nativeExercise(
    "light_quality_practice",
    "Bascule Ombre → Souveraineté Opérative",
    "Shadow-to-Sovereign Operative Shift",
    "myss",
    "sun",
    "Convertir la tension d'un réflexe défensif en posture d'autorité calme et chirurgicale.",
    "Convert defensive reflex tension into a posture of calm surgical authority.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "daily_posture",
      mechanism_tag: "shadow_to_sovereign_shift",
      resistance_fallback_sec: 60,
      duration_sec: 150,
      instructions:
        "Transmute l'énergie bloquée dans la défense en un acte précis d'alignement postural.",
      instructions_i18n: {
        fr: "Transmute l'énergie bloquée dans la défense en un acte précis d'alignement postural.",
        en: "Transmute energy locked in defense into a precise act of postural alignment.",
      },
      steps: [
        {
          text: "Déposer le masque (Persona) — Relâche le besoin de paraître infaillible ou d'avoir raison.",
          text_i18n: {
            fr: "Déposer le masque (Persona) — Relâche le besoin de paraître infaillible ou d'avoir raison.",
            en: "Drop the mask (Persona) — Release the need to appear infallible or be right.",
          },
        },
        {
          text: "Acte d'autorité calme — Choisis le geste sobre qui sert la trajectoire réelle plutôt que l'ego.",
          text_i18n: {
            fr: "Acte d'autorité calme — Choisis le geste sobre qui sert la trajectoire réelle plutôt que l'ego.",
            en: "Act of calm authority — Choose the sober move that serves the real trajectory rather than ego.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(45 90% 55%)", hero: "flame" },
  ),
  nativeExercise(
    "symbol_encounter",
    "Décodage de Signal Faible & Champ Symbolique",
    "Weak-Signal & Symbolic Field Decoding",
    "myss",
    "gem",
    "Extraire l'information stratégique cachée derrière une friction répétée ou une anomalie.",
    "Extract strategic information hidden behind a repeated friction or anomaly.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "decision_log",
      mechanism_tag: "symbolic_field_decoding",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Lis l'événement récurrent non comme un obstacle aléatoire, mais comme un indicateur de trajectoire.",
      instructions_i18n: {
        fr: "Lis l'événement récurrent non comme un obstacle aléatoire, mais comme un indicateur de trajectoire.",
        en: "Read the recurring event not as a random obstacle, but as a trajectory indicator.",
      },
      steps: [
        {
          text: "Fait récurrent — Quel motif ou blocage se répète à l'identique dans ton champ actuel ?",
          text_i18n: {
            fr: "Fait récurrent — Quel motif ou blocage se répète à l'identique dans ton champ actuel ?",
            en: "Recurring pattern — What pattern or bottleneck is repeating identically in your current field?",
          },
        },
        {
          text: "Angle mort révélé — Quelle décision différée ce signal te force-t-il à regarder en face ?",
          text_i18n: {
            fr: "Angle mort révélé — Quelle décision différée ce signal te force-t-il à regarder en face ?",
            en: "Revealed blind spot — Which deferred decision is this signal forcing you to face?",
          },
        },
        {
          text: "Ajustement de cap — Quelle correction immédiate annule la répétition du motif ?",
          text_i18n: {
            fr: "Ajustement de cap — Quelle correction immédiate annule la répétition du motif ?",
            en: "Course correction — What immediate adjustment cancels the repetition of the pattern?",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(270 50% 60%)", hero: "spark" },
  ),
  nativeExercise(
    "boundary_practice",
    "Verrouillage de Membrane Relationnelle",
    "Relational Membrane Lock",
    "myss",
    "shield",
    "Établir une frontière étanche face aux urgences et projections d'autrui sans justification.",
    "Establish a sealed boundary against others' urgencies and projections without justification.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "relational_membrane_lock",
      resistance_fallback_sec: 60,
      duration_sec: 150,
      instructions:
        "Définis la frontière exacte qui protège ton intégrité décisionnelle sans entrer dans le conflit.",
      instructions_i18n: {
        fr: "Définis la frontière exacte qui protège ton intégrité décisionnelle sans entrer dans le conflit.",
        en: "Define the exact boundary that protects your decision integrity without entering conflict.",
      },
      steps: [
        {
          text: "Identifier l'intrusion — Nomme la demande ou la pression qui empiète sur ton périmètre souverain.",
          text_i18n: {
            fr: "Identifier l'intrusion — Nomme la demande ou la pression qui empiète sur ton périmètre souverain.",
            en: "Identify the intrusion — Name the demand or pressure encroaching on your sovereign perimeter.",
          },
        },
        {
          text: "Formuler la limite nue — Énonce ce que tu acceptes et ce que tu refuses en une phrase factuelle, sans t'excuser.",
          text_i18n: {
            fr: "Formuler la limite nue — Énonce ce que tu acceptes et ce que tu refuses en une phrase factuelle, sans t'excuser.",
            en: "State the bare limit — State what you accept and what you refuse in one factual sentence, without apologizing.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(0 65% 55%)", hero: "shield" },
  ),
  nativeExercise(
    "sacred_no",
    "Audit du « Oui » de Complaisance & Refus Souverain",
    "Compliance 'Yes' Audit & Sovereign Refusal",
    "myss",
    "shield-ban",
    "Intercepter la tentation du Prostitué de céder pour acheter la paix relationnelle.",
    "Intercept the Prostitute's temptation to yield in order to buy relational peace.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "compliance_yes_audit",
      resistance_fallback_sec: 60,
      duration_sec: 150,
      instructions:
        "Chaque « Oui » prononcé par peur du déplaisir est une dette contractée contre ta trajectoire. Formule ton refus net.",
      instructions_i18n: {
        fr: "Chaque « Oui » prononcé par peur du déplaisir est une dette contractée contre ta trajectoire. Formule ton refus net.",
        en: "Every 'Yes' spoken out of fear of displeasure is a debt contracted against your trajectory. Formulate your clean refusal.",
      },
      steps: [
        {
          text: "Démasquer la transaction — Quelle sécurité illusoire ou approbation cherches-tu à acheter en disant oui ?",
          text_i18n: {
            fr: "Démasquer la transaction — Quelle sécurité illusoire ou approbation cherches-tu à acheter en disant oui ?",
            en: "Unmask the transaction — What illusory safety or approval are you trying to buy by saying yes?",
          },
        },
        {
          text: "Prononcer le Non Souverain — Formule un refus courtois, définitif et dépourvu de fausse promesse.",
          text_i18n: {
            fr: "Prononcer le Non Souverain — Formule un refus courtois, définitif et dépourvu de fausse promesse.",
            en: "Deliver the Sovereign No — State a courteous, definitive refusal free of false promises.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(220 70% 60%)", hero: "shield" },
  ),
  nativeExercise(
    "energy_ledger",
    "Audit des Fuites de Bande Passante Nerveuse",
    "Nervous Bandwidth Leak Audit",
    "myss",
    "battery",
    "Cartographier les engagements et relations qui drainent l'énergie exécutive vs ceux qui la multiplient.",
    "Map commitments and relationships that drain executive energy vs those that multiply it.",
    {
      tier: "beginner",
      pillar: "conscience_interface",
      exocortex_organ: "daily_posture",
      mechanism_tag: "bandwidth_leak_audit",
      resistance_fallback_sec: 90,
      duration_sec: 180,
      instructions:
        "Dresse le bilan énergétique froid de ta journée pour colmater la fuite principale dès maintenant.",
      instructions_i18n: {
        fr: "Dresse le bilan énergétique froid de ta journée pour colmater la fuite principale dès maintenant.",
        en: "Draw up a cold energetic balance sheet of your day to seal the primary leak right now.",
      },
      steps: [
        {
          text: "Source Haute Tension — Quelle action ou alliance a amplifié ta clarté et ton tonus aujourd'hui ?",
          text_i18n: {
            fr: "Source Haute Tension — Quelle action ou alliance a amplifié ta clarté et ton tonus aujourd'hui ?",
            en: "High-Voltage Source — Which action or alliance amplified your clarity and tone today?",
          },
        },
        {
          text: "Hémorragie Nerveuse — Quelle boucle, personne ou micro-friction a siphonné ton attention ?",
          text_i18n: {
            fr: "Hémorragie Nerveuse — Quelle boucle, personne ou micro-friction a siphonné ton attention ?",
            en: "Nervous Hemorrhage — Which loop, person, or micro-friction siphoned your attention?",
          },
        },
        {
          text: "Colmatage — Quelle coupure ou délégation immédiate ferme cette fuite ?",
          text_i18n: {
            fr: "Colmatage — Quelle coupure ou délégation immédiate ferme cette fuite ?",
            en: "Seal the leak — What immediate cutoff or delegation closes this leak?",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(176 70% 48%)", hero: "orbit" },
  ),
  nativeExercise(
    "synchronicity_log",
    "Journal des Convergences & Signaux d'Attracteur",
    "Convergence & Attractor Signal Log",
    "myss",
    "sparkles",
    "Consigner les convergences factuelles et opportunités asymétriques alignées sur l'attracteur.",
    "Log factual convergences and asymmetric opportunities aligned with your attractor.",
    {
      tier: "beginner",
      pillar: "gouvernance_souveraine",
      exocortex_organ: "decision_log",
      mechanism_tag: "attractor_convergence_log",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Capte les signaux faibles et ouvertures inattendues sans tomber dans la pensée magique : convertis-les en levier.",
      instructions_i18n: {
        fr: "Capte les signaux faibles et ouvertures inattendues sans tomber dans la pensée magique : convertis-les en levier.",
        en: "Capture weak signals and unexpected openings without falling into magical thinking: convert them into leverage.",
      },
      steps: [
        {
          text: "Fait de convergence — Quel événement ou contact inattendu vient de croiser ta trajectoire ?",
          text_i18n: {
            fr: "Fait de convergence — Quel événement ou contact inattendu vient de croiser ta trajectoire ?",
            en: "Convergence fact — What unexpected event or contact just crossed your trajectory?",
          },
        },
        {
          text: "Résonance somatique — Ton système nerveux signale-t-il une ouverture calme ou une excitation fébrile ?",
          text_i18n: {
            fr: "Résonance somatique — Ton système nerveux signale-t-il une ouverture calme ou une excitation fébrile ?",
            en: "Somatic resonance — Does your nervous system signal a calm opening or feverish excitement?",
          },
        },
        {
          text: "Test de réalité — Quelle micro-action vérifiable permet de tester cette opportunité sous 48h ?",
          text_i18n: {
            fr: "Test de réalité — Quelle micro-action vérifiable permet de tester cette opportunité sous 48h ?",
            en: "Reality test — What verifiable micro-action tests this opportunity within 48h?",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(270 50% 60%)", hero: "spark" },
  ),
  nativeExercise(
    "relation_repair",
    "Protocole de Désescalade & Réalignement Relationnel",
    "De-escalation & Relational Realignment Protocol",
    "relations",
    "users",
    "Purger une friction sur le People Board par les faits, l'impact et le nouveau contrat explicite.",
    "Clear a friction on the People Board through facts, impact, and a new explicit contract.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "relational_realignment",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Remplace le procès d'intention par une mise à plat chirurgicale en 3 temps.",
      instructions_i18n: {
        fr: "Remplace le procès d'intention par une mise à plat chirurgicale en 3 temps.",
        en: "Replace assumed-intent accusations with a 3-step surgical realignment.",
      },
      steps: [
        {
          text: "Fait Neutre — Énonce l'écart observé sans jugement de valeur ni attaque personnelle.",
          text_i18n: {
            fr: "Fait Neutre — Énonce l'écart observé sans jugement de valeur ni attaque personnelle.",
            en: "Neutral Fact — State the observed gap without value judgment or personal attack.",
          },
        },
        {
          text: "Impact Opératif — Nomme sobrement la conséquence directe sur la mission ou la relation.",
          text_i18n: {
            fr: "Impact Opératif — Nomme sobrement la conséquence directe sur la mission ou la relation.",
            en: "Operative Impact — Soberly state the direct consequence on the mission or relationship.",
          },
        },
        {
          text: "Nouveau Contrat — Formule l'engagement réciproque clair pour la suite.",
          text_i18n: {
            fr: "Nouveau Contrat — Formule l'engagement réciproque clair pour la suite.",
            en: "New Contract — Formulate the clear mutual commitment moving forward.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(200 70% 55%)", hero: "steps" },
  ),
  nativeExercise(
    "empathy_perspective",
    "Triangulation Tactique des Positions (People Board)",
    "Tactical Position Triangulation (People Board)",
    "relations",
    "users-round",
    "Cartographier Ma Ligne, la Contrainte de l'Autre et le 3e Pilier d'accord.",
    "Map My Line, the Other's Constraint, and the 3rd Pillar of agreement.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "tactical_triangulation",
      instructions:
        "Sors de la collision frontale en cartographiant les 3 positions avant toute négociation.",
      instructions_i18n: {
        fr: "Sors de la collision frontale en cartographiant les 3 positions avant toute négociation.",
        en: "Step out of head-on collision by mapping the 3 positions before any negotiation.",
      },
      fields: ["Ma Ligne Souveraine", "La Peur / Contrainte de l'Autre", "Le Pont (Contrat Commun)"],
    },
    ["instructions"],
    "empathy_perspective",
    { accent: "hsl(176 70% 48%)" },
  ),
  nativeExercise(
    "social_micro_action",
    "Acte de Netteté Relationnelle (People Board)",
    "Relational Clarity Act (People Board)",
    "relations",
    "handshake",
    "Formuler une demande directe, un refus sobre ou une clarification sans justification défensive.",
    "Formulate a direct request, a sober refusal, or a clarification without defensive justification.",
    {
      tier: "beginner",
      pillar: "alchimie_archetypale",
      exocortex_organ: "people_board",
      mechanism_tag: "relational_clarity_act",
      resistance_fallback_sec: 60,
      duration_sec: 180,
      instructions:
        "Exécute une communication chirurgicale envers un interlocuteur clé, purgée de toute excuse ou sur-justification.",
      instructions_i18n: {
        fr: "Exécute une communication chirurgicale envers un interlocuteur clé, purgée de toute excuse ou sur-justification.",
        en: "Execute a surgical communication toward a key interlocutor, purged of any apology or over-justification.",
      },
      steps: [
        {
          text: "Cibler le flou — Identifie la relation où une attente implicite ou une ambiguïté draine ta bande passante.",
          text_i18n: {
            fr: "Cibler le flou — Identifie la relation où une attente implicite ou une ambiguïté draine ta bande passante.",
            en: "Target ambiguity — Identify the relationship where an unspoken expectation or ambiguity drains your bandwidth.",
          },
        },
        {
          text: "Purger la justification — Rédige ta demande ou ta limite en une phrase factuelle, en supprimant les « parce que » défensifs.",
          text_i18n: {
            fr: "Purger la justification — Rédige ta demande ou ta limite en une phrase factuelle, en supprimant les « parce que » défensifs.",
            en: "Purge justification — Draft your request or boundary in one factual sentence, removing defensive 'becauses'.",
          },
        },
        {
          text: "Transmission sobre — Envoie ou énonce la phrase puis maintiens le silence sans combler le vide.",
          text_i18n: {
            fr: "Transmission sobre — Envoie ou énonce la phrase puis maintiens le silence sans combler le vide.",
            en: "Sober transmission — Send or state the sentence, then hold silence without filling the void.",
          },
        },
      ],
    },
    ["instructions"],
    "micro",
    { accent: "hsl(176 70% 48%)", hero: "pulse" },
  ),
];

export const BUILTIN_TOOLBOX_SLUG_ALIASES: Record<string, string> = {
  breath_physiological_sigh: "physiological_sigh",
  grounding_54321: "open_monitoring",
  cognitive_reframe: "belief_reframe",
  myss_archetype_mirror: "archetype_mirror",
  myss_shadow_checkin: "shadow_checkin",
  myss_light_quality_practice: "light_quality_practice",
  myss_symbol_encounter: "symbol_encounter",
  myss_boundary_practice: "boundary_practice",
  myss_sacred_no: "sacred_no",
  myss_energy_ledger: "energy_ledger",
  myss_synchronicity_log: "synchronicity_log",
};

export const BUILTIN_TOOLBOX_CONTENT_TYPE_MAP = new Map(
  BUILTIN_TOOLBOX_CONTENT_TYPES.map((def) => [def.slug, def]),
);

export function getBuiltinToolboxContentTypeDefinition(
  slug: string,
): ToolboxContentTypeDefinition | null {
  const normalized = (slug || "").trim().toLowerCase();
  const resolvedSlug = BUILTIN_TOOLBOX_SLUG_ALIASES[normalized] ?? normalized;
  return BUILTIN_TOOLBOX_CONTENT_TYPE_MAP.get(resolvedSlug) ?? null;
}

export function mergeContentTypeDefinitions(
  overrides: Array<Partial<ToolboxContentTypeDefinition> & { slug: string }>,
): ToolboxContentTypeDefinition[] {
  const bySlug = new Map(
    BUILTIN_TOOLBOX_CONTENT_TYPES.map((def) => [def.slug, { ...def }]),
  );
  for (const override of overrides) {
    const base = bySlug.get(override.slug);
    if (base) {
      bySlug.set(override.slug, { ...base, ...override });
    } else {
      bySlug.set(override.slug, {
        slug: override.slug,
        label_fr: override.label_fr ?? override.slug,
        label_en: override.label_en ?? override.slug,
        description_fr: override.description_fr ?? "",
        description_en: override.description_en ?? "",
        category: override.category ?? "custom",
        icon: override.icon ?? "zap",
        renderer_kind: override.renderer_kind ?? "composed_v1",
        status: override.status ?? "draft",
        config_schema: override.config_schema ?? { type: "object" },
        ui_blueprint: override.ui_blueprint ?? { blocks: ["markdown"] },
        sample_config: override.sample_config ?? {},
        default_title_fr: override.default_title_fr ?? override.label_fr ?? override.slug,
        default_title_en: override.default_title_en ?? override.label_en ?? override.slug,
      });
    }
  }
  return Array.from(bySlug.values());
}
