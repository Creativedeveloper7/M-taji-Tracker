# Server Setup

This directory contains the backend server for the Mtaji Tracker application.

## Satellite Service

The satellite service provides satellite imagery capabilities for initiatives. Currently, it uses a mock service while Google Earth Engine credentials are being set up.

### Environment Variables

Add these to your `.env` file:

```env
# Satellite Service Configuration
# Set to 'false' to use real Google Earth Engine (when credentials are ready)
USE_MOCK_SATELLITE=true

# Mapbox Access Token (for mock satellite service)
# Get from https://account.mapbox.com/access-tokens/
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### Switching Between Mock and Real Service

The service automatically switches based on the `USE_MOCK_SATELLITE` environment variable:

- `USE_MOCK_SATELLITE=true` (default) - Uses mock service with Mapbox imagery
- `USE_MOCK_SATELLITE=false` - Uses real Google Earth Engine service

### API Endpoints

Once the server is set up, the satellite service will be available at:

- `POST /api/satellite/snapshot` - Capture a satellite snapshot
- `POST /api/satellite/historical` - Get historical snapshots
- `GET /api/satellite/status` - Check service status

### Google Earth Engine Setup

1. Place your GEE credentials in `server/config/gee-credentials.json`
2. Set `USE_MOCK_SATELLITE=false` in your `.env` file
3. The real service will be used automatically


