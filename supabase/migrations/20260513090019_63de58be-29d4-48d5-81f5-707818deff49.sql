
-- 1) Templates: set both fr and en titles
WITH t(fr, en) AS (VALUES
  ('L''Ancrage de Volonté',               'The Will Anchor'),
  ('Ancrage de l''Identité de Décision',  'Decision Identity Anchor'),
  ('Le Shift Spinal',                     'The Spinal Shift'),
  ('Scan de Tension Résiduelle',          'Residual Tension Scan'),
  ('La Cadence de Résonance (0,10 Hz)',   'Resonance Cadence (0.10 Hz)'),
  ('Le Souffle du Sternum',               'The Sternum Breath'),
  ('Respiration Carrée (Box Breathing)',  'Box Breathing'),
  ('Le Switch Divergent',                 'The Divergent Switch'),
  ('La Retraite du Point Statique',       'The Static Point Retreat'),
  ('Focus sur l''Objet Unique',           'Single Object Focus'),
  ('Gratitude Stratégique',               'Strategic Gratitude'),
  ('Intention de Micro-Cycle',            'Micro-cycle Intention'),
  ('La Réallocation Stratégique',         'Strategic Reallocation'),
  ('Le Reset Vagal Oculaire',             'Ocular Vagal Reset'),
  ('Posture de Redéploiement',            'Redeployment Posture'),
  ('Le Verrou d''Isolation',              'The Isolation Lock'),
  ('Le Bouclier IgA',                     'The IgA Shield'),
  ('S.T.O.P. Saturation',                 'S.T.O.P. Saturation'),
  ('Le Flash de Pré-Accomplissement',     'Pre-Accomplishment Flash'),
  ('Le Flux Syntropique',                 'The Syntropic Flow')
)
UPDATE public.toolbox_templates tpl
SET title_i18n = jsonb_build_object('fr', t.fr, 'en', t.en)
FROM t
WHERE tpl.title_i18n->>'fr' = t.fr
   OR tpl.title = t.fr;

-- 2) Assignments linked to a template inherit the template's title_i18n
UPDATE public.toolbox_assignments a
SET title_i18n = tpl.title_i18n
FROM public.toolbox_templates tpl
WHERE a.template_id = tpl.id
  AND tpl.title_i18n ? 'en'
  AND tpl.title_i18n ? 'fr';

-- 3) Orphan assignments (no template_id): match by FR title
WITH t(fr, en) AS (VALUES
  ('Affirmations',                        'Affirmations'),
  ('Le Shift Spinal',                     'The Spinal Shift'),
  ('Respiration Carrée (Box Breathing)',  'Box Breathing'),
  ('Posture de Redéploiement',            'Redeployment Posture'),
  ('Le Souffle du Sternum',               'The Sternum Breath'),
  ('Le Bouclier IgA',                     'The IgA Shield'),
  ('Le Verrou d''Isolation',              'The Isolation Lock'),
  ('La Réallocation Stratégique',         'Strategic Reallocation'),
  ('Intention de Micro-Cycle',            'Micro-cycle Intention'),
  ('Body scan',                           'Body Scan'),
  ('Breathwork 1 cycles',                 'Breathwork — 1 cycle'),
  ('Breathwork 4 cycles',                 'Breathwork — 4 cycles'),
  ('Check-in de gratitude',               'Gratitude Check-in'),
  ('Gratitude Check-in',                  'Gratitude Check-in'),
  ('Invite de journal',                   'Journal Prompt'),
  ('Journal Prompt',                      'Journal Prompt')
)
UPDATE public.toolbox_assignments a
SET title_i18n = jsonb_build_object('fr', t.fr, 'en', t.en)
FROM t
WHERE (a.title_i18n->>'fr' = t.fr OR a.title = t.fr);
