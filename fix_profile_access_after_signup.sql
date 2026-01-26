-- ============================================
-- FIX: Allow Profile Access After Signup
-- ============================================
-- This fixes the issue where we can't SELECT user_profiles
-- immediately after signup because there's no session yet
-- ============================================

-- 1. Create a function to get profile by user_id (bypasses RLS)
-- Drop and recreate to ensure clean state
DROP FUNCTION IF EXISTS public.get_user_profile_by_user_id(UUID);

CREATE FUNCTION public.get_user_profile_by_user_id(p_user_id UUID)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_user_id(UUID) TO service_role;
-- Also grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Ensure the trigger is set up (from create_user_profile_trigger.sql)
-- Function to create user profile automatically
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

  -- Get email, with validation
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
      -- Any other error - log it but don't fail signup
      RAISE WARNING 'Error creating user profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW; -- Always return NEW to allow signup to succeed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 3. Also ensure INSERT policy exists (as fallback)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- END OF FIX
-- ============================================
