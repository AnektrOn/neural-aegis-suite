-- =========================================================================
-- CHANGE 1: context_tags on appendix_questions
-- =========================================================================
ALTER TABLE public.appendix_questions
  ADD COLUMN IF NOT EXISTS context_tags TEXT[] NOT NULL DEFAULT '{}';

-- Tag questions based on their category slug
UPDATE public.appendix_questions q
SET context_tags = ARRAY['manager', 'founder', 'team_lead']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'leadership_style';

UPDATE public.appendix_questions q
SET context_tags = ARRAY['career_transition', 'founder', 'senior']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'purpose_legacy';

UPDATE public.appendix_questions q
SET context_tags = ARRAY['career_transition', 'entrepreneur', 'explorer']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'change_risk';

UPDATE public.appendix_questions q
SET context_tags = ARRAY['all']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'shadow_patterns';

UPDATE public.appendix_questions q
SET context_tags = ARRAY['all']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'relational_dynamics';

UPDATE public.appendix_questions q
SET context_tags = ARRAY['spiritual', 'coach', 'healer_profile']
FROM public.appendix_categories c
WHERE q.category_id = c.id AND c.slug = 'intuition_spirituality';

-- =========================================================================
-- CHANGE 2: score_version on appendix_responses
-- =========================================================================
ALTER TABLE public.appendix_responses
  ADD COLUMN IF NOT EXISTS score_version INTEGER NOT NULL DEFAULT 1;

-- =========================================================================
-- CHANGE 3: Performance indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_appendix_responses_user_session
  ON public.appendix_responses (user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_appendix_questions_category
  ON public.appendix_questions (category_id, position);

CREATE INDEX IF NOT EXISTS idx_appendix_options_question
  ON public.appendix_options (question_id, position);

-- =========================================================================
-- CHANGE 4: Materialized view for archetype scores
-- =========================================================================
-- Note: response id added to the unique index so each (response, option) pair
-- is unique — required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.archetype_scores_by_user AS
SELECT
  r.id            AS response_id,
  r.user_id,
  r.session_id,
  o.id            AS option_id,
  o.question_id,
  o.archetype_weights,
  o.shadow_weights,
  r.created_at
FROM public.appendix_responses r
JOIN public.appendix_options o
  ON o.id = ANY(r.selected_option_ids)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_archetype_scores_user_session
  ON public.archetype_scores_by_user (response_id, option_id);

CREATE INDEX IF NOT EXISTS idx_archetype_scores_user
  ON public.archetype_scores_by_user (user_id, session_id);

-- Helper function the app can call after a completed assessment session.
CREATE OR REPLACE FUNCTION public.refresh_archetype_scores_by_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.archetype_scores_by_user;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: first refresh cannot be concurrent; do a plain refresh.
  REFRESH MATERIALIZED VIEW public.archetype_scores_by_user;
END;
$$;

-- =========================================================================
-- CHANGE 5: Sensitive flag for qualitative short_text responses
-- =========================================================================
-- pgcrypto-based encryption is NOT applied here: no `app.encryption_key`
-- GUC is configured for this project, and storing a key in the DB would
-- defeat the purpose. Instead, we tag qualitative responses in raw_payload
-- with {"sensitive": true, "retention_days": 365} so the app layer can
-- enforce retention and (later) client-side encryption.
UPDATE public.appendix_responses r
SET raw_payload = COALESCE(r.raw_payload, '{}'::jsonb)
                  || jsonb_build_object('sensitive', true, 'retention_days', 365)
FROM public.appendix_questions q
WHERE r.question_id = q.id
  AND q.question_type = 'short_text'
  AND (q.meta->>'qualitative') = 'true'
  AND COALESCE((r.raw_payload->>'sensitive')::boolean, false) IS DISTINCT FROM true;
