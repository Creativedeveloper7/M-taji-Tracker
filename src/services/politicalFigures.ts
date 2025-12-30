import { supabase } from '../lib/supabase'
import { PoliticalFigure, PoliticalPosition } from '../types/politicalFigure'

// Database types matching Supabase schema
interface SupabasePoliticalFigure {
  id: string
  user_id: string
  name: string
  position: PoliticalPosition
  county?: string
  constituency?: string
  ward?: string
  term_start: string
  term_end: string
  term_years: number
  manifesto: {
    document_url?: string
    text: string
    uploaded_at: string
    parsed_at?: string
    focus_areas: Array<{
      category: 'agriculture' | 'water' | 'health' | 'education' | 'infrastructure' | 'economic'
      priority: number
      commitments: string[]
      keywords: string[]
    }>
    targets: Array<{
      description: string
      quantity?: number
      category: string
      location?: string
    }>
  }
  commissioned_projects: string[]
  total_investment: number
  projects_by_category: {
    agriculture: number
    water: number
    health: number
    education: number
    infrastructure: number
    economic: number
  }
  status: 'active' | 'inactive' | 'seeking_reelection'
  created_at: string
  updated_at: string
}

// Convert Supabase data to PoliticalFigure
const convertToPoliticalFigure = (supabaseFigure: SupabasePoliticalFigure): PoliticalFigure => {
  return {
    id: supabaseFigure.id,
    user_id: supabaseFigure.user_id,
    name: supabaseFigure.name,
    position: supabaseFigure.position,
    county: supabaseFigure.county,
    constituency: supabaseFigure.constituency,
    ward: supabaseFigure.ward,
    term_start: supabaseFigure.term_start,
    term_end: supabaseFigure.term_end,
    term_years: supabaseFigure.term_years,
    manifesto: supabaseFigure.manifesto,
    commissioned_projects: supabaseFigure.commissioned_projects || [],
    total_investment: supabaseFigure.total_investment || 0,
    projects_by_category: supabaseFigure.projects_by_category || {
      agriculture: 0,
      water: 0,
      health: 0,
      education: 0,
      infrastructure: 0,
      economic: 0
    },
    status: supabaseFigure.status,
    created_at: supabaseFigure.created_at,
    updated_at: supabaseFigure.updated_at,
  }
}

/**
 * Fetch all active political figures
 */
export const fetchPoliticalFigures = async (): Promise<PoliticalFigure[]> => {
  try {
    const { data, error } = await supabase
      .from('political_figures')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching political figures:', error)
      throw error
    }

    return (data || []).map(convertToPoliticalFigure)
  } catch (error) {
    console.error('Error in fetchPoliticalFigures:', error)
    return []
  }
}

/**
 * Fetch political figures by jurisdiction
 */
export const fetchPoliticalFiguresByJurisdiction = async (
  county?: string,
  constituency?: string
): Promise<PoliticalFigure[]> => {
  try {
    let query = supabase
      .from('political_figures')
      .select('*')
      .eq('status', 'active')

    if (county) {
      query = query.eq('county', county)
    }

    if (constituency) {
      query = query.eq('constituency', constituency)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching political figures by jurisdiction:', error)
      throw error
    }

    return (data || []).map(convertToPoliticalFigure)
  } catch (error) {
    console.error('Error in fetchPoliticalFiguresByJurisdiction:', error)
    return []
  }
}

/**
 * Fetch a single political figure by ID
 */
export const fetchPoliticalFigureById = async (id: string): Promise<PoliticalFigure | null> => {
  try {
    const { data, error } = await supabase
      .from('political_figures')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching political figure:', error)
      return null
    }

    return convertToPoliticalFigure(data as SupabasePoliticalFigure)
  } catch (error) {
    console.error('Error in fetchPoliticalFigureById:', error)
    return null
  }
}

/**
 * Fetch political figure by user ID
 */
export const fetchPoliticalFigureByUserId = async (userId: string): Promise<PoliticalFigure | null> => {
  try {
    const { data, error } = await supabase
      .from('political_figures')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching political figure by user ID:', error)
      return null
    }

    return convertToPoliticalFigure(data as SupabasePoliticalFigure)
  } catch (error) {
    console.error('Error in fetchPoliticalFigureByUserId:', error)
    return null
  }
}

/**
 * Create a new political figure profile
 */
