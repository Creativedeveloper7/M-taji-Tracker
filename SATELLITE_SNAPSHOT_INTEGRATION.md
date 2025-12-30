# Satellite Snapshot Integration

## Overview

The application now automatically captures satellite snapshots when an initiative is published. This provides a baseline image for tracking project progress over time.

## How It Works

### Automatic Capture

When an initiative is created with status `'published'`:

1. **Form Submission**: The initiative form automatically triggers satellite snapshot capture
2. **Snapshot Service**: Uses the client-side `satelliteService` to capture imagery
3. **Metadata**: Each snapshot includes:
   - Date and image URL
   - Cloud coverage percentage
   - Geographic bounds
   - Capture timestamp
   - AI analysis status (baseline for initial snapshots)

### Implementation Details

#### 1. Type Definition

The `Initiative` interface now includes:

```typescript
satellite_snapshots?: Array<{
  date: string;
  imageUrl: string;
  cloudCoverage: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  captured_at: string;
  ai_analysis?: {
    status: 'baseline' | 'progress' | 'stalled' | 'completed';
    changePercentage?: number;
    notes: string;
  };
}>;
```

#### 2. Form Integration

In `src/components/InitiativeForm.tsx`:

- Automatically captures snapshot when status is `'published'`
- Uses coordinates from the initiative location
- Default radius: 500 meters
- Non-blocking: Form submission continues even if snapshot fails

#### 3. Database Schema

The `initiatives` table includes:

```sql
satellite_snapshots JSONB DEFAULT '[]'::jsonb
```

## Database Migration

If you need to add the column to an existing database:

1. Run `supabase_migration_add_satellite_snapshots.sql` in your Supabase SQL editor
2. Or manually add the column:
   ```sql
   ALTER TABLE initiatives 
   ADD COLUMN satellite_snapshots JSONB DEFAULT '[]'::jsonb;
   ```

## Usage

### Creating an Initiative

When you create and publish an initiative:

1. Fill out the form normally
2. Set a location on the map (required)
3. Submit the form
4. The system automatically:
   - Captures a satellite snapshot
   - Saves it with the initiative
   - Logs the process in the console

### Viewing Snapshots

Snapshots are stored in the `satellite_snapshots` array on each initiative. You can:

- Access via `initiative.satellite_snapshots`
- Display in the Satellite Monitor component
- Use for progress tracking and comparison

### Example Snapshot Structure

```json
{
  "date": "2024-01-15",
  "imageUrl": "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/...",
  "cloudCoverage": 5.2,
  "bounds": {
    "north": -0.0191,
    "south": -0.0281,
    "east": 37.9112,
    "west": 37.9012
  },
  "captured_at": "2024-01-15T10:30:00.000Z",
  "ai_analysis": {
    "status": "baseline",
    "notes": "Initial project state captured"
  }
}
```

## Error Handling

- If snapshot capture fails, the initiative is still created
- Errors are logged to the console
- The `satellite_snapshots` array will be empty if capture fails
- Users are not blocked from submitting the form

## Future Enhancements

- Scheduled snapshots (monthly/quarterly)
- AI-powered change detection
- Automatic progress analysis
- Comparison views between snapshots

## Testing

To test the integration:

1. Create a new initiative
2. Set a location on the map
3. Submit the form
4. Check the console for:
   - "📸 Capturing initial satellite snapshot..."
   - "✅ Satellite snapshot captured successfully"
5. Verify the snapshot in the database or via the Satellite Monitor component

