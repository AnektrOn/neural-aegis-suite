-- Pulse Courses: rich multi-section courses, separate from swipe cards.
-- A card can optionally link to a course. Courses have their own
-- archetype targeting, sections, and user progress tracking.

-- ─── Courses ─────────────────────────────────────────────────────────

CREATE TABLE public.pulse_courses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key        TEXT UNIQUE,
  principle_id        UUID REFERENCES public.aegis_rune_principles(id) ON DELETE SET NULL,
  archetype_targets   TEXT[] NOT NULL DEFAULT '{}',
  title_i18n          JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n    JSONB NOT NULL DEFAULT '{}'::jsonb,
  difficulty          TEXT NOT NULL DEFAULT 'beginner'
                        CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes   INT NOT NULL DEFAULT 5 CHECK (estimated_minutes > 0),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Course Sections ─────────────────────────────────────────────────

CREATE TABLE public.pulse_course_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.pulse_courses(id) ON DELETE CASCADE,
  section_type  TEXT NOT NULL
                  CHECK (section_type IN (
                    'hook', 'concept', 'exercise', 'reflection',
                    'action', 'quote', 'story'
                  )),
  content_i18n  JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Link cards to courses (optional) ────────────────────────────────

ALTER TABLE public.aegis_synapse_cards
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.pulse_courses(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.aegis_synapse_cards.course_id
  IS 'Optional link to a full course. If set, grimoire opens the course instead of inline course_content.';

-- ─── User course progress ────────────────────────────────────────────

CREATE TABLE public.pulse_user_course_progress (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES public.pulse_courses(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  last_section_idx  INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pulse_courses_principle
  ON public.pulse_courses (principle_id, sort_order)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_pulse_courses_archetype_targets
  ON public.pulse_courses USING GIN (archetype_targets)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_pulse_course_sections_course
  ON public.pulse_course_sections (course_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_pulse_user_course_progress_user
  ON public.pulse_user_course_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_aegis_synapse_cards_course
  ON public.aegis_synapse_cards (course_id)
  WHERE course_id IS NOT NULL;

-- ─── Triggers ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_pulse_courses_updated_at ON public.pulse_courses;
CREATE TRIGGER trg_pulse_courses_updated_at
  BEFORE UPDATE ON public.pulse_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pulse_course_sections_updated_at ON public.pulse_course_sections;
CREATE TRIGGER trg_pulse_course_sections_updated_at
  BEFORE UPDATE ON public.pulse_course_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pulse_user_course_progress_updated_at ON public.pulse_user_course_progress;
CREATE TRIGGER trg_pulse_user_course_progress_updated_at
  BEFORE UPDATE ON public.pulse_user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.pulse_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pulse courses readable"
  ON public.pulse_courses FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Pulse courses admin manage"
  ON public.pulse_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Pulse sections readable"
  ON public.pulse_course_sections FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pulse_courses co
    WHERE co.id = course_id
      AND (co.is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role))
  ));

CREATE POLICY "Pulse sections admin manage"
  ON public.pulse_course_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users manage own course progress"
  ON public.pulse_user_course_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read course progress"
  ON public.pulse_user_course_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─── RPC: Fetch a full course with sections ──────────────────────────

CREATE OR REPLACE FUNCTION public.get_pulse_course(
  p_course_id UUID,
  p_locale    TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid     UUID;
  _locale  TEXT;
  _course  JSONB;
  _sections JSONB;
  _progress JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN _locale := 'fr'; END IF;

  SELECT jsonb_build_object(
    'id',                co.id,
    'external_key',      co.external_key,
    'principle_code',    p.code,
    'principle_name',    public.resolve_i18n(p.name_i18n, _locale),
    'title',             public.resolve_i18n(co.title_i18n, _locale),
    'description',       public.resolve_i18n(co.description_i18n, _locale),
    'difficulty',        co.difficulty,
    'estimated_minutes', co.estimated_minutes
  )
  INTO _course
  FROM public.pulse_courses co
  LEFT JOIN public.aegis_rune_principles p ON p.id = co.principle_id
  WHERE co.id = p_course_id
    AND (co.is_active = true OR public.has_role(_uid, 'admin'::public.app_role));

  IF _course IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'course_not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',           s.id,
      'section_type', s.section_type,
      'content',      public.resolve_i18n(s.content_i18n, _locale),
      'sort_order',   s.sort_order
    ) ORDER BY s.sort_order
  ), '[]'::jsonb)
  INTO _sections
  FROM public.pulse_course_sections s
  WHERE s.course_id = p_course_id;

  SELECT jsonb_build_object(
    'started_at',       ucp.started_at,
    'completed_at',     ucp.completed_at,
    'last_section_idx', ucp.last_section_idx
  )
  INTO _progress
  FROM public.pulse_user_course_progress ucp
  WHERE ucp.user_id = _uid AND ucp.course_id = p_course_id;

  -- Auto-start progress on first view
  IF _progress IS NULL THEN
    INSERT INTO public.pulse_user_course_progress (user_id, course_id)
    VALUES (_uid, p_course_id)
    ON CONFLICT DO NOTHING;
    _progress := jsonb_build_object(
      'started_at', now(),
      'completed_at', null,
      'last_section_idx', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',       true,
    'course',   _course,
    'sections', _sections,
    'progress', _progress,
    'locale',   _locale
  );
