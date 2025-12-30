import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { satelliteService, SatelliteSnapshot } from '../services/satelliteService';

interface Props {
  initiativeId: string;
  location: { lat: number; lng: number };
  startDate: string; // When project started
  isOpen: boolean;
  onClose: () => void;
}

export const SatelliteMonitor: React.FC<Props> = ({
  initiativeId,
  location,
  startDate,
  isOpen,
  onClose
}) => {
  const [snapshots, setSnapshots] = useState<SatelliteSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');
  const [comparisonIndex, setComparisonIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, initiativeId, location.lat, location.lng, startDate]);

  const loadSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const data = await satelliteService.getHistoricalSnapshots(
        location.lat,
        location.lng,
        500, // radius in meters
        startDate,
        endDate,
        30 // interval in days
      );
      setSnapshots(data);
      if (data.length > 0) {
        setCurrentIndex(data.length - 1); // Start with most recent
        setComparisonIndex(0); // Compare with first
      }
    } catch (err: any) {
      console.error('Failed to load snapshots:', err);
      setError(err.message || 'Failed to load satellite imagery');
    } finally {
      setLoading(false);
    }
  };

  const currentSnapshot = snapshots[currentIndex];
  const comparisonSnapshot = snapshots[comparisonIndex];

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
              Compare
            </button>
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
              <p className="text-gray-600">No satellite imagery available for this period.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Map View */}
            <div className="flex-1 p-6">
              {viewMode === 'single' ? (
                // Single view
                <div className="h-full rounded-xl overflow-hidden border-2 border-gray-200">
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={17}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    {currentSnapshot && (
                      <ImageOverlay
                        url={currentSnapshot.imageUrl}
                        bounds={new LatLngBounds(
                          [currentSnapshot.bounds.south, currentSnapshot.bounds.west],
                          [currentSnapshot.bounds.north, currentSnapshot.bounds.east]
                        )}
                        opacity={0.8}
                      />
                    )}
                  </MapContainer>
                </div>
              ) : (
                // Comparison view - side by side
                <div className="h-full grid grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                    <div className="bg-mtaji-primary text-white px-4 py-2 text-sm font-medium">
                      Before: {comparisonSnapshot?.date}
                    </div>
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: 'calc(100% - 40px)', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {comparisonSnapshot && (
                        <ImageOverlay
                          url={comparisonSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [comparisonSnapshot.bounds.south, comparisonSnapshot.bounds.west],
                            [comparisonSnapshot.bounds.north, comparisonSnapshot.bounds.east]
                          )}
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                  </div>

                  <div className="rounded-xl overflow-hidden border-2 border-mtaji-accent">
                    <div className="bg-mtaji-accent text-white px-4 py-2 text-sm font-medium">
                      After: {currentSnapshot?.date}
                    </div>
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={17}
                      style={{ height: 'calc(100% - 40px)', width: '100%' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {currentSnapshot && (
                        <ImageOverlay
                          url={currentSnapshot.imageUrl}
                          bounds={new LatLngBounds(
                            [currentSnapshot.bounds.south, currentSnapshot.bounds.west],
                            [currentSnapshot.bounds.north, currentSnapshot.bounds.east]
                          )}
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Controls */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{currentSnapshot?.date}</span>
                  <span>
                    Cloud Coverage: {currentSnapshot?.cloudCoverage.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, snapshots.length - 1)}
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mtaji-accent"
                />
                {snapshots.length > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{snapshots[0]?.date}</span>
                    <span>{snapshots[snapshots.length - 1]?.date}</span>
                  </div>
                )}
              </div>

              {viewMode === 'comparison' && (
                <div className="mb-4">
                  <label className="text-sm text-gray-600 mb-2 block">
                    Compare with:
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, snapshots.length - 1)}
                    value={comparisonIndex}
                    onChange={(e) => setComparisonIndex(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mtaji-primary"
                  />
                </div>
              )}

              {/* Quick Jump Buttons */}
              {snapshots.length > 0 && (
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
          </>
        )}
      </div>
    </div>
  );
};

