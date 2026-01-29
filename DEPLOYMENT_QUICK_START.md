# Quick Deployment Checklist

Use this as a quick reference while deploying. See `DEPLOYMENT.md` for detailed instructions.

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] `.env` is in `.gitignore`
- [ ] All API keys are ready

## Backend (Render)

1. **Create Web Service**
   - Name: `mtaji-backend`
   - Build: `npm install`
   - Start: `npm run server:prod`

2. **Set Environment Variables**
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_URL=...
   SENTINEL_CLIENT_ID=...
   SENTINEL_CLIENT_SECRET=...
   USE_SENTINEL_HUB=true
   USE_MOCK_SATELLITE=false
   MAPBOX_ACCESS_TOKEN=...
   OPENAI_API_KEY=...
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=(set after frontend deploys)
   ```

3. **Deploy & Get URL**: `https://mtaji-backend.onrender.com`

4. **Test**: `https://mtaji-backend.onrender.com/health`

## Frontend (Vercel)

1. **Import Repository**
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`

2. **Set Environment Variables**
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_MAPBOX_ACCESS_TOKEN=...
   VITE_BACKEND_URL=https://mtaji-backend.onrender.com
   ```

3. **Deploy & Get URL**: `https://mtaji-tracker.vercel.app`

4. **Update Backend**: Set `FRONTEND_URL` in Render to your Vercel URL

5. **Redeploy Backend** (to apply CORS changes)

## Verify

- [ ] Frontend loads: `https://mtaji-tracker.vercel.app`
- [ ] Backend health: `https://mtaji-backend.onrender.com/health`
- [ ] Can create initiative
- [ ] Satellite backfill works (check logs)
- [ ] No CORS errors in browser console

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Update `FRONTEND_URL` in Render, redeploy |
| Backend 404 | Check Render service is running |
| Env vars not working | Ensure `VITE_` prefix for frontend vars |
| Satellite not working | Check Sentinel Hub credentials, backend logs |
