-- Align monthly voice usage with ElevenLabs call_duration_secs (post-call), not client wall clock alone.

-- Base table (same as 20261118140000) — safe when only quota migrations were pasted in SQL editor.
CREATE TABLE IF NOT EXISTS public.logos_conversation_exports (
  elevenlabs_conversation_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  agent_id TEXT,
  conversation_date DATE NOT NULL,
  prompt_id TEXT,
  session_mode TEXT,
  logos_drive_path TEXT,
  logos_drive_done BOOLEAN NOT NULL DEFAULT FALSE,
  audio_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
  user_export_done BOOLEAN NOT NULL DEFAULT FALSE,
  user_export_path TEXT,
  user_export_format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logos_conversation_exports_user_idx
  ON public.logos_conversation_exports (user_id, conversation_date DESC);

ALTER TABLE public.logos_conversation_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own logos_conversation_exports" ON public.logos_conversation_exports;
CREATE POLICY "users read own logos_conversation_exports"
  ON public.logos_conversation_exports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.logos_conversation_exports TO authenticated;
GRANT ALL ON public.logos_conversation_exports TO service_role;

ALTER TABLE public.logos_conversation_exports
  ADD COLUMN IF NOT EXISTS call_duration_seconds INT;

COMMENT ON COLUMN public.logos_conversation_exports.call_duration_seconds IS
  'Authoritative ElevenLabs conversation length in seconds (post-call transcription webhook or API).';

CREATE OR REPLACE FUNCTION public.sum_voice_month_used_seconds(
  p_user_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  WITH keyed AS (
    SELECT
      CASE
        WHEN vsf.elevenlabs_conversation_id IS NOT NULL THEN vsf.elevenlabs_conversation_id
        ELSE 'feedback:' || vsf.id::text
      END AS usage_key,
      GREATEST(
        COALESCE(vsf.duration_seconds, 0),
        COALESCE(lce.call_duration_seconds, 0)
      ) AS sec
    FROM public.voice_session_feedbacks vsf
    LEFT JOIN public.logos_conversation_exports lce
      ON lce.elevenlabs_conversation_id = vsf.elevenlabs_conversation_id
      AND lce.user_id = p_user_id
    WHERE vsf.user_id = p_user_id
      AND vsf.clicked_at >= p_period_start
      AND vsf.clicked_at < p_period_end

    UNION ALL

    SELECT
      lce.elevenlabs_conversation_id,
      COALESCE(lce.call_duration_seconds, 0)
    FROM public.logos_conversation_exports lce
    WHERE lce.user_id = p_user_id
      AND lce.conversation_date >= (p_period_start AT TIME ZONE 'UTC')::date
      AND lce.conversation_date < (p_period_end AT TIME ZONE 'UTC')::date
      AND COALESCE(lce.call_duration_seconds, 0) > 0
      AND NOT EXISTS (
        SELECT 1
        FROM public.voice_session_feedbacks vsf
        WHERE vsf.user_id = p_user_id
          AND vsf.elevenlabs_conversation_id = lce.elevenlabs_conversation_id
          AND vsf.clicked_at >= p_period_start
          AND vsf.clicked_at < p_period_end
      )
  )
  SELECT COALESCE(SUM(m.sec), 0)::INT
  FROM (
    SELECT usage_key, MAX(sec) AS sec
    FROM keyed
    GROUP BY usage_key
  ) m;
$$;

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

  v_used := public.sum_voice_month_used_seconds(p_user_id, v_period_start, v_period_end);

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
        'used_seconds', public.sum_voice_month_used_seconds(p.id, v_period_start, v_period_end),
        'limit_seconds', COALESCE(p.voice_monthly_limit_seconds, v_default_limit),
        'remaining_seconds', GREATEST(
          COALESCE(p.voice_monthly_limit_seconds, v_default_limit)
            - public.sum_voice_month_used_seconds(p.id, v_period_start, v_period_end),
          0
        ),
        'profile_limit_seconds', p.voice_monthly_limit_seconds,
        'last_feedback_at', u.last_feedback_at
      ) AS row_data,
      lower(COALESCE(p.display_name, p.id::text)) AS sort_name
    FROM public.profiles p
    LEFT JOIN (
      SELECT vsf.user_id, MAX(vsf.clicked_at) AS last_feedback_at
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