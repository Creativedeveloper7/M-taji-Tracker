# Quick Fix: Environment Variables Not Loading

## Problem
The server can't find environment variables because Node.js doesn't automatically load `.env` files.

## Solution

### Option 1: Add to Existing .env File (Recommended)

Add these lines to your existing `.env` file in the project root:

```env
# Server-side Supabase (for background jobs)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Satellite Service
USE_MOCK_SATELLITE=true
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Server Port
PORT=3001
```

**Get your Service Role Key:**
- Go to Supabase Dashboard → Settings → API
- Copy the **service_role** key (not the anon key!)
- ⚠️ Never expose this in client-side code!

### Option 2: Install Dependencies

After adding the variables, install the new dependency:

```bash
npm install
```

This will install `dotenv` which loads the `.env` file.

### Option 3: Verify .env File Location

Make sure your `.env` file is in the project root (same level as `package.json`):

```
project/
├── .env          ← Should be here
├── package.json
├── server/
└── src/
```

## Test

After setting up, try running the server again:

```bash
npm run server
```

Or test the job directly:

```bash
npm run job:satellite
```

## Troubleshooting

**Still getting "environment variable is required"?**

1. Check `.env` file exists in project root
2. Verify variable names match exactly (case-sensitive)
3. Restart your terminal/command prompt
4. Check for typos in variable names

**"Cannot find module 'dotenv'"?**

Run:
```bash
npm install
```

