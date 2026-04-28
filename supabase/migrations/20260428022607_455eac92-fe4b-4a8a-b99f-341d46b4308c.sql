-- 1. Drop the appendix module entirely
DROP TABLE IF EXISTS public.appendix_responses CASCADE;
DROP TABLE IF EXISTS public.appendix_options CASCADE;
DROP TABLE IF EXISTS public.appendix_questions CASCADE;
DROP TABLE IF EXISTS public.appendix_categories CASCADE;

-- 2. Wipe all assessment data so we can reseed cleanly from the new domain
TRUNCATE TABLE
  public.recommendation_tools,
  public.analysis_results,
  public.archetype_scores,
  public.archetype_profile_snapshots,
  public.assessment_responses,
  public.assessment_options,
  public.assessment_questions,
  public.assessment_sessions
RESTART IDENTITY CASCADE;