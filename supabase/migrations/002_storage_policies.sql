-- Storage bucket policies for recordings
-- This migration sets up RLS policies for the recordings bucket
-- NOTE: You must also change the bucket from PUBLIC to PRIVATE in Supabase Dashboard!

-- Create storage policies for the recordings bucket
-- These policies ensure users can only access their own files

-- Policy: Users can upload their own recordings
-- File path format: {user_id}/{filename}
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own recordings
CREATE POLICY "Users can view own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Service role can access all recordings (for backend processing)
-- This allows the backend API to download files for transcription
CREATE POLICY "Service role full access to recordings"
ON storage.objects FOR ALL
USING (
  bucket_id = 'recordings'
  AND auth.role() = 'service_role'
);

-- Add comment for documentation
COMMENT ON POLICY "Users can upload own recordings" ON storage.objects IS
'Users can only upload files to their own folder (user_id/filename)';

COMMENT ON POLICY "Users can view own recordings" ON storage.objects IS
'Users can only view/download files from their own folder';

COMMENT ON POLICY "Users can delete own recordings" ON storage.objects IS
'Users can only delete files from their own folder';
