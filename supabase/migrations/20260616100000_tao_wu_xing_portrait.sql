-- =============================================================================
-- Tao Wu Xing Portrait — markdown storage only (no generated narrative)
-- Structure: 5 poles × 5 parts (P01–P05) + optional T2 transversal per user.
-- Content is pasted by admin as Markdown (e.g. P01·DIA reports).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_tao_portrait_parts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pole        text        NOT NULL CHECK (pole IN ('wood', 'water', 'fire', 'earth', 'metal', 'transversal')),
  part_id     text        NOT NULL CHECK (part_id IN ('P01_DIA', 'P02_SIG', 'P03_TIM', 'P04_PRX', 'P05_SCL', 'T2_SYNTHESIS')),
  content_md  text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pole, part_id)
);

COMMENT ON TABLE public.user_tao_portrait_parts IS
  'User Tao/Wu Xing portrait sections stored as Markdown. Admin-authored per user.';

COMMENT ON COLUMN public.user_tao_portrait_parts.pole IS
  'Wu Xing pole (wood…metal) or transversal for cross-pole synthesis (T2).';

COMMENT ON COLUMN public.user_tao_portrait_parts.part_id IS
  'P01_DIA … P05_SCL per pole, or T2_SYNTHESIS for transversal report.';

CREATE INDEX IF NOT EXISTS user_tao_portrait_parts_user_idx
  ON public.user_tao_portrait_parts (user_id, pole);

ALTER TABLE public.user_tao_portrait_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own tao portrait parts"
  ON public.user_tao_portrait_parts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admins manage all tao portrait parts"
  ON public.user_tao_portrait_parts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_user_tao_portrait_parts_updated_at
  BEFORE UPDATE ON public.user_tao_portrait_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
