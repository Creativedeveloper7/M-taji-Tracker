-- Quick fix: Add satellite_snapshots column to initiatives table
-- Run this in your Supabase SQL Editor

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
    
    RAISE NOTICE 'Column satellite_snapshots added successfully';
  ELSE
    RAISE NOTICE 'Column satellite_snapshots already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'initiatives' 
AND column_name = 'satellite_snapshots';

