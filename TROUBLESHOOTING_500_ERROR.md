# Troubleshooting "Database error saving new user" (500 Error)

## Error Message
```
Database error saving new user
POST .../auth/v1/signup 500 (Internal Server Error)
```

## Root Cause
This error occurs when the database trigger (`handle_new_user`) fails during user signup. The trigger is supposed to automatically create a `user_profiles` record, but if it throws an error, Supabase will fail the entire signup.

## Immediate Fix

**Run the updated `fix_profile_access_after_signup.sql` file** - it now includes better error handling that won't fail the signup even if the profile creation has issues.

## Diagnostic Steps

1. **Check if the trigger exists:**
   ```sql
   SELECT tgname, tgrelid::regclass, proname
   FROM pg_trigger t
   JOIN pg_proc p ON t.tgfoid = p.oid
   WHERE tgname = 'on_auth_user_created';
   ```

2. **Check the function definition:**
   ```sql
   SELECT proname, prosecdef, prosrc
   FROM pg_proc
   WHERE proname = 'handle_new_user';
   ```
   - `prosecdef` should be `true` (SECURITY DEFINER)
   - `prosrc` should show the function code

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for errors related to `handle_new_user` or `user_profiles`
   - The logs will show the exact error message

4. **Check table structure:**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'user_profiles'
   ORDER BY ordinal_position;
   ```

## Common Issues and Fixes

### Issue 1: Trigger Function Missing SECURITY DEFINER
**Symptom:** Function exists but doesn't have elevated privileges

**Fix:** Re-run `fix_profile_access_after_signup.sql` which includes `SECURITY DEFINER`

### Issue 2: Email is NULL
**Symptom:** Trigger tries to insert NULL email, violating NOT NULL constraint

**Fix:** The updated trigger now checks for NULL email and handles it gracefully

### Issue 3: Invalid user_type
**Symptom:** user_type from metadata doesn't match allowed values

**Fix:** The trigger now defaults to 'individual' if user_type is invalid

### Issue 4: RLS Still Blocking
**Symptom:** Even with SECURITY DEFINER, RLS might be interfering

**Fix:** Ensure the function has `SECURITY DEFINER` and check RLS policies:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';
```

### Issue 5: Table Doesn't Exist
**Symptom:** `user_profiles` table hasn't been created

**Fix:** Run `supabase_schema_multitenant_auth.sql` first to create all tables

## Updated Trigger Function

The new trigger function includes:
- ✅ Email validation (checks for NULL/empty)
- ✅ Comprehensive error handling (catches all exception types)
- ✅ Always returns NEW (never fails the signup)
- ✅ Logs warnings instead of throwing errors
- ✅ Handles duplicate profiles gracefully

## Testing the Fix

After running the updated SQL:

1. Try registering a new user
2. Check Supabase logs for any warnings (not errors)
3. Verify the profile was created:
   ```sql
   SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1;
   ```

## If Still Failing

If you're still getting 500 errors after running the updated SQL:

1. **Check Supabase Postgres Logs** for the exact error
2. **Run the diagnostic queries** in `diagnose_trigger_issue.sql`
3. **Temporarily disable the trigger** to test if signup works:
   ```sql
   ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
   ```
   (Then manually create profiles after signup)

4. **Contact Supabase Support** with the error logs if the issue persists

## Next Steps

Once the trigger is working:
- Users will be able to sign up successfully
- Profiles will be created automatically
- The frontend can fetch profiles using the `get_user_profile_by_user_id` function
