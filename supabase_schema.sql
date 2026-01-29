-- ============================================
-- Mtaji Tracker Database Schema
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. CHANGEMAKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS changemakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  organization TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INITIATIVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  changemaker_id UUID NOT NULL REFERENCES changemakers(id) ON DELETE CASCADE,
  
  -- Basic Information
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('agriculture', 'water', 'health', 'education', 'infrastructure', 'economic')),
  
  -- Financial Information
  target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  raised_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Location Information (stored as JSONB)
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "county": "string",
  --   "constituency": "string",
  --   "specific_area": "string",
  --   "coordinates": {"lat": number, "lng": number},
  --   "geofence": [{"lat": number, "lng": number}]
  -- }
  
  -- Project Timeline
  project_duration TEXT,
  expected_completion DATE,
  
  -- Media
  reference_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Payment Details (stored as JSONB)
  payment_details JSONB DEFAULT '{"method": "mpesa"}'::jsonb,
  -- Structure: {
  --   "method": "mpesa" | "bank",
  --   "mpesa_number": "string",
  --   "bank_account": "string",
  --   "bank_name": "string",
  --   "bank_branch": "string"
  -- }
  
  -- Satellite Snapshots (stored as JSONB array)
  satellite_snapshots JSONB DEFAULT '[]'::jsonb,
  -- Structure: Array of {
  --   "date": "string (ISO date)",
  --   "imageUrl": "string",
  --   "cloudCoverage": number,
  --   "bounds": {
  --     "north": number,
  --     "south": number,
  --     "east": number,
  --     "west": number
  --   },
  --   "captured_at": "string (ISO timestamp)",
  --   "ai_analysis": {
  --     "status": "baseline" | "progress" | "stalled" | "completed",
  --     "changePercentage": number (optional),
  --     "notes": "string"
  --   } (optional)
  -- }
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'stalled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  description TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SUPPORTERS/DONATIONS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('mpesa', 'bank', 'card')),
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Changemakers indexes
CREATE INDEX IF NOT EXISTS idx_changemakers_user_id ON changemakers(user_id);

-- Initiatives indexes
CREATE INDEX IF NOT EXISTS idx_initiatives_changemaker_id ON initiatives(changemaker_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_category ON initiatives(category);
CREATE INDEX IF NOT EXISTS idx_initiatives_created_at ON initiatives(created_at DESC);
-- GIN index on entire location JSONB for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_initiatives_location ON initiatives USING GIN (location);
-- B-tree index on county for exact matches
CREATE INDEX IF NOT EXISTS idx_initiatives_location_county ON initiatives ((location->>'county'));

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_milestones_initiative_id ON milestones(initiative_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_initiative_id ON donations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- ============================================
-- FUNCTIONS and TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_changemakers_updated_at ON changemakers;
CREATE TRIGGER update_changemakers_updated_at
  BEFORE UPDATE ON changemakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_initiatives_updated_at ON initiatives;
CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON initiatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update raised_amount when donation is completed
CREATE OR REPLACE FUNCTION update_initiative_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE initiatives
    SET raised_amount = raised_amount + NEW.amount
    WHERE id = NEW.initiative_id;
  ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE initiatives
    SET raised_amount = GREATEST(0, raised_amount - OLD.amount)
    WHERE id = NEW.initiative_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_raised_amount_on_donation ON donations;
CREATE TRIGGER update_raised_amount_on_donation
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_initiative_raised_amount();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE changemakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policies for changemakers (public read, authenticated write)
DROP POLICY IF EXISTS "Changemakers are viewable by everyone" ON changemakers;
CREATE POLICY "Changemakers are viewable by everyone"
  ON changemakers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own changemaker profile" ON changemakers;
CREATE POLICY "Users can insert their own changemaker profile"
  ON changemakers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own changemaker profile" ON changemakers;
CREATE POLICY "Users can update their own changemaker profile"
  ON changemakers FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for initiatives (public read published/active, authenticated write)
DROP POLICY IF EXISTS "Published initiatives are viewable by everyone" ON initiatives;
CREATE POLICY "Published initiatives are viewable by everyone"
  ON initiatives FOR SELECT
  USING (status IN ('published', 'active', 'completed'));

DROP POLICY IF EXISTS "Users can view their own initiatives" ON initiatives;
CREATE POLICY "Users can view their own initiatives"
  ON initiatives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create initiatives" ON initiatives;
CREATE POLICY "Users can create initiatives"
  ON initiatives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own initiatives" ON initiatives;
CREATE POLICY "Users can update their own initiatives"
  ON initiatives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own initiatives" ON initiatives;
CREATE POLICY "Users can delete their own initiatives"
  ON initiatives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM changemakers
      WHERE changemakers.id = initiatives.changemaker_id
      AND changemakers.user_id = auth.uid()
    )
  );

