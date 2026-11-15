# LOGOS — brief artworks covers (choix)

Pas un artwork par exercice toolbox : **une cover par famille** dans le cover-flow `propose_actionable_choices`.

## Liste à produire (obligatoire)

| # | Fichier cible | Usage | Ratio |
|---|---------------|--------|-------|
| 1 | `public/logos/covers/toolbox-cover.png` | Toutes les cartes `kind: toolbox` | **3:4** (portrait, ~1200×1600) |
| 2 | `public/logos/covers/pulse-cover.png` | Toutes les cartes `kind: pulse` | **3:4** (portrait, ~1200×1600) |

Optionnel plus tard (pas bloquant) :

| # | Fichier | Usage |
|---|---------|--------|
| 3 | `toolbox-cover-light.png` | Variante os / noir si la dark ne passe pas en light |
| 4 | `pulse-cover-light.png` | Idem Pulse |

Chemins branchés dans le code : `LOGOS_CHOICE_COVER_PATHS` (`LogosChoicesPickerModal.tsx`). En attendant les PNG, le modal utilise un **gradient placeholder** (pas de covers Persona).

## Direction visuelle commune

- Format **portrait 3:4**, coins arrondis gérés en UI (`rounded-[1.75rem]`).
- Zone **basse** libre pour titre Cormorant + badge — gradient sombre / fondu prévu dans l’UI.
- **Dark** : abyss + or Aegis (`#0b0b0a` / `#c9a24b`), encre os.
- **Light** : os / albâtre + noir (`#f5f2eb` / `#141412`) — éviter le violet/glow générique.
- Pas de visage “portrait auteur” type Myss/Jung/Blavatsky (réservé Persona).
- Pas de texte baked dans l’image (titres dynamiques).

## Idées — Toolbox cover

**Rôle** : outil concret, protocole, corps / geste / focus.

Pistes :

1. **Instrument minimal** — un seul objet métallique/mat (clepsydre, clé, diapason, poids) sur fond pierre, lumière rasante or.
2. **Main + structure** — silhouette de main ou ligne de posture, grille discrète, pas de photo stock “yoga”.
3. **Chambre d’outil** — plan serré d’un établi abstrait (lignes, ombre, un outil), grain film léger.
4. **Orbite d’effort** — anneau / ellipse or sur abyss (lien nébuleuse LOGOS sans recopier les particules).

À éviter : icône wrench plate, UI mock, collage multi-outils.

## Idées — Pulse cover

**Rôle** : insight court, carte du jour, assimilation / ignore.

Pistes :

1. **Carte / feuille** — rectangle papier os, un point or, ombre douce (métaphore “carte à retourner”).
2. **Pulse organique** — courbe / onde unique, or sur noir, très sparse.
3. **Seuil** — porte / fente de lumière verticale (décision assimilate), sans personnage.
4. **Sceau** — cercle brisé / sceau cire or, texture pierre.

À éviter : cœur emoji, EEG clinique, photo stock “meditation girl”.

## Livrable demandé

- 2 PNG (ou WebP) en 3:4, export sRGB.
- Noms exacts ci-dessus.
- Déposer dans `public/logos/covers/` → le modal pourra brancher `<img>` sur `LOGOS_CHOICE_COVER_PATHS`.
