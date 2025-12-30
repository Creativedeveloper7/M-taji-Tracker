# Background Jobs - Satellite Monitoring

This directory contains background jobs that run automatically to maintain and monitor initiatives.

## Satellite Monitoring Job

Automatically captures monthly satellite snapshots for all active initiatives and detects progress/stall conditions.

### Features

- ✅ Runs automatically on the 1st of every month at 2:00 AM
- ✅ Captures satellite snapshots for all active/published initiatives
- ✅ Detects changes and progress
- ✅ Sends stall warnings for initiatives with no progress
- ✅ Rate limiting to avoid API throttling
- ✅ Error handling and logging

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `server/` directory (or root):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   USE_MOCK_SATELLITE=true
   MAPBOX_ACCESS_TOKEN=your-mapbox-token
   PORT=3001
   ```

3. **Get your Supabase Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the **service_role** key (not the anon key!)
   - ⚠️ **Never expose this key in client-side code!**

### Running the Job

#### Option 1: As a Background Service (Recommended)

Start the server which includes the job scheduler:

```bash
npm run server
```

The job will run automatically on schedule.

#### Option 2: Manual Trigger

Run the job immediately for testing:

```bash
npm run job:satellite
```

Or trigger via API:

```bash
curl -X POST http://localhost:3001/api/jobs/satellite-monitoring/run
```

#### Option 3: Development Mode

Watch for changes and auto-restart:

```bash
npm run server:dev
```

### Schedule Configuration

The job runs on the 1st of every month at 2:00 AM by default.

To change the schedule, edit `server/jobs/satelliteMonitoring.ts`:

```typescript
// Current schedule
schedule = '0 2 1 * *'; // 1st of month at 2 AM

// Examples:
// schedule = '0 2 * * *';      // Every day at 2 AM
// schedule = '0 2 * * 1';      // Every Monday at 2 AM
// schedule = '0 */6 * * *';    // Every 6 hours
// schedule = '* * * * *';      // Every minute (for testing)
```

Cron format: `minute hour day month day-of-week`

### How It Works

1. **Fetches Active Initiatives:**
   - Gets all initiatives with status `'active'` or `'published'`
   - Validates each has valid coordinates

2. **Captures Snapshots:**
   - Uses satellite service (mock or real) to capture imagery
   - Stores snapshot with metadata

3. **Detects Changes:**
   - Compares with previous snapshot
   - Calculates time since last snapshot
   - Determines if progress or stall

4. **Updates Database:**
   - Adds new snapshot to `satellite_snapshots` array
   - Updates AI analysis status

5. **Sends Notifications:**
   - Sends stall warnings if no progress for 60+ days
   - (Notification implementation needed)

### Change Detection

Currently uses simple time-based detection:
- **< 20 days** since last snapshot → "stalled"
- **> 20 days** since last snapshot → "progress"
- **> 60 days** → sends stall warning

For production, implement image comparison:
- Use image processing libraries (Sharp, Jimp)
- Compare pixel differences
- Use ML models for change detection
- Integrate with Google Earth Engine change detection

### Error Handling

- Individual initiative failures don't stop the job
- Errors are logged with initiative details
- Job continues processing remaining initiatives
- Final report shows success/error counts

### Rate Limiting

- 2 second delay between initiatives
- Prevents API throttling
- Configurable in the code

### Monitoring

Check job status:
- Server logs show start/completion
- Success/error counts reported
- Duration tracked

### Production Deployment

For production, consider:

1. **Process Manager:**
   - Use PM2: `pm2 start server/index.ts --name satellite-monitor`
   - Or Docker with health checks

2. **Logging:**
   - Send logs to external service (Datadog, LogRocket)
   - Set up alerts for job failures

3. **Monitoring:**
   - Add health check endpoint
   - Track job execution metrics
   - Set up alerts for missed runs

4. **Scalability:**
   - Queue system for large numbers of initiatives
   - Parallel processing with worker pools
   - Database connection pooling

### Troubleshooting

**Job not running:**
- Check server is running: `npm run server`
- Verify cron schedule is correct
- Check server logs for errors

**Snapshots not saving:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check database permissions
- Verify `satellite_snapshots` column exists

**API rate limiting:**
- Increase delay between requests
- Use batch processing
- Check API quotas

### Next Steps

- [ ] Implement image comparison for change detection
- [ ] Add email/SMS notifications
- [ ] Create notification preferences table
- [ ] Add job execution history tracking
- [ ] Implement retry logic for failed snapshots
- [ ] Add webhook support for external integrations

