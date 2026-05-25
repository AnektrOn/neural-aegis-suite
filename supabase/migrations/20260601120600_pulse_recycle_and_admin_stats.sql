-- Pulse: recycle ignored cards + admin swipe stats.

-- 1. User RPC: recycle ignored cards (deletes 'ignored' interactions so they reappear in deck).
CREATE OR REPLACE FUNCTION public.recycle_pulse_ignored()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid     UUID;
  _deleted INT;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  DELETE FROM public.aegis_user_card_interactions
  WHERE user_id = _uid
    AND action = 'ignored';

  GET DIAGNOSTICS _deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'recycled', _deleted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recycle_pulse_ignored() TO authenticated;

-- 2. Admin RPC: per-card swipe stats.
CREATE OR REPLACE FUNCTION public.get_pulse_admin_card_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid   UUID;
  _stats JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb), '[]'::jsonb)
  INTO _stats
  FROM (
    SELECT
      c.id AS card_id,
      c.external_key,
      COUNT(*) FILTER (WHERE i.action = 'assimilated') AS yes_count,
      COUNT(*) FILTER (WHERE i.action = 'ignored')     AS no_count,
      COUNT(*)                                           AS total_swipes
    FROM public.aegis_synapse_cards c
    LEFT JOIN public.aegis_user_card_interactions i ON i.card_id = c.id
    GROUP BY c.id, c.external_key
    ORDER BY c.sort_order
  ) s;

  RETURN jsonb_build_object('ok', true, 'stats', _stats);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_admin_card_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
