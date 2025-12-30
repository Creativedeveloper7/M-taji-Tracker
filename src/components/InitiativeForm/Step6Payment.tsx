import { useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step6Payment = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<Partial<Initiative>>()

  const paymentMethod = watch('payment_details.method')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with 0, replace with +254
    if (digits.startsWith('0')) {
      return '+254' + digits.substring(1)
    }
    
    // If starts with 254, add +
    if (digits.startsWith('254')) {
      return '+' + digits
    }
    
    // If doesn't start with +254, add it
    if (!digits.startsWith('254')) {
      return '+254' + digits
    }
    
    return '+' + digits
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Payment Details</h3>
        <p className="text-gray-600 text-sm">How will funds be received for this initiative?</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
              paymentMethod === 'mpesa'
                ? 'border-mtaji-accent bg-mtaji-secondary bg-opacity-20'
                : 'border-gray-200 hover:border-mtaji-primary-light'
            }`}
          >
            <input
              type="radio"
              value="mpesa"
              {...register('payment_details.method', { required: 'Payment method is required' })}
              className="hidden"
            />
            <div className="text-3xl">📱</div>
            <div>
              <div className="font-semibold text-gray-700">M-Pesa</div>
              <div className="text-xs text-gray-500">Mobile money</div>
            </div>
          </label>

          <label
            className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
              paymentMethod === 'bank'
                ? 'border-mtaji-accent bg-mtaji-secondary bg-opacity-20'
                : 'border-gray-200 hover:border-mtaji-primary-light'
            }`}
          >
            <input
              type="radio"
              value="bank"
              {...register('payment_details.method', { required: 'Payment method is required' })}
              className="hidden"
            />
            <div className="text-3xl">🏦</div>
            <div>
              <div className="font-semibold text-gray-700">Bank Account</div>
              <div className="text-xs text-gray-500">Direct deposit</div>
            </div>
          </label>
        </div>
        {errors.payment_details?.method && (
          <p className="mt-1 text-sm text-red-500">{errors.payment_details.method.message}</p>
        )}
      </div>

      {paymentMethod === 'mpesa' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            M-Pesa Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register('payment_details.mpesa_number', {
              required: 'M-Pesa number is required',
              pattern: {
                value: /^\+254[0-9]{9}$/,
                message: 'Please enter a valid Kenyan phone number (e.g., +254712345678)',
              },
            })}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              e.target.value = formatted
            }}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
              errors.payment_details?.mpesa_number ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="+254712345678"
          />
          {errors.payment_details?.mpesa_number && (
            <p className="mt-1 text-sm text-red-500">
              {errors.payment_details.mpesa_number.message}
            </p>
          )}
        </div>
      )}

      {paymentMethod === 'bank' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('payment_details.bank_name', {
                required: paymentMethod === 'bank' ? 'Bank name is required' : false,
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
                errors.payment_details?.bank_name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="e.g., Equity Bank, KCB, etc."
            />
            {errors.payment_details?.bank_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.payment_details.bank_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('payment_details.bank_account', {
                required: paymentMethod === 'bank' ? 'Account number is required' : false,
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
                errors.payment_details?.bank_account ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Account number"
            />
            {errors.payment_details?.bank_account && (
              <p className="mt-1 text-sm text-red-500">
                {errors.payment_details.bank_account.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Branch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('payment_details.bank_branch', {
                required: paymentMethod === 'bank' ? 'Branch is required' : false,
              })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
                errors.payment_details?.bank_branch ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Branch name"
            />
            {errors.payment_details?.bank_branch && (
              <p className="mt-1 text-sm text-red-500">
                {errors.payment_details.bank_branch.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Step6Payment




