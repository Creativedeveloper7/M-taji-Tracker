import { supabase } from '../lib/supabase'

export interface InitiativeJob {
  id: string
  initiative_id: string
  title: string
  job_type?: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface JobApplicationFormData {
  full_name: string
  email: string
  phone?: string
  motivation: string
  job_id?: string | null
}

export interface AmbassadorApplicationFormData {
  full_name: string
  email: string
  reach: string
  motivation: string
}

export interface ProposalFormData {
  name: string
  email: string
  subject: string
  details: string
  links?: string
}

export interface ContentCreatorApplicationFormData {
  full_name: string
  email: string
  content_type: string
  portfolio: string
  motivation: string
}

export interface NewJobInput {
  title: string
  job_type?: string
  description?: string
}

export const getInitiativeJobs = async (initiativeId: string): Promise<InitiativeJob[]> => {
  console.log('🔍 Fetching jobs for initiative:', initiativeId)
  
  const { data, error } = await supabase
    .from('initiative_jobs')
    .select('*')
    .eq('initiative_id', initiativeId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching initiative jobs:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message || 'Failed to load jobs for this initiative')
  }

  console.log('📋 Found', data?.length || 0, 'jobs for initiative', initiativeId, ':', data)
  return (data || []) as InitiativeJob[]
}

export const createJobApplication = async (
  initiativeId: string,
  form: JobApplicationFormData
) => {
  console.log('📝 Creating job application:', { initiativeId, form })
  
  const payload = {
    initiative_id: initiativeId,
    job_id: form.job_id || null,
    full_name: form.full_name,
    email: form.email,
    phone: form.phone || null,
    motivation: form.motivation,
  }

  console.log('📦 Payload:', payload)

  const { data, error } = await supabase
    .from('initiative_job_applications')
    .insert([payload])
    .select()

  if (error) {
    console.error('❌ Error creating job application:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message || 'Failed to submit job application')
  }

  console.log('✅ Successfully created job application:', data)
  return data
}

export const createJobsForInitiative = async (
  initiativeId: string,
  jobs: NewJobInput[],
) => {
  console.log('💼 createJobsForInitiative called:', { initiativeId, jobsCount: jobs.length, jobs })
  
  const cleaned = jobs
    .map(j => ({
      title: j.title?.trim(),
      job_type: j.job_type?.trim() || null,
      description: j.description?.trim() || null,
    }))
    .filter(j => j.title)

  console.log('🧹 Cleaned jobs:', cleaned)

  if (cleaned.length === 0) {
    console.log('⚠️ No valid jobs to save (all had empty titles)')
    return
  }

  const rows = cleaned.map(j => ({
    initiative_id: initiativeId,
    title: j.title,
    job_type: j.job_type,
    description: j.description,
    is_active: true,
  }))

  console.log('📝 Inserting job rows:', rows)

  const { data, error } = await supabase
    .from('initiative_jobs')
    .insert(rows)
    .select()

  if (error) {
    console.error('❌ Error creating initiative jobs:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message || 'Failed to save jobs for initiative')
  }

  console.log('✅ Successfully created', data?.length || 0, 'jobs:', data)
  return data
}

export const createAmbassadorApplication = async (
  initiativeId: string,
  form: AmbassadorApplicationFormData
) => {
  const payload = {
    initiative_id: initiativeId,
    full_name: form.full_name,
    email: form.email,
    reach: form.reach,
    motivation: form.motivation,
  }

  const { error } = await supabase
    .from('initiative_ambassador_applications')
    .insert([payload])

  if (error) {
    console.error('❌ Error creating ambassador application:', error)
    throw new Error(error.message || 'Failed to submit ambassador application')
  }
}

export const createProposal = async (
  initiativeId: string,
  form: ProposalFormData
) => {
  const payload = {
    initiative_id: initiativeId,
    name: form.name,
    email: form.email,
    subject: form.subject,
    details: form.details,
    links: form.links || null,
  }

  const { error } = await supabase
    .from('initiative_proposals')
    .insert([payload])

  if (error) {
    console.error('❌ Error creating proposal:', error)
    throw new Error(error.message || 'Failed to send proposal')
  }
}

export const createContentCreatorApplication = async (
  initiativeId: string,
  form: ContentCreatorApplicationFormData
) => {
  const payload = {
    initiative_id: initiativeId,
    full_name: form.full_name,
    email: form.email,
    content_type: form.content_type,
    portfolio: form.portfolio,
    motivation: form.motivation,
  }

  const { error } = await supabase
    .from('initiative_content_creator_applications')
    .insert([payload])

  if (error) {
    console.error('❌ Error creating content creator application:', error)
    throw new Error(error.message || 'Failed to submit content creator application')
  }
}

// ============================================
// Dashboard Functions - Fetch Applications for Initiative Owners
// ============================================

export interface JobApplication {
  id: string
  initiative_id: string
  job_id: string | null
  full_name: string
  email: string
  phone: string | null
  motivation: string | null
  status: string
  created_at: string
  job_title?: string
}

export interface AmbassadorApplication {
  id: string
  initiative_id: string
  full_name: string
  email: string
  reach: string
  motivation: string
  status: string
  created_at: string
}

export interface Proposal {
  id: string
  initiative_id: string
  name: string
  email: string
  subject: string
  details: string
  links: string | null
  status: string
  created_at: string
}

export interface ContentCreatorApplication {
  id: string
  initiative_id: string
  full_name: string
  email: string
  content_type: string
  portfolio: string
  motivation: string
  status: string
  created_at: string
}

/**
 * Get all job applications for initiatives owned by the current user
 */
export const getAllJobApplications = async (): Promise<JobApplication[]> => {
  const { data: applications, error: appsError } = await supabase
    .from('initiative_job_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (appsError) {
    console.error('❌ Error fetching job applications:', appsError)
    throw new Error(appsError.message || 'Failed to fetch job applications')
  }

  if (!applications || applications.length === 0) {
    return []
  }

  // Get unique job IDs
  const jobIds = [...new Set(applications.map((app: any) => app.job_id).filter(Boolean))]
  
  // Fetch job titles if there are any job IDs
  let jobMap = new Map<string, string>()
  if (jobIds.length > 0) {
    const { data: jobs, error: jobsError } = await supabase
      .from('initiative_jobs')
      .select('id, title')
      .in('id', jobIds)

    if (!jobsError && jobs) {
      jobMap = new Map(jobs.map((job: any) => [job.id, job.title]))
    }
  }

  // Map the data to include job title
  return (applications || []).map((app: any) => ({
    ...app,
    job_title: app.job_id ? jobMap.get(app.job_id) || null : null,
  })) as JobApplication[]
}

/**
 * Get all ambassador applications for initiatives owned by the current user
 */
export const getAllAmbassadorApplications = async (): Promise<AmbassadorApplication[]> => {
  const { data, error } = await supabase
    .from('initiative_ambassador_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching ambassador applications:', error)
    throw new Error(error.message || 'Failed to fetch ambassador applications')
  }

  return (data || []) as AmbassadorApplication[]
}

/**
 * Get all proposals for initiatives owned by the current user
 */
export const getAllProposals = async (): Promise<Proposal[]> => {
  const { data, error } = await supabase
    .from('initiative_proposals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching proposals:', error)
    throw new Error(error.message || 'Failed to fetch proposals')
  }

  return (data || []) as Proposal[]
}

