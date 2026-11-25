-- After executive pre-login onboarding is harvested (profiles.onboarding_completed),
-- notify admins by email + optional Google Sheet row (edge function).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_executive_onboarding_complete_async(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT;
  _key TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://YOUR_PROJECT.supabase.co'
  ) || '/functions/v1/notify-executive-onboarding-complete';

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RAISE WARNING 'notify_executive_onboarding_complete_async: vault secret export_internal_secret is not configured';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
    ),
    body := jsonb_build_object('user_id', p_user_id),
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_executive_onboarding_complete_async failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_executive_onboarding_complete_async(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_executive_onboarding_complete_async(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_notify_executive_onboarding_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.onboarding_completed IS TRUE
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.onboarding_completed, false) IS DISTINCT FROM true) THEN
    PERFORM public.notify_executive_onboarding_complete_async(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_executive_onboarding_notify ON public.profiles;
CREATE TRIGGER trg_profiles_executive_onboarding_notify
  AFTER INSERT OR UPDATE OF onboarding_completed ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_executive_onboarding_complete();