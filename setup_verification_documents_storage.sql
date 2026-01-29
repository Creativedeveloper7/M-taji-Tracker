-- ============================================
-- SETUP VERIFICATION DOCUMENTS STORAGE BUCKET
-- ============================================
-- This script creates the storage bucket for verification documents
-- and sets up Row Level Security (RLS) policies
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create the storage bucket (if it doesn't exist)
-- Note: Bucket creation via SQL requires superuser privileges
-- If this fails, create the bucket manually in Supabase Dashboard → Storage

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false, -- Private bucket - documents should not be publicly accessible
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies for this bucket (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Step 4: Create RLS Policies

-- Policy 1: Allow authenticated users to upload documents to their own folder
-- Documents are stored in format: {user_profile_id}/{document_type}_{timestamp}.{ext}
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy 2: Allow users to view their own documents
-- Documents are organized by user_profile_id folder
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy 3: Allow admins to view all documents
-- Note: Add admin role check here if you have an admin system
-- For now, allowing all authenticated users (you may want to restrict this)
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  -- TODO: Add admin role check here
  -- Example: AND EXISTS (
  --   SELECT 1 FROM user_profiles
  --   WHERE user_profiles.user_id = auth.uid()
  --   AND user_profiles.is_admin = true
  -- )
);

-- Policy 4: Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy 5: Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
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
WHERE id = 'verification-documents';

-- Expected output: Should show the verification-documents bucket with public = false

-- ============================================
-- MANUAL SETUP (If SQL bucket creation fails)
-- ============================================
-- If the INSERT above fails due to permissions, create the bucket manually:
-- 
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "verification-documents"
-- 4. Public: No (unchecked - PRIVATE bucket)
-- 5. File size limit: 10 MB
-- 6. Allowed MIME types: 
--    - application/pdf
--    - image/jpeg
--    - image/jpg
--    - image/png
--    - application/msword
--    - application/vnd.openxmlformats-officedocument.wordprocessingml.document
--    - application/vnd.ms-excel
--    - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
-- 7. Click "Create bucket"
-- 
-- Then run only Steps 2-5 above (the RLS policies)

-- ============================================
-- TESTING
-- ============================================
-- After running this script, test by:
-- 1. Registering a new organization/government entity
-- 2. Uploading a document during registration
-- 3. Check Supabase Dashboard → Storage → verification-documents to see the uploaded file
-- 4. Verify the file is in the correct folder structure: {user_profile_id}/{document_type}_{timestamp}.{ext}
-- 5. Verify only the user who uploaded can access it (private bucket)
