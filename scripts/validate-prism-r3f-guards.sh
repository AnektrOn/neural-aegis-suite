#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
R3F="$ROOT/src/pages/dev/prism-landing-r3f"

fail() {
  echo "validate-prism-r3f-guards: $1" >&2
  exit 1
}

if rg -q 'pages/dev/prism-landing|@/pages/dev/prism-landing' "$R3F" \
  --glob '!cinematic/*.json' --glob '!**/*.md' 2>/dev/null; then
  fail "import ou chemin vers prism-landing interdit sous prism-landing-r3f"
fi

if rg -q 'createR3fGutterPointLight|getObjectByName.*attach' "$R3F" 2>/dev/null; then
  fail "lumière fente : utiliser R3fGutterLightContext + pointLight sur la tuile (pas attach impératif)"
fi

if rg -q 'LandingR3fDirlightDemoScene|createR3fDirlightGodrays|createR3fGodraysHallSun|createR3fSlitGodraysSun|DirlightDemo' "$R3F" 2>/dev/null; then
  fail "imports directionnel / dirlight demo encore présents sous prism-landing-r3f"
fi

if rg -q 'three-aegis-core' "$R3F" 2>/dev/null; then
  fail "three-aegis-core interdit sous prism-landing-r3f"
fi

if rg -q 'new THREE\.DirectionalLight|DirectionalLight' "$R3F/scene/post" "$R3F/scene/godraysHall" 2>/dev/null; then
  fail "DirectionalLight interdite dans godraysHall/post (lab = PointLight fente)"
fi

if rg -q 'emitterZ\s*=\s*backZ|getGutterCenterY|0\.42' "$R3F/scene/godraysHall" 2>/dev/null; then
  fail "positions émetteur dupliquées ou magic numbers — utiliser r3fSlitSceneMath"
fi

if ! rg -q 'three-good-godrays' "$R3F/scene/LandingR3fPostPipeline.tsx"; then
  fail "LandingR3fPostPipeline doit importer three-good-godrays"
fi

if ! rg -q 'BloomEffect|SSAOEffect' "$R3F/scene/LandingR3fPostPipeline.tsx"; then
  fail "LandingR3fPostPipeline doit importer BloomEffect + SSAOEffect"
fi

if ! rg -q 'R3fGutterLightContext|useGutterPointLight' "$R3F"; then
  fail "R3fGutterLightContext requis pour la PointLight fente"
fi

echo "OK — prism-landing-r3f guards"
rg "three-good-godrays|BloomEffect|SSAOEffect" "$R3F" || true