END;
$$;

-- ─── RPC: Complete a course ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_pulse_course(
  p_course_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  INSERT INTO public.pulse_user_course_progress (user_id, course_id, completed_at)
  VALUES (_uid, p_course_id, now())
  ON CONFLICT (user_id, course_id) DO UPDATE SET
    completed_at = COALESCE(pulse_user_course_progress.completed_at, now()),
    last_section_idx = (
      SELECT COUNT(*) FROM public.pulse_course_sections WHERE course_id = p_course_id
    ),
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'completed_at', now());
END;
$$;

-- ─── RPC: Update deck response to include course_id ──────────────────

-- Already handled: the get_aegis_synapse_deck RPC from migration 120300
-- returns course_content inline. When a card has course_id, the frontend
-- will call get_pulse_course separately. We add course_id to the deck row.

CREATE OR REPLACE FUNCTION public.get_aegis_synapse_deck(
  p_locale TEXT DEFAULT 'fr',
  p_limit  INT  DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid            UUID;
  _locale         TEXT;
  _limit          INT;
  _user_archetypes TEXT[];
  _cards          JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN _locale := 'fr'; END IF;

  _limit := GREATEST(1, LEAST(COALESCE(p_limit, 15), 50));

  SELECT ar.top_archetypes
  INTO   _user_archetypes
  FROM   public.analysis_results ar
  JOIN   public.assessment_sessions s ON s.id = ar.session_id
  WHERE  s.user_id = _uid
  ORDER  BY ar.created_at DESC
  LIMIT  1;

  _user_archetypes := COALESCE(_user_archetypes, '{}');

  SELECT COALESCE(jsonb_agg(sub.deck_row ORDER BY sub._relevance DESC, sub._prio, sub._ord), '[]'::jsonb)
  INTO   _cards
  FROM (
    SELECT
      jsonb_build_object(
        'id',                   c.id,
        'external_key',         c.external_key,
        'course_id',            c.course_id,
        'principle_code',       p.code,
        'principle_name',       public.resolve_i18n(p.name_i18n, _locale),
        'principle_quote',      public.resolve_i18n(p.quote_i18n, _locale),
        'principle_bg_class',   p.bg_class,
        'principle_text_class', p.text_class,
        'pulses_to_unlock',     p.pulses_to_unlock,
        'time_label',           c.time_label,
        'title',                public.resolve_i18n(c.title_i18n, _locale),
        'problem',              public.resolve_i18n(c.problem_i18n, _locale),
        'bullets',              public.resolve_i18n_array(c.bullets_i18n, _locale),
        'format',               public.resolve_i18n(c.format_i18n, _locale),
        'course_content',       public.resolve_course_content(c.course_content_i18n, _locale)
      ) AS deck_row,
      CASE
        WHEN c.archetype_targets = '{}' THEN 1
        WHEN c.archetype_targets && _user_archetypes THEN 2
        ELSE 0
      END AS _relevance,
      COALESCE(urp.pulses_count, 0) AS _prio,
      c.sort_order AS _ord
    FROM   public.aegis_synapse_cards c
    JOIN   public.aegis_rune_principles p ON p.id = c.principle_id
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    WHERE  c.is_active  = true
      AND  p.is_active  = true
      AND  NOT EXISTS (
        SELECT 1
        FROM   public.aegis_user_card_interactions i
        WHERE  i.user_id = _uid AND i.card_id = c.id
      )
      AND (
        c.archetype_targets = '{}'
        OR c.archetype_targets && _user_archetypes
      )
    ORDER BY _relevance DESC, _prio ASC, _ord ASC, random()
    LIMIT  _limit
  ) sub;

  RETURN jsonb_build_object(
    'ok',         true,
    'cards',      _cards,
    'locale',     _locale,
    'archetypes', to_jsonb(_user_archetypes)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_course(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pulse_course(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE public.pulse_courses IS 'Cours Pulse multi-sections, attribuables par archetype et principe.';
COMMENT ON TABLE public.pulse_course_sections IS 'Sections ordonnees d''un cours (hook, concept, exercise, reflection, action, quote, story).';
COMMENT ON TABLE public.pulse_user_course_progress IS 'Progression utilisateur par cours (debut, completion, derniere section).';
