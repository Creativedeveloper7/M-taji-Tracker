# Database Setup Checklist

This document verifies that all required database tables and storage buckets exist for the registration and initiative functionality.

## ✅ Required Database Tables

### Core Authentication & User Management
- [x] **user_profiles** - Central user profile table
  - Location: `supabase_schema_multitenant_auth.sql` (lines 18-48)
  - Status: ✅ Defined
  
- [x] **organizations** - Social organization profiles
  - Location: `supabase_schema_multitenant_auth.sql` (lines 53-112)
  - Status: ✅ Defined
  
- [x] **government_entities** - Government entity profiles
  - Location: `supabase_schema_multitenant_auth.sql` (lines 117-180)
  - Status: ✅ Defined

- [x] **political_figures** - Political figure profiles
  - Location: `supabase_schema_political_figures.sql`
  - Status: ✅ Defined (separate file)

### Verification & Compliance
- [x] **verification_documents** - Document storage and verification
  - Location: `supabase_schema_multitenant_auth.sql` (lines 185-219)
  - Status: ✅ Defined
  
- [x] **kyc_checks** - KYC compliance tracking
  - Location: `supabase_schema_multitenant_auth.sql` (lines 224-249)
  - Status: ✅ Defined

### Onboarding & Progress Tracking
- [x] **onboarding_progress** - Onboarding workflow tracking
  - Location: `supabase_schema_multitenant_auth.sql` (lines 254-278)
  - Status: ✅ Defined

### Initiative Management
- [x] **changemakers** - Changemaker/user profiles
  - Location: `supabase_schema.sql` (lines 16-27)
  - Status: ✅ Defined
  
- [x] **initiatives** - Main initiative/project table
  - Location: `supabase_schema.sql` (lines 32-99)
  - Status: ✅ Defined
  
- [x] **milestones** - Project milestones
  - Location: `supabase_schema.sql` (lines 104-114)
  - Status: ✅ Defined
  
- [x] **donations** - Donation/support records
  - Location: `supabase_schema.sql` (lines 119-131)
  - Status: ✅ Defined

### Admin & Audit
- [x] **admin_actions_log** - Admin audit trail
  - Location: `supabase_schema_multitenant_auth.sql` (lines 283-302)
  - Status: ✅ Defined

## ✅ Required Storage Buckets

### Document Storage
- [x] **verification-documents** - For registration documents
  - Location: `setup_verification_documents_storage.sql` (NEW FILE CREATED)
  - Status: ✅ Setup file now exists
  - Required: Private bucket
  - Used by: `src/services/authService.ts` (lines 24, 31)

### Image Storage
- [x] **initiative-images** - For initiative images
  - Location: `setup_initiative_images_storage.sql`
  - Status: ✅ Setup file exists
  - Required: Public bucket
  - Used by: `src/pages/dashboard/CreateInitiative.tsx` (lines 579, 593)

## 📋 Setup Steps Required

### Step 1: Run Database Schema
Execute these SQL files in order in your Supabase SQL Editor:

1. **Base Schema** (if not already run):
   ```sql
   -- Run: supabase_schema.sql
   -- Creates: changemakers, initiatives, milestones, donations
   ```

2. **Multi-Tenant Auth Schema** (REQUIRED):
   ```sql
   -- Run: supabase_schema_multitenant_auth.sql
   -- Creates: user_profiles, organizations, government_entities, 
   --          verification_documents, kyc_checks, onboarding_progress,
   --          admin_actions_log
   ```

3. **Political Figures Schema** (if needed):
   ```sql
   -- Run: supabase_schema_political_figures.sql
   -- Creates: political_figures table
   ```

4. **User Profile Trigger** (REQUIRED):
   ```sql
   -- Run: create_user_profile_trigger.sql
   -- Creates automatic user_profile on signup
   ```

### Step 2: Create Storage Buckets

#### Bucket 1: verification-documents (PRIVATE)
**Use the new setup file**:
```sql
-- Run: setup_verification_documents_storage.sql
-- Creates private bucket for registration documents
```

**OR Manual Setup** (via Supabase Dashboard):
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `verification-documents`
4. Public: **No** (unchecked - private bucket)
5. File size limit: 10 MB
6. Allowed MIME types: PDF, images, Word, Excel
7. Click "Create bucket"
8. Then run the RLS policies from `setup_verification_documents_storage.sql`

#### Bucket 2: initiative-images (PUBLIC)
**Already has setup file**:
```sql
-- Run: setup_initiative_images_storage.sql
-- Creates public bucket for initiative images
```

### Step 3: Verify Setup

Run this verification query:
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'organizations',
  'government_entities',
  'political_figures',
  'verification_documents',
  'kyc_checks',
  'onboarding_progress',
  'changemakers',
  'initiatives',
  'milestones',
  'donations',
  'admin_actions_log'
)
ORDER BY table_name;

-- Check storage buckets exist
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('verification-documents', 'initiative-images');
```

## ✅ Verification Checklist

Before testing registration, verify:

- [ ] All database tables created successfully
- [ ] `verification-documents` storage bucket created (PRIVATE)
- [ ] `initiative-images` storage bucket created (PUBLIC)
- [ ] RLS policies applied to storage buckets
- [ ] User profile trigger installed
- [ ] All indexes created
- [ ] Test user registration works
- [ ] Document upload works
- [ ] Image upload for initiatives works

## 📝 Summary

**All required tables are defined in the schema files:**
- ✅ 12 database tables defined
- ✅ 2 storage buckets have setup files
- ✅ All RLS policies included
- ✅ All indexes included
- ✅ Triggers included

**Action Required:**
1. Run the SQL schema files in Supabase SQL Editor
2. Run the storage bucket setup files
3. Verify all tables and buckets exist
4. Test registration flow
