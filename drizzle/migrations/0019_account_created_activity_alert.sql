-- Reuse the protected activity sender; no new email infrastructure or tables.
CREATE OR REPLACE FUNCTION public.dispatch_account_created_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.is_anonymous IS TRUE OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/send-email-notification',
    headers := public.internal_call_headers(),
    body := jsonb_build_object('type', 'account_created', 'user_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Account creation must never depend on the email provider being available.
  RAISE WARNING 'Account-created activity dispatch failed';
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_account_created_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_account_created_activity() TO service_role;
CREATE TRIGGER on_auth_account_created_activity
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.dispatch_account_created_activity();