-- Optional DB fix: set distinct EN titles for known FR-only / duplicate FR=EN toolbox template titles.
-- No JSON re-import required. Extend the VALUES list if you add more seeded French-only titles.

UPDATE public.toolbox_templates t
SET title_i18n = jsonb_build_object('fr', v.fr, 'en', v.en)
FROM (
  VALUES
    ('Posture de Redéploiement', 'Redeployment posture'),
    ('Focus sur l''Objet Unique', 'Focus on the single object'),
    ('S.T.O.P. Saturation', 'S.T.O.P. saturation'),
    ('Intention de Micro-Cycle', 'Micro-cycle intention')
) AS v(fr text, en text)
WHERE trim(t.title) = v.fr
  AND (
    t.title_i18n IS NULL
    OR t.title_i18n = '{}'::jsonb
    OR coalesce(trim(t.title_i18n->>'en'), '') = ''
    OR trim(coalesce(t.title_i18n->>'en', '')) = trim(coalesce(t.title_i18n->>'fr', ''))
  );
