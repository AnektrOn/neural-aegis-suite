-- Production vitals hardening:
-- 1) Admin audit trail
-- 2) Lock plan_override / is_disabled to admins (or service_role)
-- 3) Stripe webhook event idempotency ledger
-- 4) Newsletter pending confirmation + signed unsubscribe token
-- 5) Inventory view for orphan plan overrides
-- 6) Quiz rate-limit helper
-- 7) Sensitive data retention purge helper

-- ─── 1. Admin audit trail ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log (target_user_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Deny direct audit inserts" ON public.admin_audit_log;
CREATE POLICY "Deny direct audit inserts"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (false);

-- ─── 2. Protect privileged profile columns ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.plan_override IS DISTINCT FROM OLD.plan_override)
       OR (NEW.is_disabled IS DISTINCT FROM OLD.is_disabled) THEN
      -- auth.uid() NULL = service_role / migration context → allow
      IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
        RAISE EXCEPTION 'forbidden: plan_override and is_disabled are admin-only'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profiles_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_privileged_columns();

COMMENT ON FUNCTION public.protect_profiles_privileged_columns() IS
  'Prevents non-admin users from self-granting plan_override or toggling is_disabled.';

CREATE OR REPLACE FUNCTION public.admin_set_plan_override(
  p_user_id UUID,
  p_plan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('matrix', 'ultra') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_plan');
  END IF;

  SELECT plan_override INTO _prev FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  UPDATE public.profiles
  SET plan_override = p_plan, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
  VALUES (
    auth.uid(),
    'plan_override',
    p_user_id,
    jsonb_build_object('previous', _prev, 'next', p_plan)
  );

  RETURN jsonb_build_object('ok', true, 'previous', _prev, 'plan', p_plan);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_plan_override(UUID, TEXT) TO authenticated;

-- ─── 3. Stripe webhook idempotency ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  livemode BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny client access stripe events" ON public.stripe_webhook_events;
CREATE POLICY "Deny client access stripe events"
  ON public.stripe_webhook_events FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 4. Orphan plan_override inventory (admin view) ──────────────────────────
CREATE OR REPLACE VIEW public.v_orphan_plan_overrides
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.plan_override,
  p.created_at AS profile_created_at,
  s.id AS subscription_id,
  s.status AS subscription_status,
  s.product_id,
  s.paddle_subscription_id AS stripe_subscription_id
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT *
  FROM public.subscriptions s
  WHERE s.user_id = p.id
  ORDER BY s.created_at DESC
  LIMIT 1
) s ON true
WHERE p.plan_override IS NOT NULL
  AND (
    s.id IS NULL
    OR s.status NOT IN ('active', 'trialing', 'past_due')
  );

GRANT SELECT ON public.v_orphan_plan_overrides TO authenticated;

-- ─── 5. Newsletter: pending + confirm token + signed unsubscribe ─────────────
ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_subscribers_status_check;

ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_status_check
  CHECK (status IN ('pending', 'active', 'unsubscribed'));

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirm_token TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT;

