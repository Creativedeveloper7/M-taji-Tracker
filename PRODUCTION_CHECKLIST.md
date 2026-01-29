# Production Readiness Checklist

Use this checklist before deploying to ensure everything is production-ready.

## Code Quality

- [x] All environment variables are in `.gitignore`
- [x] No hardcoded API keys or secrets in code
- [x] `.env.example` files created for reference
- [x] CORS configured for production URLs
- [x] Error handling in place for API calls
- [x] Logging configured (console.log for now, can upgrade to proper logger)

## Configuration Files

- [x] `vercel.json` created for Vercel deployment
- [x] `package.json` has production scripts (`server:prod`)
- [x] CORS allows production frontend URL
- [x] Environment variable templates created (`.env.example`)

## Backend (Render/Railway)

- [ ] Backend service created and deployed
- [ ] All environment variables set:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SENTINEL_CLIENT_ID`
  - [ ] `SENTINEL_CLIENT_SECRET`
  - [ ] `USE_SENTINEL_HUB=true`
  - [ ] `USE_MOCK_SATELLITE=false`
  - [ ] `MAPBOX_ACCESS_TOKEN`
  - [ ] `OPENAI_API_KEY` (optional)
  - [ ] `FRONTEND_URL` (set after frontend deploys)
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
- [ ] Health endpoint tested: `/health`
- [ ] Backend URL saved for frontend configuration

## Frontend (Vercel)

- [ ] Vercel project created and connected to GitHub
- [ ] All environment variables set:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_MAPBOX_ACCESS_TOKEN`
  - [ ] `VITE_BACKEND_URL` (from backend deployment)
- [ ] Build successful
- [ ] Frontend URL saved for backend CORS update

## Integration

- [ ] Backend `FRONTEND_URL` updated to Vercel URL
- [ ] Backend redeployed after CORS update
- [ ] Frontend can communicate with backend (no CORS errors)
- [ ] Satellite backfill works (check logs)
- [ ] Map rendering works
- [ ] Initiative creation works
- [ ] User authentication works

## Testing

- [ ] Can create new initiative
- [ ] Satellite snapshots are generated (check backend logs)
- [ ] Historical satellite data displays correctly
- [ ] Map picker works
- [ ] All forms submit successfully
- [ ] Dashboard loads correctly
- [ ] No console errors in browser

## Security

- [ ] `.env` files not committed to Git
- [ ] Service role keys only in backend (not frontend)
- [ ] CORS properly restricted in production
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Database RLS policies configured

## Monitoring

- [ ] Health check endpoint working
- [ ] Know where to check logs (Vercel/Render dashboards)
- [ ] Have plan for monitoring uptime (optional: UptimeRobot)

## Documentation

- [ ] `DEPLOYMENT.md` reviewed
- [ ] `DEPLOYMENT_QUICK_START.md` reviewed
- [ ] Team members know where deployment docs are
- [ ] Environment variables documented

## Post-Deployment

- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active (automatic on Vercel/Render)
- [ ] Background jobs running (satellite monitoring)
- [ ] Performance acceptable
- [ ] Error tracking set up (optional: Sentry)

---

## Quick Test Commands

After deployment, test these endpoints:

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Should return: {"status":"ok",...}

# Frontend (just open in browser)
https://your-app.vercel.app
```

---

## Rollback Plan

If something goes wrong:

1. **Frontend**: In Vercel dashboard → Deployments → Click previous deployment → "Promote to Production"
2. **Backend**: In Render dashboard → Manual Deploy → Select previous commit
3. **Database**: Supabase has automatic backups (check Supabase dashboard)

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Deployment Guide**: See `DEPLOYMENT.md`
