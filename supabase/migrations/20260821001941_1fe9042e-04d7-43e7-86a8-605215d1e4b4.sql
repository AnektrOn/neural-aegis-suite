-- AFFILIATES
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  commission_rate numeric NOT NULL DEFAULT 0.20,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates_select_own" ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "affiliates_admin_all" ON public.affiliates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CLICKS
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  landing_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate_clicks_admin_read" ON public.affiliate_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX affiliate_clicks_affiliate_idx ON public.affiliate_clicks(affiliate_id, created_at DESC);

-- REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'signed_up',
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_admin_all" ON public.referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX referrals_affiliate_idx ON public.referrals(affiliate_id, created_at DESC);

-- COMMISSIONS
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  referred_user_id uuid NOT NULL,
  transaction_ref text NOT NULL,
  product_id text,
  amount_cents integer NOT NULL DEFAULT 0,
  commission_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  commission_rate numeric NOT NULL DEFAULT 0.20,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_ref, affiliate_id)
);
GRANT ALL ON public.affiliate_commissions TO service_role;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate_commissions_admin_all" ON public.affiliate_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX affiliate_commissions_affiliate_idx ON public.affiliate_commissions(affiliate_id, occurred_at DESC);

-- Track a click on a referral link (public / anonymous).
CREATE OR REPLACE FUNCTION public.track_affiliate_click(p_code text, p_path text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.affiliates WHERE lower(code) = lower(p_code) AND status = 'active';
  IF v_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.affiliate_clicks (affiliate_id, landing_path) VALUES (v_id, p_path);
END; $$;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text, text) TO anon, authenticated;

-- Attach the logged-in user to an affiliate (once, never self-referral).
CREATE OR REPLACE FUNCTION public.claim_referral(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_aff public.affiliates%ROWTYPE; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  SELECT * INTO v_aff FROM public.affiliates WHERE lower(code) = lower(p_code) AND status = 'active';
  IF v_aff.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unknown_code'); END IF;
  IF v_aff.user_id = v_uid THEN RETURN jsonb_build_object('ok', false, 'reason', 'self_referral'); END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_attributed');
  END IF;
  INSERT INTO public.referrals (affiliate_id, referred_user_id, code) VALUES (v_aff.id, v_uid, v_aff.code);
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

-- Ambassador dashboard (emails masked).
CREATE OR REPLACE FUNCTION public.get_my_affiliate_dashboard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_aff public.affiliates%ROWTYPE; v_uid uuid := auth.uid(); v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('is_affiliate', false); END IF;
  SELECT * INTO v_aff FROM public.affiliates WHERE user_id = v_uid;
  IF v_aff.id IS NULL THEN RETURN jsonb_build_object('is_affiliate', false); END IF;

  SELECT jsonb_build_object(
    'is_affiliate', true,
    'code', v_aff.code,
    'status', v_aff.status,
    'commission_rate', v_aff.commission_rate,
    'clicks', (SELECT count(*) FROM public.affiliate_clicks c WHERE c.affiliate_id = v_aff.id),
    'signups', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = v_aff.id),
    'conversions', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = v_aff.id AND r.status = 'converted'),
    'pending_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id AND x.status IN ('pending','approved')), 0),
    'paid_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id AND x.status = 'paid'), 0),
    'referrals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id,
        'label', 'Filleul ' || upper(substr(r.referred_user_id::text, 1, 4)),
        'status', r.status,
        'created_at', r.created_at,
        'converted_at', r.converted_at
      ) ORDER BY r.created_at DESC)
      FROM public.referrals r WHERE r.affiliate_id = v_aff.id
    ), '[]'::jsonb),
    'commissions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', x.id,
        'commission_cents', x.commission_cents,
        'amount_cents', x.amount_cents,
        'currency', x.currency,
        'status', x.status,
        'product_id', x.product_id,
        'occurred_at', x.occurred_at
      ) ORDER BY x.occurred_at DESC)
      FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_my_affiliate_dashboard() TO authenticated;

