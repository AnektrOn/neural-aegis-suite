ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'fr';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferred_language_check CHECK (preferred_language IN ('fr','en'));