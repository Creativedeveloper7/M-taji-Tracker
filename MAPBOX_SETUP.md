# How to Get Your Mapbox Access Token

## Step-by-Step Guide

### 1. Create a Mapbox Account
- Go to: **https://account.mapbox.com/**
- Sign up for a free account (or sign in if you already have one)

### 2. Navigate to Access Tokens
- Once logged in, go to: **https://account.mapbox.com/access-tokens/**
- Or click on your account menu → **Tokens** → **Access tokens**

### 3. Get Your Default Token
- You'll see your **Default public token** (starts with `pk.`)
- Click **Copy** to copy the token
- Or create a new token with specific scopes if needed

### 4. Add to Your .env File
Add the token to your `.env` file in the project root:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

### 5. Restart Your Dev Server
After adding the token, restart your development server:
```bash
npm run dev
```

## Direct Links

- **Account Dashboard**: https://account.mapbox.com/
- **Access Tokens Page**: https://account.mapbox.com/access-tokens/
- **Documentation**: https://docs.mapbox.com/

## Token Types

- **Public Token** (`pk.`): For client-side use (what you need)
- **Secret Token** (`sk.`): For server-side use (keep private)

## Free Tier Limits

- 50,000 map loads per month (free)
- Perfect for development and testing
- Upgrade if you need more

## Security Note

- Never commit your token to git
- The `.env` file is already in `.gitignore`
- Use `VITE_` prefix so Vite exposes it to client code