-- Admin overview with real emails.
CREATE OR REPLACE FUNCTION public.get_affiliates_admin_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id,
      'user_id', a.user_id,
      'email', u.email,
      'code', a.code,
      'status', a.status,
      'commission_rate', a.commission_rate,
      'notes', a.notes,
      'created_at', a.created_at,
      'clicks', (SELECT count(*) FROM public.affiliate_clicks c WHERE c.affiliate_id = a.id),
      'signups', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = a.id),
      'conversions', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = a.id AND r.status = 'converted'),
      'pending_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = a.id AND x.status IN ('pending','approved')), 0),
      'paid_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = a.id AND x.status = 'paid'), 0)
    ) ORDER BY a.created_at DESC)
    FROM public.affiliates a
    LEFT JOIN auth.users u ON u.id = a.user_id
  ), '[]'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_affiliates_admin_overview() TO authenticated;

-- Admin: create an ambassador from an email.
CREATE OR REPLACE FUNCTION public.admin_create_affiliate(p_email text, p_code text, p_rate numeric DEFAULT 0.20)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid; v_code text := lower(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9_-]', '', 'g'));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(v_code) < 3 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code'); END IF;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(p_email);
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unknown_user'); END IF;
  IF EXISTS (SELECT 1 FROM public.affiliates WHERE code = v_code) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code_taken');
  END IF;
  INSERT INTO public.affiliates (user_id, code, commission_rate)
  VALUES (v_uid, v_code, p_rate)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, commission_rate = EXCLUDED.commission_rate, status = 'active';
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_uid, 'Programme Ambassadeur activé',
    'Votre lien de parrainage est disponible dans votre espace Ambassadeur.', 'info', '/ambassadeur');
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_create_affiliate(text, text, numeric) TO authenticated;

-- Admin: list commissions with emails.
CREATE OR REPLACE FUNCTION public.get_affiliate_commissions_admin(p_affiliate_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', x.id,
      'affiliate_id', x.affiliate_id,
      'affiliate_code', a.code,
      'affiliate_email', au.email,
      'referred_email', ru.email,
      'amount_cents', x.amount_cents,
      'commission_cents', x.commission_cents,
      'currency', x.currency,
      'status', x.status,
      'product_id', x.product_id,
      'occurred_at', x.occurred_at,
      'paid_at', x.paid_at
    ) ORDER BY x.occurred_at DESC)
    FROM public.affiliate_commissions x
    JOIN public.affiliates a ON a.id = x.affiliate_id
    LEFT JOIN auth.users au ON au.id = a.user_id
    LEFT JOIN auth.users ru ON ru.id = x.referred_user_id
    WHERE p_affiliate_id IS NULL OR x.affiliate_id = p_affiliate_id
  ), '[]'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_affiliate_commissions_admin(uuid) TO authenticated;

-- Admin: mark commissions as paid / approved.
CREATE OR REPLACE FUNCTION public.admin_set_commission_status(p_ids uuid[], p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_status NOT IN ('pending', 'approved', 'paid', 'rejected') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status');
  END IF;
  UPDATE public.affiliate_commissions
  SET status = p_status, paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  WHERE id = ANY(p_ids);
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_commission_status(uuid[], text) TO authenticated;

-- Record a commission for a paying referred user (called by the payments webhook).
CREATE OR REPLACE FUNCTION public.record_affiliate_commission(
  p_user_id uuid, p_transaction_ref text, p_amount_cents integer,
  p_currency text DEFAULT 'EUR', p_product_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref public.referrals%ROWTYPE; v_rate numeric; v_status text;
BEGIN
  SELECT * INTO v_ref FROM public.referrals WHERE referred_user_id = p_user_id;
  IF v_ref.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'no_referral'); END IF;
  SELECT commission_rate, status INTO v_rate, v_status FROM public.affiliates WHERE id = v_ref.affiliate_id;
  IF v_status IS DISTINCT FROM 'active' THEN RETURN jsonb_build_object('ok', false, 'reason', 'inactive'); END IF;

  INSERT INTO public.affiliate_commissions
    (affiliate_id, referral_id, referred_user_id, transaction_ref, product_id, amount_cents, commission_cents, currency, commission_rate)
  VALUES (v_ref.affiliate_id, v_ref.id, p_user_id, p_transaction_ref, p_product_id,
          p_amount_cents, round(p_amount_cents * v_rate)::int, upper(coalesce(p_currency, 'EUR')), v_rate)
  ON CONFLICT (transaction_ref, affiliate_id) DO NOTHING;

  UPDATE public.referrals SET status = 'converted', converted_at = COALESCE(converted_at, now())
  WHERE id = v_ref.id;

  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE ALL ON FUNCTION public.record_affiliate_commission(uuid, text, integer, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_commission(uuid, text, integer, text, text) TO service_role;