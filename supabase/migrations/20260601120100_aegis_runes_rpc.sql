-- Aegis Synapse: RPC deck personnalisé, swipe, grimoire.

CREATE OR REPLACE FUNCTION public.resolve_i18n(p_field JSONB, p_locale TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(trim(p_field ->> p_locale), ''),
    NULLIF(trim(p_field ->> 'fr'), ''),
    NULLIF(trim(p_field ->> 'en'), ''),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_i18n_array(p_field JSONB, p_locale TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_field -> p_locale,
    p_field -> 'fr',
    p_field -> 'en',
    '[]'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_course_content(p_field JSONB, p_locale TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_field -> p_locale,
    p_field -> 'fr',
    p_field -> 'en',
    '{}'::jsonb
  );
$$;

-- Deck personnalisé : exclut cartes déjà assimilées ou ignorées.
CREATE OR REPLACE FUNCTION public.get_aegis_synapse_deck(
  p_locale TEXT DEFAULT 'fr',
  p_limit INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _locale TEXT;
  _limit INT;
  _cards JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN
    _locale := 'fr';
  END IF;

  _limit := GREATEST(1, LEAST(COALESCE(p_limit, 15), 50));

  SELECT COALESCE(jsonb_agg(sub.deck_row ORDER BY sub._prio, sub._ord), '[]'::jsonb)
  INTO _cards
  FROM (
    SELECT
      jsonb_build_object(
        'id', c.id,
        'external_key', c.external_key,
        'principle_code', p.code,
        'principle_name', public.resolve_i18n(p.name_i18n, _locale),
        'principle_quote', public.resolve_i18n(p.quote_i18n, _locale),
        'principle_bg_class', p.bg_class,
        'principle_text_class', p.text_class,
        'pulses_to_unlock', p.pulses_to_unlock,
        'time_label', c.time_label,
        'title', public.resolve_i18n(c.title_i18n, _locale),
        'problem', public.resolve_i18n(c.problem_i18n, _locale),
        'bullets', public.resolve_i18n_array(c.bullets_i18n, _locale),
        'format', public.resolve_i18n(c.format_i18n, _locale),
        'course_content', public.resolve_course_content(c.course_content_i18n, _locale)
      ) AS deck_row,
      COALESCE(urp.pulses_count, 0) AS _prio,
      c.sort_order AS _ord
    FROM public.aegis_synapse_cards c
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    WHERE c.is_active = true
      AND p.is_active = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.aegis_user_card_interactions i
        WHERE i.user_id = _uid
          AND i.card_id = c.id
      )
    ORDER BY _prio ASC, _ord ASC, random()
    LIMIT _limit
  ) sub;

  RETURN jsonb_build_object(
    'ok', true,
    'cards', _cards,
    'locale', _locale
  );
END;
$$;

-- Enregistre un swipe (assimilé ou ignoré).
CREATE OR REPLACE FUNCTION public.record_aegis_synapse_swipe(
  p_card_id UUID,
  p_action public.aegis_swipe_action
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _principle_code TEXT;
  _pulses_to_unlock INT;
  _pulses_count INT;
  _was_unlocked BOOLEAN;
  _rune_unlocked BOOLEAN;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_card_id IS NULL OR p_action IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_params');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.aegis_synapse_cards c
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE c.id = p_card_id AND c.is_active = true AND p.is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'card_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.aegis_user_card_interactions
    WHERE user_id = _uid AND card_id = p_card_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_swiped');
  END IF;

  INSERT INTO public.aegis_user_card_interactions (user_id, card_id, action)
  VALUES (_uid, p_card_id, p_action);

  _rune_unlocked := false;
  _pulses_count := NULL;
  _principle_code := NULL;

  IF p_action = 'assimilated' THEN
    SELECT p.code, p.pulses_to_unlock, urp.pulses_count,
           (urp.unlocked_at IS NOT NULL)
    INTO _principle_code, _pulses_to_unlock, _pulses_count, _was_unlocked
    FROM public.aegis_synapse_cards c
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    WHERE c.id = p_card_id;

    IF _pulses_count IS NOT NULL AND NOT COALESCE(_was_unlocked, false) THEN
      _rune_unlocked := (_pulses_count >= _pulses_to_unlock);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'action', p_action::text,
    'principle_code', _principle_code,
    'new_pulse_count', _pulses_count,
    'rune_unlocked', _rune_unlocked
  );
END;
$$;

-- Grimoire : cartes assimilées + progression des 7 runes.
CREATE OR REPLACE FUNCTION public.get_aegis_synapse_grimoire(
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _locale TEXT;
  _library JSONB;
  _runes JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN
    _locale := 'fr';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _library
  FROM (
    SELECT
      c.id,
      c.external_key,
      p.code AS principle_code,
      public.resolve_i18n(p.name_i18n, _locale) AS principle_name,
      public.resolve_i18n(p.quote_i18n, _locale) AS principle_quote,
      p.bg_class AS principle_bg_class,
      p.text_class AS principle_text_class,
      c.time_label,
      public.resolve_i18n(c.title_i18n, _locale) AS title,
      public.resolve_i18n(c.problem_i18n, _locale) AS problem,
      public.resolve_i18n_array(c.bullets_i18n, _locale) AS bullets,
      public.resolve_i18n(c.format_i18n, _locale) AS format,
      public.resolve_course_content(c.course_content_i18n, _locale) AS course_content,
      i.created_at AS swiped_at
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE i.user_id = _uid
      AND i.action = 'assimilated'
    ORDER BY i.created_at DESC
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.sort_order), '[]'::jsonb)
  INTO _runes
  FROM (
    SELECT
      p.code AS principle_code,
      public.resolve_i18n(p.name_i18n, _locale) AS principle_name,
      p.pulses_to_unlock,
      COALESCE(urp.pulses_count, 0) AS pulses_count,
      (COALESCE(urp.pulses_count, 0) >= p.pulses_to_unlock) AS is_unlocked,
      urp.unlocked_at,
      p.sort_order
    FROM public.aegis_rune_principles p
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    WHERE p.is_active = true
    ORDER BY p.sort_order
  ) r;

  RETURN jsonb_build_object(
    'ok', true,
    'library', _library,
    'runes', _runes,
    'locale', _locale
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_aegis_synapse_deck(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_aegis_synapse_swipe(UUID, public.aegis_swipe_action) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_aegis_synapse_grimoire(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
