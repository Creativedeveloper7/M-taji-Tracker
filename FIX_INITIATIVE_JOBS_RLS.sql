-- ============================================
-- Fix RLS Policies for initiative_jobs
-- ============================================
-- Run this in Supabase SQL Editor to allow initiative owners
-- to create and manage jobs for their initiatives

-- Initiative owners can create jobs for their initiatives
DROP POLICY IF EXISTS "Initiative owners can create jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can create jobs"
  ON initiative_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Initiative owners can update their own jobs
DROP POLICY IF EXISTS "Initiative owners can update jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can update jobs"
  ON initiative_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Initiative owners can delete their own jobs
DROP POLICY IF EXISTS "Initiative owners can delete jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can delete jobs"
  ON initiative_jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );
