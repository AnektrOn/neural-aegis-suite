# Project rules

- ElevenLabs knowledge calls go only through the `elevenlabs-knowledge` edge function (admin-checked); per-user agent IDs live on `profiles`, the main agent ID in `elevenlabs_settings` — keeps the API key server-side and each user's documents attached only to their own agent.

## Prism landing (`src/pages/dev/prism-landing/`)

- Before implementing a visual effect, check **`package.json`** and search the module (`rg` / grep). If an installed library covers the effect, **you must use it** — do not reinvent with custom shaders.
- **Forbidden** (unless documented exception): custom shaders/passes for godrays, bloom, LUT/grade, DoF, SSAO/GTAO/AO, or sky/atmosphere when `three-good-godrays`, `postprocessing` / `@react-three/postprocessing`, `n8ao`, or `@react-three/drei` (`Environment`, `Sky`, `Stars`, etc.) apply.
- **End-of-task proof**: list files that import the library used (e.g. `rg "three-good-godrays" src/pages/dev/prism-landing`).
- **Migration strategy**: keep `/dev/prism-landing` (imperative Three) as the golden reference; build `/dev/prism-landing-r3f` on R3F and migrate assets one at a time. See `src/pages/dev/prism-landing/docs/R3F_RECONSTRUCTION_PROMPT.md`.
- **Cursor rule** (file-scoped): `.cursor/rules/prism-landing-visual-stack.mdc`.
- **`three-aegis-core`**: legacy alias for `src/components/aegis-core/` only — not for prism-landing. See `src/pages/dev/prism-landing/docs/PACKAGE_STACK_DECISIONS.md`.
