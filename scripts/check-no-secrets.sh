#!/usr/bin/env bash
# Fail if staged files look like they contain secrets. Run before push / public release.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

blocked=(
  '^\.env$'
  '^\.env\.(local|development|production|staging)$'
  'google-services\.json$'
  'keystore\.properties$'
  '\.keystore$'
  '\.jks$'
  'service-account.*\.json$'
  'firebase-adminsdk.*\.json$'
  '\.tmp-appsumo/'
)

staged="$(git diff --cached --name-only --diff-filter=ACMR || true)"
if [[ -z "$staged" ]]; then
  echo "check-no-secrets: nothing staged"
  exit 0
fi

fail=0
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  for pat in "${blocked[@]}"; do
    if [[ "$file" =~ $pat ]]; then
      echo "REFUS: fichier sensible stagé: $file"
      fail=1
    fi
  done
done <<< "$staged"

# Content heuristics on staged text (no printing matches)
if git diff --cached -U0 --diff-filter=ACMR -- '*.env' '*.ts' '*.tsx' '*.js' '*.mjs' '*.json' '*.toml' '*.md' 2>/dev/null \
  | rg -q '(^|\W)(sk_live_|sk_test_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]+|-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ)'; then
  echo "REFUS: motif de secret détecté dans le diff stagé (clé Stripe / PEM / service_role)."
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Retirez ces fichiers/valeurs avant de committer. Utilisez les *.example."
  exit 1
fi

echo "check-no-secrets: ok"
