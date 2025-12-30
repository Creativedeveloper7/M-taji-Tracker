import cron from 'node-cron';
import { mockSatelliteService } from '../services/mockSatelliteService';
import { satelliteService } from '../services/satelliteService';
import { db } from '../lib/database';
import { SatelliteSnapshot } from '../services/types';

// Use mock service by default, switch to real when ready
const USE_MOCK = process.env.USE_MOCK_SATELLITE !== 'false';
const service = USE_MOCK ? mockSatelliteService : satelliteService;

interface SnapshotWithMetadata extends SatelliteSnapshot {
  captured_at: string;
  ai_analysis?: {
    status: 'baseline' | 'progress' | 'stalled' | 'completed';
    changePercentage?: number;
    notes: string;
  };
}

class SatelliteMonitoringJob {
  // Run every 1st of the month at 2 AM
  schedule = '0 2 1 * *';
  
  // For testing: run every minute (uncomment to test)
  // schedule = '* * * * *';

  async run() {
    console.log('🛰️ Starting monthly satellite monitoring...');
    const startTime = Date.now();

    try {
      // Get all active initiatives
      const activeInitiatives = await db.getActiveInitiatives();

      if (!activeInitiatives || activeInitiatives.length === 0) {
        console.log('ℹ️ No active initiatives found. Skipping monitoring.');
        return;
      }

      console.log(`📊 Monitoring ${activeInitiatives.length} active initiatives`);

      let successCount = 0;
      let errorCount = 0;

      for (const initiative of activeInitiatives) {
        try {
          // Validate initiative has location coordinates
          const location = initiative.location;
          if (!location || !location.coordinates) {
            console.warn(`⚠️ Initiative ${initiative.id} (${initiative.title}) has no coordinates. Skipping.`);
            continue;
          }

          const { lat, lng } = location.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number' || 
              isNaN(lat) || isNaN(lng) ||
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`⚠️ Initiative ${initiative.id} (${initiative.title}) has invalid coordinates. Skipping.`);
            continue;
          }

          // Capture new snapshot
          console.log(`📸 Capturing snapshot for: ${initiative.title}`);
          const snapshot = await service.captureSnapshot(
            lat,
            lng,
            500 // radius in meters
          );

          // Get existing snapshots
          const existingSnapshots: SnapshotWithMetadata[] = initiative.satellite_snapshots || [];

          // Get previous snapshot for comparison
          const previousSnapshot = existingSnapshots.length > 0 
            ? existingSnapshots[existingSnapshots.length - 1]
            : null;

          // Detect changes
          let aiAnalysis: SnapshotWithMetadata['ai_analysis'] = {
            status: 'progress',
            notes: 'New snapshot captured'
          };

          if (previousSnapshot) {
            // Simple change detection based on date difference
            // In production, you'd use image comparison algorithms
            const previousDate = new Date(previousSnapshot.captured_at || previousSnapshot.date);
            const daysSinceLastSnapshot = Math.floor(
              (Date.now() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastSnapshot < 20) {
              // Less than 20 days - likely no significant change
              aiAnalysis = {
                status: 'stalled',
                notes: `No significant changes detected. Last snapshot was ${daysSinceLastSnapshot} days ago.`
              };
              
              // Send notification if stalled for more than 60 days
              if (daysSinceLastSnapshot > 60) {
                await this.sendStallWarning(initiative.changemaker_id, initiative.id, initiative.title);
              }
            } else {
              // More than 20 days - assume progress
              aiAnalysis = {
                status: 'progress',
                changePercentage: Math.min(100, daysSinceLastSnapshot * 2), // Rough estimate
                notes: `Progress detected. ${daysSinceLastSnapshot} days since last snapshot.`
              };
            }
          } else {
            // First snapshot after initial
            aiAnalysis = {
              status: 'baseline',
              notes: 'Monthly monitoring snapshot captured'
            };
          }

          // Create new snapshot with metadata
          const newSnapshot: SnapshotWithMetadata = {
            ...snapshot,
            captured_at: new Date().toISOString(),
            ai_analysis: aiAnalysis
          };

          // Update initiative with new snapshot
          const updatedSnapshots = [...existingSnapshots, newSnapshot];
          
          await db.updateInitiativeSnapshots(initiative.id, updatedSnapshots);

          console.log(`✅ Updated ${initiative.title} (${updatedSnapshots.length} snapshots total)`);
          successCount++;
          
          // Rate limiting: wait 2 seconds between requests to avoid API throttling
          if (activeInitiatives.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error: any) {
          console.error(`❌ Failed to monitor ${initiative.title}:`, error.message);
          errorCount++;
          // Continue with next initiative even if one fails
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n🎉 Monthly satellite monitoring completed in ${duration}s`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📊 Total: ${activeInitiatives.length}`);

    } catch (error: any) {
      console.error('❌ Satellite monitoring job failed:', error.message);
      throw error;
    }
  }

  async sendStallWarning(changemakerId: string, initiativeId: string, initiativeTitle: string) {
    // TODO: Implement notification logic
    // Options:
    // 1. Send email via Supabase Edge Function or external service
    // 2. Create in-app notification record
    // 3. Send SMS via Twilio or similar
    // 4. Webhook to external notification service
    
    console.log(`⚠️ Sending stall warning for initiative: ${initiativeTitle} (${initiativeId})`);
    console.log(`   Changemaker ID: ${changemakerId}`);
    
    // Example: Create notification record (if you have a notifications table)
    // await db.createNotification({
    //   changemaker_id: changemakerId,
    //   initiative_id: initiativeId,
    //   type: 'stall_warning',
    //   message: `Your initiative "${initiativeTitle}" has not shown significant progress in satellite imagery for over 60 days.`
    // });
  }

  start() {
    console.log(`⏰ Satellite monitoring job scheduled: ${this.schedule}`);
    console.log(`   (Runs on the 1st of every month at 2:00 AM)`);
    
    cron.schedule(this.schedule, async () => {
      await this.run();
    });
    
    console.log('✅ Background job started successfully');
  }

  // Manual trigger for testing
  async runNow() {
    console.log('🧪 Running satellite monitoring job manually...');
    await this.run();
  }
}

export const satelliteMonitoringJob = new SatelliteMonitoringJob();

