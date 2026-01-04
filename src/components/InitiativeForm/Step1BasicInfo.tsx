import { useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step1BasicInfo = () => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<Partial<Initiative>>()

  const category = watch('category')
  const organizationType = watch('organization_type')
  const shortDescription = watch('short_description') || ''

  const categories = [
    { value: 'agriculture', label: '🌾 Agriculture', icon: '🌾' },
    { value: 'water', label: '💧 Water', icon: '💧' },
    { value: 'health', label: '🏥 Health', icon: '🏥' },
    { value: 'education', label: '🎓 Education', icon: '🎓' },
    { value: 'infrastructure', label: '🏗️ Infrastructure', icon: '🏗️' },
    { value: 'economic', label: '💼 Economic', icon: '💼' },
  ]

  const organizationTypes = [
    { value: 'NGO', label: 'NGO', description: 'Non-Governmental Organization' },
    { value: 'CBO', label: 'CBO', description: 'Community-Based Organization' },
    { value: 'Govt', label: 'Government', description: 'Government Organization' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Basic Information</h3>
        <p className="text-gray-600 text-sm">Tell us about your initiative</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 5, message: 'Title must be at least 5 characters' },
            maxLength: { value: 100, message: 'Title must not exceed 100 characters' },
          })}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.title ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder="Enter initiative title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <label
              key={cat.value}
              className={`flex items-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                category === cat.value
                  ? 'border-mtaji-accent bg-mtaji-secondary bg-opacity-20'
                  : 'border-gray-200 hover:border-mtaji-primary-light'
              }`}
            >
              <input
                type="radio"
                value={cat.value}
                {...register('category', { required: 'Category is required' })}
                className="hidden"
              />
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-medium text-gray-700">{cat.label.split(' ')[1]}</span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Organization Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {organizationTypes.map((org) => (
            <label
              key={org.value}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                organizationType === org.value
                  ? 'border-mtaji-accent bg-mtaji-secondary bg-opacity-20'
                  : 'border-gray-200 hover:border-mtaji-primary-light'
              }`}
            >
              <input
                type="radio"
                value={org.value}
                {...register('organization_type', { required: 'Organization type is required' })}
                className="hidden"
              />
              <span className="font-semibold text-gray-700 mb-1">{org.label}</span>
              <span className="text-xs text-gray-500 text-center">{org.description}</span>
            </label>
          ))}
        </div>
        {errors.organization_type && (
          <p className="mt-1 text-sm text-red-500">{errors.organization_type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Short Description <span className="text-red-500">*</span>
          <span className="text-gray-500 font-normal ml-2">({shortDescription.length}/200)</span>
        </label>
        <textarea
          {...register('short_description', {
            required: 'Short description is required',
            maxLength: { value: 200, message: 'Short description must not exceed 200 characters' },
          })}
          rows={3}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.short_description ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder="Brief summary of your initiative (max 200 characters)"
        />
        {errors.short_description && (
          <p className="mt-1 text-sm text-red-500">{errors.short_description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Full Description <span className="text-red-500">*</span>
          <span className="text-gray-500 font-normal ml-2">(max 2000 characters)</span>
        </label>
        <textarea
          {...register('description', {
            required: 'Full description is required',
            maxLength: { value: 2000, message: 'Full description must not exceed 2000 characters' },
          })}
          rows={8}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.description ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder="Detailed description of your initiative, goals, and impact (max 2000 characters)"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>
    </div>
  )
}

export default Step1BasicInfo

