# M-taji Tracker - Project Overview

## What is M-taji Tracker?

**M-taji Tracker** is a satellite-powered platform for tracking and monitoring development projects and political promises in Kenya. It uses real-time satellite imagery, AI analysis, and interactive mapping to provide transparency and accountability for development initiatives.

## Core Features

### 1. **Initiative/Project Tracking**
- Create and manage development projects (initiatives)
- Track projects across categories: agriculture, water, health, education, infrastructure, economic
- Support for multiple organization types: NGOs, CBOs, Government entities
- Financial tracking (target amount, raised amount)
- Milestone management with status tracking
- Project statuses: draft, published, active, completed, stalled

### 2. **Satellite Monitoring** 🛰️
- **Automatic Snapshot Capture**: When an initiative is published, the system automatically captures a baseline satellite image
- **Monthly Monitoring**: Background job runs on the 1st of every month to capture new snapshots
- **AI-Powered Analysis**: Detects project progress, identifies stalled projects, and tracks changes over time
- **Historical Timeline**: View satellite imagery snapshots over time to see project evolution
- **Cloud Coverage Tracking**: Monitors image quality and cloud interference

### 3. **Interactive Map View**
- Leaflet-based map showing all published initiatives
- Color-coded markers by project status
- Click markers to view initiative details
- Filter by category, status, or location
- Geofencing support for project boundaries

### 4. **Political Figures & Manifestos**
- Register political figures with their roles and constituencies
- Upload and analyze political manifestos using AI (OpenAI)
- Track promises and commitments
- Link political figures to initiatives

### 5. **User Management & Authentication**
- Multi-user support with Supabase Auth
- User types: organizations, government entities, political figures
- Verification system (verified, under_review, rejected)
- Profile management

### 6. **Volunteer Management**
- Volunteer application system
- Track volunteer engagement with initiatives
- Volunteer drawer component for viewing applications

### 7. **Dashboard Features**
- **Project Overview**: View all user's initiatives
- **Satellite Tracker**: Monitor satellite snapshots and progress
- **AI Analysis**: View AI-powered insights on project status
- **Volunteer Management**: Manage volunteer applications
- **Rendering Tool**: Project visualization tools
- **Notifications**: System notifications

## Technical Architecture

### Frontend Stack
- **Framework**: Astro with React integration
- **UI Library**: React 18 with React Router
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React-Leaflet
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **State Management**: React Context (AuthContext, ThemeContext)

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Server**: Express.js (Node.js)
- **Background Jobs**: node-cron for scheduled tasks
- **AI Services**: OpenAI API for manifesto analysis

### External Services
- **Mapbox**: Satellite imagery and mapping (via Static Images API)
- **Supabase**: Database, authentication, storage
- **OpenAI**: Manifesto analysis and AI insights

## Project Structure

```
M-taji-Tracker/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── MapView.tsx      # Main map component
│   │   ├── InitiativeForm/  # Multi-step form for creating initiatives
│   │   ├── InitiativeModal.tsx
│   │   ├── SatelliteMonitor.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Main map view
│   │   ├── LandingPage.tsx  # Marketing landing page
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── dashboard/       # Dashboard sub-pages
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── initiatives.ts  # Initiative CRUD operations
│   │   ├── satelliteService.ts  # Satellite image capture
│   │   ├── manifestoAnalysisService.ts
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/                 # Utilities
│   │   └── supabase.ts      # Supabase client
│   └── types/               # TypeScript types
│
├── server/                  # Backend server
│   ├── index.ts            # Express server entry point
│   ├── jobs/               # Background jobs
│   │   └── satelliteMonitoring.ts  # Monthly satellite monitoring
│   ├── routes/             # API routes
│   │   ├── satellite.ts
│   │   └── political.ts
│   ├── services/           # Server-side services
│   └── lib/                # Server utilities
│       └── database.ts     # Database operations
│
└── [SQL files]             # Database migrations and setup scripts
```

## Database Schema

### Main Tables
- **initiatives**: Core project/initiative data
  - Location stored as JSONB (county, constituency, coordinates, geofence)
  - Satellite snapshots stored as JSONB array
  - Payment details as JSONB
  - Status tracking (draft → published → active → completed/stalled)

- **milestones**: Project milestones linked to initiatives
- **changemakers**: User/organization profiles
- **political_figures**: Political figure profiles
- **volunteer_applications**: Volunteer applications
- **profiles**: Extended user profiles with verification status

## Key Workflows

### 1. Creating an Initiative
1. User fills out multi-step form (7 steps):
   - Basic info (title, description, category)
   - Financial details (target amount, payment method)
   - Location (county, constituency, coordinates)
   - Milestones
   - Images
   - Payment details
   - Review
2. On publish, system automatically captures baseline satellite snapshot
3. Initiative appears on map view

### 2. Satellite Monitoring
1. Background job runs monthly (1st of month at 2 AM)
2. Fetches all active initiatives
3. Captures new satellite snapshot for each
4. Compares with previous snapshot
5. AI analysis determines: baseline, progress, stalled, or completed
6. Updates initiative with new snapshot
7. Sends notifications if project is stalled >60 days

### 3. Viewing Projects
1. User navigates to map view (`/map` or `/`)
2. System fetches all published/active initiatives from Supabase
3. Displays markers on map with status-based colors
4. Click marker to view initiative details modal
5. Can filter by category, status, or search

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox API token
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for server)
- `OPENAI_API_KEY`: OpenAI API key (optional, for manifesto analysis)
- `USE_MOCK_SATELLITE`: Set to `true` to use mock satellite service

## Running the Project

### Development
```bash
# Frontend (Astro/Vite)
npm run dev

# Backend server (separate terminal)
npm run server:dev

# Run satellite monitoring job manually
npm run job:satellite
```

### Production Build
```bash
npm run build
npm run preview
```

## Current Status & Known Features

✅ **Implemented:**
- Initiative creation and management
- Map view with markers
- Satellite snapshot capture (using Mapbox)
- Background job for monthly monitoring
- User authentication
- Dashboard with multiple sections
- Political figure registration
- Volunteer application system

⚠️ **Using Mock Services:**
- Satellite service currently uses Mapbox Static Images (not true historical imagery)
- For production, integrate with Google Earth Engine, Sentinel Hub, or Planet Labs

🔧 **Areas for Enhancement:**
- True historical satellite imagery integration
- Advanced AI image comparison algorithms
- Email/SMS notifications
- Real-time collaboration features
- Advanced analytics and reporting
- Mobile app

## Next Steps for Development

1. **Improve Satellite Integration**: Replace Mapbox with true satellite data provider
2. **Enhanced AI Analysis**: Implement actual image comparison algorithms
3. **Notification System**: Add email/SMS notifications for stalled projects
4. **Performance Optimization**: Optimize map rendering for large datasets
5. **Mobile Responsiveness**: Ensure all components work on mobile devices
6. **Testing**: Add unit and integration tests
7. **Documentation**: Complete API documentation

---

This project is designed to bring transparency to development projects in Kenya by leveraging satellite technology and AI to track progress and hold stakeholders accountable.
