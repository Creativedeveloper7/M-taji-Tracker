-- Fix Supabase Timeout Issues
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing slow RLS policies
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;

-- Step 2: Create optimized policy for public read (simpler, faster)
CREATE POLICY "Public can view published initiatives"
  ON initiatives FOR SELECT
  USING (status IN ('published', 'active', 'completed'));

-- Step 3: Create optimized policy for authenticated users
-- This only runs if user is authenticated, avoiding unnecessary checks
CREATE POLICY "Users can view their own initiatives"
  ON initiatives FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

-- Step 4: Add composite indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_initiatives_status_created 
ON initiatives(status, created_at DESC) 
WHERE status IN ('published', 'active', 'completed');

CREATE INDEX IF NOT EXISTS idx_initiatives_status_changemaker 
ON initiatives(status, changemaker_id) 
WHERE status IN ('published', 'active', 'completed');

-- Step 5: Add index on changemakers.user_id for faster RLS joins
CREATE INDEX IF NOT EXISTS idx_changemakers_user_id 
ON changemakers(user_id) 
WHERE user_id IS NOT NULL;

-- Step 6: Optimize milestones query
CREATE INDEX IF NOT EXISTS idx_milestones_initiative_status 
ON milestones(initiative_id, status, target_date);

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('initiatives', 'milestones', 'changemakers')
ORDER BY tablename, indexname;

