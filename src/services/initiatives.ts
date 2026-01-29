import { supabase } from '../lib/supabase'
import { Initiative } from '../types'

// Base URL for our Node/Express backend (used to trigger satellite backfill)
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

async function triggerSatelliteBackfill(initiativeId: string) {
  try {
    console.log('🛰️ Triggering satellite backfill for initiative:', initiativeId)
    const response = await fetch(`${BACKEND_BASE_URL}/api/satellite/backfill-initiative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initiativeId,
        intervalDays: 15, // one snapshot roughly every 2 weeks
        // Go back 6 months by default to get good historical coverage
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Backend responded with ${response.status}: ${errorData.error || response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ Satellite backfill completed:', result)
  } catch (error: any) {
    console.error('❌ Failed to trigger satellite backfill:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      backendUrl: BACKEND_BASE_URL,
    })
    // Don't throw - this is non-blocking
  }
}

// Database types matching Supabase schema
interface SupabaseInitiative {
  id: string
  changemaker_id: string
  title: string
  short_description?: string
  description: string
  category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic'
  organization_type?: 'NGO' | 'CBO' | 'Govt'
  target_amount: number
  raised_amount: number
  location: {
    county: string
    constituency: string
    specific_area: string
    coordinates: { lat: number; lng: number }
    geofence?: Array<{ lat: number; lng: number }>
  }
  project_duration?: string
  expected_completion?: string
  reference_images: string[]
  payment_details: {
    method: 'mpesa' | 'bank'
    mpesa_number?: string
    bank_account?: string
    bank_name?: string
    bank_branch?: string
  }
  status: 'draft' | 'published' | 'active' | 'completed' | 'stalled'
  created_at: string
  updated_at: string
  satellite_snapshots?: Array<{
    date: string
    imageUrl: string
    cloudCoverage: number
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
    captured_at: string
    ai_analysis?: {
      status: 'baseline' | 'progress' | 'stalled' | 'completed'
      changePercentage?: number
      notes: string
    }
  }>
  opportunity_preferences?: {
    acceptProposals?: boolean
    acceptContentCreators?: boolean
    acceptAmbassadors?: boolean
  }
}

interface SupabaseMilestone {
  id: string
  initiative_id: string
  title: string
  target_date: string
  status: 'pending' | 'in_progress' | 'completed'
  description?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// Convert Supabase initiative to app Initiative type
const convertToInitiative = (supabaseInitiative: SupabaseInitiative, milestones: SupabaseMilestone[]): Initiative => {
  // Ensure location structure is correct
  let location = supabaseInitiative.location
  
  // Handle string JSONB from Supabase
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location)
    } catch (e) {
      console.error('Failed to parse location JSON:', e, 'Raw location:', location)
      location = {
        county: '',
        constituency: '',
        specific_area: '',
        coordinates: { lat: -0.0236, lng: 37.9062 }
      }
    }
  }
  
  // Ensure location is an object
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    console.warn(`Initiative ${supabaseInitiative.id} has invalid location structure:`, location)
    location = {
      county: '',
      constituency: '',
      specific_area: '',
      coordinates: { lat: -0.0236, lng: 37.9062 }
    }
  } else {
    // Ensure all required fields exist
    location = {
      county: (location as any).county || '',
      constituency: (location as any).constituency || '',
      specific_area: (location as any).specific_area || '',
      coordinates: (location as any).coordinates || { lat: -0.0236, lng: 37.9062 },
      ...((location as any).geofence && { geofence: (location as any).geofence })
    }
  }
  
  // Ensure coordinates exist and are valid
  if (!location.coordinates || typeof location.coordinates !== 'object') {
    console.error(`❌ Initiative ${supabaseInitiative.id} (${supabaseInitiative.title}) has invalid coordinates object:`, location.coordinates)
    console.error('Full location object:', location)
    location.coordinates = { lat: -0.0236, lng: 37.9062 }
  }
  
  // Convert coordinates to numbers (JSONB might store them as strings)
  let lat = location.coordinates.lat
  let lng = location.coordinates.lng
  
  console.log(`Processing coordinates for ${supabaseInitiative.title}:`, {
    originalLat: lat,
    originalLng: lng,
    latType: typeof lat,
    lngType: typeof lng
  })
  
  // Convert to numbers if they're strings
  if (typeof lat === 'string') {
    lat = parseFloat(lat)
    console.log(`Converted lat from string to number: ${lat}`)
  }
  if (typeof lng === 'string') {
    lng = parseFloat(lng)
    console.log(`Converted lng from string to number: ${lng}`)
  }
  
  // Validate coordinate values - ONLY default if truly invalid
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    console.error(`❌ Initiative ${supabaseInitiative.id} (${supabaseInitiative.title}) has invalid coordinate values:`, { 
      lat, 
      lng, 
      latType: typeof lat, 
      lngType: typeof lng,
      originalCoords: location.coordinates
    })
    // DON'T default - this means coordinates weren't saved properly
    // Keep the invalid values so we can see the problem
    lat = lat || -0.0236
    lng = lng || 37.9062
  }
  
  // Ensure coordinates are within valid ranges - ONLY default if out of bounds
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error(`❌ Initiative ${supabaseInitiative.id} (${supabaseInitiative.title}) has coordinates out of bounds:`, { lat, lng })
    // Only default if truly out of bounds
    if (lat < -90 || lat > 90) lat = -0.0236
    if (lng < -180 || lng > 180) lng = 37.9062
  }
  
  // Final check - if we still have default coordinates, warn
  if (lat === -0.0236 && lng === 37.9062) {
    console.warn(`⚠️ Initiative ${supabaseInitiative.id} (${supabaseInitiative.title}) is using default Kenya center coordinates. Original coords were:`, location.coordinates)
  }
  
  // Update location with validated coordinates
  const finalLocation = {
    county: location.county || '',
    constituency: location.constituency || '',
    specific_area: location.specific_area || '',
    coordinates: { lat, lng },
    ...(location.geofence && { geofence: location.geofence })
  }
  
  console.log(`Converted initiative ${supabaseInitiative.id} (${supabaseInitiative.title}):`, {
    originalLocation: supabaseInitiative.location,
    finalLocation: finalLocation,
    coordinates: finalLocation.coordinates
  })
  
  return {
    id: supabaseInitiative.id,
    changemaker_id: supabaseInitiative.changemaker_id,
    title: supabaseInitiative.title,
    short_description: supabaseInitiative.short_description,
    description: supabaseInitiative.description,
    category: supabaseInitiative.category,
    organization_type: supabaseInitiative.organization_type,
    target_amount: Number(supabaseInitiative.target_amount),
    raised_amount: Number(supabaseInitiative.raised_amount),
    location: finalLocation,
    project_duration: supabaseInitiative.project_duration || '',
    expected_completion: supabaseInitiative.expected_completion || '',
    milestones: milestones.map(m => ({
      id: m.id,
      title: m.title,
      target_date: m.target_date,
      status: m.status,
    })),
    satellite_snapshots: supabaseInitiative.satellite_snapshots || [],
    reference_images: supabaseInitiative.reference_images || [],
    status: supabaseInitiative.status,
    created_at: supabaseInitiative.created_at,
    updated_at: supabaseInitiative.updated_at,
    payment_details: supabaseInitiative.payment_details,
    opportunity_preferences: supabaseInitiative.opportunity_preferences || {
      acceptProposals: true,
      acceptContentCreators: true,
      acceptAmbassadors: true,
    },
  }
}

// Fetch all published/active initiatives
export const fetchInitiatives = async (): Promise<Initiative[]> => {
  try {
    console.log('🔍 Fetching initiatives from Supabase...')
    
    // Start with a simpler query - only fetch published initiatives first
    // This reduces complexity and improves performance
    let { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')
      .in('status', ['published', 'active', 'completed']) // Fetch all public statuses at once
      .order('created_at', { ascending: false })
      .limit(100) // Increased limit to get more initiatives

    // Log what we found
    if (!initiativesError && initiatives) {
      console.log(`📊 Found ${initiatives.length} initiatives with status: published/active/completed`)
      const statusCounts = initiatives.reduce((acc: Record<string, number>, init: any) => {
        acc[init.status] = (acc[init.status] || 0) + 1
        return acc
      }, {})
      console.log('📈 Status breakdown:', statusCounts)
    }

    if (initiativesError) {
      console.error('Error fetching initiatives:', initiativesError)
      
      // Check for common error types and provide helpful messages
      if (initiativesError.message?.includes('Failed to fetch') || initiativesError.message?.includes('522')) {
        console.error('❌ Connection failed. Possible causes:')
        console.error('   1. Supabase project might be paused (free tier projects pause after inactivity)')
        console.error('   2. Check your Supabase dashboard: https://app.supabase.com')
        console.error('   3. Verify your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY')
        console.error('   4. Check your internet connection')
      }
      
      // Try an even simpler query - just get basic fields
      console.warn('⚠️ Query failed. Trying simplified query with basic fields...')
      const { data: simpleData, error: simpleError } = await supabase
        .from('initiatives')
        .select('id, title, status, location, created_at, description, category, target_amount, raised_amount, changemaker_id')
        .in('status', ['published', 'active', 'completed'])
        .limit(100)
        .order('created_at', { ascending: false })
      
      if (simpleError) {
        console.error('Simplified query also failed:', simpleError)
        console.error('⚠️ If you have published initiatives, check:')
        console.error('   - Supabase project is active (not paused)')
        console.error('   - RLS policies allow public read access')
        console.error('   - Your .env variables are correct')
        return []
      }
      
      // Use simplified data
      initiatives = simpleData
    }

    if (!initiatives || initiatives.length === 0) {
      console.log('⚠️ No published/active/completed initiatives found in Supabase')
      console.log('💡 Checking if there are any draft initiatives...')
      
      // Check if there are any initiatives at all (including drafts) for debugging
      const { data: allInitiatives, error: allError } = await supabase
        .from('initiatives')
        .select('id, title, status, created_at')
        .limit(10)
      
      if (!allError && allInitiatives && allInitiatives.length > 0) {
        console.log(`📋 Found ${allInitiatives.length} initiatives in database, but none are published:`)
        allInitiatives.forEach(init => {
          console.log(`   - ${init.title} (status: ${init.status})`)
        })
        console.log('💡 Tip: Update draft initiatives to "published" status to make them visible')
      } else if (!allError && (!allInitiatives || allInitiatives.length === 0)) {
        console.log('📭 No initiatives found in database at all')
      }
      
      return []
    }

    console.log(`Found ${initiatives.length} initiatives, fetching milestones...`)
    
    // Debug: Log location data for each initiative (only in dev mode)
    if (import.meta.env.DEV) {
      initiatives.forEach((init, index) => {
        const rawLocation = init.location
        const rawCoords = rawLocation?.coordinates
        console.log(`=== Initiative ${index + 1} (${init.title}) ===`)
        console.log('Raw location from Supabase:', rawLocation)
        console.log('Raw coordinates:', rawCoords)
        console.log('Location type:', typeof rawLocation)
        console.log('Coordinates type:', typeof rawCoords)
        console.log('Lat value:', rawCoords?.lat, 'Type:', typeof rawCoords?.lat)
        console.log('Lng value:', rawCoords?.lng, 'Type:', typeof rawCoords?.lng)
        console.log('========================================')
      })
    }

    // Fetch milestones for all initiatives (only if we have initiatives)
    // Use a simpler approach - fetch milestones separately with timeout
    const initiativeIds = initiatives.map((i: any) => i.id)
    let milestones: SupabaseMilestone[] | null = null
    
    if (initiativeIds.length > 0) {
      try {
        const milestonesPromise = supabase
          .from('milestones')
          .select('*')
          .in('initiative_id', initiativeIds)
          .order('target_date', { ascending: true })

        const milestonesResult = await Promise.race([
          milestonesPromise,
          new Promise<{ data: null, error: { message: string } }>((_, reject) => 
            setTimeout(() => reject({ data: null, error: { message: 'Milestones query timeout' } }), 10000)
          )
        ]) as { data: any, error: any }

        if (milestonesResult.error) {
          console.warn('⚠️ Error fetching milestones (continuing without them):', milestonesResult.error)
          milestones = []
        } else {
          milestones = milestonesResult.data
        }
      } catch (error) {
        console.warn('⚠️ Milestones fetch timed out (continuing without them):', error)
        milestones = []
      }
    }

    // Group milestones by initiative_id
    const milestonesByInitiative = new Map<string, SupabaseMilestone[]>()
    if (milestones) {
      milestones.forEach(milestone => {
        const existing = milestonesByInitiative.get(milestone.initiative_id) || []
        milestonesByInitiative.set(milestone.initiative_id, [...existing, milestone])
      })
    }

    // Convert and combine
    const result = initiatives.map(initiative => 
      convertToInitiative(initiative as SupabaseInitiative, milestonesByInitiative.get(initiative.id) || [])
    )
    
    console.log(`Successfully loaded ${result.length} initiatives from Supabase`)
    return result
  } catch (error) {
    console.error('Error in fetchInitiatives:', error)
    return []
  }
}

// Fetch initiatives for a specific changemaker (user's own initiatives)
export const fetchUserInitiatives = async (changemakerId: string): Promise<Initiative[]> => {
  try {
    console.log('Fetching user initiatives for changemaker:', changemakerId);
    
    // Fetch all initiatives for this changemaker (including drafts)
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('changemaker_id', changemakerId)
      .order('created_at', { ascending: false });

    if (initiativesError) {
      console.error('Error fetching user initiatives:', initiativesError);
      return [];
    }

    if (!initiatives || initiatives.length === 0) {
      console.log('No initiatives found for this user');
      return [];
    }

    console.log(`Found ${initiatives.length} initiatives for user, fetching milestones...`);

    // Fetch milestones for all initiatives
    const initiativeIds = initiatives.map((i: any) => i.id);
    let milestones: SupabaseMilestone[] | null = null;

    if (initiativeIds.length > 0) {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .in('initiative_id', initiativeIds)
        .order('target_date', { ascending: true });

      if (milestonesError) {
        console.warn('Error fetching milestones:', milestonesError);
        milestones = [];
      } else {
        milestones = milestonesData;
      }
    }

    // Group milestones by initiative_id
    const milestonesByInitiative = new Map<string, SupabaseMilestone[]>();
    if (milestones) {
      milestones.forEach(milestone => {
        const existing = milestonesByInitiative.get(milestone.initiative_id) || [];
        milestonesByInitiative.set(milestone.initiative_id, [...existing, milestone]);
      });
    }

    // Convert and combine
    const result = initiatives.map(initiative =>
      convertToInitiative(initiative as SupabaseInitiative, milestonesByInitiative.get(initiative.id) || [])
    );

    console.log(`Successfully loaded ${result.length} user initiatives`);
    return result;
  } catch (error) {
    console.error('Error in fetchUserInitiatives:', error);
    return [];
  }
};

// Fetch a single initiative by ID
export const fetchInitiativeById = async (id: string): Promise<Initiative | null> => {
  try {
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', id)
      .single()

    if (initiativeError) {
      console.error('Error fetching initiative:', initiativeError)
      return null
    }

    // Fetch milestones for this initiative
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .eq('initiative_id', id)
      .order('target_date', { ascending: true })

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError)
    }

    return convertToInitiative(
      initiative as SupabaseInitiative,
      (milestones as SupabaseMilestone[]) || []
    )
  } catch (error) {
    console.error('Error in fetchInitiativeById:', error)
    return null
  }
}

// Create a new initiative with milestones
export const createInitiative = async (initiative: Initiative): Promise<Initiative | null> => {
  try {
    // Get current user from Supabase auth
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !currentUser) {
      console.error('Error getting current user:', userError)
      throw new Error('You must be logged in to create an initiative')
    }

    // First, ensure changemaker exists for the current user
    let changemakerId = initiative.changemaker_id

    // If changemaker_id is not provided or is a placeholder, find or create changemaker for current user
    if (!changemakerId || changemakerId === 'user-1' || changemakerId === 'system') {
      // Check if changemaker exists for this user
      const { data: existingChangemaker, error: changemakerFetchError } = await supabase
        .from('changemakers')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (changemakerFetchError) {
        console.error('Error fetching changemaker:', changemakerFetchError)
      }

      if (existingChangemaker) {
        changemakerId = existingChangemaker.id
        console.log('✅ Found existing changemaker for user:', changemakerId)
      } else {
        // Get user profile to get name and email
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        // Prepare changemaker data based on user type
        let changemakerData: any = {
          user_id: currentUser.id,
          name: userProfile?.email || currentUser.email || 'User',
          email: userProfile?.email || currentUser.email || '',
        }

        // If user is an organization, get organization name
        if (userProfile?.user_type === 'organization') {
          const { data: org } = await supabase
            .from('organizations')
            .select('organization_name')
            .eq('user_profile_id', userProfile.id)
            .maybeSingle()
          
          if (org?.organization_name) {
            changemakerData.name = org.organization_name
            changemakerData.organization = org.organization_name
          }
        } 
        // If user is government entity, get entity name
        else if (userProfile?.user_type === 'government') {
          const { data: gov } = await supabase
            .from('government_entities')
            .select('entity_name')
            .eq('user_profile_id', userProfile.id)
            .maybeSingle()
          
          if (gov?.entity_name) {
            changemakerData.name = gov.entity_name
            changemakerData.organization = gov.entity_name
          }
        }
        // If user is political figure, get their name
        else if (userProfile?.user_type === 'political_figure') {
          const { data: political } = await supabase
            .from('political_figures')
            .select('name')
            .eq('user_id', currentUser.id)
            .maybeSingle()
          
          if (political?.name) {
            changemakerData.name = political.name
          }
        }

        // Create changemaker for this user
        const { data: newChangemaker, error: changemakerError } = await supabase
          .from('changemakers')
          .insert(changemakerData)
          .select()
          .single()

        if (changemakerError) {
          console.error('Error creating changemaker:', changemakerError)
          // Try to fetch again in case it was created by another process
          const { data: retryChangemaker } = await supabase
            .from('changemakers')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle()
          
          if (retryChangemaker) {
            changemakerId = retryChangemaker.id
            console.log('✅ Found changemaker after retry:', changemakerId)
          } else {
            throw new Error(`Failed to create changemaker: ${changemakerError.message}`)
          }
        } else {
          changemakerId = newChangemaker.id
          console.log('✅ Created new changemaker for user:', changemakerId)
        }
      }
    }

    // Prepare initiative data for Supabase
    // Ensure coordinates are numbers, not strings
    const locationData = {
      ...initiative.location,
      coordinates: {
        lat: typeof initiative.location.coordinates.lat === 'string' 
          ? parseFloat(initiative.location.coordinates.lat) 
          : Number(initiative.location.coordinates.lat),
        lng: typeof initiative.location.coordinates.lng === 'string' 
          ? parseFloat(initiative.location.coordinates.lng) 
          : Number(initiative.location.coordinates.lng),
      }
    }
    
    // Validate coordinates before saving
    if (isNaN(locationData.coordinates.lat) || isNaN(locationData.coordinates.lng)) {
      console.error('Invalid coordinates when creating initiative:', locationData.coordinates)
      throw new Error('Invalid coordinates: lat and lng must be valid numbers')
    }
    
    console.log('💾 Saving initiative with location:', {
      title: initiative.title,
      county: locationData.county,
      coordinates: locationData.coordinates,
      lat: locationData.coordinates.lat,
      lng: locationData.coordinates.lng,
      latType: typeof locationData.coordinates.lat,
      lngType: typeof locationData.coordinates.lng,
      originalCoords: initiative.location.coordinates
    })
    
    // Map category to valid database values
    const validCategories = ['agriculture', 'water', 'health', 'education', 'infrastructure', 'economic'];
    const categoryMapping: Record<string, string> = {
      'social_welfare': 'health',
      'environment': 'infrastructure',
      'governance': 'infrastructure',
      'other': 'infrastructure',
    };
    const mappedCategory = categoryMapping[initiative.category] || initiative.category;
    const finalCategory = validCategories.includes(mappedCategory) ? mappedCategory : 'infrastructure';

    const initiativeData: any = {
      changemaker_id: changemakerId,
      title: initiative.title,
      short_description: initiative.short_description,
      description: initiative.description,
      category: finalCategory,
      target_amount: initiative.target_amount,
      raised_amount: initiative.raised_amount,
      location: locationData,
      project_duration: initiative.project_duration || null,
      expected_completion: initiative.expected_completion || null,
      reference_images: initiative.reference_images || [],
      payment_details: initiative.payment_details,
      status: initiative.status,
      satellite_snapshots: initiative.satellite_snapshots || [],
    }

    // Add opportunity_preferences only if provided (column may not exist in older schemas)
    if (initiative.opportunity_preferences) {
      initiativeData.opportunity_preferences = initiative.opportunity_preferences
    }

    // Insert initiative
    let { data: createdInitiative, error: initiativeError } = await supabase
      .from('initiatives')
      .insert(initiativeData)
      .select()
      .single()

    // If error is about unknown column (opportunity_preferences), retry without it
    if (initiativeError && (initiativeError.message?.includes('opportunity_preferences') || initiativeError.code === '42703')) {
      console.warn('⚠️ opportunity_preferences column not found, retrying without it. Run ADD_OPPORTUNITY_PREFERENCES.sql to enable this feature.')
      const { opportunity_preferences, ...dataWithoutPrefs } = initiativeData
      const retryResult = await supabase
        .from('initiatives')
        .insert(dataWithoutPrefs)
        .select()
        .single()
      
      if (retryResult.error) {
        initiativeError = retryResult.error
        createdInitiative = retryResult.data
      } else {
        initiativeError = null
        createdInitiative = retryResult.data
      }
    }

    if (initiativeError) {
      console.error('Error creating initiative:', initiativeError)
      console.error('Initiative data attempted:', initiativeData)
      console.error('Error code:', initiativeError.code)
      console.error('Error message:', initiativeError.message)
      console.error('Error details:', initiativeError.details)
      throw new Error(initiativeError.message || 'Failed to create initiative')
    }

    // Kick off satellite backfill in the background (non-blocking)
    // This will populate historical satellite snapshots from Sentinel Hub
    if (createdInitiative?.id) {
      console.log('🚀 Initiative created successfully. Triggering satellite backfill...', {
        initiativeId: createdInitiative.id,
        title: createdInitiative.title,
      });
      // Use setTimeout to ensure this happens after the response is sent
      setTimeout(() => {
        triggerSatelliteBackfill(createdInitiative.id as string).catch(err => {
          console.error('❌ Satellite backfill failed:', err);
        });
      }, 1000); // Small delay to ensure initiative is fully saved
    } else {
      console.warn('⚠️ Created initiative has no ID. Cannot trigger satellite backfill.');
    }

    // Insert milestones if any
    if (initiative.milestones && initiative.milestones.length > 0) {
      const milestonesData = initiative.milestones.map(milestone => ({
        initiative_id: createdInitiative.id,
        title: milestone.title,
        target_date: milestone.target_date,
        status: milestone.status,
        ...((milestone as any).description && { description: (milestone as any).description }),
      }))

      const { error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestonesData)

      if (milestonesError) {
        console.error('Error creating milestones:', milestonesError)
        // Continue even if milestones fail
      }
    }

    // Fetch the complete initiative with milestones (with timeout)
    console.log('📥 Fetching complete initiative with ID:', createdInitiative.id)
    
    try {
      // Add timeout to prevent hanging
      const fetchPromise = fetchInitiativeById(createdInitiative.id)
      const timeoutPromise = new Promise<Initiative | null>((resolve) => {
        setTimeout(() => {
          console.warn('⏱️ fetchInitiativeById timeout after 10 seconds')
          resolve(null)
        }, 10000)
      })
      
      const completeInitiative = await Promise.race([fetchPromise, timeoutPromise])
      
      if (!completeInitiative) {
        console.warn('⚠️ fetchInitiativeById returned null or timed out, but initiative was created. Returning basic initiative data.')
        // Return the initiative we just created even if fetch fails
        return {
          ...initiative,
          id: createdInitiative.id,
          created_at: createdInitiative.created_at,
          updated_at: createdInitiative.updated_at,
        } as Initiative
      }
      
      console.log('✅ Complete initiative fetched successfully')
      return completeInitiative
    } catch (fetchError) {
      console.error('⚠️ Error fetching complete initiative:', fetchError)
      // Still return the basic initiative data since creation succeeded
      return {
        ...initiative,
        id: createdInitiative.id,
        created_at: createdInitiative.created_at,
        updated_at: createdInitiative.updated_at,
      } as Initiative
    }
  } catch (error: any) {
    console.error('Error in createInitiative:', error)
    // Throw error instead of returning null so calling code can handle it
    throw new Error(error?.message || 'Failed to create initiative. Please try again.')
  }
}

// Update an existing initiative
export const updateInitiative = async (initiative: Initiative): Promise<Initiative | null> => {
  try {
    const initiativeData = {
      title: initiative.title,
      short_description: initiative.short_description,
      description: initiative.description,
      category: initiative.category,
      target_amount: initiative.target_amount,
      raised_amount: initiative.raised_amount,
      location: initiative.location,
      project_duration: initiative.project_duration || null,
      expected_completion: initiative.expected_completion || null,
      reference_images: initiative.reference_images || [],
      payment_details: initiative.payment_details,
      status: initiative.status,
      satellite_snapshots: initiative.satellite_snapshots || [],
    }

    const { error: initiativeError } = await supabase
      .from('initiatives')
      .update(initiativeData)
      .eq('id', initiative.id)

    if (initiativeError) {
      console.error('Error updating initiative:', initiativeError)
      throw initiativeError
    }

    // Update milestones (delete old ones and insert new ones)
    if (initiative.milestones) {
      // Delete existing milestones
      await supabase
        .from('milestones')
        .delete()
        .eq('initiative_id', initiative.id)

      // Insert new milestones
      if (initiative.milestones.length > 0) {
        const milestonesData = initiative.milestones.map(milestone => ({
          initiative_id: initiative.id,
          title: milestone.title,
          target_date: milestone.target_date,
          status: milestone.status,
          ...((milestone as any).description && { description: (milestone as any).description }),
        }))

        const { error: milestonesError } = await supabase
          .from('milestones')
          .insert(milestonesData)

        if (milestonesError) {
          console.error('Error updating milestones:', milestonesError)
        }
      }
    }

    return await fetchInitiativeById(initiative.id)
  } catch (error) {
    console.error('Error in updateInitiative:', error)
    return null
  }
}

// Delete an initiative
export const deleteInitiative = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('initiatives')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting initiative:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteInitiative:', error)
    return false
  }
}

