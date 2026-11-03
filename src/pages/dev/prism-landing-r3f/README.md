# Godrays Hall (`/dev/prism-landing-r3f`)

Lab **R3F-first** : fente / tuile gouttière, sol wasteland, godrays volumétriques, **trois sujets** dans un même canvas. Aucun import depuis `prism-landing` (golden = route legacy intouchable).

### Triangle des sujets (placement par défaut)

| Sujet | Rôle | Position (monde ≈) |
| --- | --- | --- |
| Fente / tuile | centre hall, godrays orange | `(monolithCenterX, monolithCenterZ)` → **(0, -6)** |
| Cube fragmenté | 2e sujet, +X hors faisceau fente | offset `+40.5` / `+28` depuis le centre fente |
| Marbre PRISM | 3e sujet, symétrie gauche | offset `marbleHallOffsetX/Z` → **(-38, +26)** depuis le centre fente |

Pied marbre et cube : **Y = 0** (sol wasteland à -0.02). Les offsets marbre sont **relatifs** au centre fente : déplacer « Blocs position X/Z » ne recolle pas automatiquement le marbre au portail (choix lab ; futur drag hall unifié possible).

## Stack

- **Scène** : `@react-three/fiber` 8 + `drei` (`Environment`, `OrbitControls`, `TransformControls`)
- **Lumière fente** : `<pointLight>` enfant du groupe `r3f-slit-monolith`, ref exposée via `R3fGutterLightContext`
- **Post** : un seul `EffectComposer` impératif (`postprocessing`) + `GodraysPass` (`three-good-godrays`) — pas de second composer JSX (évite double draw)

### Ordre des passes

1. `RenderPass`
2. `GodraysPass` fente (orange, `godraysColor` / lumière gouttière)
3. `GodraysPass` noyau cube (cyan, `r3f-cube-core-point-light` au centre du fragmenté)
4. `EffectPass` : `SSAOEffect` + `BloomEffect`
5. `EffectPass` : `VignetteEffect` + `BrightnessContrastEffect` → écran (`encodeOutput`)

Le rendu final est piloté par `LandingR3fPostPipeline` (`useFrame` priority **1**).

### Lumière cube vs fente

- **Direct 3D** : fente + spill piliers = **layer 0** ; cube fragmenté = **layer 1** (`R3F_SHATTERED_CUBE_LIGHT_LAYER`) — le basalte n’est pas éclairé par les `PointLight` de la gouttière.
- **Post** : l’orange est le `GodraysPass` monolithe (plein écran) ; le cyan est un second `GodraysPass` depuis la seule `PointLight` du noyau (`r3f-cube-core-point-light`, enregistrée via `R3fCubeCoreLightContext`).
- **Burst cube** : cube plein (sans cavité), phases `hold` → `burst` (pas de `reform`). Une seule source 3D au centre ; intensité noyau, halo et `godrayReveal` pilotés par ray march CPU (`computeCoreEscapeGain`, `R3F_CUBE_CORE_ESCAPE`, `escapeRamp` dans `computeCubeCoreVisualLevels`). En `hold` : faible émission, `godrayReveal = 0`, pass godrays cube désactivé.

## Fichiers clés

| Rôle | Fichier |
| --- | --- |
| Config UI / sliders | `config/r3fSceneConfig.ts`, `ui/GodraysHallControls.tsx` |
| Tuile + point | `scene/godraysHall/LandingR3fSlitMonolith.tsx` |
| Cube fragmenté | `scene/shatteredCube/LandingR3fShatteredCube.tsx` (clic = avancer phase) |
| Marbre PRISM | `scene/marbleMonolith/LandingR3fMarbleMonolith.tsx` (lumières locales, pas godrays fente/cube) |
| Context lumière fente | `config/R3fGutterLightContext.tsx` |
| Context lumière cube | `config/R3fCubeCoreLightContext.tsx` |
| Calcul lumière cube | `scene/shatteredCube/r3fCubeCoreLighting.ts` |
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

## Landing produit `/prism`

Route publique : [`PrismR3fLandingPage.tsx`](pages/PrismR3fLandingPage.tsx) — même pipeline 3D que le lab (`LandingR3fSceneContent`, `sceneMode="landing"`), shell Hubtown-like (loader, HUD, 6 chapitres placeholder, scroll verrouillé, NEXT/PREV.).

| Élément | Fichier |
| --- | --- |
| Shell + scroll lock | `landing/PrismR3fLandingShell.tsx` |
| HUD / menu / loader | `landing/PrismR3fLandingHud.tsx`, `PrismR3fLandingLoader.tsx` |
| Chapitres placeholder | `landing/prismR3fLandingChapters.ts` |
| Beats + nav | `landing/prismR3fLandingBeats.ts` — NEXT linéaire · PREV saute transitions |
| Effets beat | `landing/usePrismLandingBeatEffects.ts` — cube burst / godrays fente |
| Caméra Theatre | `landing/PrismR3fLandingTheatreRig.tsx` + `cinematic/landingR3fCamera.state.json` |
| Design log | `docs/PRISM_LANDING_BRAINSTORM.md` |
| Canvas landing | `ui/PrismR3fLandingCanvas.tsx` |

**Lab inchangé** : `/dev/prism-landing-r3f` + `GodraysHallControls`. `cubeGutterGodraysAttenuation` = 0 par défaut (landing et lab).
