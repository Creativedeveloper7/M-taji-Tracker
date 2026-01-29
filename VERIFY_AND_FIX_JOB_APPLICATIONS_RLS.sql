-- ============================================
-- Verify and Fix RLS Policy for initiative_job_applications
-- ============================================
-- Run this in Supabase SQL Editor
-- This will show you what policies exist and fix them if needed

-- Step 1: Check what policies currently exist
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'initiative_job_applications'
ORDER BY policyname;

-- Step 2: Drop ALL existing INSERT policies (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "anon can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "authenticated can create job applications" ON initiative_job_applications;
DROP POLICY IF EXISTS "Public can create job applications" ON initiative_job_applications;

-- Step 3: Ensure RLS is enabled
ALTER TABLE initiative_job_applications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create the correct INSERT policy using 'public' role
-- This is the same approach used successfully for volunteer_applications
CREATE POLICY "Anyone can create job applications"
  ON initiative_job_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 5: Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'initiative_job_applications'
ORDER BY policyname;

-- Expected result: You should see:
-- 1. "Anyone can create job applications" with cmd='INSERT' and roles='{public}'
-- 2. "Initiative owners can view job applications" with cmd='SELECT' (if it exists)
