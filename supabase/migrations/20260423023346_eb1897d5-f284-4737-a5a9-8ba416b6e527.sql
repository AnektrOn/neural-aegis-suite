-- Function: notify admins when an assessment session is submitted
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
  -- Only fire when transitioning into 'submitted'
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

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
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger
DROP TRIGGER IF EXISTS trg_notify_admin_assessment_submitted ON public.assessment_sessions;
CREATE TRIGGER trg_notify_admin_assessment_submitted
AFTER INSERT OR UPDATE OF status ON public.assessment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_assessment_submitted();