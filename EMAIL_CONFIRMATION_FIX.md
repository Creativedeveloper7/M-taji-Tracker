# Fix Email Confirmation Error

## Error Message
```
AuthApiError: Email not confirmed
```

## Root Cause
Supabase requires email confirmation before users can sign in. When we try to sign in immediately after signup, it fails because the email hasn't been confirmed yet.

## Solution Options

### Option 1: Use Database Trigger (Recommended)
This automatically creates the user profile when a user signs up, bypassing RLS issues.

**Run this SQL in Supabase SQL Editor:**

```sql
-- See create_user_profile_trigger.sql for the complete trigger setup
```

This trigger will:
- Automatically create `user_profiles` when a user signs up
- Bypass RLS because it uses `SECURITY DEFINER`
- Extract `user_type` from signup metadata

### Option 2: Disable Email Confirmation (Development Only)
For development/testing, you can disable email confirmation:

1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", disable "Enable email confirmations"
3. ⚠️ **Only do this for development!** Re-enable for production.

### Option 3: Fix RLS Policies + Handle Email Confirmation Flow
1. Run `fix_rls_user_profiles_insert.sql` to add INSERT policies
2. Update the registration flow to:
   - Create user profile after email confirmation
   - Show a message asking user to confirm email first
   - Redirect to login after confirmation

## Recommended Approach

**Use Option 1 (Database Trigger)** because:
- ✅ Works even if email isn't confirmed
- ✅ More secure (uses SECURITY DEFINER)
- ✅ Automatic - no code changes needed
- ✅ Handles edge cases better

## Steps to Implement Trigger Solution

1. **Run the trigger SQL:**
   ```sql
   -- Copy contents from create_user_profile_trigger.sql
   ```

2. **Test registration:**
   - Try registering a new user
   - The profile should be created automatically
   - User will receive email confirmation link
   - After confirming email, they can sign in

3. **Update registration success page:**
   - Show message about email confirmation
   - Provide link to resend confirmation email if needed

## Current Code Behavior

The code has been updated to:
- Wait for trigger-created profile (with retry logic)
- Fall back to manual creation if trigger doesn't work
- Provide helpful error messages if RLS issues persist

## Next Steps

1. Run `create_user_profile_trigger.sql` in Supabase
2. Test registration
3. If still having issues, check Supabase logs for trigger errors
