-- ============================================
-- VOLUNTEER APPLICATIONS TABLE
-- ============================================
-- This table stores volunteer applications from guests
-- who want to volunteer on specific initiatives
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VOLUNTEER APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  
  -- Volunteer Information (Guest users - no auth required)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  
  -- Skills and Experience
  skills TEXT[], -- Array of skills (e.g., ['construction', 'education', 'healthcare'])
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  previous_volunteer_experience TEXT, -- Free text description
  
  -- Availability
  availability_days TEXT[], -- Array of days (e.g., ['monday', 'wednesday', 'friday'])
  availability_hours_per_week INTEGER, -- Estimated hours per week
  start_date DATE, -- When they can start
  commitment_duration TEXT, -- e.g., '3 months', '6 months', '1 year', 'ongoing'
  
  -- Motivation and Interest
  motivation TEXT, -- Why they want to volunteer
  interests TEXT[], -- Areas of interest related to the initiative
  
  -- Additional Information
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  special_requirements TEXT, -- Any special needs or requirements
  additional_notes TEXT, -- Any additional information
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'active', 'completed')),
  
  -- Review Information
  reviewed_by UUID REFERENCES auth.users(id), -- Admin/organizer who reviewed
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Assignment Information (if approved)
  assigned_tasks TEXT[], -- Array of task descriptions
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Performance Tracking (if active)
  hours_contributed DECIMAL(10, 2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_initiative_id ON volunteer_applications(initiative_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_created_at ON volunteer_applications(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including guests) can create volunteer applications
CREATE POLICY "Anyone can create volunteer applications"
  ON volunteer_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Anyone can view volunteer applications (for transparency)
-- But we'll restrict sensitive information in the application layer
CREATE POLICY "Anyone can view volunteer applications"
  ON volunteer_applications
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users (initiative owners/admins) can update volunteer applications
CREATE POLICY "Initiative owners can update volunteer applications"
  ON volunteer_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      JOIN changemakers c ON i.changemaker_id = c.id
      WHERE i.id = volunteer_applications.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users (initiative owners/admins) can delete volunteer applications
CREATE POLICY "Initiative owners can delete volunteer applications"
  ON volunteer_applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      JOIN changemakers c ON i.changemaker_id = c.id
      WHERE i.id = volunteer_applications.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_volunteer_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_volunteer_applications_updated_at ON volunteer_applications;
CREATE TRIGGER trigger_update_volunteer_applications_updated_at
  BEFORE UPDATE ON volunteer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_applications_updated_at();

-- ============================================
-- FUNCTION: Get volunteer count for an initiative
-- ============================================
CREATE OR REPLACE FUNCTION get_initiative_volunteer_count(initiative_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM volunteer_applications
    WHERE initiative_id = initiative_uuid
    AND status IN ('approved', 'active', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS for Documentation
-- ============================================
COMMENT ON TABLE volunteer_applications IS 'Stores volunteer applications from guests who want to volunteer on specific initiatives';
COMMENT ON COLUMN volunteer_applications.status IS 'Application status: pending, approved, rejected, withdrawn, active, completed';
COMMENT ON COLUMN volunteer_applications.skills IS 'Array of volunteer skills (e.g., construction, education, healthcare)';
COMMENT ON COLUMN volunteer_applications.availability_days IS 'Array of days volunteer is available (e.g., monday, wednesday, friday)';
