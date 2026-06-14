-- Pulse rune/glyph progress counts only integrated cards (completed_at set),
-- not assimilated swipes alone.

-- 1. Replace assimilated-insert trigger with integration-update trigger
CREATE OR REPLACE FUNCTION public.aegis_on_card_integrated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _principle_id UUID;
  _pulses_to_unlock INT;
BEGIN
  IF NEW.action <> 'assimilated' THEN
    RETURN NEW;
  END IF;

  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.principle_id, p.pulses_to_unlock
  INTO _principle_id, _pulses_to_unlock
  FROM public.aegis_synapse_cards c
  JOIN public.aegis_rune_principles p ON p.id = c.principle_id
  WHERE c.id = NEW.card_id;

  IF _principle_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.aegis_user_rune_progress (user_id, principle_id, pulses_count, unlocked_at)
  VALUES (NEW.user_id, _principle_id, 1, NULL)
  ON CONFLICT (user_id, principle_id)
  DO UPDATE SET
    pulses_count = aegis_user_rune_progress.pulses_count + 1,
    unlocked_at = CASE
      WHEN aegis_user_rune_progress.unlocked_at IS NOT NULL THEN aegis_user_rune_progress.unlocked_at
      WHEN aegis_user_rune_progress.pulses_count + 1 >= _pulses_to_unlock THEN now()
      ELSE NULL
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aegis_on_card_assimilated ON public.aegis_user_card_interactions;
DROP TRIGGER IF EXISTS trg_aegis_on_card_integrated ON public.aegis_user_card_interactions;

CREATE TRIGGER trg_aegis_on_card_integrated
  AFTER INSERT OR UPDATE OF completed_at ON public.aegis_user_card_interactions
  FOR EACH ROW EXECUTE FUNCTION public.aegis_on_card_integrated();

-- 2. Swipe RPC: no rune progress on assimilate alone
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

  RETURN jsonb_build_object(
    'ok', true,
    'action', p_action::text,
    'principle_code', NULL,
    'new_pulse_count', NULL,
    'rune_unlocked', false
  );
END;
$$;

-- 3. Integration RPC: returns rune progress after completed_at is set
CREATE OR REPLACE FUNCTION public.complete_aegis_card(p_card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid              UUID;
  _already_complete BOOLEAN;
  _principle_code   TEXT;
  _pulses_to_unlock INT;
  _pulses_count     INT;
  _was_unlocked     BOOLEAN;
  _rune_unlocked    BOOLEAN;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT
    (i.completed_at IS NOT NULL),
    p.code,
    p.pulses_to_unlock,
    COALESCE(urp.pulses_count, 0),
    (urp.unlocked_at IS NOT NULL)
  INTO
    _already_complete,
    _principle_code,
    _pulses_to_unlock,
    _pulses_count,
    _was_unlocked
  FROM public.aegis_user_card_interactions i
  JOIN public.aegis_synapse_cards c ON c.id = i.card_id
  JOIN public.aegis_rune_principles p ON p.id = c.principle_id
  LEFT JOIN public.aegis_user_rune_progress urp
    ON urp.user_id = _uid AND urp.principle_id = p.id
  WHERE i.user_id = _uid AND i.card_id = p_card_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'interaction_not_found');
  END IF;

  UPDATE public.aegis_user_card_interactions
  SET completed_at = COALESCE(completed_at, now())
  WHERE user_id = _uid AND card_id = p_card_id;

  _rune_unlocked := false;

  IF NOT _already_complete THEN
    _pulses_count := _pulses_count + 1;

    IF NOT COALESCE(_was_unlocked, false) THEN
      _rune_unlocked := (_pulses_count >= _pulses_to_unlock);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'completed_at', now(),
    'principle_code', _principle_code,
    'new_pulse_count', _pulses_count,
    'rune_unlocked', _rune_unlocked
  );
END;
$$;

-- 4. Grimoire RPC: pulses_count = integrated cards only
CREATE OR REPLACE FUNCTION public.get_aegis_synapse_grimoire(
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid     UUID;
  _locale  TEXT;
  _library JSONB;
  _runes   JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN _locale := 'fr'; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _library
  FROM (
    SELECT
      c.id,
      c.external_key,
      c.course_id,
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
      i.created_at AS swiped_at,
      (i.completed_at IS NOT NULL) AS is_course_completed
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE i.user_id = _uid
      AND i.action = 'assimilated'
    ORDER BY i.created_at DESC
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.collection_sort, r.sort_order), '[]'::jsonb)
  INTO _runes
  FROM (
    SELECT
      p.code                                              AS principle_code,
      public.resolve_i18n(p.name_i18n, _locale)           AS principle_name,
      p.pulses_to_unlock,
      COALESCE(integrated.cnt, 0)                         AS pulses_count,
      (COALESCE(integrated.cnt, 0) >= p.pulses_to_unlock) AS is_unlocked,
      urp.unlocked_at,
      p.bg_class,
      p.text_class,
      p.glyph_svg,
      coll.code                                           AS collection_code,
      public.resolve_i18n(coll.name_i18n, _locale)        AS collection_name,
      COALESCE(coll.sort_order, 999)                      AS collection_sort,
      p.sort_order,
      (SELECT COUNT(*)::int
       FROM public.aegis_synapse_cards sc
       WHERE sc.principle_id = p.id
         AND sc.is_active = true)                         AS total_cards
    FROM public.aegis_rune_principles p
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    LEFT JOIN public.aegis_rune_collections coll
      ON coll.id = p.collection_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt
      FROM public.aegis_user_card_interactions i2
      JOIN public.aegis_synapse_cards sc2 ON sc2.id = i2.card_id
      WHERE i2.user_id = _uid
        AND sc2.principle_id = p.id
        AND i2.action = 'assimilated'
        AND i2.completed_at IS NOT NULL
    ) integrated ON true
    WHERE p.is_active = true
    ORDER BY COALESCE(coll.sort_order, 999), p.sort_order
  ) r;

  RETURN jsonb_build_object(
    'ok',      true,
    'library', _library,
    'runes',   _runes,
    'locale',  _locale
  );
END;
$$;

-- 5. Backfill rune progress from integrated cards only
DELETE FROM public.aegis_user_rune_progress;

INSERT INTO public.aegis_user_rune_progress (user_id, principle_id, pulses_count, unlocked_at)
SELECT
  agg.user_id,
  agg.principle_id,
  agg.cnt,
  CASE
    WHEN agg.cnt >= agg.pulses_to_unlock THEN agg.last_integrated_at
    ELSE NULL
  END
FROM (
  SELECT
    i.user_id,
    c.principle_id,
    p.pulses_to_unlock,
    COUNT(*)::int AS cnt,
    MAX(i.completed_at) AS last_integrated_at
  FROM public.aegis_user_card_interactions i
  JOIN public.aegis_synapse_cards c ON c.id = i.card_id
  JOIN public.aegis_rune_principles p ON p.id = c.principle_id
  WHERE i.action = 'assimilated'
    AND i.completed_at IS NOT NULL
  GROUP BY i.user_id, c.principle_id, p.pulses_to_unlock
) agg;

NOTIFY pgrst, 'reload schema';
