# Bio-Executive Hero — golden + règles (conversation source)

Source : Cursor chat **AEGIS Dashboard Executive Redesign** (`a284538d-7db8-4c7d-8ebb-a64b44af4b29`), 31 oct. → 3 nov. 2026.

`/dashboard` doit consommer **uniquement** `DEFAULT_HERO_LAB_CONFIG` (construit depuis `bioExecutiveHeroLabPresets.json`).  
Le Hero Lab (`/dev/aegis-dashboard`, `heroLab=true`) peut encore écrire `localStorage` v3 pour expérimenter — **sans écraser la prod**.

---

## Ce qui a été fait (chronologie)

1. **Redesign Neka** — silhouette neuronale, layout hero 7 / tuiles 5, tuiles colorées + viz datas, palettes dark/light.
2. **Lab silhouette** puis **Hero Lab v2 → v3** — breakpoints, drag, typo, overlay gradual blur, copie JSON, persistance `aegis_bio_hero_lab_config_v3`.
3. **Réglages utilisateur collés** — silhouettes multi-breakpoints, overlay desktop, slices tablet + mobile complets (3 nov. immersive).
4. **Overlay colonne** — portal dans `.desktop-hero`, mesure `escapeBox`, full width panneau **sans** redimensionner la photo.
5. **Polish desktop ≥1024** — fade bas 18 %, hotspots, métrique, dock/1-Tap, Hero Builder hors grille.
6. **Palette luxury-brutalist** — tokens `--bg/--surface/--text/--accent/--hero-bg/--cardline` + cartes (Niveau/Score/Stress…).
7. **Héros collé au cadre** — `lg:gap-0 lg:p-0`, plus de bande 24 px (`lg:p-6`) hors overlay.
8. **Grille tuiles P1/P2/P4** — Décision / Score / Stress / Habitudes / Sommeil / Pulse / Toolbox (+ signal) ; **ne pas toucher** HeroLab / overlay / palette.
9. **Shell immersif** — figure pleine hauteur colonne ; footer en overlay (pas de bande haut/bas).

Assets de référence (même conversation) :  
`assets/Dashboard-0cb8c054…`, `image-b8ee4e8a…`, `browser-screenshot-c0d9b549…`, `c195a5b5…`, `06c38313…`, `ea26b448…`, etc.

---

## Réglages golden (paste immersif 3 nov. 2026)

| Breakpoint | Silhouette `width / left / bottom` | Overlay (essentiel) |
|---|---|---|
| **Desktop** | `50.5 / 24.5 / -2` | `columnFullWidth`, top `10.5`, blur `0→5`, opac. max `41`, direction **bottom**, layers `16`, tint `dark`, radius `0` |
| **Tab. paysage** | `66.5 / 25 / 7.5` | overlay **off** (seed frame dans JSON) |
| **Tab. portrait** | `56 / 23 / 3.25` | overlay **off** + elements retunés |
| **Mob. portrait** | `70.5 / 36 / 0.5` | overlay **off** ; hotspot brain **hidden** ; hotspots 24 px |
| **Mob. paysage** | `56.5 / 25.5 / -2.5` | overlay **off** ; nodeTitle bas-gauche |

Fichier unique : `bioExecutiveHeroLabPresets.json` (tous les breakpoints + elements) → `buildDefaultHeroLabConfig()` dans `bioExecutiveHeroLabConfig.ts`.

---

## Règles inébranlables

1. **Ne pas modifier le schéma `HeroLabConfig` / localStorage v3** (sauf évolution lab explicite + migration).
2. **Direction artistique** — or / laiton sur bleu-noir (luxury-brutalist) ; **pas** de vert / turquoise / nouvel accent hors palette listée.
3. **Silhouette** — crop **net à gauche** (voulu) ; **fade uniquement en bas** (~18 % → `--hero-bg`). Aucun fade gauche.
4. **Overlay pleine largeur panneau** — portal `.desktop-hero` ; **ne jamais** changer la taille de la photo pour « full width ».
5. **Pas de bande non-blur à gauche** — héros collé au frame (`lg:gap-0 lg:p-0`) ; padding sur la colonne cartes, pas sur la grille.
6. **Teinte overlay** — fin de dégradé = fond panneau (`--hero-bg` / tokens colonne), pas une couleur inventée.
7. **Hero Builder** — visible **uniquement** en mode lab ; hors grille de cartes.
8. **Tuiles / données** — phases fixtures avant fetch ; ne pas recoller Pulse ≠ Décision ; ne pas casser le héros en touchant la colonne droite.
9. **Shell lab de tuning** — `immersiveAppShell` + `heroLab` (pas `embedInFrame`) pour coller la géométrie prod.
10. **Source de vérité prod** — defaults commités (`bioExecutiveHeroLabPresets.json`) ; localStorage lab = sandbox, **pas** la prod.
11. **Géométrie immersive** — la figure remplit la colonne héros ; le footer (quick actions / 1-Tap) est en **overlay**, il ne vole pas la hauteur du stage. Ne pas double-réserver `--mobile-dock-padding` (déjà sur `MemberAppShell`).

---

## Vérif rapide

- `/dashboard` → silhouette desktop ≈ `50.5% / 24.5% / -2%`.
- Overlay desktop → gradual **bottom**, blur max `5`, opac. `41`, tint `dark`.
- Clear `localStorage` clé `aegis_bio_hero_lab_config_v3` si un vieux lab écrase le rendu en mode lab.
