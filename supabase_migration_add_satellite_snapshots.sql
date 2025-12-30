-- Migration: Add satellite_snapshots column to initiatives table
-- Run this in your Supabase SQL editor if the column doesn't exist yet

-- Add satellite_snapshots column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'initiatives' 
    AND column_name = 'satellite_snapshots'
  ) THEN
    ALTER TABLE initiatives 
    ADD COLUMN satellite_snapshots JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN initiatives.satellite_snapshots IS 'Array of satellite snapshots with metadata. Structure: Array of {date, imageUrl, cloudCoverage, bounds, captured_at, ai_analysis}';
  END IF;
END $$;

-- Optional: Add GIN index for efficient querying of satellite snapshots
CREATE INDEX IF NOT EXISTS idx_initiatives_satellite_snapshots 
ON initiatives USING GIN (satellite_snapshots);

