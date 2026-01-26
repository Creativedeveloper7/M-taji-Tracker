-- ============================================
-- FIX: Add Missing INSERT Policy for user_profiles
-- ============================================
-- This fixes the RLS policy violation error:
-- "new row violates row-level security policy for table 'user_profiles'"
-- ============================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create INSERT policy for user_profiles
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Also ensure organizations and government_entities have INSERT policies
-- ============================================

-- Organizations INSERT policy
DROP POLICY IF EXISTS "Organizations can insert their own data" ON organizations;
CREATE POLICY "Organizations can insert their own data"
  ON organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = organizations.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Government Entities INSERT policy
DROP POLICY IF EXISTS "Government entities can insert their own data" ON government_entities;
CREATE POLICY "Government entities can insert their own data"
  ON government_entities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = government_entities.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Verification Documents INSERT policy (if missing)
DROP POLICY IF EXISTS "Users can upload their own documents" ON verification_documents;
CREATE POLICY "Users can upload their own documents"
  ON verification_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = verification_documents.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Onboarding Progress INSERT policy (if missing)
DROP POLICY IF EXISTS "Users can create their own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can create their own onboarding progress"
  ON onboarding_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = onboarding_progress.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- END OF FIX
-- ============================================
