-- Run on RESTORED backup project (not prod). Replace YOUR_USER_ID.

-- 1) Sanity: find Mystic / Sage / Healer
SELECT 'snapshots' AS src, snapshot_version, computed_at, top_archetypes
FROM public.archetype_profile_snapshots
WHERE user_id = 'YOUR_USER_ID'
ORDER BY computed_at;

SELECT 'sessions' AS src, id, status, submitted_at, client_meta
FROM public.assessment_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY submitted_at DESC NULLS LAST;

SELECT 'analysis' AS src, session_id, top_archetypes, created_at
FROM public.analysis_results
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

SELECT 'scores_top3' AS src, archetype_key, normalized_score, rank, session_id
FROM public.archetype_scores
WHERE user_id = 'YOUR_USER_ID'
ORDER BY session_id, rank
LIMIT 30;

SELECT 'deepdive_count' AS src, COUNT(*)::int AS n
FROM public.deepdive_responses
WHERE user_id = 'YOUR_USER_ID';

-- 2) Full row counts per table (for export planning)
SELECT 'assessment_sessions' AS tbl, COUNT(*)::int AS n
FROM public.assessment_sessions WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'assessment_responses', COUNT(*)::int
FROM public.assessment_responses r
JOIN public.assessment_sessions s ON s.id = r.session_id
WHERE s.user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'archetype_scores', COUNT(*)::int
FROM public.archetype_scores WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'analysis_results', COUNT(*)::int
FROM public.analysis_results WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'recommendation_tools', COUNT(*)::int
FROM public.recommendation_tools WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'deepdive_responses', COUNT(*)::int
FROM public.deepdive_responses WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'archetype_profile_snapshots', COUNT(*)::int
FROM public.archetype_profile_snapshots WHERE user_id = 'YOUR_USER_ID';
