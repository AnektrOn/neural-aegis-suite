ALTER TABLE public.analysis_results
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Existing RLS already allows admins to SELECT all and users to manage own.
-- Add a dedicated policy so admins can UPDATE notes on any row.
DROP POLICY IF EXISTS "Admins can update analysis notes" ON public.analysis_results;
CREATE POLICY "Admins can update analysis notes"
ON public.analysis_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));