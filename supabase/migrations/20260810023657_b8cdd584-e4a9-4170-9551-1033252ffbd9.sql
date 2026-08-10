CREATE OR REPLACE FUNCTION public.trg_auto_export_deep_dive_bundle_on_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
     AND COALESCE(NEW.client_meta->>'source', '') <> 'admin_guest_preview' THEN
    PERFORM public.export_deep_dive_bundle_async(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;