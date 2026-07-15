
-- Restrict handle_new_user (only auth trigger should invoke it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage RLS policies for 'inspirations' bucket (path prefix = user id)
CREATE POLICY "Users read own inspiration files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own inspiration files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own inspiration files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own inspiration files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inspirations' AND auth.uid()::text = (storage.foldername(name))[1]);
