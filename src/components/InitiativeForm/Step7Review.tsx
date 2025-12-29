import { useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step7Review = () => {
  const { watch } = useFormContext<Partial<Initiative>>()

  const formData = watch()

  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }

  const categoryLabels: Record<string, string> = {
    agriculture: '🌾 Agriculture',
    water: '💧 Water',
    health: '🏥 Health',
    education: '🎓 Education',
    infrastructure: '🏗️ Infrastructure',
    economic: '💼 Economic',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Review & Publish</h3>
        <p className="text-gray-600 text-sm">Review all information before publishing your initiative</p>
      </div>

      <div className="bg-mtaji-secondary bg-opacity-10 border-2 border-mtaji-accent rounded-xl p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: categoryColors[formData.category || 'agriculture'] }}
          >
            {categoryLabels[formData.category || 'agriculture']?.split(' ')[0]}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-heading font-bold text-mtaji-primary">{formData.title}</h4>
            <p className="text-gray-600 text-sm mt-1">{formData.short_description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h5 className="font-heading font-semibold text-mtaji-primary mb-3">Basic Information</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{categoryLabels[formData.category || 'agriculture']}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium text-right max-w-xs">{formData.description?.substring(0, 100)}...</span>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h5 className="font-heading font-semibold text-mtaji-primary mb-3">Financial Details</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Target Amount:</span>
              <span className="font-medium text-mtaji-primary">
                {formData.target_amount ? formatCurrency(formData.target_amount) : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Duration:</span>
              <span className="font-medium">{formData.project_duration || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Completion:</span>
              <span className="font-medium">
                {formData.expected_completion ? formatDate(formData.expected_completion) : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h5 className="font-heading font-semibold text-mtaji-primary mb-3">Location</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">County:</span>
              <span className="font-medium">{formData.location?.county || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Constituency:</span>
              <span className="font-medium">{formData.location?.constituency || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Specific Area:</span>
              <span className="font-medium text-right max-w-xs">
                {formData.location?.specific_area || 'Not set'}
              </span>
            </div>
            {formData.location?.coordinates && (
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-medium text-xs">
                  {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        {formData.milestones && formData.milestones.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <h5 className="font-heading font-semibold text-mtaji-primary mb-3">
              Milestones ({formData.milestones.length})
            </h5>
            <div className="space-y-2">
              {formData.milestones.map((milestone, index) => (
                <div key={milestone?.id || index} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{index + 1}. {milestone?.title}</span>
                    <span className="font-medium">{milestone?.target_date ? formatDate(milestone.target_date) : 'Not set'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {formData.reference_images && formData.reference_images.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <h5 className="font-heading font-semibold text-mtaji-primary mb-3">
              Reference Images ({formData.reference_images.length})
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {formData.reference_images.slice(0, 3).map((img, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h5 className="font-heading font-semibold text-mtaji-primary mb-3">Payment Details</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium capitalize">{formData.payment_details?.method || 'Not set'}</span>
            </div>
            {formData.payment_details?.method === 'mpesa' && formData.payment_details?.mpesa_number && (
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Number:</span>
                <span className="font-medium">{formData.payment_details.mpesa_number}</span>
              </div>
            )}
            {formData.payment_details?.method === 'bank' && (
              <>
                {formData.payment_details?.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{formData.payment_details.bank_name}</span>
                  </div>
                )}
                {formData.payment_details?.bank_account && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account:</span>
                    <span className="font-medium">{formData.payment_details.bank_account}</span>
                  </div>
                )}
                {formData.payment_details?.bank_branch && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium">{formData.payment_details.bank_branch}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Once published, your initiative will be visible on the map and available for funding.
          You can edit it later if needed.
        </p>
      </div>
    </div>
  )
}

export default Step7Review

