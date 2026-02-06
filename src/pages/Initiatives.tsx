import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Initiative } from '../types'
import Header from '../components/Header'
import { fetchInitiatives } from '../services/initiatives'

const Initiatives = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get organization type from URL params
  const urlParams = new URLSearchParams(location.search)
  const orgTypeFilter = urlParams.get('org_type') || 'all'

  const loadAllInitiatives = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch from Supabase only
      const supabaseInitiatives = await fetchInitiatives()
      
      // Log detailed information about fetched initiatives
      console.log(`✅ Successfully loaded ${supabaseInitiatives.length} initiatives from Supabase`)
      if (supabaseInitiatives.length > 0) {
        console.log('📋 Initiative statuses:', supabaseInitiatives.map(i => ({
          id: i.id,
          title: i.title,
          status: i.status,
          created_at: i.created_at
        })))
      }
      
      if (supabaseInitiatives.length === 0) {
        setError('No initiatives found. Create your first initiative to get started!')
      }
      
      setInitiatives(supabaseInitiatives)
    } catch (err: any) {
      console.error('Failed to load initiatives:', err)
      setError('Failed to load initiatives. Please check your connection and try again.')
      setInitiatives([]) // Show empty state instead of sample data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllInitiatives()
  }, [location.pathname, location.search])

  useEffect(() => {
    // Reload when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllInitiatives()
      }
    }
    
    // Listen for custom refresh event (triggered after creating new initiatives)
    const handleRefresh = () => {
      console.log('🔄 Refresh event received, reloading initiatives...')
      loadAllInitiatives()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('initiatives-refresh', handleRefresh)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('initiatives-refresh', handleRefresh)
    }
  }, [])

  // Filter initiatives based on status, search query, and organization type
  const filteredInitiatives = initiatives.filter(initiative => {
    const matchesStatus = filter === 'all' || initiative.status === filter
    const matchesSearch = searchQuery === '' || 
      initiative.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      initiative.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      initiative.location.county.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by organization type
    const matchesOrgType = orgTypeFilter === 'all' || initiative.organization_type === orgTypeFilter
    
    // Only show published or active initiatives (not drafts)
    const isPublished = initiative.status !== 'draft'
    
    return matchesStatus && matchesSearch && matchesOrgType && isPublished
  })

  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }

  const statusColors: Record<string, string> = {
    published: 'bg-blue-500',
    active: 'bg-mtaji-accent',
    completed: 'bg-amber-500',
    stalled: 'bg-gray-400',
  }

  const handleCreateInitiative = () => {
    // Navigate to home page where the form can be opened
    navigate('/')
  }

  return (
    <div className="min-h-screen pt-16 bg-primary">
      <Header onCreateInitiative={handleCreateInitiative} />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-heading font-bold text-accent-primary mb-2">
              {orgTypeFilter !== 'all' ? `${orgTypeFilter} Initiatives` : 'All Initiatives'}
            </h1>
            <p className="text-sm sm:text-base text-secondary">
              {orgTypeFilter !== 'all' 
                ? `Discover and explore ${orgTypeFilter} initiatives across Kenya`
                : 'Discover and explore all published initiatives across Kenya'}
            </p>
          </div>
          <button
            onClick={loadAllInitiatives}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
            title="Refresh initiatives"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
            <p className="text-secondary">Loading initiatives...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button 
              onClick={loadAllInitiatives}
              className="mt-2 text-sm underline text-accent-primary"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters and Search */}
        {!loading && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search initiatives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-overlay border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'published', 'active', 'completed', 'stalled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
                    filter === status
                      ? 'text-primary'
                      : 'bg-secondary text-secondary hover:text-primary border border-subtle'
                  }`}
                  style={filter === status ? { backgroundColor: 'var(--accent-primary)', color: '#121212' } : {}}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Initiatives Grid */}
        {!loading && filteredInitiatives.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary text-lg">No initiatives found matching your criteria.</p>
            {initiatives.length === 0 && (
              <Link
                to="/"
                className="btn-primary mt-4 inline-block"
              >
                Create Your First Initiative
              </Link>
            )}
          </div>
        ) : !loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInitiatives.map((initiative) => {
              const progressPercentage = initiative.target_amount > 0 
                ? (initiative.raised_amount / initiative.target_amount) * 100 
                : 0

              return (
                <div
                  key={initiative.id}
                  className="bg-secondary border border-subtle rounded-lg overflow-hidden hover:border-divider transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image placeholder or first reference image */}
                  <div className="h-48 relative" style={{ backgroundColor: categoryColors[initiative.category] || 'var(--bg-overlay)' }}>
                    {initiative.reference_images && initiative.reference_images.length > 0 ? (
                      <img
                        src={initiative.reference_images[0]}
                        alt={initiative.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div
                          className="w-16 h-16 rounded-full"
                          style={{ backgroundColor: categoryColors[initiative.category] }}
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[initiative.category] }}
                      />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[initiative.status]}`}>
                        {initiative.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-heading font-bold text-accent-primary mb-2 line-clamp-2">
                      {initiative.title}
                    </h3>
                    <p className="text-secondary text-sm mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {initiative.location.county} County
                    </p>
                    
                    {initiative.description && (
                      <div className="mb-4">
                        <p 
                          className="text-secondary mb-0 line-clamp-3"
                          style={{
                            lineHeight: '1.6',
                            fontSize: '14px',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {initiative.description.split(/\n\n+/)[0].substring(0, 150)}
                          {initiative.description.length > 150 ? '...' : ''}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">Progress</span>
                        <span className="font-semibold text-accent-primary">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-overlay rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent-primary)' }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/initiatives/${initiative.id}`}
                      className="btn-primary block w-full text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Initiatives
