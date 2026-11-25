#!/usr/bin/env bash
# Append une ligne TEST dans le Google Sheet pré-onboarding + optionnel e-mail admin.
#
# Prérequis (Dashboard Supabase → Edge Functions → Secrets) :
#   LOVABLE_API_KEY, GOOGLE_DRIVE_API_KEY, SUPABASE_SERVICE_ROLE_KEY (auto en runtime)
# Onglet par défaut : Leads!A:Z
#
# Usage :
#   export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
#   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
#   ./scripts/test-executive-onboarding-leads.sh
#   ./scripts/test-executive-onboarding-leads.sh --with-email   # complétion factice (nécessite un vrai user_id + profil)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
if [[ -z "${SUPABASE_URL}" ]] && [[ -f .env ]]; then
  SUPABASE_URL="$(grep -E '^VITE_SUPABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
fi

if [[ -z "${SUPABASE_URL:-}" ]]; then
  echo "Missing SUPABASE_URL or VITE_SUPABASE_URL in .env" >&2
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Missing SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role)" >&2
  exit 1
fi

FN_URL="${SUPABASE_URL%/}/functions/v1/notify-executive-onboarding-complete"

if [[ "${1:-}" == "--with-email" ]]; then
  USER_ID="${2:-}"
  if [[ -z "${USER_ID}" ]]; then
    echo "Usage: $0 --with-email <user_uuid>" >&2
    exit 1
  fi
  BODY=$(printf '{"user_id":"%s"}' "$USER_ID")
else
  BODY='{"mode":"sheet_test"}'
fi

echo "POST $FN_URL"
RESP="$(curl -sS -w "\n%{http_code}" -X POST "$FN_URL" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$BODY")"

HTTP_CODE="$(echo "$RESP" | tail -1)"
BODY_JSON="$(echo "$RESP" | sed '$d')"

echo "$BODY_JSON" | (command -v jq >/dev/null && jq . || cat)
echo "HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" -ge 400 ]]; then
  exit 1
fi