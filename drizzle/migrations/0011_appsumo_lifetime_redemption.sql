CREATE TABLE public.appsumo_codes (code_hash text PRIMARY KEY, redeemed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, redeemed_at timestamptz, enabled boolean NOT NULL DEFAULT true, CHECK ((redeemed_at IS NULL AND redeemed_by IS NULL) OR redeemed_at IS NOT NULL));
GRANT SELECT ON public.appsumo_codes TO authenticated;
GRANT ALL ON public.appsumo_codes TO service_role;
ALTER TABLE public.appsumo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_redemptions ON public.appsumo_codes FOR SELECT TO authenticated USING (redeemed_by = auth.uid());
CREATE OR REPLACE FUNCTION public.redeem_appsumo_code(input_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE caller uuid := auth.uid(); item public.appsumo_codes; normalized text := upper(trim(input_code));
BEGIN
 IF caller IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) THEN RETURN jsonb_build_object('error','sign_in_required'); END IF;
 IF normalized IS NULL OR normalized !~ '^AEGIS-[A-Z0-9]{12}$' THEN RETURN jsonb_build_object('error','invalid_code'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(caller::text,0));
 SELECT * INTO item FROM public.appsumo_codes WHERE code_hash = encode(sha256(convert_to(normalized,'UTF8')),'hex') FOR UPDATE;
 IF NOT FOUND OR NOT item.enabled THEN RETURN jsonb_build_object('error','invalid_code'); END IF;
 IF item.redeemed_at IS NOT NULL THEN
   IF item.redeemed_by = caller THEN RETURN jsonb_build_object('success',true,'already_redeemed',true,'product_id','aegis_solo','lifetime',true,'logos',false); END IF;
   RETURN jsonb_build_object('error','already_used');
 END IF;
 IF EXISTS(SELECT 1 FROM public.appsumo_codes WHERE redeemed_by=caller) THEN RETURN jsonb_build_object('error','account_already_activated'); END IF;
 INSERT INTO public.subscriptions(user_id,paddle_subscription_id,paddle_customer_id,product_id,price_id,status,current_period_start,current_period_end,cancel_at_period_end,environment)
 VALUES(caller,'appsumo_' || item.code_hash,'appsumo_' || caller::text,'aegis_solo','appsumo_lifetime','active',now(),NULL,false,'live');
 UPDATE public.appsumo_codes SET redeemed_by=caller,redeemed_at=now() WHERE code_hash=item.code_hash;
 RETURN jsonb_build_object('success',true,'product_id','aegis_solo','lifetime',true,'logos',false);
END; $$;
REVOKE ALL ON FUNCTION public.redeem_appsumo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_appsumo_code(text) TO authenticated;