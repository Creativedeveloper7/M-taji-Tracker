import { supabase } from '../lib/supabase'

// Volunteer Application Types
export interface VolunteerApplication {
  id?: string
  initiative_id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  skills?: string[]
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  previous_volunteer_experience?: string
  availability_days?: string[]
  availability_hours_per_week?: number
  start_date?: string
  commitment_duration?: string
  motivation?: string
  interests?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  special_requirements?: string
  additional_notes?: string
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'active' | 'completed'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  rejection_reason?: string
  assigned_tasks?: string[]
  assigned_by?: string
  assigned_at?: string
  hours_contributed?: number
  tasks_completed?: number
  last_active_at?: string
  created_at?: string
  updated_at?: string
}

export interface VolunteerApplicationFormData {
  full_name: string
  email: string
  phone?: string
  address?: string
  skills: string[]
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  previous_volunteer_experience?: string
  availability_days: string[]
  availability_hours_per_week: number
  start_date: string
  commitment_duration: string
  motivation: string
  interests: string[]
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  special_requirements?: string
  additional_notes?: string
}

/**
 * Create a new volunteer application
 */
export const createVolunteerApplication = async (
  initiativeId: string,
  formData: VolunteerApplicationFormData
): Promise<VolunteerApplication> => {
  try {
    console.log('📝 Creating volunteer application for initiative:', initiativeId)
    
    const applicationData: Partial<VolunteerApplication> = {
      initiative_id: initiativeId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      skills: formData.skills || [],
      experience_level: formData.experience_level,
      previous_volunteer_experience: formData.previous_volunteer_experience || undefined,
      availability_days: formData.availability_days || [],
      availability_hours_per_week: formData.availability_hours_per_week || undefined,
      start_date: formData.start_date || undefined,
      commitment_duration: formData.commitment_duration || undefined,
      motivation: formData.motivation || undefined,
      interests: formData.interests || [],
      emergency_contact_name: formData.emergency_contact_name || undefined,
      emergency_contact_phone: formData.emergency_contact_phone || undefined,
      emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
      special_requirements: formData.special_requirements || undefined,
      additional_notes: formData.additional_notes || undefined,
      status: 'pending',
    }

    const { data, error } = await supabase
      .from('volunteer_applications')
      .insert([applicationData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating volunteer application:', error)
      throw error
    }

    console.log('✅ Volunteer application created successfully:', data?.id)
    return data as VolunteerApplication
  } catch (error: any) {
    console.error('❌ Failed to create volunteer application:', error)
    throw new Error(error.message || 'Failed to create volunteer application')
  }
}

/**
 * Get all volunteer applications for an initiative
 */
export const getVolunteerApplicationsByInitiative = async (
  initiativeId: string
): Promise<VolunteerApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching volunteer applications:', error)
      throw error
    }

    return (data || []) as VolunteerApplication[]
  } catch (error: any) {
    console.error('❌ Failed to fetch volunteer applications:', error)
    throw new Error(error.message || 'Failed to fetch volunteer applications')
  }
}

/**
 * Get all volunteer applications (for dashboard)
 */
export const getAllVolunteerApplications = async (
  filters?: {
    status?: string
    initiative_id?: string
  }
): Promise<VolunteerApplication[]> => {
  try {
    let query = supabase
      .from('volunteer_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.initiative_id) {
      query = query.eq('initiative_id', filters.initiative_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching volunteer applications:', error)
      throw error
    }

    return (data || []) as VolunteerApplication[]
  } catch (error: any) {
    console.error('❌ Failed to fetch volunteer applications:', error)
    throw new Error(error.message || 'Failed to fetch volunteer applications')
  }
}

/**
 * Update volunteer application status
 */
export const updateVolunteerApplicationStatus = async (
  applicationId: string,
  status: VolunteerApplication['status'],
  reviewNotes?: string,
  rejectionReason?: string
): Promise<VolunteerApplication> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
    }

    if (user) {
      updateData.reviewed_by = user.id
    }

    if (reviewNotes) {
      updateData.review_notes = reviewNotes
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    if (status === 'approved') {
      updateData.assigned_at = new Date().toISOString()
      if (user) {
        updateData.assigned_by = user.id
      }
    }

    const { data, error } = await supabase
      .from('volunteer_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating volunteer application:', error)
      throw error
    }

    return data as VolunteerApplication
  } catch (error: any) {
    console.error('❌ Failed to update volunteer application:', error)
    throw new Error(error.message || 'Failed to update volunteer application')
  }
}

/**
 * Get volunteer count for an initiative
 */
export const getVolunteerCount = async (initiativeId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_initiative_volunteer_count', {
      initiative_uuid: initiativeId
    })

    if (error) {
      // Fallback to manual count if RPC function doesn't exist
      const { count } = await supabase
        .from('volunteer_applications')
        .select('*', { count: 'exact', head: true })
        .eq('initiative_id', initiativeId)
        .in('status', ['approved', 'active', 'completed'])

      return count || 0
    }

    return data || 0
  } catch (error: any) {
    console.error('❌ Failed to get volunteer count:', error)
    return 0
  }
}
