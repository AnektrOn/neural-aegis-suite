
CREATE POLICY "Admins manage app-releases objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'app-releases' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'app-releases' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read app-releases objects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'app-releases');
