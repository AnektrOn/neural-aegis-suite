ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sidebar_items jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'personal';
DO $$ BEGIN
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_scope_check CHECK (scope IN ('personal','global'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;