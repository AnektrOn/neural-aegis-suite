CREATE TABLE IF NOT EXISTS public.archetype_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE SET NULL,
  snapshot_version INTEGER NOT NULL DEFAULT 1,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('core_assessment', 'appendix_completed', 'manual_refresh')),
  top_archetypes JSONB NOT NULL DEFAULT '[]'::jsonb,
  all_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  shadow_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  dominant_body TEXT CHECK (dominant_body IS NULL OR dominant_body IN ('physical', 'energetic', 'spiritual')),
  active_principle TEXT,
  admin_notes TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archetype_snapshots_user_date
  ON public.archetype_profile_snapshots (user_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_archetype_snapshots_session
  ON public.archetype_profile_snapshots (session_id);

ALTER TABLE public.archetype_profile_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own snapshots"
  ON public.archetype_profile_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all snapshots"
  ON public.archetype_profile_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users insert own snapshots"
  ON public.archetype_profile_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update snapshots"
  ON public.archetype_profile_snapshots
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
