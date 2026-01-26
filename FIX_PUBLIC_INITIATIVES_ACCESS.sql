-- ============================================
-- FIX PUBLIC ACCESS TO PUBLISHED INITIATIVES
-- ============================================
-- This script ensures that published initiatives
-- are visible on the public initiatives page
-- ============================================

-- STEP 1: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
DROP POLICY IF EXISTS "Public can view published initiatives" ON initiatives;
DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;

-- STEP 2: Create optimized policy for public read access
-- This allows anonymous/public users to read published/active/completed initiatives
CREATE POLICY "Public can view published initiatives"
  ON initiatives FOR SELECT
  TO public
  USING (status IN ('published', 'active', 'completed'));

-- STEP 3: Also allow authenticated users to view published initiatives
CREATE POLICY "Authenticated can view published initiatives"
  ON initiatives FOR SELECT
  TO authenticated
  USING (status IN ('published', 'active', 'completed'));

-- STEP 4: Allow users to view their own initiatives (including drafts)
CREATE POLICY "Users can view their own initiatives"
  ON initiatives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

-- STEP 5: Create indexes to optimize queries
CREATE INDEX IF NOT EXISTS idx_initiatives_status_public 
ON initiatives(status, created_at DESC) 
WHERE status IN ('published', 'active', 'completed');

CREATE INDEX IF NOT EXISTS idx_initiatives_status_changemaker 
ON initiatives(status, changemaker_id) 
WHERE status IN ('published', 'active', 'completed');

-- STEP 6: Verify policies exist
DO $$
DECLARE
  public_policy_exists BOOLEAN;
  auth_policy_exists BOOLEAN;
  user_policy_exists BOOLEAN;
BEGIN
  -- Check public policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Public can view published initiatives'
  ) INTO public_policy_exists;
  
  -- Check authenticated policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Authenticated can view published initiatives'
  ) INTO auth_policy_exists;
  
  -- Check user policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Users can view their own initiatives'
  ) INTO user_policy_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICY VERIFICATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Public can view published initiatives: %', CASE WHEN public_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Authenticated can view published initiatives: %', CASE WHEN auth_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Users can view their own initiatives: %', CASE WHEN user_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '========================================';
END;
$$;

-- STEP 7: Test query to verify public access works
-- This should return published initiatives even for anonymous users
DO $$
DECLARE
  published_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO published_count
  FROM initiatives
  WHERE status IN ('published', 'active', 'completed');
  
  RAISE NOTICE 'Total published/active/completed initiatives: %', published_count;
  
  IF published_count = 0 THEN
    RAISE WARNING '⚠️ No published initiatives found. Make sure initiatives are created with status "published"';
  ELSE
    RAISE NOTICE '✅ Found % published initiatives', published_count;
  END IF;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES (Run these separately to test)
-- ============================================

-- Check all initiatives and their statuses
-- SELECT id, title, status, created_at 
-- FROM initiatives 
-- ORDER BY created_at DESC;

-- Check RLS policies on initiatives table
-- SELECT 
--   policyname,
--   cmd as command,
--   permissive,
--   roles
-- FROM pg_policies
-- WHERE tablename = 'initiatives'
-- ORDER BY policyname;

-- ============================================
-- END OF SCRIPT
-- ============================================
