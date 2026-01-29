# Production Deployment Guide

This guide walks you through deploying the Mtaji Tracker application to production.

## Architecture Overview

- **Frontend**: React/Vite app deployed on **Vercel**
- **Backend**: Node.js/Express server deployed on **Render** (or Railway/Fly.io)
- **Database**: Supabase (PostgreSQL)
- **External Services**: Sentinel Hub (satellite imagery), Mapbox (maps), OpenAI (AI analysis)

---

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Render Account**: Sign up at [render.com](https://render.com) (or Railway/Fly.io)
4. **Environment Variables**: Have all your API keys ready (Supabase, Sentinel Hub, Mapbox, OpenAI)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure .env is in .gitignore

Your `.gitignore` should already include `.env`. Verify it's there:

```bash
cat .gitignore | grep .env
```

### 1.2 Commit and Push Your Code

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create a New Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mtaji-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (project root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server:prod`

### 2.2 Set Environment Variables

In Render's dashboard, go to **Environment** tab and add:

```env
# Supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_URL=your_supabase_url_here

# Sentinel Hub
SENTINEL_CLIENT_ID=your_sentinel_client_id
SENTINEL_CLIENT_SECRET=your_sentinel_client_secret
USE_SENTINEL_HUB=true
USE_MOCK_SATELLITE=false

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# OpenAI (optional, for manifesto analysis)
OPENAI_API_KEY=your_openai_key

# Server Config
PORT=3001
NODE_ENV=production

# Frontend URL (we'll update this after deploying frontend)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**⚠️ Important**: Don't set `FRONTEND_URL` yet. We'll update it after deploying the frontend.

### 2.3 Deploy and Get Backend URL

1. Click **"Create Web Service"**
2. Wait for deployment to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://mtaji-backend.onrender.com`
4. Test the health endpoint: `https://mtaji-backend.onrender.com/health`
   - You should see: `{"status":"ok","timestamp":"...","service":"mtaji-tracker-backend"}`

### 2.4 Update FRONTEND_URL (After Frontend Deployment)

After deploying the frontend (Step 3), come back to Render and update:
- `FRONTEND_URL=https://your-actual-vercel-url.vercel.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create a New Project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### 3.2 Set Environment Variables

In Vercel's project settings, go to **Settings** → **Environment Variables** and add:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Backend URL (from Step 2.3)
VITE_BACKEND_URL=https://mtaji-backend.onrender.com
```

**⚠️ Important**: 
- All frontend variables must start with `VITE_` to be accessible in the browser
- Replace `https://mtaji-backend.onrender.com` with your actual Render backend URL

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `https://mtaji-tracker.vercel.app`

### 3.4 Update Backend CORS

Now go back to Render and update the `FRONTEND_URL` environment variable:
- `FRONTEND_URL=https://mtaji-tracker.vercel.app` (your actual Vercel URL)

Then **redeploy** the backend service (Render will auto-redeploy when you save env vars, or manually trigger a redeploy).

---

## Step 4: Verify Deployment

### 4.1 Test Frontend

1. Open your Vercel URL: `https://mtaji-tracker.vercel.app`
2. Try logging in
3. Create a test initiative
4. Check browser console for errors

### 4.2 Test Backend

1. Open: `https://mtaji-backend.onrender.com/health`
2. Should return: `{"status":"ok",...}`

### 4.3 Test Satellite Backfill

1. Create a new initiative on the frontend
2. Check browser console for: `🛰️ Triggering satellite backfill...`
3. Check Render logs (in Render dashboard) for:
   - `📥 Received backfill request`
   - `🛰️ Starting satellite backfill...`
   - `✅ Successfully saved X snapshots`

### 4.4 Test Satellite Monitoring

1. View an initiative's satellite data
2. You should see historical snapshots (if backfill worked)
3. Or client-side generated snapshots (fallback)

---

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Vercel Custom Domain

1. In Vercel project settings → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### 5.2 Render Custom Domain

1. In Render service settings → **Custom Domains**
2. Add your custom domain
3. Update `FRONTEND_URL` in Render env vars to use custom domain

---

## Step 6: Background Jobs (Satellite Monitoring)

The satellite monitoring job runs automatically via the Express server. However, for production, you may want to:

### Option A: Keep it Running in Render (Current Setup)

The job runs as part of the Express server. This works but:
- ✅ Simple setup
- ❌ Job stops if server restarts
- ❌ No separate scaling

### Option B: Use Render Cron Jobs (Recommended)

1. In Render dashboard → **Background Workers**
2. Create a new **Cron Job**
3. Schedule: `0 */6 * * *` (every 6 hours)
4. Command: `curl -X POST https://mtaji-backend.onrender.com/api/jobs/satellite-monitoring/run`

### Option C: External Cron Service

Use services like [cron-job.org](https://cron-job.org) to call:
```
POST https://mtaji-backend.onrender.com/api/jobs/satellite-monitoring/run
```

---

## Troubleshooting

### Backend Not Starting

**Check Render logs:**
- Look for errors in the deployment logs
- Common issues:
  - Missing environment variables
  - Port configuration (should use `PORT` env var, not hardcoded)
  - Database connection issues

### CORS Errors

**Symptoms**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix**:
1. Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
2. No trailing slashes (or both with trailing slashes)
3. Redeploy backend after changing `FRONTEND_URL`

### Satellite Backfill Not Working

**Check**:
1. Backend logs in Render for errors
2. Browser console for fetch errors
3. `VITE_BACKEND_URL` in Vercel matches Render URL
4. Sentinel Hub credentials are correct
5. Backend health endpoint is accessible

### Environment Variables Not Working

**Frontend (Vercel)**:
- Variables must start with `VITE_`
- Redeploy after adding/changing variables

**Backend (Render)**:
- Variables are available as `process.env.VARIABLE_NAME`
- Redeploy after adding/changing variables

---

## Monitoring and Maintenance

### Health Checks

- **Frontend**: Vercel automatically monitors uptime
- **Backend**: Set up uptime monitoring at [UptimeRobot](https://uptimerobot.com) or similar
  - Monitor: `https://mtaji-backend.onrender.com/health`
  - Interval: 5 minutes

### Logs

- **Vercel**: View logs in Vercel dashboard → **Deployments** → Click deployment → **Logs**
- **Render**: View logs in Render dashboard → **Logs** tab

### Updates

1. Push changes to GitHub
2. Vercel auto-deploys on push to `main`
3. Render auto-deploys on push to `main` (if enabled)
4. Or manually trigger redeploy in dashboards

---

## Cost Estimates

### Free Tier Limits

**Vercel (Free)**:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Custom domains

**Render (Free)**:
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds
- ✅ 750 hours/month free
- ✅ Automatic SSL

**Upgrade Options**:
- **Render Starter ($7/month)**: Always-on service, no spin-down
- **Vercel Pro ($20/month)**: More bandwidth, team features

---

## Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] No API keys committed to repository
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in backend (Render)
- [ ] `VITE_` variables only in frontend (Vercel)
- [ ] CORS properly configured for production
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Database RLS policies are properly configured

---

## Support

If you encounter issues:

1. Check deployment logs in Vercel/Render dashboards
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test backend health endpoint directly
5. Review this guide's troubleshooting section

---

## Next Steps

After successful deployment:

1. Set up monitoring/alerting
2. Configure custom domains
3. Set up automated backups (Supabase handles this)
4. Consider upgrading to paid tiers for better performance
5. Set up CI/CD workflows if needed
