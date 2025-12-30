// Server entry point for background jobs and API routes
// This can be run as a separate Node.js process or integrated into your main server

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import { satelliteMonitoringJob } from './jobs/satelliteMonitoring';
import satelliteRoutes from './routes/satellite';
import politicalRoutes from './routes/political';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../');

// Load .env from project root
dotenv.config({ path: join(projectRoot, '.env') });
// Also try server/.env as fallback
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'mtaji-tracker-backend'
  });
});

// API routes
app.use('/api/satellite', satelliteRoutes);
app.use('/api/political', politicalRoutes);

// Manual trigger endpoint for testing
app.post('/api/jobs/satellite-monitoring/run', async (req, res) => {
  try {
    console.log('🔧 Manual trigger received for satellite monitoring job');
    await satelliteMonitoringJob.runNow();
    res.json({ 
      success: true, 
      message: 'Satellite monitoring job completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error running satellite monitoring job:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check for required environment variables and warn if missing
const requiredEnvVars = [
  { key: 'OPENAI_API_KEY', name: 'OpenAI API Key', required: false, feature: 'manifesto analysis' }
];

const missingVars = requiredEnvVars.filter(env => {
  if (env.required) {
    return !process.env[env.key];
  }
  return false;
});

const optionalMissingVars = requiredEnvVars.filter(env => {
  if (!env.required) {
    return !process.env[env.key];
  }
  return false;
});

if (optionalMissingVars.length > 0) {
  console.log('\n⚠️  Optional environment variables not set (some features may not work):');
  optionalMissingVars.forEach(env => {
    console.log(`   - ${env.key} (for ${env.feature})`);
  });
  console.log('');
} else {
  // Verify optional vars are set
  requiredEnvVars.filter(env => !env.required).forEach(env => {
    if (process.env[env.key]) {
      console.log(`✅ ${env.key} is configured (${env.feature} enabled)`);
    }
  });
}

// Start server
// For ES modules, we always start the server when this file is executed
// This works with tsx and other ESM runners
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Manual trigger: POST http://localhost:${PORT}/api/jobs/satellite-monitoring/run`);
  
  if (optionalMissingVars.length > 0) {
    console.log(`\n💡 Tip: Add missing environment variables to your .env file to enable all features.`);
  }
  
  // Start background jobs (don't crash server if this fails)
  try {
    satelliteMonitoringJob.start();
    console.log('✅ Background jobs started');
  } catch (error: any) {
    console.error('⚠️ Failed to start background jobs:', error.message);
    console.log('Server will continue running without background jobs');
  }
});

export default app;

