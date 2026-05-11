# Lovable Prompt Pack (SQL + Database)

This file contains prompts you can copy/paste into Lovable to drive the DB/SQL workstream.

## Instruction to give Lovable

Use this sentence:

`Read the repo file LOVABLE_PROMPTS.md, then execute the prompts in order, one by one, showing me the generated SQL and the verification checkpoints.`

## Prompt 1 - Analyze existing schema

```text
Context:
I'm using Supabase/Postgres.
I already have the following tables:
- toolbox_assignments (with content_type, external_url, widget_config)
- habit_templates
- assigned_habits
- journal_prompts
- library_videos
- library_video_assignments
- user_roles + function has_role(auth.uid(), 'admin')

Goal:
Produce an SQL compatibility diagnostic for a unified Catalog + Assignments model.
I want:
1) Concept collisions between toolbox external_link and library_videos
2) Missing columns to link templates -> assignments
3) Missing indexes/policies
4) A zero-downtime migration plan

Expected output:
- A detailed checklist
- Then an SQL verification script (SELECT only, no mutations)
```

## Prompt 2 - Create unified video catalog

```text
Write an idempotent Supabase SQL migration that:
1) Creates `video_templates` (catalog)
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

2) Creates `video_assignments`
   - id uuid pk default gen_random_uuid()
   - video_template_id uuid not null references video_templates(id) on delete cascade
   - user_id uuid not null references auth.users(id) on delete cascade
   - assigned_by uuid not null references auth.users(id)
   - assigned_at timestamptz default now()
   - status text not null default 'assigned' check in ('assigned','in_progress','completed','abandoned','ignored')
   - completed_at timestamptz null
   - unique(video_template_id, user_id)

3) Adds useful indexes (scope, active, user_id, status, assigned_at desc)

4) Adds updated_at triggers via public.update_updated_at_column()

5) Enables RLS + policies:
   - admin manage all
   - user read own assignments
   - user read templates only if assigned OR is_active (depending on scope)

Constraints:
- Fully idempotent script (IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE POLICY)
- Supabase compatible
```

## Prompt 3 - Bridge legacy toolbox external_link to video

```text
Write an idempotent SQL migration that:
1) Adds a nullable `video_assignment_id` column in toolbox_assignments (fk -> video_assignments.id on delete set null)
2) Creates a view `v_legacy_toolbox_external_link` listing toolbox_assignments where content_type='external_link'
3) Creates a SQL function `backfill_video_from_toolbox_external_link()` that:
   - reads legacy external_link rows
   - creates/merges video_templates when missing (match by external_url + scope)
   - creates corresponding video_assignments
   - updates toolbox_assignments.video_assignment_id
4) Returns a report (templates created, assignments created, rows mapped)

Constraints:
- No deletes
- Re-runnable without duplicates
```

## Prompt 4 - Unify user library

```text
Write a SQL view `v_user_video_library` that returns for each user:
- source ('catalog_video' or 'legacy_toolbox')
- video_id / assignment_id
- title
- external_url
- library_scope
- assigned_at
- status
- duration_label (from meta if available)
- dedupe_key (normalized for YouTube/Drive)

The view must:
- prefer catalog_video rows
- keep legacy only if there is no dedupe_key match
- be sortable by assigned_at desc
```

## Prompt 5 - Archetype-based video suggestions

```text
Write a SQL function `get_video_suggestions_for_user(p_user_id uuid, p_limit int default 20)` that:
1) reads top_archetypes + shadow_signals from the most recent analysis_results
2) scores each active video_template:
   - archetype_targets match => decreasing score by rank
   - shadow_targets match => bonus by intensity
3) returns:
   - video_template_id
   - title
   - score
   - reason_text
4) assigns nothing (suggestion only)

Constraints:
- Pure SELECT logic, no insert/update
```

## Prompt 6 - KPI materialized views

```text
Write SQL for:
1) view `v_program_kpi_daily` with:
   - date
   - toolbox_assigned
   - toolbox_completed
   - routines_assigned
   - routines_completed
   - journal_assigned
   - journal_completed
   - videos_assigned
   - videos_completed
2) view `v_program_kpi_rate` with:
   - completion_rate_toolbox
   - adherence_rate_routines
   - completion_rate_journal
   - completion_rate_videos
3) indexes for performant refresh
4) refresh script (materialized views if relevant)
```

## Prompt 7 - Robust audit/observability

```text
Write an idempotent SQL migration for an improved `program_events` table:
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

## Prompt 8 - Data quality constraints

```text
Write SQL adding:
1) check constraints:
   - minimal external_url format (http/https)
   - valid status on assignments
   - content_type whitelist for toolbox
2) business unique constraints:
   - external_key unique per template table
   - video dedupe by (drive_file_id, library_scope) if drive_file_id is not null
3) partial indexes for frequent filters (is_active=true, status='assigned')
4) anomaly detection queries (orphan rows, null urls, invalid statuses)
```

## Prompt 9 - Demo seed script

```text
Produce seed SQL (idempotent) that creates:
- 5 routines templates
- 8 toolbox templates
- 6 journal templates
- 6 video templates
- realistic archetype/shadow tags
- assignments to 2 test users (UUID placeholders)
- corresponding audit events

Constraints:
- Use UPSERT/ON CONFLICT
- No hard-deletes
```

## Prompt 10 - Production migration runbook

```text
Generate a SQL + ops runbook in 3 phases:
Phase A: preflight checks
Phase B: apply migrations (exact order)
Phase C: post-check + rollback strategy

I want:
- exact SQL commands
- volume checks before/after
- RLS checks
- pragmatic rollback without data loss
- GO/NO-GO criteria
```
