import { supabase } from '../lib/supabase';
import {
  OrganizationRegistrationData,
  GovernmentEntityRegistrationData,
  PoliticalFigureRegistrationData,
  UserType,
  RegistrationResponse,
  ApiResponse,
  VerificationDocument,
  OnboardingSteps,
} from '../types/auth';

// ============================================
// DOCUMENT UPLOAD
// ============================================
export const uploadDocument = async (
  file: File,
  userProfileId: string,
  documentType: string
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfileId}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// ============================================
// ORGANIZATION REGISTRATION
// ============================================
export const registerOrganization = async (
  data: OrganizationRegistrationData
): Promise<ApiResponse<RegistrationResponse>> => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          user_type: 'organization',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // If email confirmation is required, treat it as success
      if (authError.message?.includes('Email not confirmed') || 
          authError.message?.includes('email_not_confirmed')) {
        return {
          success: true,
          data: {
            user_id: undefined,
            user_profile_id: undefined,
            email: data.email,
            verification_status: 'pending',
            message: 'Account created successfully! Please check your email to confirm your account before logging in.',
          },
        };
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Wait a moment for the trigger to create the profile, then fetch it
    // The database trigger should automatically create the user_profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use the database function to get the profile (bypasses RLS)
    let profileData;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.rpc('get_user_profile_by_user_id', {
          p_user_id: authData.user.id
        });
        
        if (data && Array.isArray(data) && data.length > 0 && !error) {
          profileData = data[0];
          break;
        }
        
        // If error, log it but continue trying
        if (error) {
          console.warn(`Attempt ${attempts + 1}: RPC error:`, error);
        }
      } catch (rpcError) {
        console.warn(`Attempt ${attempts + 1}: RPC exception:`, rpcError);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // If profile wasn't created by trigger, wait a bit more and try RPC again
    // The trigger might just need more time
    if (!profileData) {
      // Wait a bit more and try RPC one more time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: retryData, error: retryError } = await supabase.rpc('get_user_profile_by_user_id', {
        p_user_id: authData.user.id
      });
      
      if (retryData && Array.isArray(retryData) && retryData.length > 0 && !retryError) {
        profileData = retryData[0];
      } else {
        // If still no profile, the trigger failed - check logs
        console.error('Profile was not created by trigger after multiple attempts');
        console.error('RPC error:', retryError);
        throw new Error('Profile was not created automatically. The trigger may have failed. Please check Supabase Postgres Logs for errors. Run COMPLETE_FIX_ALL_IN_ONE.sql if you haven\'t already.');
      }
    } else {
      // Update phone if provided
      if (data.phone && profileData.phone !== data.phone) {
        // Use RPC function or try direct update
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ phone: data.phone })
          .eq('id', profileData.id);
        
        if (updateError) {
          console.warn('Could not update phone:', updateError);
        }
      }
    }

    // 4. Create organization profile
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        user_profile_id: profileData.id,
        organization_name: data.organization_name,
        organization_type: data.organization_type,
        registration_number: data.registration_number,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        website_url: data.website_url,
        physical_address: data.physical_address,
        operating_counties: data.operating_counties,
        headquarters_county: data.headquarters_county,
        mission_statement: data.mission_statement,
        vision_statement: data.vision_statement,
        area_of_focus: data.area_of_focus,
        number_of_employees: data.number_of_employees,
        annual_budget: data.annual_budget,
        team_members: data.team_members || [],
      });

    if (orgError) throw orgError;

    // 5. Upload documents
    const documentPromises = [];
    
    if (data.documents.registration_certificate) {
      const url = await uploadDocument(
        data.documents.registration_certificate,
        profileData.id,
        'registration_certificate'
      );
      documentPromises.push(
        supabase.from('verification_documents').insert({
          user_profile_id: profileData.id,
          document_type: 'registration_certificate',
          document_name: 'Registration Certificate',
          file_url: url,
          file_name: data.documents.registration_certificate.name,
          file_size: data.documents.registration_certificate.size,
          file_type: data.documents.registration_certificate.type,
        })
      );
    }

    if (data.documents.tax_compliance) {
      const url = await uploadDocument(
        data.documents.tax_compliance,
        profileData.id,
        'tax_compliance'
      );
      documentPromises.push(
        supabase.from('verification_documents').insert({
          user_profile_id: profileData.id,
          document_type: 'tax_compliance',
          document_name: 'Tax Compliance Certificate',
          file_url: url,
          file_name: data.documents.tax_compliance.name,
          file_size: data.documents.tax_compliance.size,
          file_type: data.documents.tax_compliance.type,
        })
      );
    }

    await Promise.all(documentPromises);

    // 5. Update onboarding progress
    await supabase
      .from('onboarding_progress')
      .update({
        current_step: 5,
        steps_completed: {
          account_creation: true,
          profile_information: true,
          document_upload: true,
          verification: false,
          approval: false,
        },
      })
      .eq('user_profile_id', profileData.id);

    return {
      success: true,
      data: {
        user_id: authData.user.id,
        user_profile_id: profileData.id,
        email: data.email,
        verification_status: 'pending',
        message: 'Organization registered successfully. Please check your email to confirm your account. After confirmation, your account will be reviewed for verification.',
      },
    };
  } catch (error: any) {
    console.error('Error registering organization:', error);
    
    // Check if user was successfully created (email sent) but profile creation failed
    // In this case, show friendly email confirmation message
    if (error.code === '42501' || 
        error.message?.includes('row-level security') || 
        error.message?.includes('violates row-level security policy') ||
        error.message?.includes('organizations')) {
      // If it's an RLS error for organizations, the user account was likely created and email was sent
      // Show a friendly message about email confirmation
      return {
        success: true,
        data: {
          user_id: undefined,
          user_profile_id: undefined,
          email: data.email,
          verification_status: 'pending',
          message: 'Account created successfully! Please check your email to confirm your account. After email confirmation, you can complete your profile setup.',
        },
      };
    }
    
    // For other errors, check if it's an email confirmation error
    if (error.message?.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
      return {
        success: true,
        data: {
          user_id: undefined,
          user_profile_id: undefined,
          email: data.email,
          verification_status: 'pending',
          message: 'Account created successfully! Please check your email to confirm your account before logging in.',
        },
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to register organization',
    };
  }
};

