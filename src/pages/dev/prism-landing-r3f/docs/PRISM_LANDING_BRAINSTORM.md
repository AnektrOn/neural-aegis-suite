# Prism landing `/prism` v2 — design log

## Understanding (validé)

- Landing fullscreen Hubtown : loader, HUD, menu, sound stub, scroll `html/body` verrouillé.
- **6 beats** narratifs : cube → marbre → fente, avec transitions Theatre entre heroes.
- Pipeline 3D = lab (`LandingR3fPostPipeline`, `three-good-godrays`), sans import `prism-landing` legacy.
- Lab `/dev/prism-landing-r3f` inchangé (orbit + sliders).

## Decision log

| Décision | Alternatives | Pourquoi |
| --- | --- | --- |
| Caméra Theatre (`@theatre/r3f` + `landingR3fCamera.state.json`) | Tween manuel `PrismR3fLandingCameraRig` | Courbes éditables, segments 4 s par repère, studio en dev |
| PREV saute les transitions (table utilisateur) | Rejouer transitions à l’envers | Comportement Hubtown, moins de fatigue |
| NEXT linéaire + `isTransitioning` pendant play | Snap instantané | Ciné lisible, NEXT bloqué en travel |
| `PRISM_R3F_LANDING_SCENE_DEFAULTS` minimal | Overrides bloom/godrays off | Parité lab ; patches par beat via `LAB_PARITY` |
| Studio Theatre sur `/prism` en **DEV** seulement | Studio aussi en prod | Prod = playback JSON ; dev = `?theatre=1` seulement |

## Director lumière (`usePrismLandingBeatEffects`)

| Beat | Kind | Cube | Scène / godrays |
| --- | --- | --- | --- |
| 0 | hero cube | `requestCubeBurst()` | `LAB_PARITY` (`cubeGutterGodraysAttenuation: 0`) |
| 1 | travel c→m | `requestCubeBurst()` | bloom/sun/godrays punch + fog envelope |
| 2 | hero marbre | hold | `LAB_PARITY` |
| 3 | travel m→f | hold | travel |
| 4 | hero fente | hold | `emitLightIntensity: 165`, godrays/bloom on |
| 5 | CTA | hold | wide hold cam |

Fichiers : `landing/prismR3fLandingBeats.ts`, `landing/usePrismLandingBeatEffects.ts`, `config/PrismR3fLandingDirectorContext.tsx`.

## Navigation (implémentée)

Voir `resolveNextBeatIndex` / `resolvePrevBeatIndex` dans `landing/prismR3fLandingBeats.ts`.  
Playback : `landing/PrismR3fLandingTheatreRig.tsx` — play si `beatIndex === prevBeat + 1`, sinon snap (PREV hero).

## Screenshots vs Hubtown (après Run 3)

Captures `/prism` **sans** `?theatre=1` : `exports/diagnostics/prism-landing-brainstorm/beat-index-0X-chapter-Y.png`.  
Playback : **`landingR3fCamera.state.json`** (Theatre) ; `PRISM_LANDING_CAMERA_KEYS` = repères nav / doc seulement. Studio dev : `/prism` (désactiver avec `?theatre=0`).  
Travel 4 s : `PrismR3fLandingTravelAtmosphere` (fog near/far, bloom, densité godrays, soleil, scale cube/marbre) + burst cube beat 1.

| Beat | Hubtown | Prism après fixes | Restant (volontaire) |
| --- | --- | --- | --- |
| 0 hero cube (`beat-index-00-chapter-1.png`) | `03` cube cyan à droite, HUD gauche, NEXT seul | Burst cube + wasteland, CORE, NEXT seul | Pas d’eau / reflet Hubtown |
| 1 travel (`beat-index-01-chapter-2.png`) | `05` motion spectaculaire, rubans 2D | Aerial + colonne godrays orange / voile cyan, HUD `…`, corps caché | Invention R3F (fog/post/lumière), pas de rubans 2D |
| 2 hero marbre (`beat-index-02-chapter-3.png`) | `07` sujet 3D fort à droite | Marbre hero droite, pied ambre, cube/fente masqués | Un prisme vs grappe cyan Hubtown |
| 3 travel (`beat-index-03-chapter-4.png`) | `06` trails verticaux, punch | Fente orange plein cadre, bloom/émission, HUD `…` | Palette orange Prism vs bleu Hubtown |
| 4 hero fente (`beat-index-04-chapter-5.png`) | lab `[4,4.8,20]→[3,7,-3]` | Parité lab, emit 165, godrays tuile | Sommet fente 30 m un peu hors cadre |
| 5 CTA (`beat-index-05-chapter-6.png`) | `09` PREV seul, cityscape | Hold large fente, **NEXT absent**, PREV → hero fente (beat 4) | Pas de cityscape |

Fixes Run 3 (pas seulement documentés) : spline caméra + envelope 4 s ; HUD travel sans body/CTA ; beat 5 NEXT off + PREV slit.

## Fichiers clés v2

| Rôle | Chemin |
| --- | --- |
| Beats + nav | `landing/prismR3fLandingBeats.ts` |
| Theatre root / rig | `landing/PrismR3fLandingTheatreRoot.tsx`, `PrismR3fLandingTheatreRig.tsx` |
| JSON caméra | `cinematic/landingR3fCamera.state.json` |
| Studio dev | `cinematic/landingR3fTheatreStudio.ts` (appel depuis `PrismR3fLandingPage`) |
| HUD | `landing/PrismR3fLandingHud.tsx` |
| Travel 4 s | `landing/PrismR3fLandingTravelAtmosphere.tsx` |

## Risques / suites

- Affiner apex Theatre (t=2 / t=10) au studio `?theatre=1` si le travel doit coller encore plus fort.
- Studio : `?theatre=1` sur `/prism` (plus d’overlay par défaut).
- Prod : s’assurer que le bundle `@theatre/studio` reste tree-shaken (`import.meta.env.DEV`).

## Validation

```bash
bash scripts/validate-prism-r3f-guards.sh
rg 'from.*pages/dev/prism-landing' src/pages/dev/prism-landing-r3f --glob '*.{ts,tsx}'
npm run build
```

Preuve libs post : `rg 'three-good-godrays|BloomEffect|SSAOEffect' src/pages/dev/prism-landing-r3f`
