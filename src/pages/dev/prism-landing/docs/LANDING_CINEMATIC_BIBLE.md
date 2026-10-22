# Landing Prism — bible cinéma (shot list)

Document de production pour le travelling `/dev/prism-landing`.  
Vocabulaire aligné sur [StudioBinder — 50+ Types of Camera Shots](https://www.studiobinder.com/blog/types-of-camera-shots-sizes-in-film/) (2025).

## Sujets (acteurs de scène)

| ID | Rôle | Description |
|----|------|-------------|
| `scene_envelope` | environment | Carte du lieu — establishing |
| `terrain_zone` | environment | Terrain 56×56, eau, brume |
| `cube` | hero | Cube fracturé (acte 1) |
| `marble` | set_piece | Monolithe marbre (acte 2) |
| `portal` | threshold | Portail + piliers (acte 3) |
| `portal_slit` | threshold | Fente lumineuse (détail / ECU) |

Positions monde : `landingSceneLayout.ts` + `landingCinematicContract.ts` (`LANDING_SUBJECTS`).

## Tailles de plan (shot size)

| Abbr | Nom | Usage landing |
|------|-----|----------------|
| EST / EWS / WS | Establishing → wide | Ouverture / fermeture, géographie |
| FS / MWS / CS | Full → cowboy | Corps du set piece dans le décor |
| MS / MCU | Medium → medium close | Transition, dialogue visuel |
| CU / ECU | Close → extreme close | Émotion, fente, texture |

Distances suggérées (m) : `SHOT_SIZE_SUGGESTED_DISTANCE_M` dans `landingCinematicContract.ts`.

## Cadrage (framing)

`single`, `two_shot`, `three_shot`, `ots`, `oth`, `pov` — voir `SHOT_FRAMING_LABELS`.

## Angles

`eye_level`, `low`, `high`, `hip`, `knee`, `ground`, `shoulder`, `dutch`, `birds_eye`, `aerial` — voir `SHOT_ANGLE_LABELS`.

## Mouvement & focus

- Mouvement : `static`, `dolly`, `tracking`, `pan`, `tilt`, `arc`, etc.
- Focus : `deep`, `shallow`, `rack_focus`, …

## Shot list verrouillée (ancres u)

Décisions régie par étape : **`landingDefaultShotList.ts`** → `LANDING_ANCHOR_SHOT_LIST`.

Keyframes 3D (position + lookAt) : **`sceneLayout.ts`** → `LANDING_CAMERA_KEYFRAMES` (landing live).  
Presets éditeur : **`landingCameraPathPresets.ts`** (`prism_landing` | `cinematic_shot_path` | `user_legacy`).

### Plan marquant cube (réf. CITY)

**Étape 7 · u = 0,258** — `landingCubeMarkShot.ts` : caméra à **1,72 m** derrière l’axe du cube, lookAt **y ≈ 10,8** (contre-plongée), **FOV 26°** au Play. Silhouette cible : `(cube.x, cube.z − 5,8)`. Badge **★ Plan marquant** dans l’éditeur layout.

### Finale piliers (Villeneuve)

Étapes **13–21** (`u ≥ 0.609`) : **`landingVilleneuvePillarFinale.ts`** — hauteur homme (`1,72 m`), two-shot sur les **deux piliers**, contre-plongées, fente, clôture symétrique ; post `slow_reveal` / `letterbox_239`. Étapes **1–12** : path shot list drone inchangé.

Métadonnées ciné par étape (éditeur) : champ optionnel `cinematic` sur chaque keyframe + export JSON path.

## Workflow

1. Choisir **étape** (slider Étape 1…n).
2. Renseigner **sujet** + **taille de plan** + intention.
3. Ajuster **lookAt** (azimut / inclinaison / distance) ou **Viser sujet**.
4. **Copier path JSON** → commit dans `LANDING_CAMERA_KEYFRAMES` + mettre à jour `LANDING_ANCHOR_SHOT_LIST` si la narration change.

## Post-production drone (AAI Drones)

Travelling = **vol simulé** : stabilisation path, couleur, vitesse, letterbox, son, VFX.  
Référence complète : **[`LANDING_DRONE_POSTPRODUCTION.md`](./LANDING_DRONE_POSTPRODUCTION.md)**  
Types : **`landingDronePostContract.ts`** (`cinematic.post` sur chaque keyframe).

## Mouvements ciné drone (Adorama / Muji)

Pilotage manuel : **Cine mode**, Orbit, Dronie, Cable cam, Rocket, Tilt reveal.  
Référence : **[`LANDING_DRONE_CINEMATIC_MOVES.md`](./LANDING_DRONE_CINEMATIC_MOVES.md)**  
Types : **`landingDroneMovesContract.ts`** (`cinematic.droneMove`).
