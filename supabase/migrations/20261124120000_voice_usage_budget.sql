-- Monthly LOGOS voice time budget per member (global cap, not per session).

ALTER TABLE public.elevenlabs_settings
  ADD COLUMN IF NOT EXISTS voice_monthly_limit_seconds INT NOT NULL DEFAULT 10800;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS voice_monthly_limit_seconds INT;

COMMENT ON COLUMN public.elevenlabs_settings.voice_monthly_limit_seconds IS
  'Default calendar-month voice seconds per member when profiles.voice_monthly_limit_seconds is null.';
COMMENT ON COLUMN public.profiles.voice_monthly_limit_seconds IS
  'Optional per-member override of voice_monthly_limit_seconds (calendar month, UTC).';

CREATE OR REPLACE FUNCTION public.get_voice_usage_budget(p_user_id UUID)
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
  v_used INT;
  v_limit INT;
  v_profile_limit INT;
  v_default_limit INT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  IF v_caller IS NOT NULL AND v_caller <> p_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_caller AND ur.role IN ('admin', 'superadmin')
    ) THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  END IF;

  v_period_start := date_trunc('month', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
  v_period_end := (v_period_start + INTERVAL '1 month');

  SELECT COALESCE(SUM(GREATEST(COALESCE(vsf.duration_seconds, 0), 0)), 0)::INT
  INTO v_used
  FROM public.voice_session_feedbacks vsf
  WHERE vsf.user_id = p_user_id
    AND vsf.clicked_at >= v_period_start
    AND vsf.clicked_at < v_period_end;

  SELECT p.voice_monthly_limit_seconds INTO v_profile_limit
  FROM public.profiles p
  WHERE p.id = p_user_id;

  SELECT COALESCE(s.voice_monthly_limit_seconds, 10800) INTO v_default_limit
  FROM public.elevenlabs_settings s
  WHERE s.id = true;

  v_limit := COALESCE(v_profile_limit, v_default_limit);

  RETURN jsonb_build_object(
    'period_start', to_char(v_period_start AT TIME ZONE 'utc', 'YYYY-MM-DD"T00:00:00Z"'),
    'period_end', to_char(v_period_end AT TIME ZONE 'utc', 'YYYY-MM-DD"T00:00:00Z"'),
    'used_seconds', v_used,
    'limit_seconds', v_limit,
    'remaining_seconds', GREATEST(v_limit - v_used, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_voice_usage_budget(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_voice_usage_budget(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_voice_usage_budget(UUID) TO service_role;