# Prompt Claude — Migration Member Shell v2 (toutes les pages membre)

Copie-colle ce bloc tel quel dans Claude (projets AEGIS / neural-aegis-suite).

---

## Contexte

Le dashboard prod `/dashboard` utilise désormais un **shell membre v2** (référence visuelle et UX), pas l’ancien chrome AppLayout (sidebar 220px + `DesktopTopBar` « Tableau de bord / RECHERCHER / LOG RAPIDE » + footer marketing).

**Déjà en place dans le repo :**

| Fichier | Rôle |
|---------|------|
| `src/layouts/memberShellConfig.ts` | `MEMBER_SHELL_V2 = true` |
| `src/layouts/MemberAppShell.tsx` | Shell commun : `main` plein viewport, `paddingBottom: var(--mobile-dock-padding)`, **`MobileAppDockBar`** avec `previewOnDesktop` sur desktop, `AppCommandPalette` (⌘K), `QuickLogModal` |
| `src/components/AppLayout.tsx` | Si `MEMBER_SHELL_V2`, délègue à `MemberAppShell` (plus de sidebar / top bar legacy) |
| `src/features/bio-executive-dashboard/` | Dashboard Exocortex : `immersiveAppShell`, classe CSS `aegis-bio-exec-lab--immersive-viewport`, hero pleine hauteur colonne |
| `src/components/PageWrapper.tsx` | Prop `memberShell` → `min-h-[100dvh] w-full` |
| `src/layouts/MemberPageScaffold.tsx` | Patron padding pour pages non dashboard |

**Ne pas refaire :**

- Barre utilitaire inventée (Rechercher / cloche / Logger) **dans** le lab Bio-Executive — interdit.
- Réintroduire sidebar ou `DesktopTopBar` sur les routes membre tant que `MEMBER_SHELL_V2` est actif.
- Importer depuis `src/pages/dev/prism-landing/**` (règles projet).

**Routes concernées :** tout ce qui passe par `AppLayout` dans `src/App.tsx` (`path="/*"` protégé + abonnement) : `/capture`, `/dashboard`, `/persona`, `/mood`, `/decisions`, `/habits`, `/journal`, `/toolbox`, `/pratiques`, `/pulse`, `/bibliotheque`, `/meditation`, `/people`, `/analytics`, `/profile`, `/settings`, `/messages`, etc.

**Hors scope :** `/admin/*`, landing, auth, visitor — layouts inchangés.

---

## Objectif

Adapter **chaque page membre** au shell v2 pour que l’expérience soit cohérente avec `/dashboard`, même si le rendu n’est pas encore pixel-perfect.

1. **Layout global** — déjà fait via `MemberAppShell` ; ne dupliquer **pas** un second dock par page.
2. **Contenu page** — repenser padding, largeur max, fond, scroll :
   - Fond : `bg-bg-base` (pas de carte centrée 1480px sauf besoin produit explicite).
   - Réserver le dock : `pb-[var(--mobile-dock-padding)]` ou laisser le shell le gérer ; pas de contenu fixe sous le dock.
   - Éviter `max-w-* mx-auto p-6 md:p-10` hérités de l’ère sidebar sans les revoir.
3. **Navigation** — uniquement le dock + menu radial ; pas de second header « Tableau de bord » par page.
4. **Desktop** — même shell que mobile (dock visible en bas via `previewOnDesktop`).

---

## Référence dashboard (golden UX, pas blueprint d’architecture)

- Hero desktop : colonne gauche ~7/12, tuiles ~5/12, hauteur viewport, tokens `--hero-bg`, `--bio-*` dans `bioExecutiveDashboard.css`.
- Exocortex : `useBioExecutiveHero`, `buildExocortexHeroUi`, `BioExecutiveHeroFigure`, `BioExecutiveHeroQuickActions`.
- Fichiers clés : `BioExecutiveMobileDashboard.tsx`, `DashboardMobile.tsx`, `Dashboard.tsx`.

---

## Plan de travail demandé

### Phase A — Inventaire

1. Lister les pages sous `AppLayout` (grep `Route path=` dans `App.tsx`).
2. Pour chacune, noter : padding actuel, headers locaux, footers `AppFooter`, composants `dashboard-panel-*`, dépendance à `ml-[220px]` implicite.

### Phase B — Patron de page v2

Créer (si absent) un wrapper léger réutilisable — **déjà présent** : `src/layouts/MemberPageScaffold.tsx` :

```tsx
// Exemple — à affiner
export function MemberPageScaffold({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-0 w-full px-3 sm:px-5 lg:px-6 py-4 lg:py-5", className)}>
      {children}
    </div>
  );
}
```

Utiliser ce scaffold sur les pages « liste / formulaire » ; **ne pas** l’utiliser sur `/dashboard` (layout lab full bleed).

### Phase C — Migration par vague

| Vague | Pages | Action |
|-------|--------|--------|
| 1 | Capture, Mood, Decisions, Journal, Habits | Retirer headers redondants ; scaffold + scroll |
| 2 | Toolbox, Pratiques, Pulse, Bibliothèque, Meditation | Idem ; vérifier modales plein écran |
| 3 | Persona, People, Analytics, Profile, Settings, Messages | Idem ; settings = accès via dock radial si besoin |
| 4 | Install, Ambassador, Calendar, onboarding user | Cas par cas |

Pour chaque page : diff minimal, conventions existantes (Barlow, Cormorant, tokens), pas de refactor massif.

### Phase D — CSS global shell

Ajouter dans `src/index.css` (ou module dédié) des hooks :

```css
.aegis-member-shell main {
  /* déjà padding-bottom dock via inline style MemberAppShell */
}
```

Pages full-bleed (comme dashboard) : classe opt-out sur `PageWrapper` ou prop `memberShell={false}` locale si nécessaire.

### Phase E — QA

- Desktop + mobile : dock visible, route active correcte, pas de double dock.
- ⌘K ouvre la palette sur desktop.
- `/dashboard` : hero figure remplit la colonne (classe `--immersive-viewport`), tuiles scroll à droite.
- Régression : admin, auth, landing intactes.

---

## Contraintes techniques

- Supabase : env vars, try/catch, vérifier `error` (règles projet).
- Pas de commit sauf demande explicite.
- Tests : smoke sur une page migrée si pattern répété.
- Documenter dans le PR : pages migrées + pages restantes.

---

## Livrable attendu

1. `MemberPageScaffold` (ou équivalent) + migration **au moins vague 1** complète.
2. Liste markdown des pages restantes avec blocage éventuel.
3. Aucune régression sur `/dashboard` et `MEMBER_SHELL_V2`.

Commence par lire `MemberAppShell.tsx`, `AppLayout.tsx`, puis migre **CaptureHub** et **MoodTracker** comme modèles pour le reste.
