-- Drop the old restrictive check constraint
ALTER TABLE public.toolbox_assignments DROP CONSTRAINT toolbox_assignments_content_type_check;

-- Add updated constraint with all widget types
ALTER TABLE public.toolbox_assignments ADD CONSTRAINT toolbox_assignments_content_type_check 
CHECK (content_type = ANY (ARRAY['meditation', 'visualization', 'course', 'breathwork', 'focus_introspectif', 'body_scan', 'affirmations', 'gratitude', 'journal_prompt', 'external_link']));
