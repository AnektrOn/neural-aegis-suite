-- ÉTAPE 1 : Catégories
INSERT INTO public.appendix_categories
  (slug, label_fr, label_en, description_fr, description_en, sort_order)
VALUES
  (
    'leadership_style',
    'Style de leadership',
    'Leadership Style',
    'Questions sur ta manière naturelle de diriger, de prendre des décisions et d’influencer ton environnement.',
    'Questions about your natural way of leading, making decisions and influencing your environment.',
    1
  ),
  (
    'shadow_patterns',
    'Exploration de l''ombre',
    'Shadow Exploration',
    'Questions pour explorer tes réactions automatiques, tes peurs et la manière dont tu sabotes parfois ton propre pouvoir.',
    'Questions to explore your automatic reactions, fears, and how you sometimes sabotage your own power.',
    2
  ),
  (
    'relational_dynamics',
    'Dynamiques relationnelles',
    'Relational Dynamics',
    'Questions autour de ta façon de te relier aux autres, poser des limites et créer de l’intimité.',
    'Questions about how you relate to others, set boundaries and create intimacy.',
    3
  ),
  (
    'purpose_legacy',
    'Sens, mission et héritage',
    'Purpose and Legacy',
    'Questions sur ta quête de sens, ta contribution et la trace que tu souhaites laisser.',
    'Questions about your search for meaning, your contribution and the legacy you want to leave.',
    4
  ),
  (
    'intuition_spirituality',
    'Intuition et spiritualité',
    'Intuition and Spirituality',
    'Questions sur ta connexion à l’invisible, ton intuition et ta pratique intérieure.',
    'Questions about your connection to the unseen, your intuition and inner practice.',
    5
  ),
  (
    'change_risk',
    'Changement et prise de risque',
    'Change and Risk-taking',
    'Questions sur ta relation au changement, au risque et aux transitions de vie.',
    'Questions about your relationship to change, risk and life transitions.',
    6
  );

-- ÉTAPE 2 : Questions
WITH cats AS (
  SELECT id, slug
  FROM public.appendix_categories
)
INSERT INTO public.appendix_questions
  (category_id, position, question_type, prompt_fr, prompt_en, helper_fr, helper_en, dimension, is_required, meta)
