---
version: alpha
name: AEGIS Member Shell
description: >-
  Direction artistique officielle AEGIS — minéralité obsidienne, or solaire,
  typographie impériale. Dark mode par défaut ; light mode en miroir albâtre.
colors:
  primary: "#c9a24b"
  on-primary: "#0b0b0a"
  primary-light: "#d2ae5e"
  primary-deep: "#a67f2e"
  secondary: "#9a968b"
  tertiary: "#ba6f3c"
  on-tertiary: "#0b0b0a"
  neutral: "#0b0b0a"
  abyss: "#070707"
  surface: "#161614"
  surface-elevated: "#1e1e1c"
  ink: "#e9e4d8"
  ink-muted: "#9a968b"
  ink-subtle: "#6e6a61"
  cardline: "rgba(233, 228, 216, 0.08)"
  cardline-hover: "rgba(201, 162, 75, 0.35)"
  glow: "rgba(201, 162, 75, 0.12)"
  success: "#34d399"
  warning: "#f59e0b"
  danger: "#ef4444"
  info: "#3b82f6"
  light-abyss: "#ede9e0"
  light-bg: "#f5f2eb"
  light-surface: "#ffffff"
  light-surface-elevated: "#faf8f5"
  light-ink: "#141412"
  light-ink-muted: "#615d54"
  light-ink-subtle: "#8c877c"
  light-primary: "#9e7828"
  light-primary-deep: "#82611e"
  light-copper: "#9c5323"
typography:
  display-hero:
    fontFamily: Cormorant Garamond
    fontSize: 3rem
    fontWeight: "300"
    lineHeight: "1.15"
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Cormorant Garamond
    fontSize: 2.25rem
    fontWeight: "300"
    lineHeight: "1.2"
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Cormorant Garamond
    fontSize: 1.75rem
    fontWeight: "400"
    lineHeight: "1.25"
  h3:
    fontFamily: Barlow
    fontSize: 1.125rem
    fontWeight: "600"
    lineHeight: "1.35"
  body-md:
    fontFamily: Barlow
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: "1.55"
  body-lg:
    fontFamily: Barlow
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: "1.6"
  label:
    fontFamily: Barlow
    fontSize: 0.75rem
    fontWeight: "500"
    lineHeight: "1.25"
    letterSpacing: "0.06em"
  kicker:
    fontFamily: Cinzel
    fontSize: 0.6875rem
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "0.24em"
  cta:
    fontFamily: Cinzel
    fontSize: 0.6875rem
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "0.16em"
  metric:
    fontFamily: DM Mono
    fontSize: 0.875rem
    fontWeight: "500"
    lineHeight: "1.2"
    letterSpacing: "0.02em"
  caption:
    fontFamily: Barlow
    fontSize: 0.75rem
    fontWeight: "400"
    lineHeight: "1.35"
rounded:
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
  "2xl": 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  section: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.cta}"
    rounded: "{rounded.xl}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: 12px
  button-mineral:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 12px
  bento-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: 24px
  chip-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    padding: 8px
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 8px
  input-field:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  page-kicker:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.kicker}"
  page-title:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.h1}"
  metric-value:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
---

## Overview

AEGIS est une suite wellness / intelligence personnelle au caractère **minéral et souverain** — pas un dashboard SaaS violet, pas un glassmorphism bleu néon.

L’identité visuelle s’appuie sur quatre piliers :

1. **Minéralité & noblesse** — obsidienne, basalte, titane, ivoire bone.
2. **Éclat solaire ancien** — or ciselé (`#c9a24b`), cuivre d’énergie, pas de jaune fintech.
3. **Typographie impériale** — Cinzel (autorité), Cormorant Garamond (littérature), Barlow (UI), DM Mono (instrument).
4. **Architecture bento** — tuiles géométriques respirantes ; le verre flou bleu/violet est interdit.

Le **dark mode** (Palette Obsidienne) est la référence de génération Stitch et des maquettes. Le light mode (Albâtre / Craie) est le miroir documenté dans `docs/DA_MEMBER_SHELL_V2.md` et `src/index.css`.

Branding produit : toujours via le composant partagé **AegisLogo** (variants theme-aware), jamais un filtre CSS sur une image.

## Colors

La palette dark est normative pour les agents. Les tokens `light-*` documentent le miroir clair.

