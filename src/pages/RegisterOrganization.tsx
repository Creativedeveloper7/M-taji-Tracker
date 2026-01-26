import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { OrganizationRegistrationData, OrganizationType, AreaOfFocus } from '../types/auth';
import { registerOrganization } from '../services/authService';
import { kenyanCounties } from '../data/kenyanCounties';

const TOTAL_STEPS = 9;

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<OrganizationRegistrationData>({
    defaultValues: {
      user_type: 'organization',
      area_of_focus: [],
      operating_counties: [],
      team_members: [],
      documents: {},
      terms_accepted: false,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: OrganizationRegistrationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerOrganization(data);
      
      if (result.success && result.data) {
        navigate('/register/success', {
          state: {
            email: result.data.email,
            verification_status: result.data.verification_status,
            message: result.data.message,
          },
        });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAreaOfFocus = (area: AreaOfFocus) => {
    const current = watchedValues.area_of_focus || [];
    const updated = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    setValue('area_of_focus', updated);
  };

  const toggleCounty = (county: string) => {
    const current = watchedValues.operating_counties || [];
    const updated = current.includes(county)
      ? current.filter((c) => c !== county)
      : [...current, county];
    setValue('operating_counties', updated);
  };

  const handleFileChange = (field: keyof OrganizationRegistrationData['documents'], file: File | null) => {
    setValue(`documents.${field}`, file as any);
  };

  const steps = [
    { number: 1, title: 'Account Info' },
    { number: 2, title: 'Organization Details' },
    { number: 3, title: 'Geographic Coverage' },
    { number: 4, title: 'Mission & Focus' },
    { number: 5, title: 'Organization Size' },
    { number: 6, title: 'Team Members' },
    { number: 7, title: 'Documents' },
    { number: 8, title: 'Review' },
    { number: 9, title: 'Complete' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/register')}
            className="text-mtaji-light-gray hover:text-white mb-4"
          >
            ← Back to Account Type Selection
          </button>
          <h1 className="text-4xl font-heading font-black mb-2">
            Register as <span className="text-mtaji-primary">Social Organization</span>
          </h1>
          <p className="text-mtaji-light-gray">
            Complete the form below to create your organization account
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 text-center ${
                  step.number <= currentStep ? 'text-mtaji-primary' : 'text-mtaji-medium-gray'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center border-2 ${
                    step.number <= currentStep
                      ? 'border-mtaji-primary bg-mtaji-primary/20'
                      : 'border-mtaji-medium-gray'
                  }`}
                >
                  {step.number < currentStep ? '✓' : step.number}
                </div>
                <div className="text-xs hidden sm:block">{step.title}</div>
              </div>
            ))}
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-mtaji-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Account Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Account Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="organization@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="+254 700 000 000"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mtaji-light-gray hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-mtaji-light-gray mt-1">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === watchedValues.password || 'Passwords do not match',
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mtaji-light-gray hover:text-white transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Organization Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Organization Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Name *</label>
                    <input
                      type="text"
                      {...register('organization_name', { required: 'Organization name is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Your Organization Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Type *</label>
                    <select
                      {...register('organization_type', { required: 'Organization type is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="">Select type</option>
                      <option value="ngo">NGO</option>
                      <option value="cbo">CBO</option>
                      <option value="npo">NPO</option>
                      <option value="foundation">Foundation</option>
                      <option value="community_group">Community Group</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Registration Number</label>
                    <input
                      type="text"
                      {...register('registration_number')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Official registration number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Email *</label>
                    <input
                      type="email"
                      {...register('contact_email', { required: 'Contact email is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="contact@organization.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      {...register('contact_phone')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="+254 700 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Physical Address</label>
                    <textarea
                      {...register('physical_address')}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Organization physical address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website URL</label>
                    <input
                      type="url"
                      {...register('website_url')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="https://www.organization.com"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Geographic Coverage */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Geographic Coverage</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Operating Counties *</label>
                    <p className="text-sm text-mtaji-light-gray mb-4">
                      Select all counties where your organization operates
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-white/5 rounded-lg">
                      {kenyanCounties.map((county) => (
                        <label
                          key={county}
                          className="flex items-center gap-2 cursor-pointer hover:text-mtaji-primary transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={watchedValues.operating_counties?.includes(county) || false}
                            onChange={() => toggleCounty(county)}
                            className="w-4 h-4 text-mtaji-primary bg-white/10 border-white/20 rounded focus:ring-mtaji-primary"
                          />
                          <span className="text-sm">{county}</span>
                        </label>
                      ))}
                    </div>
                    {watchedValues.operating_counties && watchedValues.operating_counties.length > 0 && (
                      <p className="text-sm text-mtaji-primary mt-2">
                        {watchedValues.operating_counties.length} county(ies) selected
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Headquarters County</label>
                    <select
                      {...register('headquarters_county')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="">Select headquarters county</option>
                      {kenyanCounties.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Mission & Focus */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Mission & Focus Areas</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mission Statement *</label>
                    <textarea
                      {...register('mission_statement', { required: 'Mission statement is required' })}
                      rows={4}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Describe your organization's mission and purpose..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Vision Statement</label>
                    <textarea
                      {...register('vision_statement')}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Describe your organization's vision..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Areas of Focus *</label>
                    <p className="text-sm text-mtaji-light-gray mb-4">
                      Select all areas your organization focuses on
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(['agriculture', 'water', 'health', 'education', 'infrastructure', 'economic', 'environment', 'social_welfare', 'governance', 'other'] as AreaOfFocus[]).map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleAreaOfFocus(area)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            watchedValues.area_of_focus?.includes(area)
                              ? 'border-mtaji-primary bg-mtaji-primary/20 text-white'
                              : 'border-white/20 bg-white/5 text-mtaji-light-gray hover:border-white/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="capitalize">{area.replace('_', ' ')}</span>
                            {watchedValues.area_of_focus?.includes(area) && (
                              <span className="text-mtaji-primary">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Organization Size */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Organization Size (Optional)</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Employees</label>
                    <input
                      type="number"
                      {...register('number_of_employees', { valueAsNumber: true })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Annual Budget (KES)</label>
                    <input
                      type="number"
                      {...register('annual_budget', { valueAsNumber: true })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Team Members */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Team Members (Optional)</h2>
                <p className="text-sm text-mtaji-light-gray mb-6">
                  You can add team members later in your organization settings
                </p>
                <div className="text-center py-8 text-mtaji-light-gray">
                  Team member management will be available after registration
                </div>
              </motion.div>
            )}

            {/* Step 7: Documents */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Verification Documents</h2>
                <p className="text-sm text-mtaji-light-gray mb-6">
                  Upload required documents for verification. All documents are securely stored and encrypted.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Registration Certificate (PDF, JPG, PNG) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('registration_certificate', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tax Compliance Certificate (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('tax_compliance', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bank Statement or Proof of Banking (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('bank_statement', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Review */}
            {currentStep === 8 && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Review Your Information</h2>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-mtaji-light-gray">Organization Name:</span>
                    <span className="ml-2 font-semibold">{watchedValues.organization_name}</span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Email:</span>
                    <span className="ml-2 font-semibold">{watchedValues.email}</span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Operating Counties:</span>
                    <span className="ml-2 font-semibold">
                      {watchedValues.operating_counties?.length || 0} selected
                    </span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Areas of Focus:</span>
                    <span className="ml-2 font-semibold">
                      {watchedValues.area_of_focus?.length || 0} selected
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('terms_accepted', { required: 'You must accept the terms' })}
                      className="mt-1 w-5 h-5 text-mtaji-primary bg-white/10 border-white/20 rounded focus:ring-mtaji-primary"
                    />
                    <span className="text-sm text-mtaji-light-gray">
                      I agree to the Terms of Service and Privacy Policy. I understand that my account
                      will be verified by administrators before activation.
                    </span>
                  </label>
                  {errors.terms_accepted && (
                    <p className="text-red-400 text-sm mt-1">{errors.terms_accepted.message}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 9: Complete */}
            {currentStep === 9 && (
              <motion.div
                key="step9"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center"
              >
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-heading font-bold mb-4">Registration Complete!</h2>
                <p className="text-mtaji-light-gray mb-6">
                  Your organization registration has been submitted successfully.
                  You will receive an email confirmation shortly.
                </p>
                <p className="text-sm text-mtaji-medium-gray">
                  Your account is pending verification. This typically takes 24-48 hours.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < TOTAL_STEPS && (
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
              >
                Previous
              </button>
              {currentStep < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-mtaji-primary rounded-lg font-semibold hover:bg-mtaji-primary-dark transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-mtaji-primary rounded-lg font-semibold hover:bg-mtaji-primary-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
