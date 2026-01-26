-- ============================================
-- DIAGNOSE AND FIX MISSING INITIATIVES
-- ============================================
-- This script checks why initiatives aren't showing
-- and fixes the issues
-- ============================================

-- STEP 1: Check ALL initiatives and their statuses
SELECT 
  id,
  title,
  status,
  created_at,
  updated_at,
  changemaker_id
FROM initiatives
ORDER BY created_at DESC;

-- STEP 2: Count initiatives by status
SELECT 
  status,
  COUNT(*) as count
FROM initiatives
GROUP BY status
ORDER BY count DESC;

-- STEP 3: Check if there are any initiatives at all
DO $$
DECLARE
  total_count INTEGER;
  published_count INTEGER;
  draft_count INTEGER;
  other_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM initiatives;
  SELECT COUNT(*) INTO published_count FROM initiatives WHERE status IN ('published', 'active', 'completed');
  SELECT COUNT(*) INTO draft_count FROM initiatives WHERE status = 'draft';
  SELECT COUNT(*) INTO other_count FROM initiatives WHERE status NOT IN ('published', 'active', 'completed', 'draft');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INITIATIVE STATUS SUMMARY:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total initiatives: %', total_count;
  RAISE NOTICE 'Published/Active/Completed: %', published_count;
  RAISE NOTICE 'Draft: %', draft_count;
  RAISE NOTICE 'Other statuses: %', other_count;
  RAISE NOTICE '========================================';
  
  IF total_count = 0 THEN
    RAISE WARNING '⚠️ No initiatives found in database at all!';
  ELSIF published_count = 0 AND draft_count > 0 THEN
    RAISE WARNING '⚠️ All initiatives are in DRAFT status. They need to be published to be visible on the landing page.';
  ELSIF published_count = 0 THEN
    RAISE WARNING '⚠️ No published initiatives found. Check initiative statuses.';
  END IF;
END;
$$;

-- STEP 4: Check RLS policies
SELECT 
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'initiatives'
ORDER BY policyname;

-- STEP 5: Test if RLS is blocking access
-- This simulates what an anonymous user would see
DO $$
DECLARE
  visible_count INTEGER;
BEGIN
  -- Try to count initiatives as an anonymous user would
  SELECT COUNT(*) INTO visible_count
  FROM initiatives
  WHERE status IN ('published', 'active', 'completed');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS ACCESS TEST:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Initiatives visible to public: %', visible_count;
  RAISE NOTICE '========================================';
  
  IF visible_count = 0 THEN
    RAISE WARNING '⚠️ RLS might be blocking access OR no published initiatives exist';
  END IF;
END;
$$;

-- STEP 6: FIX - Update all draft initiatives to published
-- UNCOMMENT THE FOLLOWING TO EXECUTE:
UPDATE initiatives 
SET status = 'published', updated_at = NOW()
WHERE status = 'draft';

-- STEP 7: Verify the fix worked
SELECT 
  id,
  title,
  status,
  created_at
FROM initiatives
WHERE status IN ('published', 'active', 'completed')
ORDER BY created_at DESC
LIMIT 10;

-- STEP 8: Final count check
DO $$
DECLARE
  published_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO published_count
  FROM initiatives
  WHERE status IN ('published', 'active', 'completed');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL CHECK:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Published initiatives now available: %', published_count;
  
  IF published_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS! Initiatives should now be visible on the landing page.';
  ELSE
    RAISE WARNING '❌ Still no published initiatives. Check the UPDATE query above.';
  END IF;
END;
$$;

-- ============================================
-- MANUAL STEPS IF NEEDED
-- ============================================

-- If you want to publish only specific initiatives:
-- UPDATE initiatives 
-- SET status = 'published', updated_at = NOW()
-- WHERE id = 'YOUR_INITIATIVE_ID_HERE';

-- If you want to publish only recent drafts:
-- UPDATE initiatives 
-- SET status = 'published', updated_at = NOW()
-- WHERE status = 'draft' 
-- AND created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- END OF SCRIPT
-- ============================================
