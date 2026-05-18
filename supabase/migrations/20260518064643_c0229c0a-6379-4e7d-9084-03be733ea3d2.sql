CREATE OR REPLACE FUNCTION public.export_to_drive_async(p_user_id uuid, p_category text, p_filename text, p_content_md text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-to-drive';
  _anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps';
BEGIN
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'apikey', _anon,
      'x-internal-call', '1'
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
$function$;