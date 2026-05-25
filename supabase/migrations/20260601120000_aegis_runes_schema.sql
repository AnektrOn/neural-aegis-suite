-- Aegis Synapse: micro-learning swipe module (Kybalion runes + cards).

CREATE TYPE public.aegis_swipe_action AS ENUM ('assimilated', 'ignored');

-- Catalogue des 7 principes (Runes).
CREATE TABLE public.aegis_rune_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  quote_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  bg_class TEXT NOT NULL DEFAULT 'from-slate-900 to-black',
  text_class TEXT NOT NULL DEFAULT 'text-slate-200',
  sort_order INT NOT NULL DEFAULT 0,
  pulses_to_unlock INT NOT NULL DEFAULT 3 CHECK (pulses_to_unlock > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fragments micro-learning (cartes swipe).
CREATE TABLE public.aegis_synapse_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principle_id UUID NOT NULL REFERENCES public.aegis_rune_principles(id) ON DELETE RESTRICT,
  external_key TEXT UNIQUE,
  title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  problem_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  bullets_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  format_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  course_content_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_label TEXT NOT NULL DEFAULT '2 MIN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historique swipe par utilisateur (une interaction max par carte).
CREATE TABLE public.aegis_user_card_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.aegis_synapse_cards(id) ON DELETE CASCADE,
  action public.aegis_swipe_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT aegis_user_card_interactions_user_card_unique UNIQUE (user_id, card_id)
);

-- Progression des Runes par utilisateur.
CREATE TABLE public.aegis_user_rune_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  principle_id UUID NOT NULL REFERENCES public.aegis_rune_principles(id) ON DELETE CASCADE,
  pulses_count INT NOT NULL DEFAULT 0 CHECK (pulses_count >= 0),
  unlocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, principle_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aegis_synapse_cards_principle
  ON public.aegis_synapse_cards (principle_id, sort_order)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_aegis_user_card_interactions_user_action
  ON public.aegis_user_card_interactions (user_id, action);

CREATE INDEX IF NOT EXISTS idx_aegis_user_card_interactions_user_card
  ON public.aegis_user_card_interactions (user_id, card_id);

CREATE INDEX IF NOT EXISTS idx_aegis_user_rune_progress_user
  ON public.aegis_user_rune_progress (user_id);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_aegis_rune_principles_updated_at ON public.aegis_rune_principles;
CREATE TRIGGER trg_aegis_rune_principles_updated_at
  BEFORE UPDATE ON public.aegis_rune_principles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_aegis_synapse_cards_updated_at ON public.aegis_synapse_cards;
CREATE TRIGGER trg_aegis_synapse_cards_updated_at
  BEFORE UPDATE ON public.aegis_synapse_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_aegis_user_rune_progress_updated_at ON public.aegis_user_rune_progress;
CREATE TRIGGER trg_aegis_user_rune_progress_updated_at
  BEFORE UPDATE ON public.aegis_user_rune_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rune progress: increment on assimilated swipe
CREATE OR REPLACE FUNCTION public.aegis_on_card_assimilated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _principle_id UUID;
  _pulses_to_unlock INT;
  _new_count INT;
BEGIN
  IF NEW.action <> 'assimilated' THEN
    RETURN NEW;
  END IF;

  SELECT c.principle_id, p.pulses_to_unlock
  INTO _principle_id, _pulses_to_unlock
  FROM public.aegis_synapse_cards c
  JOIN public.aegis_rune_principles p ON p.id = c.principle_id
  WHERE c.id = NEW.card_id;

  IF _principle_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.aegis_user_rune_progress (user_id, principle_id, pulses_count, unlocked_at)
  VALUES (NEW.user_id, _principle_id, 1, NULL)
  ON CONFLICT (user_id, principle_id)
  DO UPDATE SET
    pulses_count = aegis_user_rune_progress.pulses_count + 1,
    unlocked_at = CASE
      WHEN aegis_user_rune_progress.unlocked_at IS NOT NULL THEN aegis_user_rune_progress.unlocked_at
      WHEN aegis_user_rune_progress.pulses_count + 1 >= _pulses_to_unlock THEN now()
      ELSE NULL
    END,
    updated_at = now()
  RETURNING pulses_count INTO _new_count;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aegis_on_card_assimilated ON public.aegis_user_card_interactions;
CREATE TRIGGER trg_aegis_on_card_assimilated
  AFTER INSERT ON public.aegis_user_card_interactions
  FOR EACH ROW EXECUTE FUNCTION public.aegis_on_card_assimilated();

-- RLS
ALTER TABLE public.aegis_rune_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aegis_synapse_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aegis_user_card_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aegis_user_rune_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aegis principles readable" ON public.aegis_rune_principles;
CREATE POLICY "Aegis principles readable"
  ON public.aegis_rune_principles
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Aegis principles admin manage" ON public.aegis_rune_principles;
CREATE POLICY "Aegis principles admin manage"
  ON public.aegis_rune_principles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Aegis cards readable" ON public.aegis_synapse_cards;
CREATE POLICY "Aegis cards readable"
  ON public.aegis_synapse_cards
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Aegis cards admin manage" ON public.aegis_synapse_cards;
CREATE POLICY "Aegis cards admin manage"
  ON public.aegis_synapse_cards
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users manage own synapse interactions" ON public.aegis_user_card_interactions;
CREATE POLICY "Users manage own synapse interactions"
  ON public.aegis_user_card_interactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read synapse interactions" ON public.aegis_user_card_interactions;
CREATE POLICY "Admins read synapse interactions"
  ON public.aegis_user_card_interactions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users manage own rune progress" ON public.aegis_user_rune_progress;
CREATE POLICY "Users manage own rune progress"
  ON public.aegis_user_rune_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read rune progress" ON public.aegis_user_rune_progress;
CREATE POLICY "Admins read rune progress"
  ON public.aegis_user_rune_progress
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

COMMENT ON TABLE public.aegis_rune_principles IS 'Catalogue des 7 Runes (principes Kybalion) pour le module Synapse.';
COMMENT ON TABLE public.aegis_synapse_cards IS 'Cartes micro-learning swipe (contenu i18n JSONB).';
COMMENT ON TABLE public.aegis_user_card_interactions IS 'Swipes assimilé/ignoré par utilisateur (une fois par carte).';
COMMENT ON TABLE public.aegis_user_rune_progress IS 'Progression des Runes par utilisateur.';
