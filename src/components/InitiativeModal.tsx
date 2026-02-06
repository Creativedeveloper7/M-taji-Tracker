import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Initiative } from '../types'
import { SatelliteMonitor } from './SatelliteMonitor'
import VolunteerForm from './VolunteerForm'

interface InitiativeModalProps {
  initiative: Initiative
  onClose: () => void
}

// Helper function to format description into well-spaced paragraphs
const formatDescription = (description: string): string[] => {
  if (!description) return []
  
  // Split by double newlines first (explicit paragraph breaks)
  let paragraphs = description.split(/\n\n+/)
  
  // If no double newlines, try to intelligently split by sentence patterns
  if (paragraphs.length === 1) {
    const text = paragraphs[0]
    
    // Look for common section patterns (intro, problem, solution, impact, sustainability)
    const sectionPatterns = [
      /(?:^|\n)(?:introduction|overview|background|context)/i,
      /(?:^|\n)(?:problem|challenge|issue|need)/i,
      /(?:^|\n)(?:solution|approach|method|strategy|plan)/i,
      /(?:^|\n)(?:impact|outcome|result|benefit)/i,
      /(?:^|\n)(?:sustainability|long.?term|future|maintenance)/i,
    ]
    
    // Try to split at section boundaries
    let splitPoints: number[] = []
    sectionPatterns.forEach(pattern => {
      const match = text.match(pattern)
      if (match && match.index !== undefined) {
        splitPoints.push(match.index)
      }
    })
    
    if (splitPoints.length > 0) {
      splitPoints.sort((a, b) => a - b)
      paragraphs = []
      let lastIndex = 0
      splitPoints.forEach(point => {
        if (point > lastIndex) {
          paragraphs.push(text.substring(lastIndex, point).trim())
          lastIndex = point
        }
      })
      if (lastIndex < text.length) {
        paragraphs.push(text.substring(lastIndex).trim())
      }
    } else {
      // Fallback: split by single newlines or long sentences
      paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
      
      // If still one paragraph and it's very long, try to split by sentence
      if (paragraphs.length === 1 && paragraphs[0].length > 300) {
        const sentences = paragraphs[0].split(/(?<=[.!?])\s+/)
        // Group sentences into logical paragraphs (3-4 sentences each)
        const grouped: string[] = []
        let currentGroup: string[] = []
        sentences.forEach((sentence, index) => {
          currentGroup.push(sentence)
          if (currentGroup.length >= 3 || index === sentences.length - 1) {
            grouped.push(currentGroup.join(' '))
            currentGroup = []
          }
        })
        paragraphs = grouped.filter(p => p.trim().length > 0)
      }
    }
  }
  
  // Clean up and filter empty paragraphs
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

const InitiativeModal = ({ initiative, onClose }: InitiativeModalProps) => {
  const navigate = useNavigate()
  const [showSatelliteMonitor, setShowSatelliteMonitor] = useState(false)
  const [showVolunteerForm, setShowVolunteerForm] = useState(false)
  
  const progressPercentage = initiative.target_amount > 0 
    ? (initiative.raised_amount / initiative.target_amount) * 100 
    : 0
  const categoryColors: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    published: 'bg-blue-500',
    active: 'bg-mtaji-accent',
    completed: 'bg-amber-500',
    stalled: 'bg-gray-400',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format description into paragraphs
  const descriptionParagraphs = initiative.description 
    ? formatDescription(initiative.description)
    : []

  return (
    <div className="fixed inset-0 bg-overlay bg-opacity-80 flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div 
        className="bg-secondary border border-subtle rounded-lg max-w-2xl w-full p-6 md:p-8 transform transition-all duration-300 hover:-translate-y-1 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: 'thin',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColors[initiative.category] }}
              />
              <span className="text-sm font-medium text-secondary uppercase">{initiative.category}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[initiative.status]}`}>
                {initiative.status}
              </span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-accent-primary mb-2">{initiative.title}</h2>
            <p className="text-secondary text-sm">📍 {initiative.location.county} County</p>
            {initiative.location.constituency && (
              <p className="text-muted text-xs">{initiative.location.constituency}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors duration-300 ml-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {descriptionParagraphs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary mb-3" style={{ fontSize: '16px' }}>Description</h3>
            <div className="initiative-description">
              {descriptionParagraphs.map((paragraph, index) => (
                <p 
                  key={index}
                  className="text-secondary"
                  style={{
                    marginBottom: index < descriptionParagraphs.length - 1 ? '1rem' : '0',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-secondary">Progress</span>
            <span className="font-semibold text-accent-primary">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-overlay rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-overlay rounded-lg p-3">
            <p className="text-xs text-muted mb-1">Raised</p>
            <p className="text-lg font-heading font-bold text-accent-primary">{formatCurrency(initiative.raised_amount)}</p>
          </div>
          <div className="bg-overlay rounded-lg p-3">
            <p className="text-xs text-muted mb-1">Target</p>
            <p className="text-lg font-heading font-bold text-primary">{formatCurrency(initiative.target_amount)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowSatelliteMonitor(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Satellite Data
          </button>
          <button
            onClick={() => setShowVolunteerForm(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Volunteer
          </button>
          <button
            className="btn-secondary w-full"
            onClick={() => {
              onClose()
              navigate(`/initiatives/${initiative.id}`)
            }}
          >
            View Details
          </button>
        </div>

        {showSatelliteMonitor && (
          <SatelliteMonitor
            initiativeId={initiative.id}
            location={initiative.location.coordinates}
            startDate={initiative.created_at}
            isOpen={showSatelliteMonitor}
            onClose={() => setShowSatelliteMonitor(false)}
          />
        )}

        {showVolunteerForm && (
          <VolunteerForm
            initiativeId={initiative.id}
            initiativeTitle={initiative.title}
            isOpen={showVolunteerForm}
            onClose={() => setShowVolunteerForm(false)}
            onSuccess={() => {
              console.log('Volunteer application submitted successfully');
            }}
          />
        )}
      </div>
    </div>
  )
}

export default InitiativeModal

