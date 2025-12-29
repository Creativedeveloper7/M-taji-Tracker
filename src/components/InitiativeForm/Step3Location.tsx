import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet'
import L from 'leaflet'
import { Initiative } from '../../types'
import { kenyanCounties, getConstituencies } from '../../data/kenyanCounties'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const Step3Location = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<Partial<Initiative>>()

  const [mapMode, setMapMode] = useState<'pin' | 'polygon'>('pin')
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const county = watch('location.county')
  const coordinates = watch('location.coordinates')
  const category = watch('category')

  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }

  const constituencies = county ? getConstituencies(county) : []

  const createCustomIcon = (color: string) => {
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
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  // Map click handler component
  const MapClickHandler = ({ 
    mapMode, 
    isDrawing, 
    onPinClick, 
    onPolygonClick 
  }: { 
    mapMode: 'pin' | 'polygon'
    isDrawing: boolean
    onPinClick: (lat: number, lng: number) => void
    onPolygonClick: (lat: number, lng: number) => void
  }) => {
    useMapEvents({
      click: (e) => {
        if (mapMode === 'pin') {
          onPinClick(e.latlng.lat, e.latlng.lng)
        } else if (mapMode === 'polygon' && isDrawing) {
          onPolygonClick(e.latlng.lat, e.latlng.lng)
        }
      },
    })
    return null
  }

  useEffect(() => {
    if (polygonPoints.length > 0) {
      setValue('location.geofence', polygonPoints)
    }
  }, [polygonPoints, setValue])

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('location.coordinates', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Location & Mapping</h3>
        <p className="text-gray-600 text-sm">Specify where your initiative will take place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            County <span className="text-red-500">*</span>
          </label>
          <select
            {...register('location.county', { required: 'County is required' })}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
              errors.location?.county ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">Select county</option>
            {kenyanCounties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.location?.county && (
            <p className="mt-1 text-sm text-red-500">{errors.location.county.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Constituency <span className="text-red-500">*</span>
          </label>
          <select
            {...register('location.constituency', { required: 'Constituency is required' })}
            disabled={!county}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
              errors.location?.constituency ? 'border-red-500' : 'border-gray-200'
            } ${!county ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">Select constituency</option>
            {constituencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.location?.constituency && (
            <p className="mt-1 text-sm text-red-500">{errors.location.constituency.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Specific Area Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('location.specific_area', { required: 'Specific area is required' })}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
            errors.location?.specific_area ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder="e.g., Kibera Slums, Mathare Valley, etc."
        />
        {errors.location?.specific_area && (
          <p className="mt-1 text-sm text-red-500">{errors.location.specific_area.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            Map Location <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              📍 Use My Location
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setMapMode('pin')
                  setIsDrawing(false)
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  mapMode === 'pin'
                    ? 'bg-mtaji-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📌 Pin
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapMode('polygon')
                  setIsDrawing(true)
                  setPolygonPoints([])
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  mapMode === 'polygon'
                    ? 'bg-mtaji-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔷 Polygon
              </button>
            </div>
          </div>
        </div>
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden" style={{ height: '400px' }}>
          <MapContainer
            center={coordinates || [-0.0236, 37.9062]}
            zoom={coordinates ? 12 : 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler
              mapMode={mapMode}
              isDrawing={isDrawing}
              onPinClick={(lat, lng) => {
                setValue('location.coordinates', { lat, lng })
              }}
              onPolygonClick={(lat, lng) => {
                setPolygonPoints((prev) => [...prev, { lat, lng }])
              }}
            />
            {coordinates && (
              <Marker
                position={[coordinates.lat, coordinates.lng]}
                icon={createCustomIcon(categoryColors[category || 'agriculture'])}
              />
            )}
            {polygonPoints.length > 0 && (
              <Polygon
                positions={polygonPoints.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: categoryColors[category || 'agriculture'],
                  fillColor: categoryColors[category || 'agriculture'],
                  fillOpacity: 0.3,
                }}
              />
            )}
          </MapContainer>
        </div>
        {mapMode === 'polygon' && (
          <p className="mt-2 text-sm text-gray-600">
            Click on the map to add points to your polygon. Click "Pin" mode to switch back.
          </p>
        )}
        {coordinates && (
          <p className="mt-2 text-sm text-mtaji-primary">
            Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        )}
        {errors.location?.coordinates && (
          <p className="mt-1 text-sm text-red-500">{errors.location.coordinates.message}</p>
        )}
      </div>
    </div>
  )
}

export default Step3Location

