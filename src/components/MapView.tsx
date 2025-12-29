import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Initiative } from '../types'

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
  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }

  const createCustomIcon = (category: string, status: string) => {
    const color = categoryColors[category]
    const isActive = status === 'active' || status === 'published'
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ${isActive ? 'animation: pulse 2s infinite;' : ''}
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

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

  // Filter out initiatives with invalid coordinates
  const validInitiatives = allInitiatives.filter(initiative => {
    const coords = initiative.location?.coordinates
    if (!coords) return false
    
    const lat = coords.lat
    const lng = coords.lng
    
    return typeof lat === 'number' && 
           typeof lng === 'number' &&
           !isNaN(lat) && 
           !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180
  })

  return (
    <MapContainer
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
        return (
          <Marker
            key={initiative.id}
            position={[coords.lat, coords.lng]}
            icon={createCustomIcon(initiative.category, initiative.status)}
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
