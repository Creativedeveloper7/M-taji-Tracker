# Multi-Tenant Authentication System Setup Guide

This guide will help you set up the complete multi-tenant authentication system for the Mtaji Tracker platform.

## Overview

The system supports three distinct user types:
1. **Social Organizations** - NGOs, CBOs, NPOs, and community groups
2. **Government Entities** - National and county governments, ministries, departments
3. **Political Figures** - Governors, MPs, Senators, and MCAs

## Prerequisites

- Supabase project set up
- Node.js and npm/yarn installed
- Environment variables configured

## Step 1: Database Setup

### 1.1 Run the Database Migration

Execute the SQL migration file in your Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
supabase_schema_multitenant_auth.sql
```

This will create:
- `user_profiles` - Central user profile table
- `organizations` - Social organization profiles
- `government_entities` - Government entity profiles
- `verification_documents` - Document storage and verification
- `kyc_checks` - KYC compliance tracking
- `onboarding_progress` - Onboarding workflow tracking
- `admin_actions_log` - Admin audit trail

### 1.2 Create Storage Bucket for Documents

In Supabase Dashboard → Storage:

1. Create a new bucket named `verification-documents`
2. Set it to **Private** (not public)
3. Configure RLS policies:

```sql
-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.verification_status = 'verified'
    -- Add admin role check here if you have one
  )
);
```

## Step 2: Environment Variables

Ensure your `.env` file includes:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Install Dependencies

All required dependencies should already be installed. If not:

```bash
npm install
```

## Step 4: Verify File Structure

Ensure these files exist:

```
src/
├── contexts/
│   └── AuthContext.tsx          ✅ Created
├── services/
│   └── authService.ts            ✅ Created
├── types/
│   └── auth.ts                   ✅ Created
├── pages/
│   ├── Register.tsx              ✅ Created
│   ├── RegisterOrganization.tsx ✅ Created
│   └── Login.tsx                 ✅ Created
└── App.tsx                       ✅ Updated
```

## Step 5: Test the Implementation

### 5.1 Test Registration Flow

1. Navigate to `/register`
2. Select "Social Organization"
3. Complete the registration form
4. Verify that:
   - User profile is created
   - Organization profile is created
   - Documents are uploaded to storage
   - Onboarding progress is tracked

### 5.2 Test Login Flow

1. Navigate to `/login`
2. Enter credentials
3. Verify authentication works
4. Check that user profile loads correctly

## Step 6: Admin Dashboard (Future Implementation)

To complete the verification workflow, you'll need to create:

1. **Admin Dashboard** - For reviewing and approving registrations
2. **Document Review Interface** - For viewing and approving documents
3. **KYC Integration** - Connect to KYC service providers
4. **Email Notifications** - Send verification status updates

## Key Features Implemented

### ✅ User Type Selection
- Three distinct user types with different registration flows
- Dynamic form fields based on user type

### ✅ Multi-Step Onboarding
- Progress tracking
- Step-by-step validation
- Document upload integration

### ✅ Document Verification
- Secure file upload to Supabase Storage
- Document type classification
- Verification status tracking

### ✅ Authentication Context
- Global auth state management
- Automatic profile loading
- Session management

### ✅ Role-Based Access Control
- RLS policies for data security
- User type-specific data access
- Verification status checks

## Next Steps

### Immediate Next Steps:

1. **Create Government Entity Registration Form**
   - Similar to organization form but with government-specific fields
   - File: `src/pages/RegisterGovernment.tsx`

2. **Create Political Figure Registration Form**
   - Extend existing political figure registration
   - Integrate with new user profile system
   - File: `src/pages/RegisterPoliticalFigure.tsx` (update existing)

3. **Create Registration Success Page**
   - Show verification status
   - Display next steps
   - File: `src/pages/RegisterSuccess.tsx`

4. **Create Admin Dashboard**
   - User verification queue
   - Document review interface
   - KYC status management
   - File: `src/pages/Admin/Dashboard.tsx`

5. **Email Verification**
   - Set up Supabase email templates
   - Send verification emails
   - SMS verification (optional)

### Future Enhancements:

- [ ] Two-factor authentication
- [ ] Social login (Google, Facebook)
- [ ] Password reset flow
- [ ] Profile completion reminders
- [ ] Bulk user import
- [ ] Advanced KYC integration
- [ ] Document OCR for automatic data extraction
- [ ] Multi-language support

## Troubleshooting

### Issue: Documents not uploading

**Solution:**
1. Check storage bucket exists and is named `verification-documents`
2. Verify RLS policies are set correctly
3. Check file size limits in Supabase settings
4. Ensure user has proper permissions

### Issue: User profile not loading after login

**Solution:**
1. Check that `user_profiles` table has a row for the user
2. Verify RLS policies allow user to read their own profile
3. Check browser console for errors
4. Verify Supabase connection

### Issue: Registration form not submitting

**Solution:**
1. Check all required fields are filled
2. Verify email format is correct
3. Check network tab for API errors
4. Ensure Supabase URL and keys are correct

## Security Considerations

1. **Document Storage**: All documents are stored privately and only accessible by the user and admins
2. **RLS Policies**: Row-level security ensures users can only access their own data
3. **Password Security**: Supabase handles password hashing automatically
4. **Email Verification**: Required for account activation
5. **Admin Actions**: All admin actions are logged for audit purposes

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for errors
4. Verify database schema matches the migration file

---

**Status**: ✅ Core authentication system implemented
**Next**: Implement government entity and political figure registration forms
