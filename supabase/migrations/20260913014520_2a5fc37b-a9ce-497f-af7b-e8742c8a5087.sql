-- 1. Lock down anon EXECUTE on SECURITY DEFINER functions (keep public affiliate click tracking)
REVOKE EXECUTE ON FUNCTION public.admin_create_affiliate(text, text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_create_affiliate_by_user(uuid, text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_affiliate_by_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_commission_status(uuid[], text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_referral(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_affiliate_commissions_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_affiliates_admin_overview() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_affiliates_admin_tracking(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_affiliate_dashboard() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_affiliate_commission(uuid, text, integer, text, text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_create_affiliate(text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_affiliate_by_user(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_affiliate_by_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_commission_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_commissions_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliates_admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliates_admin_tracking(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_affiliate_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_affiliate_commission(uuid, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2. Prevent privilege/plan escalation through self profile updates
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.account_type := OLD.account_type;
  NEW.plan_override := OLD.plan_override;
  NEW.company_id := OLD.company_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();