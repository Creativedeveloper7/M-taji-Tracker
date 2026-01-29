import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Initiative } from '../types';
import { fetchInitiativeById } from '../services/initiatives';
import { SatelliteMonitor } from '../components/SatelliteMonitor';
import VolunteerForm from '../components/VolunteerForm';
import Header from '../components/Header';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for initiative location
const createInitiativeMarker = (color: string = '#00A859') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to center map on initiative location
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [map, center]);
  return null;
}

type MapStyle = 'default' | 'satellite' | 'terrain';

export default function InitiativeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSatelliteMonitor, setShowSatelliteMonitor] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');

  useEffect(() => {
    const loadInitiative = async () => {
      if (!id) {
        setError('Invalid initiative ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchInitiativeById(id);
        
        if (!data) {
          setError('Initiative not found');
        } else {
          setInitiative(data);
        }
      } catch (err: any) {
        console.error('Error loading initiative:', err);
        setError('Failed to load initiative details');
      } finally {
        setLoading(false);
      }
    };

    loadInitiative();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header onCreateInitiative={() => navigate('/map')} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading initiative details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !initiative) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header onCreateInitiative={() => navigate('/map')} />
        <div className="container mx-auto px-6 py-12">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold mb-2">Error</p>
            <p>{error || 'Initiative not found'}</p>
            <Link
              to="/initiatives"
              className="mt-4 inline-block text-sm underline"
            >
              ← Back to Initiatives
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = initiative.target_amount > 0
    ? (initiative.raised_amount / initiative.target_amount) * 100
    : 0;

  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    published: 'bg-blue-500',
    active: 'bg-mtaji-accent',
    completed: 'bg-green-500',
    stalled: 'bg-gray-400',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const mapCenter: [number, number] = initiative.location?.coordinates
    ? [initiative.location.coordinates.lat, initiative.location.coordinates.lng]
    : [-0.0236, 37.9062];

  const completedMilestones = initiative.milestones?.filter(m => m.status === 'completed').length || 0;
  const totalMilestones = initiative.milestones?.length || 0;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
      <Header onCreateInitiative={() => navigate('/map')} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link
          to="/initiatives"
          className="inline-flex items-center gap-2 text-mtaji-primary hover:text-mtaji-primary-dark mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Initiatives
        </Link>

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: categoryColors[initiative.category] }}
                />
                <span className="text-sm font-medium text-gray-600 uppercase">{initiative.category}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[initiative.status]}`}>
                  {initiative.status}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-mtaji-primary mb-3">
                {initiative.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {initiative.location.county} County
                </span>
                {initiative.location.constituency && (
                  <span>{initiative.location.constituency}</span>
                )}
                {initiative.location.specific_area && (
                  <span>{initiative.location.specific_area}</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-semibold text-mtaji-primary">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-mtaji-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Raised</p>
              <p className="text-xl font-heading font-bold text-mtaji-primary">
                {formatCurrency(initiative.raised_amount)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Target</p>
              <p className="text-xl font-heading font-bold text-gray-700 dark:text-gray-300">
                {formatCurrency(initiative.target_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-heading font-bold text-mtaji-primary mb-4">About This Initiative</h2>
              {initiative.short_description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg font-medium">
                  {initiative.short_description}
                </p>
              )}
              <div className="prose max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {initiative.description}
              </div>
            </div>

            {/* Milestones */}
            {initiative.milestones && initiative.milestones.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-heading font-bold text-mtaji-primary">Milestones</h2>
                  <span className="text-sm text-gray-600">
                    {completedMilestones} of {totalMilestones} completed
                  </span>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-mtaji-primary transition-all duration-500 rounded-full"
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {initiative.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id || index}
                      className={`p-4 rounded-lg border-2 ${
                        milestone.status === 'completed'
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                          : milestone.status === 'in_progress'
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {milestone.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Target: {new Date(milestone.target_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          milestone.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : milestone.status === 'in_progress'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-400 text-white'
                        }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images Gallery */}
            {initiative.reference_images && initiative.reference_images.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-heading font-bold text-mtaji-primary mb-4">Project Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {initiative.reference_images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    >
                      <img
                        src={imageUrl}
                        alt={`${initiative.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map & Actions */}
          <div className="space-y-6">
            {/* Location Map */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold text-mtaji-primary">Location</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {initiative.location.specific_area || initiative.location.county}
                  </p>
                </div>
                {/* Map Style Switcher */}
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setMapStyle('default')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mapStyle === 'default'
                        ? 'bg-white dark:bg-gray-600 text-mtaji-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Street Map"
                  >
                    🗺️ Street
                  </button>
                  <button
                    onClick={() => setMapStyle('satellite')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mapStyle === 'satellite'
                        ? 'bg-white dark:bg-gray-600 text-mtaji-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Satellite View"
                  >
                    🛰️ Satellite
                  </button>
                  <button
                    onClick={() => setMapStyle('terrain')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mapStyle === 'terrain'
                        ? 'bg-white dark:bg-gray-600 text-mtaji-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Terrain View"
                  >
                    ⛰️ Terrain
                  </button>
                </div>
              </div>
              <div className="h-64 w-full">
                <MapContainer
                  key={mapStyle} // Force re-render when style changes
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  {mapStyle === 'satellite' ? (
                    <TileLayer
                      attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                    />
                  ) : mapStyle === 'terrain' ? (
                    <TileLayer
                      attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                    />
                  ) : (
                    <TileLayer
                      attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}`}
                    />
                  )}
                  <Marker
                    position={mapCenter}
                    icon={createInitiativeMarker(categoryColors[initiative.category])}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{initiative.title}</p>
                        <p className="text-sm text-gray-600">{initiative.location.county} County</p>
                      </div>
                    </Popup>
                  </Marker>
                  <MapCenter center={mapCenter} />
                </MapContainer>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-3">
              <button
                onClick={() => setShowSatelliteMonitor(true)}
                className="w-full bg-mtaji-primary text-white font-heading font-semibold py-3 rounded-xl hover:bg-mtaji-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Satellite Data
              </button>
              <button
                onClick={() => navigate(`/initiatives/${initiative.id}/opportunities`)}
                className="w-full bg-indigo-600 text-white font-heading font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z" />
                </svg>
                Opportunities
              </button>
              <button className="w-full bg-mtaji-accent text-white font-heading font-semibold py-3 rounded-xl hover:bg-mtaji-primary-light transition-all duration-300 shadow-lg hover:shadow-xl">
                Share Initiative
              </button>
            </div>

            {/* Project Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-heading font-bold text-mtaji-primary mb-4">Project Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                    {initiative.project_duration || 'Not specified'}
                  </span>
                </div>
                {initiative.expected_completion && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Expected Completion:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(initiative.expected_completion).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(initiative.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(initiative.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Monitor Modal */}
      {showSatelliteMonitor && initiative.location?.coordinates && (
        <SatelliteMonitor
          initiativeId={initiative.id}
          location={initiative.location.coordinates}
          startDate={initiative.created_at}
          isOpen={showSatelliteMonitor}
          storedSnapshots={initiative.satellite_snapshots as any}
          onClose={() => setShowSatelliteMonitor(false)}
        />
      )}

      {/* Volunteer Form Modal */}
      {showVolunteerForm && (
        <VolunteerForm
          initiativeId={initiative.id}
          initiativeTitle={initiative.title}
          isOpen={showVolunteerForm}
          onClose={() => setShowVolunteerForm(false)}
          onSuccess={() => {
            // Optionally refresh initiative data or show success message
            console.log('Volunteer application submitted successfully');
          }}
        />
      )}
    </div>
  );
}
