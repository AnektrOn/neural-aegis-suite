-- Public bucket for Guardian onboarding voice tracks (Lovable static deploy skips .mp3).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guardian-audio',
  'guardian-audio',
  true,
  10485760,
  ARRAY['audio/mpeg', 'audio/mp3', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Guardian audio public read" ON storage.objects;
CREATE POLICY "Guardian audio public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'guardian-audio');

DROP POLICY IF EXISTS "Service role manages guardian audio" ON storage.objects;
CREATE POLICY "Service role manages guardian audio"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'guardian-audio')
WITH CHECK (bucket_id = 'guardian-audio');
