# Setup Instructions for Multi-Tenant Authentication

## Critical: Run This SQL First!

**You MUST run the SQL file `fix_profile_access_after_signup.sql` in your Supabase SQL Editor before registration will work.**

### Steps:

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Run the Fix SQL**
   - Open the file `fix_profile_access_after_signup.sql` from your project
   - Copy ALL the contents
   - Paste into the Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify It Worked**
   - You should see "Success. No rows returned" or similar
   - Check for any errors in red
   - If there are errors, read them carefully and fix any issues

## What This SQL Does

1. **Creates a helper function** (`get_user_profile_by_user_id`) that bypasses RLS to fetch profiles
   - This allows the frontend to get the profile even without a session
   - Uses `SECURITY DEFINER` to bypass Row-Level Security

2. **Sets up the automatic profile creation trigger**
   - When a user signs up, the trigger automatically creates their `user_profiles` record
   - This happens server-side, so it bypasses RLS restrictions

3. **Ensures INSERT policy exists** (as a fallback)

## Why This Is Needed

When a user signs up:
- Supabase creates the user in `auth.users`
- But email confirmation is required before they can sign in
- Without a session, `auth.uid()` is `null`
- RLS policies check `auth.uid() = user_id`, which fails
- So we can't SELECT or INSERT into `user_profiles` from the client

The trigger solves this by:
- Running server-side with `SECURITY DEFINER`
- Automatically creating the profile when the user is created
- Bypassing RLS because it runs with elevated privileges

The helper function allows us to:
- Fetch the profile that was created by the trigger
- Even without an active session
- Using `SECURITY DEFINER` to bypass RLS

## Troubleshooting

### Error: "function get_user_profile_by_user_id does not exist"
- Make sure you ran the entire `fix_profile_access_after_signup.sql` file
- Check that the function was created: Run `SELECT proname FROM pg_proc WHERE proname = 'get_user_profile_by_user_id';`

### Error: "trigger on_auth_user_created does not exist"
- The trigger should be created by the SQL file
- Check: Run `SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Still getting RLS errors
- Make sure RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';`
- Verify the trigger function has `SECURITY DEFINER`: `SELECT prosecdef FROM pg_proc WHERE proname = 'handle_new_user';`
- Check the helper function: `SELECT prosecdef FROM pg_proc WHERE proname = 'get_user_profile_by_user_id';`

### Profile not being created
- Check Supabase logs for trigger errors
- Verify the trigger is firing: Check `auth.users` table for new users
- Manually test the trigger function if needed

## Next Steps

After running the SQL:
1. Try registering a new user
2. The registration should complete successfully
3. The user will receive an email confirmation link
4. After confirming email, they can sign in
