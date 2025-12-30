# Fix: Missing satellite_snapshots Column

## Problem
The job is failing with:
```
Could not find the 'satellite_snapshots' column of 'initiatives' in the schema cache
```

This means the database column hasn't been created yet.

## Solution

### Step 1: Run the Migration SQL

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Click **New Query**
   - Copy and paste the contents of `ADD_SATELLITE_COLUMN.sql`
   - Click **Run** (or press `Ctrl+Enter`)

3. **Verify**
   - You should see: "Column satellite_snapshots added successfully"
   - Or: "Column satellite_snapshots already exists" (if it was already there)

### Step 2: Test Again

After running the migration, test the job:

```bash
npm run job:satellite
```

It should now work! ✅

## Alternative: Quick SQL

If you prefer, just run this single command in Supabase SQL Editor:

```sql
ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS satellite_snapshots JSONB DEFAULT '[]'::jsonb;
```

## What This Does

- Adds a `satellite_snapshots` column to the `initiatives` table
- Sets default value to empty array `[]`
- Stores JSONB data (array of snapshot objects)
- Safe to run multiple times (won't error if column exists)

## Next Steps

After adding the column:
1. The job will be able to save snapshots
2. Snapshots will be stored in the database
3. You can view them in the Satellite Monitor component

