-- Seed starter tracking questions for Perspective Myss (daily check-in).
-- Safe to re-run: uses ON CONFLICT on (perspective_id, external_key).

INSERT INTO public.tracking_questions (
  perspective_id,
  external_key,
  question_fr,
  question_en,
  question_type,
  scale_min,
  scale_max,
  options,
  archetype_target,
  house_target,
  dimension_target,
  weight,
  sort_order
)
SELECT
  p.id,
  v.external_key,
  v.question_fr,
  v.question_en,
  v.question_type,
  v.scale_min,
  v.scale_max,
  v.options::jsonb,
  v.archetype_target,
  v.house_target,
  v.dimension_target,
  v.weight,
  v.sort_order
FROM public.tracking_perspectives p
CROSS JOIN (
  VALUES
    ('TQ-M-001', 'Dans quelle mesure vous sentez-vous aligné avec votre rôle de leader cette semaine ?', 'To what extent do you feel aligned with your leadership role this week?', 'scale', 1, 10, '[]'::jsonb, 'sovereign', 10, 'light', 1.0, 0),
    ('TQ-M-002', 'Comment décririez-vous votre relation au conflit cette semaine ?', 'How would you describe your relationship with conflict this week?', 'choice', 1, 10, '[{"value":"avoid","label_fr":"J''ai évité les tensions","label_en":"I avoided tensions","weights":[{"archetype":"warrior","polarity":"shadow","weight":2}]},{"value":"navigate","label_fr":"J''ai navigué les défis avec clarté","label_en":"I navigated challenges with clarity","weights":[{"archetype":"warrior","polarity":"light","weight":2}]}]'::jsonb, 'warrior', 6, 'general', 1.0, 1),
    ('TQ-M-003', 'À quel point vous êtes-vous senti connecté à vos émotions profondes ?', 'How connected did you feel to your deep emotions?', 'scale', 1, 10, '[]'::jsonb, 'lover', 7, 'light', 1.0, 2),
    ('TQ-M-004', 'Avez-vous pris soin des autres sans vous oublier ?', 'Did you care for others without forgetting yourself?', 'scale', 1, 10, '[]'::jsonb, 'caregiver', 4, 'general', 1.0, 3),
    ('TQ-M-005', 'Avez-vous donné libre cours à votre créativité ?', 'Did you give free rein to your creativity?', 'scale', 1, 10, '[]'::jsonb, 'creator', 5, 'light', 1.0, 4),
    ('TQ-M-006', 'Avez-vous exploré quelque chose de nouveau ou d''inconnu ?', 'Did you explore something new or unknown?', 'scale', 1, 10, '[]'::jsonb, 'explorer', 9, 'light', 1.0, 5),
    ('TQ-M-007', 'Avez-vous remis en question une habitude ou une norme ?', 'Did you challenge a habit or norm?', 'scale', 1, 10, '[]'::jsonb, 'rebel', 11, 'light', 1.0, 6),
    ('TQ-M-008', 'Avez-vous pris du recul pour voir la situation dans son ensemble ?', 'Did you step back to see the bigger picture?', 'scale', 1, 10, '[]'::jsonb, 'sage', 3, 'light', 1.0, 7),
    ('TQ-M-009', 'Avez-vous senti une connexion à quelque chose de plus grand ?', 'Did you feel connected to something greater?', 'scale', 1, 10, '[]'::jsonb, 'mystic', 12, 'light', 1.0, 8),
    ('TQ-M-010', 'Avez-vous pris soin de votre corps et de votre énergie ?', 'Did you take care of your body and energy?', 'scale', 1, 10, '[]'::jsonb, 'healer', 6, 'light', 1.0, 9),
    ('TQ-M-011', 'Avez-vous transformé une situation difficile en opportunité ?', 'Did you turn a difficult situation into an opportunity?', 'scale', 1, 10, '[]'::jsonb, 'magician', 8, 'light', 1.0, 10),
    ('TQ-M-012', 'Avez-vous accueilli la légèreté et le jeu dans votre quotidien ?', 'Did you welcome lightness and play into your daily life?', 'scale', 1, 10, '[]'::jsonb, 'jester', 5, 'light', 1.0, 11)
) AS v(
  external_key, question_fr, question_en, question_type,
  scale_min, scale_max, options,
  archetype_target, house_target, dimension_target, weight, sort_order
)
WHERE p.slug = 'myss-archetype'
ON CONFLICT (perspective_id, external_key) DO NOTHING;

-- Allow authenticated users to read perspectives (needed for check-in bootstrap)
ALTER TABLE public.tracking_perspectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read active tracking_perspectives" ON public.tracking_perspectives;
CREATE POLICY "users can read active tracking_perspectives"
  ON public.tracking_perspectives
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "admins manage tracking_perspectives" ON public.tracking_perspectives;
CREATE POLICY "admins manage tracking_perspectives"
  ON public.tracking_perspectives
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Guard: don't mark empty batches as answered
CREATE OR REPLACE FUNCTION public.update_batch_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_batch   record;
  v_count   integer;
  v_needed  integer;
BEGIN
  SELECT * INTO v_batch FROM public.tracking_daily_batches WHERE id = NEW.batch_id;
  v_needed := COALESCE(array_length(v_batch.question_ids, 1), 0);
  IF v_needed = 0 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM public.tracking_daily_responses
    WHERE batch_id = NEW.batch_id;

  IF v_count >= v_needed THEN
    UPDATE public.tracking_daily_batches
      SET status = 'answered', answered_at = now()
      WHERE id = NEW.batch_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;