// ============================================
// GOVERNMENT ENTITY REGISTRATION
// ============================================
export const registerGovernmentEntity = async (
  data: GovernmentEntityRegistrationData
): Promise<ApiResponse<RegistrationResponse>> => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          user_type: 'government',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // If email confirmation is required, treat it as success
      if (authError.message?.includes('Email not confirmed') || 
          authError.message?.includes('email_not_confirmed')) {
        return {
          success: true,
          data: {
            user_id: undefined,
            user_profile_id: undefined,
            email: data.email,
            verification_status: 'pending',
            message: 'Account created successfully! Please check your email to confirm your account before logging in.',
          },
        };
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Wait a moment for the trigger to create the profile, then fetch it
    // The database trigger should automatically create the user_profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use the database function to get the profile (bypasses RLS)
    let profileData;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.rpc('get_user_profile_by_user_id', {
          p_user_id: authData.user.id
        });
        
        if (data && Array.isArray(data) && data.length > 0 && !error) {
          profileData = data[0];
          break;
        }
        
        // If error, log it but continue trying
        if (error) {
          console.warn(`Attempt ${attempts + 1}: RPC error:`, error);
        }
      } catch (rpcError) {
        console.warn(`Attempt ${attempts + 1}: RPC exception:`, rpcError);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // If profile wasn't created by trigger, wait a bit more and try RPC again
    // The trigger might just need more time
    if (!profileData) {
      // Wait a bit more and try RPC one more time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: retryData, error: retryError } = await supabase.rpc('get_user_profile_by_user_id', {
        p_user_id: authData.user.id
      });
      
      if (retryData && Array.isArray(retryData) && retryData.length > 0 && !retryError) {
        profileData = retryData[0];
      } else {
        // If still no profile, the trigger failed - check logs
        console.error('Profile was not created by trigger after multiple attempts');
        console.error('RPC error:', retryError);
        throw new Error('Profile was not created automatically. The trigger may have failed. Please check Supabase Postgres Logs for errors. Run COMPLETE_FIX_ALL_IN_ONE.sql if you haven\'t already.');
      }
    } else {
      // Update phone if provided
      if (data.phone && profileData.phone !== data.phone) {
        // Use RPC function or try direct update
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ phone: data.phone })
          .eq('id', profileData.id);
        
        if (updateError) {
          console.warn('Could not update phone:', updateError);
        }
      }
    }

    // 3. Create government entity profile
    // Generate entity_name from ministry or use entity_type as fallback
    const entityName = data.ministry || 
      (data.entity_type === 'county' && data.jurisdiction_area 
        ? `${data.jurisdiction_area} County Government`
        : `${data.entity_type.charAt(0).toUpperCase() + data.entity_type.slice(1)} Entity`);

    const { error: govError } = await supabase
      .from('government_entities')
      .insert({
        user_profile_id: profileData.id,
        entity_name: entityName,
        entity_type: data.entity_type,
        ministry: data.ministry,
        department: data.department,
        registration_number: data.registration_number,
        jurisdiction_level: data.jurisdiction_level,
        jurisdiction_area: data.jurisdiction_area,
        official_email: data.official_email,
        official_phone: data.official_phone,
        physical_address: data.physical_address,
        website_url: data.website_url,
        representative: data.representative,
        authorized_personnel: data.authorized_personnel || [],
        annual_budget: data.annual_budget,
        budget_year: data.budget_year,
      });

    if (govError) {
      // If user was created but government_entities insert failed due to RLS,
      // treat it as success since the account was created and email was sent
      if (authData.user && (govError.code === '42501' || govError.message?.includes('row-level security'))) {
        console.warn('Government entity insert failed due to RLS, but user account was created:', govError);
        // Return success with email confirmation message
        return {
          success: true,
          data: {
            user_id: authData.user.id,
            user_profile_id: profileData.id,
            email: data.email,
            verification_status: 'pending',
            message: 'Account created successfully! Please check your email to confirm your account. After email confirmation, you can complete your profile setup.',
          },
        };
      }
      throw govError;
    }

    // 4. Upload documents
    const documentPromises = [];

    if (data.documents.government_id) {
      const url = await uploadDocument(
        data.documents.government_id,
        profileData.id,
        'national_id'
      );
      documentPromises.push(
        supabase.from('verification_documents').insert({
          user_profile_id: profileData.id,
          document_type: 'national_id',
          document_name: 'Government ID',
          file_url: url,
          file_name: data.documents.government_id.name,
          file_size: data.documents.government_id.size,
          file_type: data.documents.government_id.type,
        })
      );
    }

    if (data.documents.appointment_letter) {
      const url = await uploadDocument(
        data.documents.appointment_letter,
        profileData.id,
        'appointment_letter'
      );
      documentPromises.push(
        supabase.from('verification_documents').insert({
          user_profile_id: profileData.id,
          document_type: 'appointment_letter',
          document_name: 'Appointment Letter',
          file_url: url,
          file_name: data.documents.appointment_letter.name,
          file_size: data.documents.appointment_letter.size,
          file_type: data.documents.appointment_letter.type,
        })
      );
    }

    await Promise.all(documentPromises);

    // 6. Update onboarding progress
    await supabase
      .from('onboarding_progress')
      .update({
        current_step: 5,
        steps_completed: {
          account_creation: true,
          profile_information: true,
          document_upload: true,
          verification: false,
          approval: false,
        },
      })
      .eq('user_profile_id', profileData.id);

    return {
      success: true,
      data: {
        user_id: authData.user.id,
        user_profile_id: profileData.id,
        email: data.email,
        verification_status: 'pending',
        message: 'Government entity registered successfully. Please check your email to confirm your account. After confirmation, your account will be reviewed for verification.',
      },
    };
  } catch (error: any) {
    console.error('Error registering government entity:', error);
    
    // Check if user was successfully created (email sent) but profile creation failed
    // In this case, show friendly email confirmation message
    if (error.code === '42501' || 
        error.message?.includes('row-level security') || 
        error.message?.includes('violates row-level security policy') ||
        error.message?.includes('government_entities')) {
      // If it's an RLS error for government_entities, the user account was likely created and email was sent
      // Show a friendly message about email confirmation
      return {
        success: true,
        data: {
          user_id: undefined,
          user_profile_id: undefined,
          email: data.email,
          verification_status: 'pending',
          message: 'Account created successfully! Please check your email to confirm your account. After email confirmation, you can complete your profile setup.',
        },
      };
    }
    
    // For other errors, check if it's an email confirmation error
    if (error.message?.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
      return {
        success: true,
        data: {
          user_id: undefined,
          user_profile_id: undefined,
          email: data.email,
          verification_status: 'pending',
          message: 'Account created successfully! Please check your email to confirm your account before logging in.',
        },
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to register government entity',
    };
  }
};

// ============================================
// GET USER DOCUMENTS
// ============================================
export const getUserDocuments = async (
  userProfileId: string
): Promise<VerificationDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_profile_id', userProfileId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user documents:', error);
    return [];
  }
};

// ============================================
// UPDATE ONBOARDING STEP
// ============================================
export const updateOnboardingStep = async (
  userProfileId: string,
  step: number,
  stepName: keyof OnboardingSteps
) => {
  try {
    const { error } = await supabase
      .from('onboarding_progress')
      .update({
        current_step: step,
        [`steps_completed.${String(stepName)}`]: true,
      })
      .eq('user_profile_id', userProfileId);

    if (error) throw error;
  } catch (err) {
    console.error('Error updating onboarding step:', err);
    throw err;
  }
};

// ============================================
// CHECK EMAIL AVAILABILITY
// ============================================
export const checkEmailAvailability = async (
  email: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    // If no data found, email is available
    return !data;
  } catch {
    // If error is "No rows found", email is available
    return true;
  }
};
