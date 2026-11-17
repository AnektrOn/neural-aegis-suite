# Project rules

- Redeem AppSumo codes through the authenticated atomic database function, with private code hashes and Solo lifetime subscription rows; never expose the code catalogue or grant LOGOS through redemption.
- Landing and app share LanguageContext and localePreference storage; one persisted language prevents route changes from resetting it.

- Public Solo checkout carries a payment-first marker without a user ID; only the signed paid-checkout handler resolves or invites the Stripe email owner, preserving existing credentials and never returning login tokens through checkout status.

- Homepage Solo offer summaries use the typed `soloPricing` catalogue and link to `/pricing`; checkout and live availability stay on the dedicated pricing page to avoid duplicating payment logic.

- Save toolbox post-exercise feelings with an update-only helper scoped to the user and completed assignment; never re-record a completion or bump lifetime statistics for feedback edits.

- Normalize Stripe snapshot subscription periods and invoice subscription references at the webhook boundary for both pre-Basil and Basil formats; this preserves renewal dates without changing the existing endpoint version or signing secret.

- Complete Drive exports use an explicit credential-free per-user table allowlist, paginated reads and linked report sections, filed per table into the same per-user category folders as live exports (Maisons answers carry a generated scoring-grid file); synchronous per-user results enable verified resumable backfills instead of unobserved background success.

- Activity emails resolve platform operators from admin/superadmin roles, defer client calls outside auth callbacks, and persist event/recipient delivery keys; this avoids missing owners, auth-lock stalls and duplicate retries.

- Render application branding through the shared AegisLogo component, with theme-aware variants and explicit overrides for fixed-color surfaces; this keeps all screens consistent without image filters.

- Saved V2 member menu preferences are authoritative; apply exclusions only from the frozen legacy sidebar route list during migration, so restored and newly introduced pages remain available.
- Member logout uses the shared dock to open AppLayout's existing confirmation, independent of hideable menu preferences, so it remains reachable at every breakpoint.
- Shared modal controls retain their component stacking order without global mobile z-index overrides; member pages reserve dock space vertically, not as a full-page right gutter, to keep dialogs usable and mobile content full-width.
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
- R3F environment HDRs use committed Lovable Assets pointers and pass their `.url` to Drei Environment; this keeps binary lighting assets available in clean deployments.
- Preserve the frozen legacy Prism source by resolving its missing HDR URL import through a Vite alias to an asset-pointer URL adapter; this restores clean builds without refactoring the legacy scene.
- SEO prerender: a build-only Vite plugin (scripts/seoPrerender.ts) writes static HTML with real content and distinct head tags for /, /pricing, /newsletter; no headless browser is available at build time, so content is authored there and must be kept in sync with the pages.
