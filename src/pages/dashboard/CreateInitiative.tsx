import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createInitiative } from '../../services/initiatives';
import { createJobsForInitiative, NewJobInput } from '../../services/opportunitiesService';
import { Initiative } from '../../types';
import { supabase } from '../../lib/supabase';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PURE_SATELLITE_TILE_URL, PURE_SATELLITE_ATTRIBUTION } from '../../utils/mapTiles';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type InputMethod = 'automated' | 'manual';

interface InitiativeFormData {
  title: string;
  category: string;
  description: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{ name: string; date: string }>;
  };
  budget: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
    fundingSources: string[];
  };
  beneficiaries: number;
  successMetrics: string[];
  documents: File[];
  images: File[];
  teamMembers: Array<{ name: string; role: string; email: string }>;
  opportunities?: {
    jobs: Array<{ title: string; jobType: string; description: string }>;
    acceptProposals?: boolean;
    acceptContentCreators?: boolean;
    acceptAmbassadors?: boolean;
  };
}

export default function CreateInitiative() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual');
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<InitiativeFormData> | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InitiativeFormData>({
    defaultValues: {
      category: '',
      timeline: {
        milestones: [{ name: '', date: '' }],
      },
      budget: {
        breakdown: [{ category: '', amount: 0 }],
        fundingSources: [],
      },
      successMetrics: [],
      teamMembers: [{ name: '', role: '', email: '' }],
      documents: [],
      images: [],
      opportunities: {
        jobs: [],
        acceptProposals: true,
        acceptContentCreators: true,
        acceptAmbassadors: true,
      },
    },
  });

  const TOTAL_STEPS = 6;

  // LocationMapPicker Component
  const LocationMapPicker = ({ 
    coordinates, 
    onCoordinatesChange, 
    mapRef,
    onAddressDetected 
  }: { 
    coordinates?: { lat: number; lng: number };
    onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
    mapRef: React.MutableRefObject<L.Map | null>;
    onAddressDetected?: (address: string) => void;
  }) => {
    const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Map click handler
    const MapClickHandler = () => {
      useMapEvents({
        click: (e) => {
          if (!isDragging) {
            const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
            onCoordinatesChange(coords);
            reverseGeocode(coords.lat, coords.lng);
          }
        },
      });
      return null;
    };

    // Map controller to store map reference
    const MapController = () => {
      const map = useMap();
      useEffect(() => {
        mapRef.current = map;
        return () => {
          mapRef.current = null;
        };
      }, [map]);
      return null;
    };

    // Reverse geocode to get address
    const reverseGeocode = async (lat: number, lng: number) => {
      const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken || mapboxToken === 'pk.your-token-here') return;

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=KE`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0 && onAddressDetected) {
          onAddressDetected(data.features[0].place_name);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    };

    // Search places
    const searchPlaces = async (query: string) => {
      if (!query || query.length < 3) {
        setSearchResults([]);
        return;
      }

      const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken || mapboxToken === 'pk.your-token-here') return;

      setIsSearching(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=KE&limit=5`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features) {
          setSearchResults(data.features);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Handle place selection
    const handlePlaceSelect = (feature: any) => {
      const [lng, lat] = feature.center;
      const coords = { lat, lng };
      onCoordinatesChange(coords);
      if (onAddressDetected) {
        onAddressDetected(feature.place_name || feature.text);
      }
      setSearchQuery(feature.place_name || feature.text);
      setSearchResults([]);
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 16, { animate: true, duration: 1.0 });
      }
    };

    // Get current location
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            onCoordinatesChange(coords);
            reverseGeocode(coords.lat, coords.lng);
            if (mapRef.current) {
              mapRef.current.setView([coords.lat, coords.lng], 16, {
                animate: true,
                duration: 1.0,
              });
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Could not get your current location. Please click on the map to set the location.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    };

    // Debounced search
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery) {
          searchPlaces(searchQuery);
        } else {
          setSearchResults([]);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Draggable marker component
    const DraggableMarker = ({ position }: { position: [number, number] }) => {
      const [markerPosition, setMarkerPosition] = useState(position);

      useEffect(() => {
        setMarkerPosition(position);
      }, [position]);

      const eventHandlers = {
        dragend: (e: any) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          setMarkerPosition([newPosition.lat, newPosition.lng]);
          onCoordinatesChange({ lat: newPosition.lat, lng: newPosition.lng });
          reverseGeocode(newPosition.lat, newPosition.lng);
          setIsDragging(false);
        },
        dragstart: () => {
          setIsDragging(true);
        },
      };

      return (
        <Marker
          position={markerPosition}
          draggable={true}
          eventHandlers={eventHandlers}
        />
      );
    };

    const mapCenter = coordinates 
      ? [coordinates.lat, coordinates.lng] as [number, number]
      : [-0.0236, 37.9062] as [number, number];

    return (
      <div className="space-y-3">
        {/* Search and Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary text-sm"
              placeholder="Search for a place..."
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mtaji-primary"></div>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((feature, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePlaceSelect(feature)}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors text-sm"
                  >
                    <div className="text-white">{feature.place_name || feature.text}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            📍 Use My Location
          </button>
          <button
            type="button"
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {mapType === 'street' ? '🛰️ Satellite' : '🗺️ Street'}
          </button>
        </div>

        {/* Map */}
        <div className="border-2 border-white/20 rounded-lg overflow-hidden" style={{ height: '400px' }}>
          <MapContainer
            center={mapCenter}
            zoom={coordinates ? 15 : 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapController />
            {mapType === 'satellite' ? (
              <TileLayer
                attribution={PURE_SATELLITE_ATTRIBUTION}
                url={PURE_SATELLITE_TILE_URL}
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            <MapClickHandler />
            {coordinates && (
              <DraggableMarker position={[coordinates.lat, coordinates.lng]} />
            )}
          </MapContainer>
        </div>

        {/* Coordinate Display */}
        {coordinates && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-mtaji-light-gray mb-1">Selected Coordinates:</p>
            <p className="text-sm text-white font-mono">
              {coordinates.lat.toFixed(8)}, {coordinates.lng.toFixed(8)}
            </p>
            <p className="text-xs text-mtaji-medium-gray mt-1">
              💡 Click on map to set location, or drag the marker for precise positioning
            </p>
          </div>
        )}
      </div>
    );
  };

  // Auto-save functionality
  const autoSave = () => {
    const formData = watch();
    localStorage.setItem('draft_initiative', JSON.stringify(formData));
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_initiative');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        Object.keys(parsed).forEach((key) => {
          // Don't restore File objects from localStorage (they can't be serialized)
          if (key !== 'images' && key !== 'documents') {
            setValue(key as any, parsed[key]);
          }
        });
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, [setValue]);

  // Component to handle image preview with cleanup
  const ImagePreview = ({ image, onRemove }: { image: File; onRemove: () => void }) => {
    const [url, setUrl] = useState<string>('');
    
    useEffect(() => {
      const objectUrl = URL.createObjectURL(image);
      setUrl(objectUrl);
      
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }, [image]);
    
    return (
      <div className="relative group bg-white/5 border border-white/20 rounded-lg overflow-hidden">
        {url && (
          <img
            src={url}
            alt={`Preview`}
            className="w-full h-32 object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold transition-colors"
          >
            Remove
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
          <p className="text-xs text-white truncate">{image.name}</p>
          <p className="text-xs text-mtaji-light-gray">
            {(image.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  };


  const handleDocumentUpload = async (file: File) => {
    setUploadedDocument(file);
    setIsExtracting(true);

    // TODO: Implement AI/NLP extraction
    // This would call an API endpoint that processes the document
    setTimeout(() => {
      // Mock extracted data
      const mockExtracted: Partial<InitiativeFormData> = {
        title: 'Sample Project Title',
        description: 'Extracted description from document...',
        category: 'infrastructure',
        timeline: {
          startDate: '2026-02-01',
          endDate: '2026-12-31',
          milestones: [
            { name: 'Phase 1 Completion', date: '2026-06-01' },
            { name: 'Phase 2 Completion', date: '2026-09-01' },
          ],
        },
        budget: {
          total: 500000,
          breakdown: [
            { category: 'Materials', amount: 200000 },
            { category: 'Labor', amount: 250000 },
            { category: 'Other', amount: 50000 },
          ],
          fundingSources: ['Government Grant', 'Private Donations'],
        },
        beneficiaries: 1000,
        successMetrics: ['Completion rate', 'Community engagement'],
      };

      setExtractedData(mockExtracted);
      setIsExtracting(false);

      // Auto-populate form with extracted data
      Object.keys(mockExtracted).forEach((key) => {
        if (mockExtracted[key as keyof typeof mockExtracted]) {
          setValue(key as any, mockExtracted[key as keyof typeof mockExtracted] as any);
        }
      });
    }, 3000);
  };

  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [coordinateInput, setCoordinateInput] = useState<string>('');
  const mapRef = useRef<L.Map | null>(null);

  // Watch coordinates from the form so we can keep the text field and map in sync
  const watchedCoordinates = watch('location.coordinates');

  // Keep the coordinate text field and map in sync when coordinates change
  useEffect(() => {
    if (
      watchedCoordinates &&
      typeof watchedCoordinates.lat === 'number' &&
      typeof watchedCoordinates.lng === 'number'
    ) {
      const next = `${watchedCoordinates.lat}, ${watchedCoordinates.lng}`;
      setCoordinateInput((prev) => (prev === next ? prev : next));

      // Also recenter the map to these coordinates so the user sees a live preview
      if (!isNaN(watchedCoordinates.lat) && !isNaN(watchedCoordinates.lng) && mapRef.current) {
        try {
          mapRef.current.setView(
            [watchedCoordinates.lat, watchedCoordinates.lng],
            mapRef.current.getZoom() || 15,
            { animate: true, duration: 1.0 }
          );
        } catch (err) {
          console.warn('Failed to recenter map for coordinates:', watchedCoordinates, err);
        }
      }
    }
  }, [watchedCoordinates?.lat, watchedCoordinates?.lng]);

  const onSubmit = async (data: InitiativeFormData) => {
    // Prevent double submission
    if (isSubmitting) {
      console.warn('⚠️ Submission already in progress, ignoring duplicate submit');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Timeout safeguard for the database publish step (set later, after uploads)
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      // Get or create changemaker for the user
      let changemakerId: string;

      if (userProfile) {
        // Check if changemaker exists for this user
        const { data: existingChangemaker } = await supabase
          .from('changemakers')
          .select('id')
          .eq('user_id', userProfile.user_id)
          .single();

        if (existingChangemaker) {
          changemakerId = existingChangemaker.id;
        } else {
          // Create changemaker based on user type
          let changemakerData: any = {
            user_id: userProfile.user_id,
            name: userProfile.email,
            email: userProfile.email,
          };

          if (userProfile.user_type === 'organization') {
            const { data: org } = await supabase
              .from('organizations')
              .select('organization_name')
              .eq('user_profile_id', userProfile.id)
              .single();
            changemakerData.name = org?.organization_name || userProfile.email;
            changemakerData.organization = org?.organization_name;
          } else if (userProfile.user_type === 'government') {
            const { data: gov, error: govError } = await supabase
              .from('government_entities')
              .select('entity_name')
              .eq('user_profile_id', userProfile.id)
              .maybeSingle();
            
            // If government entity doesn't exist or can't be accessed, use email as fallback
            if (govError) {
              console.warn('Could not fetch government entity:', govError);
            }
            
            changemakerData.name = gov?.entity_name || userProfile.email;
            changemakerData.organization = gov?.entity_name || 'Government Entity';
          }

          const { data: newChangemaker, error: changemakerError } = await supabase
            .from('changemakers')
            .insert(changemakerData)
            .select()
            .single();

          if (changemakerError) throw changemakerError;
          changemakerId = newChangemaker.id;
        }
      } else {
        throw new Error('User profile not found. Please log in again.');
      }

      // Convert form data to Initiative format
      const initiative: Partial<Initiative> = {
        changemaker_id: changemakerId,
        title: data.title,
        description: data.description,
        short_description: data.description.substring(0, 200),
        category: data.category as any,
        target_amount: data.budget.total,
        raised_amount: 0,
        location: {
          county: data.location.address.split(',')[0] || '',
          constituency: '',
          specific_area: data.location.address,
          coordinates: data.location.coordinates,
        },
        project_duration: `${Math.ceil((new Date(data.timeline.endDate).getTime() - new Date(data.timeline.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
        expected_completion: data.timeline.endDate,
        milestones: data.timeline.milestones.map((m, idx) => ({
          id: `temp-${idx}`,
          title: m.name,
          target_date: m.date,
          status: 'pending' as const,
        })),
        reference_images: [], // Will be uploaded separately
        status: 'published', // Set to published so it appears on public initiatives page
        payment_details: {
          method: 'mpesa',
        },
        opportunity_preferences: {
          acceptProposals: data.opportunities?.acceptProposals ?? true,
          acceptContentCreators: data.opportunities?.acceptContentCreators ?? true,
          acceptAmbassadors: data.opportunities?.acceptAmbassadors ?? true,
        },
      };

      // Upload images if any
      if (data.images && data.images.length > 0) {
        const imageUrls: string[] = [];
        for (const image of data.images) {
          try {
            // Sanitize filename - remove special characters
            const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${changemakerId}/${Date.now()}_${sanitizedName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('initiative-images')
              .upload(fileName, image, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              // Continue with other images even if one fails
              continue;
            }

            if (uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('initiative-images')
                .getPublicUrl(uploadData.path);
              imageUrls.push(publicUrl);
            }
          } catch (imgError) {
            console.error('Error processing image:', imgError);
            // Continue with other images
          }
        }
        initiative.reference_images = imageUrls;
      }

      // Validate coordinates before creating
      if (!data.location.coordinates || 
          !data.location.coordinates.lat || 
          !data.location.coordinates.lng ||
          isNaN(data.location.coordinates.lat) || 
          isNaN(data.location.coordinates.lng)) {
        throw new Error('Please set a valid location on the map. Click on the map or use "Use My Location" button.');
      }

      // Validate coordinates are not default
      if (data.location.coordinates.lat === -0.0236 && data.location.coordinates.lng === 37.9062) {
        throw new Error('Please set a specific location on the map. The default location cannot be used.');
      }

      console.log('🚀 Creating initiative with data:', {
        title: initiative.title,
        coordinates: initiative.location?.coordinates,
        changemakerId
      });

      // Create the initiative (with its own timeout, excluding file upload time)
      console.log('🚀 Calling createInitiative...');

      timeoutId = setTimeout(() => {
        console.error('⏱️ Submission timeout after 30 seconds (database publish)');
        setIsSubmitting(false);
        setSubmitError('Submission timed out while publishing to the server. Please try again or check your internet connection.');
      }, 30000);

      let created: Initiative | null = null;
      try {
        created = await createInitiative(initiative as Initiative);
        console.log('📦 createInitiative returned:', created);
      } catch (createError: any) {
        console.error('❌ createInitiative threw an error:', createError);
        console.error('Error stack:', createError?.stack);
        throw createError; // Re-throw to be caught by outer catch
      }

      if (!created) {
        console.error('❌ createInitiative returned null/undefined');
        throw new Error('Failed to create initiative. Please check the console for details.');
      }

      console.log('✅ Initiative created successfully:', created);

      // Save any job opportunities defined in the form
      try {
        const jobs = data.opportunities?.jobs || [];
        console.log('📋 Jobs from form:', jobs);
        if (jobs.length > 0) {
          const jobInputs: NewJobInput[] = jobs
            .map(job => ({
              title: job.title?.trim() || '',
              job_type: job.jobType?.trim() || '',
              description: job.description?.trim() || '',
            }))
            .filter(job => job.title.length > 0); // Only keep jobs with a title
          
          console.log('💼 Filtered job inputs:', jobInputs);
          
          if (jobInputs.length > 0) {
            await createJobsForInitiative(created.id, jobInputs);
            console.log('✅ Saved', jobInputs.length, 'job opportunities for initiative:', created.id);
          } else {
            console.log('⚠️ No valid jobs to save (all had empty titles)');
          }
        } else {
          console.log('ℹ️ No jobs provided in form data');
        }
      } catch (jobError: any) {
        console.error('⚠️ Failed to save job opportunities (initiative was still created):', jobError);
        console.error('Job error details:', jobError?.message, jobError?.stack);
      }

      localStorage.removeItem('draft_initiative');
      
      // Trigger refresh event for ProjectOverview
      window.dispatchEvent(new Event('initiatives-refresh'));
      
      // Clear timeout since we succeeded
      if (timeoutId) clearTimeout(timeoutId);

      // Show a clear on-screen success message before navigation
      setSubmitSuccess('Initiative published successfully!');

      // Give the user a brief moment to see the message, then navigate
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard overview...');
        navigate('/dashboard?section=overview');
      }, 1200);
      
    } catch (error: any) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('❌ Error creating initiative:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      const errorMessage = error?.message || 'Failed to create initiative. Please try again.';
      setSubmitError(errorMessage);
      setIsSubmitting(false); // Reset immediately on error
    }
  };

  const nextStep = () => {
    // Validate location coordinates on step 2
    if (currentStep === 2) {
      const coords = watch('location.coordinates');
      if (!coords || !coords.lat || !coords.lng || 
          isNaN(coords.lat) || isNaN(coords.lng) ||
          coords.lat === -0.0236 && coords.lng === 37.9062) {
        alert('Please set a location on the map by clicking on it or using "Use My Location". The default location cannot be used.');
        return;
      }
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      autoSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-black mb-2">Create Initiative</h2>
          <p className="text-mtaji-light-gray">Publish a new community development project</p>
        </div>
      </div>

      {/* Input Method Selection */}
      {!uploadedDocument && !extractedData && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Choose Input Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setInputMethod('automated')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                inputMethod === 'automated'
                  ? 'border-mtaji-primary bg-mtaji-primary/10'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-4xl mb-3">🤖</div>
              <h4 className="text-lg font-semibold mb-2">Automated Document Upload</h4>
              <p className="text-sm text-mtaji-light-gray">
                Upload PDF, DOCX, or images. AI will extract project details automatically.
              </p>
            </button>

            <button
              onClick={() => setInputMethod('manual')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                inputMethod === 'manual'
                  ? 'border-mtaji-primary bg-mtaji-primary/10'
                  : 'border-white/20 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="text-4xl mb-3">✍️</div>
              <h4 className="text-lg font-semibold mb-2">Manual Form Entry</h4>
              <p className="text-sm text-mtaji-light-gray">
                Fill out a structured multi-step form with validation.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Automated Document Upload */}
      {inputMethod === 'automated' && !extractedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Upload Project Document</h3>
          
          {!uploadedDocument ? (
            <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-mtaji-light-gray mb-4">
                Upload PDF, DOCX, or image files containing project information
              </p>
              <label className="cursor-pointer inline-block">
                <span className="px-6 py-3 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors">
                  Choose File
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDocumentUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-mtaji-medium-gray mt-4">
                Supported formats: PDF, DOCX, DOC, PNG, JPG (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">📄</div>
                  <div>
                    <div className="font-semibold">{uploadedDocument.name}</div>
                    <div className="text-sm text-mtaji-light-gray">
                      {(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedDocument(null);
                    setExtractedData(null);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>

              {isExtracting && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
                  <p className="text-mtaji-light-gray">AI is extracting project information...</p>
                  <p className="text-sm text-mtaji-medium-gray mt-2">
                    This may take a few moments
                  </p>
                </div>
              )}

              {extractedData && !isExtracting && (
                <div className="bg-mtaji-primary/10 border border-mtaji-primary/20 rounded-lg p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    ✅ Data Extracted Successfully
                  </h4>
                  <p className="text-sm text-mtaji-light-gray mb-4">
                    Review and edit the extracted information below, then proceed to publish.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Switch to manual form with extracted data pre-filled
                      setInputMethod('manual');
                      setCurrentStep(1);
                    }}
                    className="px-4 py-2 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors"
                  >
                    Review & Edit Extracted Data
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Manual Form Entry */}
      {(inputMethod === 'manual' || extractedData) && (
        <form onSubmit={handleSubmit(async (data) => {
          // handleSubmit from react-hook-form handles validation
          // If validation passes, it calls our onSubmit
          await onSubmit(data);
        })} className="space-y-6">
          {/* Error / Success Display */}
          {submitError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-400 font-semibold mb-1">Error Publishing Initiative</p>
                  <p className="text-red-300 text-sm">{submitError}</p>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          {submitSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">✅</span>
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold mb-1">Initiative Published</p>
                  <p className="text-emerald-300 text-sm">{submitSuccess}</p>
                </div>
              </div>
            </div>
          )}
          {/* Progress Steps */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-mtaji-light-gray">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <div className="flex gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i + 1 <= currentStep
                        ? 'bg-mtaji-primary w-8'
                        : 'bg-white/10 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Initiative Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('title', { required: 'Title is required' })}
                      type="text"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Enter project title"
                      onChange={autoSave}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Category/Sector <span className="text-red-400">*</span>
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
                      onChange={autoSave}
                    >
                      <option value="">Select category</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="health">Health</option>
                      <option value="education">Education</option>
                      <option value="environment">Environment</option>
                      <option value="water">Water & Sanitation</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="economic">Economic Development</option>
                      <option value="social_welfare">Social Welfare</option>
                      <option value="governance">Governance</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={6}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary resize-none"
                      placeholder="Provide a detailed description of your initiative..."
                      onChange={autoSave}
                    />
                    {errors.description && (
                      <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Geographic Location</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('location.address', { required: 'Address is required' })}
                      type="text"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Enter address or location"
                      onChange={autoSave}
                    />
                    {errors.location?.address && (
                      <p className="text-red-400 text-xs mt-1">{errors.location.address.message}</p>
                    )}
                  </div>

                  {/* Coordinate Input - Single Field */}
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Coordinates (Latitude, Longitude)
                      <span className="text-xs text-mtaji-medium-gray ml-2">
                        (Paste coordinates like: -1.2921, 36.8219 or click on map)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={coordinateInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCoordinateInput(value);

                        const trimmed = value.trim();
                        // Support formats like:
                        // "1.24960, 36.65751"
                        // "1.24960° S, 36.65751° E"
                        // "-1.24960 S 36.65751 E"
                        const match = trimmed.match(
                          /^(-?\d+\.?\d*)[^0-9NnSsEeWw]*([NnSs])?[,\s]+(-?\d+\.?\d*)[^0-9NnSsEeWw]*([EeWw])?$/
                        );

                        if (match) {
                          let lat = parseFloat(match[1]);
                          let lng = parseFloat(match[3]);
                          const latHem = match[2]?.toUpperCase();
                          const lngHem = match[4]?.toUpperCase();

                          // Apply hemisphere: S/W = negative, N/E = positive
                          if (latHem === 'S' && lat > 0) lat = -lat;
                          if (latHem === 'N' && lat < 0) lat = -lat;
                          if (lngHem === 'W' && lng > 0) lng = -lng;
                          if (lngHem === 'E' && lng < 0) lng = -lng;

                          if (
                            !isNaN(lat) &&
                            !isNaN(lng) &&
                            lat >= -90 &&
                            lat <= 90 &&
                            lng >= -180 &&
                            lng <= 180
                          ) {
                            setValue('location.coordinates', { lat, lng }, { shouldValidate: true });
                            autoSave();
                            if (mapRef.current) {
                              mapRef.current.setView([lat, lng], 15, { animate: true, duration: 1.0 });
                            }
                          }
                        }
                      }}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder='e.g., -1.2921, 36.8219 or "1.24960° S, 36.65751° E"'
                    />
                    <p className="text-xs text-mtaji-medium-gray mt-1">
                      💡 Tip: Copy coordinates from Google Maps (right-click → coordinates) or use the map below
                    </p>
                  </div>

                  {/* Map Picker */}
                  <LocationMapPicker
                    coordinates={watch('location.coordinates')}
                    onCoordinatesChange={(coords) => {
                      setValue('location.coordinates', coords, { shouldValidate: true });
                      autoSave();
                    }}
                    mapRef={mapRef}
                    onAddressDetected={(address) => {
                      if (!watch('location.address')) {
                        setValue('location.address', address);
                        autoSave();
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Timeline */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Project Timeline</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-mtaji-light-gray mb-2">
                        Start Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('timeline.startDate', { required: 'Start date is required' })}
                        type="date"
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
                        onChange={autoSave}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-mtaji-light-gray mb-2">
                        End Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('timeline.endDate', { required: 'End date is required' })}
                        type="date"
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
                        onChange={autoSave}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">Milestones</label>
                    {watch('timeline.milestones')?.map((_milestone, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          {...register(`timeline.milestones.${index}.name`)}
                          type="text"
                          placeholder="Milestone name"
                          className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          onChange={autoSave}
                        />
                        <input
                          {...register(`timeline.milestones.${index}.date`)}
                          type="date"
                          className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-mtaji-primary bg-gray-800"
                          onChange={autoSave}
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const milestones = watch('timeline.milestones') || [];
                              setValue('timeline.milestones', milestones.filter((_, i) => i !== index));
                              autoSave();
                            }}
                            className="px-3 text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const milestones = watch('timeline.milestones') || [];
                        setValue('timeline.milestones', [...milestones, { name: '', date: '' }]);
                        autoSave();
                      }}
                      className="text-sm text-mtaji-primary hover:underline"
                    >
                      + Add Milestone
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Budget */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Budget & Funding</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Total Budget <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('budget.total', { required: 'Total budget is required', valueAsNumber: true })}
                      type="number"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Enter total budget amount"
                      onChange={autoSave}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">Budget Breakdown</label>
                    {watch('budget.breakdown')?.map((_item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          {...register(`budget.breakdown.${index}.category`)}
                          type="text"
                          placeholder="Category"
                          className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          onChange={autoSave}
                        />
                        <input
                          {...register(`budget.breakdown.${index}.amount`, { valueAsNumber: true })}
                          type="number"
                          placeholder="Amount"
                          className="w-32 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          onChange={autoSave}
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const breakdown = watch('budget.breakdown') || [];
                              setValue('budget.breakdown', breakdown.filter((_, i) => i !== index));
                              autoSave();
                            }}
                            className="px-3 text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const breakdown = watch('budget.breakdown') || [];
                        setValue('budget.breakdown', [...breakdown, { category: '', amount: 0 }]);
                        autoSave();
                      }}
                      className="text-sm text-mtaji-primary hover:underline"
                    >
                      + Add Category
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">Funding Sources</label>
                    <input
                      type="text"
                      placeholder="Enter funding sources (comma-separated)"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      onChange={(e) => {
                        const sources = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setValue('budget.fundingSources', sources);
                        autoSave();
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Metrics & Team */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Success Metrics, Team & Opportunities</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Expected Beneficiaries
                    </label>
                    <input
                      {...register('beneficiaries', { valueAsNumber: true })}
                      type="number"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      placeholder="Number of people who will benefit"
                      onChange={autoSave}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">Success Metrics/KPIs</label>
                    <input
                      type="text"
                      placeholder="Enter metrics (comma-separated)"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                      onChange={(e) => {
                        const metrics = e.target.value.split(',').map(m => m.trim()).filter(m => m);
                        setValue('successMetrics', metrics);
                        autoSave();
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">Team Members</label>
                    {watch('teamMembers')?.map((_member, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          {...register(`teamMembers.${index}.name`)}
                          type="text"
                          placeholder="Name"
                          className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          onChange={autoSave}
                        />
                        <input
                          {...register(`teamMembers.${index}.role`)}
                          type="text"
                          placeholder="Role"
                          className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                          onChange={autoSave}
                        />
                        <div className="flex gap-2">
                          <input
                            {...register(`teamMembers.${index}.email`)}
                            type="email"
                            placeholder="Email"
                            className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                            onChange={autoSave}
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const members = watch('teamMembers') || [];
                                setValue('teamMembers', members.filter((_, i) => i !== index));
                                autoSave();
                              }}
                              className="px-3 text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const members = watch('teamMembers') || [];
                        setValue('teamMembers', [...members, { name: '', role: '', email: '' }]);
                        autoSave();
                      }}
                      className="text-sm text-mtaji-primary hover:underline"
                    >
                      + Add Team Member
                    </button>
                  </div>

                  {/* Opportunities: Preferences */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h4 className="text-lg font-semibold mb-2">Opportunities Preferences</h4>
                    <p className="text-xs text-mtaji-medium-gray mb-3">
                      Select which types of opportunities you want to receive for this initiative.
                    </p>
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watch('opportunities.acceptProposals') ?? true}
                          onChange={(e) => {
                            setValue('opportunities.acceptProposals', e.target.checked);
                            autoSave();
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-mtaji-primary focus:ring-mtaji-primary"
                        />
                        <span className="text-sm text-white">Accept Proposals</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watch('opportunities.acceptContentCreators') ?? true}
                          onChange={(e) => {
                            setValue('opportunities.acceptContentCreators', e.target.checked);
                            autoSave();
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-mtaji-primary focus:ring-mtaji-primary"
                        />
                        <span className="text-sm text-white">Accept Content Creator Applications</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={watch('opportunities.acceptAmbassadors') ?? true}
                          onChange={(e) => {
                            setValue('opportunities.acceptAmbassadors', e.target.checked);
                            autoSave();
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-mtaji-primary focus:ring-mtaji-primary"
                        />
                        <span className="text-sm text-white">Accept Project Ambassador Applications</span>
                      </label>
                    </div>
                  </div>

                  {/* Opportunities: Jobs */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h4 className="text-lg font-semibold mb-2">Opportunities – Jobs</h4>
                    <p className="text-xs text-mtaji-medium-gray mb-3">
                      Add any roles or jobs you want to advertise for this initiative. These will appear on the Opportunities tab for guests.
                    </p>
                    {(watch('opportunities.jobs') || []).map((job: any, index: number) => (
                      <div key={index} className="mb-3 border border-white/15 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-mtaji-medium-gray">Job #{index + 1}</span>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const jobs = (watch('opportunities.jobs') || []) as any[];
                                setValue('opportunities.jobs', jobs.filter((_, i) => i !== index));
                                autoSave();
                              }}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-mtaji-light-gray mb-1">Job Title</label>
                            <input
                              type="text"
                              value={job?.title || ''}
                              onChange={(e) => {
                                const jobs = (watch('opportunities.jobs') || []) as any[];
                                jobs[index] = { ...jobs[index], title: e.target.value };
                                setValue('opportunities.jobs', jobs);
                                autoSave();
                              }}
                              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                              placeholder="e.g., Site Supervisor"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-mtaji-light-gray mb-1">Type</label>
                            <input
                              type="text"
                              value={job?.jobType || ''}
                              onChange={(e) => {
                                const jobs = (watch('opportunities.jobs') || []) as any[];
                                jobs[index] = { ...jobs[index], jobType: e.target.value };
                                setValue('opportunities.jobs', jobs);
                                autoSave();
                              }}
                              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary"
                              placeholder="e.g., Full-time, Part-time, Contract"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-mtaji-light-gray mb-1">Short Description</label>
                          <textarea
                            value={job?.description || ''}
                            onChange={(e) => {
                              const jobs = (watch('opportunities.jobs') || []) as any[];
                              jobs[index] = { ...jobs[index], description: e.target.value };
                              setValue('opportunities.jobs', jobs);
                              autoSave();
                            }}
                            rows={2}
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-mtaji-light-gray focus:outline-none focus:border-mtaji-primary resize-none"
                            placeholder="Briefly describe what this role involves..."
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const currentJobs = watch('opportunities.jobs') || [];
                        setValue('opportunities.jobs', [...currentJobs, { title: '', jobType: '', description: '' }], { shouldValidate: false });
                        autoSave();
                      }}
                      className="mt-1 text-sm text-mtaji-primary hover:underline"
                    >
                      + Add Job Opportunity
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Documents & Media */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-2xl font-semibold mb-6">Documents & Media</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Supporting Documents
                    </label>
                    {watch('documents') && watch('documents').length > 0 ? (
                      <div className="space-y-4">
                        {/* Documents List */}
                        <div className="space-y-2">
                          {watch('documents').map((doc: File, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg p-4 group hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="text-2xl">
                                  {doc.type.includes('pdf') ? '📄' : 
                                   doc.type.includes('word') || doc.name.endsWith('.docx') || doc.name.endsWith('.doc') ? '📝' : 
                                   doc.type.includes('image') ? '🖼️' : '📎'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                                  <p className="text-xs text-mtaji-light-gray">
                                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type || 'Unknown type'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentDocs = (watch('documents') as File[]) || [];
                                  const newDocs = currentDocs.filter((_: File, i: number) => i !== index);
                                  setValue('documents', newDocs);
                                  autoSave();
                                }}
                                className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Add More Documents Button */}
                        <label className="block border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-mtaji-primary transition-colors">
                          <span className="text-mtaji-primary hover:underline">Add More Documents</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.doc,image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const newFiles = Array.from(e.target.files);
                                const currentDocs = (watch('documents') as File[]) || [];
                                const allDocs = [...currentDocs, ...newFiles];
                                setValue('documents', allDocs);
                                autoSave();
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">📎</div>
                        <label className="cursor-pointer">
                          <span className="text-mtaji-primary hover:underline">Click to upload documents</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.doc,image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const files = Array.from(e.target.files);
                                setValue('documents', files);
                                autoSave();
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-mtaji-medium-gray mt-2">
                          PDF, DOCX, DOC, or images (Max 10MB each)
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-mtaji-light-gray mb-2">
                      Project Images
                    </label>
                    {watch('images') && Array.isArray(watch('images')) && watch('images').length > 0 ? (
                      <div className="space-y-4">
                        {/* Image Preview Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {(watch('images') as File[]).map((image: File, index: number) => (
                            <ImagePreview
                              key={`${image.name}-${image.size}-${index}`}
                              image={image}
                              onRemove={() => {
                                const currentImages = (watch('images') as File[]) || [];
                                const newImages = currentImages.filter((_: File, i: number) => i !== index);
                                setValue('images', newImages);
                                autoSave();
                              }}
                            />
                          ))}
                        </div>
                        {/* Add More Images Button */}
                        <label className="block border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-mtaji-primary transition-colors">
                          <span className="text-mtaji-primary hover:underline">Add More Images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const newFiles = Array.from(e.target.files);
                                const currentImages = (watch('images') as File[]) || [];
                                const allImages = [...currentImages, ...newFiles];
                                setValue('images', allImages);
                                autoSave();
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <label className="cursor-pointer">
                          <span className="text-mtaji-primary hover:underline">Click to upload images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const files = Array.from(e.target.files);
                                setValue('images', files);
                                autoSave();
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-mtaji-medium-gray mt-2">
                          PNG, JPG, JPEG (Max 5MB each)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors"
              >
                Next
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-semibold transition-colors"
                >
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Initiative'}
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{submitError}</p>
            </div>
          )}
        </form>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">Preview Initiative</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-mtaji-light-gray hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-mtaji-light-gray">Title:</span>
                <span className="ml-2 font-semibold">{watch('title') || 'Not set'}</span>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Category:</span>
                <span className="ml-2 capitalize">{watch('category') || 'Not set'}</span>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Description:</span>
                <p className="mt-1 text-mtaji-light-gray">{watch('description') || 'Not set'}</p>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Location:</span>
                <span className="ml-2">{watch('location.address') || 'Not set'}</span>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Timeline:</span>
                <span className="ml-2">
                  {watch('timeline.startDate') && watch('timeline.endDate')
                    ? `${new Date(watch('timeline.startDate')!).toLocaleDateString()} - ${new Date(watch('timeline.endDate')!).toLocaleDateString()}`
                    : 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Total Budget:</span>
                <span className="ml-2">
                  {watch('budget.total') ? `KES ${watch('budget.total')!.toLocaleString()}` : 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-mtaji-light-gray">Expected Beneficiaries:</span>
                <span className="ml-2">{watch('beneficiaries') || 'Not set'}</span>
              </div>
              {watch('timeline.milestones') && watch('timeline.milestones')!.length > 0 && (
                <div>
                  <span className="text-mtaji-light-gray">Milestones:</span>
                  <ul className="mt-2 space-y-1">
                    {watch('timeline.milestones')!.map((m, idx) => (
                      <li key={idx} className="text-mtaji-light-gray">
                        • {m.name} - {m.date ? new Date(m.date).toLocaleDateString() : 'No date'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  const formData = watch();
                  try {
                    await onSubmit(formData);
                  } catch (error) {
                    console.error('Preview submit error:', error);
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-mtaji-primary hover:bg-mtaji-primary-dark rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
