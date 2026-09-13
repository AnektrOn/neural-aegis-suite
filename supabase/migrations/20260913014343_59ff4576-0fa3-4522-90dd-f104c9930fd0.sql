-- Meditation library: Drive holds the files, Postgres only stores pointers + assignments.

CREATE TABLE IF NOT EXISTS public.meditation_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  drive_file_id TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  duration_sec INTEGER,
  duration_label TEXT,
  library_scope TEXT NOT NULL CHECK (library_scope = ANY (ARRAY['global_fr', 'global_en', 'perso'])),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meditation_tracks TO authenticated;
GRANT ALL ON public.meditation_tracks TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS meditation_tracks_drive_scope_unique
  ON public.meditation_tracks (drive_file_id, library_scope);

CREATE INDEX IF NOT EXISTS meditation_tracks_scope_idx
  ON public.meditation_tracks (library_scope);

CREATE INDEX IF NOT EXISTS meditation_tracks_created_at_idx
  ON public.meditation_tracks (created_at DESC);

ALTER TABLE public.meditation_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage meditation tracks" ON public.meditation_tracks;
CREATE POLICY "Admins manage meditation tracks"
ON public.meditation_tracks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.meditation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.meditation_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (track_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meditation_assignments TO authenticated;
GRANT ALL ON public.meditation_assignments TO service_role;

CREATE INDEX IF NOT EXISTS meditation_assignments_user_idx
  ON public.meditation_assignments (user_id);

CREATE INDEX IF NOT EXISTS meditation_assignments_track_idx
  ON public.meditation_assignments (track_id);

ALTER TABLE public.meditation_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage meditation assignments" ON public.meditation_assignments;
CREATE POLICY "Admins manage meditation assignments"
ON public.meditation_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users read own meditation assignments" ON public.meditation_assignments;
CREATE POLICY "Users read own meditation assignments"
ON public.meditation_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read assigned meditation tracks" ON public.meditation_tracks;
CREATE POLICY "Users read assigned meditation tracks"
ON public.meditation_tracks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meditation_assignments a
    WHERE a.track_id = meditation_tracks.id AND a.user_id = auth.uid()
  )
);