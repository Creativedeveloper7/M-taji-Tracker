-- ============================================
-- CHECK AND FIX INITIATIVE STATUS
-- ============================================
-- This script helps debug why initiatives aren't showing
-- and fixes any initiatives that should be published
-- ============================================

-- STEP 1: Check all initiatives and their statuses
SELECT 
  id,
  title,
  status,
  created_at,
  updated_at,
  changemaker_id
FROM initiatives
ORDER BY created_at DESC
LIMIT 20;

-- STEP 2: Count initiatives by status
SELECT 
  status,
  COUNT(*) as count
FROM initiatives
GROUP BY status
ORDER BY count DESC;

-- STEP 3: Check if there are any draft initiatives that should be published
SELECT 
  id,
  title,
  status,
  created_at
FROM initiatives
WHERE status = 'draft'
ORDER BY created_at DESC;

-- STEP 4: Update all draft initiatives to published (if you want them to be public)
-- UNCOMMENT THE FOLLOWING LINE TO EXECUTE:
-- UPDATE initiatives SET status = 'published' WHERE status = 'draft';

-- STEP 5: Verify RLS policies allow public access
SELECT 
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'initiatives'
ORDER BY policyname;

-- STEP 6: Test public access query (should work even for anonymous users)
-- This simulates what the frontend does
SELECT 
  id,
  title,
  status,
  created_at
FROM initiatives
WHERE status IN ('published', 'active', 'completed')
ORDER BY created_at DESC
LIMIT 10;

-- STEP 7: Check if there are any initiatives created in the last 24 hours
SELECT 
  id,
  title,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM initiatives
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================
-- QUICK FIX: Update recent drafts to published
-- ============================================
-- If you see draft initiatives that should be published, run:
-- UPDATE initiatives 
-- SET status = 'published', updated_at = NOW()
-- WHERE status = 'draft' 
-- AND created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- END OF SCRIPT
-- ============================================
