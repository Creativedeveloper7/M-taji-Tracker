# Fix RLS Policy Error - Step by Step Instructions

## Error Message
```
new row violates row-level security policy for table "user_profiles"
```

## Root Cause
The `user_profiles` table is missing an INSERT policy that allows users to create their own profile during registration.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run the Fix SQL
Copy and paste the following SQL into the editor and click **Run**:

```sql
-- ============================================
-- FIX: Add Missing INSERT Policy for user_profiles
-- ============================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create INSERT policy for user_profiles
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Also ensure related tables have INSERT policies
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

-- Verification Documents INSERT policy
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

-- Onboarding Progress INSERT policy
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
```

### Step 3: Verify Policies Were Created
Run this query to verify the policies exist:

```sql
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

You should see policies for:
- SELECT (view own profile)
- INSERT (insert own profile) ← **This is the one that was missing**
- UPDATE (update own profile)

### Step 4: Test Registration
1. Try registering a new government entity or organization
2. The registration should now complete successfully

## Alternative: If Still Getting Errors

If you're still getting RLS errors after running the fix, try this more permissive policy temporarily for testing:

```sql
-- TEMPORARY: More permissive policy for testing
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (true);  -- Allows any authenticated user to insert

-- After testing, replace with the secure version above
```

**⚠️ Warning**: The permissive policy above is less secure. Only use for testing, then replace with the secure version.

## What Changed in the Code

I've also updated the registration service to:
1. Ensure the user session is active before inserting the profile
2. Sign in the user if `signUp` didn't create a session automatically
3. Add better error logging

## Still Having Issues?

If you continue to get RLS errors:
1. Check that you're running the SQL in the correct Supabase project
2. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';`
3. Check the browser console for detailed error messages
4. Verify your Supabase environment variables are correct
