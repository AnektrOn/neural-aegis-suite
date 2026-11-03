# App IA — Navigation 4 hubs & backlog produit

Document de référence pour la navigation utilisateur connecté (hors landing, `/admin`, Prism).

## Décision d’architecture

Le menu **ne liste pas les features**. Il liste **4 hubs**. Une feature nouvelle = un **panel** dans un hub, jamais une icône dock dédiée à la feature seule.

**Lens ≠ item nav** : le registry de lenses vit sous `/persona`. `/deep-dive` et `/deep-dive/scores` sont des **vues** de lens, pas des destinations de navigation.

**Exactement 4 hubs** en sidebar desktop — pas de 5ᵉ hub « Compte ».

| Hub | Route index sidebar | Rôle |
|-----|---------------------|------|
| **Capture** | `/capture` | Inputs : humeur, habitudes, journal, décisions, people |
| **Portrait** | `/persona` | Analyses / reports via registry de **lenses** |
| **Pratiques** | `/pratiques` | Outils à faire : toolbox, pulse, bibliothèque, Dien Chan |
| **Messages** | `/messages` | Lien humain : inbox, annonces, newsletter |

**Board** : panel catalogue `home` → **`/dashboard` uniquement** (jamais `/`). `/` reste Welcome, hors catalogue menu.

**Dock mobile** : 4 raccourcis = **usages quotidiens** (panels), pas les 4 hubs. 5ᵉ contrôle = bulle **overflow**. Hubs = sidebar desktop.

**Compte** (profile, settings, install app) : joignables via header / utility / overflow — **pas** dans la sidebar hubs.

---

## Hub Capture

Panels :

| Panel | Route | Masquable |
|-------|-------|-----------|
| Mood | `/mood` | oui |
| Habits | `/habits` | oui |
| Journal | `/journal` | oui |
| Decisions | `/decisions` | oui |
| People | `/people` | oui |

### Inputs existants vs à ajouter

| Existant | Backlog (doc only) |
|----------|-------------------|
| Mood, habits, journal (CRUD basique), decisions, people | Journal produit « vrai » (UX, sync, vocale) |
| — | Notes vocales user |
| — | Agent vocal |
| — | Upload audio user → AEGIS |

---

## Hub Portrait

Route hub : `/persona`. Lenses via [`buildPortraitLenses`](../src/features/persona/lib/buildPortraitLenses.ts).

| Lens | Statut | Nav |
|------|--------|-----|
| Caroline Myss (`myss`) | Live | Via Persona uniquement |
| Benebell Wen (`tao`) | Live | Via Persona uniquement |
| Jung | Prévu | — |
| Blavatsky | Prévu | — |
| Analyses éco | Prévu | — |
| Analyses comportementales | Prévu | — |
| ~50 lenses max | Cible registry | **Interdit** : une route menu par lens |

Panels nav (hors lenses) : `analytics`, `calendar` (hub Portrait).

---

## Hub Pratiques

| Panel | Route | Notes |
|-------|-------|-------|
| Index hub | `/pratiques` | — |
| Toolbox | `/toolbox` | **Un seul panel**, hub Pratiques |
| Pulse | `/pulse` | — |
| Bibliothèque | `/bibliotheque` | — |
| Dien Chan | `/pratiques/dien-chan` | UI lab masquée ; `/dev/dien-chan` = lab complet |

**Méditation** : hors menus user (feature pas user-ready). Routes `/meditation*` et admin **conservées** — ne pas supprimer le code.

---

## Hub Messages

| Panel | Route | Statut |
|-------|-------|--------|
| Messages | `/messages` | Annonces + MP admin→user (partiel) |
| Newsletter | `/newsletter` | Hub Messages |
| Ambassadeur | `/ambassadeur` | Catalogue (hub Messages) |

### Messagerie (backlog)

| Existant | Absent (scope futur) |
|----------|---------------------|
| `admin_messages`, notifications popup/message/admin | Fil user → AEGIS (two-way) |
| — | Audio user → admin |

---

## Catalogue & personnalisation

Source unique : [`userMenuCatalog.ts`](../src/lib/userMenuCatalog.ts).

Préférence unique : `dock[4]`, `overflow[]`, `hidden[]` (panel-level).

Panels **accountUtility** : `settings`, `profile`, `install` — overflow / header, pas sidebar hubs.

Panels **navExcluded** (routes directes OK) : `meditation`, `deep_dive`, `deep_dive_scores`.

**Toujours joignables** : `/dashboard`, `/settings`.

---

## Ordre de construction recommandé

1. Doc + catalogue + prefs unifiées  
2. Sidebar 4 hubs + dock 4 + overflow  
3. Page `/capture` (index hub)  
4. Dien Chan user (`/pratiques/dien-chan`)  
5. Lenses futures (registry, pas nav)  
6. Journal produit, agent vocal, audio, messagerie two-way  
