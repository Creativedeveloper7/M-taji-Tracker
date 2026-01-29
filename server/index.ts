// Server entry point for background jobs and API routes
// This can be run as a separate Node.js process or integrated into your main server

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
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
// CORS configuration for production and development
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

// Build allowed origins list
const allowedOrigins: string[] = [];

if (isProduction) {
  // Production: Only allow the specified FRONTEND_URL
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
    // Also allow without trailing slash
    if (frontendUrl.endsWith('/')) {
      allowedOrigins.push(frontendUrl.slice(0, -1));
    } else {
      allowedOrigins.push(`${frontendUrl}/`);
    }
  }
} else {
  // Development: Allow localhost on various ports
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
  );
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(url => origin === url || origin.startsWith(url))) {
      callback(null, true);
    } else if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      // Development: Allow any localhost origin
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS. Allowed origins: ${allowedOrigins.join(', ')}`));
    }
  },
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

// Serve the built Vite app (React SPA) when dist exists (e.g. on Render after "npm run build")
const distPath = join(projectRoot, 'dist');
const distIndexPath = join(distPath, 'index.html');
const hasDist = fs.existsSync(distIndexPath);

if (hasDist) {
  app.use(express.static(distPath, { index: false }));
  // Root: always serve the app so we never return "Cannot GET /"
  app.get('/', (_req, res) => {
    res.sendFile(distIndexPath, (err) => {
      if (err) res.status(500).send('Error loading app.');
    });
  });
  // SPA fallback: serve index.html for any other non-API GET so client-side routing works
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(distIndexPath, (err) => {
      if (err) res.status(404).send('Not found.');
    });
  });
} else {
  // No dist (e.g. local dev): just respond so we never return "Cannot GET /"
  app.get('/', (_req, res) => {
    res.send('Backend running. To serve the app here, run: npm run build then restart the server.');
  });
}

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

