# Prompt — reconstruction landing en React Three Fiber

Copier-coller ce bloc dans Cursor pour lancer la route **`/dev/prism-landing-r3f`** sans toucher à la landing golden (`/dev/prism-landing`).

---

## Contexte

Le repo a une landing prism en **Three.js impératif** (`createCosmicMonolithLandingScene.ts`, canvas `PrismLandingCanvas`). Les dépendances R3F/post sont déjà installées ; `three-good-godrays` est branché sur le composer pmndrs vanilla (`landingPmndrsComposer.ts`). Theatre.js, GSAP, `leva` et troika (via drei `<Text>`) ne sont pas encore installés — les ajouter sur cette branche si le prompt les exige.

Références :

- README module : `src/pages/dev/prism-landing/README.md`
- Bible cinéma : `docs/LANDING_CINEMATIC_BIBLE.md`
- Contrat shots : `cinematic/landingCinematicContract.ts`
- Layout : `layout/prismSceneConstants.ts`
- Règles agents : `AGENTS.md` + `.cursor/rules/prism-landing-visual-stack.mdc`

## Objectif

Créer **`/dev/prism-landing-r3f`** : même intention visuelle que la golden (wasteland, monolithe, portail, travelling), mais structure **React Three Fiber + drei**, post via **`@react-three/postprocessing`** / `postprocessing`, godrays **`three-good-godrays`** (shadow map lumière, pas godrays radiaux écran seuls), texte 3D **`drei` `<Text>`** (troika), plans caméra **Theatre.js** (`@theatre/core`, `@theatre/r3f`, studio optionnel en dev).

Ne pas modifier le comportement de `/dev/prism-landing` ni supprimer le canvas impératif.

## Livrables (ordre strict)

1. **Route + page squelette**
   - Lazy route dans `App.tsx` + entrée DevLab.
   - `pages/PrismLandingR3fPage.tsx` : layout identique (retour, canvas plein écran, overlay HTML pour titres/CTA).
   - `ui/PrismLandingR3fCanvas.tsx` : `<Canvas>` R3F, DPR/perf réutiliser `prismLandingPerformance.ts` si possible.

2. **Post & godrays (preuve d’import obligatoire)**
   - Brancher `GodraysPass` de `three-good-godrays` avec une `DirectionalLight` + shadow map (s’inspirer de `landingGodraysLight.ts` + `landingPmndrsComposer.ts`).
   - Bloom / grade / fog : `@react-three/postprocessing` ou composer hybride documenté — **pas** de copie du shader godrays three/addons sauf flag debug `?composer=three` pour A/B.
   - Fin de tâche : `rg "three-good-godrays" src/pages/dev/prism-landing-r3f` (ou chemin choisi sous `prism-landing/`).

3. **Atmosphère drei**
   - `Environment` (HDRI existant dans `assets/`), `Sky` / `Stars` / `Sparkles` / `Cloud` selon bible — pas de ciel entièrement procédural si drei couvre le besoin.

4. **Caméra Theatre.js**
   - Installer `@theatre/core`, `@theatre/r3f`, `@theatre/studio` (dev only).
   - Reproduire les temps forts du travelling (keyframes existantes dans `camera/`) comme séquence Theatre ; exporter un `state.json` versionné dans le module.
   - Lecture auto au mount ; pause/play comme la golden.

5. **Migration assets par étapes** (commit ou PR par étape, screenshot avant/après)
   - Sol rive : réutiliser textures `assets/textures/shore/` (`landingShoreGround.ts` comme spec PBR).
   - Monolithe marbre : port depuis `components/MarbleMonolith.tsx` ou équivalent R3F.
   - Portail + cube : positions depuis `layout/prismSceneConstants.ts`.
   - Texte AEGIS : **`<Text>` drei** — ne pas utiliser `createAegisText3D.ts` (TextGeometry legacy).

6. **Occlusion**
   - Intégrer **`n8ao`** pour l’AO contact (pas de GTAO shader maison si n8ao suffit).

7. **Réglages dev**
   - Optionnel : panneau **`leva`** pour exposer godrays/bloom/atmo en dev (ne pas remplacer le panneau prod sans demande).

## Contraintes

- Lire `.cursor/rules/prism-landing-visual-stack.mdc` et s’y conformer.
- Pas de nouveau package pour un effet déjà listé dans la pile sans justification écrite dans la PR.
- Pas de commit `.env` ; pas de gros binaires non listés dans `assets/ASSETS.md`.
- Typecheck + `npm run build` doivent passer.

## Validation

- [ ] `/dev/prism-landing` inchangée (smoke : play travelling, panneau réglages).
- [ ] `/dev/prism-landing-r3f` : godrays visibles avec occlusion géométrique (monolithe/portail).
- [ ] Imports prouvés : `three-good-godrays`, `@react-three/fiber`, `@react-three/drei`, Theatre, `<Text>`.
- [ ] Overlay HTML lisible (contraste, accessibilité basique).

## Première tâche minimale (MVP jour 1)

« Crée uniquement la route `/dev/prism-landing-r3f` avec Canvas R3F, sol procédural simple, une DirectionalLight avec ombres, `GodraysPass` + Bloom, et une caméra Theatre avec 2 keyframes. Aucune migration du monolithe complet. Liste les imports three-good-godrays à la fin. »

---
