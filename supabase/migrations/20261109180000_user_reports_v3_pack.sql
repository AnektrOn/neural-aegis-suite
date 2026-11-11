-- Migration: user_reports_v3_pack
-- Extends public.user_reports to support the AEGIS V3.2 5-file pack standard

ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS level integer,
  ADD COLUMN IF NOT EXISTS level_code text,
  ADD COLUMN IF NOT EXISTS prism_code text,
  ADD COLUMN IF NOT EXISTS scope text CHECK (scope IN ('intra', 'trans')),
  ADD COLUMN IF NOT EXISTS has_safeguard boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pack_files jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Indexes for level, scope and prism filtering
CREATE INDEX IF NOT EXISTS idx_user_reports_level ON public.user_reports(user_id, level);
CREATE INDEX IF NOT EXISTS idx_user_reports_scope ON public.user_reports(user_id, scope);
CREATE INDEX IF NOT EXISTS idx_user_reports_prism ON public.user_reports(user_id, prism_code);
