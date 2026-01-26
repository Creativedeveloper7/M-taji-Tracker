// ============================================
// Multi-Tenant Authentication System Types
// ============================================

export type UserType = 'organization' | 'government' | 'political_figure' | 'individual';

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export type KYCStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type ProfileVisibility = 'public' | 'private' | 'limited';

// ============================================
// USER PROFILE
// ============================================
export interface UserProfile {
  id: string;
  user_id: string; // Links to auth.users
  user_type: UserType;
  email: string;
  phone?: string;
  phone_verified: boolean;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  kyc_status: KYCStatus;
  kyc_completed_at?: string;
  profile_visibility: ProfileVisibility;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// ============================================
// SOCIAL ORGANIZATIONS
// ============================================
export type OrganizationType = 'ngo' | 'cbo' | 'npo' | 'foundation' | 'community_group' | 'other';

export type AreaOfFocus = 
  | 'agriculture' 
  | 'water' 
  | 'health' 
  | 'education' 
  | 'infrastructure' 
  | 'economic' 
  | 'environment' 
  | 'social_welfare' 
  | 'governance' 
  | 'other';

export interface TeamMember {
  name: string;
  email: string;
  role: string;
  phone?: string;
  joined_at: string;
}

export interface Organization {
  id: string;
  user_profile_id: string;
  organization_name: string;
  registration_number?: string;
  organization_type: OrganizationType;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  physical_address?: string;
  operating_counties: string[];
  headquarters_county?: string;
  mission_statement?: string;
  vision_statement?: string;
  area_of_focus: AreaOfFocus[];
  number_of_employees?: number;
  annual_budget?: number;
  team_members: TeamMember[];
  has_submitted_registration_docs: boolean;
  has_submitted_tax_compliance: boolean;
  has_submitted_bank_details: boolean;
  logo_url?: string;
  banner_image_url?: string;
  total_initiatives: number;
  total_funds_raised: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// GOVERNMENT ENTITIES
// ============================================
export type EntityType = 'national' | 'county' | 'ministry' | 'department' | 'agency' | 'state_corporation' | 'other';

export type JurisdictionLevel = 'national' | 'county' | 'constituency' | 'ward';

export interface GovernmentRepresentative {
  name: string;
  title: string; // e.g., "Director", "County Secretary"
  id_number: string;
  email: string;
  phone: string;
  appointment_date: string;
}

export interface AuthorizedPersonnel {
  name: string;
  title: string;
  email: string;
  phone?: string;
  role: string;
}

export interface GovernmentEntity {
  id: string;
  user_profile_id: string;
  entity_name: string;
  entity_type: EntityType;
  ministry?: string;
  department?: string;
  jurisdiction_level: JurisdictionLevel;
  jurisdiction_area?: string;
  registration_number?: string;
  parent_entity_id?: string;
  official_email: string;
  official_phone?: string;
  physical_address: string;
  website_url?: string;
  representative: GovernmentRepresentative;
  authorized_personnel: AuthorizedPersonnel[];
  has_submitted_government_id: boolean;
  has_submitted_appointment_letter: boolean;
  has_submitted_authorization_letter: boolean;
  annual_budget?: number;
  budget_year?: string;
  logo_url?: string;
  total_projects: number;
  total_budget_allocated: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// VERIFICATION DOCUMENTS
// ============================================
export type DocumentType = 
  | 'national_id' 
  | 'passport' 
  | 'registration_certificate' 
  | 'tax_compliance'
  | 'bank_statement' 
  | 'appointment_letter' 
  | 'authorization_letter'
  | 'proof_of_address' 
  | 'manifesto' 
  | 'other';

export type DocumentVerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface VerificationDocument {
  id: string;
  user_profile_id: string;
  document_type: DocumentType;
  document_name: string;
  document_description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  verification_status: DocumentVerificationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_number?: string;
  uploaded_at: string;
  updated_at: string;
}

// ============================================
// KYC CHECKS
// ============================================
export type KYCCheckType = 
  | 'identity_verification' 
  | 'address_verification' 
  | 'organization_verification'
  | 'background_check' 
  | 'sanctions_screening' 
  | 'aml_check' 
  | 'other';

export type KYCCheckStatus = 'pending' | 'passed' | 'failed' | 'manual_review';

export interface KYCCheck {
  id: string;
  user_profile_id: string;
  check_type: KYCCheckType;
  check_provider?: string;
  status: KYCCheckStatus;
  result_data?: Record<string, any>;
  confidence_score?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  initiated_at: string;
  completed_at?: string;
  created_at: string;
}

// ============================================
// ONBOARDING PROGRESS
// ============================================
export interface OnboardingSteps {
  account_creation: boolean;
  profile_information: boolean;
  document_upload: boolean;
  verification: boolean;
  approval: boolean;
}

export interface OnboardingProgress {
  id: string;
  user_profile_id: string;
  current_step: number;
  total_steps: number;
  steps_completed: OnboardingSteps;
  is_completed: boolean;
  completed_at?: string;
  started_at: string;
  updated_at: string;
}

// ============================================
// ADMIN ACTIONS
// ============================================
export type AdminActionType = 
  | 'verify_user' 
  | 'reject_user' 
  | 'suspend_user' 
  | 'approve_document'
  | 'reject_document' 
  | 'update_kyc_status' 
  | 'grant_permission' 
  | 'revoke_permission' 
  | 'other';

export interface AdminAction {
  id: string;
  admin_user_id: string;
  target_user_profile_id?: string;
  action_type: AdminActionType;
  action_description: string;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  reason?: string;
  performed_at: string;
}

// ============================================
// COMPLETE USER PROFILE (with specific type data)
// ============================================
export interface CompleteUserProfile {
  profile: UserProfile;
  organization?: Organization;
  government_entity?: GovernmentEntity;
  political_figure?: any; // Import from politicalFigure.ts if needed
  changemaker?: {
    id: string;
    user_id: string;
    name: string;
    email?: string;
    organization?: string;
  };
  onboarding: OnboardingProgress;
  documents: VerificationDocument[];
  kyc_checks: KYCCheck[];
}

// ============================================
// REGISTRATION FORM DATA
// ============================================
export interface OrganizationRegistrationData {
  // Step 1: User Type Selection
  user_type: 'organization';
  
