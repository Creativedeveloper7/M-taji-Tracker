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

  const loadInitiatives = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchInitiatives()
      console.log('Loaded initiatives:', data.length)
      console.log('Initiative details:', data.map(i => ({
        id: i.id,
        title: i.title,
        status: i.status,
        coordinates: i.location?.coordinates,
        hasCoords: !!i.location?.coordinates?.lat && !!i.location?.coordinates?.lng
      })))
      setInitiatives(data)
    } catch (err) {
      console.error('Failed to load initiatives:', err)
      setError('Failed to load initiatives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (newInitiative: Initiative) => {
    try {
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
      }
    } catch (err: any) {
      console.error('Error creating initiative:', err)
      const errorMessage = err?.message || 'Failed to create initiative. Please check your Supabase setup and RLS policies.'
      setError(errorMessage)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      <Header 
        onCreateInitiative={() => setShowForm(true)} 
        onVolunteerClick={() => {}} 
      />
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent mx-auto mb-4"></div>
              <p className="text-mtaji-primary font-medium">Loading initiatives...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
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

