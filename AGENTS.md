# Project rules

- ElevenLabs knowledge calls go only through the `elevenlabs-knowledge` edge function (admin-checked); per-user agent IDs live on `profiles`, the main agent ID in `elevenlabs_settings` — keeps the API key server-side and each user's documents attached only to their own agent.

## Prism landing (`src/pages/dev/prism-landing/`)

- Before implementing a visual effect, check **`package.json`** and search the module (`rg` / grep). If an installed library covers the effect, **you must use it** — do not reinvent with custom shaders.
- **Forbidden** (unless documented exception): custom shaders/passes for godrays, bloom, LUT/grade, DoF, SSAO/GTAO/AO, or sky/atmosphere when `three-good-godrays`, `postprocessing` / `@react-three/postprocessing`, `n8ao`, or `@react-three/drei` (`Environment`, `Sky`, `Stars`, etc.) apply.
- **End-of-task proof**: list files that import the library used (e.g. `rg "three-good-godrays" src/pages/dev/prism-landing`).
- **Migration strategy**: keep `/dev/prism-landing` **intouchable** (route legacy) ; construire `/dev/prism-landing-r3f` en **R3F-first** — la golden n’est **pas** un blueprint d’architecture, de post, ni de lumière.
- **Cursor rule** (file-scoped): `.cursor/rules/prism-landing-visual-stack.mdc` (inclut `prism-landing-r3f/`).
- **Prism landing R3F (`prism-landing-r3f/`)** : **interdit** tout `import` depuis `src/pages/dev/prism-landing/**` ; routeur `.cursor/skills/prism-landing-r3f-stack/SKILL.md` ; fente `.cursor/skills/prism-landing-r3f-gutter-lab/SKILL.md`. Lab godrays = **`<pointLight>` sur la tuile** + `R3fGutterLightContext` + `three-good-godrays` `GodraysPass` (composer impératif `postprocessing`).
- **Validation R3F** : `bash scripts/validate-prism-r3f-guards.sh` ; preuve `rg 'pages/dev/prism-landing' src/pages/dev/prism-landing-r3f` (hors `cinematic/*.json`) doit être vide.
- **`three-aegis-core`**: legacy alias for `src/components/aegis-core/` only — not for prism-landing. See `src/pages/dev/prism-landing/docs/PACKAGE_STACK_DECISIONS.md`.
