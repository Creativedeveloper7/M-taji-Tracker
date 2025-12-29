# Supabase Database Setup Guide

This guide will help you set up the database tables for the Mtaji Tracker application.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Access to your Supabase SQL Editor

## Setup Steps

### Option 1: Run the Complete Schema (Recommended)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Option 2: Run Step by Step

If you prefer to run commands individually, follow these steps:

#### Step 1: Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

#### Step 2: Create Tables
Run each table creation command from `supabase_schema.sql` in order:
1. `changemakers` table
2. `initiatives` table
3. `milestones` table
4. `donations` table (optional)

#### Step 3: Create Indexes
Run all the `CREATE INDEX` commands

#### Step 4: Create Functions and Triggers
Run the function and trigger creation commands

#### Step 5: Set Up Row Level Security
Run all the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` commands

## Database Structure

### Tables Created

1. **changemakers** - Stores changemaker/user information
2. **initiatives** - Main table for storing initiative data
3. **milestones** - Stores project milestones linked to initiatives
4. **donations** - Stores donation/support records (optional)

### Key Features

- ✅ UUID primary keys
- ✅ Foreign key relationships
- ✅ JSONB for flexible data (location, payment_details)
- ✅ Array support for reference_images
- ✅ Automatic timestamp updates
- ✅ Row Level Security (RLS) policies
- ✅ Automatic raised_amount calculation from donations
- ✅ Indexes for performance
- ✅ Helpful views for querying

## Environment Variables

After setting up the database, make sure you have these environment variables set:

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under **API**.

## Testing the Setup

After running the schema, you can test with these queries:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis');

-- Test insert (will fail if RLS is too restrictive - adjust policies as needed)
INSERT INTO changemakers (name, email) 
VALUES ('Test User', 'test@example.com');
```

## Notes

- **Row Level Security (RLS)**: The schema includes RLS policies. You may need to adjust these based on your authentication setup.
- **Authentication**: The RLS policies assume you're using Supabase Auth. If not, you'll need to modify the policies.
- **PostGIS**: The PostGIS extension is included for future geospatial features but isn't strictly required for the current schema.

## Troubleshooting

### Error: "permission denied for schema public"
- Make sure you're running as a database superuser or have the necessary permissions

### Error: "extension already exists"
- This is fine, the `IF NOT EXISTS` clause handles this

### RLS blocking queries
- You may need to temporarily disable RLS for testing:
  ```sql
  ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
  ```
- Remember to re-enable it after testing!

## Next Steps

After setting up the database:
1. Update your application code to use Supabase instead of localStorage
2. Create API functions to interact with the database
3. Set up proper authentication if not already done
4. Test CRUD operations

