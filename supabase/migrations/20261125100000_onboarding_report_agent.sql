-- Global ElevenLabs agent: LOGOS - Onboarding Report (30 min débrief rapport stratégique).

ALTER TABLE public.elevenlabs_settings
  ADD COLUMN IF NOT EXISTS onboarding_report_agent_id TEXT;

COMMENT ON COLUMN public.elevenlabs_settings.onboarding_report_agent_id IS
  'Workspace agent ID for LOGOS - Onboarding Report (strategic report voice debrief).';