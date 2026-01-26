-- ============================================
-- COMPLETE FIX - ALL IN ONE SCRIPT
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes ALL registration issues
-- ============================================

-- STEP 1: Drop existing functions and triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_profile_by_user_id(UUID);

-- STEP 2: Create the trigger function with comprehensive error handling
-- SECURITY DEFINER runs with the privileges of the function owner (postgres)
-- This allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_type_value TEXT;
  user_email TEXT;
  profile_id UUID;
BEGIN
  -- Log that trigger fired
  RAISE NOTICE 'Trigger fired for user: %', NEW.id;
  
  -- Get user_type from metadata, default to 'individual'
  user_type_value := COALESCE(
    (NEW.raw_user_meta_data->>'user_type')::TEXT,
    'individual'
  );

  -- Get email
  user_email := COALESCE(NEW.email, '');
  
  -- Validate email
  IF user_email = '' OR user_email IS NULL THEN
    RAISE WARNING 'Cannot create profile: email is NULL for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Insert profile with full error handling
  -- SECURITY DEFINER allows this to bypass RLS
  BEGIN
    -- Use INSERT with explicit column list and RETURNING to verify insertion
    INSERT INTO public.user_profiles (
      user_id,
      email,
      user_type,
      verification_status,
      kyc_status,
      profile_visibility
    )
    VALUES (
      NEW.id,
      user_email,
      user_type_value,
      'pending',
      'not_started',
      'public'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      user_type = EXCLUDED.user_type,
      updated_at = NOW()
    RETURNING id INTO profile_id;
    
    -- Check if row was inserted/updated
    IF profile_id IS NOT NULL THEN
      RAISE NOTICE 'Successfully created/updated profile for user % (profile_id: %, email: %, type: %)', NEW.id, profile_id, user_email, user_type_value;
    ELSE
      RAISE WARNING 'Failed to create profile for user % - profile_id is NULL', NEW.id;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail signup
      RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      RAISE WARNING 'Error detail: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Ensure the function is owned by postgres (superuser) so it can bypass RLS
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- STEP 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Create helper function to fetch profiles (bypasses RLS)
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

-- STEP 5: Grant ALL necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO service_role;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- STEP 6: Ensure INSERT policy exists (as fallback)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- STEP 7: Verify everything is set up correctly
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
  rpc_function_exists BOOLEAN;
BEGIN
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Check trigger function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' AND prosecdef = true
  ) INTO function_exists;
  
  -- Check RPC function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_profile_by_user_id' AND prosecdef = true
  ) INTO rpc_function_exists;
  
  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP VERIFICATION:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger exists: %', CASE WHEN trigger_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'Trigger function (SECURITY DEFINER): %', CASE WHEN function_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE 'RPC function (SECURITY DEFINER): %', CASE WHEN rpc_function_exists THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '========================================';
  
  IF NOT trigger_exists OR NOT function_exists OR NOT rpc_function_exists THEN
    RAISE WARNING 'Some components are missing! Check the errors above.';
  ELSE
    RAISE NOTICE '✅ All components are set up correctly!';
  END IF;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES (Run these separately to verify)
-- ============================================

-- Check trigger status
-- SELECT 
--   tgname as trigger_name,
--   CASE tgenabled WHEN 'O' THEN '✅ Enabled' ELSE '❌ Disabled' END as status
-- FROM pg_trigger 
-- WHERE tgname = 'on_auth_user_created';

-- Check functions have SECURITY DEFINER
-- SELECT 
--   proname as function_name,
--   CASE WHEN prosecdef THEN '✅ SECURITY DEFINER' ELSE '❌ NO SECURITY DEFINER' END as status
-- FROM pg_proc
-- WHERE proname IN ('handle_new_user', 'get_user_profile_by_user_id');

-- Check if user_profiles table exists
-- SELECT 
--   tablename,
--   CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- ============================================
-- END OF SCRIPT
-- ============================================
-- After running this, try registering a new user
-- Check Supabase Logs → Postgres Logs for any warnings/errors
-- ============================================
