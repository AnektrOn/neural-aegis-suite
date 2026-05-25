# Pulse Content Sync

Pipeline pour creer et gerer les cartes Pulse depuis un vault Obsidian **ou un fichier JSON**, puis les synchroniser vers Supabase via des migrations SQL.

Deux formats d'import supportes :
- **Obsidian (.md)** — ideal pour la redaction de contenu dans un vault
- **JSON (.json)** — ideal pour le batch import, les exports d'outils IA, ou l'integration API

## Structure du vault Obsidian

```
AEGIS-Pulse/                      ← ton vault (ou dossier dans un vault existant)
├── _templates/
│   └── pulse-card-template.md    ← template Obsidian (Templater compatible)
├── MENTALISM/
│   ├── 001-le-filtre-de-la-realite.md
│   └── 002-le-pouvoir-de-lintention.md
├── CORRESPONDENCE/
│   └── 001-miroir-interieur.md
├── VIBRATION/
│   └── ...
├── POLARITY/
├── RHYTHM/
├── CAUSE_EFFECT/
└── GENDER/
```

Les sous-dossiers par principe sont **optionnels** (le principe vient du frontmatter, pas du dossier). Mais c'est recommande pour l'organisation.

## Format d'une carte

Chaque fichier `.md` = 1 carte Pulse, avec 2 parties :

### 1. Frontmatter YAML (metadonnees + contenu court)

```yaml
---
external_key: pulse_mentalism_001      # Identifiant unique, jamais modifier apres deploy
principle: MENTALISM                    # MENTALISM | CORRESPONDENCE | VIBRATION | POLARITY | RHYTHM | CAUSE_EFFECT | GENDER
sort_order: 1                          # Ordre d'affichage dans le deck
time_label: "2 MIN"                    # Duree estimee affichee sur la carte
is_active: true                        # false = carte masquee (draft)
archetype_targets:                     # Archetypes cibles (vide = carte universelle)
  - sage
  - mystic
title:
  fr: "Le Filtre de la Realite"
  en: "The Reality Filter"
format:
  fr: "MICRO-CONCEPT"                  # Type de contenu: MICRO-CONCEPT, HACK MENTAL, DEFI EXPRESS, etc.
  en: "MICRO-CONCEPT"
problem:
  fr: "Pourquoi deux personnes vivent la meme journee..."
  en: "Why do two people live the same day..."
bullets:
  fr:
    - "Point cle 1 en francais."
    - "Point cle 2 en francais."
  en:
    - "Key point 1 in english."
    - "Key point 2 in english."
---
```

### 2. Body Markdown (cours = hook / concept / action)

Le corps du fichier contient les 3 sections du cours, structurees par des titres H1 :

```markdown
# Hook FR
Phrase d'accroche qui capte l'attention. Court et percutant.

# Hook EN
English version of the hook.

# Concept FR
Explication du concept. C'est le coeur de l'enseignement.
Tu peux ecrire plusieurs paragraphes ici.

# Concept EN
English version of the concept explanation.

# Action FR
Exercice pratique concret que l'utilisateur peut appliquer immediatement.

# Action EN
English version of the practical exercise.
```

**Les 6 sections sont obligatoires** (Hook/Concept/Action x FR/EN).

## Convention de nommage

| Element | Convention | Exemple |
|---------|-----------|---------|
| `external_key` | `pulse_{principle}_{slug}` | `pulse_mentalism_filter` |
| Fichier | `{NNN}-{slug}.md` | `001-le-filtre-de-la-realite.md` |
| Dossier | Nom du principe en UPPER | `MENTALISM/` |

**L'`external_key` est l'identifiant unique en base.** Ne jamais le changer apres la premiere synchronisation, sinon la carte sera creee en double et les utilisateurs qui l'ont deja swipee perdront leur historique.

## Format JSON

Alternative a Obsidian. Un fichier `.json` contenant un tableau de cartes (ou `{ "cards": [...] }`) :

```json
[
  {
    "external_key": "pulse_mentalism_001",
    "principle": "MENTALISM",
    "sort_order": 1,
    "time_label": "2 MIN",
    "is_active": true,
    "archetype_targets": ["sage", "mystic"],
    "title":   { "fr": "Titre FR", "en": "Title EN" },
    "format":  { "fr": "MICRO-CONCEPT", "en": "MICRO-CONCEPT" },
    "problem": { "fr": "Question FR...", "en": "Question EN..." },
    "bullets": {
      "fr": ["Point 1", "Point 2"],
      "en": ["Point 1", "Point 2"]
    },
    "course_content": {
      "fr": { "hook": "...", "concept": "...", "action": "..." },
      "en": { "hook": "...", "concept": "...", "action": "..." }
    }
  }
]
```

