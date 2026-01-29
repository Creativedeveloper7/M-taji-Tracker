import { useState, useEffect } from 'react'
import Header from '../components/Header'
import MapView from '../components/MapView'
import Legend from '../components/Legend'
import InitiativeModal from '../components/InitiativeModal'
import InitiativeForm from '../components/InitiativeForm'
import { Initiative } from '../types'
import { fetchInitiatives, createInitiative } from '../services/initiatives'
import { testSupabaseConnection } from '../utils/testSupabase'
import { testMapboxConnection } from '../utils/testMapbox'

function Home() {
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initiatives from Supabase on mount
  useEffect(() => {
    // Test connections on first load (only in development)
    if (import.meta.env.DEV) {
      testSupabaseConnection().then(success => {
        if (success) {
          console.log('✅ Supabase connection verified')
        } else {
          console.warn('⚠️ Supabase connection test failed. Check your .env file and database setup.')
        }
      })
      
      // Test Mapbox connection
      testMapboxConnection()
    }
    
    loadInitiatives()
  }, [])

  // Listen for refresh events and visibility changes
  useEffect(() => {
    // Reload when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible, reloading initiatives...')
        loadInitiatives()
      }
    }
    
    // Listen for custom refresh event (triggered after creating new initiatives)
    const handleRefresh = () => {
      console.log('🔄 Refresh event received, reloading initiatives...')
      loadInitiatives()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('initiatives-refresh', handleRefresh)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('initiatives-refresh', handleRefresh)
    }
  }, [])

  const loadInitiatives = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Loading initiatives for map view...')
      const data = await fetchInitiatives()
      console.log(`✅ Loaded ${data.length} initiatives for map`)
      console.log('📋 Initiative details:', data.map(i => ({
        id: i.id,
        title: i.title,
        status: i.status,
        coordinates: i.location?.coordinates,
        hasCoords: !!i.location?.coordinates?.lat && !!i.location?.coordinates?.lng,
        county: i.location?.county
      })))
      
      // Filter out initiatives without valid coordinates for map display
      const validInitiatives = data.filter(i => 
        i.location?.coordinates?.lat && 
        i.location?.coordinates?.lng &&
        !isNaN(i.location.coordinates.lat) &&
        !isNaN(i.location.coordinates.lng)
      )
      
      if (validInitiatives.length < data.length) {
        console.warn(`⚠️ Filtered out ${data.length - validInitiatives.length} initiatives without valid coordinates`)
      }
      
      setInitiatives(validInitiatives)
    } catch (err) {
      console.error('❌ Failed to load initiatives:', err)
      setError('Failed to load initiatives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (newInitiative: Initiative) => {
    setError(null)
    console.log('Creating initiative:', newInitiative)
    console.log('Location data:', newInitiative.location)
    console.log('Coordinates:', newInitiative.location.coordinates)
    
    const created = await createInitiative(newInitiative)
    
    if (created) {
      console.log('Created initiative:', created)
      console.log('Created initiative location:', created.location)
      console.log('Created initiative coordinates:', created.location.coordinates)
      
      // Reload initiatives to get the latest data
      await loadInitiatives()
      setShowForm(false)
      console.log('New initiative created successfully:', created)
    } else {
      const errorMsg = 'Failed to create initiative. Check console for details.'
      setError(errorMsg)
      console.error('createInitiative returned null - check console above for errors')
      // Throw error so the form can catch it
      throw new Error(errorMsg)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-primary">
      <Header onCreateInitiative={() => setShowForm(true)} />
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay bg-opacity-75 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
              <p className="text-primary font-medium">Loading initiatives...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded z-50">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline text-accent-primary"
            >
              Dismiss
            </button>
          </div>
        )}
        <MapView 
          onInitiativeSelect={setSelectedInitiative}
          customInitiatives={initiatives}
        />
        <Legend />
        {selectedInitiative && (
          <InitiativeModal 
            initiative={selectedInitiative} 
            onClose={() => setSelectedInitiative(null)} 
          />
        )}
        {showForm && (
          <InitiativeForm
            onClose={() => setShowForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </div>
  )
}

export default Home

