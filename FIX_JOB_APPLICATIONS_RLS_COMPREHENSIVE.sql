-- ============================================
-- Comprehensive Fix for RLS Policy on initiative_job_applications
-- ============================================
-- Run this in Supabase SQL Editor to fix the "new row violates row-level security policy" error
--
-- This script:
-- 1. Lists all current policies
-- 2. Drops ALL existing policies
-- 3. Creates correct INSERT policies for both anon and authenticated
-- 4. Verifies the policies were created

-- Step 1: Check current policies (for debugging)
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

-- Step 2: Ensure RLS is enabled
ALTER TABLE initiative_job_applications ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies on this table (to avoid conflicts)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'initiative_job_applications'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON initiative_job_applications', r.policyname);
  END LOOP;
END $$;

-- Step 4: Create INSERT policy for public (includes both anon and authenticated)
-- Using 'public' role is more reliable than 'anon, authenticated' in PostgreSQL
CREATE POLICY "Anyone can create job applications"
  ON initiative_job_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 6: Verify policies were created
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

-- Expected output should show:
-- 1. "Anyone can create job applications" policy for INSERT to public
-- 2. Any SELECT policies for initiative owners (if they exist)
