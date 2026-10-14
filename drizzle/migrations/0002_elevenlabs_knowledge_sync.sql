ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS elevenlabs_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.elevenlabs_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_agent_id TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual_md' CHECK (source_type IN ('manual_md','drive_file')),
  drive_file_id TEXT,
  file_name TEXT NOT NULL,
  elevenlabs_document_id TEXT,
  content_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploading','success','failed')),
  error_message TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_el_docs_agent ON public.elevenlabs_documents (target_agent_id, file_name);
GRANT SELECT ON public.elevenlabs_documents TO authenticated;
GRANT ALL ON public.elevenlabs_documents TO service_role;
ALTER TABLE public.elevenlabs_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read elevenlabs docs" ON public.elevenlabs_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('manual_md_upload','drive_user_sync','drive_all_users_sync')),
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','success','failed','partial_success')),
  files_processed INT NOT NULL DEFAULT 0,
  files_succeeded INT NOT NULL DEFAULT 0,
  files_failed INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  summary TEXT
);
GRANT SELECT ON public.sync_jobs TO authenticated;
GRANT ALL ON public.sync_jobs TO service_role;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sync jobs" ON public.sync_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.elevenlabs_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  main_agent_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.elevenlabs_settings TO authenticated;
GRANT ALL ON public.elevenlabs_settings TO service_role;
ALTER TABLE public.elevenlabs_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read elevenlabs settings" ON public.elevenlabs_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
INSERT INTO public.elevenlabs_settings (id) VALUES (true) ON CONFLICT DO NOTHING;