import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { Initiative } from '../types'
import { fetchInitiativeById } from '../services/initiatives'
import VolunteerForm from '../components/VolunteerForm'
import {
  getInitiativeJobs,
  createJobApplication,
  createAmbassadorApplication,
  createProposal,
  createContentCreatorApplication,
  InitiativeJob,
} from '../services/opportunitiesService'

type OpportunityTab = 'jobs' | 'volunteer' | 'ambassador' | 'proposal' | 'content'

export default function InitiativeOpportunities() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [initiative, setInitiative] = useState<Initiative | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<OpportunityTab>('jobs')
  const [showVolunteerForm, setShowVolunteerForm] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [simpleFormStatus, setSimpleFormStatus] = useState<string | null>(null)
  const [jobs, setJobs] = useState<InitiativeJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const jobFormRef = useRef<HTMLFormElement>(null)
  const ambassadorFormRef = useRef<HTMLFormElement>(null)
  const proposalFormRef = useRef<HTMLFormElement>(null)
  const contentFormRef = useRef<HTMLFormElement>(null)

  // Get opportunity preferences with defaults
  const prefs = initiative?.opportunity_preferences || {
    acceptProposals: true,
    acceptContentCreators: true,
    acceptAmbassadors: true,
  }

  // Ensure activeTab is valid based on preferences
  useEffect(() => {
    if (!initiative) return
    if (activeTab === 'proposal' && prefs.acceptProposals === false) {
      setActiveTab('jobs')
    } else if (activeTab === 'content' && prefs.acceptContentCreators === false) {
      setActiveTab('jobs')
    } else if (activeTab === 'ambassador' && prefs.acceptAmbassadors === false) {
      setActiveTab('jobs')
    }
  }, [initiative, prefs, activeTab])

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Invalid initiative ID')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await fetchInitiativeById(id)
        if (!data) {
          setError('Initiative not found')
        } else {
          setInitiative(data)
        }
      } catch (err: any) {
        console.error('Error loading initiative for opportunities:', err)
        setError('Failed to load initiative details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Load jobs once we know the initiative
  useEffect(() => {
    const loadJobs = async () => {
      if (!initiative?.id) return
      try {
        setJobsLoading(true)
        setJobsError(null)
        const list = await getInitiativeJobs(initiative.id)
        setJobs(list)
        if (list.length > 0) {
          setSelectedJobId(list[0].id)
        }
      } catch (err: any) {
        console.error('Error loading jobs:', err)
        setJobsError(err.message || 'Failed to load jobs for this initiative')
      } finally {
        setJobsLoading(false)
      }
    }
    loadJobs()
  }, [initiative?.id])

  const handleJobSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!initiative?.id) return

    const form = event.currentTarget || jobFormRef.current
    if (!form) return

    const formData = new FormData(form)
    const payload = {
      full_name: String(formData.get('full_name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      motivation: String(formData.get('motivation') || ''),
      job_id: selectedJobId,
    }

    try {
      setIsSubmitting(true)
      await createJobApplication(initiative.id, payload)
      setSimpleFormStatus('Job application sent. Thank you!')
      form.reset()
    } catch (err: any) {
      console.error('Job application error:', err)
      setSimpleFormStatus(err.message || 'Failed to submit job application')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSimpleFormStatus(null), 3000)
    }
  }

  const handleAmbassadorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!initiative?.id) return

    const formData = new FormData(event.currentTarget)
    const payload = {
      full_name: String(formData.get('full_name') || ''),
      email: String(formData.get('email') || ''),
      reach: String(formData.get('reach') || ''),
      motivation: String(formData.get('motivation') || ''),
    }

    try {
      setIsSubmitting(true)
      await createAmbassadorApplication(initiative.id, payload)
      setSimpleFormStatus('Project ambassador application sent. Thank you!')
      event.currentTarget.reset()
    } catch (err: any) {
      console.error('Ambassador application error:', err)
      setSimpleFormStatus(err.message || 'Failed to submit ambassador application')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSimpleFormStatus(null), 3000)
    }
  }

  const handleProposalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!initiative?.id) return

    const form = event.currentTarget || proposalFormRef.current
    if (!form) return

    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      subject: String(formData.get('subject') || ''),
      details: String(formData.get('details') || ''),
      links: String(formData.get('links') || ''),
    }

    try {
      setIsSubmitting(true)
      await createProposal(initiative.id, payload)
      setSimpleFormStatus('Proposal sent. Thank you!')
      form.reset()
    } catch (err: any) {
      console.error('Proposal submit error:', err)
      setSimpleFormStatus(err.message || 'Failed to send proposal')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSimpleFormStatus(null), 3000)
    }
  }

  const handleContentCreatorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!initiative?.id) return

    const form = event.currentTarget || contentFormRef.current
    if (!form) return

    const formData = new FormData(form)
    const payload = {
      full_name: String(formData.get('full_name') || ''),
      email: String(formData.get('email') || ''),
      content_type: String(formData.get('content_type') || ''),
      portfolio: String(formData.get('portfolio') || ''),
      motivation: String(formData.get('motivation') || ''),
    }

    try {
      setIsSubmitting(true)
      await createContentCreatorApplication(initiative.id, payload)
      setSimpleFormStatus('Content creator application sent. Thank you!')
      form.reset()
    } catch (err: any) {
      console.error('Content creator application error:', err)
      setSimpleFormStatus(err.message || 'Failed to submit content creator application')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSimpleFormStatus(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header onCreateInitiative={() => navigate('/map')} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !initiative) {
    return (
      <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
        <Header onCreateInitiative={() => navigate('/map')} />
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900">
      <Header onCreateInitiative={() => navigate('/map')} />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          to={`/initiatives/${initiative.id}`}
          className="inline-flex items-center gap-2 text-mtaji-primary hover:text-mtaji-primary-dark mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Initiative
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-mtaji-primary mb-2">
            Opportunities
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            {initiative.title}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Connect with this initiative as a contributor, volunteer, ambassador, partner or content creator.
          </p>
        </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'jobs', label: 'Jobs' },
                  { id: 'volunteer', label: 'Volunteer' },
                  { id: 'ambassador', label: 'Project Ambassador', requires: 'acceptAmbassadors' },
                  { id: 'proposal', label: 'Proposal', requires: 'acceptProposals' },
                  { id: 'content', label: 'Content Creator', requires: 'acceptContentCreators' },
                ]
                  .filter((tab) => {
                    if (!tab.requires) return true
                    const prefs = initiative?.opportunity_preferences || {
                      acceptProposals: true,
                      acceptContentCreators: true,
                      acceptAmbassadors: true,
                    }
                    return prefs[tab.requires as keyof typeof prefs] !== false
                  })
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as OpportunityTab)}
                      className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                        activeTab === tab.id
                          ? 'bg-mtaji-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>
            </div>

          {simpleFormStatus && (
            <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500 text-amber-600 dark:text-amber-400 rounded-lg text-sm">
              {simpleFormStatus}
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-6">
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-bold text-mtaji-primary">
                  Jobs for this Initiative
                </h2>
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  Select a role you are interested in and submit your application.
                </p>

                {jobsLoading && (
                  <p className="text-sm text-gray-700 dark:text-gray-400">Loading jobs...</p>
                )}

                {jobsError && (
                  <p className="text-sm text-red-500">{jobsError}</p>
                )}

                {!jobsLoading && jobs.length === 0 && !jobsError && (
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    No jobs have been posted for this initiative yet.
                  </p>
                )}

                {jobs.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {jobs.map(job => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className={`text-left border rounded-lg p-3 transition-colors ${
                          selectedJobId === job.id
                            ? 'border-mtaji-primary bg-mtaji-primary/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-mtaji-primary'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{job.title}</p>
                        {job.job_type && (
                          <p className="text-xs text-gray-700 dark:text-gray-400">{job.job_type}</p>
                        )}
                        {job.description && (
                          <p className="mt-1 text-xs text-gray-700 dark:text-gray-400 line-clamp-3">
                            {job.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleJobSubmit}
                  className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Job Application
                  </h3>
                  <input type="hidden" name="job_id" value={selectedJobId || ''} />
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Full Name</label>
                      <input
                        name="full_name"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Email</label>
                      <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Phone</label>
                    <input
                      name="phone"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Experience / Why you are a good fit</label>
                    <textarea
                      name="motivation"
                      rows={4}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-mtaji-primary hover:bg-mtaji-primary-dark text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Job Application'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'volunteer' && (
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-bold text-mtaji-primary">
                  Volunteer for this Initiative
                </h2>
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  Use the detailed volunteer application form to share your skills and availability.
                </p>
                <button
                  type="button"
                  onClick={() => setShowVolunteerForm(true)}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
                >
                  Open Volunteer Application
                </button>
              </div>
            )}

            {activeTab === 'ambassador' && (
              <form
                ref={ambassadorFormRef}
                onSubmit={handleAmbassadorSubmit}
                className="space-y-3"
              >
                <h2 className="text-xl font-heading font-bold text-mtaji-primary">
                  Project Ambassador Application
                </h2>
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  Help champion this initiative in your community, networks, and online.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Full Name</label>
                    <input
                      name="full_name"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Social / Community Reach (links or description)</label>
                  <textarea
                    name="reach"
                    rows={3}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Why would you like to be an ambassador for this initiative?</label>
                  <textarea
                    name="motivation"
                    rows={4}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-mtaji-primary hover:bg-mtaji-primary-dark text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ambassador Application'}
                </button>
              </form>
            )}

            {activeTab === 'proposal' && (
              <form
                onSubmit={handleProposalSubmit}
                className="space-y-3"
              >
                <h2 className="text-xl font-heading font-bold text-mtaji-primary">
                  Send a Project Proposal
                </h2>
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  Share a proposal or partnership idea with the initiative owner.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Your Name / Organization</label>
                    <input
                      name="name"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Proposal Subject</label>
                  <input
                    name="subject"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Proposal Details</label>
                  <textarea
                    name="details"
                    rows={5}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Links / Attachments (URLs)</label>
                  <textarea
                    name="links"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    placeholder="e.g., Google Drive link, website, portfolio"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-mtaji-primary hover:bg-mtaji-primary-dark text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Proposal'}
                </button>
              </form>
            )}

            {activeTab === 'content' && (
              <form
                ref={contentFormRef}
                onSubmit={handleContentCreatorSubmit}
                className="space-y-3"
              >
                <h2 className="text-xl font-heading font-bold text-mtaji-primary">
                  Content Creator Application
                </h2>
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  Apply to create photos, videos, articles or social content for this initiative.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Full Name</label>
                    <input
                      name="full_name"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Content Type (photo, video, writing, social, etc.)</label>
                  <input
                    name="content_type"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">Portfolio / Samples (links)</label>
                  <textarea
                    name="portfolio"
                    rows={3}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    placeholder="Paste links to your work (Instagram, YouTube, website, etc.)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-500 mb-1">How would you like to tell the story of this initiative?</label>
                  <textarea
                    name="motivation"
                    rows={4}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-mtaji-primary hover:bg-mtaji-primary-dark text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showVolunteerForm && (
        <VolunteerForm
          initiativeId={initiative.id}
          initiativeTitle={initiative.title}
          isOpen={showVolunteerForm}
          onClose={() => setShowVolunteerForm(false)}
          onSuccess={() => {
            console.log('Volunteer application submitted successfully from Opportunities page')
          }}
        />
      )}
    </div>
  )
}

