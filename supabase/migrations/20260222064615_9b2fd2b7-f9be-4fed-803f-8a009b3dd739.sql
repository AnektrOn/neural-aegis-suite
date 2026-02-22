
-- Add sleep, stress, and meals data to mood_entries
ALTER TABLE public.mood_entries 
  ADD COLUMN sleep numeric(3,1) DEFAULT NULL,
  ADD COLUMN stress numeric(3,1) DEFAULT NULL,
  ADD COLUMN meals_count integer DEFAULT NULL,
  ADD COLUMN meals jsonb DEFAULT NULL;
-- meals jsonb format: [{"size": "small"|"medium"|"large"}]