-- Policies for milestones (public read for published initiatives)
DROP POLICY IF EXISTS "Milestones are viewable for published initiatives" ON milestones;
CREATE POLICY "Milestones are viewable for published initiatives"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      WHERE initiatives.id = milestones.initiative_id
      AND initiatives.status IN ('published', 'active', 'completed')
    )
  );

DROP POLICY IF EXISTS "Users can manage milestones for their initiatives" ON milestones;
CREATE POLICY "Users can manage milestones for their initiatives"
  ON milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM initiatives
      JOIN changemakers ON changemakers.id = initiatives.changemaker_id
      WHERE initiatives.id = milestones.initiative_id
      AND changemakers.user_id = auth.uid()
    )
  );

-- Policies for donations (users can only see their own donations)
-- Note: This assumes you'll store user_id in donations or match by email/phone
-- For now, allowing public read of donations for transparency
DROP POLICY IF EXISTS "Donations are viewable by everyone" ON donations;
CREATE POLICY "Donations are viewable by everyone"
  ON donations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create donations" ON donations;
CREATE POLICY "Anyone can create donations"
  ON donations FOR INSERT
  WITH CHECK (true);

-- If you want to restrict updates, add a user_id column to donations table
-- For now, allowing updates (you may want to restrict this)
DROP POLICY IF EXISTS "Users can update donations" ON donations;
CREATE POLICY "Users can update donations"
  ON donations FOR UPDATE
  USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a sample changemaker
INSERT INTO changemakers (id, name, email, organization, bio)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Admin',
  'admin@mtaji.com',
  'Mtaji Tracker',
  'System administrator account'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================

-- View for initiatives with changemaker info
DROP VIEW IF EXISTS initiatives_with_changemaker;
CREATE VIEW initiatives_with_changemaker AS
SELECT 
  i.*,
  c.name as changemaker_name,
  c.organization as changemaker_organization,
  c.profile_image_url as changemaker_image,
  (SELECT COUNT(*) FROM milestones m WHERE m.initiative_id = i.id) as milestone_count,
  (SELECT COUNT(*) FROM donations d WHERE d.initiative_id = i.id AND d.status = 'completed') as supporter_count
FROM initiatives i
LEFT JOIN changemakers c ON i.changemaker_id = c.id;

-- View for initiative statistics
DROP VIEW IF EXISTS initiative_stats;
CREATE VIEW initiative_stats AS
SELECT 
  i.id,
  i.title,
  i.status,
  i.target_amount,
  i.raised_amount,
  (i.raised_amount / NULLIF(i.target_amount, 0) * 100) as funding_percentage,
  (SELECT COUNT(*) FROM donations d WHERE d.initiative_id = i.id AND d.status = 'completed') as supporter_count,
  (SELECT COUNT(*) FROM milestones m WHERE m.initiative_id = i.id AND m.status = 'completed') as completed_milestones,
  (SELECT COUNT(*) FROM milestones m WHERE m.initiative_id = i.id) as total_milestones
FROM initiatives i;

-- ============================================
-- END OF SCHEMA
-- ============================================

