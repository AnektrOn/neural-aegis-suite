DROP POLICY IF EXISTS "Authenticated read published app-releases objects" ON storage.objects;
ALTER POLICY "Admins manage app-releases objects" ON storage.objects
USING (
  bucket_id = 'app-releases'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
)
WITH CHECK (
  bucket_id = 'app-releases'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);
COMMENT ON POLICY "Admins manage app-releases objects" ON storage.objects IS 'Direct release storage access is limited to non-guest platform administrators. Members use the published APK signed URL; no member listing or direct storage reads.';