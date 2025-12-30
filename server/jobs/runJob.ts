// Standalone script to run the satellite monitoring job
// Usage: npm run job:satellite
// or: tsx server/jobs/runJob.ts

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');

// Load .env from project root
dotenv.config({ path: join(projectRoot, '.env') });
// Also try server/.env as fallback
dotenv.config({ path: join(__dirname, '../.env') });

import { satelliteMonitoringJob } from './satelliteMonitoring';

async function main() {
  console.log('🚀 Starting satellite monitoring job...\n');
  
  try {
    await satelliteMonitoringJob.runNow();
    console.log('\n✅ Job completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Job failed:', error.message);
    process.exit(1);
  }
}

main();

