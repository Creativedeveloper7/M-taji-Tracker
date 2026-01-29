-- ============================================
-- Initiative Opportunities (Jobs, Ambassador, Proposals, Content)
-- ============================================
-- Run this in the Supabase SQL editor on your Mtaji Tracker project.
-- This creates simple tables for:
-- - initiative_jobs (per-initiative roles)
-- - initiative_job_applications
-- - initiative_ambassador_applications
-- - initiative_proposals
-- - initiative_content_creator_applications
--
-- All tables are open for INSERT from anon/authenticated so guests can apply
-- directly from the public frontend.

CREATE TABLE IF NOT EXISTS initiative_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_type TEXT, -- e.g. Full-time, Part-time, Contract
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initiative_job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  job_id UUID REFERENCES initiative_jobs(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  motivation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initiative_ambassador_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  reach TEXT NOT NULL,
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initiative_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- person or organisation
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  links TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initiative_content_creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  content_type TEXT NOT NULL,  -- photo, video, writing, social, etc.
  portfolio TEXT NOT NULL,     -- links to work
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE initiative_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_content_creator_applications ENABLE ROW LEVEL SECURITY;

-- Public can read active jobs
DROP POLICY IF EXISTS "Public can view initiative jobs" ON initiative_jobs;
CREATE POLICY "Public can view initiative jobs"
  ON initiative_jobs FOR SELECT
  USING (is_active = TRUE);

-- Initiative owners can create jobs for their initiatives
DROP POLICY IF EXISTS "Initiative owners can create jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can create jobs"
  ON initiative_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Initiative owners can update their own jobs
DROP POLICY IF EXISTS "Initiative owners can update jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can update jobs"
  ON initiative_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Initiative owners can delete their own jobs
DROP POLICY IF EXISTS "Initiative owners can delete jobs" ON initiative_jobs;
CREATE POLICY "Initiative owners can delete jobs"
  ON initiative_jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_jobs.initiative_id
      AND c.user_id = auth.uid()
    )
  );

-- Anyone (anon/authenticated) can create applications & proposals
-- Using 'public' role is more reliable than 'anon, authenticated' in PostgreSQL
DROP POLICY IF EXISTS "Anyone can create job applications" ON initiative_job_applications;
CREATE POLICY "Anyone can create job applications"
  ON initiative_job_applications FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create ambassador applications" ON initiative_ambassador_applications;
CREATE POLICY "Anyone can create ambassador applications"
  ON initiative_ambassador_applications FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create proposals" ON initiative_proposals;
CREATE POLICY "Anyone can create proposals"
  ON initiative_proposals FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create content creator applications" ON initiative_content_creator_applications;
CREATE POLICY "Anyone can create content creator applications"
  ON initiative_content_creator_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow dashboard (authenticated) users to view applications for their initiatives
DROP POLICY IF EXISTS "Initiative owners can view job applications" ON initiative_job_applications;
CREATE POLICY "Initiative owners can view job applications"
  ON initiative_job_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_job_applications.initiative_id
      AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Initiative owners can view ambassador applications" ON initiative_ambassador_applications;
CREATE POLICY "Initiative owners can view ambassador applications"
  ON initiative_ambassador_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_ambassador_applications.initiative_id
      AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Initiative owners can view proposals" ON initiative_proposals;
CREATE POLICY "Initiative owners can view proposals"
  ON initiative_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_proposals.initiative_id
      AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Initiative owners can view content creator applications" ON initiative_content_creator_applications;
CREATE POLICY "Initiative owners can view content creator applications"
  ON initiative_content_creator_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM initiatives i
      JOIN changemakers c ON c.id = i.changemaker_id
      WHERE i.id = initiative_content_creator_applications.initiative_id
      AND c.user_id = auth.uid()
    )
  );

