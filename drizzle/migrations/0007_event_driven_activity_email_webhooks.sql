CREATE FUNCTION public.dispatch_activity_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE anon_key text := 'REDACTED';
BEGIN
 IF TG_TABLE_NAME='assessment_sessions' THEN
  IF NEW.status::text <> 'submitted' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF; END IF;
 ELSE
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN IF OLD.status IS NOT DISTINCT FROM NEW.status AND OLD.completed_at IS NOT DISTINCT FROM NEW.completed_at THEN RETURN NEW; END IF; END IF;
 END IF;
 PERFORM net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/send-email-notification', headers:=jsonb_build_object('Content-Type','application/json','apikey',anon_key), body:=jsonb_build_object('type','activity_event','table',TG_TABLE_NAME,'event_id',NEW.id));
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Activity email dispatch failed: %',SQLERRM; RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.dispatch_activity_email() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_activity_email() TO service_role;
CREATE TRIGGER email_completed_quiz AFTER INSERT OR UPDATE ON public.assessment_sessions FOR EACH ROW EXECUTE FUNCTION public.dispatch_activity_email();
CREATE TRIGGER email_completed_tool AFTER INSERT OR UPDATE ON public.toolbox_completions FOR EACH ROW EXECUTE FUNCTION public.dispatch_activity_email();