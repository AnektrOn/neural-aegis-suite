# Project rules

- Activity emails resolve platform operators from admin/superadmin roles, defer client calls outside auth callbacks, and persist event/recipient delivery keys; this avoids missing owners, auth-lock stalls and duplicate retries.

- Render application branding through the shared AegisLogo component, with theme-aware variants and explicit overrides for fixed-color surfaces; this keeps all screens consistent without image filters.

- Saved V2 member menu preferences are authoritative; apply exclusions only from the frozen legacy sidebar route list during migration, so restored and newly introduced pages remain available.
- Member logout uses the shared dock to open AppLayout's existing confirmation, independent of hideable menu preferences, so it remains reachable at every breakpoint.
- Members download published APKs through release signed URLs; direct app-releases storage access is reserved for non-guest platform admins to avoid exposing unrelated files.

- ElevenLabs knowledge calls go only through the `elevenlabs-knowledge` edge function (admin-checked); per-user agent IDs live on `profiles`, the main agent ID in `elevenlabs_settings` — keeps the API key server-side and each user's documents attached only to their own agent.
- Install personal workflows through the same admin guard with profile-resolved agent IDs; empty node KB overrides allow installation before sources exist without inheriting unrelated documents.
- ElevenLabs Drive sync uses the linked Google Drive gateway connection and traverses only descendants of the selected profile's folder; empty Markdown syncs fail explicitly to avoid false successes.
- Personal Drive sync runs in short client-driven batches and enables agent RAG when attaching Drive documents, avoiding HTTP timeouts and full-prompt capacity limits; indexing-not-ready failures retry briefly.
- Drive folder mappings are scoped by user, agent and Drive root; sync folder units before document units and move unchanged documents into their mapped folders to preserve hierarchy without sharing knowledge across users.
- Attach the scoped Drive root as a `folder` locator in the personal agent knowledge base, including resumed batches, and read back new attachments; workspace folder creation alone does not attach them to an agent.

## Prism landing (`src/pages/dev/prism-landing/`)

- Before implementing a visual effect, check **`package.json`** and search the module (`rg` / grep). If an installed library covers the effect, **you must use it** — do not reinvent with custom shaders.
- **Forbidden** (unless documented exception): custom shaders/passes for godrays, bloom, LUT/grade, DoF, SSAO/GTAO/AO, or sky/atmosphere when `three-good-godrays`, `postprocessing` / `@react-three/postprocessing`, `n8ao`, or `@react-three/drei` (`Environment`, `Sky`, `Stars`, etc.) apply.
- **End-of-task proof**: list files that import the library used (e.g. `rg "three-good-godrays" src/pages/dev/prism-landing`).
- **Migration strategy**: keep `/dev/prism-landing` **intouchable** (route legacy) ; construire `/dev/prism-landing-r3f` en **R3F-first** — la golden n’est **pas** un blueprint d’architecture, de post, ni de lumière.
- **Cursor rule** (file-scoped): `.cursor/rules/prism-landing-visual-stack.mdc` (inclut `prism-landing-r3f/`).
- **Prism landing R3F (`prism-landing-r3f/`)** : **interdit** tout `import` depuis `src/pages/dev/prism-landing/**` ; routeur `.cursor/skills/prism-landing-r3f-stack/SKILL.md` ; fente `.cursor/skills/prism-landing-r3f-gutter-lab/SKILL.md`. Lab godrays = **`<pointLight>` sur la tuile** + `R3fGutterLightContext` + `three-good-godrays` `GodraysPass` (composer impératif `postprocessing`).
- **Validation R3F** : `bash scripts/validate-prism-r3f-guards.sh` ; preuve `rg 'pages/dev/prism-landing' src/pages/dev/prism-landing-r3f` (hors `cinematic/*.json`) doit être vide.
- **`three-aegis-core`**: legacy alias for `src/components/aegis-core/` only — not for prism-landing. See `src/pages/dev/prism-landing/docs/PACKAGE_STACK_DECISIONS.md`.
