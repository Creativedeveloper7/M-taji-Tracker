# Quick Fix: Create Political Figures Table

## Problem
Error: `Could not find the table 'public.political_figures' in the schema cache`

This means the database table hasn't been created yet.

## Solution

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run the Migration

Copy and paste the entire contents of `supabase_schema_political_figures.sql` into the SQL Editor, then click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).

### Step 3: Verify

After running, verify the table was created:

```sql
SELECT * FROM political_figures LIMIT 1;
```

You should see an empty result (no error means the table exists).

## Quick SQL (Alternative)

If you prefer, just run this single command:

```sql
-- Create political_figures table
CREATE TABLE IF NOT EXISTS political_figures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('governor', 'mp', 'senator', 'mca')),
  county TEXT,
  constituency TEXT,
  ward TEXT,
  term_start DATE NOT NULL,
  term_end DATE NOT NULL,
  term_years INTEGER NOT NULL DEFAULT 5,
  manifesto JSONB NOT NULL DEFAULT '{}'::jsonb,
  commissioned_projects UUID[] DEFAULT ARRAY[]::UUID[],
  total_investment DECIMAL(15, 2) NOT NULL DEFAULT 0,
  projects_by_category JSONB DEFAULT '{"agriculture": 0, "water": 0, "health": 0, "education": 0, "infrastructure": 0, "economic": 0}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seeking_reelection')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE political_figures ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Public can view active political figures"
  ON political_figures FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage their own political figure profile"
  ON political_figures FOR ALL
  USING (auth.uid() = user_id);
```

## After Running

1. Refresh your app
2. Try registering a political figure again
3. The error should be gone!

## Full Migration

For the complete schema with all indexes and triggers, use the full file:
- `supabase_schema_political_figures.sql`

