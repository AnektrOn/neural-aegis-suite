# Assets prism-landing — ambiance **désolation / wasteland**

Direction validée : **Windswept Wasteland** pour le sol (sec, venté, vide). Pas de rive mouillée — c’était une fausse piste.

Ce doc = ce que la landing utilise, **quoi télécharger ensuite** sur Fab, et ce qu’on peut ignorer.

---

## Comment lire une scène (couches du film)

De l’arrière vers la caméra — chaque couche peut être **code** ou **asset Fab** :

| Couche | Rôle visuel | Chez toi aujourd’hui |
|--------|-------------|----------------------|
| 1. Ciel + brume | Vide, horizon perdu, pas de soleil joyeux | **Code** (fog, grade, atmosphère) |
| 2. Sol | Immensité, grain sous les pieds | **Fab** ✓ `windswept-wasteland-ue` |
| 3. Débris au sol | Casser la plane, échelle, désolation | **Code** (petits cailloux procéduraux) → **Fab 3D** recommandé |
| 4. Structures héros | Cube, marbre, portail | **Code** (géométrie + textures procédurales) |
| 5. Lumière fente orange | Mystère, contraste | **Code** (émissif + bloom) |
| 6. Silhouette humaine | Échelle (plus tard) | Retiré (mode POV supprimé) |

Tu n’as pas besoin d’un « pack environnement complet ». Tu complètes **couche par couche**.

---

## Quelle route utilise quoi ?

| Route | Scène |
|-------|--------|
| `/dev/prism-landing` | Landing travelling (**référence**) |
| `/dev/prism-landing-opt` | Idem + perf |

---

## Déjà en place

