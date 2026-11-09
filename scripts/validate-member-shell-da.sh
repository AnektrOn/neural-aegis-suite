#!/usr/bin/env bash
# DA / shell guardrails for member routes (see docs/MEMBER_SHELL_V2_DA_GUARDRAIL.md)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
warn() { echo "WARN: $*"; }
err() { echo "FAIL: $*"; FAIL=1; }

PAGES="src/pages"

echo "== Member shell DA validation =="

# Block legacy dock hacks on migrated wave-1 pages
for f in CaptureHub MoodTracker DecisionLog Journal HabitTracker; do
  if grep -qE 'pb-24|pb-\[calc\(.*dock' "$PAGES/${f}.tsx" 2>/dev/null; then
    err "$PAGES/${f}.tsx still has manual dock padding hack"
  fi
done

# No page-level dock (shell owns it)
dock_files=$(grep -rl 'MobileAppDockBar' "$PAGES" --include='*.tsx' 2>/dev/null | grep -v 'dev/' || true)
if [ -n "$dock_files" ]; then
  err "MobileAppDockBar imported under src/pages (must be App shell only): $dock_files"
fi

# Wave 1 must use scaffold marker
for f in CaptureHub MoodTracker DecisionLog Journal HabitTracker; do
  if ! grep -q 'MemberPageScaffold' "$PAGES/${f}.tsx" 2>/dev/null; then
    err "$PAGES/${f}.tsx missing MemberPageScaffold"
  fi
  if ! grep -q 'data-member-page' "$ROOT/src/layouts/MemberPageScaffold.tsx" 2>/dev/null; then
    err "MemberPageScaffold missing data-member-page attribute"
    break
  fi
done

# H1 should use Cormorant on wave 1 (heuristic: file has MemberPageScaffold and h1 without font-cormorant)
for f in MoodTracker DecisionLog Journal HabitTracker CaptureHub; do
  if grep -q 'MemberPageScaffold' "$PAGES/${f}.tsx" 2>/dev/null; then
    if grep -qE '<h1[^>]*font-display' "$PAGES/${f}.tsx" 2>/dev/null; then
      err "$PAGES/${f}.tsx H1 uses font-display — use font-cormorant (DA guardrail)"
    fi
  fi
done

# Member shell config on
if ! grep -q 'MEMBER_SHELL_V2 = true' src/layouts/memberShellConfig.ts 2>/dev/null; then
  warn "MEMBER_SHELL_V2 is not true — guardrail assumes v2 shell"
fi

# Bio exec: no duplicate dock in prod dashboard component
if grep -q 'immersiveAppShell && desktopLayout.*MobileAppDockBar' src/features/bio-executive-dashboard/BioExecutiveMobileDashboard.tsx 2>/dev/null; then
  err "BioExecutiveMobileDashboard still renders MobileAppDockBar — duplicate shell dock"
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo "OK: no blocking DA/shell violations detected"
  exit 0
fi
exit 1
