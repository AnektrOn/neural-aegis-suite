
ALTER TABLE public.people_contacts
  ADD COLUMN IF NOT EXISTS proximity TEXT NOT NULL DEFAULT 'employe';

COMMENT ON COLUMN public.people_contacts.proximity IS 'Proximité perçue : famille, ami, équipe de direction, prestataire, employé';

CREATE OR REPLACE FUNCTION public.validate_contact_proximity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.proximity NOT IN ('famille', 'ami', 'equipe_direction', 'prestataire', 'employe') THEN
    RAISE EXCEPTION 'Invalid proximity value: %', NEW.proximity;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_contact_proximity
  BEFORE INSERT OR UPDATE ON public.people_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_proximity();
