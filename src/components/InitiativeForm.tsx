import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Initiative } from '../types'
import { satelliteService } from '../services/satelliteService'
import StepIndicator from './InitiativeForm/StepIndicator'
import Step1BasicInfo from './InitiativeForm/Step1BasicInfo'
import Step2Financial from './InitiativeForm/Step2Financial'
import Step3Location from './InitiativeForm/Step3Location'
import Step4Milestones from './InitiativeForm/Step4Milestones'
import Step5Images from './InitiativeForm/Step5Images'
import Step6Payment from './InitiativeForm/Step6Payment'
import Step7Review from './InitiativeForm/Step7Review'

interface InitiativeFormProps {
  onClose: () => void
  onSubmit: (data: Initiative) => void
}

const TOTAL_STEPS = 7

const InitiativeForm = ({ onClose, onSubmit }: InitiativeFormProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<Partial<Initiative>>({
    mode: 'onChange',
    defaultValues: {
      status: 'draft',
      raised_amount: 0,
      reference_images: [],
      milestones: [],
      payment_details: {
        method: 'mpesa',
      },
      location: {
        coordinates: { lat: -0.0236, lng: 37.9062 },
        county: '',
        constituency: '',
        specific_area: '',
      },
    },
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('initiative-draft')
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        methods.reset(parsed)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [methods])

  // Save draft to localStorage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const formData = methods.getValues()
      localStorage.setItem('initiative-draft', JSON.stringify(formData))
    }, 30000)

    return () => clearInterval(interval)
  }, [methods])

  // Handle URL step parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stepParam = params.get('step')
    if (stepParam) {
      const step = parseInt(stepParam, 10)
      if (step >= 1 && step <= TOTAL_STEPS) {
        setCurrentStep(step)
      }
    }
  }, [])

  // Update URL when step changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('step', currentStep.toString())
    window.history.replaceState({}, '', url.toString())
  }, [currentStep])

  const nextStep = async () => {
    // Custom validation for milestones step
    if (currentStep === 4) {
      const milestones = methods.getValues('milestones') || []
      if (milestones.length < 2) {
        methods.setError('milestones', {
          type: 'manual',
          message: 'At least 2 milestones are required',
        })
        return
      }
    }

    // Custom validation for images step
    if (currentStep === 5) {
      const images = methods.getValues('reference_images') || []
      if (images.length < 3) {
        methods.setError('reference_images', {
          type: 'manual',
          message: 'At least 3 images are required',
        })
        return
      }
    }

    const isValid = await methods.trigger()
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (data: Partial<Initiative>) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Validate location and coordinates before submitting
      const location = data.location
      const coordinates = location?.coordinates
      
      // Check if coordinates are set and not default
      const hasValidCoordinates = coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lng === 'number' &&
        !isNaN(coordinates.lat) && 
        !isNaN(coordinates.lng) &&
        !(coordinates.lat === -0.0236 && coordinates.lng === 37.9062) // Not default Kenya center
      
      if (!hasValidCoordinates) {
        console.error('❌ Cannot submit: Invalid or missing coordinates!', {
          location,
          coordinates,
          hasLocation: !!location,
          hasCoordinates: !!coordinates
        })
        setSubmitError('Please set a location on the map by clicking on it. The default location cannot be used.')
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Submitting initiative with coordinates:', {
        lat: coordinates.lat,
        lng: coordinates.lng,
        county: location.county,
        constituency: location.constituency
      })
      
      const initiative: Initiative = {
        id: `init-${Date.now()}`,
        changemaker_id: 'user-1', // Will be replaced by createInitiative function
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'agriculture',
        organization_type: data.organization_type,
        target_amount: data.target_amount || 0,
        raised_amount: 0,
        location: {
          county: location.county || '',
          constituency: location.constituency || '',
          specific_area: location.specific_area || '',
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng
          },
          ...(location.geofence && { geofence: location.geofence })
        },
        project_duration: data.project_duration || '',
        expected_completion: data.expected_completion || '',
        milestones: data.milestones || [],
        reference_images: data.reference_images || [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_details: data.payment_details || {
          method: 'mpesa',
        },
        satellite_snapshots: [], // Initialize empty array
      }

      // Capture initial satellite snapshot if status is 'published'
      if (initiative.status === 'published') {
        try {
          console.log('📸 Capturing initial satellite snapshot...')
          const snapshot = await satelliteService.captureSnapshot(
            coordinates.lat,
            coordinates.lng,
            500 // radius in meters
          )
          
          // Add snapshot with metadata
          initiative.satellite_snapshots = [{
            ...snapshot,
            captured_at: new Date().toISOString(),
            ai_analysis: {
              status: 'baseline',
              notes: 'Initial project state captured'
            }
          }]
          
          console.log('✅ Satellite snapshot captured successfully:', snapshot)
        } catch (error) {
          console.error('⚠️ Failed to capture satellite snapshot:', error)
          // Continue with initiative creation even if snapshot fails
          // Don't block the form submission
        }
      }

      localStorage.removeItem('initiative-draft')
      
      // Call onSubmit and wait for it to complete (handle both sync and async)
      const result = onSubmit(initiative)
      if (result && typeof result.then === 'function') {
        await result
      }
      
      // Only close if submission was successful
      onClose()
    } catch (error: any) {
      console.error('Error submitting initiative:', error)
      setSubmitError(error?.message || 'Failed to publish initiative. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveDraft = () => {
    const formData = methods.getValues()
    const initiative: Initiative = {
      id: `init-${Date.now()}`,
      changemaker_id: 'user-1',
      title: formData.title || '',
      description: formData.description || '',
      category: formData.category || 'agriculture',
      organization_type: formData.organization_type,
      target_amount: formData.target_amount || 0,
      raised_amount: 0,
      location: formData.location || {
        county: '',
        constituency: '',
        specific_area: '',
        coordinates: { lat: -0.0236, lng: 37.9062 },
      },
      project_duration: formData.project_duration || '',
      expected_completion: formData.expected_completion || '',
      milestones: formData.milestones || [],
      reference_images: formData.reference_images || [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_details: formData.payment_details || {
        method: 'mpesa',
      },
    }

    localStorage.removeItem('initiative-draft')
    onSubmit(initiative)
    onClose()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />
      case 2:
        return <Step2Financial />
      case 3:
        return <Step3Location />
      case 4:
        return <Step4Milestones />
      case 5:
        return <Step5Images />
      case 6:
        return <Step6Payment />
      case 7:
        return <Step7Review />
      default:
        return <Step1BasicInfo />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">Create New Initiative</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="p-6">
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}
            <div className="min-h-[400px]">
              {renderStep()}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border-2 border-mtaji-primary text-mtaji-primary font-heading font-semibold rounded-xl hover:bg-mtaji-primary hover:text-white transition-all duration-300"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {currentStep < TOTAL_STEPS ? (
                  <>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-heading font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-mtaji-accent text-white font-heading font-semibold rounded-xl hover:bg-mtaji-primary-light transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-heading font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2 bg-mtaji-accent text-white font-heading font-semibold rounded-xl hover:bg-mtaji-primary-light transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Publish Initiative
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

export default InitiativeForm

