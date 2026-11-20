---
version: alpha
name: AEGIS Welcome HUD
description: >-
  Écran d’accueil membre (/welcome) — cockpit plein viewport, nebula Quantum
  en repos, typo Cormorant + DM Mono, CTAs pills glass/or. Dark par défaut ;
  miroir light atténué. Sources : WelcomeHudScreen, welcome-hud* dans index.css,
  WelcomeQuantumNebula, WelcomeGlassTile, SlideToStart.
colors:
  background: "hsl(var(--background))" # dark ~200 35% 7% · light #f5f2eb
  foreground: "hsl(var(--foreground))" # dark ivoire chaud · light #141412
  primary: "hsl(var(--primary))" # dark cuivre chaud 24 48% 65% · light or #9e7828
  primary-hover: "hsl(var(--primary-hover))"
  primary-foreground: "hsl(var(--primary-foreground))"
  primary-soft-fill: "hsl(var(--primary) / 0.10)"
  primary-soft-border: "hsl(var(--primary) / 0.25)"
  primary-soft-hover-fill: "hsl(var(--primary) / 0.15)"
  primary-soft-hover-border: "hsl(var(--primary) / 0.40)"
  muted: "hsl(var(--muted-foreground))"
  border-soft: "hsl(var(--border) / 0.25)"
  border-cta: "hsl(var(--border) / 0.30)"
  glass-fill: "hsl(var(--background) / 0.20)"
  glass-lang: "hsl(var(--background) / 0.40)"
  hero-glow: "hsl(var(--primary) / 0.28)" # light: foreground/0.04
  hud-wash-top: "hsl(var(--primary) / 0.10)"
  hud-wash-corner: "hsl(var(--neural-accent) / 0.06)"
  hud-wash-side: "hsl(var(--secondary) / 0.05)"
  card-glass-from: "hsl(var(--card) / 0.62)"
  card-glass-to: "hsl(var(--card) / 0.34)"
  tile-border: "hsl(var(--border) / 0.38)"
  slide-track: "hsl(var(--card) / 0.55)"
typography:
  brand-mark:
    fontFamily: Cinzel
    fontSize: 10px
    fontWeight: "600"
    letterSpacing: "0.28em"
    textTransform: uppercase
    content: "AEGIS — LOGOS"
  eyebrow:
    fontFamily: DM Mono
    fontSize: 10px
    fontWeight: "400"
    letterSpacing: "0.3em"
    textTransform: uppercase
    color: "{colors.primary}" # / 0.80 opacity
  hero-title:
    fontFamily: Cormorant Garamond # .font-cormorant-display
    fontSize: "2.5rem" # sm: 3rem (text-5xl)
    fontWeight: "300"
    lineHeight: "1.05"
    letterSpacing: "-0.01em"
  cta:
    fontFamily: DM Mono
    fontSize: 10px
    fontWeight: "400"
    letterSpacing: "0.22em"
    textTransform: uppercase
  lang-toggle:
    fontFamily: Cinzel
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: "0.05em"
    textTransform: uppercase
  tile-kicker:
    fontFamily: DM Mono
    fontSize: 10px
    letterSpacing: "0.22em"
    textTransform: uppercase
  tile-headline:
    fontFamily: DM Mono
    fontSize: "1.5rem" # sm: 1.875rem
    letterSpacing: "-0.01em"
  slide-label:
    fontFamily: DM Mono
    fontSize: 11px
    letterSpacing: "0.28em"
    textTransform: uppercase
rounded:
  lang: 12px # rounded-xl
  logo: 8px # rounded-lg
  cta-pill: 9999px # rounded-full
  glass-tile: 18px
  slide-track: 9999px
  slide-knob: 9999px
spacing:
  page-x: 20px # sm: 24px
  max-col: 28rem # max-w-md
  safe-top: "max(1.5rem, env(safe-area-inset-top))"
  safe-bottom: "max(1.75rem, env(safe-area-inset-bottom))"
  cta-min-h: 44px # min-h-11
  lang-h: 44px
  tile-min-h: 140px
  tile-pad: 16px
  slide-h: 56px
  knob: 48px
components:
  lang-toggle:
    backgroundColor: "{colors.glass-lang}"
    textColor: "{colors.muted}"
    typography: "{typography.lang-toggle}"
    rounded: "{rounded.lang}"
    blur: 14px
    border: "1px solid {colors.border-soft}"
  cta-secondary:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.muted}"
    typography: "{typography.cta}"
    rounded: "{rounded.cta-pill}"
    border: "1px solid {colors.border-cta}"
    blur: 4px
  cta-primary:
    backgroundColor: "{colors.primary-soft-fill}"
    textColor: "{colors.primary}"
    typography: "{typography.cta}"
    rounded: "{rounded.cta-pill}"
    border: "1px solid {colors.primary-soft-border}"
    blur: 4px
  glass-tile:
    backgroundColor: "linear-gradient(155deg, {colors.card-glass-from}, {colors.card-glass-to})"
    rounded: "{rounded.glass-tile}"
    blur: 20px
    border: "1px solid {colors.tile-border}"
  slide-knob:
    backgroundColor: "linear-gradient(145deg, {colors.primary}, {colors.primary-hover})"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.slide-knob}"
