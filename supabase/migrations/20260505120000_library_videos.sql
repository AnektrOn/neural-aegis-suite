-- Video library (separate from toolbox_assignments)

CREATE TABLE IF NOT EXISTS public.library_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google_drive',
  drive_file_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  library_scope TEXT NOT NULL CHECK (library_scope = ANY (ARRAY['global_fr', 'global_en', 'perso'])),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS library_videos_drive_scope_unique
  ON public.library_videos (drive_file_id, library_scope)
  WHERE drive_file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS library_videos_scope_idx ON public.library_videos (library_scope);
CREATE INDEX IF NOT EXISTS library_videos_created_at_idx ON public.library_videos (created_at DESC);

ALTER TABLE public.library_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage library videos" ON public.library_videos;
CREATE POLICY "Admins manage library videos"
ON public.library_videos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.library_video_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.library_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_id)
);

CREATE INDEX IF NOT EXISTS library_video_assignments_user_idx ON public.library_video_assignments (user_id);
CREATE INDEX IF NOT EXISTS library_video_assignments_video_idx ON public.library_video_assignments (video_id);

ALTER TABLE public.library_video_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage library video assignments" ON public.library_video_assignments;
CREATE POLICY "Admins manage library video assignments"
ON public.library_video_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own library video assignments" ON public.library_video_assignments;
CREATE POLICY "Users read own library video assignments"
ON public.library_video_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read assigned library videos" ON public.library_videos;
CREATE POLICY "Users read assigned library videos"
ON public.library_videos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.library_video_assignments a
    WHERE a.video_id = library_videos.id AND a.user_id = auth.uid()
  )
);
