-- Executive onboarding — Supabase SQL Editor
-- Projet : https://wjjugtdciljmuohxoqcj.supabase.co
-- Prérequis edge : notify-executive-onboarding-complete déployée
--   Secrets : LOVABLE_API_KEY, GOOGLE_DRIVE_API_KEY, export_internal_secret (vault)

-- =============================================================================
-- A) Funnel (si RPC record_executive_onboarding_funnel introuvable)
--    Sinon : ignorer ce bloc — déjà appliqué via 20261125140000.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- (Coller ici le contenu de supabase/migrations/20261125140000_executive_onboarding_funnel.sql
--  si la table executive_onboarding_funnel_events n’existe pas encore.)

-- =============================================================================
-- B) Forcer l’URL du projet pour pg_net (si app.settings.supabase_url est vide)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_executive_onboarding_complete_async(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/notify-executive-onboarding-complete';
  _key TEXT;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN
    RAISE WARNING 'export_internal_secret manquant dans vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
    ),
    body := jsonb_build_object('user_id', p_user_id),
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_executive_onboarding_complete_async: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_executive_onboarding_abandon_async(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/notify-executive-onboarding-complete';
  _key TEXT;
BEGIN
  IF p_event_id IS NULL THEN RETURN; END IF;

  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'export_internal_secret'
  LIMIT 1;

  IF _key IS NULL OR _key = '' THEN RETURN; END IF;

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', _key
    ),
    body := jsonb_build_object(
      'mode', 'funnel_abandon',
      'event_id', p_event_id
    ),
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_executive_onboarding_abandon_async: %', SQLERRM;
END;
$$;

-- =============================================================================
-- C) TEST 1 — Ligne Google Sheet « sheet_test » (sans profil membre)
--    Déployer l’edge avec mode sheet_test avant d’exécuter.
-- =============================================================================

SELECT net.http_post(
  url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/notify-executive-onboarding-complete',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-internal-secret', (
      SELECT decrypted_secret FROM vault.decrypted_secrets
      WHERE name = 'export_internal_secret' LIMIT 1
    )
  ),
  body := '{"mode":"sheet_test"}'::jsonb,
  timeout_milliseconds := 15000
) AS request_id_sheet_test;

-- Vérifier la réponse HTTP (attendre ~2–5 s puis relancer) :
-- SELECT id, status_code, left(content, 500) AS body
-- FROM net._http_response
-- ORDER BY created DESC
-- LIMIT 5;

-- =============================================================================
-- D) TEST 2 — Funnel abandon en base (+ email/Sheet si step≥3 + email)
-- =============================================================================

SELECT public.record_executive_onboarding_funnel(
  'sql-test-visitor-' || substr(md5(random()::text), 1, 8),
  'abandon',
  4,
  11,
  'fr',
  'test-onboarding@protocolenomos.com',
  jsonb_build_object(
    'full_name', 'Test SQL Editor',
    'occupation', 'Dirigeant test',
    'reason', 'manual_sql_test'
  )
) AS funnel_abandon_result;

-- Derniers événements :
-- SELECT created_at, event_type, micro_step, contact_email, visitor_key, metadata
-- FROM public.executive_onboarding_funnel_events
-- ORDER BY created_at DESC
-- LIMIT 20;

-- =============================================================================
-- E) TEST 3 — Complétion réelle (remplace l’UUID par un membre avec profil exécutif)
-- =============================================================================

-- SELECT public.notify_executive_onboarding_complete_async(
--   '00000000-0000-4000-8000-000000000001'::uuid
-- );

-- Membres onboarding terminé récemment :
-- SELECT p.id, p.onboarding_completed, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE p.onboarding_completed IS TRUE
-- ORDER BY p.updated_at DESC NULLS LAST
-- LIMIT 10;