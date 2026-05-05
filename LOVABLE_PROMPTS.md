# Lovable Prompt Pack (SQL + Database)

Ce fichier contient les prompts a copier-coller dans Lovable pour piloter la suite DB/SQL.

## Instruction a donner a Lovable

Utilise cette phrase:

`Lis le fichier LOVABLE_PROMPTS.md du repo, puis execute les prompts dans l'ordre, un par un, en me montrant le SQL genere et les points de verification.`

## Prompt 1 - Analyse schema existant

```text
Contexte:
Je suis sur Supabase/Postgres.
J’ai deja les tables suivantes:
- toolbox_assignments (avec content_type, external_url, widget_config)
- habit_templates
- assigned_habits
- journal_prompts
- library_videos
- library_video_assignments
- user_roles + function has_role(auth.uid(), 'admin')

Objectif:
Produis un diagnostic SQL de compatibilite pour un modele Catalog + Assignments unifie.
Je veux:
1) Les collisions de concepts entre toolbox external_link et library_videos
2) Les colonnes manquantes pour lier templates -> assignments
3) Les index/policies manquants
4) Un plan de migration sans downtime

Sortie attendue:
- Une checklist detaillee
- Puis un script SQL de verification (SELECT only, no mutation)
```

## Prompt 2 - Creer catalog video unifie

```text
Ecris une migration SQL Supabase idempotente qui:
1) Cree `video_templates` (catalog)
   - id uuid pk default gen_random_uuid()
   - external_key text unique nullable
   - title text not null
   - description text
   - external_url text not null
   - provider text not null default 'google_drive'
   - drive_file_id text
   - meta jsonb not null default '{}'
   - library_scope text check in ('global_fr','global_en','perso')
   - archetype_targets text[] not null default '{}'
   - shadow_targets text[] not null default '{}'
   - is_active boolean not null default true
   - created_by uuid not null references auth.users(id)
   - created_at timestamptz default now()
   - updated_at timestamptz default now()

2) Cree `video_assignments`
   - id uuid pk default gen_random_uuid()
   - video_template_id uuid not null references video_templates(id) on delete cascade
   - user_id uuid not null references auth.users(id) on delete cascade
   - assigned_by uuid not null references auth.users(id)
   - assigned_at timestamptz default now()
   - status text not null default 'assigned' check in ('assigned','in_progress','completed','abandoned','ignored')
   - completed_at timestamptz null
   - unique(video_template_id, user_id)

3) Ajoute indexes utiles (scope, active, user_id, status, assigned_at desc)

4) Ajoute triggers updated_at via public.update_updated_at_column()

5) Active RLS + policies:
   - admin manage all
   - user read own assignments
   - user read templates only if assigned OR is_active (selon scope)

Contrainte:
- Script entierement idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE POLICY)
- Compatible Supabase
```

## Prompt 3 - Bridge legacy toolbox external_link vers video

```text
Ecris une migration SQL idempotente qui:
1) Ajoute colonne nullable `video_assignment_id` dans toolbox_assignments (fk -> video_assignments.id on delete set null)
2) Cree une vue `v_legacy_toolbox_external_link` listant les toolbox_assignments content_type='external_link'
3) Cree une fonction SQL `backfill_video_from_toolbox_external_link()` qui:
   - lit les external_link legacy
   - cree/merge des video_templates si absents (match par external_url + scope)
   - cree les video_assignments correspondants
   - met a jour toolbox_assignments.video_assignment_id
4) Retourne un rapport (nb templates crees, assignments crees, lignes mappees)

Contrainte:
- Aucun delete
- Re-runnable sans doublons
```

## Prompt 4 - Unifier bibliotheque user

```text
Ecris une vue SQL `v_user_video_library` qui retourne pour chaque user:
- source ('catalog_video' ou 'legacy_toolbox')
- video_id / assignment_id
- title
- external_url
- library_scope
- assigned_at
- status
- duration_label (depuis meta si dispo)
- dedupe_key (normalise pour youtube/drive)

La vue doit:
- privilegier les lignes catalog_video
- garder legacy seulement si pas de match dedupe_key
- etre triable par assigned_at desc
```

## Prompt 5 - Suggestions archetypes pour video

```text
Ecris une fonction SQL `get_video_suggestions_for_user(p_user_id uuid, p_limit int default 20)` qui:
1) lit top_archetypes + shadow_signals depuis analysis_results le plus recent
2) score chaque video_template actif:
   - match archetype_targets => score decroissant selon rang
   - match shadow_targets => bonus selon intensite
3) retourne:
   - video_template_id
   - title
   - score
   - reason_text
4) n’assigne rien (suggestion only)

Contrainte:
- Pure SELECT logic, pas d’insert/update
```

## Prompt 6 - KPI vues materialisees

```text
Ecris SQL pour:
1) vue `v_program_kpi_daily` avec:
   - date
   - toolbox_assigned
   - toolbox_completed
   - routines_assigned
   - routines_completed
   - journal_assigned
   - journal_completed
   - videos_assigned
   - videos_completed
2) vue `v_program_kpi_rate` avec:
   - completion_rate_toolbox
   - adherence_rate_routines
   - completion_rate_journal
   - completion_rate_videos
3) index pour refresh performant
4) script refresh (materialized views si pertinent)
```

## Prompt 7 - Audit/observabilite robuste

```text
Ecris migration SQL idempotente pour table `program_events` amelioree:
- id uuid pk
- actor_id uuid not null
- user_id uuid null
- entity_type text not null
- entity_id uuid null
- event_type text not null
- metadata jsonb default '{}'
- created_at timestamptz default now()

+ table `admin_import_runs`:
- id uuid pk
- created_by uuid not null
- dry_run boolean not null default false
- status text not null default 'completed'
- payload jsonb not null default '{}'
- summary jsonb not null default '{}'
- created_at timestamptz default now()

+ RLS admin read/insert, indexes by created_at/user.
```

## Prompt 8 - Contraintes qualite des donnees

```text
Ecris SQL ajoutant:
1) check constraints:
   - external_url format minimal (http/https)
   - status valide sur assignments
   - content_type whitelist toolbox
2) unique constraints business:
   - external_key unique par table template
   - dedupe video par (drive_file_id, library_scope) si drive_file_id non null
3) partial indexes pour filtres frequents (is_active=true, status='assigned')
4) requetes de detection anomalies (orphan rows, urls nulles, status invalides)
```

## Prompt 9 - Script de seed de demonstration

```text
Produis SQL de seed (idempotent) qui cree:
- 5 routines templates
- 8 toolbox templates
- 6 journal templates
- 6 video templates
- tags archetype/shadow realistes
- assignations a 2 users test (UUID placeholders)
- evenements d’audit correspondants

Contrainte:
- Utiliser UPSERT/ON CONFLICT
- Aucun hard-delete
```

## Prompt 10 - Runbook migration production

```text
Genere un runbook SQL + ops en 3 phases:
Phase A: preflight checks
Phase B: apply migrations (ordre exact)
Phase C: post-check + rollback strategy

Je veux:
- commandes SQL exactes
- checks de volumetrie avant/apres
- checks RLS
- rollback pragmatique sans perte de donnees
- criteres GO/NO-GO
```
