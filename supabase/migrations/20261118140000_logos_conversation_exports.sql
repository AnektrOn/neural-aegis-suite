-- Idempotent tracking for LOGOS post-call Drive exports (audio + transcripts).

CREATE TABLE IF NOT EXISTS public.logos_conversation_exports (
  elevenlabs_conversation_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  agent_id TEXT,
  conversation_date DATE NOT NULL,
  prompt_id TEXT,
  session_mode TEXT,
  logos_drive_path TEXT,
  logos_drive_done BOOLEAN NOT NULL DEFAULT FALSE,
  audio_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
  user_export_done BOOLEAN NOT NULL DEFAULT FALSE,
  user_export_path TEXT,
  user_export_format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logos_conversation_exports_user_idx
  ON public.logos_conversation_exports (user_id, conversation_date DESC);

ALTER TABLE public.logos_conversation_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own logos_conversation_exports" ON public.logos_conversation_exports;
CREATE POLICY "users read own logos_conversation_exports"
  ON public.logos_conversation_exports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.logos_conversation_exports TO authenticated;
GRANT ALL ON public.logos_conversation_exports TO service_role;
