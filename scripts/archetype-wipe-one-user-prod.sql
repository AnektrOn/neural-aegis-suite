-- Prod only: remove archetype data for ONE user (keeps mood, habits, journal, etc.)
-- Replace YOUR_USER_ID before running.

BEGIN;

CREATE TEMP TABLE _archetype_sessions AS
SELECT id FROM public.assessment_sessions
WHERE user_id = 'YOUR_USER_ID';

DELETE FROM public.assessment_responses
WHERE session_id IN (SELECT id FROM _archetype_sessions);

DELETE FROM public.recommendation_tools
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _archetype_sessions);

DELETE FROM public.archetype_scores
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _archetype_sessions);

DELETE FROM public.analysis_results
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _archetype_sessions);

DELETE FROM public.assessment_sessions
WHERE user_id = 'YOUR_USER_ID';

DELETE FROM public.deepdive_responses
WHERE user_id = 'YOUR_USER_ID';

DELETE FROM public.archetype_profile_snapshots
WHERE user_id = 'YOUR_USER_ID';

COMMIT;

-- Verify (all should be 0):
-- SELECT COUNT(*) FROM assessment_sessions WHERE user_id = 'YOUR_USER_ID';
-- SELECT COUNT(*) FROM archetype_profile_snapshots WHERE user_id = 'YOUR_USER_ID';
