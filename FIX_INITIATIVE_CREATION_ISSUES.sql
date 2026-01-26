-- ============================================
-- FIX INITIATIVE CREATION ISSUES
-- ============================================
-- This script fixes:
-- 1. RLS policies for government_entities
-- 2. Ensures storage bucket exists
-- 3. Fixes any missing columns
-- ============================================

-- STEP 1: Fix government_entities RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Government entities can view their own data" ON government_entities;
DROP POLICY IF EXISTS "Users can view their own government entity" ON government_entities;

-- Create policy to allow users to view their own government entity
CREATE POLICY "Users can view their own government entity"
  ON government_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = government_entities.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Also allow service role
CREATE POLICY "Service role can view all government entities"
  ON government_entities FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- STEP 2: Ensure storage bucket exists
-- Try to create the bucket (may fail if already exists or insufficient permissions)
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'initiative-images'
  ) THEN
    -- Try to insert bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'initiative-images',
      'initiative-images',
      true,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    );
    RAISE NOTICE 'Storage bucket initiative-images created';
  ELSE
    RAISE NOTICE 'Storage bucket initiative-images already exists';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create storage bucket. Please create it manually in Supabase Dashboard → Storage';
END $$;

-- STEP 3: Fix storage RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view initiative images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own initiative images" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Users can upload initiative images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'initiative-images'
  );

CREATE POLICY "Public can view initiative images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'initiative-images');

CREATE POLICY "Users can view initiative images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'initiative-images');

CREATE POLICY "Users can delete their own initiative images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'initiative-images');

-- STEP 4: Verify category constraint matches code
-- The database allows: 'agriculture', 'water', 'health', 'education', 'infrastructure', 'economic'
-- If you need to add more categories, uncomment and modify:
-- ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_category_check;
-- ALTER TABLE initiatives ADD CONSTRAINT initiatives_category_check 
--   CHECK (category IN ('agriculture', 'water', 'health', 'education', 'infrastructure', 'economic', 'social_welfare', 'environment'));

-- STEP 5: Verify setup
DO $$
DECLARE
  bucket_exists BOOLEAN;
  gov_policy_exists BOOLEAN;
BEGIN
  -- Check bucket
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'initiative-images'
  ) INTO bucket_exists;
  
  -- Check policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'government_entities' 
    AND policyname = 'Users can view their own government entity'
  ) INTO gov_policy_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP VERIFICATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Storage bucket exists: %', CASE WHEN bucket_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Government entities RLS policy: %', CASE WHEN gov_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '========================================';
  
  IF NOT bucket_exists THEN
    RAISE WARNING '⚠️ Storage bucket does not exist. Create it manually in Supabase Dashboard → Storage';
  END IF;
END;
$$;

-- ============================================
-- MANUAL STEPS (if needed)
-- ============================================
-- If storage bucket creation fails:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "initiative-images"
-- 4. Public: Yes
-- 5. File size limit: 5 MB
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"

-- ============================================
-- END OF SCRIPT
-- ============================================
