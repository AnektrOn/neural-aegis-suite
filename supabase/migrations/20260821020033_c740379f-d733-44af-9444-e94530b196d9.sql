REVOKE ALL ON FUNCTION public.get_affiliate_candidates_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() TO service_role;