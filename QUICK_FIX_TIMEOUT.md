# Quick Fix for Supabase Timeout Issues

If you're seeing "Request timeout" errors, try these solutions:

## Solution 1: Disable RLS (Quick Test)

The timeout is likely caused by Row Level Security (RLS) policies blocking the requests. 

Run this in your Supabase SQL Editor:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE changemakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
```

Then refresh your app and try again.

## Solution 2: Check Supabase Project Status

1. Go to your Supabase Dashboard
2. Check if your project is **Active** (not paused)
3. If paused, click "Restore" to activate it

## Solution 3: Test Connection Directly

Open browser console and run:

```javascript
import { supabase } from './src/lib/supabase'

// Test basic connection
supabase.from('changemakers').select('id').limit(1).then(result => {
  console.log('Connection test:', result)
})
```

## Solution 4: Check Network Tab

1. Open DevTools → Network tab
2. Try loading initiatives
3. Look for requests to `jdddchjbglilkfrlenci.supabase.co`
4. Check the status code:
   - **200** = Working, but might be RLS issue
   - **401/403** = Authentication/RLS blocking
   - **Timeout** = Network or project issue

## Solution 5: Verify Environment Variables

Make sure your `.env` file in the project root has:

```env
VITE_SUPABASE_URL=https://jdddchjbglilkfrlenci.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

Then **restart your dev server**.

## Most Likely Issue: RLS Policies

The timeout is probably because RLS is blocking anonymous requests. The quickest fix is Solution 1 above.

After disabling RLS, the app should load immediately. Once it's working, you can re-enable RLS and adjust the policies properly.