| Élément | Où |
|---------|-----|
| Sol wasteland PBR | `textures/shore/windswept-wasteland-ue/` (`_albedo`, `_roughness`, `_normal-dx`, `_height`) |
| HDRI crépusculaire (IBL option) | `hdri/moonless_golf_1k.hdr` — [Poly Haven CC0](https://polyhaven.com/a/moonless_golf) |
| LUT ciné (option grade) | `lut/F-6800-STD.cube` si présent ; sinon LUT procédurale (`landingLutLoader.ts`) |
| Eau / reflets (legacy) | `waternormals.jpeg` + plan eau — à **retirer ou réduire** quand on passera 100 % sec |
| Cube / marbre / portail | Code (`shatteredCubeAssets`, `marbleMonolithAssets`, monolithes) |
| Fonts | `fonts/Cinzel_SemiBold.json` |

---

## Fab : les catégories (rappel)

| Catégorie Fab | En français | Tu en as besoin ? |
|---------------|-------------|-------------------|
| **Materials** | Papier peint **répétable** (sol, béton, pierre) | Sol ✓ ; béton / marbre **option** |
| **3D** | Objet avec mesh (rocher, ruine) | **Prochaine priorité** (rochers) |
| **Textures** | Souvent = même chose que Materials | Compris via Materials |
| **Decals** | Tache à coller (fissure, poussière) | Plus tard, pas prioritaire |
| **Brushes** | Sculpture ZBrush, etc. | **Jamais** pour cette landing web |

---

## Roadmap téléchargements (ordre conseillé)

### Étape A — Sol ✅ FAIT

- **Materials** → *Windswept Wasteland* (ou équivalent désert sec).
- Dossier : `textures/shore/...` (sous-dossier OK).

Rien d’autre à acheter pour le sol tant que tu es satisfait de ce look.

---

### Étape B — Rochers désert (en pause)

GLB dans `gltf/Rocks/` conservés sur disque ; **chargement désactivé** (perf + placement). On reprendra plus tard avec moins d’instances et des zones dédiées.

### Étape C — Bloc marbre : **2 calques** (comme Photoshop)

Une seule texture « marbre orange tout-en-un » ne suffit pas : il faut **deux jeux de maps** que le moteur mélange.

| Calque | Rôle | Ce que tu vois |
|--------|------|----------------|
| **1 — Base** | Pierre brute (obsidienne / marbre noir **sans** grosses veines) | Matière sombre, grain, roughness |
| **2 — Veines** | Dessin des nervures **à part** | Lignes orange/doré + **masque** pour l’émission (glow indépendant) |

**Dossiers proposés :**

```
textures/marble/base/     ← calque 1 (albedo, roughness, normal)
textures/marble/veins/    ← calque 2 (couleur veines + mask émissif, voir ci-dessous)
```

#### Calque 1 — Base (Fab → **Materials**)

- Mots-clés : `obsidian`, `black marble`, `dark granite`, `basalt`, `polished black stone`
- Choisis une preview **uniformément sombre**, veines **discrètes ou absentes**
- Télécharge : **Albedo**, **Roughness**, **Normal** (1K–2K PNG)

#### Calque 2 — Veines (souvent **pas** le même produit que la base)

Fab ne vend pas toujours « layer veines ». Trois stratégies :

| Stratégie | Où sur Fab | Mots-clés |
|-----------|------------|-----------|
| **A — Decals / alphas** | **Decals** ou **Textures** | `crack`, `vein`, `marble vein`, `lightning crack`, `gold crack alpha` |
| **B — Pack marbre veiné** | **Materials** | Tu utilises l’**albedo** seulement comme **calque veines** + tu génères un **mask** (blanc = veine) ; la base reste le calque 1 |
| **C — Orange Streaks** | Ignoré par le code | Veines = **asphalt crack** `*_B-O.png` uniquement |

**Maps idéales pour le calque 2 :**

- `veinColor` (ou albedo des veines sur fond noir) — PNG  
- `veinMask` — **noir + blanc** : blanc = nervure (émission + teinte)  
  Si Fab ne donne pas de mask : on le dérive du calque 2 en code, mais un **vrai mask** (Photoshop / Substance) donne un meilleur contrôle.

**Emissive :** pas un fichier Fab obligatoire — le **mask** × couleur orange × intensité dans Three.js (slider comme en procédural).

Prochaine étape **code** : shader / material à 2 textures (base + veines), pas un seul `map` Megascans.

---

### Étape D — Béton des **piliers portail** (optionnel, plus tard)

Murs massifs type brutaliste : **Materials** → `weathered concrete`, `limestone wall`, `aged plaster`.

Un seul set tileable suffit. Dossier proposé :

```
textures/monolith/
```

Le portail peut rester en procédural longtemps si la lumière orange porte déjà le plan.

---

---

## Ce qu’il ne faut **pas** chercher

- Packs « full desert environment » énormes (arbres, oasis, ciel HDRI lourd).
- Herbe, buissons, neige, eau, lac.
- Montagne GLB comme `snowy-mountain-terrain` (hors sujet wasteland plat).
- Decals / brushes tant que le sol et les rochers ne sont pas réglés.

---

## Nettoyage disque (oct. 2026)

**Supprimé du repo** (non référencé par le code ou mode retiré) :

- Archives Megascans : `textures/Marble_Orange_Streaks_1k_8b_2VYvtej.zip`, `textures/Marble_Orange_Streaks_2k_16b_RESwd1n.zip`, `textures/marble/asphalt_crack_umegahkcw_2k_ue_mid.zip`, `textures/marble/Gun_Metal_2k_8b.zip`
- Personnage / locomotion : dossier `assets/character/`, FBX/GLB humanoïdes (`gltf/*.fbx`, `cartoon_young_boy_glb.zip`, `human_body_base_cartoon*`)
- Scènes hors sujet : `gltf/snowy-mountain-terrain.glb`, `gltf/prism_from_another_world.glb`, `gltf/halo_hunter_shield*.glb`, `prime-landing-v2/`
- Lens flare (non branché) : `textures/lensflare/`
- Font orpheline : `fonts/Inter_Bold.json`

**À garder :** `waternormals.jpeg`, `fonts/Cinzel_SemiBold.json`, `shore/windswept-*` (glob PBR), `textures/marble/**/*.png` (glob marbre), `gltf/Rocks/*.glb` (glob rochers).

---

## Résumé

1. **Sol wasteland** → fait.  
2. **Maintenant** → Fab **3D** → 4–8 rochers désert → `assets/gltf/rocks/`.  
3. **Ensuite** → marbre PBR (fichiers déjà là) ou béton monolithe (1 Material).  
4. **Code à prévoir** → moins d’eau / moins d’« humidité » shader pour coller au sec (dis-le quand tu veux qu’on le fasse).