UPDATE public.newsletter_subscribers
SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
WHERE unsubscribe_token IS NULL;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(
  p_email TEXT,
  p_locale TEXT DEFAULT 'fr',
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _locale TEXT;
  _uid UUID;
  _row public.newsletter_subscribers%ROWTYPE;
  _token TEXT;
BEGIN
  _email := lower(trim(p_email));
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN
    _locale := 'fr';
  END IF;

  _uid := auth.uid();
  _token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO public.newsletter_subscribers (
    email, user_id, locale, status, source, confirm_token, unsubscribe_token
  )
  VALUES (
    _email, _uid, _locale, 'pending', NULLIF(trim(p_source), ''),
    _token, encode(gen_random_bytes(24), 'hex')
  )
  ON CONFLICT (email)
  DO UPDATE SET
    status = CASE
      WHEN newsletter_subscribers.status = 'active' THEN 'active'
      ELSE 'pending'
    END,
    locale = EXCLUDED.locale,
    source = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
    user_id = COALESCE(EXCLUDED.user_id, newsletter_subscribers.user_id),
    confirm_token = CASE
      WHEN newsletter_subscribers.status = 'active' THEN newsletter_subscribers.confirm_token
      ELSE EXCLUDED.confirm_token
    END,
    unsubscribe_token = COALESCE(newsletter_subscribers.unsubscribe_token, EXCLUDED.unsubscribe_token),
    updated_at = now()
  RETURNING * INTO _row;

  RETURN jsonb_build_object(
    'ok', true,
    'status', _row.status,
    'email', _row.email,
    'confirm_token', CASE WHEN _row.status = 'pending' THEN _row.confirm_token ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_newsletter(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated INT;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  UPDATE public.newsletter_subscribers
  SET status = 'active', confirm_token = NULL, updated_at = now()
  WHERE confirm_token = trim(p_token)
    AND status = 'pending';

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN jsonb_build_object('ok', _updated > 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(
  p_email TEXT DEFAULT NULL,
  p_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _updated INT;
BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) >= 16 THEN
    UPDATE public.newsletter_subscribers
    SET status = 'unsubscribed', updated_at = now()
    WHERE unsubscribe_token = trim(p_token);
    GET DIAGNOSTICS _updated = ROW_COUNT;
    RETURN jsonb_build_object('ok', _updated > 0);
  END IF;

  _email := lower(trim(p_email));
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email_or_token');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_required');
  END IF;

  UPDATE public.newsletter_subscribers
  SET status = 'unsubscribed', updated_at = now()
  WHERE lower(trim(email)) = _email
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN jsonb_build_object('ok', _updated > 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_newsletter(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(TEXT, TEXT) TO anon, authenticated;

-- ─── 6. Quiz public rate limit ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_rate_limits (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hit_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE public.public_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny client rate limits" ON public.public_rate_limits;
CREATE POLICY "Deny client rate limits"
  ON public.public_rate_limits FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_public_rate_limit(
  p_bucket TEXT,
  p_limit INT DEFAULT 30,
  p_window_seconds INT DEFAULT 3600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window TIMESTAMPTZ;
  _count INT;
BEGIN
  IF p_bucket IS NULL OR length(trim(p_bucket)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_bucket');
  END IF;

  _window := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.public_rate_limits (bucket_key, window_start, hit_count)
  VALUES (trim(p_bucket), _window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hit_count = public.public_rate_limits.hit_count + 1
  RETURNING hit_count INTO _count;

  IF _count > p_limit THEN
    RETURN jsonb_build_object('ok', false, 'allowed', false, 'count', _count, 'limit', p_limit);
  END IF;

  RETURN jsonb_build_object('ok', true, 'allowed', true, 'count', _count, 'limit', p_limit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_public_rate_limit(TEXT, INT, INT) TO anon, authenticated;

-- ─── 7. Retention purge helper (admin / service_role / cron) ─────────────────
CREATE OR REPLACE FUNCTION public.purge_sensitive_assessment_answers(
  p_retention_days INT DEFAULT 365
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF to_regclass('public.assessment_answers') IS NOT NULL
     AND to_regclass('public.assessment_sessions') IS NOT NULL THEN
    DELETE FROM public.assessment_answers a
    USING public.assessment_sessions s
    WHERE a.session_id = s.id
      AND s.completed_at IS NOT NULL
      AND s.completed_at < (now() - make_interval(days => p_retention_days));
    GET DIAGNOSTICS _deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('ok', true, 'deleted', _deleted, 'retention_days', p_retention_days);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_sensitive_assessment_answers(INT) TO authenticated;

-- Atomic installment counter for Ultra 6× (webhook-safe)
CREATE OR REPLACE FUNCTION public.increment_installments_paid(p_subscription_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _paid INT;
  _total INT;
BEGIN
  UPDATE public.subscriptions
  SET
    installments_paid = COALESCE(installments_paid, 0) + 1,
    updated_at = now()
  WHERE paddle_subscription_id = p_subscription_id
  RETURNING installments_paid, installments_total INTO _paid, _total;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'installments_paid', _paid,
    'installments_total', _total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.increment_installments_paid(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_installments_paid(TEXT) TO service_role;
