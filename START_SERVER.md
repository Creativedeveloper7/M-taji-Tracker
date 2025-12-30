# How to Start the Backend Server

## Quick Start

Open a **new terminal window** and run:

```bash
npm run server:dev
```

You should see:
```
🚀 Server running on port 3001
📡 Health check: http://localhost:3001/health
```

## Verify It's Running

1. Check the terminal - you should see the success message above
2. Visit http://localhost:3001/health in your browser
3. You should see: `{"status":"ok","timestamp":"...","service":"mtaji-tracker-backend"}`

## Troubleshooting

### Port Already in Use
If you see "Port 3001 is already in use":
```bash
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Missing Dependencies
If you see module errors:
```bash
npm install
```

### Missing OpenAI API Key
Add to your `.env` file:
```env
OPENAI_API_KEY=sk-your-key-here
```

## Keep Both Servers Running

You need **TWO terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server:dev
```

Both must be running for the manifesto analysis to work!

