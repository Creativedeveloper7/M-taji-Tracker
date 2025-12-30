import L from 'leaflet'
import { Initiative } from '../types'

// Category colors for markers
const categoryColors: Record<string, string> = {
  agriculture: '#52B788',
  water: '#4ECDC4',
  health: '#FF6B6B',
  education: '#4DABF7',
  infrastructure: '#FFD93D',
  economic: '#FFA94D',
}

// Category icons (simple emoji for now, can be replaced with SVG)
const categoryIcons: Record<string, string> = {
  agriculture: '🌾',
  water: '💧',
  health: '🏥',
  education: '📚',
  infrastructure: '🏗️',
  economic: '💼',
}

export interface MarkerStyle {
  outlineColor: string
  pulseAnimation: boolean
  categoryColor: string
  status: 'progress' | 'stalled' | 'completed' | 'baseline' | 'pending'
}

/**
 * Get marker style based on satellite analysis status
 */
export function getMarkerStyle(initiative: Initiative): MarkerStyle {
  const snapshots = initiative.satellite_snapshots || []
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

  let outlineColor = '#52B788' // Default: green (progress)
  let pulseAnimation = false
  let status: MarkerStyle['status'] = 'baseline'

  if (latestSnapshot?.ai_analysis) {
    switch (latestSnapshot.ai_analysis.status) {
      case 'stalled':
        outlineColor = '#FF6B6B' // Red
        status = 'stalled'
        break
      case 'completed':
        outlineColor = '#2D6A4F' // Dark green
        status = 'completed'
        break
      case 'progress':
        outlineColor = '#52B788' // Bright green
        pulseAnimation = true
        status = 'progress'
        break
      case 'baseline':
      default:
        outlineColor = '#FFD93D' // Yellow (baseline/pending)
        status = 'baseline'
    }
  } else {
    // No satellite analysis yet - use initiative status
    if (initiative.status === 'active' || initiative.status === 'published') {
      outlineColor = '#52B788'
      pulseAnimation = true
      status = 'progress'
    } else if (initiative.status === 'completed') {
      outlineColor = '#2D6A4F'
      status = 'completed'
    } else {
      outlineColor = '#FFD93D'
      status = 'pending'
    }
  }

  return {
    outlineColor,
    pulseAnimation,
    categoryColor: categoryColors[initiative.category] || categoryColors.agriculture,
    status,
  }
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors.agriculture
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  return categoryIcons[category] || '📍'
}

/**
 * Create custom marker with status-based styling
 */
export function createStatusMarker(initiative: Initiative): L.DivIcon {
  const style = getMarkerStyle(initiative)
  const categoryIcon = getCategoryIcon(initiative.category)

  // Create marker HTML with status ring and category icon
  const markerHTML = `
    <div style="position: relative; width: 40px; height: 40px;">
      <!-- Status outline ring (pulsing if progress) -->
      <div style="
        position: absolute;
        inset: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${style.outlineColor};
        opacity: 0.4;
        ${style.pulseAnimation ? 'animation: statusPulse 2s infinite;' : ''}
      "></div>
      
      <!-- Main marker -->
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${style.categoryColor};
        border: 3px solid ${style.outlineColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin: 4px;
      ">${categoryIcon}</div>
    </div>
  `

  return L.divIcon({
    html: markerHTML,
    className: 'custom-status-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

