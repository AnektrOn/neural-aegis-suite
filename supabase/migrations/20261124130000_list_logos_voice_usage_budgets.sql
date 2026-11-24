-- Admin overview: voice minutes/credits budget per member with an active ElevenLabs agent.

CREATE OR REPLACE FUNCTION public.list_logos_voice_usage_budgets(p_search TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_default_limit INT;
  v_search TEXT;
  v_rows JSONB;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller AND ur.role IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_period_start := date_trunc('month', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
  v_period_end := (v_period_start + INTERVAL '1 month');

  SELECT COALESCE(s.voice_monthly_limit_seconds, 10800) INTO v_default_limit
  FROM public.elevenlabs_settings s
  WHERE s.id = true;

  v_search := NULLIF(trim(p_search), '');

  SELECT COALESCE(jsonb_agg(row_data ORDER BY sort_name), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      jsonb_build_object(
        'user_id', p.id,
        'display_name', p.display_name,
        'elevenlabs_agent_id', p.elevenlabs_agent_id,
        'used_seconds', COALESCE(u.used_seconds, 0),
        'limit_seconds', COALESCE(p.voice_monthly_limit_seconds, v_default_limit),
        'remaining_seconds', GREATEST(
          COALESCE(p.voice_monthly_limit_seconds, v_default_limit) - COALESCE(u.used_seconds, 0),
          0
        ),
        'profile_limit_seconds', p.voice_monthly_limit_seconds,
        'last_feedback_at', u.last_feedback_at
      ) AS row_data,
      lower(COALESCE(p.display_name, p.id::text)) AS sort_name
    FROM public.profiles p
    LEFT JOIN (
      SELECT
        vsf.user_id,
        COALESCE(SUM(GREATEST(COALESCE(vsf.duration_seconds, 0), 0)), 0)::INT AS used_seconds,
        MAX(vsf.clicked_at) AS last_feedback_at
      FROM public.voice_session_feedbacks vsf
      WHERE vsf.clicked_at >= v_period_start
        AND vsf.clicked_at < v_period_end
      GROUP BY vsf.user_id
    ) u ON u.user_id = p.id
    WHERE p.elevenlabs_agent_id IS NOT NULL
      AND (
        v_search IS NULL
        OR lower(COALESCE(p.display_name, '')) LIKE '%' || lower(v_search) || '%'
        OR p.id::text ILIKE '%' || v_search || '%'
        OR lower(p.elevenlabs_agent_id) LIKE '%' || lower(v_search) || '%'
      )
  ) sub;

  RETURN jsonb_build_object(
    'ok', true,
    'period_start', to_char(v_period_start AT TIME ZONE 'utc', 'YYYY-MM-DD"T00:00:00Z"'),
    'period_end', to_char(v_period_end AT TIME ZONE 'utc', 'YYYY-MM-DD"T00:00:00Z"'),
    'default_limit_seconds', v_default_limit,
    'users', v_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_logos_voice_usage_budgets(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_logos_voice_usage_budgets(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_logos_voice_usage_budgets(TEXT) TO service_role;

GRANT UPDATE ON public.elevenlabs_settings TO authenticated;

DROP POLICY IF EXISTS "Admins update elevenlabs settings" ON public.elevenlabs_settings;
CREATE POLICY "Admins update elevenlabs settings"
  ON public.elevenlabs_settings FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  );