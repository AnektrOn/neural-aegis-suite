-- Lifetime counters per toolbox assignment (survive reload / completion reset).

CREATE TABLE IF NOT EXISTS public.toolbox_assignment_stats (
  assignment_id UUID PRIMARY KEY REFERENCES public.toolbox_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  abandoned_count INTEGER NOT NULL DEFAULT 0,
  ignored_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.toolbox_assignment_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own toolbox assignment stats"
  ON public.toolbox_assignment_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own toolbox assignment stats"
  ON public.toolbox_assignment_stats
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_toolbox_assignment_stats_user
  ON public.toolbox_assignment_stats(user_id);

-- Backfill from current completions (best-effort).
INSERT INTO public.toolbox_assignment_stats (assignment_id, user_id, completed_count, abandoned_count, ignored_count)
SELECT
  tc.assignment_id,
  tc.user_id,
  CASE WHEN tc.status = 'completed' THEN GREATEST(COALESCE(tc.completion_count, 1), 1) ELSE 0 END,
  CASE WHEN tc.status = 'abandoned' THEN 1 ELSE 0 END,
  CASE WHEN tc.status = 'ignored' THEN 1 ELSE 0 END
FROM public.toolbox_completions tc
ON CONFLICT (assignment_id) DO UPDATE SET
  completed_count = GREATEST(toolbox_assignment_stats.completed_count, EXCLUDED.completed_count),
  abandoned_count = GREATEST(toolbox_assignment_stats.abandoned_count, EXCLUDED.abandoned_count),
  ignored_count = GREATEST(toolbox_assignment_stats.ignored_count, EXCLUDED.ignored_count),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.bump_toolbox_assignment_stat(
  p_assignment_id UUID,
  p_user_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('completed', 'abandoned', 'ignored') THEN
    RETURN;
  END IF;

  INSERT INTO public.toolbox_assignment_stats (
    assignment_id,
    user_id,
    completed_count,
    abandoned_count,
    ignored_count
  )
  VALUES (
    p_assignment_id,
    p_user_id,
    CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'abandoned' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'ignored' THEN 1 ELSE 0 END
  )
  ON CONFLICT (assignment_id) DO UPDATE SET
    completed_count = toolbox_assignment_stats.completed_count
      + CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    abandoned_count = toolbox_assignment_stats.abandoned_count
      + CASE WHEN p_status = 'abandoned' THEN 1 ELSE 0 END,
    ignored_count = toolbox_assignment_stats.ignored_count
      + CASE WHEN p_status = 'ignored' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_toolbox_assignment_stat(UUID, UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
