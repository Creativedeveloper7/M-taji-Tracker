-- Create blogs table for M-taji blog functionality
-- Run this in your Supabase SQL Editor

-- Create the blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'Impact Stories',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    read_time TEXT DEFAULT '5 min read',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    view_count INTEGER DEFAULT 0,
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL,
    initiative_name TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_initiative_id ON public.blogs(initiative_id);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Anyone can read published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can read own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can update own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can delete own blogs" ON public.blogs;

-- Policy: Anyone can read published blogs
CREATE POLICY "Anyone can read published blogs"
ON public.blogs
FOR SELECT
USING (status = 'published');

-- Policy: Authors can read their own blogs (including drafts)
CREATE POLICY "Authors can read own blogs"
ON public.blogs
FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Policy: Authors can insert their own blogs
CREATE POLICY "Authors can create blogs"
ON public.blogs
FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Policy: Authors can update their own blogs
CREATE POLICY "Authors can update own blogs"
ON public.blogs
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Policy: Authors can delete their own blogs
CREATE POLICY "Authors can delete own blogs"
ON public.blogs
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS trigger_blogs_updated_at ON public.blogs;
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blogs_updated_at();

-- Function to calculate read time based on content length
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS TEXT AS $$
DECLARE
    word_count INTEGER;
    minutes INTEGER;
BEGIN
    -- Estimate words by counting spaces (rough approximation)
    word_count := array_length(string_to_array(content, ' '), 1);
    -- Average reading speed is ~200 words per minute
    minutes := GREATEST(1, CEIL(word_count::FLOAT / 200));
    RETURN minutes || ' min read';
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate read time on insert/update
CREATE OR REPLACE FUNCTION update_read_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_time = calculate_read_time(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blogs_read_time ON public.blogs;
CREATE TRIGGER trigger_blogs_read_time
    BEFORE INSERT OR UPDATE OF content ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_read_time();

-- Grant permissions
GRANT ALL ON public.blogs TO authenticated;
GRANT SELECT ON public.blogs TO anon;

-- Add comment to table
COMMENT ON TABLE public.blogs IS 'Blog posts created by M-taji users';

-- Verification query
SELECT 
    'blogs table created successfully' AS status,
    COUNT(*) AS policy_count
FROM pg_policies 
WHERE tablename = 'blogs';
