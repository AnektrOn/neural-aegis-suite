
-- Private internal call secret (random, never committed)
CREATE TABLE IF NOT EXISTS public.internal_call_secrets (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.internal_call_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_call_secrets TO service_role;
ALTER TABLE public.internal_call_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_call_secrets (id, secret)
VALUES (1, encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (id) DO UPDATE SET secret = EXCLUDED.secret, created_at = now();

CREATE OR REPLACE FUNCTION public.check_internal_secret(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p_secret, '') <> '' AND EXISTS (SELECT 1 FROM public.internal_call_secrets WHERE id = 1 AND secret = p_secret);
$$;
REVOKE ALL ON FUNCTION public.check_internal_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_internal_secret(text) TO service_role;

CREATE OR REPLACE FUNCTION public.internal_call_headers()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'Content-Type','application/json',
    'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps',
    'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps',
    'x-internal-secret', COALESCE((SELECT secret FROM public.internal_call_secrets WHERE id = 1), ''));
$$;
REVOKE ALL ON FUNCTION public.internal_call_headers() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_end_user(p_user_id uuid, p_title text, p_message text, p_type text, p_link text, p_email_type text DEFAULT 'subscription_update'::text, p_push_tag text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
DECLARE _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co'; _eligible BOOLEAN := false;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  SELECT true INTO _eligible FROM public.profiles
  WHERE id = p_user_id AND COALESCE(is_disabled, false) = false AND COALESCE(account_type, 'member') <> 'guest';
  IF NOT COALESCE(_eligible, false) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, title, message, type, link) VALUES (p_user_id, p_title, p_message, p_type, p_link);
  BEGIN
    PERFORM net.http_post(url := _url || '/functions/v1/send-push', headers := public.internal_call_headers(),
      body := jsonb_build_object('target','user','user_id',p_user_id,'title',p_title,'message',p_message,'url',COALESCE(p_link,'/'),'tag',COALESCE(p_push_tag,p_type)));
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'notify_end_user push failed: %', SQLERRM; END;
  BEGIN
    PERFORM net.http_post(url := _url || '/functions/v1/send-email-notification', headers := public.internal_call_headers(),
      body := jsonb_build_object('type',p_email_type,'user_id',p_user_id,'data',jsonb_build_object('title',p_title,'message',p_message,'skip_in_app',true)));
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'notify_end_user email failed: %', SQLERRM; END;
END; $function$;
REVOKE ALL ON FUNCTION public.notify_end_user(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_admin_push(p_title text, p_message text, p_url text DEFAULT '/admin/analytics'::text, p_tag text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
BEGIN
  PERFORM net.http_post(url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/send-push', headers := public.internal_call_headers(),
    body := jsonb_build_object('target','admins','title',p_title,'message',p_message,'url',p_url,'tag',COALESCE(p_tag,p_title)));
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'send_admin_push failed: %', SQLERRM;
END; $function$;

CREATE OR REPLACE FUNCTION public.dispatch_activity_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
BEGIN
 IF TG_TABLE_NAME='assessment_sessions' THEN
  IF NEW.status::text <> 'submitted' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF; END IF;
 ELSE
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN IF OLD.status IS NOT DISTINCT FROM NEW.status AND OLD.completed_at IS NOT DISTINCT FROM NEW.completed_at THEN RETURN NEW; END IF; END IF;
 END IF;
 PERFORM net.http_post(url:='https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/send-email-notification', headers:=public.internal_call_headers(), body:=jsonb_build_object('type','activity_event','table',TG_TABLE_NAME,'event_id',NEW.id));
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Activity email dispatch failed: %',SQLERRM; RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.dispatch_newsletter_email_queue(p_limit integer DEFAULT 10)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
BEGIN
  PERFORM net.http_post(url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/send-newsletter-email', headers := public.internal_call_headers(),
    body := jsonb_build_object('action','process_queue','limit',LEAST(GREATEST(p_limit,1),50)));
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'dispatch_newsletter_email_queue failed: %', SQLERRM;
END; $function$;

CREATE OR REPLACE FUNCTION public.export_to_drive_async(p_user_id uuid, p_category text, p_filename text, p_content_md text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
BEGIN
  PERFORM net.http_post(url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-to-drive', headers := public.internal_call_headers(),
    body := jsonb_build_object('user_id',p_user_id,'category',p_category,'filename',p_filename,'content_md',p_content_md), timeout_milliseconds := 60000);
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'export_to_drive_async failed: %', SQLERRM;
END; $function$;

CREATE OR REPLACE FUNCTION public.export_deep_dive_bundle_async(p_user_id uuid, p_assessment_id uuid DEFAULT NULL::uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  PERFORM net.http_post(url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-deep-dive-v2-to-drive', headers := public.internal_call_headers(),
    body := jsonb_build_object('userId',p_user_id,'assessmentId',p_assessment_id,'exportType','user','format','markdown','filenameStem','auto-deep-dive-complet'),
    timeout_milliseconds := 1000);
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'export_deep_dive_bundle_async failed: %', SQLERRM;
END; $function$;

CREATE OR REPLACE FUNCTION public.export_houses72_to_drive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $function$
DECLARE _uid uuid;
BEGIN
 FOR _uid IN SELECT DISTINCT user_id FROM changed_rows LOOP
  PERFORM net.http_post(url:='https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-to-drive', headers:=public.internal_call_headers(),
   body:=jsonb_build_object('action','export_user_full','user_id',_uid,'tables',jsonb_build_array('houses72_responses')), timeout_milliseconds:=120000);
 END LOOP;
 RETURN NULL;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'houses72 Drive export failed: %',SQLERRM; RETURN NULL;
END; $function$;

-- Remove client write paths for server-computed values
DROP POLICY IF EXISTS "Users manage own rune progress" ON public.aegis_user_rune_progress;
DROP POLICY IF EXISTS "Users read own rune progress" ON public.aegis_user_rune_progress;
CREATE POLICY "Users read own rune progress" ON public.aegis_user_rune_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System insert scoreboards" ON public.daily_scoreboards;
DROP POLICY IF EXISTS "Users insert own health scores" ON public.aegis_health_scores;
DROP POLICY IF EXISTS "Users update own health scores" ON public.aegis_health_scores;
DROP POLICY IF EXISTS "Users insert own snapshots" ON public.archetype_profile_snapshots;

CREATE OR REPLACE FUNCTION public.can_read_journal_as_manager(_viewer uuid, _subject uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT (_viewer = auth.uid() OR auth.role() = 'service_role') AND (
    public.is_superadmin(_viewer)
    OR (public.can_view_employee(_viewer, _subject)
      AND EXISTS (SELECT 1 FROM public.employer_data_consent c
        WHERE c.user_id = _subject AND c.accepted_at IS NOT NULL AND c.revoked_at IS NULL)));
$function$;

REVOKE ALL ON FUNCTION public.company_seat_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_seat_count(uuid) TO service_role;
REVOKE ALL ON FUNCTION public._user_top_archetypes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._user_top_archetypes(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.bump_toolbox_assignment_stat(p_assignment_id uuid, p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF p_status NOT IN ('completed', 'abandoned', 'ignored') THEN RETURN; END IF;
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()
       OR NOT EXISTS (SELECT 1 FROM public.toolbox_assignments a WHERE a.id = p_assignment_id AND a.user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
  END IF;
  INSERT INTO public.toolbox_assignment_stats (assignment_id, user_id, completed_count, abandoned_count, ignored_count)
  VALUES (p_assignment_id, p_user_id,
    CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'abandoned' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'ignored' THEN 1 ELSE 0 END)
  ON CONFLICT (assignment_id) DO UPDATE SET
    completed_count = toolbox_assignment_stats.completed_count + CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    abandoned_count = toolbox_assignment_stats.abandoned_count + CASE WHEN p_status = 'abandoned' THEN 1 ELSE 0 END,
    ignored_count = toolbox_assignment_stats.ignored_count + CASE WHEN p_status = 'ignored' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE toolbox_assignment_stats.user_id = p_user_id;
END; $function$;
