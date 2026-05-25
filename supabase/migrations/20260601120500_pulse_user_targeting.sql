-- Pulse: per-user card targeting + content type.
-- Cards can now target specific users by UUID (in addition to archetype targeting).
-- Also adds a content_type label (e.g. 'note', 'micro-concept', 'exercise').

-- 1. Add columns
ALTER TABLE public.aegis_synapse_cards
  ADD COLUMN IF NOT EXISTS target_user_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_type    TEXT   NOT NULL DEFAULT 'card';

COMMENT ON COLUMN public.aegis_synapse_cards.target_user_ids
  IS 'Array of user UUIDs this card is exclusively for. Empty = use archetype/universal logic.';

COMMENT ON COLUMN public.aegis_synapse_cards.content_type
  IS 'Content type label: card, note, exercise, etc.';

CREATE INDEX IF NOT EXISTS idx_aegis_synapse_cards_target_user_ids
  ON public.aegis_synapse_cards USING GIN (target_user_ids)
  WHERE is_active = true;

-- 2. Replace get_aegis_synapse_deck with user-targeting-aware version.
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
  _uid             UUID;
  _locale          TEXT;
  _limit           INT;
  _user_archetypes TEXT[];
  _cards           JSONB;
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
        'content_type',         c.content_type,
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
        -- User-targeted card: highest relevance
        WHEN c.target_user_ids != '{}' AND _uid = ANY(c.target_user_ids) THEN 3
        -- Archetype match
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
      -- Visibility rules:
      -- 1. User-targeted: only if current user is in the list
      -- 2. Universal / archetype: existing logic
      AND (
        -- Cards targeted to this specific user
        (c.target_user_ids != '{}' AND _uid = ANY(c.target_user_ids))
        OR
        -- Cards with no user targeting: archetype or universal
        (c.target_user_ids = '{}' AND (
          c.archetype_targets = '{}'
          OR c.archetype_targets && _user_archetypes
        ))
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

NOTIFY pgrst, 'reload schema';
