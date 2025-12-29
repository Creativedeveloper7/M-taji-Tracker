import { useFieldArray, useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step4Milestones = () => {
  const {
    control,
    register,
    formState: { errors },
    watch,
  } = useFormContext<Partial<Initiative>>()

  const milestones = watch('milestones') || []

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  })

  const addMilestone = () => {
    append({
      id: `milestone-${Date.now()}`,
      title: '',
      target_date: '',
      status: 'pending',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Project Milestones</h3>
        <p className="text-gray-600 text-sm">Define key milestones for your initiative (minimum 2 required)</p>
      </div>

      {fields.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500 mb-4">No milestones added yet</p>
          <button
            type="button"
            onClick={addMilestone}
            className="px-6 py-2 bg-mtaji-accent text-white font-heading font-semibold rounded-xl hover:bg-mtaji-primary-light transition-all duration-300"
          >
            Add First Milestone
          </button>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-heading font-semibold text-mtaji-primary">
                Milestone {index + 1}
              </h4>
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register(`milestones.${index}.title`, {
                    required: 'Milestone title is required',
                  })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
                    errors.milestones?.[index]?.title ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Site preparation completed"
                />
                {errors.milestones?.[index]?.title && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.milestones[index]?.title?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register(`milestones.${index}.target_date`, {
                    required: 'Target date is required',
                  })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
                    errors.milestones?.[index]?.target_date ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.milestones?.[index]?.target_date && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.milestones[index]?.target_date?.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMilestone}
        className="w-full px-6 py-3 border-2 border-dashed border-mtaji-primary text-mtaji-primary font-heading font-semibold rounded-xl hover:bg-mtaji-secondary hover:bg-opacity-20 transition-all duration-300"
      >
        + Add Milestone
      </button>

      {milestones.length < 2 && (
        <p className="text-sm text-red-500">At least 2 milestones are required</p>
      )}
    </div>
  )
}

export default Step4Milestones

