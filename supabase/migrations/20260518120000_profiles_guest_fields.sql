-- Guest funnel: profile fields + account type
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('member', 'guest'));

COMMENT ON COLUMN public.profiles.account_type IS 'member = full app; guest = quiz funnel only';
COMMENT ON COLUMN public.profiles.instagram IS 'Instagram handle or profile URL';
COMMENT ON COLUMN public.profiles.linkedin IS 'LinkedIn profile URL or handle';

-- Enrich auto-profile from auth metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _first TEXT;
  _last TEXT;
  _display TEXT;
  _account TEXT;
BEGIN
  _first := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
  _last := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');
  _display := NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), '');
  IF _display IS NULL AND (_first IS NOT NULL OR _last IS NOT NULL) THEN
    _display := TRIM(CONCAT_WS(' ', _first, _last));
  END IF;
  IF _display IS NULL THEN
    _display := NEW.email;
  END IF;

  _account := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'account_type'), ''), 'member');
  IF _account NOT IN ('member', 'guest') THEN
    _account := 'member';
  END IF;

  INSERT INTO public.profiles (
    id,
    display_name,
    first_name,
    last_name,
    instagram,
    linkedin,
    account_type
  )
  VALUES (
    NEW.id,
    _display,
    _first,
    _last,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'instagram'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'linkedin'), ''),
    _account
  );
  RETURN NEW;
END;
$$;
