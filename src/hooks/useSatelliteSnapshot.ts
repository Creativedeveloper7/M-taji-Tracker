import { useState, useEffect } from 'react'
import { satelliteService, SatelliteSnapshot } from '../services/satelliteService'

interface UseSatelliteSnapshotOptions {
  lat: number
  lng: number
  radiusMeters?: number
  date?: string
  enabled?: boolean
}

export const useSatelliteSnapshot = (options: UseSatelliteSnapshotOptions) => {
  const { lat, lng, radiusMeters = 500, date, enabled = true } = options
  const [snapshot, setSnapshot] = useState<SatelliteSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !lat || !lng) return

    const fetchSnapshot = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await satelliteService.captureSnapshot(lat, lng, radiusMeters, date)
        setSnapshot(result)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch satellite snapshot')
        console.error('Error fetching satellite snapshot:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSnapshot()
  }, [lat, lng, radiusMeters, date, enabled])

  return { snapshot, loading, error, refetch: () => {
    if (enabled) {
      setSnapshot(null)
      setError(null)
      satelliteService.captureSnapshot(lat, lng, radiusMeters, date)
        .then(setSnapshot)
        .catch(err => setError(err.message))
    }
  }}
}


