# Restaurer uniquement ton profil archétype (1 user) depuis un backup Supabase

Supabase **ne permet pas** de restaurer une table ou un user sur la prod en un clic. La méthode sûre :

1. Restaurer le backup dans un **projet / branche temporaire** (pas la prod).
2. **Exporter** les lignes de ce user sur les tables archétype.
3. Sur la **prod** : supprimer les mauvaises données archétype de ce user.
4. **Réimporter** les lignes exportées.

---

## Étape 0 — Ton `user_id`

Dans **prod** (SQL Editor) :

```sql
SELECT id, email FROM auth.users
WHERE email ILIKE '%humancatalystnote%';  -- adapte l’email
```

Note l’`id` → `YOUR_USER_ID` ci-dessous.

---

## Tables à restaurer (archétype uniquement)

| Table | Filtrer par |
|-------|-------------|
| `assessment_sessions` | `user_id` |
| `assessment_responses` | `session_id` IN (sessions du user) |
| `archetype_scores` | `user_id` ou `session_id` |
| `analysis_results` | `user_id` |
| `recommendation_tools` | `user_id` |
| `deepdive_responses` | `user_id` |
| `archetype_profile_snapshots` | `user_id` |

**Ne pas toucher** : `profiles`, `mood_entries`, `habits`, `journal`, Pulse, etc.

---

## Étape 1 — Backup → environnement temporaire

Dans le dashboard Supabase :

- **Database → Backups** → restore vers un **nouveau projet** ou une **branch** de dev  
  (jamais « restore in place » sur prod si tu veux garder le reste des users).

Ouvre le **SQL Editor** de ce projet **restauré** (pas prod).

---

## Étape 2 — Vérifier que ton vrai profil est dans le backup

Sur le projet **restauré** :

```sql
-- Snapshots (souvent la meilleure preuve)
SELECT snapshot_version, computed_at, trigger_event, top_archetypes
FROM archetype_profile_snapshots
WHERE user_id = 'YOUR_USER_ID'
ORDER BY computed_at;

-- Sessions soumises
SELECT id, status, submitted_at, client_meta
FROM assessment_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY submitted_at DESC;

-- Deep Dive 70Q
SELECT COUNT(*) AS deepdive_rows
FROM deepdive_responses
WHERE user_id = 'YOUR_USER_ID';
```

Tu cherches une triade **mystic / sage / healer** dans `top_archetypes` ou les scores.

---

## Étape 3 — Export depuis le backup (restauré)

### Option A — Supabase Table Editor

Pour chaque table listée plus haut : filtre `user_id = YOUR_USER_ID` → **Export CSV**.

Pour `assessment_responses` : exporte avec une requête (pas de colonne `user_id` directe) :

```sql
SELECT r.*
FROM assessment_responses r
JOIN assessment_sessions s ON s.id = r.session_id
WHERE s.user_id = 'YOUR_USER_ID';
```

### Option B — SQL (copier le JSON)

```sql
SELECT jsonb_agg(t) FROM (
  SELECT * FROM archetype_profile_snapshots WHERE user_id = 'YOUR_USER_ID'
) t;
```

Répète pour chaque table (ou utilise `pg_dump` ciblé si tu as accès CLI).

---

## Étape 4 — Nettoyer la prod (ce user, archétype seulement)

**Sur la prod**, exécute dans cet ordre (remplace `YOUR_USER_ID`) :

```sql
BEGIN;

-- IDs de sessions actuelles (polluées)
CREATE TEMP TABLE _sessions_to_wipe AS
SELECT id FROM assessment_sessions WHERE user_id = 'YOUR_USER_ID';

DELETE FROM assessment_responses
WHERE session_id IN (SELECT id FROM _sessions_to_wipe);

DELETE FROM recommendation_tools
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _sessions_to_wipe);

DELETE FROM archetype_scores
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _sessions_to_wipe);

DELETE FROM analysis_results
WHERE user_id = 'YOUR_USER_ID'
   OR session_id IN (SELECT id FROM _sessions_to_wipe);

DELETE FROM assessment_sessions WHERE user_id = 'YOUR_USER_ID';

DELETE FROM deepdive_responses WHERE user_id = 'YOUR_USER_ID';

DELETE FROM archetype_profile_snapshots WHERE user_id = 'YOUR_USER_ID';

COMMIT;
```

