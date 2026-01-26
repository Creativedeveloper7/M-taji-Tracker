import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { GovernmentEntityRegistrationData, EntityType, JurisdictionLevel } from '../types/auth';
import { registerGovernmentEntity } from '../services/authService';
import { kenyanCounties } from '../data/kenyanCounties';
import { kenyanMinistries, commonDepartments } from '../data/kenyanMinistries';
import { governmentTitles } from '../data/governmentTitles';

const TOTAL_STEPS = 9;

export default function RegisterGovernment() {
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
  } = useForm<GovernmentEntityRegistrationData>({
    defaultValues: {
      user_type: 'government',
      authorized_personnel: [],
      documents: {},
      terms_accepted: false,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: GovernmentEntityRegistrationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerGovernmentEntity(data);
      
      if (result.success && result.data) {
        navigate('/register/success', {
          state: {
            email: result.data.email,
            verification_status: result.data.verification_status,
            message: result.data.message,
            user_type: 'government',
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

  const handleFileChange = (field: keyof GovernmentEntityRegistrationData['documents'], file: File | null) => {
    setValue(`documents.${field}`, file as any);
  };

  const steps = [
    { number: 1, title: 'Account Info' },
    { number: 2, title: 'Entity Details' },
    { number: 3, title: 'Jurisdiction' },
    { number: 4, title: 'Contact Info' },
    { number: 5, title: 'Representative' },
    { number: 6, title: 'Budget' },
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
            Register as <span className="text-mtaji-primary">Government Entity</span>
          </h1>
          <p className="text-mtaji-light-gray">
            Complete the form below to create your government entity account
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-shrink-0 text-center ${
                  step.number <= currentStep ? 'text-mtaji-primary' : 'text-mtaji-medium-gray'
                }`}
                style={{ minWidth: '80px' }}
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
                    <label className="block text-sm font-medium mb-2">Official Email Address *</label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="official@government.go.ke"
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

            {/* Step 2: Entity Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Entity Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ministry</label>
                    <select
                      {...register('ministry')}
                      className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="" className="bg-gray-800 text-white">Select ministry</option>
                      {kenyanMinistries.map((ministry) => (
                        <option key={ministry} value={ministry} className="bg-gray-800 text-white">
                          {ministry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Entity Type *</label>
                    <select
                      {...register('entity_type', { required: 'Entity type is required' })}
                      className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="" className="bg-gray-800 text-white">Select entity type</option>
                      <option value="national" className="bg-gray-800 text-white">National Government</option>
                      <option value="county" className="bg-gray-800 text-white">County Government</option>
                      <option value="ministry" className="bg-gray-800 text-white">Ministry</option>
                      <option value="department" className="bg-gray-800 text-white">Department</option>
                      <option value="agency" className="bg-gray-800 text-white">Agency</option>
                      <option value="state_corporation" className="bg-gray-800 text-white">State Corporation</option>
                      <option value="other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Department (if applicable)</label>
                    <select
                      {...register('department')}
                      className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="" className="bg-gray-800 text-white">Select department</option>
                      {commonDepartments.map((dept) => (
                        <option key={dept} value={dept} className="bg-gray-800 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Registration Number</label>
                    <input
                      type="text"
                      {...register('registration_number')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Official government registration number"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Jurisdiction */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Geographic Jurisdiction</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Jurisdiction Level *</label>
                    <select
                      {...register('jurisdiction_level', { required: 'Jurisdiction level is required' })}
                      className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="" className="bg-gray-800 text-white">Select level</option>
                      <option value="national" className="bg-gray-800 text-white">National</option>
                      <option value="county" className="bg-gray-800 text-white">County</option>
                      <option value="constituency" className="bg-gray-800 text-white">Constituency</option>
                      <option value="ward" className="bg-gray-800 text-white">Ward</option>
                    </select>
                  </div>

                  {watchedValues.jurisdiction_level && watchedValues.jurisdiction_level !== 'national' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Jurisdiction Area *</label>
                      {watchedValues.jurisdiction_level === 'county' ? (
                        <select
                          {...register('jurisdiction_area', { required: 'Jurisdiction area is required' })}
                          className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                        >
                          <option value="" className="bg-gray-800 text-white">Select county</option>
                          {kenyanCounties.map((county) => (
                            <option key={county} value={county} className="bg-gray-800 text-white">
                              {county}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          {...register('jurisdiction_area', { required: 'Jurisdiction area is required' })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          placeholder="Enter constituency or ward name"
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Contact Information */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Official Email *</label>
                    <input
                      type="email"
                      {...register('official_email', { required: 'Official email is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="official@entity.go.ke"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Official Phone</label>
                    <input
                      type="tel"
                      {...register('official_phone')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="+254 700 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Physical Address *</label>
                    <textarea
                      {...register('physical_address', { required: 'Physical address is required' })}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Official physical address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website URL</label>
                    <input
                      type="url"
                      {...register('website_url')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="https://www.entity.go.ke"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Authorized Representative */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Authorized Representative</h2>
                <p className="text-sm text-mtaji-light-gray mb-6">
                  The primary authorized representative for this entity
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      {...register('representative.name', { required: 'Representative name is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Title/Position *</label>
                    <select
                      {...register('representative.title', { required: 'Title is required' })}
                      className="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    >
                      <option value="" className="bg-gray-800 text-white">Select title/position</option>
                      {governmentTitles.map((title) => (
                        <option key={title} value={title} className="bg-gray-800 text-white">
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ID Number *</label>
                    <input
                      type="text"
                      {...register('representative.id_number', { required: 'ID number is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="National ID number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      {...register('representative.email', { required: 'Email is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="representative@entity.go.ke"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <input
                      type="tel"
                      {...register('representative.phone', { required: 'Phone is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="+254 700 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Appointment Date *</label>
                    <input
                      type="date"
                      {...register('representative.appointment_date', { required: 'Appointment date is required' })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Budget Information */}
            {currentStep === 6 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Budget Information (Optional)</h2>
                
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Budget Year</label>
                    <input
                      type="text"
                      {...register('budget_year')}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="e.g., 2024/2025"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: Documents */}
            {currentStep === 7 && (
              <motion.div
                key="step8"
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
                      Government ID (National ID or Passport) * (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('government_id', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Appointment Letter * (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('appointment_letter', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Authorization Letter (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('authorization_letter', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Proof of Address (PDF, JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('proof_of_address', e.target.files?.[0] || null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mtaji-primary file:text-white hover:file:bg-mtaji-primary-dark"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Review */}
            {currentStep === 8 && (
              <motion.div
                key="step9"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-heading font-bold mb-6">Review Your Information</h2>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-mtaji-light-gray">Ministry:</span>
                    <span className="ml-2 font-semibold">{watchedValues.ministry || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Entity Type:</span>
                    <span className="ml-2 font-semibold capitalize">{watchedValues.entity_type}</span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Email:</span>
                    <span className="ml-2 font-semibold">{watchedValues.email}</span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Jurisdiction:</span>
                    <span className="ml-2 font-semibold">
                      {watchedValues.jurisdiction_level} {watchedValues.jurisdiction_area && `- ${watchedValues.jurisdiction_area}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-mtaji-light-gray">Representative:</span>
                    <span className="ml-2 font-semibold">{watchedValues.representative?.name}</span>
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
                      will be verified by administrators before activation. I confirm that all information
                      provided is accurate and official.
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
                key="step10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center"
              >
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-heading font-bold mb-4">Registration Complete!</h2>
                <p className="text-mtaji-light-gray mb-6">
                  Your government entity registration has been submitted successfully.
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
