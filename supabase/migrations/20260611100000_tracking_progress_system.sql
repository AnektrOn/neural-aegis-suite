-- =============================================================================
-- Tracking Progress System — Perspective Myss
-- Tables: tracking_perspectives, tracking_questions, tracking_daily_batches,
--         tracking_daily_responses, tracking_progress_snapshots
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perspectives catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_perspectives (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,          -- e.g. "myss-archetype"
  name_fr     text        NOT NULL,
  name_en     text        NOT NULL,
  description_fr text,
  description_en text,
  baseline_source text NOT NULL DEFAULT 'deepdive_70q',
  -- baseline_source ∈ 'deepdive_70q' | 'assessment_30q'
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.tracking_perspectives IS 'Catalogue of progress-tracking perspectives (e.g. Myss Archetype).';
COMMENT ON COLUMN public.tracking_perspectives.baseline_source IS 'Which initial questionnaire provides the baseline for this perspective.';

-- Seed the Myss Archetype perspective
INSERT INTO public.tracking_perspectives (slug, name_fr, name_en, description_fr, description_en, baseline_source, sort_order)
VALUES (
  'myss-archetype',
  'Perspective Myss — Archétypes',
  'Myss Perspective — Archetypes',
  'Suivi de l''évolution de votre profil archétypal selon le système Caroline Myss. Basé sur votre Deep Dive initial (70 questions).',
  'Track your archetypal profile evolution using the Caroline Myss system. Based on your initial Deep Dive (70 questions).',
  'deepdive_70q',
  0
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Question bank per perspective
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  perspective_id  uuid        NOT NULL REFERENCES public.tracking_perspectives(id) ON DELETE CASCADE,
  external_key    text        NOT NULL,             -- stable import key, e.g. "TQ-M-001"
  question_fr     text        NOT NULL,
  question_en     text        NOT NULL,
  question_type   text        NOT NULL DEFAULT 'scale',
  -- question_type ∈ 'scale' | 'choice' | 'text'
  scale_min       integer     DEFAULT 1,
  scale_max       integer     DEFAULT 10,
  options         jsonb       DEFAULT '[]'::jsonb,  -- [{value, label_fr, label_en, weights:[{archetype,polarity,weight}]}]
  archetype_target text,                            -- which archetype this primarily tracks
  house_target    integer,                          -- which Myss house (1..12)
  dimension_target text,                            -- 'light' | 'shadow' | 'general'
  weight          numeric     NOT NULL DEFAULT 1.0,
  is_active       boolean     NOT NULL DEFAULT true,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (perspective_id, external_key)
);

COMMENT ON TABLE  public.tracking_questions IS 'Question bank for each perspective''s daily tracking questionnaire.';
COMMENT ON COLUMN public.tracking_questions.options IS 'For choice questions: [{value, label_fr, label_en, weights:[{archetype,polarity,weight}]}]';

CREATE INDEX IF NOT EXISTS tracking_questions_perspective_idx
  ON public.tracking_questions (perspective_id, is_active, sort_order);

-- RLS
ALTER TABLE public.tracking_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can manage tracking_questions"
  ON public.tracking_questions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read active questions (needed for the check-in UI)
CREATE POLICY "users can read active tracking_questions"
  ON public.tracking_questions
  FOR SELECT
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- 3. Daily batches — which 3 questions are assigned per user per day
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_daily_batches (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perspective_id  uuid        NOT NULL REFERENCES public.tracking_perspectives(id) ON DELETE CASCADE,
  scheduled_date  date        NOT NULL,
  question_ids    uuid[]      NOT NULL DEFAULT '{}',   -- 3 question UUIDs
  status          text        NOT NULL DEFAULT 'pending',
  -- status ∈ 'pending' | 'answered' | 'missed'
  answered_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, perspective_id, scheduled_date)
);

COMMENT ON TABLE public.tracking_daily_batches IS '3-question daily batch assigned per user × perspective × date.';

CREATE INDEX IF NOT EXISTS tracking_daily_batches_user_date_idx
  ON public.tracking_daily_batches (user_id, scheduled_date DESC);

ALTER TABLE public.tracking_daily_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own daily batches"
  ON public.tracking_daily_batches
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins read all daily batches"
  ON public.tracking_daily_batches
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 4. Daily responses — user answers per question per batch
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_daily_responses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id        uuid        NOT NULL REFERENCES public.tracking_daily_batches(id) ON DELETE CASCADE,
  question_id     uuid        NOT NULL REFERENCES public.tracking_questions(id) ON DELETE CASCADE,
  response_date   date        NOT NULL,
  numeric_value   numeric,    -- for scale questions
  choice_value    text,       -- for choice questions (option value)
  text_value      text,       -- for text questions
  weights_applied jsonb DEFAULT '[]'::jsonb,
  -- denormalized weights snapshot: [{archetype, polarity, weight}]
  responded_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, question_id)
);

COMMENT ON TABLE  public.tracking_daily_responses IS 'User answers to daily tracking questions.';
COMMENT ON COLUMN public.tracking_daily_responses.weights_applied IS 'Snapshot of archetype weights at response time, for stable score computation.';

CREATE INDEX IF NOT EXISTS tracking_daily_responses_user_date_idx
  ON public.tracking_daily_responses (user_id, response_date DESC);

ALTER TABLE public.tracking_daily_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own tracking responses"
  ON public.tracking_daily_responses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins read all tracking responses"
  ON public.tracking_daily_responses
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Mark batch as answered when all 3 responses arrive
CREATE OR REPLACE FUNCTION public.update_batch_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_batch   record;
  v_count   integer;
BEGIN
  SELECT * INTO v_batch FROM public.tracking_daily_batches WHERE id = NEW.batch_id;
  SELECT COUNT(*) INTO v_count
    FROM public.tracking_daily_responses
    WHERE batch_id = NEW.batch_id;

  IF v_count >= array_length(v_batch.question_ids, 1) THEN
    UPDATE public.tracking_daily_batches
      SET status = 'answered', answered_at = now()
      WHERE id = NEW.batch_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_tracking_response_insert
  AFTER INSERT OR UPDATE ON public.tracking_daily_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_batch_status();

-- ---------------------------------------------------------------------------
-- 5. Progress snapshots — biweekly evolution captures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracking_progress_snapshots (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perspective_id      uuid        NOT NULL REFERENCES public.tracking_perspectives(id) ON DELETE CASCADE,
  period_start        date        NOT NULL,
  period_end          date        NOT NULL,
  baseline_scores     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- {archetype: {light, shadow, total, net, intensity}}
  tracking_scores     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- same shape, derived from tracking responses
  delta               jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- {archetype: {light_delta, shadow_delta, net_delta, direction: 'up'|'down'|'stable'}}
  strongest_shift     text,       -- archetype key with biggest absolute delta
  response_count      integer     NOT NULL DEFAULT 0,
  narrative_fr        text,
  narrative_en        text,
  generated_by        uuid        REFERENCES auth.users(id),
  generated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, perspective_id, period_end)
);

COMMENT ON TABLE  public.tracking_progress_snapshots IS 'Biweekly evolution snapshots capturing delta vs Deep Dive baseline.';

CREATE INDEX IF NOT EXISTS tracking_progress_snapshots_user_idx
  ON public.tracking_progress_snapshots (user_id, generated_at DESC);

ALTER TABLE public.tracking_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own progress snapshots"
  ON public.tracking_progress_snapshots
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins manage all progress snapshots"
  ON public.tracking_progress_snapshots
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
