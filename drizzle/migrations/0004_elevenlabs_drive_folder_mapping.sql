CREATE TABLE public.elevenlabs_drive_folders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 target_agent_id text NOT NULL,
 drive_root_id text NOT NULL,
 drive_folder_id text NOT NULL,
 elevenlabs_folder_id text,
 parent_drive_folder_id text,
 folder_name text NOT NULL,
 relative_path text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, target_agent_id, drive_root_id, drive_folder_id)
);
GRANT SELECT ON public.elevenlabs_drive_folders TO authenticated;
GRANT ALL ON public.elevenlabs_drive_folders TO service_role;
ALTER TABLE public.elevenlabs_drive_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Non-guest admins read ElevenLabs folder mappings" ON public.elevenlabs_drive_folders FOR SELECT TO authenticated USING ((auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')));
ALTER TABLE public.elevenlabs_documents ADD COLUMN drive_relative_path text, ADD COLUMN elevenlabs_parent_folder_id text;
