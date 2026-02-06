import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PoliticalFigure } from '../types/politicalFigure'
import { fetchPoliticalFigureById } from '../services/politicalFigures'
import Header from '../components/Header'

export default function PoliticalFigureProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [figure, setFigure] = useState<PoliticalFigure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadFigure()
    }
  }, [id])

  const loadFigure = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPoliticalFigureById(id!)
      if (data) {
        setFigure(data)
      } else {
        setError('Political figure not found')
      }
    } catch (err) {
      console.error('Failed to load political figure:', err)
      setError('Failed to load political figure profile')
    } finally {
      setLoading(false)
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'governor': return 'Governor'
      case 'mp': return 'Member of Parliament'
      case 'senator': return 'Senator'
      case 'mca': return 'Member of County Assembly'
      default: return position
    }
  }

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'governor': return 'bg-purple-100 text-purple-800'
      case 'mp': return 'bg-blue-100 text-blue-800'
      case 'senator': return 'bg-indigo-100 text-indigo-800'
      case 'mca': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header 
          onCreateInitiative={() => navigate('/')}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !figure) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header 
          onCreateInitiative={() => navigate('/')}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p>{error || 'Political figure not found'}</p>
            <button
              onClick={() => navigate('/political-figures')}
              className="mt-2 text-sm underline"
            >
              Back to Political Figures
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
      <Header onCreateInitiative={() => navigate('/')} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/political-figures')}
            className="text-mtaji-primary hover:text-mtaji-accent mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Political Figures
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-mtaji-primary to-mtaji-accent p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">{figure.name}</h1>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getPositionBadgeColor(figure.position)}`}>
                  {getPositionLabel(figure.position)}
                </span>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                figure.status === 'active' 
                  ? 'bg-amber-100 text-amber-800'
                  : figure.status === 'seeking_reelection'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {figure.status}
              </span>
            </div>
            
            {/* Jurisdiction */}
            <div className="mt-4 space-y-1">
              {figure.county && (
                <p className="text-lg opacity-90">{figure.county} County</p>
              )}
              {figure.constituency && (
                <p className="text-lg opacity-90">{figure.constituency} Constituency</p>
              )}
              {figure.ward && (
                <p className="text-lg opacity-90">{figure.ward} Ward</p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Term Information */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Term Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Term Start</p>
                  <p className="text-lg font-semibold">
                    {new Date(figure.term_start).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Term End</p>
                  <p className="text-lg font-semibold">
                    {new Date(figure.term_end).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Activity</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Commissioned Projects</p>
                  <p className="text-3xl font-bold text-mtaji-primary">
                    {figure.commissioned_projects?.length || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Investment</p>
                  <p className="text-3xl font-bold text-mtaji-primary">
                    KES {((figure.total_investment || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Focus Areas</p>
                  <p className="text-3xl font-bold text-mtaji-primary">
                    {figure.manifesto?.focus_areas?.length || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Targets</p>
                  <p className="text-3xl font-bold text-mtaji-primary">
                    {figure.manifesto?.targets?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Projects by Category */}
            {figure.projects_by_category && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Projects by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(figure.projects_by_category).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1 capitalize">{category}</p>
                      <p className="text-2xl font-bold text-mtaji-primary">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manifesto Focus Areas */}
            {figure.manifesto?.focus_areas && figure.manifesto.focus_areas.length > 0 && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Manifesto Focus Areas</h2>
                <div className="space-y-4">
                  {figure.manifesto.focus_areas
                    .sort((a, b) => b.priority - a.priority)
                    .map((area, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg capitalize">{area.category}</h3>
                          <span className="px-3 py-1 bg-mtaji-accent text-white rounded-full text-sm font-semibold">
                            Priority {area.priority}/5
                          </span>
                        </div>
                        {area.commitments && area.commitments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Commitments:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {area.commitments.map((commitment, cIdx) => (
                                <li key={cIdx}>{commitment}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Manifesto Targets */}
            {figure.manifesto?.targets && figure.manifesto.targets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Specific Targets</h2>
                <div className="space-y-3">
                  {figure.manifesto.targets.map((target, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium">{target.description}</p>
                      {target.quantity && (
                        <p className="text-sm text-gray-600 mt-1">Target: {target.quantity}</p>
                      )}
                      {target.location && (
                        <p className="text-sm text-gray-600">Location: {target.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manifesto Text */}
            {figure.manifesto?.text && (
              <div>
                <h2 className="text-xl font-heading font-bold text-mtaji-primary mb-4">Manifesto</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{figure.manifesto.text}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

