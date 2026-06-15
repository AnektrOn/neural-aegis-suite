-- Security hardening: addresses Supabase advisor findings (Realtime, RLS, DEFINER grants, storage).

-- ─── 1. Realtime: remove unused high-sensitivity tables from publication ───
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.user_sessions;
  END IF;
END $$;

-- Deny broadcast/presence on realtime.messages (app uses postgres_changes + table RLS only).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages'
  ) THEN
    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "deny_realtime_broadcast_presence" ON realtime.messages;
    CREATE POLICY "deny_realtime_broadcast_presence"
      ON realtime.messages
      AS RESTRICTIVE
      FOR ALL
      TO public
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- ─── 2. alert_rules: admin-only read (thresholds are operational, not user-facing) ───
DROP POLICY IF EXISTS "Authenticated read alert_rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Admins read alert_rules" ON public.alert_rules;
CREATE POLICY "Admins read alert_rules"
  ON public.alert_rules FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─── 3. drive_folder_cache: explicit deny for API roles (service role bypasses RLS) ───
DROP POLICY IF EXISTS "deny_api_access_drive_folder_cache" ON public.drive_folder_cache;
CREATE POLICY "deny_api_access_drive_folder_cache"
  ON public.drive_folder_cache
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ─── 4. pulse_courses repair: ensure RLS + policies if repair migration ran without them ───
ALTER TABLE IF EXISTS public.pulse_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pulse_course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pulse_user_course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pulse courses readable" ON public.pulse_courses;
CREATE POLICY "Pulse courses readable"
  ON public.pulse_courses FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage pulse courses" ON public.pulse_courses;
CREATE POLICY "Admins manage pulse courses"
  ON public.pulse_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Pulse course sections readable" ON public.pulse_course_sections;
CREATE POLICY "Pulse course sections readable"
  ON public.pulse_course_sections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pulse_courses c
      WHERE c.id = course_id
        AND (c.is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

DROP POLICY IF EXISTS "Admins manage pulse course sections" ON public.pulse_course_sections;
CREATE POLICY "Admins manage pulse course sections"
  ON public.pulse_course_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users manage own pulse course progress" ON public.pulse_user_course_progress;
CREATE POLICY "Users manage own pulse course progress"
  ON public.pulse_user_course_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read pulse course progress" ON public.pulse_user_course_progress;
CREATE POLICY "Admins read pulse course progress"
  ON public.pulse_user_course_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─── 5. Storage avatars: disable public listing, keep read-by-path ───
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars readable by path"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- ─── 6. SECURITY DEFINER: revoke public execute on internal-only RPCs ───
REVOKE ALL ON FUNCTION public.export_to_drive_async(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.export_to_drive_async(uuid, text, text, text) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.notify_all_admins(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_all_admins(text, text, text, text) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.refresh_archetype_scores_by_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_archetype_scores_by_user() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public._user_top_archetypes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._user_top_archetypes(uuid) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.enqueue_newsletter_welcome_email(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_newsletter_welcome_email(text, text) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.enqueue_newsletter_edition_emails(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_newsletter_edition_emails(uuid) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.dispatch_newsletter_email_queue(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispatch_newsletter_email_queue(integer) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.notify_newsletter_edition_in_app(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_newsletter_edition_in_app(uuid) FROM anon, authenticated;

-- ─── 7. export_to_drive_async: service-role auth only (no hardcoded anon JWT) ───
-- Configure once in Dashboard → Project Settings → Vault:
--   name: service_role_key  secret: <your service role key>
CREATE OR REPLACE FUNCTION public.export_to_drive_async(
  p_user_id UUID,
  p_category TEXT,
  p_filename TEXT,
  p_content_md TEXT
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
  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://wjjugtdciljmuohxoqcj.supabase.co'
  ) || '/functions/v1/export-to-drive';

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RAISE WARNING 'export_to_drive_async: vault secret service_role_key is not configured';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key,
      'apikey', _key
    ),
    body := jsonb_build_object(
      'user_id', p_user_id,
      'category', p_category,
      'filename', p_filename,
      'content_md', p_content_md
    ),
    timeout_milliseconds := 60000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'export_to_drive_async failed: %', SQLERRM;
END;
$$;

-- ─── 8. Pin search_path on update_batch_status (trigger-only) ───
CREATE OR REPLACE FUNCTION public.update_batch_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch   record;
  v_count   integer;
  v_needed  integer;
BEGIN
  SELECT * INTO v_batch FROM public.tracking_daily_batches WHERE id = NEW.batch_id;
  v_needed := COALESCE(array_length(v_batch.question_ids, 1), 0);
  IF v_needed = 0 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM public.tracking_daily_responses
    WHERE batch_id = NEW.batch_id;

  IF v_count >= v_needed THEN
    UPDATE public.tracking_daily_batches
      SET status = 'answered', answered_at = now()
      WHERE id = NEW.batch_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_batch_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_batch_status() FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
