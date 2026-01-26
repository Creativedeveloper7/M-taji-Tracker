import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createVolunteerApplication, VolunteerApplicationFormData } from '../services/volunteerService';
import { motion, AnimatePresence } from 'framer-motion';

interface VolunteerFormProps {
  initiativeId: string;
  initiativeTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SKILLS_OPTIONS = [
  'Construction',
  'Education',
  'Healthcare',
  'Administration',
  'Community Outreach',
  'Fundraising',
  'Marketing',
  'IT/Technology',
  'Agriculture',
  'Water Management',
  'Environmental',
  'Legal',
  'Finance',
  'Project Management',
  'Other'
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const COMMITMENT_DURATIONS = [
  '1 month',
  '3 months',
  '6 months',
  '1 year',
  'Ongoing'
];

export default function VolunteerForm({
  initiativeId,
  initiativeTitle,
  isOpen,
  onClose,
  onSuccess
}: VolunteerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<VolunteerApplicationFormData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      skills: [],
      experience_level: 'beginner',
      previous_volunteer_experience: '',
      availability_days: [],
      availability_hours_per_week: 0,
      start_date: '',
      commitment_duration: '',
      motivation: '',
      interests: [],
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      special_requirements: '',
      additional_notes: ''
    }
  });

  const selectedSkills = watch('skills') || [];
  const selectedDays = watch('availability_days') || [];

  const toggleSkill = (skill: string) => {
    const current = selectedSkills;
    if (current.includes(skill)) {
      setValue('skills', current.filter(s => s !== skill));
    } else {
      setValue('skills', [...current, skill]);
    }
  };

  const toggleDay = (day: string) => {
    const current = selectedDays;
    if (current.includes(day)) {
      setValue('availability_days', current.filter(d => d !== day));
    } else {
      setValue('availability_days', [...current, day]);
    }
  };

  const onSubmit = async (data: VolunteerApplicationFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createVolunteerApplication(initiativeId, data);
      
      setSubmitSuccess(true);
      
      // Reset form
      reset();
      
      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        setSubmitSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting volunteer application:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000] p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-heading font-bold text-mtaji-primary">Volunteer Application</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{initiativeTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-semibold">Application submitted successfully! We'll be in touch soon.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold">{submitError}</p>
            </div>
          )}

          {/* Form */}
          {!submitSuccess && (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('full_name', { required: 'Full name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Skills and Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Skills and Experience
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSkills.includes(skill)
                            ? 'bg-mtaji-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="text-red-500 text-xs mt-1">{errors.skills.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('experience_level', { required: 'Experience level is required' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  {errors.experience_level && (
                    <p className="text-red-500 text-xs mt-1">{errors.experience_level.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Previous Volunteer Experience
                  </label>
                  <textarea
                    {...register('previous_volunteer_experience')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe any previous volunteer experience..."
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Availability
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Days <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDays.includes(day)
                            ? 'bg-mtaji-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors.availability_days && (
                    <p className="text-red-500 text-xs mt-1">{errors.availability_days.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hours Per Week <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('availability_hours_per_week', { 
                        required: 'Hours per week is required',
                        min: { value: 1, message: 'Must be at least 1 hour' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {errors.availability_hours_per_week && (
                      <p className="text-red-500 text-xs mt-1">{errors.availability_hours_per_week.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register('start_date')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Commitment Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('commitment_duration', { required: 'Commitment duration is required' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select duration...</option>
                    {COMMITMENT_DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                  {errors.commitment_duration && (
                    <p className="text-red-500 text-xs mt-1">{errors.commitment_duration.message}</p>
                  )}
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Motivation
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Why do you want to volunteer? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('motivation', { required: 'Motivation is required' })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us why you're interested in volunteering for this initiative..."
                  />
                  {errors.motivation && (
                    <p className="text-red-500 text-xs mt-1">{errors.motivation.message}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('emergency_contact_name', { required: 'Emergency contact name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {errors.emergency_contact_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('emergency_contact_phone', { required: 'Emergency contact phone is required' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {errors.emergency_contact_phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('emergency_contact_relationship', { required: 'Relationship is required' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Spouse, Parent, Sibling, Friend"
                  />
                  {errors.emergency_contact_relationship && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_relationship.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-mtaji-primary border-b border-gray-200 dark:border-gray-700 pb-2">
                  Additional Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Special Requirements
                  </label>
                  <textarea
                    {...register('special_requirements')}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Any special needs or requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('additional_notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mtaji-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-mtaji-primary text-white rounded-lg font-semibold hover:bg-mtaji-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
