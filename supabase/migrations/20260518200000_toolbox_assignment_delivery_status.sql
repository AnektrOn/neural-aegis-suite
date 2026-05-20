-- Per-user toolbox delivery state (import + admin flows).

ALTER TABLE public.toolbox_assignments
  ADD COLUMN IF NOT EXISTS user_delivery_status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      user_delivery_status = ANY (
        ARRAY['assigned'::text, 'waiting'::text, 'active'::text, 'inactive'::text]
      )
    );

COMMENT ON COLUMN public.toolbox_assignments.user_delivery_status IS
  'assigned=new allocation; waiting=user must confirm; active=usable; inactive=hidden from user';

CREATE OR REPLACE FUNCTION public.confirm_waiting_toolbox_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.toolbox_assignments
  SET user_delivery_status = 'active'
  WHERE id = p_assignment_id
    AND user_id = auth.uid()
    AND user_delivery_status = 'waiting';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_waiting_toolbox_assignment(uuid) TO authenticated;
