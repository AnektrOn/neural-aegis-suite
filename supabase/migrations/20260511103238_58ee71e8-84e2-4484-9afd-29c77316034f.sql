
CREATE TABLE IF NOT EXISTS public.drive_folder_cache (
  parent_id text NOT NULL,
  name text NOT NULL,
  drive_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, name)
);

ALTER TABLE public.drive_folder_cache ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can access (which is what we want)
CREATE INDEX IF NOT EXISTS drive_folder_cache_drive_id_idx ON public.drive_folder_cache (drive_id);
