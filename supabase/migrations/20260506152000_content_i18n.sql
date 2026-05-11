-- Content i18n: store FR+EN variants for user-facing content.
-- This migration is intentionally additive (backward compatible).

-- Toolbox templates
ALTER TABLE public.toolbox_templates
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.toolbox_templates
SET
  title_i18n = CASE
    WHEN title_i18n = '{}'::jsonb OR title_i18n IS NULL
      THEN jsonb_build_object('fr', title, 'en', title)
    ELSE title_i18n
  END,
  description_i18n = CASE
    WHEN description IS NULL THEN description_i18n
    WHEN description_i18n = '{}'::jsonb OR description_i18n IS NULL
      THEN jsonb_build_object('fr', description, 'en', description)
    ELSE description_i18n
  END;

-- Toolbox assignments
ALTER TABLE public.toolbox_assignments
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.toolbox_assignments
SET
  title_i18n = CASE
    WHEN title_i18n = '{}'::jsonb OR title_i18n IS NULL
      THEN jsonb_build_object('fr', title, 'en', title)
    ELSE title_i18n
  END,
  description_i18n = CASE
    WHEN description IS NULL THEN description_i18n
    WHEN description_i18n = '{}'::jsonb OR description_i18n IS NULL
      THEN jsonb_build_object('fr', description, 'en', description)
    ELSE description_i18n
  END;

-- Journal prompt templates
ALTER TABLE public.journal_prompt_templates
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_text_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.journal_prompt_templates
SET
  title_i18n = CASE
    WHEN title_i18n = '{}'::jsonb OR title_i18n IS NULL
      THEN jsonb_build_object('fr', title, 'en', title)
    ELSE title_i18n
  END,
  prompt_text_i18n = CASE
    WHEN prompt_text_i18n = '{}'::jsonb OR prompt_text_i18n IS NULL
      THEN jsonb_build_object('fr', prompt_text, 'en', prompt_text)
    ELSE prompt_text_i18n
  END;

-- Journal prompts (user instances)
ALTER TABLE public.journal_prompts
  ADD COLUMN IF NOT EXISTS prompt_text_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.journal_prompts
SET
  prompt_text_i18n = CASE
    WHEN prompt_text_i18n = '{}'::jsonb OR prompt_text_i18n IS NULL
      THEN jsonb_build_object('fr', prompt_text, 'en', prompt_text)
    ELSE prompt_text_i18n
  END;

-- Habit templates
ALTER TABLE public.habit_templates
  ADD COLUMN IF NOT EXISTS name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.habit_templates
SET
  name_i18n = CASE
    WHEN name_i18n = '{}'::jsonb OR name_i18n IS NULL
      THEN jsonb_build_object('fr', name, 'en', name)
    ELSE name_i18n
  END,
  description_i18n = CASE
    WHEN description IS NULL THEN description_i18n
    WHEN description_i18n = '{}'::jsonb OR description_i18n IS NULL
      THEN jsonb_build_object('fr', description, 'en', description)
    ELSE description_i18n
  END;

-- Library videos
ALTER TABLE public.library_videos
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.library_videos
SET
  title_i18n = CASE
    WHEN title_i18n = '{}'::jsonb OR title_i18n IS NULL
      THEN jsonb_build_object('fr', title, 'en', title)
    ELSE title_i18n
  END,
  description_i18n = CASE
    WHEN description IS NULL THEN description_i18n
    WHEN description_i18n = '{}'::jsonb OR description_i18n IS NULL
      THEN jsonb_build_object('fr', description, 'en', description)
    ELSE description_i18n
  END;

