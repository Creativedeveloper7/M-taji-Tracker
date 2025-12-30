# Setup Background Jobs - Quick Start

## Overview

The satellite monitoring job automatically captures monthly snapshots for all active initiatives.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server for API routes
- `node-cron` - Cron job scheduler
- `tsx` - TypeScript execution
- Type definitions

### 2. Set Up Environment Variables

Create a `.env` file in the project root (or `server/.env`):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Satellite Service
USE_MOCK_SATELLITE=true
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Server
PORT=3001
```

**Important:** Get your `SUPABASE_SERVICE_ROLE_KEY` from:
- Supabase Dashboard → Settings → API
- Copy the **service_role** key (not anon key!)
- ⚠️ Never expose this in client-side code!

### 3. Run the Server

Start the background job server:

```bash
npm run server
```

The job will:
- Start automatically
- Run on the 1st of every month at 2:00 AM
- Capture snapshots for all active initiatives

### 4. Test the Job

Run the job manually to test:

```bash
npm run job:satellite
```

Or trigger via API:

```bash
curl -X POST http://localhost:3001/api/jobs/satellite-monitoring/run
```

## Schedule

Default: **1st of every month at 2:00 AM**

To change, edit `server/jobs/satelliteMonitoring.ts`:

```typescript
schedule = '0 2 1 * *'; // Current: 1st of month at 2 AM
```

## What It Does

1. ✅ Fetches all active/published initiatives
2. ✅ Captures satellite snapshot for each
3. ✅ Detects progress/stall conditions
4. ✅ Updates database with new snapshots
5. ✅ Sends warnings for stalled initiatives

## Production Deployment

### Option 1: Separate Process

Run as a separate Node.js process:

```bash
pm2 start server/index.ts --name satellite-monitor
```

### Option 2: Docker

```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "server"]
```

### Option 3: Serverless (Supabase Edge Functions)

Convert to Supabase Edge Function for serverless execution.

## Troubleshooting

**"Supabase admin client not initialized"**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify the key is correct (service_role, not anon)

**"No active initiatives found"**
- Normal if no initiatives exist
- Check initiative status is 'active' or 'published'

**Job not running**
- Verify server is running: `npm run server`
- Check cron schedule is correct
- Review server logs

## Next Steps

- [ ] Set up email notifications for stall warnings
- [ ] Implement image comparison for better change detection
- [ ] Add job execution history tracking
- [ ] Set up monitoring and alerts

For more details, see `server/README_JOBS.md`