Le `course_content` est inline dans le JSON (pas de sections H1 comme en Obsidian).

Voir `vault-example/cards.json` pour un exemple complet avec les 3 cartes prototype.

## Commandes

### Obsidian vault → preview

```bash
node scripts/pulse-sync/sync-obsidian.mjs ~/Obsidian/AEGIS-Pulse --dry-run
```

### JSON → preview

```bash
node scripts/pulse-sync/sync-obsidian.mjs ./cards.json --dry-run
```

### Generer une migration (auto-detect format)

```bash
# Depuis un vault Obsidian
node scripts/pulse-sync/sync-obsidian.mjs ~/Obsidian/AEGIS-Pulse

# Depuis un JSON
node scripts/pulse-sync/sync-obsidian.mjs ./cards.json
```

### Ecrire dans un fichier specifique

```bash
node scripts/pulse-sync/sync-obsidian.mjs ~/Obsidian/AEGIS-Pulse --out supabase/migrations/20260610120000_pulse_cards_batch2.sql
```

### Forcer un format

```bash
node scripts/pulse-sync/sync-obsidian.mjs ./data --format json   # forcer JSON meme sur un dossier
node scripts/pulse-sync/sync-obsidian.mjs ./file.md --format md   # forcer Obsidian sur un fichier
```

## Comportement UPSERT

Le SQL genere utilise `ON CONFLICT (external_key) DO UPDATE` :

- **Nouvelle carte** (external_key n'existe pas) → `INSERT`
- **Carte existante** (external_key deja en base) → `UPDATE` de tous les champs sauf `id` et `created_at`

Cela permet de **re-synchroniser** le vault entier sans risque de doublons.

## Workflows

### Via Obsidian (redaction manuelle)

```
1. Ouvrir Obsidian
2. Creer une carte avec le template (_templates/pulse-card-template.md)
3. Remplir le frontmatter + les sections Hook/Concept/Action
4. Ajouter les archetype_targets (ou laisser vide = universel)
5. Mettre is_active: false si c'est un brouillon
6. Lancer le sync en dry-run pour verifier
7. Generer la migration SQL
8. Deployer via supabase db push ou supabase migration up
```

### Via JSON (batch / IA / API)

```
1. Preparer un fichier JSON (tableau de cartes)
2. Lancer le sync en dry-run pour valider
3. Generer la migration SQL
4. Deployer
```

## Ciblage par archetype

Chaque carte peut cibler un ou plusieurs archetypes via `archetype_targets`. Le deck RPC utilise cette info pour personaliser la distribution :

| Situation | Comportement |
|-----------|-------------|
| `archetype_targets: []` (vide/absent) | Carte **universelle** : visible par tous les utilisateurs |
| `archetype_targets: [sage, mystic]` | Visible uniquement par les users dont le profil contient `sage` OU `mystic` |
| User sans profil archetype | Ne voit que les cartes universelles |

Les 12 archetypes valides : `sage`, `warrior`, `lover`, `sovereign`, `magician`, `healer`, `creator`, `rebel`, `caregiver`, `explorer`, `mystic`, `jester`.

**Priorite dans le deck** : les cartes qui matchent l'archetype de l'user apparaissent **avant** les cartes universelles.

## Validation

Le script verifie automatiquement :

- Presence de tous les champs frontmatter requis
- Locales FR + EN presentes pour chaque champ i18n
- Principe valide (parmi les 7 Kybalion)
- Archetypes valides dans `archetype_targets` (parmi les 12)
- Les 6 sections de cours presentes dans le body
- Pas de doublons d'`external_key`

Les erreurs sont affichees avec le chemin du fichier concerne.

## Types de format suggeres

| Code FR | Code EN | Usage |
|---------|---------|-------|
| MICRO-CONCEPT | MICRO-CONCEPT | Explication d'un concept fondamental |
| HACK MENTAL | MENTAL HACK | Technique pratique applicable |
| DEFI EXPRESS | EXPRESS CHALLENGE | Defi a realiser dans les 24h |
| MEDITATION | MEDITATION | Exercice de meditation guide |
| PARABOLE | PARABLE | Histoire / metaphore initiatique |
| RITUEL | RITUAL | Pratique a integrer au quotidien |
