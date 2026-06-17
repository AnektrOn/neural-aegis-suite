-- ============================================================================
-- Le Casting des 12 Maisons — 72Q appendix response storage
-- ============================================================================
-- Stores user answers for the "72 Questions du Contrat Sacré" (Phase 2).
-- One row per (user, house, question_position).
-- Scores are computed at read time via houses72Scoring.ts — not stored here.
-- ============================================================================

CREATE TABLE IF NOT EXISTS houses72_responses (
  id                       UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  house                    SMALLINT      NOT NULL CHECK (house BETWEEN 1 AND 12),
  question_position        SMALLINT      NOT NULL CHECK (question_position BETWEEN 1 AND 6),
  selected_option_position SMALLINT      NOT NULL CHECK (selected_option_position BETWEEN 1 AND 6),
  intensity                SMALLINT      NOT NULL DEFAULT 1 CHECK (intensity BETWEEN 1 AND 3),
  answered_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, house, question_position)
);

-- Index for fast per-user loads
CREATE INDEX IF NOT EXISTS idx_houses72_responses_user_id
  ON houses72_responses (user_id);

-- Index for per-house queries (admin analytics)
CREATE INDEX IF NOT EXISTS idx_houses72_responses_house
  ON houses72_responses (house, user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE houses72_responses ENABLE ROW LEVEL SECURITY;

-- Users can read their own responses
CREATE POLICY "houses72_responses_select_own"
  ON houses72_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "houses72_responses_insert_own"
  ON houses72_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses (upsert support)
CREATE POLICY "houses72_responses_update_own"
  ON houses72_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "houses72_responses_delete_own"
  ON houses72_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (admin operations)
CREATE POLICY "houses72_responses_service_role"
  ON houses72_responses
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── Admin read access (for admins with app_metadata.role = 'admin') ──────────

CREATE POLICY "houses72_responses_admin_select"
  ON houses72_responses
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON TABLE houses72_responses IS
  'Stores user answers for the 72 Questions du Contrat Sacré (Le Casting des 12 Maisons). '
  'Scores (polesDelta, houseBreakdown) are computed at read time, never stored here.';

COMMENT ON COLUMN houses72_responses.house IS
  'Caroline Myss astrological house (1–12).';

COMMENT ON COLUMN houses72_responses.question_position IS
  '1-based question position within the house (1–6).';

COMMENT ON COLUMN houses72_responses.selected_option_position IS
  '1-based option position (A=1, B=2, …, F=6).';

COMMENT ON COLUMN houses72_responses.intensity IS
  'Intensity multiplier (1=faible, 2=modéré, 3=fort). Same scale as V4 T1 questions.';
