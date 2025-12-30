# Server Setup Guide

## Prerequisites

If you plan to use the Express server routes, you'll need to install Express:

```bash
npm install express
npm install --save-dev @types/express
```

## Environment Variables

Add these to your `.env` file:

```env
# Satellite Service Configuration
USE_MOCK_SATELLITE=true
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

## Current Status

The satellite service files are created but the Express server is not yet set up. You have two options:

### Option 1: Use as Frontend Service (Current)

You can import and use the mock service directly in your React components:

```typescript
import { mockSatelliteService } from '../server/services/mockSatelliteService';

// In your component
const snapshot = await mockSatelliteService.captureSnapshot(lat, lng, 500);
```

### Option 2: Set Up Express Server (Future)

When ready to set up the backend:

1. Install Express: `npm install express @types/express`
2. Create `server/index.ts` with Express setup
3. Import and use the routes from `server/routes/satellite.ts`

## Files Created

- `server/services/mockSatelliteService.ts` - Mock satellite service using Mapbox
- `server/services/satelliteService.ts` - Placeholder for real GEE service
- `server/services/types.ts` - Shared TypeScript types
- `server/routes/satellite.ts` - Express routes (requires Express)
- `server/config/gee-credentials.json` - GEE credentials (gitignored)


