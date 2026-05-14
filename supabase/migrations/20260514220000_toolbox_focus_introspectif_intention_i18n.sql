-- focus_introspectif widgets read intention via pickLocalizedText(intention_i18n, intention).
-- Catalog rows only had French `intention`, so EN locale still showed FR inside the widget.

UPDATE public.toolbox_templates
SET widget_config = jsonb_set(
  widget_config,
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Fix your gaze on a neutral object without judgment to strengthen convergent concentration.'
  ),
  true
)
WHERE external_key = 'focus-objet-unique'
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false);

UPDATE public.toolbox_templates
SET widget_config = jsonb_set(
  widget_config,
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Look away from the screen to sense volume and space to your left, right, and above, breaking convergent stress attention.'
  ),
  true
)
WHERE external_key = 'switch-divergent'
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false);

UPDATE public.toolbox_templates
SET widget_config = jsonb_set(
  widget_config,
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Picture your day not as a line of tasks but as one still point to step out of time pressure.'
  ),
  true
)
WHERE external_key = 'retraite-point-statique'
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false);

-- Assignments cloned from these templates: copy intention_i18n from catalog
UPDATE public.toolbox_assignments a
SET widget_config = coalesce(a.widget_config, '{}'::jsonb) || jsonb_build_object(
  'intention_i18n', tpl.widget_config->'intention_i18n'
)
FROM public.toolbox_templates tpl
WHERE a.template_id = tpl.id
  AND tpl.external_key IN ('focus-objet-unique', 'switch-divergent', 'retraite-point-statique')
  AND tpl.widget_config ? 'intention_i18n'
  AND a.content_type = 'focus_introspectif';

-- Orphan assignments (no template_id): match French display title (avoids apostrophe mismatches on intention text)
UPDATE public.toolbox_assignments
SET widget_config = jsonb_set(
  coalesce(widget_config, '{}'::jsonb),
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Fix your gaze on a neutral object without judgment to strengthen convergent concentration.'
  ),
  true
)
WHERE template_id IS NULL
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false)
  AND coalesce(trim(title_i18n->>'fr'), trim(title)) = 'Focus sur l''Objet Unique';

UPDATE public.toolbox_assignments
SET widget_config = jsonb_set(
  coalesce(widget_config, '{}'::jsonb),
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Look away from the screen to sense volume and space to your left, right, and above, breaking convergent stress attention.'
  ),
  true
)
WHERE template_id IS NULL
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false)
  AND coalesce(trim(title_i18n->>'fr'), trim(title)) = 'Le Switch Divergent';

UPDATE public.toolbox_assignments
SET widget_config = jsonb_set(
  coalesce(widget_config, '{}'::jsonb),
  '{intention_i18n}',
  jsonb_build_object(
    'fr', widget_config->>'intention',
    'en',
    'Picture your day not as a line of tasks but as one still point to step out of time pressure.'
  ),
  true
)
WHERE template_id IS NULL
  AND content_type = 'focus_introspectif'
  AND widget_config ? 'intention'
  AND NOT coalesce(widget_config ? 'intention_i18n', false)
  AND coalesce(trim(title_i18n->>'fr'), trim(title)) = 'La Retraite du Point Statique';
