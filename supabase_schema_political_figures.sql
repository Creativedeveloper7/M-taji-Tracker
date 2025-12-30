-- ============================================
-- POLITICAL FIGURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS political_figures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('governor', 'mp', 'senator', 'mca')),
  
  -- Geographic Jurisdiction
  county TEXT,
  constituency TEXT,
  ward TEXT,
  
  -- Term Information
  term_start DATE NOT NULL,
  term_end DATE NOT NULL,
  term_years INTEGER NOT NULL DEFAULT 5,
  
  -- Manifesto (stored as JSONB)
  manifesto JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "document_url": "string (optional)",
  --   "text": "string",
  --   "uploaded_at": "string (ISO timestamp)",
  --   "parsed_at": "string (ISO timestamp, optional)",
  --   "focus_areas": [
  --     {
  --       "category": "agriculture | water | health | education | infrastructure | economic",
  --       "priority": number (1-5),
  --       "commitments": ["string"],
  --       "keywords": ["string"]
  --     }
  --   ],
  --   "targets": [
  --     {
  --       "description": "string",
  --       "quantity": number (optional),
  --       "category": "string",
  --       "location": "string (optional)"
  --     }
  --   ]
  -- }
  
  -- Commissioned Projects Tracking
  commissioned_projects UUID[] DEFAULT ARRAY[]::UUID[], -- Array of initiative IDs
  total_investment DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Activity by Category
  projects_by_category JSONB DEFAULT '{
    "agriculture": 0,
    "water": 0,
    "health": 0,
    "education": 0,
    "infrastructure": 0,
    "economic": 0
  }'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seeking_reelection')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_political_figures_user_id ON political_figures(user_id);
CREATE INDEX IF NOT EXISTS idx_political_figures_position ON political_figures(position);
CREATE INDEX IF NOT EXISTS idx_political_figures_county ON political_figures(county);
CREATE INDEX IF NOT EXISTS idx_political_figures_constituency ON political_figures(constituency);
CREATE INDEX IF NOT EXISTS idx_political_figures_status ON political_figures(status);
CREATE INDEX IF NOT EXISTS idx_political_figures_commissioned_projects ON political_figures USING GIN (commissioned_projects);
CREATE INDEX IF NOT EXISTS idx_political_figures_manifesto ON political_figures USING GIN (manifesto);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE political_figures ENABLE ROW LEVEL SECURITY;

-- Public can view all active political figures
CREATE POLICY "Public can view active political figures"
  ON political_figures FOR SELECT
  USING (status = 'active');

-- Users can view their own political figure profile
CREATE POLICY "Users can view their own political figure profile"
  ON political_figures FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own political figure profile
CREATE POLICY "Users can create their own political figure profile"
  ON political_figures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own political figure profile
CREATE POLICY "Users can update their own political figure profile"
  ON political_figures FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own political figure profile
CREATE POLICY "Users can delete their own political figure profile"
  ON political_figures FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_political_figure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_political_figures_updated_at
  BEFORE UPDATE ON political_figures
  FOR EACH ROW
  EXECUTE FUNCTION update_political_figure_updated_at();

-- Function to update projects_by_category when initiative is commissioned
-- This would be called when a political figure commissions an initiative
CREATE OR REPLACE FUNCTION update_political_figure_projects()
RETURNS TRIGGER AS $$
DECLARE
  figure_id UUID;
  initiative_category TEXT;
BEGIN
  -- This is a placeholder - actual implementation would depend on how
  -- initiatives are linked to political figures
  -- For now, this is a template for future implementation
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE political_figures IS 'Stores profiles of political figures (Governors, MPs, Senators, MCAs)';
COMMENT ON COLUMN political_figures.manifesto IS 'JSONB containing manifesto text, AI analysis, focus areas, and targets';
COMMENT ON COLUMN political_figures.commissioned_projects IS 'Array of initiative IDs that this political figure has commissioned or supported';
COMMENT ON COLUMN political_figures.projects_by_category IS 'Count of commissioned projects by category';

