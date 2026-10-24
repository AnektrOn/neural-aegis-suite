# Godrays Hall (`/dev/prism-landing-r3f`)

Lab **R3F-first** : fente / tuile gouttière, sol wasteland, godrays volumétriques. Aucun import depuis `prism-landing` (golden = route legacy intouchable).

## Stack

- **Scène** : `@react-three/fiber` 8 + `drei` (`Environment`, `OrbitControls`, `TransformControls`)
- **Lumière fente** : `<pointLight>` enfant du groupe `r3f-slit-monolith`, ref exposée via `R3fGutterLightContext`
- **Post** : un seul `EffectComposer` impératif (`postprocessing`) + `GodraysPass` (`three-good-godrays`) — pas de second composer JSX (évite double draw)

### Ordre des passes

1. `RenderPass`
2. `GodraysPass` (`gammaCorrection: false` quand bloom/grade suivent)
3. `EffectPass` : `SSAOEffect` + `BloomEffect`
4. `EffectPass` : `VignetteEffect` + `BrightnessContrastEffect` → écran (`encodeOutput`)

Le rendu final est piloté par `LandingR3fPostPipeline` (`useFrame` priority **1**).

## Fichiers clés

| Rôle | Fichier |
| --- | --- |
| Config UI / sliders | `config/r3fSceneConfig.ts`, `ui/GodraysHallControls.tsx` |
| Tuile + point | `scene/godraysHall/LandingR3fSlitMonolith.tsx` |
| Cube fragmenté | `scene/shatteredCube/LandingR3fShatteredCube.tsx` (clic = avancer phase) |
| Context lumière | `config/R3fGutterLightContext.tsx` |
| Post | `scene/LandingR3fPostPipeline.tsx` |
| Assets | `assets/` (voir `assets/ASSETS.md`) |

## Sliders & reset

Panneau sous le canvas : godrays, bloom, SSAO (sliders « N8AO »), grade léger, position monolithe, mode édition (TransformControls — bloc **et** lumière bougent ensemble).

## Preuve fin de tâche

```bash
rg 'pages/dev/prism-landing|@/pages/dev/prism-landing' src/pages/dev/prism-landing-r3f --glob '!cinematic/*.json' && echo FAIL || echo OK
bash scripts/validate-prism-r3f-guards.sh
rg 'three-good-godrays|BloomEffect|SSAOEffect' src/pages/dev/prism-landing-r3f
npm run build
```

Skills Cursor : `.cursor/skills/prism-landing-r3f-stack/SKILL.md`, `.cursor/skills/prism-landing-r3f-gutter-lab/SKILL.md`.
