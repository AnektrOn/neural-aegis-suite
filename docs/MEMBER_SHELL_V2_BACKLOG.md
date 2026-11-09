# Member Shell v2 — migration status

Shell: `MemberAppShell` (dock + ⌘K, no sidebar/top bar). Page primitive: `MemberPageScaffold` (`width`: narrow / default / wide / full, `bleed`).

## Migrated ✅

### Wave 1
| Route | Page | Notes |
|---|---|---|
| `/capture` | `CaptureHub` | model page; scaffold `default` |
| `/mood` | `MoodTracker` | model page; mobile `narrow`, desktop `default`; "Logger maintenant" now targets `/dashboard` (`/` renders `Welcome` and dropped `openQuickLog` state) |
| `/decisions` | `DecisionLog` | removed `pb-24 md:pb-16` dock hack |
| `/journal` | `Journal` | |
| `/habits` | `HabitTracker` | |

### Wave 2
| Route | Page | Notes |
|---|---|---|
| `/toolbox` | `Toolbox` | scaffold; fullscreen exercise session dialog raised to `z-[140]` (was `z-50`, i.e. *under* the dock `z-60`) |
| `/pratiques` | `PracticesHub` | true full-bleed: removed negative margins / `calc(100%+…)` widths; `min-h` now `100dvh - dock padding` |
| `/pulse` | `PulsePage`, `PulseGrimoire`, `PulseRuneTracker` | removed `-m-4 md:-m-6` + `rounded-[18px]`; `min-h-[calc(100dvh-var(--mobile-dock-padding))]` |
| `/bibliotheque` | `Bibliotheque` | `wide` |
| `/meditation` | `MeditationLibraryPage` | `narrow` |

### Wave 3
| Route | Page | Notes |
|---|---|---|
| `/persona` | `Persona` | removed `-mx-6 -mt-6 md:-mx-10 md:-mt-10` (kept gradient, full-bleed) |
| `/people` | `PeopleBoard` | `wide`; floating action bar now `bottom-[calc(3.5rem+safe)] z-30` on **all** breakpoints (was `fixed bottom-0 z-50` on desktop → hidden behind the desktop dock); `pb-44/32` → `pb-24` |
| `/analytics` | `Analytics` | `wide` |
| `/profile` | `Profile` | `narrow` |
| `/settings` | `Settings` | `narrow`; **fixed missing `Smartphone` import** (runtime crash) |
| `/messages` | `Messages` | `narrow` |

### Wave 4
| Route | Page | Notes |
|---|---|---|
| `/install` | `InstallApp` | `narrow` |
| `/ambassadeur` | `Ambassador` | default; removed `pb-16` dock hack |
| `/calendar` | `CalendarView` | `wide` |
| `/deep-dive` | `DeepDiveReportPage` (user mode only) | added side padding for `mode="user"`; admin mode unchanged |
| `/deep-dive/scores` | `DeepDiveScores` | added side padding |
| `/progress/myss` | `ProgressEvolution` | not routed under `AppLayout` (dead page); negative margins removed anyway |

### Other
- `AppLayout` legacy branches declare `immersiveDashboard = false` (unreachable while `MEMBER_SHELL_V2`).

## Left as-is (self-contained, no change needed)
| Route | Reason |
|---|---|
| `/cartographie/*` (`ArchetypeCartographyReport`) | already has its own `px-4 sm:px-6 lg:px-8`; still has `pb-24` (harmless extra space) |
| `/onboarding/assessment`, `/onboarding/results`, `/assessment/maisons` | immersive `min-h-screen` flows with their own padding / centering |
| `/meditation/:id` session | routed **outside** `AppLayout` |
| `/dashboard` | golden reference, untouched |

## Follow-ups & Resolutions
- **Dock vs dialogs:** ✅ **RÉSOLU**. `Dialog`, `Sheet` et `AlertDialog` (overlay + content) élevés au niveau `z-[140]` avec fond en verre dépoli `backdrop-blur-[16px]` et ombre cinématique. Le dock (`z-[60]` / `z-[95]`) est désormais proprement occulté par l'overlay assombri lors de l'ouverture de n'importe quel modal.
- **Visual DA alignment:** ✅ **RÉSOLU**. Texture signature *mat blurry glass* (.aegis-dock-tile / .aegis-bento-tile / BentoTile), Arène Abyssale (`#070707` + aura dorée) déployée sur `MemberSplitLayout`, et 100% des hubs et trackers finalisés au standard Bio-Executive Dashboard.
- **Top Dock Bar:** ✅ **DÉPLOYÉ**. Îlot flottant en haut à droite avec sélecteur de thème clair/sombre, bascule de langue FR/EN et bouton de déconnexion.
- **100vh Edge-to-Edge:** ✅ **DÉPLOYÉ** sur toutes les pages éligibles, avec défilement interne et isolation des barres de scroll globales.
