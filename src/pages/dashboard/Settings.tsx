import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types/auth';
import { kenyanCounties } from '../../data/kenyanCounties';
import { kenyanMinistries } from '../../data/kenyanMinistries';

type SettingsFormData = {
  // Basic Profile
  email: string;
  phone?: string;
  
  // Organization specific
  organization_name?: string;
  organization_type?: string;
  registration_number?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  physical_address?: string;
  mission_statement?: string;
  vision_statement?: string;
  headquarters_county?: string;
  number_of_employees?: number;
  annual_budget?: number;
  
  // Government specific
  entity_name?: string;
  entity_type?: string;
  ministry?: string;
  department?: string;
  gov_registration_number?: string;
  official_email?: string;
  official_phone?: string;
  gov_physical_address?: string;
  gov_website_url?: string;
  jurisdiction_level?: string;
  jurisdiction_area?: string;
  gov_annual_budget?: number;
  budget_year?: string;

  // Government representative (read-only in settings, captured at signup)
  representative_name?: string;
  representative_title?: string;
  representative_id_number?: string;
  representative_email?: string;
  representative_phone?: string;
  representative_appointment_date?: string;
  
  // Password change
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
  
  // Notification preferences
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
};

export default function Settings() {
  const { user, userProfile, completeProfile, updateProfile, refreshProfile, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsFormData>({
    defaultValues: {
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      email_notifications: userProfile?.notification_preferences?.email ?? true,
      sms_notifications: userProfile?.notification_preferences?.sms ?? false,
      push_notifications: userProfile?.notification_preferences?.push ?? false,
    },
  });

  // Load profile data into form
  useEffect(() => {
    if (userProfile && completeProfile) {
      const formData: Partial<SettingsFormData> = {
        email: userProfile.email,
        phone: userProfile.phone || '',
        email_notifications: userProfile.notification_preferences?.email ?? true,
        sms_notifications: userProfile.notification_preferences?.sms ?? false,
        push_notifications: userProfile.notification_preferences?.push ?? false,
      };

      // Load type-specific data
      if (userProfile.user_type === 'organization' && completeProfile.organization) {
        const org = completeProfile.organization;
        Object.assign(formData, {
          organization_name: org.organization_name,
          organization_type: org.organization_type,
          contact_email: org.contact_email,
          contact_phone: org.contact_phone || '',
          website_url: org.website_url || '',
          physical_address: org.physical_address || '',
          mission_statement: org.mission_statement || '',
          vision_statement: org.vision_statement || '',
          headquarters_county: org.headquarters_county || '',
        });
      } else if (userProfile.user_type === 'government' && completeProfile.government_entity) {
        const gov = completeProfile.government_entity;
        Object.assign(formData, {
          entity_name: gov.entity_name,
          entity_type: gov.entity_type,
          ministry: gov.ministry || '',
          department: gov.department || '',
          official_email: gov.official_email,
          official_phone: gov.official_phone || '',
          jurisdiction_level: gov.jurisdiction_level,
          jurisdiction_area: gov.jurisdiction_area || '',
          gov_registration_number: gov.registration_number || '',
          gov_physical_address: gov.physical_address || '',
          gov_website_url: gov.website_url || '',
          gov_annual_budget: gov.annual_budget || undefined,
          budget_year: gov.budget_year || '',
          representative_name: gov.representative?.name || '',
          representative_title: gov.representative?.title || '',
          representative_id_number: gov.representative?.id_number || '',
          representative_email: gov.representative?.email || '',
          representative_phone: gov.representative?.phone || '',
          representative_appointment_date: gov.representative?.appointment_date || '',
        });
      }

      reset(formData);
    }
  }, [userProfile, completeProfile, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update basic profile
      const profileUpdates: Partial<UserProfile> = {
        phone: data.phone || undefined,
        notification_preferences: {
          email: data.email_notifications,
          sms: data.sms_notifications,
          push: data.push_notifications,
        },
      };

      await updateProfile(profileUpdates);

      // Update type-specific data
      if (userProfile?.user_type === 'organization' && completeProfile?.organization) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            organization_name: data.organization_name,
            organization_type: data.organization_type,
            registration_number: data.registration_number || null,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone || null,
            website_url: data.website_url || null,
            physical_address: data.physical_address || null,
            mission_statement: data.mission_statement || null,
            vision_statement: data.vision_statement || null,
            headquarters_county: data.headquarters_county || null,
            number_of_employees: data.number_of_employees || null,
            annual_budget: data.annual_budget || null,
          })
          .eq('user_profile_id', userProfile.id);

        if (orgError) throw orgError;
      } else if (userProfile?.user_type === 'government' && completeProfile?.government_entity) {
        const { error: govError } = await supabase
          .from('government_entities')
          .update({
            entity_name: data.entity_name,
            entity_type: data.entity_type,
            ministry: data.ministry || null,
            department: data.department || null,
            registration_number: data.gov_registration_number || null,
            official_email: data.official_email,
            official_phone: data.official_phone || null,
            physical_address: data.gov_physical_address || null,
            website_url: data.gov_website_url || null,
            jurisdiction_level: data.jurisdiction_level,
            jurisdiction_area: data.jurisdiction_area || null,
            annual_budget: data.gov_annual_budget || null,
            budget_year: data.budget_year || null,
          })
          .eq('user_profile_id', userProfile.id);

        if (govError) throw govError;
      }

      // Update changemaker name if organization/government name changed
      if (userProfile?.user_type === 'organization' && data.organization_name) {
        const { error: changemakerError } = await supabase
          .from('changemakers')
          .update({ name: data.organization_name })
          .eq('user_id', userProfile.user_id);
        
        if (changemakerError) {
          console.warn('Failed to update changemaker name:', changemakerError);
        }
      } else if (userProfile?.user_type === 'government' && data.entity_name) {
        const { error: changemakerError } = await supabase
          .from('changemakers')
          .update({ name: data.entity_name })
          .eq('user_id', userProfile.user_id);
        
        if (changemakerError) {
          console.warn('Failed to update changemaker name:', changemakerError);
        }
      }

      // Refresh profile to get updated data
      await refreshProfile();

      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (data: SettingsFormData) => {
    if (!data.current_password || !data.new_password || !data.confirm_password) {
      setError('All password fields are required');
      return;
    }

    if (data.new_password !== data.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (data.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
      
      // Reset password fields
      reset({
        ...watch(),
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeDisplay = () => {
    switch (userProfile?.user_type) {
      case 'organization':
        return 'Social Organization';
      case 'government':
        return 'Government Entity';
      case 'political_figure':
        return 'Political Figure';
      default:
        return 'User';
    }
  };

  const getVerificationStatusColor = () => {
    switch (userProfile?.verification_status) {
      case 'verified':
        return 'text-green-400';
      case 'under_review':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-secondary';
    }
  };

  if (!userProfile || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-black mb-2 text-primary">Settings</h1>
        <p className="text-secondary">Manage your account settings and profile information</p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-secondary border border-subtle rounded-lg p-4">
          <div className="text-sm text-secondary mb-1">Account Type</div>
          <div className="text-lg font-semibold text-primary">{getUserTypeDisplay()}</div>
        </div>
        <div className="bg-secondary border border-subtle rounded-lg p-4">
          <div className="text-sm text-secondary mb-1">Verification Status</div>
          <div className={`text-lg font-semibold capitalize ${getVerificationStatusColor()}`}>
            {userProfile.verification_status || 'Pending'}
          </div>
        </div>
        <div className="bg-secondary border border-subtle rounded-lg p-4">
          <div className="text-sm text-secondary mb-1">Email Status</div>
          <div className={`text-lg font-semibold ${user?.email_confirmed_at ? 'text-green-400' : 'text-yellow-400'}`}>
            {user?.email_confirmed_at ? '✓ Verified' : '⏳ Pending'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-subtle">
        <nav className="flex space-x-8">
          {(['profile', 'password', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-secondary hover:text-primary hover:border-subtle'
              }`}
            >
              {tab === 'profile' && '📝 Profile'}
              {tab === 'password' && '🔒 Password'}
              {tab === 'notifications' && '🔔 Notifications'}
            </button>
          ))}
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Tab Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary border border-subtle rounded-lg p-6 space-y-6"
          >
            <h2 className="text-2xl font-heading font-bold text-primary">Profile Information</h2>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-subtle pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: true })}
                  disabled
                  className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-secondary mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Phone Number</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            {/* Organization Specific Fields */}
            {userProfile.user_type === 'organization' && completeProfile?.organization && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b border-subtle pb-2">Organization Details</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Organization Name *</label>
                  <input
                    type="text"
                    {...register('organization_name', { required: true })}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Organization Type *</label>
                    <select
                      {...register('organization_type', { required: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="ngo">NGO</option>
                      <option value="cbo">CBO</option>
                      <option value="npo">NPO</option>
                      <option value="foundation">Foundation</option>
                      <option value="community_group">Community Group</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Registration Number</label>
                    <input
                      type="text"
                      {...register('registration_number')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="Official registration number"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Contact Email *</label>
                    <input
                      type="email"
                      {...register('contact_email', { required: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Contact Phone</label>
                    <input
                      type="tel"
                      {...register('contact_phone')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Website URL</label>
                  <input
                    type="url"
                    {...register('website_url')}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Physical Address</label>
                  <textarea
                    {...register('physical_address')}
                    rows={3}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Headquarters County</label>
                  <select
                    {...register('headquarters_county')}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">Select county</option>
                    {kenyanCounties.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Mission Statement</label>
                  <textarea
                    {...register('mission_statement')}
                    rows={4}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Vision Statement</label>
                  <textarea
                    {...register('vision_statement')}
                    rows={3}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Number of Employees</label>
                    <input
                      type="number"
                      {...register('number_of_employees', { valueAsNumber: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Annual Budget (KES)</label>
                    <input
                      type="number"
                      {...register('annual_budget', { valueAsNumber: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Government Specific Fields */}
            {userProfile.user_type === 'government' && completeProfile?.government_entity && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b border-subtle pb-2">Government Entity Details</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Entity Name *</label>
                  <input
                    type="text"
                    {...register('entity_name', { required: true })}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Entity Type *</label>
                    <select
                      {...register('entity_type', { required: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="national">National Government</option>
                      <option value="county">County Government</option>
                      <option value="ministry">Ministry</option>
                      <option value="department">Department</option>
                      <option value="agency">Agency</option>
                      <option value="state_corporation">State Corporation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Registration Number</label>
                    <input
                      type="text"
                      {...register('gov_registration_number')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="Official registration number"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Ministry</label>
                    <select
                      {...register('ministry')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="">Select ministry</option>
                      {kenyanMinistries.map((ministry) => (
                        <option key={ministry} value={ministry}>
                          {ministry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Department</label>
                    <input
                      type="text"
                      {...register('department')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Official Email *</label>
                    <input
                      type="email"
                      {...register('official_email', { required: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Official Phone</label>
                    <input
                      type="tel"
                      {...register('official_phone')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Physical Address</label>
                  <textarea
                    {...register('gov_physical_address')}
                    rows={3}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">Website URL</label>
                  <input
                    type="url"
                    {...register('gov_website_url')}
                    className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="https://www.entity.go.ke"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Jurisdiction Level *</label>
                    <select
                      {...register('jurisdiction_level', { required: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="national">National</option>
                      <option value="county">County</option>
                      <option value="constituency">Constituency</option>
                      <option value="ward">Ward</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Jurisdiction Area</label>
                    <input
                      type="text"
                      {...register('jurisdiction_area')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder={completeProfile.government_entity.jurisdiction_level === 'county' ? 'Select or enter county' : 'Enter area'}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Annual Budget (KES)</label>
                    <input
                      type="number"
                      {...register('gov_annual_budget', { valueAsNumber: true })}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-primary">Budget Year</label>
                    <input
                      type="text"
                      {...register('budget_year')}
                      className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="e.g., 2024/2025"
                    />
                  </div>
                </div>

                {/* Representative Details (read-only) */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b border-subtle pb-2">Authorized Representative (from signup)</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Representative Name</label>
                      <input
                        type="text"
                        {...register('representative_name')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Title</label>
                      <input
                        type="text"
                        {...register('representative_title')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Representative Email</label>
                      <input
                        type="email"
                        {...register('representative_email')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Representative Phone</label>
                      <input
                        type="tel"
                        {...register('representative_phone')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">ID Number</label>
                      <input
                        type="text"
                        {...register('representative_id_number')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Appointment Date</label>
                      <input
                        type="text"
                        {...register('representative_appointment_date')}
                        disabled
                        className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-secondary">
                    These details come from the initial government registration and are shown here for reference. 
                    Contact support if any of this information needs to be changed.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-subtle">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary border border-subtle rounded-lg p-6 space-y-6"
          >
            <h2 className="text-2xl font-heading font-bold text-primary">Change Password</h2>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Current Password</label>
                <input
                  type="password"
                  {...register('current_password')}
                  className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">New Password</label>
                <input
                  type="password"
                  {...register('new_password', {
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                />
                {errors.new_password && (
                  <p className="text-red-400 text-sm mt-1">{errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Confirm New Password</label>
                <input
                  type="password"
                  {...register('confirm_password', {
                    validate: (value: string | undefined) =>
                      value === watch('new_password') || 'Passwords do not match',
                  })}
                  className="w-full bg-overlay border border-subtle rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-accent-primary"
                />
                {errors.confirm_password && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirm_password.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSubmit(handlePasswordChange)}
                  disabled={saving}
                  className="px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary border border-subtle rounded-lg p-6 space-y-6"
          >
            <h2 className="text-2xl font-heading font-bold text-primary">Notification Preferences</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('email_notifications')}
                  className="w-5 h-5 text-accent-primary bg-overlay border-subtle rounded focus:ring-accent-primary"
                />
                <div>
                  <div className="font-medium text-primary">Email Notifications</div>
                  <div className="text-sm text-secondary">Receive notifications via email</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('sms_notifications')}
                  className="w-5 h-5 text-accent-primary bg-overlay border-subtle rounded focus:ring-accent-primary"
                />
                <div>
                  <div className="font-medium text-primary">SMS Notifications</div>
                  <div className="text-sm text-secondary">Receive notifications via SMS</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('push_notifications')}
                  className="w-5 h-5 text-accent-primary bg-overlay border-subtle rounded focus:ring-accent-primary"
                />
                <div>
                  <div className="font-medium text-primary">Push Notifications</div>
                  <div className="text-sm text-secondary">Receive push notifications in browser</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-subtle">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
