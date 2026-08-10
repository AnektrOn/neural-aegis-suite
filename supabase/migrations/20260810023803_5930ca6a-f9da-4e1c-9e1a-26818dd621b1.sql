CREATE OR REPLACE FUNCTION public.export_activity_row_to_drive(
  p_user_id uuid,
  p_category text,
  p_kind text,
  p_row_id uuid,
  p_occurred_at timestamptz,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ts text;
  _md text;
BEGIN
  IF p_user_id IS NULL OR p_row_id IS NULL THEN
    RETURN;
  END IF;

  _ts := to_char(COALESCE(p_occurred_at, now()), 'YYYY-MM-DD_HH24-MI-SS');
  _md := format(
    E'# %s\n\n- **ID:** %s\n- **Utilisateur:** %s\n- **Horodatage:** %s\n- **Type:** %s\n\n## Données complètes\n\n```json\n%s\n```\n',
    p_kind,
    p_row_id,
    p_user_id,
    COALESCE(p_occurred_at, now())::text,
    p_kind,
    jsonb_pretty(COALESCE(p_payload, '{}'::jsonb))
  );

  PERFORM public.export_to_drive_async(
    p_user_id,
    p_category,
    _ts || '_' || lower(regexp_replace(p_kind, '[^a-zA-Z0-9]+', '-', 'g')) || '_' || p_row_id || '.md',
    _md
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.export_activity_row_to_drive(uuid, text, text, uuid, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_activity_row_to_drive(uuid, text, text, uuid, timestamptz, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_export_relation_quality_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM public.export_activity_row_to_drive(NEW.user_id, 'People', 'Relation quality log', NEW.id, NEW.recorded_at, to_jsonb(NEW));
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_relation_quality_log_to_drive ON public.relation_quality_history;
CREATE TRIGGER export_relation_quality_log_to_drive AFTER INSERT ON public.relation_quality_history FOR EACH ROW EXECUTE FUNCTION public.trg_export_relation_quality_log();

CREATE OR REPLACE FUNCTION public.trg_export_daily_action_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM public.export_activity_row_to_drive(NEW.user_id, 'DailyActions', 'Daily action log', NEW.id, NEW.created_at, to_jsonb(NEW));
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_daily_action_log_to_drive ON public.daily_actions;
CREATE TRIGGER export_daily_action_log_to_drive AFTER INSERT ON public.daily_actions FOR EACH ROW EXECUTE FUNCTION public.trg_export_daily_action_log();

CREATE OR REPLACE FUNCTION public.trg_export_pulse_interaction_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL) THEN
    PERFORM public.export_activity_row_to_drive(NEW.user_id, 'Pulse', 'Pulse card interaction', NEW.id, COALESCE(NEW.completed_at, NEW.created_at), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_pulse_interaction_log_to_drive ON public.aegis_user_card_interactions;
CREATE TRIGGER export_pulse_interaction_log_to_drive AFTER INSERT OR UPDATE OF completed_at ON public.aegis_user_card_interactions FOR EACH ROW EXECUTE FUNCTION public.trg_export_pulse_interaction_log();

CREATE OR REPLACE FUNCTION public.trg_export_finished_user_session_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.ended_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.ended_at IS NULL) THEN
    PERFORM public.export_activity_row_to_drive(NEW.user_id, 'Sessions', 'User session log', NEW.id, NEW.ended_at, to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_finished_user_session_log_to_drive ON public.user_sessions;
CREATE TRIGGER export_finished_user_session_log_to_drive AFTER INSERT OR UPDATE OF ended_at ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.trg_export_finished_user_session_log();

CREATE OR REPLACE FUNCTION public.trg_export_input_hesitation_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM public.export_activity_row_to_drive(NEW.user_id, 'Analytics', 'Input hesitation log', NEW.id, NEW.created_at, to_jsonb(NEW));
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_input_hesitation_log_to_drive ON public.input_hesitations;
CREATE TRIGGER export_input_hesitation_log_to_drive AFTER INSERT ON public.input_hesitations FOR EACH ROW EXECUTE FUNCTION public.trg_export_input_hesitation_log();

CREATE OR REPLACE FUNCTION public.trg_export_app_update_event_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.export_activity_row_to_drive(NEW.user_id, 'Android', 'App update event', NEW.id, NEW.created_at, to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_app_update_event_log_to_drive ON public.app_update_events;
CREATE TRIGGER export_app_update_event_log_to_drive AFTER INSERT ON public.app_update_events FOR EACH ROW EXECUTE FUNCTION public.trg_export_app_update_event_log();

CREATE OR REPLACE FUNCTION public.trg_export_user_app_version_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM public.export_activity_row_to_drive(NEW.user_id, 'Android', 'User app version', NEW.id, NEW.reported_at, to_jsonb(NEW));
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS export_user_app_version_log_to_drive ON public.user_app_versions;
CREATE TRIGGER export_user_app_version_log_to_drive AFTER INSERT OR UPDATE OF version_code, version_name, reported_at ON public.user_app_versions FOR EACH ROW EXECUTE FUNCTION public.trg_export_user_app_version_log();