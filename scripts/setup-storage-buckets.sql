-- Create storage buckets and policies
-- This script ensures all necessary storage buckets exist

-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'images', 
  'images', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for images bucket
CREATE POLICY IF NOT EXISTS "Images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY IF NOT EXISTS "Service role can manage images" 
ON storage.objects FOR ALL 
USING (bucket_id = 'images' AND auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update their own images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete their own images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'images';