Vérifie :

```sql
SELECT COUNT(*) FROM assessment_sessions WHERE user_id = 'YOUR_USER_ID';
SELECT COUNT(*) FROM archetype_profile_snapshots WHERE user_id = 'YOUR_USER_ID';
-- les deux doivent être 0 avant import
```

---

## Étape 5 — Réimporter sur la prod

Ordre **obligatoire** (clés étrangères) :

1. `assessment_sessions`
2. `assessment_responses`
3. `archetype_scores`
4. `analysis_results`
5. `recommendation_tools`
6. `deepdive_responses`
7. `archetype_profile_snapshots`

### Table Editor

Import CSV table par table dans cet ordre.

### SQL (si tu as gardé les mêmes `id` UUID du backup)

Exemple pour snapshots (adapte les colonnes à ton export) :

```sql
INSERT INTO archetype_profile_snapshots (
  id, user_id, session_id, snapshot_version, trigger_event,
  top_archetypes, all_scores, shadow_scores, dimension_scores,
  dominant_body, active_principle, admin_notes, computed_at, email
)
VALUES (...);  -- une ligne par snapshot exportée
```

**Important** : garde les **mêmes `id`** de session du backup pour que `session_id` dans snapshots/scores reste cohérent.

---

## Étape 6 — Vérification prod

```sql
SELECT top_archetypes FROM analysis_results
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 1;

SELECT snapshot_version, top_archetypes
FROM archetype_profile_snapshots
WHERE user_id = 'YOUR_USER_ID'
ORDER BY computed_at DESC LIMIT 3;
```

Puis dans l’app : **Persona** ou **Deep Dive** → tu dois voir **Mystic / Sage / Healer**.

---

## Si tu n’as qu’un dump `.sql` / `.backup`

1. Restaure le dump dans une base **locale** ou Docker Postgres.
2. Exécute les `SELECT` / `COPY` de l’étape 2–3 contre cette base.
3. Importe les CSV sur prod (étape 5).

CLI (exemple, connexion sur DB restaurée) :

```bash
pg_dump "$BACKUP_DATABASE_URL" \
  --data-only \
  --table=assessment_sessions \
  --table=archetype_scores \
  --table=analysis_results \
  --table=assessment_responses \
  --table=recommendation_tools \
  --table=deepdive_responses \
  --table=archetype_profile_snapshots \
  -f archetype_tables_data.sql
```

Ensuite édite le fichier pour ne garder que les `INSERT` de `YOUR_USER_ID` (ou restaure dans Postgres temporaire et filtre avec SQL).

---

## Minimum viable (souvent suffisant)

Si le backup a encore un bon snapshot **Mystic / Sage / Healer** :

1. Exporte **uniquement** `archetype_profile_snapshots` pour ton user.
2. Nettoie prod (étape 4, au moins snapshots + sessions + scores + analysis).
3. Réimporte le snapshot + recrée une session via l’app **Admin → Guest Preview → Restaurer cette version**  
   **ou** importe aussi `assessment_sessions` + `archetype_scores` + `analysis_results` du même instant dans le backup.

---

## Restauration directe (export 2026-05-14 déjà en main)

Si tu as l’export admin avec `userId: 25d80046-d3f4-43f2-933a-ade961f20e28` et session `358f48a3-6efd-47ab-80b7-f8f9dc8303f9` :

→ exécute **`scripts/restore-user-25d80046-mystic-sage-healer.sql`** sur la **prod** (SQL Editor).

Ce script :
- efface les données archétype polluées de ce user ;
- recrée la session du 28 avril 2026 ;
- réinjecte les **30 réponses** de l’export ;
- pose les scores **70Q** (Mystic / Sage / Healer — pas le tableau 30Q où healer=0) ;
- crée `analysis_results` + un `archetype_profile_snapshot`.

Puis recharge **Persona**.

---

## Support

Envoie (depuis le projet **restauré**, pas prod) :

- résultat de la requête `archetype_profile_snapshots` (étape 2)
- nombre de lignes `deepdive_responses`

On pourra dire si le backup contient bien Mystic/Sage/Healer avant d’importer en prod.
