-- ============================================
-- MANUAL TRIGGER TEST
-- ============================================
-- Run this to test if the trigger function works
-- Replace the user_id with an actual user from auth.users
-- ============================================

-- First, check if you have any users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Then test the trigger function manually
-- Replace 'YOUR_USER_ID_HERE' with an actual user_id from above
/*
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'::uuid;
  test_email TEXT := 'test@example.com';
  test_user_type TEXT := 'government';
BEGIN
  -- Simulate what the trigger does
  INSERT INTO public.user_profiles (
    user_id,
    email,
    user_type,
    verification_status,
    kyc_status,
    profile_visibility
  )
  VALUES (
    test_user_id,
    test_email,
    test_user_type,
    'pending',
    'not_started',
    'public'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Test insert completed';
END;
$$;
*/

-- Check if profile was created
-- SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;
