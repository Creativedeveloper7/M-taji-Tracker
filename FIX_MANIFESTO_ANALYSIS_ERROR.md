# Fix: "Failed to fetch" Error for Manifesto Analysis

## Problem
You're getting a "Failed to fetch" error when trying to analyze a manifesto. This happens because the backend server is not running.

## Solution

### Step 1: Start the Backend Server

Open a **new terminal window** (keep your frontend dev server running) and run:

```bash
npm run server:dev
```

You should see:
```
🚀 Server running on port 3001
📡 Health check: http://localhost:3001/health
```

### Step 2: Verify Server is Running

The server should be accessible at `http://localhost:3001`. You can test it by visiting:
- Health check: http://localhost:3001/health

### Step 3: Check Environment Variables

Make sure your `.env` file has the OpenAI API key:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 4: Try Again

Once the server is running, go back to the registration form and try analyzing the manifesto again.

## Troubleshooting

### Error: "Cannot connect to server"
- Make sure the server is running on port 3001
- Check that no other application is using port 3001
- Verify the server started without errors

### Error: "OPENAI_API_KEY is required"
- Add your OpenAI API key to the `.env` file
- Restart the server after adding the key
- Get your API key from: https://platform.openai.com/api-keys

### Error: "Server error: 500"
- Check the server terminal for error messages
- Verify OpenAI API key is valid
- Check that all dependencies are installed: `npm install`

## Running Both Servers

You need **two terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server:dev
```

Both should be running simultaneously for the app to work properly.

