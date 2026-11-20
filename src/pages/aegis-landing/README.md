# AEGIS landing

Public marketing pages for AEGIS (exocortex for executives). Two audiences share one page shell, one WebGL armillary hero, and four copy trees (FR/EN × individuel/entreprise).

This module is independent of `src/pages/dev/prism-landing/` and `src/pages/dev/prism-landing-r3f/`. Do not import from either.

## Audience

| Reader | Start here |
| --- | --- |
| Engineer shipping the page | this README + [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Engineer touching the 3D hero | [`docs/ARMILLARY.md`](docs/ARMILLARY.md) |
| Copy / i18n | [`docs/COPY_AND_I18N.md`](docs/COPY_AND_I18N.md) + [`copy-deck.md`](copy-deck.md) |

## Routes

| Path | Who sees it | `audience` | UI |
| --- | --- | --- | --- |
| `/` | Unsigned web visitors | `individuel` | `WelcomeView` (nebula + conversion ladder) |
| `/entreprise` | Anyone (public) | `entreprise` | Classic shell (armillary + sections below) |
| `/prism` | Redirect → `/` | — | — |
| `/prism/entreprise` | Redirect → `/entreprise` | — | — |

Signed-in users hitting `/` get the member Welcome hub, not this marketing page. Native Capacitor builds skip the landing and go to `/auth`.

Landing Suspense fallback is `LandingBootFallback` (wordmark only, no WebGL). `BootLoadingScreen` / `ArmillaryLoader` remain for auth boot and `/__loader`.

```bash
npm run dev
# http://localhost:5173/            — individuel (WelcomeView)
# http://localhost:5173/entreprise  — entreprise (armillary landing)
```

## Features

- **Individuel (`/`)** : `WelcomeView` — sticky nav + mobile menu, vocal demo, audit CTA, pricing ladder, FAQ schema
- **Entreprise (`/entreprise`)** : FR/EN via `aegis-landing-locale`, armillary hero ≥1024px, section copy, FAQ, sticky mobile CTA
- `prefers-reduced-motion` freezes ring spin, hover, and scroll reveals on the entreprise shell

## Quick start (embed)

```tsx
import AegisLandingPage from "@/pages/aegis-landing/AegisLandingPage";

<AegisLandingPage audience="individuel" />
<AegisLandingPage audience="entreprise" />
```

Copy is selected by `audience` + locale. Components must sit under `AegisLandingLocaleProvider` (the page wraps itself).

## Layout (entreprise `/entreprise`, top → bottom)

1. `LandingNav` — wordmark, audience, anchors, CTA, FR/EN
2. `LandingHero` — armillary + headline
3. `ProblemSection` (`#probleme`)
4. `ManifestoSection`
5. `RecevezSection` (`#recevez`) — org heatmap
6. `CommentCaMarcheSection` (`#comment`)
7. `ComparatifSection` (`#comparatif`)
8. `PourQuiSection` (`#pour-qui`)
9. `DonneesSection` (`#donnees`)
10. `TarifSection` (`#tarif`)
11. `FaqSection` (`#faq`)
12. `FinalCtaSection`
13. `LandingFooter` — legal routes
14. `MobileStickyCta` — `sm:hidden`

Individuel `/` is owned by `src/features/welcome/components/WelcomeView.tsx` (not the section list above).

## Stack

| Layer | Choice |
| --- | --- |
| Page | React 18, React Router, `react-helmet-async` |
| Styles | Tailwind utilities + `aegisLanding.css` tokens |
| Type | Cormorant Garamond (headlines), Barlow (body), DM Mono (labels), Cinzel (wordmark) |
| 3D | Vanilla WebGL 1 — **not** R3F / Three |
| i18n | In-module `AEGIS_LANDING_COPY` (not `src/i18n/translations.ts`) |

## Assets

Runtime textures (required):

- `public/aegis-landing/textures/Gun_Metal_baseColor.webp`
- `public/aegis-landing/textures/Gun_Metal_roughness.webp`
- `public/aegis-landing/textures/Gun_Metal_normal.webp`

Hero still (mobile + WebGL fallback): `public/aegis-landing/hero-scene.jpg` and the `-800` / `-1440` variants.

## Validation

```bash
npm run verify:aegis-landing-docs
```

Checks copy-tree completeness, texture files, nav anchors, and the no-prism-landing import rule. Wired into `.github/workflows/deploy-pages.yml`.
