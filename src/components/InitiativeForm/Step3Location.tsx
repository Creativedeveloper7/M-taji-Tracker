import { useState, useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, useMap } from 'react-leaflet'
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
  const [coordinateDetected, setCoordinateDetected] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

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

  // Extract coordinates from text
  // Supports formats like: -0.023600, 37.906200 or -0.023600,37.906200 or lat: -0.023600, lng: 37.906200
  const extractCoordinates = (text: string): { lat: number; lng: number } | null => {
    if (!text) return null
    
    // Clean the text - remove common labels and extra text
    const cleaned = text
      .replace(/lat(itude)?:?\s*/gi, '')
      .replace(/lng|lon|long(itude)?:?\s*/gi, '')
      .replace(/[()]/g, '')
      .trim()
    
    // Coordinate regex - matches two numbers separated by comma and/or space
    const coordinateRegex = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/
    const match = cleaned.match(coordinateRegex)
    
    if (!match) return null
    
    // Extract the two numbers
    const first = parseFloat(match[1].trim())
    const second = parseFloat(match[2].trim())
    
    // Validate both are numbers
    if (isNaN(first) || isNaN(second)) return null
    
    // For Kenya coordinates, first is typically lat (-4 to 5), second is lng (33 to 42)
    // But we'll accept any valid lat/lng pair
    let lat: number, lng: number
    
    // Determine which is lat and which is lng
    // Latitude must be between -90 and 90
    // Longitude must be between -180 and 180
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      // Both could be valid - assume first is lat, second is lng (standard format)
      lat = first
      lng = second
    } else {
      return null
    }
    
    // Final validation
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
    
    return null
  }

  // Reverse geocode coordinates to get county and constituency
  const reverseGeocode = async (lat: number, lng: number) => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken || mapboxToken === 'pk.your-token-here') {
      console.log('Mapbox token not available for reverse geocoding')
      return
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=KE`
      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        // Look for county and constituency in the results
        for (const feature of data.features) {
          const context = feature.context || []
          
          // Find county (usually "district" or "region" in Kenya)
          for (const item of context) {
            if (item.id?.startsWith('district') || item.id?.startsWith('region')) {
              const countyName = item.text
              // Try to match with our county list
              const matchedCounty = kenyanCounties.find(c => 
                c.toLowerCase().includes(countyName.toLowerCase()) ||
                countyName.toLowerCase().includes(c.toLowerCase())
              )
              if (matchedCounty) {
                setValue('location.county', matchedCounty, { shouldValidate: true })
                console.log('📍 Auto-filled county:', matchedCounty)
                break
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  // Handle input change and detect coordinates
  const handleSpecificAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const detectedCoords = extractCoordinates(value)
    
    if (detectedCoords) {
      console.log('📍 GPS coordinates detected:', detectedCoords)
      setCoordinateDetected(true)
      
      // Update coordinates in form
      setValue('location.coordinates', detectedCoords, { shouldValidate: true })
      
      // Update map if it exists
      if (mapRef.current) {
        const map = mapRef.current
        map.setView([detectedCoords.lat, detectedCoords.lng], 15, {
          animate: true,
          duration: 1.0
        })
        console.log('🗺️ Map updated to coordinates:', detectedCoords)
      }
      
      // Optional: Reverse geocode to auto-fill county/constituency
      reverseGeocode(detectedCoords.lat, detectedCoords.lng)
      
      // Clear the detection flag after a moment
      setTimeout(() => setCoordinateDetected(false), 3000)
    } else {
      setCoordinateDetected(false)
    }
  }

  // Component to get map instance
  const MapController = () => {
    const map = useMap()
    
    useEffect(() => {
      mapRef.current = map
      return () => {
        mapRef.current = null
      }
    }, [map])
    
    return null
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          console.log('📍 Using current location:', coords)
          setValue('location.coordinates', coords, { shouldValidate: true })
          
          // Update map
          if (mapRef.current) {
            mapRef.current.setView([coords.lat, coords.lng], 15, {
              animate: true,
              duration: 1.0
            })
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Could not get your current location. Please click on the map to set the location.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser. Please click on the map to set the location.')
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
          <span className="text-xs text-gray-500 font-normal ml-2">
            (Enter location name or paste GPS coordinates like: -0.023600, 37.906200)
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            {...register('location.specific_area', { required: 'Specific area is required' })}
            onChange={(e) => {
              handleSpecificAreaChange(e)
              // Also call the register's onChange
              register('location.specific_area').onChange(e)
            }}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-mtaji-accent transition-all duration-300 ${
              errors.location?.specific_area ? 'border-red-500' : 
              coordinateDetected ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            placeholder="e.g., Kibera Slums, Mathare Valley, or -0.023600, 37.906200"
          />
          {coordinateDetected && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-green-600 text-sm font-medium">📍 GPS Detected</span>
            </div>
          )}
        </div>
        {coordinateDetected && (
          <p className="mt-1 text-sm text-green-600">
            ✓ GPS coordinates detected! Map has been updated.
          </p>
        )}
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
            center={coordinates ? [coordinates.lat, coordinates.lng] : [-0.0236, 37.9062]}
            zoom={coordinates ? 15 : 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            key={`map-${coordinates?.lat}-${coordinates?.lng}`} // Force re-render when coordinates change
          >
            <MapController />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler
              mapMode={mapMode}
              isDrawing={isDrawing}
              onPinClick={(lat, lng) => {
                console.log('📍 Map clicked - setting coordinates:', { lat, lng })
                setValue('location.coordinates', { lat, lng }, { shouldValidate: true })
                // Also trigger form validation
                setTimeout(() => {
                  const currentCoords = watch('location.coordinates')
                  console.log('✅ Coordinates set in form:', currentCoords)
                }, 100)
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

