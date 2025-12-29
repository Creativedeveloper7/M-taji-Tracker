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
  return {
    id: supabaseInitiative.id,
    changemaker_id: supabaseInitiative.changemaker_id,
    title: supabaseInitiative.title,
    short_description: supabaseInitiative.short_description,
    description: supabaseInitiative.description,
    category: supabaseInitiative.category,
    target_amount: Number(supabaseInitiative.target_amount),
    raised_amount: Number(supabaseInitiative.raised_amount),
    location: supabaseInitiative.location,
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
    
    // Fetch initiatives with status published, active, or completed
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')
      .in('status', ['published', 'active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(100) // Limit to prevent huge queries

    if (initiativesError) {
      console.error('Error fetching initiatives:', initiativesError)
      throw initiativesError
    }

    if (!initiatives || initiatives.length === 0) {
      console.log('No initiatives found in Supabase')
      return []
    }

    console.log(`Found ${initiatives.length} initiatives, fetching milestones...`)

    // Fetch milestones for all initiatives (only if we have initiatives)
    const initiativeIds = initiatives.map(i => i.id)
    let milestones: SupabaseMilestone[] | null = null
    
    if (initiativeIds.length > 0) {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .in('initiative_id', initiativeIds)
        .order('target_date', { ascending: true })

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError)
        // Continue without milestones if there's an error
      } else {
        milestones = milestonesData
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
    const initiativeData = {
      changemaker_id: changemakerId,
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
        description: milestone.description,
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
          description: milestone.description,
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

