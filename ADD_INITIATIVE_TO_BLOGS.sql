-- Migration: Add initiative linking to blogs table
-- Run this if you already have a blogs table and want to add the initiative linking feature

-- Add initiative_id column (references initiatives table)
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL;

-- Add initiative_name column (stores name for display without joins)
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS initiative_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blogs_initiative_id ON public.blogs(initiative_id);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blogs' 
AND column_name IN ('initiative_id', 'initiative_name');

-- Success message
SELECT 'Initiative linking columns added to blogs table successfully' AS status;
