-- Do not block assessment submission when admin notification hooks fail.

CREATE OR REPLACE FUNCTION public.notify_admin_assessment_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_name TEXT;
  _msg TEXT;
BEGIN
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    BEGIN
      SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
      _msg := COALESCE(_user_name, 'Utilisateur')
        || ' a complété une évaluation d''archétype.';

      PERFORM public.notify_all_admins(
        'Évaluation complétée',
        _msg,
        'admin_assessment',
        '/admin/assessments'
      );
      PERFORM public.send_admin_push(
        'Évaluation complétée',
        _msg,
        '/admin/assessments',
        'assessment-' || NEW.id::text
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_admin_assessment_submitted failed for session %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
