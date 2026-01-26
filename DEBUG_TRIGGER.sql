-- ============================================
-- DEBUG TRIGGER - Find out why it's not working
-- ============================================

-- 1. Check if trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled 
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    ELSE 'Unknown'
  END as status,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check function definition and security
SELECT 
  proname as function_name,
  prosecdef as has_security_definer,
  proconfig as function_config,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check if we can insert into user_profiles as postgres role
-- This simulates what the trigger should do
DO $$
DECLARE
  test_result TEXT;
BEGIN
  BEGIN
    -- Try to insert a test record (will fail due to FK, but we'll see the error)
    INSERT INTO public.user_profiles (
      user_id,
      email,
      user_type,
      verification_status,
      kyc_status,
      profile_visibility
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'test@test.com',
      'individual',
      'pending',
      'not_started',
      'public'
    );
    
    test_result := 'Insert succeeded';
  EXCEPTION
    WHEN foreign_key_violation THEN
      test_result := 'FK violation (expected - user doesnt exist)';
    WHEN OTHERS THEN
      test_result := 'Error: ' || SQLERRM;
  END;
  
  RAISE NOTICE 'Insert test result: %', test_result;
END;
$$;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Check table RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 6. Check recent users and profiles
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  up.id as profile_id,
  up.user_type,
  up.created_at as profile_created
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;
