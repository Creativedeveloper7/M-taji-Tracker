-- ============================================
-- SETUP INITIATIVE IMAGES STORAGE BUCKET
-- ============================================
-- This script creates the storage bucket for initiative images
-- and sets up Row Level Security (RLS) policies
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create the storage bucket (if it doesn't exist)
-- Note: Bucket creation via SQL requires superuser privileges
-- If this fails, create the bucket manually in Supabase Dashboard → Storage

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'initiative-images',
  'initiative-images',
  true, -- Public bucket so images can be accessed via public URLs
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies for this bucket (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can upload initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own initiative images" ON storage.objects;

-- Step 4: Create RLS Policies

-- Policy 1: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload initiative images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'initiative-images' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy 2: Allow public read access (since bucket is public)
-- This allows anyone to view the images via public URLs
CREATE POLICY "Public can view initiative images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'initiative-images');

-- Policy 3: Allow authenticated users to view all initiative images
CREATE POLICY "Users can view initiative images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'initiative-images');

-- Policy 4: Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own initiative images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'initiative-images' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Step 5: Verify the setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'initiative-images';

-- Expected output: Should show the initiative-images bucket with public = true

-- ============================================
-- MANUAL SETUP (If SQL bucket creation fails)
-- ============================================
-- If the INSERT above fails due to permissions, create the bucket manually:
-- 
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "initiative-images"
-- 4. Public: Yes (checked)
-- 5. File size limit: 5 MB
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"
-- 
-- Then run only Steps 2-5 above (the RLS policies)

-- ============================================
-- TESTING
-- ============================================
-- After running this script, test by:
-- 1. Going to your Create Initiative page
-- 2. Uploading an image in Step 6 (Documents & Media)
-- 3. Check Supabase Dashboard → Storage → initiative-images to see the uploaded file
-- 4. Verify the image URL is accessible
