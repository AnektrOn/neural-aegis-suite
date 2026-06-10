-- Admin: aggregated Pulse stats per user with filters.

CREATE OR REPLACE FUNCTION public.get_pulse_admin_users_overview(
  p_search            TEXT DEFAULT NULL,
  p_activity          TEXT DEFAULT 'all',
  p_principle_code    TEXT DEFAULT NULL,
  p_card_id           UUID DEFAULT NULL,
  p_min_assimilated   INT  DEFAULT 0,
  p_min_runes_unlocked INT DEFAULT 0,
  p_sort              TEXT DEFAULT 'last_activity_desc',
  p_limit             INT  DEFAULT 100,
  p_offset            INT  DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid    UUID;
  _limit  INT;
  _offset INT;
  _total  BIGINT;
  _rows   JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  _limit  := GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
  _offset := GREATEST(0, COALESCE(p_offset, 0));

  WITH swipe_agg AS (
    SELECT
      i.user_id,
      COUNT(*) FILTER (WHERE i.action = 'assimilated') AS assimilated,
      COUNT(*) FILTER (WHERE i.action = 'ignored')     AS ignored,
      COUNT(*) FILTER (WHERE i.completed_at IS NOT NULL) AS completed,
      COUNT(*)                                           AS total_swipes,
      MAX(i.created_at)                                  AS last_swipe_at
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE (p_card_id IS NULL OR i.card_id = p_card_id)
      AND (p_principle_code IS NULL OR TRIM(p_principle_code) = '' OR p.code = p_principle_code)
    GROUP BY i.user_id
  ),
  rune_agg AS (
    SELECT
      urp.user_id,
      COUNT(*) FILTER (
        WHERE COALESCE(urp.pulses_count, 0) >= rp.pulses_to_unlock
           OR urp.unlocked_at IS NOT NULL
      ) AS runes_unlocked
    FROM public.aegis_user_rune_progress urp
    JOIN public.aegis_rune_principles rp ON rp.id = urp.principle_id AND rp.is_active = true
    GROUP BY urp.user_id
  ),
  filtered AS (
    SELECT
      pr.id AS user_id,
      COALESCE(NULLIF(TRIM(pr.display_name), ''), pr.id::text) AS user_name,
      COALESCE(sa.assimilated, 0)::int AS assimilated,
      COALESCE(sa.ignored, 0)::int AS ignored,
      COALESCE(sa.completed, 0)::int AS completed,
      COALESCE(sa.total_swipes, 0)::int AS total_swipes,
      COALESCE(ra.runes_unlocked, 0)::int AS runes_unlocked,
      sa.last_swipe_at
    FROM public.profiles pr
    LEFT JOIN swipe_agg sa ON sa.user_id = pr.id
    LEFT JOIN rune_agg ra ON ra.user_id = pr.id
    WHERE (
        p_search IS NULL
        OR TRIM(p_search) = ''
        OR pr.display_name ILIKE '%' || TRIM(p_search) || '%'
        OR pr.id::text ILIKE '%' || TRIM(p_search) || '%'
      )
      AND (
        COALESCE(NULLIF(TRIM(p_activity), ''), 'all') = 'all'
        OR (p_activity = 'active' AND COALESCE(sa.total_swipes, 0) > 0)
        OR (p_activity = 'inactive' AND COALESCE(sa.total_swipes, 0) = 0)
      )
      AND COALESCE(sa.assimilated, 0) >= GREATEST(0, COALESCE(p_min_assimilated, 0))
      AND COALESCE(ra.runes_unlocked, 0) >= GREATEST(0, COALESCE(p_min_runes_unlocked, 0))
      AND (
        p_card_id IS NULL
        OR sa.user_id IS NOT NULL
      )
  )
  SELECT COUNT(*) INTO _total FROM filtered;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT *
    FROM filtered f
    ORDER BY
      CASE WHEN COALESCE(NULLIF(TRIM(p_sort), ''), 'last_activity_desc') = 'name_asc'
        THEN 0 ELSE 1 END,
      CASE WHEN p_sort = 'name_asc' THEN f.user_name END ASC NULLS LAST,
      CASE WHEN p_sort = 'assimilated_desc' THEN f.assimilated END DESC NULLS LAST,
      CASE WHEN p_sort = 'runes_desc' THEN f.runes_unlocked END DESC NULLS LAST,
      f.last_swipe_at DESC NULLS LAST,
      f.user_name ASC
    LIMIT _limit
    OFFSET _offset
  ) t;

  RETURN jsonb_build_object(
    'ok', true,
    'total', _total,
    'limit', _limit,
    'offset', _offset,
    'users', _rows
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_admin_users_overview(TEXT, TEXT, TEXT, UUID, INT, INT, TEXT, INT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
