-- Track how many times a user completed / renewed a toolbox exercise.

ALTER TABLE public.toolbox_completions
  ADD COLUMN IF NOT EXISTS completion_count INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.toolbox_completions.completion_count IS
  'Number of times the user completed this assignment (increments on re-complete).';
