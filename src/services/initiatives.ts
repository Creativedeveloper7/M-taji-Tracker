import { supabase } from '../lib/supabase'
import { Initiative } from '../types'

// Database types matching Supabase schema
interface SupabaseInitiative {
  id: string
  changemaker_id: string
  title: string
  short_description?: string
  description: string
  category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic'
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
    reference_images: supabaseInitiative.reference_images || [],
    status: supabaseInitiative.status,
    created_at: supabaseInitiative.created_at,
    updated_at: supabaseInitiative.updated_at,
    payment_details: supabaseInitiative.payment_details,
  }
}

// Fetch all published/active initiatives
export const fetchInitiatives = async (): Promise<Initiative[]> => {
  try {
    console.log('Fetching initiatives from Supabase...')
    
    // Start with a simpler query - only fetch published initiatives first
    // This reduces complexity and improves performance
    let { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    // If no published initiatives, try active and completed
    if (!initiativesError && (!initiatives || initiatives.length === 0)) {
      console.log('No published initiatives found, checking active/completed...')
      const { data: activeData, error: activeError } = await supabase
        .from('initiatives')
        .select('*')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (!activeError && activeData) {
        initiatives = activeData
      }
      initiativesError = activeError
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
        .eq('status', 'published')
        .limit(50)
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
      console.log('No initiatives found in Supabase')
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
    // First, ensure changemaker exists (create if needed)
    // For now, we'll use a default changemaker or the one provided
    let changemakerId = initiative.changemaker_id

    // If changemaker_id is not a valid UUID, create or get default changemaker
    if (!changemakerId || changemakerId === 'user-1' || changemakerId === 'system') {
      // Check if default changemaker exists
      const { data: existingChangemaker } = await supabase
        .from('changemakers')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (!existingChangemaker) {
        // Create default changemaker
        const { data: newChangemaker, error: changemakerError } = await supabase
          .from('changemakers')
          .insert({
            id: '00000000-0000-0000-0000-000000000001',
            name: 'System Admin',
            email: 'admin@mtaji.com',
            organization: 'Mtaji Tracker',
            bio: 'System administrator account',
          })
          .select()
          .single()

        if (changemakerError) {
          if (changemakerError.code === '23505') {
            // Duplicate key - changemaker already exists, try to fetch it
            console.log('Changemaker already exists, fetching...')
            const { data: fetched } = await supabase
              .from('changemakers')
              .select('id')
              .eq('id', '00000000-0000-0000-0000-000000000001')
              .single()
            changemakerId = fetched?.id || '00000000-0000-0000-0000-000000000001'
          } else {
            console.error('Error creating changemaker:', changemakerError)
            console.error('Changemaker error code:', changemakerError.code)
            console.error('Changemaker error message:', changemakerError.message)
            // Still try to use the ID even if insert failed (might be RLS issue)
            changemakerId = '00000000-0000-0000-0000-000000000001'
          }
        } else {
          changemakerId = newChangemaker?.id || '00000000-0000-0000-0000-000000000001'
        }
      } else {
        changemakerId = existingChangemaker.id
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
    
    const initiativeData = {
      changemaker_id: changemakerId,
      title: initiative.title,
      short_description: initiative.short_description,
      description: initiative.description,
      category: initiative.category,
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

    // Insert initiative
    const { data: createdInitiative, error: initiativeError } = await supabase
      .from('initiatives')
      .insert(initiativeData)
      .select()
      .single()

    if (initiativeError) {
      console.error('Error creating initiative:', initiativeError)
      console.error('Initiative data attempted:', initiativeData)
      console.error('Error code:', initiativeError.code)
      console.error('Error message:', initiativeError.message)
      console.error('Error details:', initiativeError.details)
      throw new Error(initiativeError.message || 'Failed to create initiative')
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

    // Fetch the complete initiative with milestones
    return await fetchInitiativeById(createdInitiative.id)
  } catch (error) {
    console.error('Error in createInitiative:', error)
    return null
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

