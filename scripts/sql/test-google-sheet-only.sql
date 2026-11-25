-- Test UNIQUE : append une ligne sur le Google Sheet pré-onboarding
-- Sheet ID (défaut code) : 1e8WNADbIF-a3b93Iw5rRegmD1AmBABaUHGLuea5VH8w
-- Onglet attendu : Leads (ou secret EXECUTIVE_ONBOARDING_SHEET_RANGE)
--
-- AVANT :
--   1) Déployer notify-executive-onboarding-complete (avec mode "sheet_test")
--   2) Secrets edge : LOVABLE_API_KEY + GOOGLE_DRIVE_API_KEY
--   3) Partager la Sheet avec le compte de service Google (même que Drive — tes exports Sessions OK)
--   4) vault.export_internal_secret configuré (sinon 401)

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Étape 1 : noter le request_id renvoyé (ex. 5699)
WITH sent AS (
  SELECT net.http_post(
    url := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/notify-executive-onboarding-complete',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'export_internal_secret'
        LIMIT 1
      )
    ),
    body := '{"mode":"sheet_test"}'::jsonb,
    timeout_milliseconds := 20000
  ) AS request_id
)
SELECT request_id FROM sent;

-- Étape 2 (5–15 s après) : remplace 5699 par le request_id de l’étape 1
-- NE PAS utiliser ORDER BY created LIMIT 3 seul : tu verras d’autres edges (ex. export Drive Sessions).

SELECT
  id,
  status_code,
  created,
  left(coalesce(content, error_msg::text), 1500) AS response_body
FROM net._http_response
WHERE id = 5699;  -- ← ton request_id

-- Diagnostic si tu ne connais pas l’id : uniquement les réponses « sheet_test »
SELECT id, status_code, created, left(content, 1500) AS response_body
FROM net._http_response
WHERE content LIKE '%sheet_test%' OR content LIKE '%notify-executive%'
ORDER BY created DESC
LIMIT 5;