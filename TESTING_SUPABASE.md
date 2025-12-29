# Testing Supabase Connection

This guide will help you verify that your Supabase connection is working correctly.

## Quick Test Methods

### Method 1: Browser Console Test (Easiest)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to your app (usually `http://localhost:5173`)

3. **Open Browser DevTools** (F12 or Right-click → Inspect)

4. **Go to the Console tab**

5. **Run the test function:**
   ```javascript
   // Import and run the test
   import { testSupabaseConnection } from './src/utils/testSupabase'
   testSupabaseConnection()
   ```
   
   Or simply check the console - the test runs automatically on page load in development mode.

### Method 2: Create an Initiative Test

1. **Click "Create Initiative"** button in your app
2. **Fill out the form** with test data
3. **Submit the form**
4. **Check your Supabase Dashboard:**
   - Go to your Supabase project
   - Navigate to **Table Editor** → **initiatives**
   - You should see your new initiative there
5. **Check the Initiatives page** - your new initiative should appear

### Method 3: Check Network Tab

1. **Open Browser DevTools** → **Network tab**
2. **Reload the page**
3. **Look for requests to your Supabase URL** (e.g., `https://xxxxx.supabase.co`)
4. **Check the response:**
   - ✅ **200 OK** = Connection working
   - ❌ **401/403** = Authentication/RLS issue
   - ❌ **404** = Table doesn't exist (run schema)
   - ❌ **Network error** = Wrong URL or connection issue

### Method 4: Direct Database Query

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this query:**
   ```sql
   SELECT COUNT(*) as total_initiatives 
   FROM initiatives 
   WHERE status IN ('published', 'active', 'completed');
   ```
3. **If it works**, your database is set up correctly

## What to Look For

### ✅ Success Indicators

- Console shows: `✅ Supabase connection verified`
- No error messages in console
- Initiatives load on the page
- You can create new initiatives
- Data appears in Supabase dashboard

### ❌ Common Issues

#### 1. "Missing Supabase environment variables"
**Solution:**
- Create `.env` file in project root
- Add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server

#### 2. "relation 'initiatives' does not exist"
**Solution:**
- Run the `supabase_schema.sql` file in Supabase SQL Editor
- Make sure all tables are created

#### 3. "permission denied" or "new row violates row-level security"
**Solution:**
- Check RLS policies in Supabase
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
  ```

#### 4. "Failed to fetch" or Network errors
**Solution:**
- Check your Supabase URL is correct
- Verify your internet connection
- Check if Supabase project is active

#### 5. "Invalid API key"
**Solution:**
- Verify you're using the **anon/public** key (not service_role key)
- Check the key in Supabase Dashboard → Settings → API

## Step-by-Step Verification Checklist

- [ ] `.env` file exists with correct values
- [ ] Dev server restarted after creating `.env`
- [ ] Supabase schema has been run (`supabase_schema.sql`)
- [ ] Browser console shows no errors
- [ ] Test function runs successfully
- [ ] Can fetch initiatives from database
- [ ] Can create new initiatives
- [ ] Data appears in Supabase dashboard
- [ ] Initiatives page shows data from Supabase

## Advanced Testing

### Test Individual Functions

In browser console, you can test individual functions:

```javascript
// Test fetching initiatives
import { fetchInitiatives } from './src/services/initiatives'
fetchInitiatives().then(data => console.log('Initiatives:', data))

// Test creating an initiative
import { createInitiative } from './src/services/initiatives'
const testInitiative = {
  id: 'test-' + Date.now(),
  changemaker_id: '00000000-0000-0000-0000-000000000001',
  title: 'Test Initiative',
  description: 'This is a test',
  category: 'agriculture',
  target_amount: 100000,
  raised_amount: 0,
  location: {
    county: 'Nairobi',
    constituency: '',
    specific_area: '',
    coordinates: { lat: -1.2921, lng: 36.8219 }
  },
  project_duration: '6 months',
  expected_completion: '2024-12-31',
  milestones: [],
  reference_images: [],
  status: 'published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  payment_details: { method: 'mpesa' }
}
createInitiative(testInitiative).then(result => console.log('Created:', result))
```

## Still Having Issues?

1. **Check the console** for detailed error messages
2. **Verify environment variables** are loaded:
   ```javascript
   console.log('URL:', import.meta.env.PUBLIC_SUPABASE_URL)
   console.log('Key:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
   ```
3. **Test Supabase connection directly:**
   ```javascript
   import { supabase } from './src/lib/supabase'
   supabase.from('changemakers').select('*').then(console.log)
   ```
4. **Check Supabase Dashboard** → **Logs** for server-side errors

## Success!

Once all tests pass, you're ready to use Supabase with your application! 🎉

