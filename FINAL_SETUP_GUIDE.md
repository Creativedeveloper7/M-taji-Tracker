# Final Setup Guide - Fix All Registration Issues

## Critical Steps (Do These in Order)

### Step 1: Run the Complete Fix SQL

**Open Supabase SQL Editor and run `fix_profile_access_after_signup.sql`**

This file contains:
1. ✅ Helper function to fetch profiles (bypasses RLS)
2. ✅ Automatic profile creation trigger (with error handling)
3. ✅ All necessary permissions

### Step 2: Verify Setup

**Run `verify_setup.sql` to check everything is configured correctly**

Expected results:
- ✅ Trigger exists and is enabled
- ✅ Functions have SECURITY DEFINER
- ✅ All roles have EXECUTE permissions
- ✅ RLS policies exist

### Step 3: Check Supabase Logs

After running the SQL:
1. Go to Supabase Dashboard → Logs → Postgres Logs
2. Look for any errors related to `handle_new_user`
3. If you see warnings (not errors), that's okay - the trigger is working

## What's Happening

### The Problem
1. User signs up → Supabase creates user in `auth.users`
2. Trigger should create profile in `user_profiles`
3. But trigger might be failing silently
4. Frontend tries to fetch profile → Gets RLS error (no session)
5. Frontend tries to create profile manually → Gets RLS error (no session)

### The Solution
1. **Trigger with error handling** - Creates profile automatically, logs warnings instead of failing
2. **RPC function** - Allows fetching profile without session (bypasses RLS)
3. **Better error handling** - Frontend handles cases where trigger didn't work

## If Still Getting Errors

### Error: "function get_user_profile_by_user_id does not exist"
- **Fix:** Re-run `fix_profile_access_after_signup.sql`
- **Verify:** Run `SELECT proname FROM pg_proc WHERE proname = 'get_user_profile_by_user_id';`

### Error: "401 Unauthorized" on RPC call
- **Fix:** Check function permissions in `verify_setup.sql`
- **Fix:** Make sure you ran the GRANT statements in the SQL file

### Error: "42501 RLS policy violation"
- **Cause:** Trigger didn't create profile, and manual insert is blocked by RLS
- **Fix:** 
  1. Check Supabase logs to see why trigger failed
  2. Verify trigger exists: Run `verify_setup.sql`
  3. Check if user was created: `SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;`
  4. Check if profile exists: `SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1;`

### Error: "429 Too Many Requests"
- **Cause:** You're trying to sign up too quickly (rate limiting)
- **Fix:** Wait 30+ seconds between signup attempts

## Testing

1. **Try registering a new user**
2. **Check browser console** - Should see RPC attempts, not errors
3. **Check Supabase logs** - Should see trigger warnings (not errors) if profile creation had issues
4. **Verify profile was created:**
   ```sql
   SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1;
   ```

## Success Indicators

✅ User can sign up without 500 errors
✅ Profile is created automatically (check Supabase logs)
✅ Registration completes successfully
✅ User receives email confirmation

## Still Having Issues?

1. **Check Supabase Postgres Logs** - This will show the exact error
2. **Run diagnostic queries** in `verify_setup.sql`
3. **Temporarily disable trigger** to test:
   ```sql
   ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
   ```
   (Then manually create profiles after signup to test the rest of the flow)

4. **Contact support** with:
   - Error messages from browser console
   - Supabase Postgres logs
   - Results from `verify_setup.sql`
