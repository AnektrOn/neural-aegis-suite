CREATE OR REPLACE FUNCTION public.admin_create_affiliate_by_user(p_user_id uuid, p_code text, p_rate numeric DEFAULT 0.20)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_code text := lower(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9_-]', '', 'g'));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(v_code) < 3 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code'); END IF;
  IF p_user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unknown_user'); END IF;
  IF EXISTS (SELECT 1 FROM public.affiliates WHERE code = v_code AND user_id <> p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code_taken');
  END IF;
  INSERT INTO public.affiliates (user_id, code, commission_rate)
  VALUES (p_user_id, v_code, p_rate)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, commission_rate = EXCLUDED.commission_rate, status = 'active';
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, 'Programme Ambassadeur activé',
    'Votre lien de parrainage est disponible dans votre espace Ambassadeur.', 'info', '/ambassadeur');
  RETURN jsonb_build_object('ok', true, 'code', v_code);
END; $function$;

REVOKE ALL ON FUNCTION public.admin_create_affiliate_by_user(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_affiliate_by_user(uuid, text, numeric) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_revoke_affiliate_by_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.affiliates SET status = 'revoked' WHERE user_id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END; $function$;

REVOKE ALL ON FUNCTION public.admin_revoke_affiliate_by_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_affiliate_by_user(uuid) TO authenticated, service_role;