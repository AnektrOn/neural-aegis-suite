# Lovable — Phase 3 : données Supabase pour les tuiles Bio-Executive

Coller ce prompt dans Lovable pour brancher le fetch réel. Le front (phases 1–2–4) expose déjà ces contrats TypeScript dans `src/features/bio-executive-dashboard/types.ts` et `buildBioExecutiveViewModel.ts`.

## Mission

Exposer les **tuiles action** du Bio-Executive Dashboard avec des données live Supabase, sans modifier le layout React ni Practices Hub. Le front consomme un enrichissement de `BuildBioExecutiveInput` (ou un hook dédié) qui remplit :

- `openDecisionItems[]` → `pendingDecision`, `pendingDecisionCount`, `lastDecisionDaysAgo`
- `journalSnippet`
- `pulseCard`
- `toolboxInbox`
- `adminMessage`
- `messageOfTheDay` (optionnel, non rendu v1 — peut rester `null`)

## Contrats TS (référence front)

```ts
openDecisionItems?: { id: string; name: string; priority: number; ageDays: number }[];
journalSnippet?: string | null;
pulseCard?: { id: string; title: string; isNew: boolean; addedLabel: string } | null;
toolboxInbox?: { favorites: number; missing: number; newer: number; nextItem: { id: string; title: string } | null };
adminMessage?: { id: string; subject: string; preview: string; isRead: boolean } | null;
messageOfTheDay?: { text: string; source: string } | null;
```

Tri côté front : `openDecisionItems` déjà triés **priority desc, ageDays desc** — le fetch peut trier ou laisser le builder trier.

## Mapping tables existantes

### Décisions pending
- Table : `decisions` (ou équivalent utilisé par `useDashboardData.ts`)
- Filtre : statut **non decided** / open pour `user_id`
- Champs : `id`, `name`/`title`, `priority`, `created_at` → `ageDays` = floor((now - created_at) / 86400000)
- `journalSnippet` : dernier extrait `journal_entries.content` (120 chars) pour l’utilisateur, ou null

### Pulse
- Réutiliser la logique de `fetchPulseDeck` / `aegis_user_card_interactions` (voir `fetchPracticesHubStats.ts`)
- `pulseCard` = **première carte non swipée du deck user** (ou top card du deck si c’est la sémantique produit retenue)
- `isNew` = carte assignée/ajoutée dans les **7 derniers jours** (définir la colonne : `created_at` ou table d’assignation)
- `addedLabel` = libellé FR localisé (« Ajoutée aujourd’hui », « Hier », date courte)

### Toolbox inbox
- `toolbox_assignments` + `toolbox_completions` (même règles que `fetchPracticesHubToolboxFeatured` / Practices Hub)
- `missing` = assignments actifs sans completion terminale (`completed` | `abandoned` | `ignored`) + `user_delivery_status === 'waiting'`
- `newer` = `assigned_at` dans les 7 derniers jours et still pending
- `nextItem` = premier pending trié (waiting d’abord, puis plus ancien)
- **`favorites`** : **gap produit** — pas de table favoris aujourd’hui. Livrer l’une de :
  - **Option retenue par défaut** : migration `toolbox_favorites (user_id, assignment_id, created_at)` + RLS user-only, count + priorité dans `nextItem` si favori pending
  - ou retourner `favorites: 0` jusqu’à migration

### Admin message
- Table : `admin_messages` (`recipient_id`, `subject`, `body`, `is_read`, `created_at`)
- Bandeau front : **dernier message non lu** pour `recipient_id = auth.uid()`
- `preview` = premiers 120 caractères de `body`

### Message of the day (v2)
- Pas de rendu front v1. Si tu prévois le schéma : table `daily_messages (day date, locale, text, source)` lecture seule pour users, write admin.

## API / hook livrable

Créer **une** fonction (edge ou service TS) :

`fetchBioExecutiveActionContext(userId: string, locale: 'fr' | 'en')`

Retourne un objet compatible avec les champs optionnels de `BuildBioExecutiveInput` ci-dessus.

Intégration front (hors Lovable si repo séparé) : étendre `useDashboardData` ou appeler en parallèle dans `DashboardMobile.tsx` avant `buildBioExecutiveViewModel`. **Ne pas** dupliquer `fetchPracticesHubStats` — factoriser les requêtes communes si possible.

## RLS & sécurité

- Toutes les requêtes scoped `auth.uid()`
- `admin_messages` : recipient_id = user
- Pas d’exposition de clés service côté client pour données admin

## Critères done

- `/dev/aegis-dashboard` peut rester en fixtures ; dashboard prod/mobile reçoit live data
- Mêmes shapes TS que fixtures dans `AegisBioExecutiveDashboard.tsx`
- `pendingDecision` null si aucune open decision
- `adminMessage` null si tout lu
- `pulseCard` null si deck vide
- Perf : un seul round-trip ou `Promise.all` parallèle, pas de waterfall 6 requêtes séquentielles
- Types Supabase régénérés si nouvelles tables (`toolbox_favorites`, `daily_messages`)

## Hors scope Lovable

- CSS / grille tuiles / Hero Lab
- Modifier Practices Hub UI
- MOTD tuile dashboard (champ peut exister, toujours null)