  // Step 2: Basic Information
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  
  // Step 3: Organization Details
  organization_name: string;
  organization_type: OrganizationType;
  registration_number?: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  physical_address?: string;
  
  // Step 4: Geographic Coverage
  operating_counties: string[];
  headquarters_county?: string;
  
  // Step 5: Mission and Focus
  mission_statement: string;
  vision_statement?: string;
  area_of_focus: AreaOfFocus[];
  
  // Step 6: Organization Size (optional)
  number_of_employees?: number;
  annual_budget?: number;
  
  // Step 7: Team Members
  team_members?: TeamMember[];
  
  // Step 8: Document Upload
  documents: {
    registration_certificate?: File;
    tax_compliance?: File;
    bank_statement?: File;
    proof_of_address?: File;
  };
  
  // Step 9: Verification
  terms_accepted: boolean;
}

export interface GovernmentEntityRegistrationData {
  // Step 1: User Type Selection
  user_type: 'government';
  
  // Step 2: Basic Information
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  
  // Step 3: Entity Details
  entity_type: EntityType;
  ministry?: string;
  department?: string;
  registration_number?: string;
  
  // Step 4: Jurisdiction
  jurisdiction_level: JurisdictionLevel;
  jurisdiction_area?: string;
  
  // Step 5: Contact Information
  official_email: string;
  official_phone?: string;
  physical_address: string;
  website_url?: string;
  
  // Step 6: Authorized Representative
  representative: GovernmentRepresentative;
  
  // Step 7: Additional Personnel (optional)
  authorized_personnel?: AuthorizedPersonnel[];
  
  // Step 8: Budget Information (optional)
  annual_budget?: number;
  budget_year?: string;
  
  // Step 9: Document Upload
  documents: {
    government_id: File;
    appointment_letter: File;
    authorization_letter?: File;
    proof_of_address?: File;
  };
  
  // Step 10: Verification
  terms_accepted: boolean;
}

export interface PoliticalFigureRegistrationData {
  // Step 1: User Type Selection
  user_type: 'political_figure';
  
  // Step 2: Basic Information
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  
  // Step 3: Personal Profile
  name: string;
  position: 'governor' | 'mp' | 'senator' | 'mca';
  
  // Step 4: Geographic Jurisdiction
  county?: string;
  constituency?: string;
  ward?: string;
  
  // Step 5: Term Information
  term_start: string;
  term_end: string;
  term_years: number;
  
  // Step 6: Political Affiliation
  political_party?: string;
  constituency_info?: string;
  
  // Step 7: Manifesto Upload
  manifesto_document?: File;
  manifesto_text?: string;
  
  // Step 8: ID Verification
  id_document: File;
  background_check_consent: boolean;
  
  // Step 9: Profile Visibility
  profile_visibility: ProfileVisibility;
  
  // Step 10: Verification
  terms_accepted: boolean;
}

// ============================================
// AUTHENTICATION CONTEXT TYPES
// ============================================
export interface AuthContextType {
  user: any | null; // Supabase User
  userProfile: UserProfile | null;
  completeProfile: CompleteUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RegistrationResponse {
  user_id: string;
  user_profile_id: string;
  email: string;
  verification_status: VerificationStatus;
  message: string;
}
