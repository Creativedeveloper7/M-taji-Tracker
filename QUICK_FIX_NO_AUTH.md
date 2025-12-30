# Quick Fix: No Authenticated User Error

## Problem
Error: "No authenticated user found. Please log in to create a political figure profile."

## Solution Options

### Option 1: Make user_id Nullable (Easiest for Testing)

Run this in Supabase SQL Editor:

```sql
-- Make user_id nullable for testing
ALTER TABLE political_figures 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow inserts without user_id (testing only)
DROP POLICY IF EXISTS "Users can create their own political figure profile" ON political_figures;

CREATE POLICY "Allow creating political figures (testing)"
  ON political_figures FOR INSERT
  WITH CHECK (true);
```

**After this, you can create political figures without authentication!**

### Option 2: Create a Test User

If you have admin access to Supabase, run `setup_test_user.sql` to create a test user and changemaker.

### Option 3: Use Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email: `test@mtaji.com`
4. Copy the user ID
5. Update a changemaker to use this user_id:

```sql
UPDATE changemakers 
SET user_id = 'your-user-id-here'
WHERE id = 'your-changemaker-id';
```

## Recommended: Option 1

For quick testing, **Option 1** is the easiest. Just make `user_id` nullable and update the RLS policy.

## After Testing

When ready for production, re-enable the NOT NULL constraint:

```sql
ALTER TABLE political_figures 
ALTER COLUMN user_id SET NOT NULL;
```

And restore the proper RLS policy.

