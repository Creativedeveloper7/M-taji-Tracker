-- ============================================
-- MULTI-TENANT AUTHENTICATION SYSTEM SCHEMA
-- Transparency-Focused Development Tracking Platform
-- ============================================
-- This schema extends the existing Mtaji Tracker database
-- to support three user types: Social Organizations, 
-- Government Entities, and Political Figures
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USER PROFILES TABLE (Unified)
-- ============================================
-- Central table linking all user types to auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Type Identification
  user_type TEXT NOT NULL CHECK (user_type IN ('organization', 'government', 'political_figure', 'individual')),
  
  -- Basic Contact Information
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Verification Status
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'suspended')),
  verification_notes TEXT, -- Admin notes about verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified
  
  -- KYC Compliance
  kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  kyc_completed_at TIMESTAMPTZ,
  
  -- Profile Settings
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'limited')),
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ============================================
-- 2. SOCIAL ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Organization Details
  organization_name TEXT NOT NULL,
  registration_number TEXT UNIQUE, -- Official registration number
  organization_type TEXT CHECK (organization_type IN ('ngo', 'cbo', 'npo', 'foundation', 'community_group', 'other')),
  
  -- Contact Information
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  physical_address TEXT,
  
  -- Geographic Coverage
  operating_counties TEXT[], -- Array of county names
  headquarters_county TEXT,
  
  -- Mission and Focus
  mission_statement TEXT,
  vision_statement TEXT,
  area_of_focus TEXT[] CHECK (
    area_of_focus <@ ARRAY['agriculture', 'water', 'health', 'education', 'infrastructure', 'economic', 'environment', 'social_welfare', 'governance', 'other']
  ),
  
  -- Organization Size
  number_of_employees INTEGER,
  annual_budget DECIMAL(15, 2),
  
  -- Team Management
  team_members JSONB DEFAULT '[]'::jsonb,
  -- Structure: Array of {
  --   "name": "string",
  --   "email": "string",
  --   "role": "string",
  --   "phone": "string (optional)",
  --   "joined_at": "string (ISO timestamp)"
  -- }
  
  -- Verification Documents
  has_submitted_registration_docs BOOLEAN DEFAULT FALSE,
  has_submitted_tax_compliance BOOLEAN DEFAULT FALSE,
  has_submitted_bank_details BOOLEAN DEFAULT FALSE,
  
  -- Profile Media
  logo_url TEXT,
  banner_image_url TEXT,
  
  -- Statistics (auto-computed)
  total_initiatives INTEGER DEFAULT 0,
  total_funds_raised DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. GOVERNMENT ENTITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS government_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Entity Details
  entity_name TEXT NOT NULL, -- e.g., "Ministry of Health", "Nairobi County Government"
  entity_type TEXT NOT NULL CHECK (entity_type IN ('national', 'county', 'ministry', 'department', 'agency', 'state_corporation', 'other')),
  
  -- Ministry/Department Classification
  ministry TEXT, -- e.g., "Health", "Education", "Agriculture"
  department TEXT, -- Specific department within ministry
  
  -- Geographic Jurisdiction
  jurisdiction_level TEXT CHECK (jurisdiction_level IN ('national', 'county', 'constituency', 'ward')),
  jurisdiction_area TEXT, -- County name if applicable
  
  -- Official Registration
  registration_number TEXT UNIQUE, -- Official government registration/code
  parent_entity_id UUID REFERENCES government_entities(id), -- For hierarchical structures
  
  -- Contact Information
  official_email TEXT NOT NULL,
  official_phone TEXT,
  physical_address TEXT NOT NULL,
  website_url TEXT,
  
  -- Authorized Representative
  representative JSONB NOT NULL,
  -- Structure: {
  --   "name": "string",
  --   "title": "string", // e.g., "Director", "County Secretary"
  --   "id_number": "string",
  --   "email": "string",
  --   "phone": "string",
  --   "appointment_date": "string (ISO date)"
  -- }
  
  -- Additional Staff with Access
  authorized_personnel JSONB DEFAULT '[]'::jsonb,
  -- Array of authorized staff members with their roles
  
  -- Government ID Verification
  has_submitted_government_id BOOLEAN DEFAULT FALSE,
  has_submitted_appointment_letter BOOLEAN DEFAULT FALSE,
  has_submitted_authorization_letter BOOLEAN DEFAULT FALSE,
  
  -- Budget and Financial Authority
  annual_budget DECIMAL(18, 2),
  budget_year TEXT, -- e.g., "2024/2025"
  
  -- Profile Media
  logo_url TEXT,
  
  -- Statistics
  total_projects INTEGER DEFAULT 0,
  total_budget_allocated DECIMAL(18, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. VERIFICATION DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type TEXT NOT NULL CHECK (document_type IN (
    'national_id', 'passport', 'registration_certificate', 'tax_compliance',
    'bank_statement', 'appointment_letter', 'authorization_letter',
    'proof_of_address', 'manifesto', 'other'
  )),
  document_name TEXT NOT NULL,
  document_description TEXT,
  
  -- File Information
  file_url TEXT NOT NULL, -- URL to stored file (Supabase Storage)
  file_name TEXT NOT NULL,
  file_size INTEGER, -- Size in bytes
  file_type TEXT, -- MIME type (e.g., "application/pdf", "image/jpeg")
  
  -- Verification Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES auth.users(id), -- Admin who reviewed
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Document Metadata
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  document_number TEXT, -- ID number, certificate number, etc.
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. KYC CHECKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Check Details
  check_type TEXT NOT NULL CHECK (check_type IN (
    'identity_verification', 'address_verification', 'organization_verification',
    'background_check', 'sanctions_screening', 'aml_check', 'other'
  )),
  check_provider TEXT, -- Name of verification service used
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'manual_review')),
  result_data JSONB, -- Detailed results from verification provider
  confidence_score DECIMAL(5, 2), -- 0.00 to 100.00
  
  -- Review Information
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ONBOARDING PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  
  -- Step Completion Status
  steps_completed JSONB DEFAULT '{
    "account_creation": false,
    "profile_information": false,
    "document_upload": false,
    "verification": false,
    "approval": false
  }'::jsonb,
  
  -- Completion Status
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ADMIN ACTIONS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_profile_id UUID REFERENCES user_profiles(id),
  
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'verify_user', 'reject_user', 'suspend_user', 'approve_document',
    'reject_document', 'update_kyc_status', 'grant_permission', 'revoke_permission', 'other'
  )),
  action_description TEXT NOT NULL,
  
  -- Action Metadata
  previous_state JSONB, -- State before action
  new_state JSONB, -- State after action
  reason TEXT,
  
  -- Timestamps
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_status ON user_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON user_profiles(kyc_status);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_user_profile_id ON organizations(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_organizations_registration_number ON organizations(registration_number);
CREATE INDEX IF NOT EXISTS idx_organizations_organization_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_operating_counties ON organizations USING GIN (operating_counties);
CREATE INDEX IF NOT EXISTS idx_organizations_area_of_focus ON organizations USING GIN (area_of_focus);

-- Government Entities
CREATE INDEX IF NOT EXISTS idx_government_entities_user_profile_id ON government_entities(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_government_entities_entity_type ON government_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_government_entities_jurisdiction_area ON government_entities(jurisdiction_area);
CREATE INDEX IF NOT EXISTS idx_government_entities_ministry ON government_entities(ministry);

-- Verification Documents
CREATE INDEX IF NOT EXISTS idx_verification_documents_user_profile_id ON verification_documents(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_document_type ON verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_verification_documents_verification_status ON verification_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_uploaded_at ON verification_documents(uploaded_at DESC);

-- KYC Checks
CREATE INDEX IF NOT EXISTS idx_kyc_checks_user_profile_id ON kyc_checks(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_kyc_checks_check_type ON kyc_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_kyc_checks_status ON kyc_checks(status);

-- Onboarding Progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_profile_id ON onboarding_progress(user_profile_id);

-- Admin Actions Log
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_admin_user_id ON admin_actions_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target_user_profile_id ON admin_actions_log(target_user_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_action_type ON admin_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_performed_at ON admin_actions_log(performed_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_entities_updated_at
  BEFORE UPDATE ON government_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create onboarding progress on user profile creation
CREATE OR REPLACE FUNCTION create_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO onboarding_progress (user_profile_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_onboarding_progress
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_onboarding_progress();

-- Function to update organization stats when initiative is created
CREATE OR REPLACE FUNCTION update_organization_stats()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Find organization associated with changemaker
  SELECT o.id INTO org_id
  FROM organizations o
  JOIN user_profiles up ON up.id = o.user_profile_id
  JOIN changemakers c ON c.user_id = up.user_id
  WHERE c.id = NEW.changemaker_id;
  
  IF org_id IS NOT NULL THEN
    UPDATE organizations
    SET total_initiatives = total_initiatives + 1
    WHERE id = org_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_stats
  AFTER INSERT ON initiatives
  FOR EACH ROW EXECUTE FUNCTION update_organization_stats();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verified profiles are publicly viewable"
  ON user_profiles FOR SELECT
  USING (verification_status = 'verified' AND profile_visibility = 'public');

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Organizations Policies
CREATE POLICY "Public can view verified organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = organizations.user_profile_id
      AND user_profiles.verification_status = 'verified'
    )
  );

CREATE POLICY "Organizations can view their own data"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = organizations.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can update their own data"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = organizations.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Government Entities Policies
CREATE POLICY "Public can view verified government entities"
  ON government_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = government_entities.user_profile_id
      AND user_profiles.verification_status = 'verified'
    )
  );

CREATE POLICY "Government entities can view their own data"
  ON government_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = government_entities.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Government entities can update their own data"
  ON government_entities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = government_entities.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Verification Documents Policies
CREATE POLICY "Users can view their own documents"
  ON verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = verification_documents.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload their own documents"
  ON verification_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = verification_documents.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- KYC Checks Policies
CREATE POLICY "Users can view their own KYC checks"
  ON kyc_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = kyc_checks.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Onboarding Progress Policies
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = onboarding_progress.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = onboarding_progress.user_profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Admin Actions Log Policies (admins only)
-- Note: You'll need to create an admin role or use custom claims
CREATE POLICY "Admins can view all admin actions"
  ON admin_actions_log FOR SELECT
  USING (true); -- Add admin check here

-- ============================================
-- VIEWS FOR EASIER QUERYING
-- ============================================

-- Complete user profile view
CREATE OR REPLACE VIEW complete_user_profiles AS
SELECT 
  up.*,
  CASE 
    WHEN up.user_type = 'organization' THEN o.organization_name
    WHEN up.user_type = 'government' THEN ge.entity_name
    WHEN up.user_type = 'political_figure' THEN pf.name
    ELSE 'Individual'
  END as display_name,
  CASE 
    WHEN up.user_type = 'organization' THEN o.logo_url
    WHEN up.user_type = 'government' THEN ge.logo_url
    ELSE NULL
  END as logo_url
FROM user_profiles up
LEFT JOIN organizations o ON up.id = o.user_profile_id
LEFT JOIN government_entities ge ON up.id = ge.user_profile_id
LEFT JOIN political_figures pf ON up.user_id = pf.user_id;

-- Verification dashboard view
CREATE OR REPLACE VIEW verification_dashboard AS
SELECT 
  up.id,
  up.email,
  up.user_type,
  up.verification_status,
  up.kyc_status,
  up.created_at,
  COUNT(DISTINCT vd.id) as total_documents,
  COUNT(DISTINCT vd.id) FILTER (WHERE vd.verification_status = 'approved') as approved_documents,
  COUNT(DISTINCT kc.id) as total_kyc_checks,
  COUNT(DISTINCT kc.id) FILTER (WHERE kc.status = 'passed') as passed_kyc_checks
FROM user_profiles up
LEFT JOIN verification_documents vd ON up.id = vd.user_profile_id
LEFT JOIN kyc_checks kc ON up.id = kc.user_profile_id
GROUP BY up.id, up.email, up.user_type, up.verification_status, up.kyc_status, up.created_at;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Central user profile table linking all user types';
COMMENT ON TABLE organizations IS 'Social organizations (NGOs, CBOs, etc.) profile data';
COMMENT ON TABLE government_entities IS 'Government entities (ministries, counties, etc.) profile data';
COMMENT ON TABLE verification_documents IS 'Stores uploaded verification documents for all user types';
COMMENT ON TABLE kyc_checks IS 'Records of KYC (Know Your Customer) compliance checks';
COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding completion status';
COMMENT ON TABLE admin_actions_log IS 'Audit trail of all admin actions for compliance';

-- ============================================
-- END OF SCHEMA
-- ============================================
