-- ============================================
-- Fix RLS Policy for initiative_job_applications INSERT
-- ============================================
-- Run this in the Supabase SQL editor if you're getting:
-- "new row violates row-level security policy for table 'initiative_job_applications'"
--
-- This ensures that both anonymous and authenticated users can submit job applications.

-- First, ensure RLS is enabled on the table
ALTER TABLE initiative_job_applications ENABLE ROW LEVEL SECURITY;

-- Drop any existing INSERT policies (in case there are conflicts)
DROP POLICY IF EXISTS "Anyone can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "Public can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "anon can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "authenticated can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "Allow job application inserts" ON initiative_job_applications;

-- Create INSERT policy using 'public' role (includes both anon and authenticated)
-- Using 'public' is more reliable than 'anon, authenticated' - same approach as volunteer_applications
CREATE POLICY "Anyone can create job applications"
  ON initiative_job_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'initiative_job_applications'
ORDER BY policyname;
