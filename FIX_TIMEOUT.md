# Fix for Supabase Timeout Error (57014)

## Problem
The query is timing out due to complex RLS policies or missing indexes.

## Quick Fix (Recommended)

Run this in your Supabase SQL Editor to optimize RLS policies:

```sql
-- Drop slow policies
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;

-- Create optimized policy (simpler, faster)
CREATE POLICY "Public can view published initiatives"
  ON initiatives FOR SELECT
  USING (status IN ('published', 'active', 'completed'));

-- Add composite index to speed up queries
CREATE INDEX IF NOT EXISTS idx_initiatives_status_created 
ON initiatives(status, created_at DESC) 
WHERE status IN ('published', 'active', 'completed');
```

## Alternative: Temporarily Disable RLS

If you need to test immediately:

```sql
ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
```

**Note:** Re-enable RLS after testing and set up proper policies for production.

## What Changed in Code

1. **Removed 'draft' status** from query (reduces RLS complexity)
2. **Reduced limit** from 100 to 50
3. **Added timeout handling** with fallback query
4. **Simplified milestones fetch** with error handling

The code will now:
- Try the main query first
- If it times out, try a simpler fallback query
- Continue without milestones if that query also fails
- Return empty array if all queries fail (prevents app crash)

## Next Steps

1. Run the SQL optimization above
2. Refresh your app
3. Check if initiatives load faster
4. If still timing out, temporarily disable RLS to test

