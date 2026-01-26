-- ============================================
-- DIAGNOSTIC QUERIES FOR TRIGGER ISSUES
-- ============================================
-- Run these queries to diagnose why the trigger is failing
-- ============================================

-- 1. Check if the trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check if the function exists and its definition
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check if user_profiles table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- 5. Check for any recent errors in Supabase logs
-- (This would be in Supabase Dashboard -> Logs -> Postgres Logs)

-- 6. Test the trigger function manually (if you have a test user)
-- Replace 'test-user-id' with an actual user_id from auth.users
/*
SELECT public.handle_new_user(
  (SELECT row_to_json(u) FROM auth.users u WHERE id = 'test-user-id'::uuid)
);
*/

-- ============================================
-- COMMON ISSUES AND FIXES
-- ============================================

-- Issue 1: Trigger function doesn't have SECURITY DEFINER
-- Fix: The function should have SECURITY DEFINER (check query #2 above)

-- Issue 2: Email is NULL
-- Fix: The trigger should handle NULL email (updated in fix_profile_access_after_signup.sql)

-- Issue 3: RLS blocking the insert
-- Fix: The function uses SECURITY DEFINER which should bypass RLS

-- Issue 4: Constraint violation (e.g., duplicate user_id)
-- Fix: ON CONFLICT DO NOTHING should handle this

-- ============================================
-- IF TRIGGER IS FAILING, TRY THIS TEMPORARY FIX
-- ============================================
-- Make the trigger more permissive and add better error handling

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value TEXT;
  user_email TEXT;
BEGIN
  -- Get user_type from user metadata (set during signup)
  user_type_value := COALESCE(
    (NEW.raw_user_meta_data->>'user_type')::TEXT,
    'individual'
  );

  -- Get email, with fallback
  user_email := COALESCE(NEW.email, '');

  -- Only proceed if we have a valid email
  IF user_email = '' OR user_email IS NULL THEN
    RAISE WARNING 'Cannot create profile: email is NULL for user %', NEW.id;
    RETURN NEW; -- Still allow signup to succeed
  END IF;

  -- Insert into user_profiles with comprehensive error handling
  BEGIN
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
    ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate if trigger fires twice
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, that's okay
      RAISE WARNING 'Profile already exists for user %', NEW.id;
    WHEN not_null_violation THEN
      -- Missing required field
      RAISE WARNING 'Cannot create profile: missing required field for user %: %', NEW.id, SQLERRM;
    WHEN foreign_key_violation THEN
      -- Foreign key constraint violation
      RAISE WARNING 'Cannot create profile: foreign key violation for user %: %', NEW.id, SQLERRM;
    WHEN check_violation THEN
      -- Check constraint violation (e.g., invalid user_type)
      RAISE WARNING 'Cannot create profile: check constraint violation for user %: %', NEW.id, SQLERRM;
    WHEN OTHERS THEN
      -- Any other error
      RAISE WARNING 'Error creating user profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW; -- Always return NEW to allow signup to succeed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
