-- Pulse admin: per-user swipe tracking + rune progress overview.

-- Swipe log with user/card details (admin only).
CREATE OR REPLACE FUNCTION public.get_pulse_admin_swipe_log(
  p_user_id UUID DEFAULT NULL,
  p_card_id UUID DEFAULT NULL,
  p_limit   INT  DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid   UUID;
  _limit INT;
  _rows  JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  _limit := GREATEST(1, LEAST(COALESCE(p_limit, 200), 500));

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT
      i.id,
      i.user_id,
      COALESCE(pr.display_name, pr.id::text) AS user_name,
      i.card_id,
      c.external_key,
      public.resolve_i18n(c.title_i18n, 'fr') AS card_title,
      p.code AS principle_code,
      public.resolve_i18n(p.name_i18n, 'fr') AS principle_name,
      i.action::text AS action,
      i.created_at AS swiped_at,
      i.completed_at
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    LEFT JOIN public.profiles pr ON pr.id = i.user_id
    WHERE (p_user_id IS NULL OR i.user_id = p_user_id)
      AND (p_card_id IS NULL OR i.card_id = p_card_id)
    ORDER BY i.created_at DESC
    LIMIT _limit
  ) t;

  RETURN jsonb_build_object('ok', true, 'entries', _rows);
END;
$$;

-- Per-user rune progress (admin only).
CREATE OR REPLACE FUNCTION public.get_pulse_admin_user_runes(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid    UUID;
  _runes  JSONB;
  _swipes JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_required');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.sort_order), '[]'::jsonb)
  INTO _runes
  FROM (
    SELECT
      p.code AS principle_code,
      public.resolve_i18n(p.name_i18n, 'fr') AS principle_name,
      p.pulses_to_unlock,
      COALESCE(urp.pulses_count, 0) AS pulses_count,
      (COALESCE(urp.pulses_count, 0) >= p.pulses_to_unlock) AS is_unlocked,
      urp.unlocked_at,
      p.sort_order,
      (SELECT COUNT(*)::int
       FROM public.aegis_synapse_cards sc
       WHERE sc.principle_id = p.id
         AND sc.is_active = true) AS total_cards
    FROM public.aegis_rune_principles p
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = p_user_id AND urp.principle_id = p.id
    WHERE p.is_active = true
    ORDER BY p.sort_order
  ) r;

  SELECT jsonb_build_object(
    'assimilated', COUNT(*) FILTER (WHERE i.action = 'assimilated'),
    'ignored',     COUNT(*) FILTER (WHERE i.action = 'ignored'),
    'completed',   COUNT(*) FILTER (WHERE i.completed_at IS NOT NULL),
    'total',       COUNT(*)
  )
  INTO _swipes
  FROM public.aegis_user_card_interactions i
  WHERE i.user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_user_id,
    'runes', _runes,
    'swipes', _swipes
  );
END;
$$;

-- Per-card: which users swiped yes/no (admin only).
CREATE OR REPLACE FUNCTION public.get_pulse_admin_card_users(
  p_card_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid  UUID;
  _rows JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_card_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'card_required');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT
      i.user_id,
      COALESCE(pr.display_name, pr.id::text) AS user_name,
      i.action::text AS action,
      i.created_at AS swiped_at
    FROM public.aegis_user_card_interactions i
    LEFT JOIN public.profiles pr ON pr.id = i.user_id
    WHERE i.card_id = p_card_id
    ORDER BY i.created_at DESC
  ) t;

  RETURN jsonb_build_object('ok', true, 'users', _rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_admin_swipe_log(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pulse_admin_user_runes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pulse_admin_card_users(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
