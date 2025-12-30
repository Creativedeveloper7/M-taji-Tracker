-- Setup Test User and Changemaker for Political Figures
-- Run this in your Supabase SQL Editor

-- Step 1: Create a test user in auth.users
-- Note: This requires service_role key or admin access
-- If you can't insert directly, use Supabase Auth API or Dashboard

-- Option A: If you have admin access, run this:
INSERT INTO auth.users (
  id,
  instance_id,
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
  '00000000-0000-0000-0000-000000000000',
  'test@mtaji.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a changemaker linked to this user
INSERT INTO changemakers (
  id,
  user_id,
  name,
  email,
  organization,
  bio
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Test Changemaker',
  'test@mtaji.com',
  'Mtaji Tracker',
  'Test account for development'
) ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id;

-- Step 3: Verify the setup
SELECT 
  c.id as changemaker_id,
  c.name,
  c.user_id,
  u.email as user_email
FROM changemakers c
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.id = '00000000-0000-0000-0000-000000000001';

-- If the above doesn't work (auth.users insert requires admin), use this alternative:

