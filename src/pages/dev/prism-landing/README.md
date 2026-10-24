# Prism landing (dev)

Organisation du module `/dev/prism-landing`, `/dev/prism-landing-opt` et `/dev/prism-layout`.

| Dossier | Rôle |
|---------|------|
| `pages/` | Routes React (landing, landing perf, layout editor, cube dev) |
| `ui/` | Canvas WebGL + panneaux réglages |
| `camera/` | Path travelling, keyframes, presets, rig |
| `cinematic/` | Contrats shot list, drone moves / post |
| `layout/` | Positions scène, bounds, terrain, constantes |
| `scene/` | Construction Three.js (monolithe cosmique, assets) |
| `components/` | Sous-composants R3F / monolithe |
| `assets/` | Textures ciblées + fonts — voir **`assets/ASSETS.md`** (inventaire / nettoyage / Fab) |
| `docs/` | Bibles cinéma + prompt topologie IA |
| `styles/` | CSS des pages |

## Routes landing (golden vs opt)

| Route | Entrée | Profil perf |
|-------|--------|-------------|
| `/dev/prism-landing` | `PrismLandingPage` → `PrismLandingCanvas` → `createCosmicMonolithLandingScene` | **default** (comportement historique) |
| `/dev/prism-landing-opt` | `PrismLandingPageOpt` → `PrismLandingCanvasOpt` → `createCosmicMonolithLandingSceneOpt` | **optimized** (DPR adaptatif, throttle rendu idle ~30 FPS, pause onglet caché) |
| `/dev/prism-landing-r3f` | *(à créer)* — voir `docs/R3F_RECONSTRUCTION_PROMPT.md` | R3F + Theatre + pile imposée (golden inchangée) |

Le contrat partagé est dans `scene/prismLandingPerformance.ts`. Le wrapper golden `createCosmicMonolithLandingScene.ts` reste inchangé (pas de flag perf).

## Checklist A/B manuelle (post-merge)

**Golden** (`/dev/prism-landing`)

- Play / pause du travelling, scrub `u` et étapes keyframes
- Panneau réglages : sliders, filtres, fermeture
- Resize fenêtre / panneau
- Perte de contexte WebGL (si reproduisible) → message fallback

**Opt** (`/dev/prism-landing-opt`)

- Même checklist visuelle et fonctionnelle
- Panneau réglages : section **Performance** (profil, DPR, pause onglet, throttle idle)
- Onglet navigateur caché → boucle WebGL en pause (0 frame GPU)
- Travelling en pause, orbite souris → throttle idle actif (moins de frames, reprise pleine vitesse au play)

### Atmosphère (debug)

Query params sur `/dev/prism-landing` :

- `?monolithDebug=hdr` — sans bloom / godrays / grade (silhouette brute)
- `?monolithDebug=nobloom` | `nogodrays` | `nopost`
- `?atmoMist=0` | `atmoHaze=0` | `atmoMotes=0` | `atmoPortalSprites=0` | `atmoGodrays=0` | `atmoBloom=0` | `atmoGrade=0`
- `?composer=three` — pipeline post **three/addons** (godrays radiaux écran) ; défaut = **postprocessing** + godrays volumétriques (`three-good-godrays`)

### Post landing (pmndrs)

- Ordre : `RenderPass` → `GodraysPass` (ombre directionnelle dédiée) → réalisme optionnel (SSAO ex-GTAO, volume portail, DoF) → fog + bloom → grade (encodage sRGB unique).
- `GodraysPass` : `gammaCorrection: false` (le grade encode la sortie).
- Parité `?composer=three` : bloom Unreal vs `BloomEffect` (intensity × ~2,85), godrays radiaux vs volumétriques, GTAO three vs SSAO pmndrs.

Preset **Villeneuve** par défaut dans Réglages (multiplicateurs sur l’interpolation atmosphère 0→2).

### Sol « rive humide » (landing travelling)

`scene/landingShoreGround.ts` : procédural par défaut ; **3 PNG Fab** dans `assets/textures/shore/` → PBR auto (`BaseColor` + `Roughness` + `Normal`). Guide complet : [`assets/ASSETS.md`](assets/ASSETS.md).

**Éditeurs annexes**

- `/dev/prism-layout` et `/dev/shattered-cube` : pause onglet caché via `attachVisibilityPauseRaf`
