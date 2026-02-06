import cron from 'node-cron';
import { db } from '../lib/database';
import { SatelliteSnapshot } from '../services/types';
import { captureGEESnapshot } from '../services/googleEarthEngineService';

const USE_GEE = process.env.USE_GEE === 'true';

class SatelliteMonitoringJob {
  schedule = '0 2 1 * *';

  async run() {
    if (!USE_GEE) {
      console.log('🛰️ Satellite job skipped (USE_GEE not true). Satellite features use only Google Earth Engine.');
      return;
    }

    console.log('🛰️ Monthly satellite monitoring started (Google Earth Engine)');

    const initiatives = await db.getActiveInitiatives();
    const radiusMeters = 300;

    for (const initiative of initiatives) {
      try {
        const coords = initiative.location?.coordinates;
        if (!coords) continue;

        const { lat, lng } = coords;

        const snapshot: SatelliteSnapshot = await captureGEESnapshot(lat, lng, radiusMeters);

        const existing = initiative.satellite_snapshots || [];
        const updated = [
          ...existing,
          {
            ...snapshot,
            captured_at: new Date().toISOString(),
            ai_analysis: {
              status: 'progress',
              notes: 'Automated monthly capture',
            },
          },
        ];

        await db.updateInitiativeSnapshots(initiative.id, updated);
        console.log(`✅ Updated ${initiative.title}`);
      } catch (e: any) {
        console.error(`❌ ${initiative.title}:`, e.message);
      }
    }

    console.log('✅ Satellite monitoring complete');
  }

  start() {
    cron.schedule(this.schedule, () => this.run());
    console.log(`⏰ Satellite job scheduled (${this.schedule})`);
  }
}

export const satelliteMonitoringJob = new SatelliteMonitoringJob();
