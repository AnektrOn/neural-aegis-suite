-- Allow admins to update decisions
CREATE POLICY "Admins can update decisions"
ON public.decisions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add note column to relation_quality_history
ALTER TABLE public.relation_quality_history
ADD COLUMN note TEXT DEFAULT NULL;