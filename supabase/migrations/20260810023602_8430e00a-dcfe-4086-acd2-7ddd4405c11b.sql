CREATE OR REPLACE FUNCTION public.export_deep_dive_bundle_async(
  p_user_id uuid,
  p_assessment_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _url text;
  _key text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://wjjugtdciljmuohxoqcj.supabase.co'
  ) || '/functions/v1/export-deep-dive-v2-to-drive';

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RAISE WARNING 'export_deep_dive_bundle_async: vault secret export_internal_secret is not configured';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'assessmentId', p_assessment_id,
      'exportType', 'user',
      'format', 'markdown',
      'filenameStem', 'auto-deep-dive-complet'
    ),
    timeout_milliseconds := 1000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'export_deep_dive_bundle_async failed: %', SQLERRM;
END;
$function$;

REVOKE ALL ON FUNCTION public.export_deep_dive_bundle_async(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_deep_dive_bundle_async(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_auto_export_deep_dive_bundle_on_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.export_deep_dive_bundle_async(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS auto_export_deep_dive_bundle_on_assessment ON public.assessment_sessions;
CREATE TRIGGER auto_export_deep_dive_bundle_on_assessment
AFTER INSERT OR UPDATE OF status ON public.assessment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_export_deep_dive_bundle_on_assessment();

CREATE OR REPLACE FUNCTION public.trg_auto_export_completed_deep_dive_bundle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _answered integer;
BEGIN
  SELECT count(DISTINCT question_code)::integer
  INTO _answered
  FROM public.deepdive_responses
  WHERE user_id = NEW.user_id
    AND (
      COALESCE(array_length(option_codes, 1), 0) > 0
      OR NULLIF(trim(text_value), '') IS NOT NULL
      OR numeric_value IS NOT NULL
    );

  IF _answered >= 70 THEN
    PERFORM public.export_deep_dive_bundle_async(NEW.user_id, NULL);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS auto_export_completed_deep_dive_bundle ON public.deepdive_responses;
CREATE TRIGGER auto_export_completed_deep_dive_bundle
AFTER INSERT OR UPDATE ON public.deepdive_responses
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_export_completed_deep_dive_bundle();