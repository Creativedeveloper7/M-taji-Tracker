import { useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step2Financial = () => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<Partial<Initiative>>()

  const targetAmount = watch('target_amount') || 0
  const projectDuration = watch('project_duration')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const durations = [
    { value: '3 months', label: '3 Months' },
    { value: '6 months', label: '6 Months' },
    { value: '1 year', label: '1 Year' },
    { value: '2 years', label: '2 Years' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Financial Details</h3>
        <p className="text-gray-600 text-sm">Set your funding goals and timeline</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Target Amount (KES) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            KES
          </span>
          <input
            type="number"
            {...register('target_amount', {
              required: 'Target amount is required',
              min: { value: 1000, message: 'Minimum amount is KES 1,000' },
              valueAsNumber: true,
            })}
            className={`w-full pl-16 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
              errors.target_amount ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="0"
            min="1000"
            step="1000"
          />
        </div>
        {targetAmount > 0 && (
          <p className="mt-2 text-sm text-mtaji-primary font-medium">
            {formatCurrency(targetAmount)}
          </p>
        )}
        {errors.target_amount && (
          <p className="mt-1 text-sm text-red-500">{errors.target_amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Project Duration <span className="text-red-500">*</span>
        </label>
        <select
          {...register('project_duration', { required: 'Project duration is required' })}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.project_duration ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <option value="">Select duration</option>
          {durations.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
        {projectDuration === 'custom' && (
          <input
            type="text"
            {...register('project_duration')}
            className="mt-3 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
            placeholder="e.g., 18 months"
          />
        )}
        {errors.project_duration && (
          <p className="mt-1 text-sm text-red-500">{errors.project_duration.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Expected Completion Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register('expected_completion', {
            required: 'Expected completion date is required',
            validate: (value) => {
              if (!value) return true
              if (new Date(value) < new Date()) {
                return 'Completion date must be in the future'
              }
              return true
            },
          })}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.expected_completion ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {errors.expected_completion && (
          <p className="mt-1 text-sm text-red-500">{errors.expected_completion.message}</p>
        )}
      </div>
    </div>
  )
}

export default Step2Financial

