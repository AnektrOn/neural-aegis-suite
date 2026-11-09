# Garde-fou DA — Member Shell v2 (réf. `/dashboard`)

Document pour **revue humaine + agent** pendant la migration Claude.  
Référence visuelle : Bio-Executive prod (`immersiveAppShell`, `--immersive-viewport`), **pas** l’ancien AppLayout sidebar / `DesktopTopBar`.

---

## 1. Shell (bloquant)

| Règle | OK | KO |
|--------|----|-----|
| Une seule nav bas | `MemberAppShell` → `MobileAppDockBar` (`previewOnDesktop` desktop) | Second dock / `MobileAppDockBar` dans une page |
| Pas de chrome legacy | `MEMBER_SHELL_V2` → pas sidebar / `DesktopTopBar` / `AppFooter` membre | `ml-[220px]`, `bg-aegis-gradient` wrapper page, `-mx-6 -mt-6 md:-mx-10` pour « coller » à l’ancien main |
| Réserve dock | Padding bas via shell (`--mobile-dock-padding`) | `pb-24`, `pb-[calc(...dock...)]` redondant sur la page |
| Contenu scaffold | `MemberPageScaffold` + `data-member-page` | Page nu dans `max-w-6xl mx-auto p-10` sans scaffold |
| Dashboard | Full bleed, **pas** de `MemberPageScaffold` | Carte 1480px ou header lab Rechercher/cloche |

Commande : `bash scripts/validate-member-shell-da.sh`

---

## 2. Typographie page (standard vague 1+)

**En-tête de page** (hors dashboard) — copier ce trio :

```tsx
<p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">
  {kicker i18n}
</p>
<h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">
  {title i18n}
</h1>
```

| Élément | Attendu | Éviter |
|---------|---------|--------|
| Kicker | `font-display`, `tracking-[0.22em]`, uppercase | Titre seul sans kicker |
| Titre H1 | **`font-cormorant`**, `font-light` | `font-display` sur H1 (sauf hub très marketing — aligner Capture sur Cormorant) |
| Sous-titre | `text-sm text-muted-foreground`, `max-w-2xl` | Barre sticky type app top bar |

**Corps** : Barlow (défaut `:root`), labels section `font-display text-[11px] tracking-[0.15em] uppercase`.

---

## 3. Couleur & surfaces

| Contexte | Tokens / classes |
|----------|------------------|
| Fond shell | `bg-bg-base` (MemberAppShell) |
| Hero dashboard | `--hero-bg`, `--bio-*` (`bioExecutiveDashboard.css`) |
| Pages membre | `glass-card`, `dashboard-panel`, `NeuralCard` — **cohérent par page**, pas mélange 3 systèmes sans raison |
| Accent or | `text-accent-primary`, `border-accent-primary/25` — aligné dashboard Exocortex |
| Interdit page membre | `bg-aegis-gradient` plein écran (réservé legacy / persona à migrer) |

Tuiles dashboard = **golden** pour densité/or ; les pages liste peuvent rester en glass-card **tant que** typo + shell respectés.

---

## 4. Largeur contenu (`MemberPageScaffold`)

| `width` | Usage |
|---------|--------|
| `narrow` | Settings, messages, formulaires (Mood mobile) |
| `default` | Hubs, trackers, journal (max-w-5xl) |
| `wide` | Analytics, calendar, people |
| `full` + `bleed` | Pratiques hero, pulse, onboarding |

Pas de `max-w-*` supplémentaire **à l’intérieur** du scaffold sans justification.

---

## 5. Revue vague 1 — **validée** ✅

| Page | Shell | Scaffold | Typo H1 | Verdict |
|------|-------|----------|---------|---------|
| CaptureHub | ✅ | ✅ default | ✅ Cormorant | OK modèle hub |
| MoodTracker | ✅ | ✅ narrow/default | ✅ | OK — follow-up i18n mobile |
| DecisionLog | ✅ | ✅ default | ✅ | OK |
| Journal | ✅ | ✅ default | ✅ | OK |
| HabitTracker | ✅ | ✅ default | ✅ | OK |

Automatisé : `bash scripts/validate-member-shell-da.sh` · tests Vitest wave 1.

**Wave 2+** : voir `MEMBER_SHELL_V2_BACKLOG.md` — pratiques/pulse/persona = risque **KO shell** (margins négatives, fausses full-bleed).

---

## 6. Process reviewer (agent)

Pour **chaque PR / fichier** touché par Claude :

1. Lancer `bash scripts/validate-member-shell-da.sh`
2. Ouvrir la page : dock unique, pas de double header global
3. Vérifier H1 = Cormorant + kicker display
4. Comparer à CaptureHub / MoodTracker (modèles vague 1)
5. Si page « immersive » (pratiques, pulse) : `bleed` + pas de padding scaffold, pas de hack `-mx-3`

Mettre à jour la section **5** et le backlog quand une page passe revue.

---

## 7. Dashboard-only (ne pas casser)

- `aegis-bio-exec-lab--immersive-viewport` + hauteur colonne hero
- Pas de `MemberPageScaffold` sur `/dashboard`
- Exocortex : `BioExecutiveHeroFigure`, pas barre utilitaire lab
