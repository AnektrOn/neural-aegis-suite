-- Funnel tracking for /start (micro-steps, abandon, completion).

CREATE TABLE IF NOT EXISTS public.executive_onboarding_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor_key TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('step_view', 'abandon', 'complete')),
  micro_step INT NOT NULL CHECK (micro_step >= 1 AND micro_step <= 50),
  total_steps INT NOT NULL DEFAULT 11,
  locale TEXT,
  contact_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_exec_onboarding_funnel_created
  ON public.executive_onboarding_funnel_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_onboarding_funnel_visitor
  ON public.executive_onboarding_funnel_events (visitor_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_onboarding_funnel_abandon
  ON public.executive_onboarding_funnel_events (event_type, created_at DESC)
  WHERE event_type = 'abandon';

ALTER TABLE public.executive_onboarding_funnel_events ENABLE ROW LEVEL SECURITY;

-- Operators read funnel; members cannot read others' events.
DROP POLICY IF EXISTS executive_onboarding_funnel_admin_select ON public.executive_onboarding_funnel_events;
CREATE POLICY executive_onboarding_funnel_admin_select
  ON public.executive_onboarding_funnel_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
    )
  );

CREATE OR REPLACE FUNCTION public.notify_executive_onboarding_abandon_async(
  p_event_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT;
  _key TEXT;
BEGIN
  IF p_event_id IS NULL THEN RETURN; END IF;

  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://YOUR_PROJECT.supabase.co'
  ) || '/functions/v1/notify-executive-onboarding-complete';

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
    ),
    body := jsonb_build_object(
      'mode', 'funnel_abandon',
      'event_id', p_event_id
    ),
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_executive_onboarding_abandon_async failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_executive_onboarding_funnel(
  p_visitor_key TEXT,
  p_event_type TEXT,
  p_micro_step INT,
  p_total_steps INT DEFAULT 11,
  p_locale TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_email TEXT;
  v_step INT;
BEGIN
  IF p_visitor_key IS NULL OR length(trim(p_visitor_key)) < 8 OR length(p_visitor_key) > 128 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_visitor_key');
  END IF;

  IF p_event_type NOT IN ('step_view', 'abandon', 'complete') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_event_type');
  END IF;

  v_step := GREATEST(1, LEAST(COALESCE(p_micro_step, 1), 50));

  v_email := NULLIF(lower(trim(COALESCE(p_contact_email, ''))), '');
  IF v_email IS NOT NULL AND v_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    v_email := NULL;
  END IF;

  -- Throttle abandons: one per visitor per 15 minutes.
  IF p_event_type = 'abandon' AND EXISTS (
    SELECT 1 FROM public.executive_onboarding_funnel_events e
    WHERE e.visitor_key = trim(p_visitor_key)
      AND e.event_type = 'abandon'
      AND e.created_at > now() - INTERVAL '15 minutes'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'throttled', true);
  END IF;

  -- Throttle step_view spam: same step within 2s.
  IF p_event_type = 'step_view' AND EXISTS (
    SELECT 1 FROM public.executive_onboarding_funnel_events e
    WHERE e.visitor_key = trim(p_visitor_key)
      AND e.event_type = 'step_view'
      AND e.micro_step = v_step
      AND e.created_at > now() - INTERVAL '2 seconds'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'throttled', true);
  END IF;

  INSERT INTO public.executive_onboarding_funnel_events (
    visitor_key,
    user_id,
    event_type,
    micro_step,
    total_steps,
    locale,
    contact_email,
    metadata
  ) VALUES (
    trim(p_visitor_key),
    v_uid,
    p_event_type,
    v_step,
    GREATEST(1, LEAST(COALESCE(p_total_steps, 11), 50)),
    NULLIF(trim(COALESCE(p_locale, '')), ''),
    v_email,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  IF p_event_type = 'abandon'
     AND v_step >= 3
     AND (v_email IS NOT NULL OR v_step >= 5) THEN
    PERFORM public.notify_executive_onboarding_abandon_async(v_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_executive_onboarding_funnel(TEXT, TEXT, INT, INT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_executive_onboarding_funnel(TEXT, TEXT, INT, INT, TEXT, TEXT, JSONB) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.notify_executive_onboarding_abandon_async(UUID) FROM PUBLIC;