export const createPoliticalFigure = async (
  figure: Partial<PoliticalFigure>,
  userId?: string
): Promise<PoliticalFigure | null> => {
  try {
    // Get current user from Supabase auth
    // If userId not provided, try to get from current session
    let currentUserId = userId
    
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        currentUserId = user.id
      } else {
        // For development/testing: try to use an existing changemaker's user_id
        console.warn('⚠️ No authenticated user found. Attempting to use existing changemaker...')
        
        const { data: changemakers } = await supabase
          .from('changemakers')
          .select('user_id, id')
          .limit(1)
        
        if (changemakers && changemakers.length > 0) {
          const changemaker = changemakers[0]
          if (changemaker.user_id) {
            currentUserId = changemaker.user_id
            console.log('✅ Using changemaker user_id:', currentUserId)
          } else {
            // For testing: allow null user_id if table allows it
            if (import.meta.env.DEV) {
              console.warn('⚠️ Changemaker has no user_id. Attempting to create with null user_id (for testing only).')
              currentUserId = null as any // Type assertion for testing
            } else {
              throw new Error(
                'No authenticated user found. Please log in to create a political figure profile.\n' +
                'Alternatively, ensure a changemaker exists with a valid user_id linked to auth.users.'
              )
            }
          }
        } else {
          // For testing: allow null user_id if table allows it
          if (import.meta.env.DEV) {
            console.warn('⚠️ No changemakers found. Attempting to create with null user_id (for testing only).')
            currentUserId = null as any // Type assertion for testing
          } else {
            throw new Error(
              'Authentication required. Please log in to create a political figure profile.\n' +
              'For testing, ensure at least one changemaker exists in the database with a valid user_id.'
            )
          }
        }
      }
    }

    if (!figure.name || !figure.position || !figure.term_start) {
      throw new Error('Missing required fields: name, position, term_start')
    }
    
    // Allow null user_id in development mode for testing
    // The database column must be nullable for this to work
    if (!currentUserId && !import.meta.env.DEV) {
      throw new Error('User ID is required. Please ensure you are logged in.')
    }

    // Calculate term_end if not provided
    let termEnd = figure.term_end
    if (!termEnd && figure.term_start) {
      const startDate = new Date(figure.term_start)
      const endDate = new Date(startDate)
      endDate.setFullYear(startDate.getFullYear() + (figure.term_years || 5))
      termEnd = endDate.toISOString().split('T')[0]
    }

    const figureData: any = {
      user_id: currentUserId || null, // Allow null in development
      name: figure.name,
      position: figure.position,
      county: figure.county || null,
      constituency: figure.constituency || null,
      ward: figure.ward || null,
      term_start: figure.term_start,
      term_end: termEnd,
      term_years: figure.term_years || 5,
      manifesto: figure.manifesto || {
        text: '',
        uploaded_at: new Date().toISOString(),
        focus_areas: [],
        targets: []
      },
      commissioned_projects: figure.commissioned_projects || [],
      total_investment: figure.total_investment || 0,
      projects_by_category: figure.projects_by_category || {
        agriculture: 0,
        water: 0,
        health: 0,
        education: 0,
        infrastructure: 0,
        economic: 0
      },
      status: figure.status || 'active',
    }

    const { data, error } = await supabase
      .from('political_figures')
      .insert(figureData)
      .select()
      .single()

    if (error) {
      console.error('Error creating political figure:', error)
      throw error
    }

    return convertToPoliticalFigure(data as SupabasePoliticalFigure)
  } catch (error) {
    console.error('Error in createPoliticalFigure:', error)
    throw error
  }
}

/**
 * Update a political figure profile
 */
export const updatePoliticalFigure = async (
  figure: Partial<PoliticalFigure> & { id: string }
): Promise<PoliticalFigure | null> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (figure.name) updateData.name = figure.name
    if (figure.position) updateData.position = figure.position
    if (figure.county !== undefined) updateData.county = figure.county
    if (figure.constituency !== undefined) updateData.constituency = figure.constituency
    if (figure.ward !== undefined) updateData.ward = figure.ward
    if (figure.term_start) updateData.term_start = figure.term_start
    if (figure.term_end) updateData.term_end = figure.term_end
    if (figure.term_years) updateData.term_years = figure.term_years
    if (figure.manifesto) updateData.manifesto = figure.manifesto
    if (figure.commissioned_projects) updateData.commissioned_projects = figure.commissioned_projects
    if (figure.total_investment !== undefined) updateData.total_investment = figure.total_investment
    if (figure.projects_by_category) updateData.projects_by_category = figure.projects_by_category
    if (figure.status) updateData.status = figure.status

    const { data, error } = await supabase
      .from('political_figures')
      .update(updateData)
      .eq('id', figure.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating political figure:', error)
      throw error
    }

    return convertToPoliticalFigure(data as SupabasePoliticalFigure)
  } catch (error) {
    console.error('Error in updatePoliticalFigure:', error)
    throw error
  }
}

/**
 * Add an initiative to a political figure's commissioned projects
 */
export const addCommissionedProject = async (
  figureId: string,
  initiativeId: string
): Promise<void> => {
  try {
    // Fetch current figure
    const figure = await fetchPoliticalFigureById(figureId)
    if (!figure) {
      throw new Error('Political figure not found')
    }

    // Add initiative to commissioned projects if not already there
    const updatedProjects = figure.commissioned_projects.includes(initiativeId)
      ? figure.commissioned_projects
      : [...figure.commissioned_projects, initiativeId]

    await updatePoliticalFigure({
      id: figureId,
      commissioned_projects: updatedProjects,
    })
  } catch (error) {
    console.error('Error in addCommissionedProject:', error)
    throw error
  }
}

/**
 * Update political figure's investment amount
 */
export const updateInvestment = async (
  figureId: string,
  amount: number
): Promise<void> => {
  try {
    const figure = await fetchPoliticalFigureById(figureId)
    if (!figure) {
      throw new Error('Political figure not found')
    }

    await updatePoliticalFigure({
      id: figureId,
      total_investment: (figure.total_investment || 0) + amount,
    })
  } catch (error) {
    console.error('Error in updateInvestment:', error)
    throw error
  }
}

