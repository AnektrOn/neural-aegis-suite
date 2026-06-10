-- Track actual time spent on toolbox exercises (e.g. Grace of the Contract total minutes).

ALTER TABLE public.toolbox_completions
  ADD COLUMN IF NOT EXISTS elapsed_sec INTEGER
    CHECK (elapsed_sec IS NULL OR (elapsed_sec >= 0 AND elapsed_sec <= 21600));

ALTER TABLE public.toolbox_completions
  ADD COLUMN IF NOT EXISTS duration_budget_min INTEGER
    CHECK (duration_budget_min IS NULL OR (duration_budget_min >= 1 AND duration_budget_min <= 180));

COMMENT ON COLUMN public.toolbox_completions.elapsed_sec IS
  'Wall-clock seconds the user spent in the session (completed or abandoned).';

COMMENT ON COLUMN public.toolbox_completions.duration_budget_min IS
  'User total time budget in minutes for this session (habit override or assignment default).';
