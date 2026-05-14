-- Card descriptions for "Le Switch Divergent" were backfilled with rumination-focused copy.
-- Align FR/EN with the actual focus_introspectif intention (peripheral space / convergent stress).

UPDATE public.toolbox_templates
SET description_i18n = jsonb_build_object(
  'fr',
  'Détachez le regard de l''écran pour percevoir les volumes et l''espace à gauche, à droite et au-dessus, afin de briser l''attention convergente du stress.',
  'en',
  'Look away from the screen to sense volume and space to your left, right, and above, breaking the convergent attention pattern of stress.'
)
WHERE external_key = 'switch-divergent';

UPDATE public.toolbox_assignments a
SET description_i18n = tpl.description_i18n
FROM public.toolbox_templates tpl
WHERE a.template_id = tpl.id
  AND tpl.external_key = 'switch-divergent';

UPDATE public.toolbox_assignments
SET description_i18n = jsonb_build_object(
  'fr',
  'Détachez le regard de l''écran pour percevoir les volumes et l''espace à gauche, à droite et au-dessus, afin de briser l''attention convergente du stress.',
  'en',
  'Look away from the screen to sense volume and space to your left, right, and above, breaking the convergent attention pattern of stress.'
)
WHERE template_id IS NULL
  AND coalesce(trim(title_i18n->>'fr'), trim(title)) = 'Le Switch Divergent';
