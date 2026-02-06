import { Router } from 'express';
import { db } from '../lib/database';
import {
  captureGEESnapshot,
  getGEEHistoricalSnapshots,
  checkGEEStatus,
} from '../services/googleEarthEngineService';
import { SatelliteSnapshot } from '../services/types';

const router = Router();

// Satellite features use only Google Earth Engine
const USE_GEE = process.env.USE_GEE === 'true';

const requireGEE = (_req: any, res: any, next: any) => {
  if (!USE_GEE) {
    return res.status(503).json({
      error: 'Satellite service requires Google Earth Engine. Set USE_GEE=true and configure GEE_PROJECT_ID and GEE_SERVICE_ACCOUNT_KEY.',
    });
  }
  next();
};

console.log('🛰️ Satellite service: Google Earth Engine only');
if (USE_GEE) {
  console.log('   ✅ Google Earth Engine enabled');
} else {
  console.log('   ⚠️ GEE disabled (USE_GEE not true). Satellite endpoints will return 503 until configured.');
}

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
router.post('/snapshot', requireGEE, async (req, res) => {
  try {
    const { lat, lng, radiusMeters = 500, date } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates. lat and lng must be numbers.',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: 'Coordinates out of range. lat must be -90 to 90, lng must be -180 to 180.',
      });
    }

    if (radiusMeters && (radiusMeters < 10 || radiusMeters > 10000)) {
      return res.status(400).json({
        error: 'Radius must be between 10 and 10000 meters.',
      });
    }

    const snapshot = await captureGEESnapshot(lat, lng, radiusMeters, date);

    res.json({
      success: true,
      data: snapshot,
      service: 'google-earth-engine',
    });
  } catch (error: any) {
    console.error('Error capturing satellite snapshot:', error);
    res.status(500).json({
      error: 'Failed to capture satellite snapshot',
      message: error.message,
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
router.post('/historical', requireGEE, async (req, res) => {
  try {
    const { lat, lng, radiusMeters = 500, startDate, endDate, intervalDays = 30 } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates. lat and lng must be numbers.',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use ISO date strings.',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'startDate must be before endDate.',
      });
    }

    const snapshots = await getGEEHistoricalSnapshots(
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
      service: 'google-earth-engine',
    });
  } catch (error: any) {
    console.error('Error fetching historical snapshots:', error);
    res.status(500).json({
      error: 'Failed to fetch historical snapshots',
      message: error.message,
    });
  }
});

/**
 * GET /api/satellite/status
 * Get the status of the satellite service
 */
router.get('/status', async (req, res) => {
  let geeStatus: { configured: boolean; authenticated: boolean; error?: string } = { 
    configured: false, 
    authenticated: false 
  };
  
  if (USE_GEE) {
    geeStatus = await checkGEEStatus();
  }
  
  res.json({
    service: 'google-earth-engine',
    status: USE_GEE ? 'operational' : 'disabled',
    gee: {
      enabled: USE_GEE,
      ...geeStatus,
    },
  });
});

/**
 * POST /api/satellite/backfill-initiative
 *
 * Populate / refresh satellite_snapshots for a single initiative using Google Earth Engine.
 *
 * Body:
 * {
 *   initiativeId: string;            // required
 *   startDate?: string;              // optional ISO date, default: N months ago
 *   endDate?: string;                // optional ISO date, default: today
 *   intervalDays?: number;           // optional, default: 15
 *   forceRefresh?: boolean;          // optional, clear existing and re-fetch
 * }
 */
