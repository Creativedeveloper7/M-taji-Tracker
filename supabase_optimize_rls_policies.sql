-- Optimize RLS policies to prevent timeouts
-- Run this in your Supabase SQL Editor

-- Drop existing slow policies
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;

-- Create optimized policy for public read (simpler, faster)
-- This allows anonymous users to read published/active/completed initiatives
CREATE POLICY "Public can view published initiatives"
  ON initiatives FOR SELECT
  USING (status IN ('published', 'active', 'completed'));

-- Create separate policy for authenticated users to view their own
-- Only runs if user is authenticated (auth.uid() is not null)
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

-- Add composite index to speed up RLS policy checks
CREATE INDEX IF NOT EXISTS idx_initiatives_status_changemaker 
ON initiatives(status, changemaker_id) 
WHERE status IN ('published', 'active', 'completed');

-- Add index on changemakers.user_id for faster joins
CREATE INDEX IF NOT EXISTS idx_changemakers_user_id 
ON changemakers(user_id) 
WHERE user_id IS NOT NULL;

-- Optimize milestones policy
DROP POLICY IF EXISTS "Milestones are viewable for published initiatives" ON milestones;

CREATE POLICY "Milestones are viewable for published initiatives"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = milestones.initiative_id
      AND initiatives.status IN ('published', 'active', 'completed')
    )
  );

-- Add index to speed up milestone queries
CREATE INDEX IF NOT EXISTS idx_milestones_initiative_status 
ON milestones(initiative_id) 
INCLUDE (status, target_date);

