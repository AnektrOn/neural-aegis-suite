-- Caroline Myss T1 onboarding: polarity weights + reseed trigger (app seeds from TS on empty).

ALTER TABLE public.assessment_options
  ADD COLUMN IF NOT EXISTS polarity_weights JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.assessment_options.polarity_weights IS
  'T1 scoring vectors: [{archetype, polarity, weight}] with light/shadow per archetype.';

-- Wipe legacy 30-question bank so loadActiveTemplate() re-seeds QUESTIONS_T1 from TS.
DELETE FROM public.assessment_options
WHERE question_id IN (
  SELECT q.id
  FROM public.assessment_questions q
  JOIN public.assessment_templates t ON t.id = q.template_id
  WHERE t.slug = 'archetype-v1'
    AND COALESCE((q.meta->>'is_appendix')::boolean, false) = false
);

DELETE FROM public.assessment_questions
WHERE template_id = (SELECT id FROM public.assessment_templates WHERE slug = 'archetype-v1' LIMIT 1)
  AND COALESCE((meta->>'is_appendix')::boolean, false) = false;

UPDATE public.assessment_templates
SET
  version = 2,
  title_fr = 'Questionnaire Caroline Myss T1',
  title_en = 'Caroline Myss T1 Questionnaire',
  description_fr = '15 questions d''onboarding — sélection multiple pondérée par l''intensité (1 à 3).',
  description_en = '15 onboarding questions — weighted multiple choice with intensity (1 to 3).',
  updated_at = now()
WHERE slug = 'archetype-v1';
