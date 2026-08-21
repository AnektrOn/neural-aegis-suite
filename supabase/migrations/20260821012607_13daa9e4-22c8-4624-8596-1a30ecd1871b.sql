ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_badge_check timestamptz;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;