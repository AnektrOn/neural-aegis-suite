-- Bilingual toolbox descriptions: keep existing FR text when present; set proper EN (and FR fallback when empty).
-- Matches catalog tools by French display title (same keys as 20260513090019 title backfill).

WITH t(fr_title, desc_fr, desc_en) AS (
  VALUES
    ('L''Ancrage de Volonté',
      'Ancrez votre présence et stabilisez l’action volontaire avant une décision importante.',
      'Ground your presence and stabilize volitional action before an important decision.'),
    ('Ancrage de l''Identité de Décision',
      'Clarifiez le cadre interne à partir duquel vous engagez un choix conscient.',
      'Clarify the internal frame from which you commit to a conscious choice.'),
    ('Le Shift Spinal',
      'Libérez des tensions portées au niveau du tronc et retrouvez une base posturale plus fluide.',
      'Release tension held in the trunk and return to a more fluid postural base.'),
    ('Scan de Tension Résiduelle',
      'Cartographiez les zones de charge persistante pour les décharger progressivement.',
      'Map areas of persistent charge so you can unload them gradually.'),
    ('La Cadence de Résonance (0,10 Hz)',
      'Ralentissez le rythme respiratoire vers une fréquence cardiovagalement favorable.',
      'Slow breathing toward a cardio-vagally favorable cadence.'),
    ('Le Souffle du Sternum',
      'Dirigez l’air et l’attention vers la cage thoracique pour apaiser l’arousal.',
      'Direct breath and attention through the rib cage to soothe arousal.'),
    ('Respiration Carrée (Box Breathing)',
      'Structurez inhale, pauses et exhale en durées égales pour réguler le système nerveux.',
      'Structure inhale, holds, and exhale in equal counts to regulate the nervous system.'),
    ('Le Switch Divergent',
      'Basculez volontairement l’attention pour sortir d’un piège cognitif de rumination.',
      'Voluntarily shift attention to break out of a rumination cognitive loop.'),
    ('La Retraite du Point Statique',
      'Retirez le regard de la fixation unique pour élargir le champ perceptif et décompresser.',
      'Pull gaze off a single fixation to widen the perceptual field and decompress.'),
    ('Focus sur l''Objet Unique',
      'Stabilisez l’attention sur un seul objet pour renforcer la capacité de concentration soutenue.',
      'Hold attention on a single object to strengthen sustained concentration.'),
    ('Gratitude Stratégique',
      'Identifiez des ressources réelles et orientées action pour contrebalancer un biais défensif.',
      'Name real, action-oriented resources to counterbalance a defensive bias.'),
    ('Intention de Micro-Cycle',
      'Formulez une intention courte, mesurable, calée sur les prochaines minutes ou heures.',
      'Set a short, measurable intention anchored to the next minutes or hours.'),
    ('La Réallocation Stratégique',
      'Redistribuez mentalement l’énergie entre priorités pour réduire la dispersion cognitive.',
      'Redistribute mental energy across priorities to reduce cognitive scatter.'),
    ('Le Reset Vagal Oculaire',
      'Utilisez des micromouvements oculaires et pauses pour relancer la modulation vagale.',
      'Use tiny eye movements and pauses to reboot vagal modulation.'),
    ('Posture de Redéploiement',
      'Adoptez une posture ouverte compatible avec un passage à l’action plus souple.',
      'Adopt an open posture that supports smoother mobilization into action.'),
    ('Le Verrou d''Isolation',
      'Tracez une frontière claire entre ce qui est à vous et ce qui ne l’est pas.',
      'Draw a clear boundary between what is yours and what is not.'),
    ('Le Bouclier IgA',
      'Renforcez le sentiment de protection immunitaire et psychique par visualisation guidée.',
      'Strengthen a sense of immune and psychological protection through guided visualization.'),
    ('S.T.O.P. Saturation',
      'Appliquez la séquence STOP pour freiner la saturation émotionnelle avant d’agir.',
      'Run the STOP sequence to brake emotional saturation before acting.'),
    ('Le Flash de Pré-Accomplissement',
      'Visualisez brièvement l’état déjà atteint pour aligner motivation et calme physiologique.',
      'Briefly visualize the state already achieved to align motivation with physiological calm.'),
    ('Le Flux Syntropique',
      'Connectez-vous à une dynamique de coopération et de valeur ajoutée mutuelle.',
      'Connect to a dynamic of cooperation and mutually added value.')
)
UPDATE public.toolbox_templates tpl
SET description_i18n = jsonb_build_object(
  'fr', coalesce(
    nullif(trim(tpl.description_i18n->>'fr'), ''),
    nullif(trim(tpl.description), ''),
    t.desc_fr
  ),
  'en', t.desc_en
)
FROM t
WHERE coalesce(trim(tpl.title_i18n->>'fr'), trim(tpl.title)) = t.fr_title;

-- Assignments created from a template: inherit the template’s bilingual description
UPDATE public.toolbox_assignments a
SET description_i18n = tpl.description_i18n
FROM public.toolbox_templates tpl
WHERE a.template_id = tpl.id
  AND tpl.description_i18n ? 'en'
  AND tpl.description_i18n ? 'fr';

