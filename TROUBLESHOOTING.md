# Troubleshooting Initiative Creation

If you're getting "Failed to create initiative" error, follow these steps:

## Step 1: Check Browser Console

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Try creating an initiative
4. Look for error messages - they will show the exact issue

## Common Issues and Solutions

### Issue 1: "new row violates row-level security policy"

**Problem:** RLS (Row Level Security) is blocking the insert.

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this to temporarily disable RLS for testing:
   ```sql
   ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
   ALTER TABLE changemakers DISABLE ROW LEVEL SECURITY;
   ```
3. Try creating an initiative again
4. If it works, you need to adjust your RLS policies

**For Production:** Update RLS policies to allow inserts. You can modify the policies in Supabase Dashboard → Authentication → Policies.

### Issue 2: "foreign key constraint violation" or "changemaker does not exist"

**Problem:** The changemaker referenced doesn't exist.

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this to create the default changemaker:
   ```sql
   INSERT INTO changemakers (id, name, email, organization, bio)
   VALUES (
     '00000000-0000-0000-0000-000000000001',
     'System Admin',
     'admin@mtaji.com',
     'Mtaji Tracker',
     'System administrator account'
   )
   ON CONFLICT (id) DO NOTHING;
   ```

### Issue 3: "relation 'initiatives' does not exist"

**Problem:** Database schema hasn't been set up.

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire `supabase_schema.sql` file
3. Run it
4. Verify tables exist: Go to Table Editor and check for `initiatives`, `changemakers`, `milestones` tables

### Issue 4: "permission denied" or "insufficient privileges"

**Problem:** Your API key doesn't have the right permissions.

**Solution:**
1. Make sure you're using the **anon/public** key (not service_role)
2. Check Supabase Dashboard → Settings → API
3. Verify RLS policies allow the operation

### Issue 5: Network errors or "Failed to fetch"

**Problem:** Connection issue or wrong URL.

**Solution:**
1. Check your `.env` file has correct `PUBLIC_SUPABASE_URL`
2. Verify the URL format: `https://xxxxx.supabase.co`
3. Check your internet connection
4. Check Supabase project is active (not paused)

## Quick Fix: Disable RLS for Testing

If you just want to test quickly, run this in Supabase SQL Editor:

```sql
-- Disable RLS on all tables (FOR TESTING ONLY)
ALTER TABLE changemakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- Create default changemaker if it doesn't exist
INSERT INTO changemakers (id, name, email, organization, bio)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Admin',
  'admin@mtaji.com',
  'Mtaji Tracker',
  'System administrator account'
)
ON CONFLICT (id) DO NOTHING;
```

**⚠️ Remember:** Re-enable RLS before going to production!

## Enable RLS Again (After Testing)

```sql
ALTER TABLE changemakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
```

## Check What's Happening

Run this in browser console to see detailed logs:

```javascript
// Test changemaker exists
import { supabase } from './src/lib/supabase'
supabase.from('changemakers').select('*').then(console.log)

// Test if you can insert
supabase.from('initiatives').insert({
  changemaker_id: '00000000-0000-0000-0000-000000000001',
  title: 'Test',
  description: 'Test description',
  category: 'agriculture',
  target_amount: 1000,
  raised_amount: 0,
  location: { county: 'Nairobi', constituency: '', specific_area: '', coordinates: { lat: -1.2921, lng: 36.8219 } },
  status: 'published'
}).then(console.log)
```

## Still Having Issues?

1. Check the browser console for the exact error message
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify your `.env` file has correct credentials
4. Make sure you've run the `supabase_schema.sql` file
5. Check that your Supabase project is active


