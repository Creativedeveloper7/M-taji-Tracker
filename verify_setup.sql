-- ============================================
-- VERIFY SETUP - Run this to check if everything is configured
-- ============================================

-- 1. Check if trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled 
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check if function has SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as has_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER is set'
    ELSE '❌ SECURITY DEFINER is NOT set - THIS IS THE PROBLEM!'
  END as status
FROM pg_proc
WHERE proname IN ('handle_new_user', 'get_user_profile_by_user_id');

-- 3. Check function permissions
SELECT 
  p.proname as function_name,
  r.rolname as role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname IN ('handle_new_user', 'get_user_profile_by_user_id')
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY p.proname, r.rolname;

-- 4. Check if user_profiles table exists
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- 5. Check RLS policies on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 6. Test the RPC function (replace with a real user_id if you have one)
-- SELECT * FROM public.get_user_profile_by_user_id('00000000-0000-0000-0000-000000000000'::uuid);

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. Trigger should exist and be enabled
-- 2. Both functions should have prosecdef = true
-- 3. All three roles (anon, authenticated, service_role) should have EXECUTE permission
-- 4. user_profiles table should exist with RLS enabled
-- 5. Should have policies for SELECT, INSERT, UPDATE
