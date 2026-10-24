# Décisions `package.json` — stack 3D landing

État au moment de la doc (à mettre à jour après chaque changement de deps).

## Conservés

| Package | Raison |
|---------|--------|
| `three` | Version principale de l’app (0.170+). |
| `three-aegis-core` | Alias `npm:three@^0.128.0` pour `src/components/aegis-core/*` (scène studio legacy). **Ne pas** l’utiliser dans prism-landing. Migration future : unifier sur `three` quand aegis-core sera porté. |
| `three-good-godrays` | Godrays volumétriques liés aux ombres — `landingPmndrsComposer.ts`. |
| `postprocessing`, `@react-three/*` | Post et R3F (intro, prism composants, future route R3F). |
| `n8ao` | AO prévue pour la landing ; pas encore importée dans `src/` au niveau app (sous-dep de `@react-three/postprocessing` en 1.x). Garder pour intégration landing explicite. |

## Retirés (inutilisés dans `src/`)

| Package | Action |
|---------|--------|
| `@splinetool/loader`, `@splinetool/r3f-spline`, `@splinetool/runtime` | Supprimés — aucun import dans le repo. |
| `three-monolith` | Supprimé — alias Vite `three/webgpu` / plugin `threeMonolithSelfResolve` sans consommateur dans `src/`. Si WebGPU monolithe revient, réintroduire avec une route/feature explicite. |

## À installer (branche `/dev/prism-landing-r3f`)

- `@theatre/core`, `@theatre/r3f`, `@theatre/studio`
- `leva` (panneau dev optionnel)
- `gsap` + `CameraControls` (drei) seulement si Theatre est reporté — Theatre reste le choix prioritaire pour les plans.

## Vérification

```bash
rg "@splinetool|three-monolith" src package.json vite.config.ts
rg "three-good-godrays" src/pages/dev/prism-landing
```
