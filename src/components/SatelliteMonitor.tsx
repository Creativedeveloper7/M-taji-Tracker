import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { satelliteService, SatelliteSnapshot } from '../services/satelliteService';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom location marker
const createLocationMarker = () => {
  return L.divIcon({
    className: 'custom-location-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: #00A859;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to sync map views in comparison mode
function SyncMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

interface Props {
  initiativeId: string;
  location: { lat: number; lng: number };
  startDate: string; // When project started
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional snapshots already stored on the initiative (from backend jobs).
   * When provided, these are treated as the source of truth for historical imagery,
   * and the client-side Mapbox generator is only used as a fallback when empty.
   */
  storedSnapshots?: SatelliteSnapshot[] | null;
}

export const SatelliteMonitor: React.FC<Props> = ({
  initiativeId,
  location,
  startDate,
  isOpen,
  onClose,
  storedSnapshots
}) => {
  const [snapshots, setSnapshots] = useState<SatelliteSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'comparison' | 'slider'>('single');
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'terrain' | 'default'>('satellite');
  const [sliderPosition, setSliderPosition] = useState(50); // For slider comparison mode

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, initiativeId, location.lat, location.lng, startDate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && snapshots.length > 0) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' && snapshots.length > 0) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, snapshots.length]);

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    const container = (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;

    const getClientX = (event: MouseEvent | TouchEvent) => {
      return 'touches' in event ? event.touches[0].clientX : event.clientX;
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const rect = container!.getBoundingClientRect();
      const newX = getClientX(moveEvent) - rect.left;
      const newLeft = Math.max(0, Math.min(100, (newX / rect.width) * 100));
      setSliderPosition(newLeft);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove as EventListener);
    document.addEventListener('touchend', handleEnd);
  };

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Prefer snapshots already stored on the initiative (from backend jobs / Sentinel Hub)
      if (storedSnapshots && storedSnapshots.length > 0) {
        console.log('🛰️ Using stored satellite_snapshots from initiative:', {
          count: storedSnapshots.length,
          dates: storedSnapshots.map(s => s.date),
        });

        // Sort by date ascending to ensure timeline order
        const sorted = [...storedSnapshots].sort((a, b) => a.date.localeCompare(b.date));
        setSnapshots(sorted);

        if (sorted.length > 0) {
          setCurrentIndex(sorted.length - 1); // latest as "after"
          setComparisonIndex(0);              // earliest as "before"
          console.log('📅 Current snapshot:', sorted[sorted.length - 1].date);
          console.log('📅 Comparison snapshot:', sorted[0].date);
        }
        return;
      }

      // 2) Fallback: generate synthetic historical snapshots on the client using Mapbox
      // Go back 6 months (180 days) to ensure we have historical data
      const endDate = new Date().toISOString().split('T')[0];
      const fallbackStartDate = new Date();
      fallbackStartDate.setDate(fallbackStartDate.getDate() - 180); // 6 months ago
      const startDateStr = fallbackStartDate.toISOString().split('T')[0];
      
      console.log('🛰️ No stored snapshots found. Generating client-side historical snapshots...', {
        lat: location.lat,
        lng: location.lng,
        startDate: startDateStr,
        endDate,
        daysBack: 180,
      });

      const data = await satelliteService.getHistoricalSnapshots(
        location.lat,
        location.lng,
        1000, // radius in meters
        startDateStr,
        endDate,
        15 // interval in days (every 2 weeks for better coverage)
      );

      console.log(`✅ Generated ${data.length} client-side satellite snapshots`);
      setSnapshots(data);

      if (data.length > 0) {
        setCurrentIndex(data.length - 1); // most recent
        setComparisonIndex(0);            // earliest
        console.log('📅 Current snapshot:', data[data.length - 1].date);
        console.log('📅 Comparison snapshot:', data[0].date);
      } else {
        console.warn('⚠️ No snapshots generated');
      }
    } catch (err: any) {
      console.error('❌ Failed to load snapshots:', err);
      setError(err.message || 'Failed to load satellite imagery');
    } finally {
      setLoading(false);
    }
  };

  const currentSnapshot = snapshots[currentIndex];
  const comparisonSnapshot = snapshots[comparisonIndex];

  // Debug: Log when comparisonIndex changes
  useEffect(() => {
    if (comparisonIndex !== undefined && snapshots.length > 0) {
      console.log('🔄 Before image index changed:', {
        comparisonIndex,
        date: comparisonSnapshot?.date,
        totalSnapshots: snapshots.length
      });
    }
  }, [comparisonIndex, comparisonSnapshot?.date, snapshots.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black bg-opacity-70 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-heading font-bold text-mtaji-primary">
              Satellite Monitoring
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track physical progress over time
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {storedSnapshots && storedSnapshots.length > 0
                ? 'Using stored satellite snapshots (can include true historical imagery).'
                : 'Using live Mapbox satellite imagery as a fallback (current imagery only).'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'single'
                  ? 'bg-mtaji-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single View
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'comparison'
                  ? 'bg-mtaji-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'slider'
                  ? 'bg-mtaji-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Slider Compare
            </button>
            {/* Map Style Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-white text-mtaji-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Satellite"
              >
                🛰️
              </button>
              <button
                onClick={() => setMapStyle('terrain')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mapStyle === 'terrain'
                    ? 'bg-white text-mtaji-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Terrain"
              >
                ⛰️
              </button>
              <button
                onClick={() => setMapStyle('default')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mapStyle === 'default'
                    ? 'bg-white text-mtaji-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Street"
              >
                🗺️
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading satellite imagery...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadSnapshots}
                className="px-4 py-2 bg-mtaji-accent text-white rounded-lg hover:bg-mtaji-primary-light"
              >
                Retry
              </button>
            </div>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🛰️</div>
              <p className="text-gray-600 text-lg mb-2">No satellite imagery available</p>
              <p className="text-gray-500 text-sm">
                Satellite imagery will be captured automatically when projects are registered
              </p>
              <button
                onClick={loadSnapshots}
                className="mt-4 px-4 py-2 bg-mtaji-accent text-white rounded-lg hover:bg-mtaji-primary-light"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Map View */}
            <div className="flex-1 p-6">
              {viewMode === 'single' ? (
                // Single view
                <div className="h-full rounded-xl overflow-hidden border-2 border-gray-200 relative">
                  {/* Date Display Overlay */}
                  {currentSnapshot && (
                    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-600">
                        Snapshot {currentIndex + 1} of {snapshots.length}
                      </p>
                    </div>
                  )}
                  <MapContainer
                    key={`single-${mapStyle}-${currentIndex}`}
                    center={[location.lat, location.lng]}
                    zoom={17}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                  >
                    {mapStyle === 'satellite' ? (
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                    ) : mapStyle === 'terrain' ? (
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                    ) : (
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                    )}
                    {currentSnapshot && (
                      <ImageOverlay
                        key={`snapshot-${currentIndex}-${currentSnapshot.date}`}
                        url={currentSnapshot.imageUrl}
                        bounds={new LatLngBounds(
                          [currentSnapshot.bounds.south, currentSnapshot.bounds.west],
                          [currentSnapshot.bounds.north, currentSnapshot.bounds.east]
                        )}
                        opacity={0.85}
                        zIndex={100}
                      />
                    )}
                    {/* Location Marker */}
                    <Marker
                      position={[location.lat, location.lng]}
                      icon={createLocationMarker()}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">Initiative Location</p>
                          <p className="text-xs text-gray-600">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    <SyncMapView center={[location.lat, location.lng]} zoom={17} />
                  </MapContainer>
                </div>
              ) : viewMode === 'comparison' ? (
                // Comparison view - side by side
                <div className="h-full grid grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                    <div className="bg-mtaji-primary text-white px-4 py-2 text-sm font-medium">
                      Before: {comparisonSnapshot ? new Date(comparisonSnapshot.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </div>
                    <MapContainer
                      key={`before-${comparisonIndex}-${mapStyle}-${comparisonSnapshot?.date || 'none'}`}
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: 'calc(100% - 40px)', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      {mapStyle === 'satellite' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : mapStyle === 'terrain' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      )}
                      {comparisonSnapshot && comparisonSnapshot.imageUrl && (
                        <ImageOverlay
                          key={`comparison-overlay-${comparisonIndex}-${comparisonSnapshot.date}-${mapStyle}-${comparisonSnapshot.imageUrl}`}
                          url={comparisonSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [comparisonSnapshot.bounds.south, comparisonSnapshot.bounds.west],
                            [comparisonSnapshot.bounds.north, comparisonSnapshot.bounds.east]
                          )}
                          opacity={0.75}
                          zIndex={100}
                        />
                      )}
                      {/* Location Marker */}
                      <Marker
                        position={[location.lat, location.lng]}
                        icon={createLocationMarker()}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Initiative Location</p>
                            <p className="text-xs text-gray-600">
                              {comparisonSnapshot ? new Date(comparisonSnapshot.date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <SyncMapView center={[location.lat, location.lng]} zoom={17} />
                    </MapContainer>
                  </div>

                  <div className="rounded-xl overflow-hidden border-2 border-mtaji-accent">
                    <div className="bg-mtaji-accent text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
                      <span>After: {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}</span>
                      {currentSnapshot && comparisonSnapshot && (
                        <span className="text-xs opacity-90">
                          {Math.round((new Date(currentSnapshot.date).getTime() - new Date(comparisonSnapshot.date).getTime()) / (1000 * 60 * 60 * 24))} days later
                        </span>
                      )}
                    </div>
                    <MapContainer
                      key={`after-${currentIndex}-${mapStyle}`}
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: 'calc(100% - 40px)', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      {mapStyle === 'satellite' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : mapStyle === 'terrain' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      )}
                      {currentSnapshot && (
                        <ImageOverlay
                          key={`current-overlay-${currentIndex}`}
                          url={currentSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [currentSnapshot.bounds.south, currentSnapshot.bounds.west],
                            [currentSnapshot.bounds.north, currentSnapshot.bounds.east]
                          )}
                          opacity={0.85}
                          zIndex={100}
                        />
                      )}
                      {/* Location Marker */}
                      <Marker
                        position={[location.lat, location.lng]}
                        icon={createLocationMarker()}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Initiative Location</p>
                            <p className="text-xs text-gray-600">
                              {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <SyncMapView center={[location.lat, location.lng]} zoom={17} />
                    </MapContainer>
                  </div>
                </div>
              ) : (
                // Slider comparison view
                <div className="h-full rounded-xl overflow-hidden border-2 border-gray-200 relative">
                  {/* Date Display Overlay */}
                  <div className="absolute top-4 left-4 z-[2000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Before</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {comparisonSnapshot ? new Date(comparisonSnapshot.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div className="w-px bg-gray-300"></div>
                    <div>
                      <p className="text-xs text-gray-600">After</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </p>
                    </div>
                    {currentSnapshot && comparisonSnapshot && (
                      <div className="pl-4 border-l border-gray-300">
                        <p className="text-xs text-gray-600">Difference</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {Math.round((new Date(currentSnapshot.date).getTime() - new Date(comparisonSnapshot.date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Before Image (Background) */}
                  <div className="absolute inset-0">
                    <MapContainer
                      key={`slider-before-${comparisonIndex}-${mapStyle}-${comparisonSnapshot?.date || 'none'}`}
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      dragging={false}
                      touchZoom={false}
                      doubleClickZoom={false}
                      boxZoom={false}
                    >
                      {mapStyle === 'satellite' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : mapStyle === 'terrain' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      )}
                      {comparisonSnapshot && comparisonSnapshot.imageUrl && (
                        <ImageOverlay
                          key={`slider-before-overlay-${comparisonIndex}-${comparisonSnapshot.date}-${mapStyle}-${comparisonSnapshot.imageUrl}`}
                          url={comparisonSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [comparisonSnapshot.bounds.south, comparisonSnapshot.bounds.west],
                            [comparisonSnapshot.bounds.north, comparisonSnapshot.bounds.east]
                          )}
                          opacity={1}
                          zIndex={100}
                        />
                      )}
                      <Marker
                        position={[location.lat, location.lng]}
                        icon={createLocationMarker()}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Before</p>
                            <p className="text-xs text-gray-600">
                              {comparisonSnapshot ? new Date(comparisonSnapshot.date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <SyncMapView center={[location.lat, location.lng]} zoom={17} />
                    </MapContainer>
                  </div>

                  {/* After Image (Foreground with clip) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <MapContainer
                      key={`slider-after-${currentIndex}-${mapStyle}`}
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      dragging={false}
                      touchZoom={false}
                      doubleClickZoom={false}
                      boxZoom={false}
                    >
                      {mapStyle === 'satellite' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : mapStyle === 'terrain' ? (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      ) : (
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                        />
                      )}
                      {currentSnapshot && currentSnapshot.imageUrl && (
                        <ImageOverlay
                          key={`slider-after-overlay-${currentIndex}-${currentSnapshot.date}-${mapStyle}`}
                          url={currentSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [currentSnapshot.bounds.south, currentSnapshot.bounds.west],
                            [currentSnapshot.bounds.north, currentSnapshot.bounds.east]
                          )}
                          opacity={1}
                          zIndex={200}
                        />
                      )}
                      <Marker
                        position={[location.lat, location.lng]}
                        icon={createLocationMarker()}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">After</p>
                            <p className="text-xs text-gray-600">
                              {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <SyncMapView center={[location.lat, location.lng]} zoom={17} />
                    </MapContainer>
                  </div>

                  {/* Slider Control */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white border-l-2 border-r-2 border-mtaji-accent cursor-col-resize z-[3000] shadow-lg touch-none"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSliderMove(e);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleSliderMove(e);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-mtaji-accent rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[2000] bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Drag the slider to compare images
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Controls */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {viewMode === 'comparison' || viewMode === 'slider' ? (
                // Comparison mode - show both date selectors
                <>
                  {/* After Image Date Selector */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <label className="font-semibold text-mtaji-accent flex items-center gap-2">
                        <span>After Image:</span>
                        <span className="text-base font-bold">
                          {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'No date'}
                        </span>
                      </label>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Cloud:</span>
                        <span className="font-semibold">{currentSnapshot?.cloudCoverage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, snapshots.length - 1)}
                        step={1}
                        value={currentIndex}
                        onChange={(e) => {
                          const newIndex = Number(e.target.value);
                          console.log('📅 After image slider moved:', { 
                            oldIndex: currentIndex, 
                            newIndex,
                            date: snapshots[newIndex]?.date 
                          });
                          setCurrentIndex(newIndex);
                        }}
                        onInput={(e) => {
                          // Immediate update on drag
                          const newIndex = Number((e.target as HTMLInputElement).value);
                          if (newIndex !== currentIndex) {
                            setCurrentIndex(newIndex);
                          }
                        }}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mtaji-accent"
                      />
                      {snapshots.length > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span className="font-medium">
                            {snapshots[0] ? new Date(snapshots[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                          <span className="text-gray-400">
                            Snapshot {currentIndex + 1} of {snapshots.length}
                          </span>
                          <span className="font-medium">
                            {snapshots[snapshots.length - 1] ? new Date(snapshots[snapshots.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Before Image Date Selector */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <label className="font-semibold text-mtaji-primary flex items-center gap-2">
                        <span>Before Image:</span>
                        <span className="text-base font-bold">
                          {comparisonSnapshot ? new Date(comparisonSnapshot.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Select date'}
                        </span>
                      </label>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Cloud:</span>
                        <span className="font-semibold">{comparisonSnapshot?.cloudCoverage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, snapshots.length - 1)}
                        step={1}
                        value={comparisonIndex}
                        onChange={(e) => {
                          const newIndex = Number(e.target.value);
                          console.log('📅 Before image slider moved:', { 
                            oldIndex: comparisonIndex, 
                            newIndex,
                            date: snapshots[newIndex]?.date 
                          });
                          setComparisonIndex(newIndex);
                        }}
                        onInput={(e) => {
                          // Immediate update on drag
                          const newIndex = Number((e.target as HTMLInputElement).value);
                          if (newIndex !== comparisonIndex) {
                            setComparisonIndex(newIndex);
                          }
                        }}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mtaji-primary"
                      />
                      {snapshots.length > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span className="font-medium">
                            {snapshots[0] ? new Date(snapshots[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                          <span className="text-gray-400">
                            Snapshot {comparisonIndex + 1} of {snapshots.length}
                          </span>
                          <span className="font-medium">
                            {snapshots[snapshots.length - 1] ? new Date(snapshots[snapshots.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparison Info */}
                  {currentSnapshot && comparisonSnapshot && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-blue-900">
                            Time Difference:
                          </span>
                          <span className="text-base font-bold text-blue-700">
                            {Math.abs(Math.round((new Date(currentSnapshot.date).getTime() - new Date(comparisonSnapshot.date).getTime()) / (1000 * 60 * 60 * 24)))} days
                          </span>
                          {new Date(currentSnapshot.date) > new Date(comparisonSnapshot.date) ? (
                            <span className="text-xs text-blue-600">(After is newer)</span>
                          ) : (
                            <span className="text-xs text-blue-600">(Before is newer)</span>
                          )}
                        </div>
                        {currentIndex === comparisonIndex && (
                          <span className="text-xs text-amber-600 font-medium">
                            ⚠️ Both images show the same date
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {viewMode === 'slider' && (
                    <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        💡 Tip: Adjust the date sliders above, then use the slider control on the map to reveal the "before" and "after" images side by side.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // Single view mode
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-lg">
                        {currentSnapshot ? new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'No date'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Cloud Coverage:</span>
                        <span className="font-semibold">{currentSnapshot?.cloudCoverage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>💡</span>
                        <span>Arrow keys ← → to navigate, ESC to close</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, snapshots.length - 1)}
                      step={1}
                      value={currentIndex}
                      onChange={(e) => {
                        const newIndex = Number(e.target.value);
                        setCurrentIndex(newIndex);
                      }}
                      onInput={(e) => {
                        // Immediate update on drag
                        const newIndex = Number((e.target as HTMLInputElement).value);
                        if (newIndex !== currentIndex) {
                          setCurrentIndex(newIndex);
                        }
                      }}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mtaji-accent"
                    />
                    {snapshots.length > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span className="font-medium">
                          {snapshots[0] ? new Date(snapshots[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                        <span className="text-gray-400">
                          Snapshot {currentIndex + 1} of {snapshots.length}
                        </span>
                        <span className="font-medium">
                          {snapshots[snapshots.length - 1] ? new Date(snapshots[snapshots.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Jump Buttons */}
              {snapshots.length > 0 && (
                <div className="space-y-2">
                  {(viewMode === 'comparison' || viewMode === 'slider') ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-24">After Image:</span>
                        <div className="flex gap-2 flex-wrap flex-1">
                          <button
                            onClick={() => setCurrentIndex(0)}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Earliest
                          </button>
                          {snapshots.length > 2 && (
                            <button
                              onClick={() => setCurrentIndex(Math.floor(snapshots.length / 2))}
                              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Mid-Point
                            </button>
                          )}
                          <button
                            onClick={() => setCurrentIndex(snapshots.length - 1)}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Latest
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-24">Before Image:</span>
                        <div className="flex gap-2 flex-wrap flex-1">
                          <button
                            onClick={() => setComparisonIndex(0)}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Earliest
                          </button>
                          {snapshots.length > 2 && (
                            <button
                              onClick={() => setComparisonIndex(Math.floor(snapshots.length / 2))}
                              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Mid-Point
                            </button>
                          )}
                          <button
                            onClick={() => setComparisonIndex(snapshots.length - 1)}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Latest
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setCurrentIndex(0)}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Project Start
                      </button>
                      {snapshots.length > 2 && (
                        <button
                          onClick={() => setCurrentIndex(Math.floor(snapshots.length / 2))}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Mid-Point
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentIndex(snapshots.length - 1)}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Latest
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

