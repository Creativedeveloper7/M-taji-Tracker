-- ============================================
-- COMPREHENSIVE FIX: Profile Access & Required Tables
-- ============================================
-- This script fixes:
-- 1. RLS policies blocking profile access
-- 2. Ensures all required tables exist
-- 3. Creates missing profiles for existing users
-- 4. Fixes changemakers table access
-- ============================================

-- STEP 1: Ensure changemakers table exists
CREATE TABLE IF NOT EXISTS changemakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  organization TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_changemakers_user_id ON changemakers(user_id);

-- STEP 2: Fix RLS policies for user_profiles SELECT access
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles via service role" ON user_profiles;

-- Create comprehensive SELECT policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to view all profiles (for backend operations)
CREATE POLICY "Service role can view all profiles"
  ON user_profiles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- STEP 3: Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- STEP 4: Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 5: Fix changemakers RLS policies
ALTER TABLE changemakers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Changemakers are viewable by everyone" ON changemakers;
DROP POLICY IF EXISTS "Users can insert their own changemaker profile" ON changemakers;
DROP POLICY IF EXISTS "Users can update their own changemaker profile" ON changemakers;
DROP POLICY IF EXISTS "Users can view their own changemaker" ON changemakers;

-- Create comprehensive changemakers policies
CREATE POLICY "Changemakers are viewable by everyone"
  ON changemakers FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own changemaker profile"
  ON changemakers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own changemaker profile"
  ON changemakers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own changemaker"
  ON changemakers FOR SELECT
  USING (auth.uid() = user_id);

-- STEP 6: Create missing profiles for existing users
-- This creates profiles for users who exist in auth.users but not in user_profiles
INSERT INTO user_profiles (
  user_id,
  email,
  user_type,
  verification_status,
  kyc_status,
  profile_visibility
)
SELECT 
  au.id,
  au.email,
  COALESCE((au.raw_user_meta_data->>'user_type')::TEXT, 'individual'),
  'pending',
  'not_started',
  'public'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
)
AND au.email IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- STEP 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON changemakers TO authenticated;

-- STEP 8: Create helper function to get profile (bypasses RLS when needed)
CREATE OR REPLACE FUNCTION public.get_user_profile_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  phone TEXT,
  user_type TEXT,
  verification_status TEXT,
  kyc_status TEXT,
  profile_visibility TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.email,
    up.phone,
    up.user_type,
    up.verification_status,
    up.kyc_status,
    up.profile_visibility,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.user_id = p_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO service_role;

-- STEP 9: Verify setup
DO $$
DECLARE
  profile_count INTEGER;
  changemaker_count INTEGER;
  missing_profiles INTEGER;
BEGIN
  -- Count profiles
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  
  -- Count changemakers
  SELECT COUNT(*) INTO changemaker_count FROM changemakers;
  
  -- Count users without profiles
  SELECT COUNT(*) INTO missing_profiles
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
  )
  AND au.email IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP VERIFICATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total user_profiles: %', profile_count;
  RAISE NOTICE 'Total changemakers: %', changemaker_count;
  RAISE NOTICE 'Users without profiles: %', missing_profiles;
  RAISE NOTICE '========================================';
  
  IF missing_profiles > 0 THEN
    RAISE WARNING '⚠️ Some users are missing profiles. Run this script again to create them.';
  ELSE
    RAISE NOTICE '✅ All users have profiles!';
  END IF;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES (Run these separately)
-- ============================================

-- Check RLS policies on user_profiles
-- SELECT 
--   policyname,
--   cmd as command,
--   permissive,
--   roles
-- FROM pg_policies
-- WHERE tablename = 'user_profiles'
-- ORDER BY policyname;

-- Check RLS policies on changemakers
-- SELECT 
--   policyname,
--   cmd as command,
--   permissive,
--   roles
-- FROM pg_policies
-- WHERE tablename = 'changemakers'
-- ORDER BY policyname;

-- Check if a specific user has a profile (replace with actual user_id)
-- SELECT * FROM user_profiles WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- END OF SCRIPT
-- ============================================