---

## Overview

Welcome (`/welcome`) est le **cockpit d’entrée membre** — une composition plein viewport, pas un dashboard.

Stack visuelle (code source) :

| Couche | Rôle | Fichier |
|--------|------|---------|
| **Quantum Nebula** | Fond 3D plein écran, état `repos` | `WelcomeQuantumNebula.tsx` |
| **HUD wash** | Voiles radiaux or / neural / secondary | `.welcome-hud-bg` |
| **Hero glow** | Halo or derrière le titre | `.welcome-hud-hero-glow` |
| **Chrome** | Logo + kickers + 2 CTAs | `WelcomeHudScreen.tsx` |

Une seule phrase héroïque (Cormorant). Brand = `AegisLogo` + « AEGIS — LOGOS » (Cinzel) + eyebrow « Exocortex ». Deux actions : Dashboard (minéral) / Voice agent (or soft).

Parent DA shell : [`.stitch/DESIGN.md`](../../../.stitch/DESIGN.md). Tokens runtime : `src/index.css` (`.welcome-hud*`).

## Composition (1er viewport)

Ordre vertical, colonne `max-w-md`, centrée :

1. **Header** — logo 40×40 → kicker DM Mono → eyebrow or  
2. **Main** — H1 Cormorant (« Bonjour, {name}. ») + glow  
3. **Footer** — 2 pills CTAs  
4. **Lang** — absolu top-right, Cinzel, glass blur 14px  

Pas de cards, stats, chips promo ni overlays stickers sur le hero. Nebula reste derrière (`z-0`) ; chrome à `z-10+`.

## Colors & Atmosphere

Dark (référence) :

- Fond page = `--background` (abysse froid ~`200 35% 7%`).
- Wash haut : ellipse primary 10 % ; coins neural / secondary très faibles.
- Vignette centrale via `::after` (`background / 0.22`).
- Glow titre : primary 28 %, blur 28px, ~440×220.

Light : washes atténués (primary 6 %) ; glow → `foreground / 0.04` (pas d’or flashy).

**Interdit sur Welcome :** purple/indigo glow, bronze landing marketing, cards glass bleutées, Inter/Roboto display.

## Typography

| Voix | Usage Welcome |
|------|----------------|
| **Cormorant Garamond** 300 | H1 seul |
| **DM Mono** (`.font-display`) | Kickers, CTAs, tuiles, slide label — uppercase tracking large |
| **Cinzel** | Toggle langue uniquement |
| **Barlow** | Corps hors HUD (modales post-tour, etc.) |

## Motion

- Entrée titre : `useAegisMotion().fadeUp(0.12)` (Framer).
- CTAs : hover border / translate icône 0.5 ; `duration-200`.
- Glass tile `:active` → `scale(0.985)` ; annulé si `prefers-reduced-motion`.
- Loading : spinner primary ring ; spin off si `reduceMotion`.
- Nebula : état `repos`, `sphereRadius: 1.1`, `cameraDistance: 3.6`, `theme: auto`.

## Components

### CTA secondaire (Dashboard)

Pill `rounded-full`, fill `background/20`, border `border/30`, texte muted, flèche 12px. Hover → texte foreground, border plus lisible.

### CTA primaire (Voice)

Pill or soft : `bg-primary/10`, `border-primary/25`, texte `primary`, icône Mic 12px. Hover → `/15` fill, `/40` border.

### Lang toggle

`h-11`, `rounded-xl`, glass `background/40` + `backdrop-blur-[14px]`, Cinzel locale.

### WelcomeGlassTile (hub legacy / variantes)

Radius **18px**, gradient card 62→34 %, blur 20px, inset hairline ivoire, ombre profonde. Kicker + headline DM Mono ; chip action `rounded-full`.

### SlideToStart

Track `h-14` full pill, glass card/55 %. Knob 48px, gradient primary → primary-hover, ombre or 40 %. Label DM Mono tracking `0.28em`. Seuil drag **82 %**.

## Do's / Don'ts

**Do**

- Garder nebula `repos` fullscreen derrière le HUD.
- Une H1 Cormorant max ; brand via `AegisLogo`.
- Touch targets ≥ 44px ; respecter safe-area.
- Brancher les strings i18n (`welcome.hud.*`, `welcome.choice.*`).

**Don't**

- Remplacer DM Mono kickers par Inter / system.
- Empiler tuiles ou gauges dans le 1er viewport HUD actuel.
- Utiliser le bronze landing (`.aegis-landing`) ici.
- Filtrer le logo ; toujours `AegisLogo`.

## Source map

```
src/pages/Welcome.tsx
src/features/welcome/components/WelcomeHudScreen.tsx
src/features/welcome/components/WelcomeQuantumNebula.tsx
src/features/welcome/components/WelcomeGlassTile.tsx
src/features/welcome/components/SlideToStart.tsx
src/features/welcome/components/ArcGauge.tsx
src/index.css          → .welcome-hud, .welcome-hud-bg, .welcome-hud-hero-glow,
                          .welcome-glass-tile, .welcome-slide-track, .welcome-slide-knob
```
