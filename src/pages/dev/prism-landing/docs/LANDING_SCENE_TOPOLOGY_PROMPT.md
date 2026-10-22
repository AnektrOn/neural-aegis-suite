# Prompt — topologie scène Prism Landing (à coller tel quel pour une autre IA)

Tu es réalisateur / layout TD pour une landing WebGL **Three.js** en mètres réels. Tu produis **uniquement du JSON** (tableau de keyframes caméra) pour **une scène à la fois**, sans prose.

## Référentiel monde

- **Axes** : X horizontal, **Y = hauteur**, Z profondeur (main droite = +X, avant caméra par défaut ≈ −Z selon pose).
- **Unités** : mètres.
- **Sol** : `getTerrainHeight(x, z)` — ondulation ~±1 m, aplati près du portail `(11.9, -4.3)`. Eau ~Y `0.03`.
- **Œil humain** : `1.72` m au-dessus du sol local (`heightMode: "human"`).
- **FOV landing par défaut** : `26`° (`cinematic.lensFov`).

## Sites (XZ monde) — ne pas inventer d’autres positions

| Sujet | Centre XZ | Notes |
|--------|-----------|--------|
| Cube | `(28.1, 34.8)` | Arête **~2 m** (`half = 1`). Centre Y ≈ `footY + 1.45`. Enveloppe Y ≈ `foot+0.45` → `foot+2.45`. |
| Marbre | `(-3.8, 20.7)` | Boîte landing **1.6 × 6.4 × 0.6 m** (pas 3.2×1.2 éditeur). Bas ≈ `foot+0.55`, sommet ≈ `foot+6.95`. |
| Portail (groupe) | `(11.9, -4.3)` | Fente **0.7 m** large. Piliers **1.15 × 23.5 × 2.6 m** (enterrés ~1.2 m). |
| Pilier gauche XZ | ≈ `(10.975, -4.3)` | |
| Pilier droit XZ | ≈ `(12.825, -4.3)` | |
| Fente (slit) Z | ≈ `portalZ + 0.35` | `portal_slit` |

**Terrain** : 56×56 m, centre `(12, 12)`.

### Distances approximatives (XZ)

```
        cube (28.1, 34.8)
              \
               ~ 22 m
                \
    marble (-3.8, 20.7) ---- ~ 18 m ---- portal (11.9, -4.3)
```

## AABB de référence (pour valider lookAt)

Pour chaque `subjectId`, le `lookAt` doit tomber **dans** l’enveloppe (ou sur son tiers selon l’angle) :

- `cube` : min/max autour de `(28.1, foot+0.45, 34.8)` → `(28.1, foot+2.45, 34.8)` en Y, ±1 m en XZ.
- `marble` : ±0.8 m X, ±0.3 m Z, Y `foot+0.55` … `foot+6.95`.
- `portal` : span piliers X ~`10.4`…`13.4`, Z ~`−5.6`…`−3.0`, Y `foot`…`foot+23.5`.
- `portal_slit` : bande étroite autour de la fente, Y milieu du portail.
- `scene_envelope` / `terrain_zone` : plans d’établissement seulement.

## Contrat JSON — une étape

```json
{
  "u": 0.0,
  "position": { "x": 0, "y": 0, "z": 0 },
  "lookAt": { "x": 0, "y": 0, "z": 0 },
  "heightMode": "drone",
  "cinematic": {
    "subjectId": "cube",
    "secondarySubjectId": "marble",
    "shotSize": "WS",
    "angle": "low",
    "intent": "establish",
    "movement": "static",
    "framing": "center",
    "focus": "deep",
    "lensFov": 26
  }
}
```

- `u` ∈ [0, 1] sur le travelling global.
- `position` / `lookAt` : monde, **cohérents avec le sol local** (pas de Y caméra « décoratif » sans pied).
- `heightMode` : `"drone"` sauf finale piliers à hauteur homme → `"human"`.
- `cinematic.subjectId` : sujet principal ; `lookAt` doit cadrer ce volume (ou milieu si deux sujets).
- Distances indicatives : distance caméra ≈ `k(shotSize) × hauteur_sujet` (cube ~2 m → WS ~18 m max, pas 32 m+).

### `shotSize` (StudioBinder)

`EST`, `EWS`, `ELS`, `WS`, `LS`, `FS`, `MWS`, `MLS`, `CS`, `MS`, `MCU`, `CU`, `ECU`.

### `angle`

`ground`, `knee`, `low`, `hip`, `shoulder`, `eye_level`, `high`, `aerial`, `birds_eye`, `dutch`.

## Interdit

- `lookAt` dans le ciel vide ou loin de tout AABB du `subjectId`.
- Plans WS/EWS à **30 m+** sur le **cube** (2 m).
- Ignorer `footY` : pour drone bas, Y caméra peut être `foot + 1.7` ; pas de règle « toujours +12 m ».
- Mélanger les trois actes en une seule réponse.

## Demande de travail (une scène à la fois)

1. **Acte cube** — 4–7 keyframes, `subjectId: "cube"`, rythme Villeneuve (lent, contre-plongée, silence).
2. **Acte marbre** — 4–7 keyframes, `subjectId: "marble"`.
3. **Acte portail / piliers** — 4–7 keyframes, `portal` puis `portal_slit` ; **finale** : `heightMode: "human"`, `angle: "eye_level"` ou `low`, regard entre les deux piliers.

Pour chaque acte : sortie **JSON seulement** — tableau `[{ ... }, ...]` prêt à fusionner dans `LANDING_CAMERA_KEYFRAMES`.

## Cadrage de référence (code)

Les bounds et la pose auto sont dans `layout/landingSubjectBounds.ts` (`landingSubjectBounds`, `cameraPoseForShotBeat`, `frameCameraForBeat`). Keyframes live : `camera/landingCameraKeyframes.ts`. Utilise les mêmes chiffres que ce document.
