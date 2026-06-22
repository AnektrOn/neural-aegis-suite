
-- 1. aegis_synapse_cards: restrict by target_user_ids
DROP POLICY IF EXISTS "Aegis cards readable" ON public.aegis_synapse_cards;
CREATE POLICY "Aegis cards readable" ON public.aegis_synapse_cards
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_active = true
    AND (
      target_user_ids IS NULL
      OR array_length(target_user_ids, 1) IS NULL
      OR auth.uid() = ANY(target_user_ids)
    )
  )
);

-- 2. app_releases: remove anonymous public read
DROP POLICY IF EXISTS "Public can read published releases" ON public.app_releases;
CREATE POLICY "Authenticated can read published releases" ON public.app_releases
FOR SELECT TO authenticated
USING (is_published = true);

-- 3. houses72_responses: replace JWT-claim admin policy with has_role()
DROP POLICY IF EXISTS houses72_responses_admin_select ON public.houses72_responses;
CREATE POLICY houses72_responses_admin_select ON public.houses72_responses
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add fixed search_path to the 4 functions missing it
ALTER FUNCTION public.resolve_i18n(jsonb, text) SET search_path = public;
ALTER FUNCTION public.resolve_i18n_array(jsonb, text) SET search_path = public;
ALTER FUNCTION public.resolve_course_content(jsonb, text) SET search_path = public;
ALTER FUNCTION public.update_batch_status() SET search_path = public;

-- 5. Revoke SECURITY DEFINER function execution from anon/PUBLIC; grant to authenticated
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon', r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', r.proname, r.args);
  END LOOP;
END $$;
