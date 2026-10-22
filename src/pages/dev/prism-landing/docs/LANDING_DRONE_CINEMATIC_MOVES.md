# Landing Prism — mouvements ciné drone (pilotage)

Référence : [Adorama — *Cinematic Drone Shots That Make Your Videos Look Pro*](https://www.adorama.com/) (Mujahid Ur Rehman « Muji », déc. 2025).  
Complète : [bible shot list](./LANDING_CINEMATIC_BIBLE.md) · [post-production](./LANDING_DRONE_POSTPRODUCTION.md).

Types : `landingDroneMovesContract.ts` · champ `cinematic.droneMove` sur chaque keyframe (export path JSON).

---

## Fondation : Cine Mode

Avant tout mouvement : **mode Cine / Tripod / Cinematic** — accélération et freinage progressifs, pas de corrections brusques.

| Landing 3D | Équivalent |
|------------|------------|
| Travelling Play | Path lissé, durée `CAMERA_PATH_PLAY_DURATION` |
| Édition layout | Étapes + interpolation `u` par segment |
| Orbit manuel | Hors path ; damping OrbitControls |

Détail code : `LANDING_CINE_MODE_EQUIVALENT` dans `landingDroneMovesContract.ts`.

---

## Manette (référence)

| Stick | Axe | Canal | Fonction |
|-------|-----|-------|----------|
| Gauche | Haut/Bas | Throttle | Vertical |
| Gauche | G/D | Yaw | Rotation |
| Droite | Haut/Bas | Pitch | Avancer / reculer |
| Droite | G/D | Roll | Latéral |

---

## Les 5+ mouvements (tag `droneMove`)

### 1. Orbit — circle of discovery

- **Gestes :** yaw + roll synchronisés, caméra lockée sur le sujet.
- **Story :** contexte 360°, sujet vs environnement.
- **Landing :** arc de positions autour du `lookAt` (cube, marbre, portail).

### 2. Dronie — grand reveal

- **Gestes :** throttle ↑ + pitch back (recul + montée).
- **Story :** intimité → échelle du paysage.
- **Pro tip :** pause 2–3 s près du sujet avant le pullback.
- **Landing :** ouverture / clôture `scene_envelope` (Y haut + distance).

### 3. Cable cam — straight track

- **Gestes :** roll (ou pitch) constant, gimbal fixe.
- **Story :** ligne droite, route / rivière / côte.
- **Landing :** segments colinéaires (ex. traversée cube → marbre).

### 4. Rocket — vertical climb

- **Gestes :** throttle ↑, gimbal 30–45° ou 90°.
- **Story :** énergie, hauteur rapide.
- **Pro tip :** speed ramp en post (voir AAI doc).
- **Landing :** même XZ, Y croissant.

### 5. Tilt reveal — look-up push-in

- **Gestes :** pitch forward + gimbal tilt up (continu).
- **Story :** entrer dans le paysage, révéler l’horizon.
- **Pro tip :** ne pas interrompre le tilt.
- **Landing :** avancer + monter le point `lookAt` sur le segment.

---

## Conclusion article (Muji)

- Pratique manuelle > modes auto pour le style.
- Montage + **SFX + musique** pour l’immersion (voir `post.soundLayers`).
- Enchaîner mouvements délibérés ; tagger chaque segment dans la shot list.

---

## Shot list landing (ancres suggérées)

| u (ancre) | `droneMove` suggéré |
|-----------|---------------------|
| 0 | `dronie` |
| 0.081–0.181 | `rocket` / descente |
| 0.258 | `orbit` (cube) |
| 0.389–0.504 | `cable_cam` |
| 0.682 | `orbit` ou pan |
| 0.774 | `tilt_reveal` (portail) |
| 1 | `dronie` ou `rocket` (épilogue) |

À affiner dans `landingDefaultShotList.ts` et l’éditeur `/dev/prism-layout`.