| Token | Hex / valeur | Rôle |
|-------|--------------|------|
| **primary** `#c9a24b` | Or solaire | CTA maîtres, kickers, badges, focus hover |
| **primary-light / primary-deep** | Dégradé solaire | Boutons solaires (`from` → `to`) |
| **tertiary** `#ba6f3c` | Cuivre | Effort, habitudes de feu, piliers corporels |
| **neutral** `#0b0b0a` | Obsidienne | Fond global shell |
| **abyss** `#070707` | Abîme | Labs, silhouettes, visualisations full-bleed |
| **surface** `#161614` | Basalte | Tuiles bento, cartes, modules |
| **surface-elevated** `#1e1e1c` | Titane | Modales, menus, popovers |
| **ink** `#e9e4d8` | Ivoire bone | Titres, scores, lecture forte |
| **ink-muted / ink-subtle** | Quartz / pierre | Descriptions, métadonnées |
| **success / warning / danger / info** | Bio-status | Émeraude, ambre, rouge, saphir — jamais en chrome UI |

**Interdits :** purple-on-white, indigo glow, cream+terracotta broadsheet, néon cyberpunk, glass cards bleutées.

**Light mirror (résumé) :** fond `#f5f2eb`, surface `#ffffff`, ink `#141412`, or `#9e7828`, cuivre `#9c5323`. En light, le chrome UI peut rester ink black ; l’or reste l’accent wellness.

## Typography

Quatre voix, jamais interchangeables :

- **Cinzel** — kickers impériaux en uppercase, grades, CTA solaires (`tracking` large ~0.16–0.24em).
- **Cormorant Garamond** — H1 / display, `font-weight: 300`, tracking serré. Une seule phrase héroïque, jamais un titre qui écrase le brand.
- **Barlow** — corps, labels, formulaires, navigation. Base 14px desktop, 16px mobile.
- **DM Mono** — métriques, %, timers, scores (`tabular-nums`).

Composition d’en-tête canonique :

1. Kicker Cinzel or solaire  
2. H1 Cormorant ink  
3. Sous-titre Barlow muted (max ~2xl)

## Layout

- Espacement bento : padding tuile `20–24px` (`spacing.lg` / custom `p-5 sm:p-6`).
- Grilles respirantes ; une section = un job (un titre, une phrase de soutien).
- Hero / landing : full-bleed, brand d’abord, pas de cards dans le hero, pas de overlays stickers.
- Shell membre : fond `neutral`, contenu en tuiles `surface`, dock / top bar hors flux scroll.
- Conteneur max ~1400px (`2xl`) ; gutters `spacing.md`–`lg`.

## Elevation & Depth

- Ombre dark tuile : `0 4px 28px rgba(0,0,0,0.32)` + inset hairline ivoire `rgba(233,228,216,0.05)`.
- Ombre light tuile : `0 2px 12px rgba(0,0,0,0.04)`.
- Halo or discret derrière scores : `glow` `rgba(201,162,75,0.12)` — pas de bloom violet.
- Survol : bordure → `cardline-hover` or, pas d’élévation agressive multi-ombres.
- Surfaces empilées : abyss → neutral → surface → surface-elevated (jamais l’inverse).

## Shapes

- Rayon de base produit : `--radius: 0.75rem` (12px) → `rounded.lg`.
- Tuiles bento : `rounded.2xl` (16px).
- Boutons / inputs : `rounded.xl` (16px) ou `lg` (12px).
- Pas de pills `rounded-full` pour le chrome principal (sauf avatars / indicateurs ponctuels).
- Coins cohérents ; pas de mix card radius + sharp broadsheet.

## Components

### Bouton solaire (primaire)

Dégradé `primary` → `primary-deep`, texte `on-primary`, Cinzel uppercase tracking large, ombre or douce, `active:scale-[0.98]`.

### Bouton minéral (secondaire)

Fond `surface-elevated`, bordure ivoire ~12 %, texte ink, Barlow — pas de fill or.

### Tuile bento

Remplace toute `glass-card`. Fond `surface`, bordure `cardline`, hover or. Conteneur d’interaction uniquement — si retirer bordure/fond ne casse rien, ce n’est pas une card.

### Chips

Inactif : surface + ink-muted. Actif : ink sur neutral (inversion minérale), pas de pill colorée.

### Branding

`AegisLogo` partagé, variants theme-aware ; overrides explicites sur surfaces couleur fixe.

## Do's and Don'ts

**Do**

- Générer d’abord en dark obsidienne + or solaire.
- Utiliser Cinzel uniquement pour kickers / CTA solennels, Cormorant pour H1, Barlow pour UI, DM Mono pour chiffres.
- Préférer bento basalte aux cards glass.
- Garder un accent métallique unique (or) + cuivre pour l’énergie corporelle.
- Aligner les écrans sur la DA de `docs/DA_MEMBER_SHELL_V2.md`.

**Don't**

- Ne pas introduire de purple / indigo / glow néon comme identité.
- Ne pas remplacer Cormorant/Cinzel par Inter, Roboto, ou system-ui en display.
- Ne pas empiler stats, chips promo et cards dans un hero.
- Ne pas utiliser le succès émeraude ou l’info saphir comme couleur de chrome (boutons nav, sidebar).
- Ne pas inventer un second logo ou filtrer le logo existant.
