# Simple Setup Instructions - Fix Registration Issues

## The Problem
The trigger that automatically creates user profiles isn't working, causing registration to fail.

## The Solution - ONE Script Fixes Everything

### Step 1: Run the Complete Fix Script

1. **Open Supabase Dashboard**
   - Go to your project
   - Click **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Copy and Run the Script**
   - Open `COMPLETE_FIX_ALL_IN_ONE.sql` from your project
   - Copy **ALL** the contents
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Check the Results**
   - You should see "Success" message
   - Look for the verification notice at the end showing ✅ checkmarks
   - If you see ❌, there's an issue - check the error messages

### Step 2: Verify It Worked

After running the script, run this query to verify:

```sql
-- Check trigger exists
SELECT tgname, CASE tgenabled WHEN 'O' THEN '✅ Enabled' ELSE '❌ Disabled' END 
FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check functions have SECURITY DEFINER
SELECT proname, CASE WHEN prosecdef THEN '✅ YES' ELSE '❌ NO' END 
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'get_user_profile_by_user_id');
```

You should see:
- ✅ Trigger exists and is enabled
- ✅ Both functions have SECURITY DEFINER

### Step 3: Test Registration

1. **Wait 30+ seconds** (to avoid rate limiting)
2. **Try registering a new user**
3. **Check Supabase Logs**:
   - Go to Dashboard → Logs → Postgres Logs
   - Look for messages like "Successfully created profile for user..."
   - If you see warnings, that's okay - the trigger is working

### Step 4: If Still Not Working

**Check Supabase Postgres Logs** - This will show the exact error:

1. Go to Supabase Dashboard → Logs → Postgres Logs
2. Look for errors related to `handle_new_user` or `user_profiles`
3. The error message will tell you exactly what's wrong

**Common Issues:**

- **"relation user_profiles does not exist"**
  - Fix: Run `supabase_schema_multitenant_auth.sql` first to create the table

- **"permission denied"**
  - Fix: Re-run `COMPLETE_FIX_ALL_IN_ONE.sql` - the GRANT statements should fix this

- **"function does not exist"**
  - Fix: Re-run `COMPLETE_FIX_ALL_IN_ONE.sql` - it drops and recreates everything

## What This Script Does

1. ✅ Drops old functions/triggers (clean slate)
2. ✅ Creates trigger function with error handling
3. ✅ Creates trigger on auth.users
4. ✅ Creates RPC helper function
5. ✅ Grants all necessary permissions
6. ✅ Verifies everything is set up correctly

## Success Indicators

After running the script and testing:

✅ Registration completes without errors
✅ Profile is created automatically (check Supabase logs)
✅ No RLS policy violations
✅ User receives email confirmation

## Still Having Issues?

If you've run `COMPLETE_FIX_ALL_IN_ONE.sql` and it's still not working:

1. **Share the error message** from browser console
2. **Share the Postgres Logs** from Supabase (Dashboard → Logs → Postgres Logs)
3. **Share the results** of the verification queries above

The logs will show exactly what's failing.
