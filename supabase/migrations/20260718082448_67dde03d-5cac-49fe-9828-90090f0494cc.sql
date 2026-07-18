
-- 1) Storage: gate app-releases downloads behind published+admin
DROP POLICY IF EXISTS "Authenticated read app-releases objects" ON storage.objects;

CREATE POLICY "Authenticated read published app-releases objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'app-releases'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.app_releases r
        WHERE r.apk_storage_path = storage.objects.name
          AND r.is_published = true
      )
    )
  );

-- 2) Aegis synapse cards: revoke direct non-admin SELECT to prevent target_user_ids leakage
DROP POLICY IF EXISTS "Aegis cards readable" ON public.aegis_synapse_cards;

CREATE POLICY "Aegis cards admin readable"
  ON public.aegis_synapse_cards
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Security-definer diagnostic RPC that never leaks other users' UUIDs
CREATE OR REPLACE FUNCTION public.get_aegis_pulse_diagnostic()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total int := 0;
  v_active int := 0;
  v_for_you int := 0;
  v_swiped int := 0;
  v_sample text[] := ARRAY[]::text[];
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object(
      'userId', NULL,
      'total', 0,
      'active', 0,
      'forYou', 0,
      'swiped', 0,
      'sampleKeys', to_jsonb(ARRAY[]::text[])
    );
  END IF;

  SELECT
    count(*)::int,
    count(*) FILTER (WHERE is_active)::int,
    count(*) FILTER (
      WHERE is_active
        AND (
          target_user_ids IS NULL
          OR array_length(target_user_ids, 1) IS NULL
          OR v_user = ANY(target_user_ids)
        )
    )::int
  INTO v_total, v_active, v_for_you
  FROM public.aegis_synapse_cards;

  SELECT count(*)::int
  INTO v_swiped
  FROM public.aegis_user_card_interactions
  WHERE user_id = v_user;

  SELECT COALESCE(array_agg(external_key), ARRAY[]::text[])
  INTO v_sample
  FROM (
    SELECT external_key
    FROM public.aegis_synapse_cards
    WHERE is_active
      AND external_key IS NOT NULL
      AND (
        target_user_ids IS NULL
        OR array_length(target_user_ids, 1) IS NULL
        OR v_user = ANY(target_user_ids)
      )
    ORDER BY sort_order, created_at
    LIMIT 20
  ) s;

  RETURN jsonb_build_object(
    'userId', v_user,
    'total', v_total,
    'active', v_active,
    'forYou', v_for_you,
    'swiped', v_swiped,
    'sampleKeys', to_jsonb(v_sample)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_aegis_pulse_diagnostic() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_aegis_pulse_diagnostic() TO authenticated;
