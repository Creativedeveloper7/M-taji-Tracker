-- ============================================
-- FIX LANDING PAGE INITIATIVES DISPLAY
-- ============================================
-- This script ensures initiatives are visible on
-- the landing page (/map and /initiatives routes)
-- ============================================

-- STEP 1: Ensure RLS is enabled on initiatives table
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
DROP POLICY IF EXISTS "Public can view published initiatives" ON initiatives;
DROP POLICY IF EXISTS "Authenticated can view published initiatives" ON initiatives;
DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;

-- STEP 3: Create policy for public/anonymous users
-- This allows anyone (even not logged in) to view published/active/completed initiatives
CREATE POLICY "Public can view published initiatives"
  ON initiatives FOR SELECT
  TO public
  USING (status IN ('published', 'active', 'completed'));

-- STEP 4: Create policy for authenticated users to view published initiatives
CREATE POLICY "Authenticated can view published initiatives"
  ON initiatives FOR SELECT
  TO authenticated
  USING (status IN ('published', 'active', 'completed'));

-- STEP 5: Allow users to view their own initiatives (including drafts)
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

-- STEP 6: Create indexes to optimize public queries
CREATE INDEX IF NOT EXISTS idx_initiatives_status_public 
ON initiatives(status, created_at DESC) 
WHERE status IN ('published', 'active', 'completed');

CREATE INDEX IF NOT EXISTS idx_initiatives_status_changemaker 
ON initiatives(status, changemaker_id) 
WHERE status IN ('published', 'active', 'completed');

-- STEP 7: Update any draft initiatives to published (if they should be public)
-- Uncomment the following line if you want to publish all drafts:
-- UPDATE initiatives SET status = 'published', updated_at = NOW() WHERE status = 'draft';

-- STEP 8: Verify the setup
DO $$
DECLARE
  public_policy_exists BOOLEAN;
  auth_policy_exists BOOLEAN;
  user_policy_exists BOOLEAN;
  published_count INTEGER;
  draft_count INTEGER;
BEGIN
  -- Check policies
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Public can view published initiatives'
  ) INTO public_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Authenticated can view published initiatives'
  ) INTO auth_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'initiatives' 
    AND policyname = 'Users can view their own initiatives'
  ) INTO user_policy_exists;
  
  -- Count initiatives
  SELECT COUNT(*) INTO published_count
  FROM initiatives
  WHERE status IN ('published', 'active', 'completed');
  
  SELECT COUNT(*) INTO draft_count
  FROM initiatives
  WHERE status = 'draft';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICY VERIFICATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Public can view published initiatives: %', CASE WHEN public_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Authenticated can view published initiatives: %', CASE WHEN auth_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Users can view their own initiatives: %', CASE WHEN user_policy_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INITIATIVE COUNTS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Published/Active/Completed: %', published_count;
  RAISE NOTICE 'Draft (not visible to public): %', draft_count;
  RAISE NOTICE '========================================';
  
  IF draft_count > 0 THEN
    RAISE WARNING '⚠️ You have % draft initiatives. They will not be visible on the landing page. Update them to "published" status if you want them to be public.', draft_count;
  END IF;
  
  IF published_count = 0 THEN
    RAISE WARNING '⚠️ No published initiatives found. Make sure initiatives are created with status "published"';
  END IF;
END;
$$;

-- STEP 9: Test public access query (simulates what frontend does)
-- This should return results even for anonymous users
SELECT 
  id,
  title,
  status,
  created_at,
  location->>'county' as county
FROM initiatives
WHERE status IN ('published', 'active', 'completed')
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- Check all initiatives and their statuses
-- SELECT 
--   id,
--   title,
--   status,
--   created_at,
--   updated_at
-- FROM initiatives
-- ORDER BY created_at DESC;

-- Check recent initiatives (last 7 days)
-- SELECT 
--   id,
--   title,
--   status,
--   created_at,
--   EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
-- FROM initiatives
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC;

-- Check RLS policies
-- SELECT 
--   policyname,
--   cmd as command,
--   permissive,
--   roles
-- FROM pg_policies
-- WHERE tablename = 'initiatives'
-- ORDER BY policyname;

-- ============================================
-- QUICK FIXES
-- ============================================

-- If you want to publish all draft initiatives:
-- UPDATE initiatives 
-- SET status = 'published', updated_at = NOW()
-- WHERE status = 'draft';

-- If you want to publish only recent drafts (last 7 days):
-- UPDATE initiatives 
-- SET status = 'published', updated_at = NOW()
-- WHERE status = 'draft' 
-- AND created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- END OF SCRIPT
-- ============================================
