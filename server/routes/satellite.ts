import { Router } from 'express';
import { satelliteService } from '../services/satelliteService';
import { mockSatelliteService } from '../services/mockSatelliteService';

const router = Router();

// Use mock for now, switch to real when ready
const USE_MOCK = process.env.USE_MOCK_SATELLITE !== 'false'; // Default to true
const service = USE_MOCK ? mockSatelliteService : satelliteService;

/**
 * POST /api/satellite/snapshot
 * Capture a satellite snapshot for a given location
 * 
 * Body: {
 *   lat: number,
 *   lng: number,
 *   radiusMeters?: number (default: 500),
 *   date?: string (ISO date string, optional)
 * }
 */
router.post('/snapshot', async (req, res) => {
  try {
    const { lat, lng, radiusMeters = 500, date } = req.body;

    // Validate inputs
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid coordinates. lat and lng must be numbers.' 
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        error: 'Coordinates out of range. lat must be -90 to 90, lng must be -180 to 180.' 
      });
    }

    if (radiusMeters && (radiusMeters < 10 || radiusMeters > 10000)) {
      return res.status(400).json({ 
        error: 'Radius must be between 10 and 10000 meters.' 
      });
    }

    const snapshot = await service.captureSnapshot(lat, lng, radiusMeters, date);
    
    res.json({
      success: true,
      data: snapshot,
      service: USE_MOCK ? 'mock' : 'google-earth-engine'
    });
  } catch (error: any) {
    console.error('Error capturing satellite snapshot:', error);
    res.status(500).json({ 
      error: 'Failed to capture satellite snapshot',
      message: error.message 
    });
  }
});

/**
 * POST /api/satellite/historical
 * Get historical satellite snapshots for a location
 * 
 * Body: {
 *   lat: number,
 *   lng: number,
 *   radiusMeters?: number (default: 500),
 *   startDate: string (ISO date),
 *   endDate: string (ISO date),
 *   intervalDays?: number (default: 30)
 * }
 */
router.post('/historical', async (req, res) => {
  try {
    const { lat, lng, radiusMeters = 500, startDate, endDate, intervalDays = 30 } = req.body;

    // Validate inputs
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid coordinates. lat and lng must be numbers.' 
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required.' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use ISO date strings.' 
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        error: 'startDate must be before endDate.' 
      });
    }

    const snapshots = await service.getHistoricalSnapshots(
      lat,
      lng,
      radiusMeters,
      startDate,
      endDate,
      intervalDays
    );

    res.json({
      success: true,
      data: snapshots,
      count: snapshots.length,
      service: USE_MOCK ? 'mock' : 'google-earth-engine'
    });
  } catch (error: any) {
    console.error('Error fetching historical snapshots:', error);
    res.status(500).json({ 
      error: 'Failed to fetch historical snapshots',
      message: error.message 
    });
  }
});

/**
 * GET /api/satellite/status
 * Get the status of the satellite service
 */
router.get('/status', (req, res) => {
  res.json({
    service: USE_MOCK ? 'mock' : 'google-earth-engine',
    status: 'operational',
    mockMode: USE_MOCK
  });
});

export default router;


