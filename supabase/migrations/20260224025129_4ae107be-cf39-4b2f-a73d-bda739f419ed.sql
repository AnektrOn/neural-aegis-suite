
-- Track toolbox item completion status
CREATE TABLE public.toolbox_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.toolbox_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'abandoned', 'ignored')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  feedback TEXT
);

ALTER TABLE public.toolbox_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions" ON public.toolbox_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all completions" ON public.toolbox_completions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Unique constraint: one completion per assignment
CREATE UNIQUE INDEX idx_toolbox_completions_unique ON public.toolbox_completions(assignment_id);

-- Trigger to notify admin on completion
CREATE OR REPLACE FUNCTION public.notify_admin_toolbox_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _user_name TEXT;
  _tool_title TEXT;
  _admin_id UUID;
  _status_label TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM profiles WHERE id = NEW.user_id;
  SELECT title INTO _tool_title FROM toolbox_assignments WHERE id = NEW.assignment_id;
  
  CASE NEW.status
    WHEN 'completed' THEN _status_label := 'terminé';
    WHEN 'abandoned' THEN _status_label := 'abandonné';
    WHEN 'ignored' THEN _status_label := 'ignoré';
  END CASE;

  FOR _admin_id IN SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _admin_id,
      'Outil ' || _status_label,
      COALESCE(_user_name, 'Utilisateur') || ' a ' || _status_label || ' l''outil "' || COALESCE(_tool_title, '?') || '"',
      CASE WHEN NEW.status = 'completed' THEN 'success' ELSE 'info' END,
      '/admin/toolbox'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_toolbox_completion_notify
  AFTER INSERT ON public.toolbox_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_toolbox_completion();