VALUES
  -- 1–12 : Style de leadership
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    1,
    'single_choice',
    'Quand tu entres dans une nouvelle équipe, quel rôle adoptes-tu spontanément ?',
    'When you join a new team, which role do you spontaneously take?',
    'Réponds selon ce qui arrive le plus souvent, pas ce que tu penses "devoir" faire.',
    'Answer based on what happens most often, not what you think you "should" do.',
    'leadership_style',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    2,
    'single_choice',
    'Comment prends-tu une décision importante quand les enjeux sont élevés ?',
    'How do you make an important decision when the stakes are high?',
    NULL,
    NULL,
    'decision_making',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    3,
    'multiple_choice',
    'Dans ton leadership, quelles sources de pouvoir utilises-tu le plus ?',
    'In your leadership, which sources of power do you use most often?',
    'Tu peux choisir plusieurs réponses.',
    'You can choose more than one answer.',
    'power_sources',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    4,
    'single_choice',
    'Quand un conflit éclate dans ton équipe, quelle est ta première impulsion ?',
    'When a conflict erupts in your team, what is your first impulse?',
    NULL,
    NULL,
    'conflict_style',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    5,
    'likert_scale',
    'Je me sens à l’aise pour assumer le rôle de leader visible, même sous pression.',
    'I feel comfortable stepping into a visible leadership role, even under pressure.',
    'Évalue à quel point cette phrase te décrit.',
    'Rate how much this statement describes you.',
    'leadership_confidence',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    6,
    'ranking',
    'Classe ces priorités de leadership de la plus importante à la moins importante pour toi.',
    'Rank these leadership priorities from most to least important for you.',
    '1 = plus important, 4 = moins important.',
    '1 = most important, 4 = least important.',
    'leadership_values',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    7,
    'short_text',
    'Décris une situation récente où tu t’es senti(e) pleinement dans ton rôle de leader.',
    'Describe a recent situation where you felt fully in your role as a leader.',
    '2–4 phrases suffisent.',
    '2–4 sentences are enough.',
    'leadership_narrative',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    8,
    'single_choice',
    'Quand tu dois trancher entre logique et loyauté personnelle, que privilégies-tu le plus souvent ?',
    'When you must choose between logic and personal loyalty, what do you usually prioritize?',
    NULL,
    NULL,
    'logic_vs_loyalty',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    9,
    'single_choice',
    'Comment réagis-tu quand quelqu’un remet ton autorité en question devant les autres ?',
    'How do you react when someone challenges your authority in front of others?',
    NULL,
    NULL,
    'authority_reaction',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    10,
    'multiple_choice',
    'Qu’est-ce qui te motive le plus à prendre des responsabilités de leadership ?',
    'What most motivates you to take on leadership responsibilities?',
    'Choisis jusqu’à 3 réponses.',
    'Choose up to 3 answers.',
    'leadership_motivation',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    11,
    'single_choice',
    'Dans les moments de crise, comment utilises-tu ton influence principale ?',
    'In times of crisis, how do you mainly use your influence?',
    NULL,
    NULL,
    'crisis_response',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'leadership_style'),
    12,
    'likert_scale',
    'Je me sens responsable de l’impact de mes décisions sur le long terme, pas seulement des résultats immédiats.',
    'I feel responsible for the long-term impact of my decisions, not just the immediate results.',
    NULL,
    NULL,
    'strategic_responsibility',
    false,
    '{}'::jsonb
  ),

  -- 13–24 : Exploration de l’ombre
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    13,
    'single_choice',
    'Quand tu te sens menacé(e), quelle stratégie inconsciente reviens-tu le plus souvent ?',
    'When you feel threatened, which unconscious strategy do you most often fall back on?',
    NULL,
    NULL,
    'shadow_strategy',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    14,
    'short_text',
    'Décris une situation où tu as eu l’impression de te saboter toi-même.',
    'Describe a situation where you felt you sabotaged yourself.',
    NULL,
    NULL,
    'self_sabotage_story',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    15,
    'multiple_choice',
    'Dans quelles zones de ta vie as-tu le plus tendance à renoncer à ton pouvoir ?',
    'In which areas of your life are you most likely to give away your power?',
    'Choisis toutes les réponses qui s’appliquent.',
    'Select all answers that apply.',
    'power_leaks',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    16,
    'single_choice',
    'Quand quelqu’un te dit non, que se passe-t-il le plus souvent en toi ?',
    'When someone tells you no, what most often happens inside you?',
    NULL,
    NULL,
    'reaction_to_limits',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    17,
    'likert_scale',
    'Il m’arrive de rester dans des situations qui ne me respectent pas, par peur de manquer ou de perdre.',
    'I sometimes stay in situations that do not respect me, out of fear of lack or loss.',
    NULL,
    NULL,
    'prostitute_pattern',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    18,
    'single_choice',
    'Quand un projet échoue, où va spontanément ta première interprétation ?',
    'When a project fails, where does your first interpretation spontaneously go?',
    NULL,
    NULL,
    'attribution_style',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    19,
    'ranking',
    'Classe ces peurs selon leur intensité pour toi aujourd’hui.',
    'Rank these fears based on how intense they are for you today.',
    '1 = plus forte, 4 = plus faible.',
    '1 = strongest, 4 = weakest.',
    'core_fears',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    20,
    'single_choice',
    'Quand tu sens que tu perds le contrôle, quelle réaction est la plus fréquente ?',
    'When you feel you are losing control, which reaction is most frequent?',
    NULL,
    NULL,
    'control_reaction',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    21,
    'short_text',
    'Si ta part "Victime" pouvait parler, que dirait-elle le plus souvent ?',
    'If your "Victim" side could speak, what would it most often say?',
    NULL,
    NULL,
    'victim_voice',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    22,
    'single_choice',
    'Face à une opportunité importante, quelle voix intérieure entends-tu en premier ?',
    'When facing an important opportunity, which inner voice do you hear first?',
    NULL,
    NULL,
    'inner_voices',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    23,
    'multiple_choice',
    'Quelles stratégies utilises-tu le plus pour éviter l’inconfort émotionnel ?',
    'Which strategies do you most use to avoid emotional discomfort?',
    NULL,
    NULL,
    'avoidance_strategies',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'shadow_patterns'),
    24,
    'single_choice',
    'Quand tu te sens épuisé(e), de quoi as-tu tendance à trop donner ?',
    'When you feel exhausted, what do you tend to give too much of?',
    NULL,
    NULL,
    'overgiving_pattern',
    false,
    '{}'::jsonb
  ),

  -- 25–36 : Dynamiques relationnelles
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    25,
    'likert_scale',
    'Je me sens à l’aise pour dire non clairement sans me justifier excessivement.',
    'I feel comfortable saying no clearly without over-justifying myself.',
    NULL,
    NULL,
    'boundaries',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    26,
    'single_choice',
    'Dans une relation importante, où vas-tu spontanément en premier ?',
    'In an important relationship, where do you spontaneously go first?',
    NULL,
    NULL,
    'relational_focus',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    27,
    'multiple_choice',
    'Qu’est-ce qui nourrit le plus ton sentiment de connexion aux autres ?',
    'What most nourishes your feeling of connection to others?',
    NULL,
    NULL,
    'connection_sources',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    28,
    'short_text',
    'Décris un conflit relationnel où tu as été fier(ère) de ta façon d’agir.',
    'Describe a relational conflict where you were proud of how you acted.',
    NULL,
    NULL,
    'healthy_conflict_example',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    29,
    'single_choice',
    'Quand quelqu’un que tu aimes souffre, que fais-tu en premier ?',
    'When someone you love is suffering, what do you do first?',
    NULL,
    NULL,
    'care_style',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    30,
    'single_choice',
    'Comment réagis-tu à une critique honnête mais inconfortable sur toi ?',
    'How do you react to honest but uncomfortable feedback about you?',
    NULL,
    NULL,
    'feedback_reaction',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    31,
    'ranking',
    'Classe ces qualités relationnelles de la plus naturelle à la moins naturelle pour toi.',
    'Rank these relational qualities from most to least natural for you.',
    NULL,
    NULL,
    'relational_qualities',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    32,
    'single_choice',
    'Dans une nouvelle relation, que protèges-tu le plus instinctivement ?',
    'In a new relationship, what do you most instinctively protect?',
    NULL,
    NULL,
    'relational_protection',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    33,
    'multiple_choice',
    'Quelles dynamiques relationnelles te drainent le plus d’énergie ?',
    'Which relational dynamics most drain your energy?',
    NULL,
    NULL,
    'relational_drains',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    34,
    'single_choice',
    'Quand tu te sens rejeté(e), vers qui ou vers quoi te tournes-tu en premier ?',
    'When you feel rejected, to whom or to what do you turn first?',
    NULL,
    NULL,
    'rejection_response',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    35,
    'short_text',
    'Quelle est, selon toi, ta plus grande force relationnelle aujourd’hui ?',
    'What do you see as your greatest relational strength today?',
    NULL,
    NULL,
    'relational_strength',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'relational_dynamics'),
    36,
    'single_choice',
    'Dans tes relations, qui prend le plus souvent les décisions clés ?',
    'In your relationships, who most often makes the key decisions?',
    NULL,
    NULL,
    'decision_dynamics',
    false,
    '{}'::jsonb
  ),

  -- 37–48 : Sens, mission et héritage
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    37,
    'single_choice',
    'À quoi penses-tu en premier quand tu entends le mot "mission" ?',
    'What is the first thing you think of when you hear the word "mission"?',
    NULL,
    NULL,
    'mission_image',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    38,
    'single_choice',
    'Qu’est-ce qui t’attriste le plus à l’idée de ne pas l’avoir vécu ou accompli ?',
    'What saddens you most when you imagine not having lived or accomplished it?',
    NULL,
    NULL,
    'regret_focus',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    39,
    'multiple_choice',
    'Quelles formes de contribution te parlent le plus ?',
    'Which forms of contribution resonate most with you?',
    NULL,
    NULL,
    'contribution_forms',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    40,
    'likert_scale',
    'Je sens que ma vie est guidée par quelque chose de plus grand que mes intérêts personnels.',
    'I feel that my life is guided by something larger than my personal interests.',
    NULL,
    NULL,
    'transpersonal_orientation',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    41,
    'single_choice',
    'Quand tu imagines ton héritage, qu’est-ce qui compte le plus ?',
    'When you imagine your legacy, what matters most?',
    NULL,
    NULL,
    'legacy_focus',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    42,
    'short_text',
    'Si tu résumais ta trajectoire en une phrase de "contrat sacré", que dirait-elle ?',
    'If you summarized your trajectory in one "sacred contract" sentence, what would it say?',
    NULL,
    NULL,
    'sacred_contract_phrase',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    43,
    'single_choice',
    'Lequel décrit le mieux ton rapport actuel à ta vocation ?',
    'Which best describes your current relationship to your vocation?',
    NULL,
    NULL,
    'vocation_status',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    44,
    'single_choice',
    'Quand tu dois choisir entre sécurité et appel intérieur, que fais-tu le plus souvent ?',
    'When you must choose between security and inner calling, what do you usually do?',
    NULL,
    NULL,
    'security_vs_calling',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    45,
    'multiple_choice',
    'Qu’est-ce qui t’aide le plus à rester aligné(e) sur ce qui a du sens pour toi ?',
    'What most helps you stay aligned with what is meaningful for you?',
    NULL,
    NULL,
    'alignment_practices',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    46,
    'single_choice',
    'Sur quoi portes-tu spontanément ton attention quand tu entres dans un nouveau contexte ?',
    'What do you spontaneously pay attention to when you enter a new context?',
    NULL,
    NULL,
    'perception_focus',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    47,
    'ranking',
    'Classe ces motivations selon leur importance dans tes grands choix de vie.',
    'Rank these motivations based on their importance in your major life choices.',
    NULL,
    NULL,
    'life_motivations',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'purpose_legacy'),
    48,
    'single_choice',
    'Quand tu te projètes à 10 ans, quel archétype semble le plus vivant ?',
    'When you project yourself 10 years from now, which archetype feels most alive?',
    NULL,
    NULL,
    'future_self_archetype',
    false,
    '{}'::jsonb
  ),

  -- 49–60 : Intuition et spiritualité
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    49,
    'short_text',
    'Raconte un moment où ton intuition t’a guidé(e) à contre-courant de la logique.',
    'Tell a moment when your intuition guided you against logic.',
    NULL,
    NULL,
    'intuition_story',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    50,
    'single_choice',
    'Comment reconnais-tu le plus souvent la voix de ton intuition ?',
    'How do you most often recognize the voice of your intuition?',
    NULL,
    NULL,
    'intuition_channel',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    51,
    'multiple_choice',
    'Quelles pratiques nourrissent le plus ta vie intérieure aujourd’hui ?',
    'Which practices most nourish your inner life today?',
    NULL,
    NULL,
    'inner_practices',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    52,
    'single_choice',
    'Quand tu as une décision importante, que fais-tu en premier pour clarifier ?',
    'When you have an important decision, what do you do first to clarify?',
    NULL,
    NULL,
    'decision_intuition',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    53,
    'single_choice',
    'Quelle phrase se rapproche le plus de ta vision du sacré ?',
    'Which sentence is closest to your vision of the sacred?',
    NULL,
    NULL,
    'sacred_view',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    54,
    'likert_scale',
    'Je me sens relié(e) à un champ plus vaste d’intelligence ou de conscience.',
    'I feel connected to a larger field of intelligence or consciousness.',
    NULL,
    NULL,
    'mystic_orientation',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    55,
    'single_choice',
    'Quand tu traverses une période de crise intérieure, où cherches-tu du soutien en premier ?',
    'When you go through an inner crisis, where do you first seek support?',
    NULL,
    NULL,
    'crisis_support',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    56,
    'short_text',
    'Écris une phrase qui résume ton pacte intérieur actuel avec la vie.',
    'Write one sentence that summarizes your current inner pact with life.',
    NULL,
    NULL,
    'inner_pact',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    57,
    'single_choice',
    'Face à un "signe" ou une synchronicité marquante, que fais-tu le plus souvent ?',
    'When you notice a strong "sign" or synchronicity, what do you usually do?',
    NULL,
    NULL,
    'synchronicity_response',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    58,
    'multiple_choice',
    'À quels archétypes te sens-tu le plus relié(e) quand tu es dans ta dimension spirituelle ?',
    'Which archetypes do you feel most connected to when you are in your spiritual dimension?',
    NULL,
    NULL,
    'spiritual_archetypes',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    59,
    'single_choice',
    'Quelle place l’invisible (rêves, symboles, synchronicités) prend-il dans tes décisions ?',
    'What place does the unseen (dreams, symbols, synchronicities) take in your decisions?',
    NULL,
    NULL,
    'unseen_role',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'intuition_spirituality'),
    60,
    'single_choice',
    'Quand tu penses "guérison", quelle image te vient en premier ?',
    'When you think "healing", which image comes to you first?',
    NULL,
    NULL,
    'healing_image',
    false,
    '{}'::jsonb
  ),

  -- 61–70 : Changement et prise de risque
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    61,
    'single_choice',
    'Quand un grand changement se présente, quelle est ta première réaction corporelle ou émotionnelle ?',
    'When a major change appears, what is your first bodily or emotional reaction?',
    NULL,
    NULL,
    'change_reaction',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    62,
    'multiple_choice',
    'Qu’est-ce qui t’aide le plus à traverser une transition importante ?',
    'What most helps you go through a major transition?',
    NULL,
    NULL,
    'transition_resources',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    63,
    'short_text',
    'Décris un risque que tu as pris et qui a changé ta trajectoire.',
    'Describe a risk you took that changed your trajectory.',
    NULL,
    NULL,
    'risk_story',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    64,
    'single_choice',
    'Quand tu sens que l’ancien ne fonctionne plus, que fais-tu le plus souvent ?',
    'When you feel the old way no longer works, what do you usually do?',
    NULL,
    NULL,
    'old_patterns',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    65,
    'likert_scale',
    'Je me fais confiance pour traverser l’inconnu, même sans plan complet.',
    'I trust myself to go through the unknown, even without a complete plan.',
    NULL,
    NULL,
    'risk_trust',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    66,
    'single_choice',
    'Quand tu rates quelque chose d’important, quelle phrase intérieure apparaît le plus souvent ?',
    'When you fail at something important, which inner sentence appears most often?',
    NULL,
    NULL,
    'failure_script',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    67,
    'ranking',
    'Classe ces attitudes selon leur présence dans ta manière d’aborder le changement.',
    'Rank these attitudes based on how present they are in how you approach change.',
    NULL,
    NULL,
    'change_attitudes',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    68,
    'single_choice',
    'Quand tu dois renoncer à quelque chose pour évoluer, qu’est-ce qui est le plus difficile à lâcher ?',
    'When you must let go of something to evolve, what is the hardest to release?',
    NULL,
    NULL,
    'letting_go',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    69,
    'single_choice',
    'Lequel de ces archétypes se manifeste le plus quand tu es sur le point de sauter dans le vide ?',
    'Which of these archetypes shows up most when you are about to jump into the unknown?',
    NULL,
    NULL,
    'edge_archetype',
    false,
    '{}'::jsonb
  ),
  (
    (SELECT id FROM cats WHERE slug = 'change_risk'),
    70,
    'short_text',
    'Si tu donnais un titre de chapitre à la transition que tu vis en ce moment, ce serait quoi ?',
    'If you gave a chapter title to the transition you are living right now, what would it be?',
    NULL,
    NULL,
    'transition_title',
    false,
    '{}'::jsonb
  );

