-- Restore Caroline's real archetype profile from export 2026-05-14
-- userId: 25d80046-d3f4-43f2-933a-ade961f20e28
-- session: 358f48a3-6efd-47ab-80b7-f8f9dc8303f9
-- Top 3 (70Q): mystic / sage / healer
--
-- Run in Supabase SQL Editor (prod).
-- NOTE: Les 30 réponses du export ne sont PAS réinjectées — les UUID des questions
-- ont changé depuis avril 2026 (FK assessment_questions). Les scores 70Q suffisent
-- pour afficher Mystic / Sage / Healer dans Persona.

BEGIN;

-- ─── 1. Wipe polluted archetype data for this user only ───
CREATE TEMP TABLE _wipe_sessions AS
SELECT id FROM public.assessment_sessions
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28';

DELETE FROM public.assessment_responses
WHERE session_id IN (SELECT id FROM _wipe_sessions);

DELETE FROM public.recommendation_tools
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28'
   OR session_id IN (SELECT id FROM _wipe_sessions);

DELETE FROM public.archetype_scores
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28'
   OR session_id IN (SELECT id FROM _wipe_sessions);

DELETE FROM public.analysis_results
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28'
   OR session_id IN (SELECT id FROM _wipe_sessions);

DELETE FROM public.assessment_sessions
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28';

DELETE FROM public.archetype_profile_snapshots
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28';

-- Keep deepdive_responses if present (70Q answers). Uncomment to wipe and re-import from backup:
-- DELETE FROM public.deepdive_responses WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28';

-- ─── 2. Session (submitted 2026-04-28) ───
INSERT INTO public.assessment_sessions (
  id, user_id, template_id, status, started_at, submitted_at,
  duration_seconds, confidence_score, client_meta
)
SELECT
  '358f48a3-6efd-47ab-80b7-f8f9dc8303f9'::uuid,
  '25d80046-d3f4-43f2-933a-ade961f20e28'::uuid,
  t.id,
  'submitted'::public.assessment_session_status,
  '2026-04-28T03:27:04.485588+00:00'::timestamptz,
  '2026-04-28T03:34:28.973+00:00'::timestamptz,
  444,
  100,
  '{"restored_from":"export-2026-05-14","note":"Mystic Sage Healer"}'::jsonb
FROM public.assessment_templates t
WHERE t.slug IN ('archetype-v2-70q', 'archetype-v1')
ORDER BY t.version DESC
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  submitted_at = EXCLUDED.submitted_at,
  duration_seconds = EXCLUDED.duration_seconds,
  confidence_score = EXCLUDED.confidence_score,
  client_meta = EXCLUDED.client_meta;

-- ─── 3. (skipped) assessment_responses — old question UUIDs invalid in prod ───

-- ─── 4. Scores from Deep Dive 70 export (NOT the 30Q-only table that had healer=0) ───
INSERT INTO public.archetype_scores (session_id, user_id, archetype_key, raw_score, normalized_score, rank)
VALUES
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','mystic',    18, 100,    1),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','sage',      14, 77.78,  2),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','healer',     8, 44.44,  3),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','warrior',    5, 27.78,  4),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','sovereign',  5, 27.78,  5),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','creator',    5, 27.78,  6),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','child',      3, 16.67,  7),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','prostitute', 3, 16.67,  8),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','explorer',   2, 11.11,  9),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','saboteur',   1,  5.56, 10),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','rebel',      1,  5.56, 11),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','victim',     1,  5.56, 12),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','lover',      1,  5.56, 13),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','caregiver',  1,  5.56, 14),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','magician',   1,  5.56, 15),
('358f48a3-6efd-47ab-80b7-f8f9dc8303f9','25d80046-d3f4-43f2-933a-ade961f20e28','jester',     1,  5.56, 16)
ON CONFLICT (session_id, archetype_key) DO UPDATE SET
  raw_score = EXCLUDED.raw_score,
  normalized_score = EXCLUDED.normalized_score,
  rank = EXCLUDED.rank;

-- ─── 5. Analysis (top 3 = mystic, sage, healer) ───
INSERT INTO public.analysis_results (
  session_id, user_id, top_archetypes, dimension_scores, shadow_signals,
  strengths_fr, strengths_en, watchouts_fr, watchouts_en, summary_fr, summary_en
)
VALUES (
  '358f48a3-6efd-47ab-80b7-f8f9dc8303f9',
  '25d80046-d3f4-43f2-933a-ade961f20e28',
  ARRAY['mystic','sage','healer']::text[],
  '{}'::jsonb,
  '{"prostitute":0.67,"saboteur":1,"victim":1,"caregiver":1,"child":0.33}'::jsonb,
  ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[],
  'Profil restauré depuis export 2026-05-14 — triade Mystique / Sage / Healer.',
  'Profile restored from 2026-05-14 export — Mystic / Sage / Healer triad.'
)
ON CONFLICT (session_id) DO UPDATE SET
  top_archetypes = EXCLUDED.top_archetypes,
  shadow_signals = EXCLUDED.shadow_signals,
  summary_fr = EXCLUDED.summary_fr,
  summary_en = EXCLUDED.summary_en;

-- ─── 6. Snapshot (append-only backup for future restores) ───
INSERT INTO public.archetype_profile_snapshots (
  user_id, session_id, snapshot_version, trigger_event,
  top_archetypes, all_scores, shadow_scores, dimension_scores, computed_at
)
VALUES (
  '25d80046-d3f4-43f2-933a-ade961f20e28',
  '358f48a3-6efd-47ab-80b7-f8f9dc8303f9',
  1,
  'manual_refresh',
  '[
    {"key":"mystic","name_fr":"Mystique","name_en":"Mystique","score":1,"rank":1},
    {"key":"sage","name_fr":"Sage","name_en":"Sage","score":0.78,"rank":2},
    {"key":"healer","name_fr":"Healer","name_en":"Healer","score":0.44,"rank":3}
  ]'::jsonb,
  '{
    "mystic":1,"sage":0.78,"healer":0.44,"warrior":0.28,"sovereign":0.28,"creator":0.28,
    "child":0.17,"prostitute":0.17,"explorer":0.11,"saboteur":0.06,"rebel":0.06,"victim":0.06,
    "lover":0.06,"caregiver":0.06,"magician":0.06,"jester":0.06
  }'::jsonb,
  '{"prostitute":0.67,"saboteur":1,"victim":1,"caregiver":1,"child":0.33}'::jsonb,
  '{}'::jsonb,
  '2026-05-14T07:38:31.280Z'::timestamptz
);

COMMIT;

-- Verify:
SELECT top_archetypes FROM public.analysis_results
WHERE user_id = '25d80046-d3f4-43f2-933a-ade961f20e28';

SELECT archetype_key, rank FROM public.archetype_scores
WHERE session_id = '358f48a3-6efd-47ab-80b7-f8f9dc8303f9'
ORDER BY rank LIMIT 5;