/**
 * Get all content creator applications for initiatives owned by the current user
 */
export const getAllContentCreatorApplications = async (): Promise<ContentCreatorApplication[]> => {
  const { data, error } = await supabase
    .from('initiative_content_creator_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching content creator applications:', error)
    throw new Error(error.message || 'Failed to fetch content creator applications')
  }

  return (data || []) as ContentCreatorApplication[]
}

/**
 * Update job application status
 */
export const updateJobApplicationStatus = async (
  applicationId: string,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
): Promise<void> => {
  const { error } = await supabase
    .from('initiative_job_applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    console.error('❌ Error updating job application status:', error)
    throw new Error(error.message || 'Failed to update job application status')
  }
}

/**
 * Update ambassador application status
 */
export const updateAmbassadorApplicationStatus = async (
  applicationId: string,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
): Promise<void> => {
  const { error } = await supabase
    .from('initiative_ambassador_applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    console.error('❌ Error updating ambassador application status:', error)
    throw new Error(error.message || 'Failed to update ambassador application status')
  }
}

/**
 * Update proposal status
 */
export const updateProposalStatus = async (
  proposalId: string,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
): Promise<void> => {
  const { error } = await supabase
    .from('initiative_proposals')
    .update({ status })
    .eq('id', proposalId)

  if (error) {
    console.error('❌ Error updating proposal status:', error)
    throw new Error(error.message || 'Failed to update proposal status')
  }
}

/**
 * Update content creator application status
 */
export const updateContentCreatorApplicationStatus = async (
  applicationId: string,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
): Promise<void> => {
  const { error } = await supabase
    .from('initiative_content_creator_applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    console.error('❌ Error updating content creator application status:', error)
    throw new Error(error.message || 'Failed to update content creator application status')
  }
}