-- ÉTAPE 3 : Options
WITH q AS (
  SELECT id, position
  FROM public.appendix_questions
)
INSERT INTO public.appendix_options
  (question_id, position, label_fr, label_en, archetype_weights, shadow_weights, value)
VALUES
  -- Q1 single_choice
  (
    (SELECT id FROM q WHERE position = 1), 1,
    'Je prends naturellement la tête et je structure les objectifs.',
    'I naturally take the lead and structure the objectives.',
    '{"sovereign": 2, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 1), 2,
    'Je m’assure d’abord que tout le monde se sente écouté.',
    'I first make sure everyone feels heard.',
    '{"caregiver": 2, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 1), 3,
    'J’observe en silence avant d’influencer subtilement.',
    'I observe in silence before influencing subtly.',
    '{"sage": 1, "mystic": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 1), 4,
    'Je préfère rester en retrait et suivre la dynamique du groupe.',
    'I prefer to stay in the background and follow the group dynamic.',
    '{"explorer": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q2 single_choice
  (
    (SELECT id FROM q WHERE position = 2), 1,
    'Je fais une analyse rationnelle détaillée avant de décider.',
    'I do a detailed rational analysis before deciding.',
    '{"sage": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 2), 2,
    'Je consulte les personnes clés et je cherche le consensus.',
    'I consult key people and seek consensus.',
    '{"lover": 1, "caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 2), 3,
    'Je me fie à mon intuition et j’ajuste ensuite si besoin.',
    'I trust my intuition and adjust later if needed.',
    '{"mystic": 1, "magician": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 2), 4,
    'Je repousse la décision jusqu’à ce que les circonstances m’y obligent.',
    'I postpone the decision until circumstances force me to act.',
    '{}'::jsonb,
    '{"saboteur": 1, "victim": 1}'::jsonb,
    NULL
  ),

  -- Q3 multiple_choice
  (
    (SELECT id FROM q WHERE position = 3), 1,
    'Mon expertise et ma vision stratégique.',
    'My expertise and strategic vision.',
    '{"sage": 1, "sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 3), 2,
    'Mon courage et ma capacité à prendre des décisions difficiles.',
    'My courage and ability to make hard decisions.',
    '{"warrior": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 3), 3,
    'Ma capacité à créer du lien et de la confiance.',
    'My ability to create connection and trust.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 3), 4,
    'Mon imagination, ma créativité et mes idées originales.',
    'My imagination, creativity and original ideas.',
    '{"creator": 2, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q4 single_choice
  (
    (SELECT id FROM q WHERE position = 4), 1,
    'Je pose un cadre clair et je recadre fermement si nécessaire.',
    'I set a clear frame and firmly realign if needed.',
    '{"sovereign": 2, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 4), 2,
    'Je cherche à comprendre profondément les besoins de chacun.',
    'I seek to deeply understand each person’s needs.',
    '{"lover": 1, "caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 4), 3,
    'Je tente de transformer le conflit en opportunité créative.',
    'I try to turn the conflict into a creative opportunity.',
    '{"creator": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 4), 4,
    'Je me retire ou j’espère que ça se résoudra tout seul.',
    'I withdraw or hope it will sort itself out.',
    '{}'::jsonb,
    '{"victim": 1, "saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q5 likert_scale (standard 1–5)
  (
    (SELECT id FROM q WHERE position = 5), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{"victim": 1}'::jsonb,
    '{}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 5), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{"explorer": 1}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 5), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 5), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"sovereign": 1, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 5), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"sovereign": 2, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q6 ranking
  (
    (SELECT id FROM q WHERE position = 6), 1,
    'Résultats et performance.',
    'Results and performance.',
    '{"warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 6), 2,
    'Bien-être des personnes.',
    'People’s well-being.',
    '{"caregiver": 1, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 6), 3,
    'Vision et innovation.',
    'Vision and innovation.',
    '{"creator": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 6), 4,
    'Stabilité et sécurité.',
    'Stability and security.',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q8 single_choice
  (
    (SELECT id FROM q WHERE position = 8), 1,
    'Je choisis la logique, même si c’est inconfortable relationnellement.',
    'I choose logic, even if it is relationally uncomfortable.',
    '{"sage": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 8), 2,
    'Je privilégie la loyauté, quitte à prendre un risque rationnel.',
    'I prioritize loyalty, even if it is rationally risky.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 8), 3,
    'Je cherche un compromis créatif qui honore les deux.',
    'I look for a creative compromise that honors both.',
    '{"magician": 1, "creator": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 8), 4,
    'Je procrastine et j’espère que le choix se fera pour moi.',
    'I procrastinate and hope the choice will be made for me.',
    '{}'::jsonb,
    '{"victim": 1, "prostitute": 1}'::jsonb,
    NULL
  ),

  -- Q9 single_choice
  (
    (SELECT id FROM q WHERE position = 9), 1,
    'Je reste calme et je recadre avec clarté.',
    'I stay calm and realign clearly.',
    '{"sovereign": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 9), 2,
    'Je me sens blessé(e) et je me ferme.',
    'I feel hurt and shut down.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 9), 3,
    'Je contre-attaque pour reprendre le dessus.',
    'I counter-attack to regain control.',
    '{"warrior": 1, "rebel": 1}'::jsonb,
    '{"control": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 9), 4,
    'Je transforme la situation en moment d’apprentissage collectif.',
    'I turn the situation into a collective learning moment.',
    '{"sage": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q10 multiple_choice
  (
    (SELECT id FROM q WHERE position = 10), 1,
    'Contribuer à quelque chose de plus grand que moi.',
    'Contributing to something bigger than myself.',
    '{"mystic": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 10), 2,
    'Protéger et faire grandir les autres.',
    'Protecting and growing others.',
    '{"caregiver": 1, "healer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 10), 3,
    'Gagner en statut, influence ou reconnaissance.',
    'Gaining status, influence or recognition.',
    '{"sovereign": 2}'::jsonb,
    '{"prostitute": 0.5}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 10), 4,
    'Avoir la liberté d’explorer, tester, innover.',
    'Having the freedom to explore, test, innovate.',
    '{"explorer": 1, "creator": 1, "rebel": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q11 single_choice
  (
    (SELECT id FROM q WHERE position = 11), 1,
    'Je protège en priorité les plus vulnérables.',
    'I primarily protect the most vulnerable.',
    '{"caregiver": 2, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 11), 2,
    'Je garde la tête froide pour préserver la stratégie globale.',
    'I keep a cool head to preserve the overall strategy.',
    '{"sage": 1, "sovereign": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 11), 3,
    'Je me mets en première ligne pour absorber le choc.',
    'I put myself on the front line to absorb the shock.',
    '{"warrior": 2, "healer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 11), 4,
    'Je me fais discret(e) et j’attends que la tempête passe.',
    'I keep a low profile and wait for the storm to pass.',
    '{}'::jsonb,
    '{"victim": 1, "saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q12 likert_scale (standard 1–5)
  (
    (SELECT id FROM q WHERE position = 12), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{"prostitute": 1}'::jsonb,
    '{}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 12), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 12), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 12), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 12), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"sovereign": 2, "sage": 1}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q13 single_choice (shadow)
  (
    (SELECT id FROM q WHERE position = 13), 1,
    'Je contrôle tout encore plus pour ne rien lâcher.',
    'I try to control everything even more so I don’t let go.',
    '{"warrior": 1}'::jsonb,
    '{"control": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 13), 2,
    'Je me sens impuissant(e) et je me replie.',
    'I feel powerless and withdraw.',
    '{}'::jsonb,
    '{"victim": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 13), 3,
    'Je cherche à comprendre la leçon et j’ajuste ma posture.',
    'I seek to understand the lesson and adjust my posture.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 13), 4,
    'Je négocie intérieurement ce que je suis prêt(e) à sacrifier.',
    'I internally negotiate what I am willing to sacrifice.',
    '{"prostitute": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q15 multiple_choice (power leaks)
  (
    (SELECT id FROM q WHERE position = 15), 1,
    'Dans mes relations affectives.',
    'In my intimate relationships.',
    '{"lover": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 15), 2,
    'Dans mon travail ou mes études.',
    'In my work or studies.',
    '{"warrior": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 15), 3,
    'En lien avec l’argent et la sécurité matérielle.',
    'Around money and material security.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 15), 4,
    'Quand il s’agit d’affirmer mes besoins ou mes limites.',
    'When it comes to stating my needs or boundaries.',
    '{"caregiver": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q17 likert_scale (prostitute pattern)
  (
    (SELECT id FROM q WHERE position = 17), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 17), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 17), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 17), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 17), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{}'::jsonb,
    '{"prostitute": 2}'::jsonb,
    5
  ),

  -- Q19 ranking (fears)
  (
    (SELECT id FROM q WHERE position = 19), 1,
    'Être rejeté(e) ou abandonné(e).',
    'Being rejected or abandoned.',
    '{"lover": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 19), 2,
    'Perdre ma liberté ou mon autonomie.',
    'Losing my freedom or autonomy.',
    '{"explorer": 1, "rebel": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 19), 3,
    'Être humilié(e) ou exposé(e) comme incompétent(e).',
    'Being humiliated or exposed as incompetent.',
    '{"sage": 1}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 19), 4,
    'Perdre la sécurité matérielle.',
    'Losing material security.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),

  -- Q20 single_choice
  (
    (SELECT id FROM q WHERE position = 20), 1,
    'Je serre encore plus les règles et les contrôles.',
    'I tighten rules and controls even more.',
    '{"warrior": 1}'::jsonb,
    '{"control": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 20), 2,
    'Je me sens figé(e) et je perds mon énergie.',
    'I feel frozen and lose my energy.',
    '{}'::jsonb,
    '{"victim": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 20), 3,
    'Je respire, je prends du recul et je réajuste.',
    'I breathe, step back and readjust.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 20), 4,
    'Je délègue ou je fuis la situation.',
    'I delegate or flee the situation.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q22 single_choice
  (
    (SELECT id FROM q WHERE position = 22), 1,
    'La voix qui dit "ce n’est pas pour toi, tu n’es pas prêt(e)".',
    'The voice saying "this is not for you, you are not ready".',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 22), 2,
    'La voix qui dit "fais-le, tu trouveras comment après".',
    'The voice saying "do it, you will figure it out later".',
    '{"warrior": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 22), 3,
    'La voix qui pèse tous les risques avant d’avancer.',
    'The voice that weighs all risks before moving forward.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 22), 4,
    'La voix qui se demande ce que les autres vont penser.',
    'The voice that wonders what others will think.',
    '{"lover": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),

  -- Q23 multiple_choice (avoidance strategies)
  (
    (SELECT id FROM q WHERE position = 23), 1,
    'Je me distrais (écran, travail, activités).',
    'I distract myself (screens, work, activities).',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 23), 2,
    'Je rationalise et je reste dans la tête.',
    'I rationalize and stay in my head.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 23), 3,
    'Je surdonne aux autres pour ne pas sentir mes propres émotions.',
    'I over-give to others to avoid feeling my own emotions.',
    '{"caregiver": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 23), 4,
    'Je cherche une intensité (sport extrême, sexualité, risque).',
    'I seek intensity (extreme sport, sexuality, risk).',
    '{"rebel": 1, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q24 single_choice
  (
    (SELECT id FROM q WHERE position = 24), 1,
    'Mon temps et mon énergie.',
    'My time and energy.',
    '{"caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 24), 2,
    'Mon argent ou mes ressources matérielles.',
    'My money or material resources.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 24), 3,
    'Mon écoute émotionnelle.',
    'My emotional listening.',
    '{"lover": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 24), 4,
    'Ma créativité et mon inspiration.',
    'My creativity and inspiration.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q25 likert_scale (boundaries)
  (
    (SELECT id FROM q WHERE position = 25), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 25), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 25), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 25), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"lover": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 25), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"sovereign": 1, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q26 single_choice
  (
    (SELECT id FROM q WHERE position = 26), 1,
    'Je cherche la fusion émotionnelle.',
    'I seek emotional fusion.',
    '{"lover": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 26), 2,
    'Je garde une certaine distance pour observer.',
    'I keep some distance to observe.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 26), 3,
    'Je regarde comment je peux aider ou soutenir.',
    'I see how I can help or support.',
    '{"caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 26), 4,
    'Je teste les limites, j’apporte un peu de disruption.',
    'I test boundaries and bring some disruption.',
    '{"rebel": 2, "jester": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q27 multiple_choice
  (
    (SELECT id FROM q WHERE position = 27), 1,
    'Des conversations profondes et vulnérables.',
    'Deep and vulnerable conversations.',
    '{"lover": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 27), 2,
    'Des projets communs et des défis partagés.',
    'Shared projects and challenges.',
    '{"warrior": 1, "creator": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 27), 3,
    'Des rituels, de l’humour et des moments légers.',
    'Rituals, humor and light moments.',
    '{"jester": 1, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 27), 4,
    'Le sentiment d’être utile et de prendre soin.',
    'The feeling of being useful and caring.',
    '{"caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q29 single_choice
  (
    (SELECT id FROM q WHERE position = 29), 1,
    'Je propose des solutions et un plan d’action.',
    'I propose solutions and an action plan.',
    '{"warrior": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 29), 2,
    'Je crée un espace pour qu’il/elle puisse déposer ce qu’il/elle vit.',
    'I create space for them to express what they live.',
    '{"lover": 1, "caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 29), 3,
    'Je cherche un sens ou une perspective plus large.',
    'I look for meaning or a larger perspective.',
    '{"mystic": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 29), 4,
    'Je me sens vite dépassé(e) et je me coupe.',
    'I quickly feel overwhelmed and shut down.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q30 single_choice
  (
    (SELECT id FROM q WHERE position = 30), 1,
    'Je dis merci et je réfléchis à ce qui est vrai pour moi.',
    'I say thank you and reflect on what is true for me.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 30), 2,
    'Je me justifie longuement.',
    'I justify myself at length.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 30), 3,
    'Je me braque et je contre-attaque.',
    'I get defensive and counter-attack.',
    '{"warrior": 1}'::jsonb,
    '{"control": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 30), 4,
    'Je fais comme si de rien n’était mais j’accumule intérieurement.',
    'I pretend nothing happened but accumulate inside.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q31 ranking (relational qualities)
  (
    (SELECT id FROM q WHERE position = 31), 1,
    'Empathie et présence.',
    'Empathy and presence.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 31), 2,
    'Clarté et franchise.',
    'Clarity and directness.',
    '{"warrior": 1, "sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 31), 3,
    'Humour et légèreté.',
    'Humor and lightness.',
    '{"jester": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 31), 4,
    'Intuition et profondeur.',
    'Intuition and depth.',
    '{"mystic": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q32 single_choice
  (
    (SELECT id FROM q WHERE position = 32), 1,
    'Mon indépendance et ma liberté.',
    'My independence and freedom.',
    '{"explorer": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 32), 2,
    'Mon monde intérieur et ma sensibilité.',
    'My inner world and sensitivity.',
    '{"mystic": 1, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 32), 3,
    'Ma réputation et mon image.',
    'My reputation and image.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 32), 4,
    'Mes projets et ma créativité.',
    'My projects and creativity.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q33 multiple_choice (relational drains)
  (
    (SELECT id FROM q WHERE position = 33), 1,
    'Les personnes qui se positionnent en Victime permanente.',
    'People who position themselves as permanent Victims.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 33), 2,
    'Les conflits non dits et les non-dits accumulés.',
    'Unspoken conflicts and accumulated unspoken tensions.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 33), 3,
    'Les demandes constantes sans réciprocité.',
    'Constant demands without reciprocity.',
    '{"caregiver": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 33), 4,
    'Les jeux de pouvoir et de manipulation.',
    'Power games and manipulation.',
    '{}'::jsonb,
    '{"control": 2}'::jsonb,
    NULL
  ),

  -- Q34 single_choice
  (
    (SELECT id FROM q WHERE position = 34), 1,
    'Je me tourne vers mes proches de confiance.',
    'I turn to trusted loved ones.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 34), 2,
    'Je me recentre seul(e) pour comprendre ce qui se joue.',
    'I center myself alone to understand what is happening.',
    '{"mystic": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 34), 3,
    'Je cherche à me valoriser ailleurs.',
    'I try to seek validation elsewhere.',
    '{}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 34), 4,
    'Je me coupe émotionnellement.',
    'I cut off emotionally.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q36 single_choice
  (
    (SELECT id FROM q WHERE position = 36), 1,
    'Plutôt moi : j’aime garder la main.',
    'Mostly me: I like to keep control.',
    '{"sovereign": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 36), 2,
    'Plutôt l’autre : je préfère suivre.',
    'Mostly the other: I prefer to follow.',
    '{"lover": 1}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 36), 3,
    'Ça dépend : nous co-décidons selon les sujets.',
    'It depends: we co-decide depending on topics.',
    '{"lover": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 36), 4,
    'Personne vraiment : les décisions arrivent "toutes seules".',
    'No one really: decisions seem to "just happen".',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q37 single_choice
  (
    (SELECT id FROM q WHERE position = 37), 1,
    'Un appel spirituel ou existentiel.',
    'A spiritual or existential calling.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 37), 2,
    'Un projet professionnel ou créatif.',
    'A professional or creative project.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 37), 3,
    'Un rôle auprès des autres (guide, mentor, parent, soignant).',
    'A role with others (guide, mentor, parent, caregiver).',
    '{"caregiver": 1, "healer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 37), 4,
    'Je ne sais pas vraiment, c’est flou.',
    'I don’t really know, it is blurry.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q38 single_choice
  (
    (SELECT id FROM q WHERE position = 38), 1,
    'Ne pas avoir aimé pleinement.',
    'Not having loved fully.',
    '{"lover": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 38), 2,
    'Ne pas avoir utilisé mes talents.',
    'Not having used my talents.',
    '{"creator": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 38), 3,
    'Ne pas avoir servi une cause qui me dépasse.',
    'Not having served a cause greater than myself.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 38), 4,
    'Ne pas avoir connu la sécurité et le confort.',
    'Not having known security and comfort.',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q39 multiple_choice
  (
    (SELECT id FROM q WHERE position = 39), 1,
    'Accompagner directement des personnes (coaching, soin, mentorat).',
    'Directly supporting people (coaching, care, mentoring).',
    '{"healer": 2, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 39), 2,
    'Transformer des systèmes ou des organisations.',
    'Transforming systems or organizations.',
    '{"warrior": 1, "sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 39), 3,
    'Créer des œuvres, des concepts ou des produits.',
    'Creating works, concepts or products.',
    '{"creator": 2, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 39), 4,
    'Être éclaireur·euse, montrer des chemins possibles.',
    'Being a pathfinder, showing possible paths.',
    '{"explorer": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q40 likert_scale
  (
    (SELECT id FROM q WHERE position = 40), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 40), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 40), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 40), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 40), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"mystic": 2, "sage": 1}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q41 single_choice
  (
    (SELECT id FROM q WHERE position = 41), 1,
    'L’impact sur les personnes que j’aurai touchées.',
    'The impact on the people I will have touched.',
    '{"lover": 1, "healer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 41), 2,
    'Ce que j’aurai construit ou créé.',
    'What I will have built or created.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 41), 3,
    'L’exemple de vie que j’aurai donné.',
    'The example of life I will have given.',
    '{"sage": 1, "warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 41), 4,
    'Le confort et la sécurité laissés aux miens.',
    'The comfort and security left to my loved ones.',
    '{"sovereign": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q43 single_choice
  (
    (SELECT id FROM q WHERE position = 43), 1,
    'Je suis en plein dedans, je le vis déjà.',
    'I am right in it, I am already living it.',
    '{"warrior": 1, "creator": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 43), 2,
    'Je le touche par moments mais ce n’est pas stable.',
    'I touch it at times but it is not stable.',
    '{"explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 43), 3,
    'Je sens l’appel mais je n’ose pas encore.',
    'I feel the calling but I do not dare yet.',
    '{}'::jsonb,
    '{"victim": 1, "prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 43), 4,
    'Je ne sais pas encore ce que c’est.',
    'I do not yet know what it is.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q44 single_choice
  (
    (SELECT id FROM q WHERE position = 44), 1,
    'Je choisis presque toujours la sécurité.',
    'I almost always choose security.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 44), 2,
    'Je choisis souvent l’appel, même si c’est risqué.',
    'I often choose the calling, even if risky.',
    '{"warrior": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 44), 3,
    'J’alterne selon les périodes.',
    'I alternate depending on periods.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 44), 4,
    'Je laisse les circonstances décider à ma place.',
    'I let circumstances decide for me.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q45 multiple_choice (alignment practices)
  (
    (SELECT id FROM q WHERE position = 45), 1,
    'Des temps de silence, de contemplation ou de méditation.',
    'Times of silence, contemplation or meditation.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 45), 2,
    'Des échanges profonds avec des proches de confiance.',
    'Deep exchanges with trusted people.',
    '{"lover": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 45), 3,
    'L’action concrète : tester, ajuster, avancer.',
    'Concrete action: test, adjust, move forward.',
    '{"warrior": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 45), 4,
    'L’écriture, le journaling, la créativité.',
    'Writing, journaling, creativity.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q46 single_choice
  (
    (SELECT id FROM q WHERE position = 46), 1,
    'Qui souffre ou qui est vulnérable ici.',
    'Who is suffering or vulnerable here.',
    '{"caregiver": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 46), 2,
    'Qui détient le pouvoir ici.',
    'Who holds the power here.',
    '{"sovereign": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 46), 3,
    'Où se trouvent les opportunités et les possibles.',
    'Where opportunities and possibilities are.',
    '{"explorer": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 46), 4,
    'Quels signes, symboles ou ressentis émergent.',
    'Which signs, symbols or sensations emerge.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q47 ranking (life motivations)
  (
    (SELECT id FROM q WHERE position = 47), 1,
    'Amour et liens.',
    'Love and relationships.',
    '{"lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 47), 2,
    'Pouvoir et influence.',
    'Power and influence.',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 47), 3,
    'Croissance et apprentissage.',
    'Growth and learning.',
    '{"sage": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 47), 4,
    'Créativité et expression.',
    'Creativity and expression.',
    '{"creator": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q48 single_choice (future_self_archetype)
  (
    (SELECT id FROM q WHERE position = 48), 1,
    'Le Sage / la Sage.',
    'The Sage.',
    '{"sage": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 48), 2,
    'Le Souverain / la Souveraine.',
    'The Sovereign.',
    '{"sovereign": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 48), 3,
    'Le / la Mystique.',
    'The Mystic.',
    '{"mystic": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 48), 4,
    'Le / la Créateur·rice.',
    'The Creator.',
    '{"creator": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q50 single_choice (intuition channel)
  (
    (SELECT id FROM q WHERE position = 50), 1,
    'Des ressentis corporels très clairs.',
    'Very clear bodily sensations.',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 50), 2,
    'Des images, symboles ou rêves.',
    'Images, symbols or dreams.',
    '{"magician": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 50), 3,
    'Des pensées soudaines qui s’imposent.',
    'Sudden thoughts that impose themselves.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 50), 4,
    'Je peine à distinguer mon intuition de mes peurs.',
    'I struggle to distinguish my intuition from my fears.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),

  -- Q51 multiple_choice (inner practices)
  (
    (SELECT id FROM q WHERE position = 51), 1,
    'Méditation, contemplation, prière.',
    'Meditation, contemplation, prayer.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 51), 2,
    'Pratiques corporelles (yoga, arts martiaux, danse).',
    'Body practices (yoga, martial arts, dance).',
    '{"warrior": 1, "lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 51), 3,
    'Écriture, journal, créativité.',
    'Writing, journaling, creativity.',
    '{"creator": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 51), 4,
    'Temps dans la nature, marche, silence.',
    'Time in nature, walking, silence.',
    '{"explorer": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q52 single_choice
  (
    (SELECT id FROM q WHERE position = 52), 1,
    'Je liste les pour et les contre.',
    'I list pros and cons.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 52), 2,
    'Je me mets en silence pour écouter ce qui émerge.',
    'I go into silence to listen to what emerges.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 52), 3,
    'Je demande conseil à des personnes de confiance.',
    'I ask advice from trusted people.',
    '{"lover": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 52), 4,
    'Je décide impulsivement pour ne plus y penser.',
    'I decide impulsively so I don’t have to think about it.',
    '{"rebel": 1}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q53 single_choice (sacred view)
  (
    (SELECT id FROM q WHERE position = 53), 1,
    'Le sacré est partout, dans le quotidien.',
    'The sacred is everywhere, in the everyday.',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 53), 2,
    'Le sacré est plutôt dans des lieux, des rituels, des temps forts.',
    'The sacred is mainly in places, rituals, strong moments.',
    '{"magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 53), 3,
    'Je ne sais pas vraiment ce que cela veut dire.',
    'I don’t really know what that means.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 53), 4,
    'Je ne crois pas au sacré.',
    'I don’t believe in the sacred.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q54 likert_scale
  (
    (SELECT id FROM q WHERE position = 54), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 54), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 54), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 54), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 54), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"mystic": 2}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q55 single_choice
  (
    (SELECT id FROM q WHERE position = 55), 1,
    'Je cherche d’abord à l’intérieur de moi.',
    'I first look inside myself.',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 55), 2,
    'Je vais vers mes proches.',
    'I go to my loved ones.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 55), 3,
    'Je vais vers des ressources professionnelles.',
    'I go to professional resources.',
    '{"healer": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 55), 4,
    'Je m’anesthésie ou je fuis.',
    'I numb myself or flee.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q57 single_choice
  (
    (SELECT id FROM q WHERE position = 57), 1,
    'Je note et j’observe ce qui se répète.',
    'I note it and observe what repeats.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 57), 2,
    'Je le raconte et je demande des avis.',
    'I tell it and ask for opinions.',
    '{"lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 57), 3,
    'Je le balaye vite, de peur de me raconter des histoires.',
    'I dismiss it quickly, afraid of making up stories.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 57), 4,
    'Je le prends comme une direction presque immédiate.',
    'I take it almost immediately as guidance.',
    '{"magician": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q58 multiple_choice (spiritual archetypes)
  (
    (SELECT id FROM q WHERE position = 58), 1,
    'Mystique / chercheur spirituel.',
    'Mystic / spiritual seeker.',
    '{"mystic": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 58), 2,
    'Guérisseur·se.',
    'Healer.',
    '{"healer": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 58), 3,
    'Sage / enseignant·e.',
    'Sage / teacher.',
    '{"sage": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 58), 4,
    'Créateur·rice / visionnaire.',
    'Creator / visionary.',
    '{"creator": 2, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q59 single_choice
  (
    (SELECT id FROM q WHERE position = 59), 1,
    'Très importante : je les consulte souvent.',
    'Very important: I consult them often.',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 59), 2,
    'Présente mais secondaire.',
    'Present but secondary.',
    '{}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 59), 3,
    'Peu présente dans mes choix.',
    'Barely present in my choices.',
    '{}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 59), 4,
    'Absente : je m’en méfie.',
    'Absent: I mistrust it.',
    '{}'::jsonb,
    '{"saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q60 single_choice (healing image)
  (
    (SELECT id FROM q WHERE position = 60), 1,
    'Une présence qui tient l’espace et écoute.',
    'A presence that holds space and listens.',
    '{"healer": 2, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 60), 2,
    'Une énergie qui traverse le corps.',
    'An energy moving through the body.',
    '{"mystic": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 60), 3,
    'Un processus long avec des étapes et une discipline.',
    'A long process with stages and discipline.',
    '{"warrior": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 60), 4,
    'Un déclic soudain qui change tout.',
    'A sudden shift that changes everything.',
    '{"magician": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q61 single_choice (change_reaction)
  (
    (SELECT id FROM q WHERE position = 61), 1,
    'Un élan d’excitation.',
    'A surge of excitement.',
    '{"explorer": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 61), 2,
    'Une contraction ou une peur dans le corps.',
    'A contraction or fear in the body.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 61), 3,
    'Une envie de tout contrôler.',
    'An urge to control everything.',
    '{"warrior": 1}'::jsonb,
    '{"control": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 61), 4,
    'Une sorte de calme curieux.',
    'A kind of calm curiosity.',
    '{"sage": 1, "mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q62 multiple_choice (transition_resources)
  (
    (SELECT id FROM q WHERE position = 62), 1,
    'Mon réseau de soutien humain.',
    'My human support network.',
    '{"lover": 1, "caregiver": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 62), 2,
    'Mes ressources intérieures et spirituelles.',
    'My inner and spiritual resources.',
    '{"mystic": 1, "sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 62), 3,
    'Une structure, des routines ou des rituels.',
    'Structure, routines or rituals.',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 62), 4,
    'L’action : rester en mouvement.',
    'Action: staying in motion.',
    '{"warrior": 1, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q64 single_choice
  (
    (SELECT id FROM q WHERE position = 64), 1,
    'Je m’agrippe encore plus à l’ancien.',
    'I cling even more to the old.',
    '{}'::jsonb,
    '{"control": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 64), 2,
    'Je casse tout pour repartir à zéro.',
    'I break everything to start from scratch.',
    '{"rebel": 2}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 64), 3,
    'Je fais de petits tests pour voir ce qui peut émerger.',
    'I run small tests to see what can emerge.',
    '{"explorer": 1, "creator": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 64), 4,
    'Je reste figé(e) longtemps avant d’agir.',
    'I stay frozen for a long time before acting.',
    '{}'::jsonb,
    '{"victim": 1, "saboteur": 1}'::jsonb,
    NULL
  ),

  -- Q65 likert_scale
  (
    (SELECT id FROM q WHERE position = 65), 1,
    'Pas du tout d’accord',
    'Strongly disagree',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    1
  ),
  (
    (SELECT id FROM q WHERE position = 65), 2,
    'Plutôt pas d’accord',
    'Somewhat disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    2
  ),
  (
    (SELECT id FROM q WHERE position = 65), 3,
    'Ni d’accord ni en désaccord',
    'Neither agree nor disagree',
    '{}'::jsonb,
    '{}'::jsonb,
    3
  ),
  (
    (SELECT id FROM q WHERE position = 65), 4,
    'Plutôt d’accord',
    'Somewhat agree',
    '{"warrior": 1}'::jsonb,
    '{}'::jsonb,
    4
  ),
  (
    (SELECT id FROM q WHERE position = 65), 5,
    'Tout à fait d’accord',
    'Strongly agree',
    '{"warrior": 2, "explorer": 1}'::jsonb,
    '{}'::jsonb,
    5
  ),

  -- Q66 single_choice
  (
    (SELECT id FROM q WHERE position = 66), 1,
    'Tu vois, tu n’y arriveras jamais.',
    'See, you will never make it.',
    '{}'::jsonb,
    '{"saboteur": 2}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 66), 2,
    'Ok, qu’est-ce que j’apprends ici ?',
    'Ok, what am I learning here?',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 66), 3,
    'Ce n’est pas ta faute, c’est le contexte.',
    'It’s not your fault, it’s the context.',
    '{}'::jsonb,
    '{"victim": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 66), 4,
    'On recommence, différemment.',
    'Let’s start again, differently.',
    '{"warrior": 1, "creator": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q67 ranking (change_attitudes)
  (
    (SELECT id FROM q WHERE position = 67), 1,
    'Prudence et gestion des risques.',
    'Caution and risk management.',
    '{"sage": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 67), 2,
    'Courage et passage à l’action.',
    'Courage and taking action.',
    '{"warrior": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 67), 3,
    'Curiosité et exploration.',
    'Curiosity and exploration.',
    '{"explorer": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 67), 4,
    'Foi et abandon au processus.',
    'Faith and surrender to the process.',
    '{"mystic": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q68 single_choice
  (
    (SELECT id FROM q WHERE position = 68), 1,
    'Un statut ou une identité.',
    'A status or identity.',
    '{"sovereign": 1}'::jsonb,
    '{"prostitute": 1}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 68), 2,
    'Une relation ou un lien.',
    'A relationship or bond.',
    '{"lover": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 68), 3,
    'Une sécurité matérielle.',
    'Material security.',
    '{"sovereign": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 68), 4,
    'Une croyance ou un récit sur toi-même.',
    'A belief or story about yourself.',
    '{"sage": 1, "magician": 1}'::jsonb,
    '{}'::jsonb,
    NULL
  ),

  -- Q69 single_choice (edge_archetype)
  (
    (SELECT id FROM q WHERE position = 69), 1,
    'Le / la Guerrier·e.',
    'The Warrior.',
    '{"warrior": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 69), 2,
    'L’Explorateur·rice.',
    'The Explorer.',
    '{"explorer": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 69), 3,
    'Le / la Rebelle.',
    'The Rebel.',
    '{"rebel": 3}'::jsonb,
    '{}'::jsonb,
    NULL
  ),
  (
    (SELECT id FROM q WHERE position = 69), 4,
    'La Victime ou le Saboteur.',
    'The Victim or Saboteur.',
    '{}'::jsonb,
    '{"victim": 2, "saboteur": 2}'::jsonb,
    NULL
  );