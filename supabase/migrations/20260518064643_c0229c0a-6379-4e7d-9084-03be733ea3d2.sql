CREATE OR REPLACE FUNCTION public.export_to_drive_async(p_user_id uuid, p_category text, p_filename text, p_content_md text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _url TEXT := 'https://YOUR_PROJECT.supabase.co/functions/v1/export-to-drive';
  _anon TEXT := 'REDACTED';
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