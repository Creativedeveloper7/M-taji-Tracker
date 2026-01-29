-- ============================================
-- Add Opportunity Preferences to Initiatives
-- ============================================
-- Run this in Supabase SQL editor to add support for
-- initiative owners to control which opportunity types they accept

ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS opportunity_preferences JSONB DEFAULT '{"acceptProposals": true, "acceptContentCreators": true, "acceptAmbassadors": true}'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN initiatives.opportunity_preferences IS 'JSONB object with boolean flags: acceptProposals, acceptContentCreators, acceptAmbassadors. Defaults to all true.';
