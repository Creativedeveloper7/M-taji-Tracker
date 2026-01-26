-- ============================================
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================
-- This trigger automatically creates a user_profile when a user signs up
-- This bypasses RLS issues during registration
-- ============================================

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value TEXT;
BEGIN
  -- Get user_type from user metadata (set during signup)
  user_type_value := COALESCE(
    (NEW.raw_user_meta_data->>'user_type')::TEXT,
    'individual'
  );

  -- Insert into user_profiles
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
    NEW.email,
    user_type_value,
    'pending',
    'not_started',
    'public'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================
-- The function needs to be able to insert into user_profiles
-- SECURITY DEFINER allows it to bypass RLS

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- ============================================
-- END OF TRIGGER SETUP
-- ============================================
