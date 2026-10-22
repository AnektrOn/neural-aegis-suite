# Landing Prism — post-production drone (référence)

Synthèse et mapping pour le travelling aerial **3D temps réel** (`/dev/prism-landing`).  
Inspiré de [AAI Drones — *Elevating Aerial Narratives: Post-Production Mastery for Drone Footage*](https://aai-drones.com/) (blog, 2025).  
Complète la [bible cinéma shot list](./LANDING_CINEMATIC_BIBLE.md) (StudioBinder).

Types exportables : `landingDronePostContract.ts` → champ `post` sur chaque keyframe (`cinematic.post`).

---

## 1. Avant montage (pre-edit)

| Thème article | Pratique drone réel | Équivalent landing |
|---------------|---------------------|-------------------|
| Import / organisation | Dossiers par lieu, type de plan, heure | `LANDING_CAMERA_KEYFRAMES`, shot list `landingDefaultShotList.ts`, export JSON |
| Réglages caméra | 24/30 fps ciné, 60/120 slow-mo, D-Log / D-Cinelike, ND | `heightMode: drone`, profil couleur via tuning + pipeline monolithe |
| Stockage 4K+ | Disques, proxies | Scène WebGL : pas de proxies ; figer les keyframes en repo |

**Recommandation landing :** nommer chaque étape (sujet + shot size + `post.profile`) avant de peaufiner position/lookAt.

---

## 2. Techniques cœur (core edit)

### Stabilisation (shake, jello)

- **Article :** Warp Stabilizer, Gyroflow, gimbal, vol fluide, shutter, props équilibrées.
- **Landing :** path lissé par segments ; pas de vibration caméra en mode Play path ; éviter les à-coups en n’éditant que sur **étapes** verrouillées puis interpolation.

### Correction & étalonnage couleur

- **Article :** balance des blancs, exposition, contraste → grade créatif, LUT, teal/orange.
- **Landing :** panneau **Intensité** / réglages (`landingRenderTuning.ts`), fog, vignette, bloom, grade ACES sur le renderer.

### Crop / zoom / reframe

- **Article :** retirer hélices, reframer, Ken Burns ; ne pas sur-cropper sous 4K.
- **Landing :** FOV, distance caméra ↔ sujet (`SHOT_SIZE_SUGGESTED_DISTANCE_M`), cadrage lookAt.

### Speed ramps & reverse

- **Article :** accélérations, ralentis, marche arrière plus stable.
- **Landing :** durée totale `CAMERA_PATH_PLAY_DURATION` (78 s) ; `speed` dans métadonnées `post` ; easing par segment = évolution future.

### Letterboxing (2.39:1)

- **Article :** bandes noires = look cinéma, masquer bords.
- **Landing :** à activer en CSS sur le canvas si besoin ; noter `frame: letterbox_239` sur les plans EWS/épilogue.

---

## 3. Storytelling avancé

| Technique | Article | Landing |
|-----------|---------|---------|
| Motion tracking + VFX | Texte / CGI attachés au plan | Godrays, brume, poussière, glow portail |
| Transitions | Whip, dissolve, match cut | `transitionOut` sur keyframe ; cuts entre u en montage externe |
| Sound design | Pas d’audio drone utile ; ambiances, SFX, musique | `soundLayers[]` sur export JSON (piste à produire hors WebGL) |

### Son (checklist)

1. **Diégétique :** vent, eau, ville lointaine — volume selon altitude / proximité sujet.  
2. **Non-diégétique :** whoosh sur accélérations, drones harmoniques.  
3. **Musique :** couper sur les ancres `u` (11 beats narratifs).  
4. **Équilibre :** peu de couches, volumes cohérents.

---

## 4. Logiciels & workflow (référence externe)

Pour **export montage** (hors moteur 3D) :

- Premiere + After Effects (stabilisation, MOGRT, VFX)
- DaVinci Resolve (étalonnage, Fusion)
- Final Cut Pro (ProRes RAW DJI, etc.)

**Workflow Prism recommandé :**

1. Régler travelling in-engine (layout + path + shot list).  
2. Exporter captures / vidéo si besoin.  
3. Appliquer stabilisation logicielle seulement sur prises live drone **réelles** ; pour la scène 3D, privilégier path propre.  
4. Grade final en Resolve ou via tuning landing selon livrable.

---

## 5. Profils post (`DronePostProfileId`)

| ID | Usage |
|----|--------|
| `neutral` | Preview technique |
| `cinematic_log_grade` | Look film, flat → grade |
| `event_punchy` | Dynamique, coupes courtes |
| `slow_reveal` | Ouvertures lentes, MS/EWS |
| `epic_wide` | EWS + letterbox + atmosphère |

Mapping code : `DRONE_POST_PROFILE_LABELS` et `LANDING_POST_TOOL_MAP` dans `landingDronePostContract.ts`.

---

## 6. Lien shot list ↔ post

Sur chaque keyframe (éditeur layout) :

```json
{
  "u": 0,
  "position": { ... },
  "lookAt": { ... },
  "cinematic": {
    "subjectId": "scene_envelope",
    "shotSize": "EWS",
    "post": {
      "profile": "epic_wide",
      "stabilization": "software_smooth",
      "color": "creative_grade",
      "soundLayers": ["ambient_diegetic", "music_sync"]
    }
  }
}
```

Mettre à jour `LANDING_ANCHOR_SHOT_LIST` et `LANDING_CAMERA_KEYFRAMES` après validation régie.

## Voir aussi

Mouvements de vol (orbit, dronie, cable cam, rocket, tilt reveal) : **[`LANDING_DRONE_CINEMATIC_MOVES.md`](./LANDING_DRONE_CINEMATIC_MOVES.md)**.
