-- Add house column (1..12 Myss houses) to assessment_questions
ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS house INTEGER;

ALTER TABLE public.assessment_questions
  DROP CONSTRAINT IF EXISTS assessment_questions_house_range;

ALTER TABLE public.assessment_questions
  ADD CONSTRAINT assessment_questions_house_range
  CHECK (house IS NULL OR (house BETWEEN 1 AND 12));

CREATE INDEX IF NOT EXISTS idx_assessment_questions_template_house
  ON public.assessment_questions(template_id, house);

-- Create the Aegis V2 (70Q deep dive) template, alongside V1 (30Q quick scan)
INSERT INTO public.assessment_templates (slug, version, is_active, title_fr, title_en, description_fr, description_en)
VALUES (
  'archetype-v2-70q',
  2,
  true,
  'Aegis Deep Dive — 70 questions',
  'Aegis Deep Dive — 70 questions',
  'Évaluation approfondie en 70 questions, structurée selon les 12 maisons archétypales de Caroline Myss. Distingue lumière et ombre par archétype.',
  'In-depth 70-question assessment, structured along Caroline Myss'' 12 archetypal houses. Distinguishes light and shadow per archetype.'
)
ON CONFLICT (slug) DO UPDATE SET
  version = EXCLUDED.version,
  is_active = EXCLUDED.is_active,
  title_fr = EXCLUDED.title_fr,
  title_en = EXCLUDED.title_en,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  updated_at = now();