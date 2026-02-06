import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Initiative } from '../types'
import { createStatusMarker } from '../utils/markerStyles'

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapViewProps {
  onInitiativeSelect: (initiative: Initiative) => void
  customInitiatives?: Initiative[]
}

const MapView = ({ onInitiativeSelect, customInitiatives = [] }: MapViewProps) => {

  // Use only Supabase initiatives (no sample data)
  const allInitiatives: Initiative[] = customInitiatives || []

  // Calculate map center based on initiatives, or use default Kenya center
  const mapCenter = useMemo(() => {
    if (allInitiatives.length === 0) {
      return [-0.0236, 37.9062] as [number, number] // Default: Kenya center
    }
    
    // Calculate center from all initiative coordinates
    const validInitiatives = allInitiatives.filter(
      init => init.location?.coordinates?.lat && init.location?.coordinates?.lng
    )
    
    if (validInitiatives.length === 0) {
      return [-0.0236, 37.9062] as [number, number]
    }
    
    const avgLat = validInitiatives.reduce((sum, init) => 
      sum + init.location.coordinates.lat, 0) / validInitiatives.length
    const avgLng = validInitiatives.reduce((sum, init) => 
      sum + init.location.coordinates.lng, 0) / validInitiatives.length
    
    return [avgLat, avgLng] as [number, number]
  }, [allInitiatives])

  // Filter out initiatives with invalid coordinates and ensure they're numbers
  const validInitiatives = useMemo(() => {
    return allInitiatives.filter(initiative => {
      const coords = initiative.location?.coordinates
      if (!coords) {
        console.warn(`Initiative ${initiative.id} (${initiative.title}) has no coordinates`)
        return false
      }
      
      // Convert to numbers if they're strings
      let lat = coords.lat
      let lng = coords.lng
      
      if (typeof lat === 'string') {
        lat = parseFloat(lat)
      }
      if (typeof lng === 'string') {
        lng = parseFloat(lng)
      }
      
      const isValid = typeof lat === 'number' && 
             typeof lng === 'number' &&
             !isNaN(lat) && 
             !isNaN(lng) &&
             lat >= -90 && lat <= 90 &&
             lng >= -180 && lng <= 180
      
      if (!isValid) {
        console.warn(`Initiative ${initiative.id} (${initiative.title}) has invalid coordinates:`, { 
          lat, 
          lng, 
          latType: typeof lat, 
          lngType: typeof lng,
          originalCoords: coords
        })
      }
      
      return isValid
    }).map(initiative => {
      // Ensure coordinates are numbers in the returned object
      const coords = initiative.location.coordinates
      return {
        ...initiative,
        location: {
          ...initiative.location,
          coordinates: {
            lat: typeof coords.lat === 'string' ? parseFloat(coords.lat) : coords.lat,
            lng: typeof coords.lng === 'string' ? parseFloat(coords.lng) : coords.lng,
          }
        }
      }
    })
  }, [allInitiatives])
  
  // Debug: Log how many valid initiatives we have
  useEffect(() => {
    console.log(`=== MapView Debug ===`)
    console.log(`Total initiatives received: ${allInitiatives.length}`)
    console.log(`Valid initiatives with coordinates: ${validInitiatives.length}`)
    console.log(`All initiatives:`, allInitiatives.map(i => ({
      id: i.id,
      title: i.title,
      status: i.status,
      hasLocation: !!i.location,
      hasCoordinates: !!i.location?.coordinates,
      coordinates: i.location?.coordinates
    })))
    console.log(`Valid initiatives:`, validInitiatives.map(init => ({
      id: init.id,
      title: init.title,
      coordinates: [init.location.coordinates.lat, init.location.coordinates.lng]
    })))
    console.log(`=== End MapView Debug ===`)
  }, [allInitiatives, validInitiatives])

  // Force map to update when initiatives change
  const mapKey = useMemo(() => {
    const ids = validInitiatives.map(i => i.id).sort().join(',')
    const coordsHash = validInitiatives.map(i => 
      `${i.location.coordinates.lat.toFixed(4)},${i.location.coordinates.lng.toFixed(4)}`
    ).join('|')
    return `map-${validInitiatives.length}-${ids.substring(0, 50)}-${coordsHash.substring(0, 100)}`
  }, [validInitiatives])

  return (
    <MapContainer
      key={mapKey}
      center={mapCenter}
      zoom={allInitiatives.length > 0 ? 7 : 6}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validInitiatives.map((initiative) => {
        const coords = initiative.location.coordinates
        // Ensure coordinates are in correct order: [lat, lng] for Leaflet
        // Coordinates should already be numbers from the useMemo filter above
        const lat = typeof coords.lat === 'number' ? coords.lat : parseFloat(String(coords.lat))
        const lng = typeof coords.lng === 'number' ? coords.lng : parseFloat(String(coords.lng))
        
        // Final validation before rendering
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.error(`Invalid coordinates for initiative ${initiative.id} (${initiative.title}):`, {
            lat,
            lng,
            latType: typeof lat,
            lngType: typeof lng,
            originalCoords: coords
          })
          return null
        }
        
        // Log each marker being rendered for debugging
        console.log(`Rendering marker for ${initiative.title} at [${lat}, ${lng}]`)
        
        // Get status from satellite analysis
        const snapshots = initiative.satellite_snapshots || []
        const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null
        const statusInfo = latestSnapshot?.ai_analysis?.status || 'baseline'
        const statusNote = latestSnapshot?.ai_analysis?.notes || ''

        return (
          <Marker
            key={initiative.id}
            position={[lat, lng]}
            icon={createStatusMarker(initiative)}
            eventHandlers={{
              click: () => {
                onInitiativeSelect(initiative)
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-heading font-bold text-mtaji-primary text-sm mb-1">
                  {initiative.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {initiative.location.county} County
                  {initiative.location.constituency && `, ${initiative.location.constituency}`}
                </p>
                {initiative.location.specific_area && (
                  <p className="text-xs text-gray-500">{initiative.location.specific_area}</p>
                )}
                {latestSnapshot && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700">
                      Status: <span className={`${
                        statusInfo === 'progress' ? 'text-amber-600 dark:text-amber-400' :
                        statusInfo === 'stalled' ? 'text-red-600' :
                        statusInfo === 'completed' ? 'text-amber-700 dark:text-amber-400' :
                        'text-yellow-600'
                      }`}>
                        {statusInfo.charAt(0).toUpperCase() + statusInfo.slice(1)}
                      </span>
                    </p>
                    {statusNote && (
                      <p className="text-xs text-gray-500 mt-1">{statusNote}</p>
                    )}
                    {latestSnapshot.ai_analysis?.changePercentage !== undefined && (
                      <p className="text-xs text-gray-500">
                        Change: {latestSnapshot.ai_analysis.changePercentage.toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
      <MapStyle />
    </MapContainer>
  )
}

// Component to add custom styles to the map
const MapStyle = () => {
  const map = useMap()
  
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
      }
      @keyframes statusPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.4;
        }
        50% {
          transform: scale(1.3);
          opacity: 0.2;
        }
      }
      .custom-status-marker {
        background: transparent !important;
        border: none !important;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [map])
  
  return null
}

export default MapView
