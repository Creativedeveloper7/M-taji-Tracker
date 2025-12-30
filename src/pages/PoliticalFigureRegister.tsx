import { useState } from 'react'
import { PoliticalFigureRegistration } from '../components/PoliticalFigureRegistration'
import { PoliticalFigure } from '../types/politicalFigure'
import { createPoliticalFigure } from '../services/politicalFigures'
import { useNavigate } from 'react-router-dom'

export default function PoliticalFigureRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleComplete = async (profile: Partial<PoliticalFigure>) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Creating political figure profile:', profile)

      const created = await createPoliticalFigure(profile)

      if (created) {
        console.log('Political figure profile created successfully:', created)
        // Redirect to profile page or dashboard
        navigate(`/political-figures/${created.id}`)
      } else {
        throw new Error('Failed to create political figure profile')
      }
    } catch (err: any) {
      console.error('Error creating political figure profile:', err)
      setError(err?.message || 'Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-mtaji-primary mb-2">
            Register as Political Figure
          </h1>
          <p className="text-gray-600">
            Create your profile to connect with initiatives in your jurisdiction
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent mx-auto mb-4"></div>
              <p className="text-mtaji-primary font-medium">Creating your profile...</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <PoliticalFigureRegistration
          onComplete={handleComplete}
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  )
}

