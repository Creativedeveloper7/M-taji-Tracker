import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PoliticalFigure } from '../types/politicalFigure'
import { fetchPoliticalFigures } from '../services/politicalFigures'
import Header from '../components/Header'

export default function PoliticalFigures() {
  const [figures, setFigures] = useState<PoliticalFigure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'governor' | 'mp' | 'senator' | 'mca'>('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadFigures()
  }, [])

  const loadFigures = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPoliticalFigures()
      setFigures(data)
    } catch (err) {
      console.error('Failed to load political figures:', err)
      setError('Failed to load political figures. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredFigures = filter === 'all' 
    ? figures 
    : figures.filter(f => f.position === filter)

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'governor':
        return 'bg-purple-100 text-purple-800'
      case 'mp':
        return 'bg-blue-100 text-blue-800'
      case 'senator':
        return 'bg-indigo-100 text-indigo-800'
      case 'mca':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'governor':
        return 'Governor'
      case 'mp':
        return 'MP'
      case 'senator':
        return 'Senator'
      case 'mca':
        return 'MCA'
      default:
        return position
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
      <Header 
        onCreateInitiative={() => navigate('/')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-mtaji-primary mb-2">
                Political Figures
              </h1>
              <p className="text-gray-600">
                Connect with political leaders and track their commitments
              </p>
            </div>
            <button
              onClick={() => navigate('/political-figures/register')}
              className="px-6 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors"
            >
              Register as Political Figure
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'governor', 'mp', 'senator', 'mca'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === pos
                    ? 'bg-mtaji-accent text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pos === 'all' ? 'All' : getPositionLabel(pos)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading political figures...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFigures.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600 mb-4">No political figures found.</p>
            <button
              onClick={() => navigate('/political-figures/register')}
              className="px-6 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-primary transition-colors"
            >
              Be the first to register
            </button>
          </div>
        )}

        {/* Political Figures Grid */}
        {!loading && !error && filteredFigures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFigures.map((figure) => (
              <div
                key={figure.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/political-figures/${figure.id}`)}
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-mtaji-primary to-mtaji-accent p-6 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-heading font-bold">{figure.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPositionBadgeColor(figure.position)}`}>
                      {getPositionLabel(figure.position)}
                    </span>
                  </div>
                  {figure.county && (
                    <p className="text-sm opacity-90">{figure.county} County</p>
                  )}
                  {figure.constituency && (
                    <p className="text-sm opacity-90">{figure.constituency} Constituency</p>
                  )}
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Term Information */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Term</p>
                    <p className="text-sm font-medium">
                      {new Date(figure.term_start).getFullYear()} - {new Date(figure.term_end).getFullYear()}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Projects</p>
                      <p className="text-lg font-bold text-mtaji-primary">
                        {figure.commissioned_projects?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Investment</p>
                      <p className="text-lg font-bold text-mtaji-primary">
                        KES {((figure.total_investment || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  {figure.manifesto?.focus_areas && figure.manifesto.focus_areas.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Top Focus Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {figure.manifesto.focus_areas
                          .sort((a, b) => b.priority - a.priority)
                          .slice(0, 3)
                          .map((area, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {area.category}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      figure.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : figure.status === 'seeking_reelection'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {figure.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      View Profile →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && filteredFigures.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-mtaji-primary mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-mtaji-primary">{filteredFigures.length}</p>
                <p className="text-sm text-gray-600">Total Figures</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-mtaji-primary">
                  {filteredFigures.reduce((sum, f) => sum + (f.commissioned_projects?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Projects</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-mtaji-primary">
                  KES {(filteredFigures.reduce((sum, f) => sum + (f.total_investment || 0), 0) / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-600">Total Investment</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-mtaji-primary">
                  {filteredFigures.filter(f => f.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

