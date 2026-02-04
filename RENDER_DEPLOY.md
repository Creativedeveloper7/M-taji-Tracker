# Render deploy – show app at root (no "Cannot GET /")

The server now serves the built React app at `/` when `dist/` exists. To get the app at **https://m-taji-tracker.onrender.com**:

## 1. Render dashboard

- Open your **m-taji-tracker** (or m-taji-tracker) Web Service.
- Go to **Settings** → **Build & Deploy**.

## 2. Build command (must create `dist/`)

Set **Build Command** to:

```bash
npm install && npm run build
```

If you only use `npm install`, the frontend is never built and `dist/` is missing, so you’ll see "Cannot GET /" or the fallback message.

## 3. Start command

Set **Start Command** to:

```bash
npm run server:prod
```

(or `npx tsx server/index.ts` with **Environment** → `NODE_ENV` = `production`).

## 4. Environment variables

In **Environment** add at least:

- `NODE_ENV` = `production`
- `PORT` – Render usually sets this; only set if needed.
- Any others your app needs (Supabase, Mapbox, etc.).

## 5. Redeploy

- Save the settings.
- **Manual Deploy** → **Deploy latest commit** (or push a new commit so Render auto-deploys).

After the build finishes, the build step will have run `npm run build` and created `dist/`. When the server starts, it will serve the app at `/` and you should see the app at **https://m-taji-tracker.onrender.com**.

## If it still says "Cannot GET /"

1. Confirm **Build Command** is exactly: `npm install && npm run build`.
2. In the last deploy’s **Build logs**, check that `vite build` ran and that the build completed without errors.
3. Confirm the **Start Command** is the one above and that the service started without errors.
