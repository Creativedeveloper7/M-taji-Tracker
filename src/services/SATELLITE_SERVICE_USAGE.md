# Satellite Service Usage Guide

The satellite service is now available for use directly in your React components.

## Setup

Add to your `.env` file:

```env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

Get your Mapbox token from: https://account.mapbox.com/access-tokens/

## Usage Examples

### Option 1: Using the Hook (Recommended)

```typescript
import { useSatelliteSnapshot } from '../hooks/useSatelliteSnapshot'

function MyComponent() {
  const { snapshot, loading, error } = useSatelliteSnapshot({
    lat: -1.2921,
    lng: 36.8219,
    radiusMeters: 500,
    enabled: true
  })

  if (loading) return <div>Loading satellite image...</div>
  if (error) return <div>Error: {error}</div>
  if (!snapshot) return null

  return (
    <div>
      <img src={snapshot.imageUrl} alt="Satellite view" />
      <p>Cloud Coverage: {snapshot.cloudCoverage.toFixed(1)}%</p>
      <p>Date: {snapshot.date}</p>
    </div>
  )
}
```

### Option 2: Direct Service Call

```typescript
import { satelliteService } from '../services/satelliteService'

// In your component or function
const fetchSnapshot = async () => {
  try {
    const snapshot = await satelliteService.captureSnapshot(
      -1.2921,  // lat
      36.8219,  // lng
      500,      // radius in meters
      '2024-01-15' // optional date
    )
    console.log('Snapshot:', snapshot)
    // Use snapshot.imageUrl to display the image
  } catch (error) {
    console.error('Error:', error)
  }
}

// Get historical snapshots
const fetchHistorical = async () => {
  const snapshots = await satelliteService.getHistoricalSnapshots(
    -1.2921,
    36.8219,
    500,
    '2024-01-01',
    '2024-12-31',
    30 // interval in days
  )
  console.log('Historical snapshots:', snapshots)
}
```

## Integration with Initiative Modal

You can add satellite imagery to the InitiativeModal:

```typescript
import { useSatelliteSnapshot } from '../hooks/useSatelliteSnapshot'

// Inside InitiativeModal component
const { snapshot, loading } = useSatelliteSnapshot({
  lat: initiative.location.coordinates.lat,
  lng: initiative.location.coordinates.lng,
  radiusMeters: 1000,
  enabled: true
})

// Then display in the modal
{snapshot && (
  <div className="mb-4">
    <h4 className="text-sm font-semibold mb-2">Satellite View</h4>
    <img 
      src={snapshot.imageUrl} 
      alt="Satellite imagery"
      className="w-full rounded-lg"
    />
    <p className="text-xs text-gray-500 mt-1">
      Cloud Coverage: {snapshot.cloudCoverage.toFixed(1)}%
    </p>
  </div>
)}
```

## API Reference

### `satelliteService.captureSnapshot(lat, lng, radiusMeters?, date?)`

Captures a single satellite snapshot.

**Parameters:**
- `lat` (number): Latitude
- `lng` (number): Longitude  
- `radiusMeters` (number, optional): Radius in meters (default: 500)
- `date` (string, optional): ISO date string (default: today)

**Returns:** `Promise<SatelliteSnapshot>`

### `satelliteService.getHistoricalSnapshots(lat, lng, radiusMeters?, startDate, endDate, intervalDays?)`

Gets multiple historical snapshots.

**Parameters:**
- `lat` (number): Latitude
- `lng` (number): Longitude
- `radiusMeters` (number, optional): Radius in meters (default: 500)
- `startDate` (string): ISO date string
- `endDate` (string): ISO date string
- `intervalDays` (number, optional): Days between snapshots (default: 30)

**Returns:** `Promise<SatelliteSnapshot[]>`

## Notes

- The service uses Mapbox satellite imagery as a placeholder
- Images are 512x512 pixels at 2x resolution
- Cloud coverage is simulated (random 0-15%)
- Bounds are calculated based on the radius provided


