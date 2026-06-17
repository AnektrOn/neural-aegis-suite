-- Migration: houses72_responses — switch to multi-select
-- Replaces the old UNIQUE(user_id, house, question_position) constraint
-- with UNIQUE(user_id, house, question_position, selected_option_position)
-- so that multiple options can be chosen per question, each with its own intensity.

-- 1. Drop the old single-select unique constraint
ALTER TABLE houses72_responses
  DROP CONSTRAINT IF EXISTS houses72_responses_user_id_house_question_position_key;

-- 2. Add the new multi-select unique constraint
ALTER TABLE houses72_responses
  ADD CONSTRAINT houses72_responses_multiselect_unique
  UNIQUE (user_id, house, question_position, selected_option_position);

-- 3. Rebuild the covering index for fast per-user lookups
DROP INDEX IF EXISTS idx_houses72_user_house;
CREATE INDEX idx_houses72_user_house
  ON houses72_responses (user_id, house, question_position, selected_option_position);

COMMENT ON CONSTRAINT houses72_responses_multiselect_unique ON houses72_responses IS
  'One row per (user, house, question, option) — allows multi-select per question.';
