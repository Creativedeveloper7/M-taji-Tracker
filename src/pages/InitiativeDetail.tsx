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

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      const title = initiative.title;
      const text = `${initiative.title} in ${initiative.location.county} County`;

      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard. You can now share it anywhere.');
      } else {
        // Fallback: show prompt with URL
        window.prompt('Share this initiative link:', shareUrl);
      }
    } catch (err) {
      console.error('Error sharing initiative:', err);
    }
  };

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
              <button
                onClick={handleShare}
                className="w-full bg-mtaji-accent text-white font-heading font-semibold py-3 rounded-xl hover:bg-mtaji-primary-light transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4m0 0L8 6m4-4v16"
                  />
                </svg>
                Share Initiative
              </button>

              {/* Social media links */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4">
                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(initiative.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-black transition-colors"
                  aria-label="Share on X (Twitter)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 3H21L14.326 10.6 22 21h-5.5l-4.3-5.9L7.1 21H4L11.066 12.9 4 3h5.5l3.9 5.3L18.244 3z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#1877F2] transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07C2 17.1 5.66 21.2 10.44 22v-7.03H7.9v-2.9h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22C18.34 21.2 22 17.1 22 12.07z" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(initiative.title + ' - ' + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#25D366] transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.52 3.48A11.78 11.78 0 0 0 12.01 0C5.73 0 .74 4.99.74 11.25c0 1.98.52 3.9 1.51 5.6L0 24l7.33-2.2a11.9 11.9 0 0 0 4.68.95h.01c6.27 0 11.26-4.99 11.26-11.25 0-2.99-1.17-5.8-3.26-7.97zM12.02 21.2h-.01a9.8 9.8 0 0 1-4.47-1.09l-.32-.17-4.35 1.31 1.41-4.22-.21-.34A9.33 9.33 0 0 1 2.2 11.25C2.2 6.6 6.37 2.8 12 2.8c2.6 0 5.04 1.01 6.88 2.85a9.4 9.4 0 0 1 2.84 6.6c0 5.65-4.17 9.95-9.7 9.95zm5.34-7.27c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.2-.33.22-.62.07-.29-.15-1.22-.48-2.33-1.54-.86-.8-1.44-1.79-1.61-2.09-.17-.29-.02-.45.13-.6.14-.14.29-.34.44-.51.15-.17.2-.29.3-.48.1-.2.05-.36-.02-.51-.07-.15-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43 0 1.43 1.03 2.8 1.17 2.99.14.19 2.03 3.23 4.93 4.53.69.3 1.23.48 1.65.62.69.22 1.32.19 1.82.12.55-.08 1.7-.69 1.94-1.35.24-.66.24-1.22.17-1.35-.07-.12-.26-.2-.55-.35z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href={`https://www.instagram.com/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#E1306C] transition-colors"
                  aria-label="Share on Instagram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm11 1a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
                  </svg>
                </a>
                {/* Web link (copy URL) */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const url = window.location.href;
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard.');
                      } else {
                        window.prompt('Copy this link:', url);
                      }
                    } catch (e) {
                      console.error('Failed to copy link:', e);
                    }
                  }}
                  className="text-gray-500 hover:text-mtaji-primary transition-colors"
                  aria-label="Copy initiative link"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.59 13.41a1.5 1.5 0 010-2.12l3-3a1.5 1.5 0 112.12 2.12l-3 3a1.5 1.5 0 01-2.12 0z" />
                    <path d="M9 16a4 4 0 010-8h1a1 1 0 110 2H9a2 2 0 100 4h1a1 1 0 110 2H9zM15 18h-1a1 1 0 110-2h1a2 2 0 000-4h-1a1 1 0 110-2h1a4 4 0 010 8z" />
                  </svg>
                </button>
              </div>
            </div>

        {/* Project Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-heading font-bold text-mtaji-primary mb-4">Project Information</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Ministry / Department:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                Ministry of Community Development &amp; Social Services
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Account Holder Location:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                Nairobi, Kenya
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">People Benefiting:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                Approx. 5,000 community members
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">People Employed on Initiative:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                24 full-time &amp; part-time staff
              </span>
            </div>
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
