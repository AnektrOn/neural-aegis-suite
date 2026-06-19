-- Guest/member onboarding copy: 30-question archetype quiz (no T1/V4 version labels in UI).

UPDATE public.assessment_templates
SET
  version = 4,
  title_fr = 'Quiz archétypal',
  title_en = 'Archetype quiz',
  description_fr = '30 questions pour cartographier tes 32 pôles archétypaux — lumière, ombre et survie.',
  description_en = '30 questions to map your 32 archetypal poles — light, shadow and survival.',
  updated_at = now()
WHERE slug = 'archetype-v1';
