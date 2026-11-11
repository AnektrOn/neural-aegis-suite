CREATE FUNCTION public.export_houses72_to_drive() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE _key text; _uid uuid;
BEGIN
 SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name='export_internal_secret' LIMIT 1;
 IF _key IS NULL OR _key='' THEN RAISE WARNING 'houses72 Drive export: export_internal_secret missing'; RETURN NULL; END IF;
 FOR _uid IN SELECT DISTINCT user_id FROM changed_rows LOOP
  PERFORM net.http_post(url:='https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-to-drive',
   headers:=jsonb_build_object('Content-Type','application/json','x-internal-secret',_key),
   body:=jsonb_build_object('action','export_user_full','user_id',_uid,'tables',jsonb_build_array('houses72_responses')),
   timeout_milliseconds:=120000);
 END LOOP;
 RETURN NULL;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'houses72 Drive export failed: %',SQLERRM; RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.export_houses72_to_drive() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.export_houses72_to_drive() TO service_role;
CREATE TRIGGER drive_export_houses72_insert AFTER INSERT ON public.houses72_responses REFERENCING NEW TABLE AS changed_rows FOR EACH STATEMENT EXECUTE FUNCTION public.export_houses72_to_drive();
CREATE TRIGGER drive_export_houses72_update AFTER UPDATE ON public.houses72_responses REFERENCING NEW TABLE AS changed_rows FOR EACH STATEMENT EXECUTE FUNCTION public.export_houses72_to_drive();
