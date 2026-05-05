-- Add stop_protocol and intention to toolbox_assignments content_type CHECK constraint.
-- These types exist in the UI (widgets + ToolboxAssignmentForm) but were missing from the DB constraint.

ALTER TABLE public.toolbox_assignments
  DROP CONSTRAINT IF EXISTS toolbox_assignments_content_type_check;

ALTER TABLE public.toolbox_assignments
  ADD CONSTRAINT toolbox_assignments_content_type_check
  CHECK (content_type = ANY (ARRAY[
    'meditation',
    'visualization',
    'course',
    'breathwork',
    'focus_introspectif',
    'body_scan',
    'affirmations',
    'gratitude',
    'journal_prompt',
    'external_link',
    'stop_protocol',
    'intention',
    'micro_practice'
  ]));

-- micro_practice: widget générique pour tout exercice sans widget dédié.
-- widget_config: { instructions, duration_sec?, steps?: [{text}][], accent_color? }
