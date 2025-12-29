# Supabase Integration Guide

This guide will help you connect your Mtaji Tracker application to Supabase.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. The database schema has been set up (see `SUPABASE_SETUP.md`)

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (this is your `PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `PUBLIC_SUPABASE_ANON_KEY`)

### 2. Set Up Environment Variables

Create a `.env` file in the root of your project (or `.env.local` for local development):

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** 
- The `PUBLIC_` prefix is required for Vite to expose these variables to the client
- Never commit your `.env` file to version control
- The `.env.example` file is provided as a template

### 3. Restart Your Development Server

After creating/updating your `.env` file, restart your development server:

```bash
npm run dev
```

## How It Works

### Service Layer

The application uses a service layer (`src/services/initiatives.ts`) that handles all Supabase interactions:

- **`fetchInitiatives()`** - Fetches all published/active initiatives with their milestones
- **`fetchInitiativeById(id)`** - Fetches a single initiative by ID
- **`createInitiative(initiative)`** - Creates a new initiative and its milestones
- **`updateInitiative(initiative)`** - Updates an existing initiative
- **`deleteInitiative(id)`** - Deletes an initiative

### Data Flow

1. **Home Page (`src/pages/Home.tsx`)**:
   - Fetches initiatives from Supabase on mount
   - Saves new initiatives to Supabase when created
   - Displays loading and error states

2. **Initiatives Page (`src/pages/Initiatives.tsx`)**:
   - Fetches initiatives from Supabase
   - Combines with sample data for backward compatibility
   - Auto-refreshes when page becomes visible

3. **Initiative Form (`src/components/InitiativeForm.tsx`)**:
   - Creates initiative data structure
   - Passes to parent component which saves to Supabase

### Milestones Handling

Milestones are stored in a separate `milestones` table and are:
- Automatically fetched when loading initiatives
- Created/updated when saving initiatives
- Linked to initiatives via `initiative_id` foreign key

## Testing the Integration

1. **Check Console**: Open browser DevTools and check for any Supabase connection errors
2. **Create an Initiative**: Try creating a new initiative and verify it appears in Supabase
3. **View in Supabase**: Go to your Supabase dashboard → Table Editor to see your data

## Troubleshooting

### "Missing Supabase environment variables" Warning

- Make sure your `.env` file exists in the project root
- Verify the variable names start with `PUBLIC_`
- Restart your dev server after creating/updating `.env`

### "Failed to load initiatives" Error

- Check that your Supabase URL and key are correct
- Verify the database schema has been set up (run `supabase_schema.sql`)
- Check Row Level Security (RLS) policies - you may need to adjust them for testing
- Check browser console for detailed error messages

### RLS (Row Level Security) Issues

If you're having trouble reading/writing data:

1. **For Testing**: Temporarily disable RLS:
   ```sql
   ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
   ```

2. **For Production**: Adjust RLS policies in Supabase SQL Editor to match your authentication setup

### Network Errors

- Check that your Supabase project is active
- Verify your internet connection
- Check Supabase status page if issues persist

## Next Steps

1. **Authentication**: Set up Supabase Auth for user management
2. **Real-time Updates**: Use Supabase Realtime to sync data across clients
3. **File Storage**: Use Supabase Storage for initiative images
4. **Optimization**: Add caching and pagination for large datasets

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Support

For issues or questions:
- Check [Supabase Documentation](https://supabase.com/docs)
- Review the service layer code in `src/services/initiatives.ts`
- Check browser console for detailed error messages

