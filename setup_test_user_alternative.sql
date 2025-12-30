-- Alternative: Make user_id nullable for testing
-- This allows creating political figures without authentication
-- ⚠️ ONLY FOR TESTING - Re-enable NOT NULL for production

-- Step 1: Make user_id nullable
ALTER TABLE political_figures 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Update RLS policies to allow inserts without user_id (for testing)
DROP POLICY IF EXISTS "Users can create their own political figure profile" ON political_figures;

-- Create a more permissive policy for testing
CREATE POLICY "Allow creating political figures (testing)"
  ON political_figures FOR INSERT
  WITH CHECK (true); -- Allow all inserts for testing

-- Step 3: Verify
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'political_figures' 
AND column_name = 'user_id';

-- Note: After testing, re-enable NOT NULL:
-- ALTER TABLE political_figures ALTER COLUMN user_id SET NOT NULL;

