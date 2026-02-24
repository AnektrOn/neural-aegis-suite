
-- Add deferred_until column to decisions
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS deferred_until timestamp with time zone DEFAULT NULL;