-- Orphan assignments (no template_id): same title map as titles in 20260513090019 orphans block
WITH t(fr_title, desc_fr, desc_en) AS (
  VALUES
    ('L''Ancrage de Volonté',
      'Ancrez votre présence et stabilisez l’action volontaire avant une décision importante.',
      'Ground your presence and stabilize volitional action before an important decision.'),
    ('Ancrage de l''Identité de Décision',
      'Clarifiez le cadre interne à partir duquel vous engagez un choix conscient.',
      'Clarify the internal frame from which you commit to a conscious choice.'),
    ('Le Shift Spinal',
      'Libérez des tensions portées au niveau du tronc et retrouvez une base posturale plus fluide.',
      'Release tension held in the trunk and return to a more fluid postural base.'),
    ('Scan de Tension Résiduelle',
      'Cartographiez les zones de charge persistante pour les décharger progressivement.',
      'Map areas of persistent charge so you can unload them gradually.'),
    ('La Cadence de Résonance (0,10 Hz)',
      'Ralentissez le rythme respiratoire vers une fréquence cardiovagalement favorable.',
      'Slow breathing toward a cardio-vagally favorable cadence.'),
    ('Le Souffle du Sternum',
      'Dirigez l’air et l’attention vers la cage thoracique pour apaiser l’arousal.',
      'Direct breath and attention through the rib cage to soothe arousal.'),
    ('Respiration Carrée (Box Breathing)',
      'Structurez inhale, pauses et exhale en durées égales pour réguler le système nerveux.',
      'Structure inhale, holds, and exhale in equal counts to regulate the nervous system.'),
    ('Le Switch Divergent',
      'Basculez volontairement l’attention pour sortir d’un piège cognitif de rumination.',
      'Voluntarily shift attention to break out of a rumination cognitive loop.'),
    ('La Retraite du Point Statique',
      'Retirez le regard de la fixation unique pour élargir le champ perceptif et décompresser.',
      'Pull gaze off a single fixation to widen the perceptual field and decompress.'),
    ('Focus sur l''Objet Unique',
      'Stabilisez l’attention sur un seul objet pour renforcer la capacité de concentration soutenue.',
      'Hold attention on a single object to strengthen sustained concentration.'),
    ('Gratitude Stratégique',
      'Identifiez des ressources réelles et orientées action pour contrebalancer un biais défensif.',
      'Name real, action-oriented resources to counterbalance a defensive bias.'),
    ('Intention de Micro-Cycle',
      'Formulez une intention courte, mesurable, calée sur les prochaines minutes ou heures.',
      'Set a short, measurable intention anchored to the next minutes or hours.'),
    ('La Réallocation Stratégique',
      'Redistribuez mentalement l’énergie entre priorités pour réduire la dispersion cognitive.',
      'Redistribute mental energy across priorities to reduce cognitive scatter.'),
    ('Le Reset Vagal Oculaire',
      'Utilisez des micromouvements oculaires et pauses pour relancer la modulation vagale.',
      'Use tiny eye movements and pauses to reboot vagal modulation.'),
    ('Posture de Redéploiement',
      'Adoptez une posture ouverte compatible avec un passage à l’action plus souple.',
      'Adopt an open posture that supports smoother mobilization into action.'),
    ('Le Verrou d''Isolation',
      'Tracez une frontière claire entre ce qui est à vous et ce qui ne l’est pas.',
      'Draw a clear boundary between what is yours and what is not.'),
    ('Le Bouclier IgA',
      'Renforcez le sentiment de protection immunitaire et psychique par visualisation guidée.',
      'Strengthen a sense of immune and psychological protection through guided visualization.'),
    ('S.T.O.P. Saturation',
      'Appliquez la séquence STOP pour freiner la saturation émotionnelle avant d’agir.',
      'Run the STOP sequence to brake emotional saturation before acting.'),
    ('Le Flash de Pré-Accomplissement',
      'Visualisez brièvement l’état déjà atteint pour aligner motivation et calme physiologique.',
      'Briefly visualize the state already achieved to align motivation with physiological calm.'),
    ('Le Flux Syntropique',
      'Connectez-vous à une dynamique de coopération et de valeur ajoutée mutuelle.',
      'Connect to a dynamic of cooperation and mutually added value.'),
    ('Affirmations',
      'Répétez des phrases d''ancrage choisies pour renforcer une narration interne utile.',
      'Repeat chosen grounding phrases to reinforce a helpful inner narrative.'),
    ('Body scan',
      'Parcourez le corps zone par zone pour remarquer sensations et tensions sans les forcer.',
      'Move through the body area by area, noticing sensations and tension without forcing change.'),
    ('Breathwork 1 cycles',
      'Une courte séquence respiratoire guidée pour calmer le système nerveux.',
      'A short guided breathing sequence to calm the nervous system.'),
    ('Breathwork 4 cycles',
      'Quatre cycles respiratoires structurés pour approfondir la régulation.',
      'Four structured breathing cycles to deepen regulation.'),
    ('Check-in de gratitude',
      'Notez ce qui soutient déjà votre journée pour élargir l''attention aux ressources présentes.',
      'Note what already supports your day to widen attention to present resources.'),
    ('Gratitude Check-in',
      'Notez ce qui soutient déjà votre journée pour élargir l''attention aux ressources présentes.',
      'Note what already supports your day to widen attention to present resources.'),
    ('Invite de journal',
      'Répondez à une question ciblée pour clarifier pensées et prochain pas.',
      'Answer a focused prompt to clarify thoughts and the next step.'),
    ('Journal Prompt',
      'Répondez à une question ciblée pour clarifier pensées et prochain pas.',
      'Answer a focused prompt to clarify thoughts and the next step.')
)
UPDATE public.toolbox_assignments a
SET description_i18n = jsonb_build_object(
  'fr', coalesce(
    nullif(trim(a.description_i18n->>'fr'), ''),
    nullif(trim(a.description), ''),
    t.desc_fr
  ),
  'en', t.desc_en
)
FROM t
WHERE a.template_id IS NULL
  AND coalesce(trim(a.title_i18n->>'fr'), trim(a.title)) = t.fr_title;
