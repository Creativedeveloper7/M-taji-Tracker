interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-semibold transition-all duration-300 ${
                step < currentStep
                  ? 'bg-mtaji-accent text-white'
                  : step === currentStep
                  ? 'bg-mtaji-primary text-white scale-110'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  step < currentStep ? 'bg-mtaji-accent' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StepIndicator



