# AEGIS landing — copy and i18n

Runtime strings live in [`../i18n/aegisLandingCopy.ts`](../i18n/aegisLandingCopy.ts). [`../copy-deck.md`](../copy-deck.md) is the FR design brief; it is **not** loaded at runtime.

This catalog is separate from `src/i18n/translations.ts` (app chrome). Do not mix the two.

## Locales and audiences

```ts
type AegisLandingLocale = "fr" | "en";
type AegisLandingAudience = "individuel" | "entreprise";
```

Four trees:

| | `fr` | `en` |
| --- | --- | --- |
| `individuel` | `individuelFr` | `individuelEn` |
| `entreprise` | `entrepriseFr` | `entrepriseEn` |

Selected as `AEGIS_LANDING_COPY[audience][locale]`.

Default locale is `fr`. User choice is stored under `aegis-landing-locale`. Setting a locale also sets `document.documentElement.lang`.

## How to edit copy

1. Change the matching object in `aegisLandingCopy.ts` (keep FR and EN in the same edit).
2. If you add a **field**, extend `AegisLandingCopy` first so all four trees type-check.
3. Update `copy-deck.md` when the FR brief changes, so design and code do not drift.
4. Run `npm run verify:aegis-landing-docs`.

Do not interpolate user input into these strings. Placeholders that remain in the product (e.g. week label) are literal copy, not template slots.

## Shape (`AegisLandingCopy`)

| Block | Consumed by | Notes |
| --- | --- | --- |
| `meta.title` / `description` | `LandingHelmet` | Document title + description |
| `nav.*` | `LandingNav` | `cta` is the header button; `primary` / `audience` are `aria-label`s |
| `hero.*` | `LandingHero`, `MobileStickyCta` (uses `hero.cta`) | `title` may contain `\n` (`whitespace-pre-line`) |
| `problem.*` | `ProblemSection` | |
| `manifesto` | `ManifestoSection` | **`null` on individuel** — section unmounts |
| `recevez.*` | `RecevezSection` + mockups | If `mockup.heatmapRows` is set → `OrgReportMockup`, else `WeeklyReportMockup` |
| `comment.steps` | `CommentCaMarcheSection` | |
| `comparatif.headers` / `rows` | `ComparisonTable` | `aegis` / `autres` are booleans |
| `pourQui.cards` | `PourQuiSection` | |
| `donnees.*` | `DonneesSection` | |
| `tarif.*` | `TarifSection` / `PricingCard` | Price is copy, not a billing API |
| `faq.items` | `FaqSection` | `{ q, a }[]` |
| `finalCta.*` | `FinalCtaSection` | `caption` optional |
| `footer.links` | `LandingFooter` | `{ href, label }[]` — `href` is a React Router path |

## Structural differences

| Concern | Individuel | Entreprise |
| --- | --- | --- |
| Manifesto | `null` | Full block |
| Recevez mockup | Weekly report | Org heatmap (`heatmapRows`) |
| Hero CTA | “Demander mon accès” / price cue | “Demander un accès” / custom pricing |
| Tarif | 150 € / mois in copy | Sur devis in copy |

Nav anchors are the same on both audiences (`#comment`, `#pour-qui`, `#tarif`, `#faq`).

## Adding a locale

1. Extend `AegisLandingLocale`.
2. Add `individuelXx` and `entrepriseXx` objects.
3. Register them on `AEGIS_LANDING_COPY`.
4. Teach `AegisLandingLocaleProvider` to accept the new `localStorage` value (today only `"en"` is special-cased; anything else is `fr`).
5. Add a control in `LandingNav`.

## Adding a section

1. Add fields to `AegisLandingCopy` and all four trees.
2. Create `sections/YourSection.tsx` that calls `useAegisLandingLocale()`.
3. Mount it in `AegisLandingPage` (order is the scroll story).
4. If it needs a nav link, add `{ href, key }` in `LandingNav` and a matching `id` on `LandingSection`.
5. Extend `REQUIRED_COPY_KEYS` / nav-id checks in `scripts/verify-aegis-landing-docs.ts`.

## Accessibility and localization notes

- Headlines use `\n` for intended breaks; do not replace with `<br>` in copy.
- Screen-reader hero chip: `copy.hero.chip` is rendered `.sr-only` because the visible pill sits over a decorative canvas.
- Footer legal URLs are locale-invariant paths; only the labels translate.
- CTA buttons are `<a href="#tarif">`. Changing the destination means updating `LandingHero`, `LandingNav`, `MobileStickyCta`, and `FinalCtaSection`.

## Gaps

- `copy-deck.md` is FR-only. English exists solely in TypeScript.
- Week labels use an illustrative `12`. Hosting copy is “précisée à la souscription”, not a claimed region.
- Locale storage is unversioned (`aegis-landing-locale`). A future schema change should use `aegis-landing-locale:v2`.
