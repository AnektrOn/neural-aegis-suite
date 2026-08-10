-- Store the shared internal secret used by the DB -> edge function call
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'export_internal_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'export_internal_secret' LIMIT 1),
      'fa0e73dfb052ad56fc8b03a27d06ae3f113e47a299a18cbe'
    );
  ELSE
    PERFORM vault.create_secret(
      'fa0e73dfb052ad56fc8b03a27d06ae3f113e47a299a18cbe',
      'export_internal_secret',
      'Shared secret for export_to_drive_async -> export-to-drive edge function'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.export_to_drive_async(
  p_user_id UUID,
  p_category TEXT,
  p_filename TEXT,
  p_content_md TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT;
  _key TEXT;
BEGIN
  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://wjjugtdciljmuohxoqcj.supabase.co'
  ) || '/functions/v1/export-to-drive';

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RAISE WARNING 'export_to_drive_async: vault secret export_internal_secret is not configured';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
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
$$;

REVOKE ALL ON FUNCTION public.export_to_drive_async(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_to_drive_async(uuid, text, text, text) TO service_role;