-- Initiation freemium: max 5 global Pulse swipes + 5 global Toolbox opens per UTC day.

CREATE TABLE IF NOT EXISTS public.freemium_daily_consumption (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  pulse_global_count INT NOT NULL DEFAULT 0 CHECK (pulse_global_count >= 0),
  toolbox_global_count INT NOT NULL DEFAULT 0 CHECK (toolbox_global_count >= 0),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.freemium_daily_consumption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "freemium_daily_consumption_select_own" ON public.freemium_daily_consumption;
CREATE POLICY "freemium_daily_consumption_select_own"
  ON public.freemium_daily_consumption FOR SELECT TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.toolbox_templates
  ADD COLUMN IF NOT EXISTS is_freemium_global BOOLEAN NOT NULL DEFAULT false;

UPDATE public.toolbox_templates t
SET is_freemium_global = true
WHERE t.external_key IS NOT NULL
  AND t.external_key LIKE 'aegis_global_%';

CREATE OR REPLACE FUNCTION public.member_has_paid_platform(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role IN ('admin', 'superadmin')
  ) THEN
    RETURN true;
  END IF;
  RETURN public.has_active_subscription(p_user_id, 'live')
      OR public.has_active_subscription(p_user_id, 'test');
END;
$$;

CREATE OR REPLACE FUNCTION public.toolbox_assignment_is_global(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cfg JSONB;
  _template_global BOOLEAN;
BEGIN
  SELECT COALESCE(a.widget_config, '{}'::jsonb),
         COALESCE(tt.is_freemium_global, false)
  INTO _cfg, _template_global
  FROM public.toolbox_assignments a
  LEFT JOIN public.toolbox_templates tt ON tt.id = a.template_id
  WHERE a.id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _template_global THEN
    RETURN true;
  END IF;

  IF COALESCE(_cfg->>'distribution_mode', '') = 'individual' THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(_cfg->'archetype_targets') = 'array'
     AND jsonb_array_length(_cfg->'archetype_targets') > 0 THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(_cfg->'shadow_targets') = 'array'
     AND jsonb_array_length(_cfg->'shadow_targets') > 0 THEN
    RETURN false;
  END IF;
  IF COALESCE(_cfg->>'parent_template_key', '') <> '' THEN
    RETURN false;
  END IF;
  IF COALESCE(_cfg->'why_this_for_you_i18n', 'null'::jsonb) <> 'null'::jsonb THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_freemium_daily_budget()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'utc')::date;
  _pulse INT := 0;
  _toolbox INT := 0;
  _paid BOOLEAN;
  _limit INT := 5;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _paid := public.member_has_paid_platform(_uid);

  SELECT COALESCE(f.pulse_global_count, 0), COALESCE(f.toolbox_global_count, 0)
  INTO _pulse, _toolbox
  FROM public.freemium_daily_consumption f
  WHERE f.user_id = _uid AND f.usage_date = _today;

  RETURN jsonb_build_object(
    'ok', true,
    'is_paid', _paid,
    'usage_date', _today::text,
    'pulse_global_used', COALESCE(_pulse, 0),
    'pulse_global_limit', _limit,
    'pulse_global_remaining', CASE WHEN _paid THEN NULL ELSE GREATEST(_limit - COALESCE(_pulse, 0), 0) END,
    'toolbox_global_used', COALESCE(_toolbox, 0),
    'toolbox_global_limit', _limit,
    'toolbox_global_remaining', CASE WHEN _paid THEN NULL ELSE GREATEST(_limit - COALESCE(_toolbox, 0), 0) END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.try_consume_freemium_quota(p_kind TEXT, p_is_global BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'utc')::date;
  _limit INT := 5;
  _col TEXT;
  _used INT;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT COALESCE(p_is_global, false) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_global');
  END IF;

  IF public.member_has_paid_platform(_uid) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'paid');
  END IF;

  IF p_kind = 'pulse' THEN
    _col := 'pulse_global_count';
  ELSIF p_kind = 'toolbox' THEN
    _col := 'toolbox_global_count';
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;

  INSERT INTO public.freemium_daily_consumption (user_id, usage_date)
  VALUES (_uid, _today)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  IF p_kind = 'pulse' THEN
    SELECT pulse_global_count INTO _used
    FROM public.freemium_daily_consumption
    WHERE user_id = _uid AND usage_date = _today FOR UPDATE;

    IF _used >= _limit THEN
      RETURN jsonb_build_object('ok', false, 'error', 'freemium_quota_exceeded', 'kind', p_kind);
    END IF;

    UPDATE public.freemium_daily_consumption
    SET pulse_global_count = pulse_global_count + 1
    WHERE user_id = _uid AND usage_date = _today;
  ELSE
    SELECT toolbox_global_count INTO _used
    FROM public.freemium_daily_consumption
    WHERE user_id = _uid AND usage_date = _today FOR UPDATE;

    IF _used >= _limit THEN
      RETURN jsonb_build_object('ok', false, 'error', 'freemium_quota_exceeded', 'kind', p_kind);
    END IF;

    UPDATE public.freemium_daily_consumption
    SET toolbox_global_count = toolbox_global_count + 1
    WHERE user_id = _uid AND usage_date = _today;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'kind', p_kind,
    'remaining', GREATEST(_limit - (_used + 1), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_toolbox_global_session_start(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _quota JSONB;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_assignment_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_assignment');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.toolbox_assignments a
    WHERE a.id = p_assignment_id AND a.user_id = _uid
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'assignment_not_found');
  END IF;

  IF NOT public.toolbox_assignment_is_global(p_assignment_id) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  _quota := public.try_consume_freemium_quota('toolbox', true);
  IF NOT (_quota->>'ok')::boolean THEN
    RETURN _quota;
  END IF;

  RETURN jsonb_build_object('ok', true, 'quota', _quota);
END;
$$;

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
  _is_global BOOLEAN;
  _quota JSONB;
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

  SELECT (c.target_user_ids = '{}')
  INTO _is_global
  FROM public.aegis_synapse_cards c
  WHERE c.id = p_card_id;

  IF _is_global THEN
    _quota := public.try_consume_freemium_quota('pulse', true);
    IF NOT (_quota->>'ok')::boolean THEN
      RETURN _quota;
    END IF;
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

REVOKE ALL ON FUNCTION public.member_has_paid_platform(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toolbox_assignment_is_global(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_consume_freemium_quota(TEXT, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_freemium_daily_budget() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_toolbox_global_session_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_aegis_synapse_swipe(UUID, public.aegis_swipe_action) TO authenticated;