router.post('/backfill-initiative', requireGEE, async (req, res) => {
  try {
    console.log('📥 Received backfill request:', req.body);
    const { initiativeId, startDate, endDate, intervalDays = 15, forceRefresh = false } = req.body as {
      initiativeId?: string;
      startDate?: string;
      endDate?: string;
      intervalDays?: number;
      forceRefresh?: boolean; // If true, clears existing snapshots and re-fetches all
    };

    if (!initiativeId) {
      console.error('❌ Backfill request missing initiativeId');
      return res.status(400).json({ error: 'initiativeId is required' });
    }

    console.log(`🛰️ Starting satellite backfill for initiative ${initiativeId}...`);

    // Load initiative from DB - check both active initiatives and directly by ID
    // (newly created initiatives might not be in "active" status yet)
    let initiative = await db.getActiveInitiatives()
      .then(all => all.find(i => i.id === initiativeId));
    
    // If not found in active initiatives, try fetching directly by ID
    if (!initiative) {
      console.log(`⚠️ Initiative not found in active list, fetching directly by ID...`);
      initiative = await db.getInitiativeById(initiativeId);
    }

    if (!initiative) {
      console.error(`❌ Initiative ${initiativeId} not found in database`);
      return res.status(404).json({ error: `Initiative ${initiativeId} not found` });
    }
    
    console.log(`✅ Found initiative: ${initiative.title} (status: ${initiative.status})`);

    const location = initiative.location;
    if (!location || !location.coordinates) {
      return res.status(400).json({ error: 'Initiative has no location coordinates' });
    }

    const { lat, lng } = location.coordinates;
    if (
      typeof lat !== 'number' || typeof lng !== 'number' ||
      isNaN(lat) || isNaN(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      return res.status(400).json({ error: 'Initiative has invalid coordinates' });
    }

    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    // Default: go back 6 months (180 days) to ensure we have historical data
    const defaultDaysBack = 180;
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - defaultDaysBack * 24 * 60 * 60 * 1000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid startDate or endDate' });
    }
    if (start > end) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const existing: SatelliteSnapshot[] = initiative.satellite_snapshots || [];
    
    // If forceRefresh is true, start with empty array to re-fetch all snapshots
    const snapshots: SatelliteSnapshot[] = forceRefresh ? [] : [...existing];
    
    if (forceRefresh) {
      console.log(`🔄 Force refresh enabled - clearing ${existing.length} existing snapshots`);
    }
    console.log(`📊 ${forceRefresh ? 'Re-fetching' : `Found ${existing.length} existing snapshots. Generating`} historical data from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}...`);

    let created = 0;
    let skipped = 0;
    let errors = 0;
    const cursor = new Date(start);
    const radiusMeters = 300;

    console.log('🔧 Using Google Earth Engine for backfill');

    while (cursor <= end) {
      const dateStr = cursor.toISOString().split('T')[0];

      const already = snapshots.some(s => s.date === dateStr);
      if (already && !forceRefresh) {
        skipped++;
        cursor.setDate(cursor.getDate() + Number(intervalDays || 15));
        continue;
      }

      try {
        console.log(`📸 Fetching GEE snapshot for ${dateStr}...`);
        const snap = await captureGEESnapshot(lat, lng, radiusMeters, dateStr);
        snapshots.push(snap);
        console.log(`✅ Fetched GEE snapshot for ${dateStr}`);
        created++;
      } catch (err: any) {
        errors++;
        console.error(`❌ Error fetching snapshot for ${dateStr}:`, err.message || err);
      }

      cursor.setDate(cursor.getDate() + Number(intervalDays || 15));
    }
    
    console.log(`📈 Backfill summary: ${created} created, ${skipped} skipped (already exist), ${errors} errors`);

    // Persist updated snapshots
    console.log(`💾 Saving ${snapshots.length} snapshots to database for initiative ${initiativeId}...`);
    await db.updateInitiativeSnapshots(initiativeId, snapshots);
    console.log(`✅ Successfully saved ${snapshots.length} snapshots to database`);

    return res.json({
      success: true,
      initiativeId,
      totalSnapshots: snapshots.length,
      created,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  } catch (error: any) {
    console.error('Error in backfill-initiative:', error);
    return res.status(500).json({
      error: 'Failed to backfill satellite snapshots for initiative',
      message: error.message,
    });
  }
});

export default router;


