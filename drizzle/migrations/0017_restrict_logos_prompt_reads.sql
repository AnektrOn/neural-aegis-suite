DROP POLICY IF EXISTS "authenticated read logos_prompt_batches" ON public.logos_prompt_batches;
DROP POLICY IF EXISTS "authenticated read logos_path_prompts" ON public.logos_path_prompts;
CREATE POLICY "admins read logos_prompt_batches" ON public.logos_prompt_batches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "admins read logos_path_prompts" ON public.logos_path_prompts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));