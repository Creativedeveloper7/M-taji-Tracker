# Fix: Invalid UUID Error for Political Figures

## Problem
Error: `invalid input syntax for type uuid: "user-placeholder"`

This happens because the code was using a placeholder string instead of a valid UUID.

## Solution

The code has been updated to:
1. **Try to get authenticated user** from Supabase auth
2. **Fallback to changemaker's user_id** if no auth user (for testing)
3. **Show helpful error** if neither is available

## Quick Fix Options

### Option 1: Create a Test User (Recommended for Testing)

Run this in Supabase SQL Editor to create a test user:

```sql
-- Create a test user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create a changemaker linked to this user
INSERT INTO changemakers (id, user_id, name, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Test Changemaker',
  'test@example.com'
) ON CONFLICT (id) DO NOTHING;
```

### Option 2: Make user_id Nullable (Temporary)

If you want to allow creating political figures without auth (for testing), modify the schema:

```sql
-- Make user_id nullable temporarily
ALTER TABLE political_figures 
ALTER COLUMN user_id DROP NOT NULL;
```

**Note:** This should only be for testing. Re-add NOT NULL constraint for production.

### Option 3: Use Existing Changemaker

If you already have changemakers in your database, the code will automatically try to use their `user_id`.

## Verify

After applying a fix, try registering a political figure again. The error should be resolved.

## For Production

In production, you should:
1. Require users to be authenticated
2. Use `supabase.auth.getUser()` to get the current user
3. Never use placeholder UUIDs

